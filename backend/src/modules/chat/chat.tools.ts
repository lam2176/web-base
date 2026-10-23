import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import type { FunctionDeclaration } from '@google/genai';
import { ProductService } from '../product/product.service';
import { CategoryService } from '../category/category.service';
import { StoreService } from '../store/store.service';

export interface ChatProductCard {
  slug: string;
  name: string;
  price: number;
  compareAtPrice: number | null;
  image: string | null;
  inStock: boolean;
}

export interface ToolExecution {
  result: Record<string, unknown>;
  // Products returned by the tool; only these may be shown as cards
  products: ChatProductCard[];
}

export const CHAT_TOOL_DECLARATIONS: FunctionDeclaration[] = [
  {
    name: 'search_products',
    description:
      'Tìm sản phẩm đang bán theo từ khóa, danh mục và khoảng giá. Trả về tên, giá, tồn kho và slug.',
    parametersJsonSchema: {
      type: 'object',
      properties: {
        query: {
          type: 'string',
          description: '1-2 từ khóa tiếng Việt có dấu hoặc tên thương hiệu, ví dụ "iphone", "tai nghe". Bỏ trống để lấy theo danh mục/giá.',
        },
        categoryId: { type: 'integer', description: 'ID danh mục lấy từ list_categories' },
        minPrice: { type: 'number', description: 'Giá thấp nhất (VND)' },
        maxPrice: { type: 'number', description: 'Giá cao nhất (VND)' },
        inStockOnly: { type: 'boolean', description: 'Chỉ lấy sản phẩm còn hàng' },
        sortBy: {
          type: 'string',
          enum: ['relevance', 'price_asc', 'price_desc', 'newest'],
          description: 'Cách sắp xếp, mặc định relevance',
        },
      },
    },
  },
  {
    name: 'list_categories',
    description: 'Liệt kê các danh mục sản phẩm cửa hàng đang có (id, tên).',
    parametersJsonSchema: { type: 'object', properties: {} },
  },
  {
    name: 'get_product_details',
    description:
      'Xem chi tiết một sản phẩm: mô tả, thông số, biến thể (màu, dung lượng...), giá và tồn kho.',
    parametersJsonSchema: {
      type: 'object',
      properties: {
        slug: { type: 'string', description: 'Slug sản phẩm lấy từ search_products' },
      },
      required: ['slug'],
    },
  },
  {
    name: 'get_store_info',
    description: 'Thông tin cửa hàng: tên, địa chỉ, hotline, email, phí giao hàng.',
    parametersJsonSchema: { type: 'object', properties: {} },
  },
];

const SEARCH_LIMIT = 8;

@Injectable()
export class ChatToolsService {
  private readonly logger = new Logger(ChatToolsService.name);

  constructor(
    private readonly productService: ProductService,
    private readonly categoryService: CategoryService,
    private readonly storeService: StoreService,
  ) {}

  async execute(name: string, args: Record<string, unknown>): Promise<ToolExecution> {
    try {
      switch (name) {
        case 'search_products':
          return await this.searchProducts(args);
        case 'list_categories':
          return await this.listCategories();
        case 'get_product_details':
          return await this.getProductDetails(String(args.slug ?? ''));
        case 'get_store_info':
          return await this.getStoreInfo();
        default:
          return { result: { error: `Unknown tool: ${name}` }, products: [] };
      }
    } catch (error) {
      if (error instanceof NotFoundException) {
        return { result: { error: 'Không tìm thấy' }, products: [] };
      }
      // A transient DB failure shouldn't fail the whole reply; let the model work around it
      this.logger.error(`Tool ${name} failed: ${(error as Error)?.message}`, (error as Error)?.stack);
      return { result: { error: 'Tạm thời không tra cứu được, hãy thử lại hoặc dùng công cụ khác' }, products: [] };
    }
  }

  private async searchProducts(args: Record<string, unknown>): Promise<ToolExecution> {
    const sort = {
      relevance: { sortBy: 'createdAt', sortOrder: 'desc' },
      newest: { sortBy: 'createdAt', sortOrder: 'desc' },
      price_asc: { sortBy: 'originalPrice', sortOrder: 'asc' },
      price_desc: { sortBy: 'originalPrice', sortOrder: 'desc' },
    }[String(args.sortBy ?? 'relevance')] ?? { sortBy: 'createdAt', sortOrder: 'desc' };

    const { data } = await this.productService.findAll({
      page: 1,
      // Fetch extra rows because inactive/out-of-stock ones are filtered out below
      limit: SEARCH_LIMIT * 2,
      search: typeof args.query === 'string' && args.query.trim() ? args.query : undefined,
      categoryId: toNumber(args.categoryId),
      minPrice: toNumber(args.minPrice),
      maxPrice: toNumber(args.maxPrice),
      sortBy: sort.sortBy,
      sortOrder: sort.sortOrder as 'asc' | 'desc',
    });

    const found = data
      .filter((product: any) => product.status !== 'inactive')
      .filter((product: any) => !args.inStockOnly || isInStock(product))
      .slice(0, SEARCH_LIMIT);

    return {
      result: {
        count: found.length,
        products: found.map((product: any) => ({
          slug: product.slug,
          name: product.name,
          price: product.price,
          originalPrice: product.compareAtPrice,
          discountPercentage: product.discountPercentage || 0,
          inStock: isInStock(product),
          stockQuantity: product.stockQuantity,
          category: product.category?.name ?? null,
          summary: truncate(stripHtml(product.description), 200),
        })),
      },
      products: found.map(toCard),
    };
  }

  private async listCategories(): Promise<ToolExecution> {
    const categories = await this.categoryService.findAll();
    return {
      result: {
        categories: categories
          .filter((category: any) => category.status !== 'inactive')
          .map((category: any) => ({
            id: category.id,
            name: category.nameVi || category.nameEn,
            parentId: category.parentId ?? null,
          })),
      },
      products: [],
    };
  }

  private async getProductDetails(slug: string): Promise<ToolExecution> {
    const product: any = await this.productService.findBySlug(slug);
    if (product.status === 'inactive') {
      return { result: { error: 'Không tìm thấy' }, products: [] };
    }

    return {
      result: {
        slug: product.slug,
        name: product.name,
        price: product.price,
        originalPrice: product.compareAtPrice,
        discountPercentage: product.discountPercentage || 0,
        inStock: isInStock(product),
        stockQuantity: product.stockQuantity,
        category: product.category?.name ?? null,
        description: truncate(stripHtml(product.description), 1500),
        variants: (product.variants ?? []).map((variant: any) => ({
          name: variant.name,
          priceAdjustment: variant.priceAdjustment,
          stockQuantity: variant.stockQuantity,
        })),
      },
      products: [toCard(product)],
    };
  }

  private async getStoreInfo(): Promise<ToolExecution> {
    const store: any = await this.storeService.get();
    return {
      result: {
        name: store?.nameVi || store?.nameEn || null,
        address: store?.address ?? null,
        hotline: store?.hotline ?? null,
        email: store?.email ?? null,
        shippingFee: store?.shippingFee != null ? Number(store.shippingFee) : null,
        currency: store?.currency ?? 'VND',
      },
      products: [],
    };
  }
}

function isInStock(product: any): boolean {
  return product.status !== 'out_of_stock' && !product.isOutOfStock && product.stockQuantity > 0;
}

function toCard(product: any): ChatProductCard {
  return {
    slug: product.slug,
    name: product.name,
    price: product.price,
    compareAtPrice: product.compareAtPrice,
    image: product.images?.[0]?.url || null,
    inStock: isInStock(product),
  };
}

function toNumber(value: unknown): number | undefined {
  const parsed = Number(value);
  return value === undefined || value === null || Number.isNaN(parsed) ? undefined : parsed;
}

function stripHtml(html: string | null | undefined): string {
  return (html ?? '')
    .replace(/<[^>]*>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/\s+/g, ' ')
    .trim();
}

function truncate(text: string, max: number): string {
  return text.length > max ? `${text.slice(0, max)}…` : text;
}
