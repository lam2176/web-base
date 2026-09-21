import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { eq, like, or, and, gte, lte, sql, desc, asc } from 'drizzle-orm';
import { db } from '@/db';
import { products, productVariants, productImages, categories, media } from '@/db/schema';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { ProductQueryDto } from './dto/product-query.dto';
import { SlugUtil } from '@shared/utils/slug.util';
import { MediaUrlUtil } from '@shared/utils/media-url.util';

@Injectable()
export class ProductService {
  async create(createProductDto: CreateProductDto) {
    // Check if slug already exists
    const existingProduct = await db.query.products.findFirst({
      where: eq(products.slug, createProductDto.slug),
    });

    if (existingProduct) {
      throw new ConflictException('Product with this slug already exists');
    }

    // Verify category exists if provided
    if (createProductDto.categoryId) {
      const category = await db.query.categories.findFirst({
        where: eq(categories.id, createProductDto.categoryId),
      });

      if (!category) {
        throw new NotFoundException('Category not found');
      }
    }

    // Calculate discount percentage if not provided
    let discountPercentage = createProductDto.discountPercentage || 0;
    if (createProductDto.salePrice && createProductDto.originalPrice) {
      discountPercentage = Math.round(
        ((createProductDto.originalPrice - createProductDto.salePrice) /
          createProductDto.originalPrice) *
          100,
      );
    }

    // Create product
    const [newProduct] = await db
      .insert(products)
      .values({
        ...createProductDto,
        slug: SlugUtil.generate(createProductDto.slug),
        discountPercentage,
        originalPrice: createProductDto.originalPrice?.toString(),
        salePrice: createProductDto.salePrice?.toString(),
      })
      .returning();

    // Create variants if provided
    if (createProductDto.variants && createProductDto.variants.length > 0) {
      await db.insert(productVariants).values(
        createProductDto.variants.map((variant) => ({
          ...variant,
          productId: newProduct.id,
          priceAdjustment: variant.priceAdjustment?.toString(),
        })),
      );
    }

    // Create product images if provided
    if (createProductDto.images && createProductDto.images.length > 0) {
      await db.insert(productImages).values(
        createProductDto.images.map((image) => ({
          ...image,
          productId: newProduct.id,
        })),
      );
    }

    return this.findById(newProduct.id);
  }

  async findAll(query: ProductQueryDto) {
    const { page = 1, limit = 10, search, sortBy = 'createdAt', sortOrder = 'desc' } = query;
    const offset = (page - 1) * limit;

    let conditions = [];

    // Search filter with PostgreSQL Full-Text Search
    if (search) {
      // Clean and prepare search query - remove special characters
      const cleanSearch = search.trim().replace(/[^\w\sàáảãạăằắẳẵặâầấẩẫậèéẻẽẹêềếểễệìíỉĩịòóỏõọôồốổỗộơờớởỡợùúủũụưừứửữựỳýỷỹỵđ]/gi, ' ');

      // Use full-text search with ranking
      // tsvector column was created with weighted fields: nameVi/nameEn (A), description (B), slug (C)
      conditions.push(
        sql`${products}.search_vector @@ plainto_tsquery('simple', ${cleanSearch})`
      );
    }

    // Category filter
    if (query.categoryId) {
      conditions.push(eq(products.categoryId, query.categoryId));
    }

    // Status filter
    if (query.status) {
      conditions.push(eq(products.status, query.status));
    }

    // Featured filter
    if (query.featured !== undefined) {
      conditions.push(eq(products.featured, query.featured));
    }

    // Price range filter
    if (query.minPrice !== undefined) {
      conditions.push(gte(products.originalPrice, query.minPrice.toString()));
    }
    if (query.maxPrice !== undefined) {
      conditions.push(lte(products.originalPrice, query.maxPrice.toString()));
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    // Get total count
    const [{ count }] = await db
      .select({ count: sql<number>`count(*)` })
      .from(products)
      .where(whereClause);

    // Determine order by clause
    // If searching, order by relevance ranking first, then by sortBy
    let orderByClause;
    if (search) {
      const cleanSearch = search.trim().replace(/[^\w\sàáảãạăằắẳẵặâầấẩẫậèéẻẽẹêềếểễệìíỉĩịòóỏõọôồốổỗộơờớởỡợùúủũụưừứửữựỳýỷỹỵđ]/gi, ' ');
      // Order by relevance ranking (ts_rank) DESC, then by user's sortBy choice
      if (sortOrder === 'asc') {
        orderByClause = sql`ts_rank(${products}.search_vector, plainto_tsquery('simple', ${cleanSearch})) DESC, ${products[sortBy]} ASC`;
      } else {
        orderByClause = sql`ts_rank(${products}.search_vector, plainto_tsquery('simple', ${cleanSearch})) DESC, ${products[sortBy]} DESC`;
      }
    } else {
      // No search query, use normal sorting
      orderByClause = sortOrder === 'asc' ? sql`${products[sortBy]} asc` : sql`${products[sortBy]} desc`;
    }

    // Get products with relations using Drizzle query API
    const allProducts = await db.query.products.findMany({
      where: whereClause,
      limit,
      offset,
      orderBy: orderByClause,
      with: {
        category: true,
        productImages: {
          orderBy: (productImages, { asc }) => [asc(productImages.order)],
          with: {
            media: true,
          },
        },
        variants: true,
      },
    });

    // Transform products for frontend
    const transformedProducts = allProducts.map((product) => this.transformProduct(product));

    return {
      data: transformedProducts,
      pagination: {
        page,
        limit,
        total: Number(count),
        totalPages: Math.ceil(Number(count) / limit),
      },
    };
  }

  private transformProduct(product: any) {
    // Add URLs to product images and sort by isPrimary first, then by order
    const productImagesWithUrls = product.productImages?.map((img: any) => {
      const mediaWithUrl = img.media ? MediaUrlUtil.addUrl(img.media) : undefined;

      return {
        id: img.id,
        mediaId: img.mediaId,
        url: mediaWithUrl?.url || '',
        alt: mediaWithUrl?.alt || img.media?.alt || product.nameVi,
        order: img.order,
        isPrimary: img.isPrimary,
        media: mediaWithUrl,
      };
    }).sort((a: any, b: any) => {
      // Primary image always comes first
      if (a.isPrimary && !b.isPrimary) return -1;
      if (!a.isPrimary && b.isPrimary) return 1;
      // Then sort by order
      return a.order - b.order;
    }) || [];

    return {
      ...product,
      name: product.nameVi || product.nameEn,
      description: product.descriptionVi || product.descriptionEn,
      price: Number(product.salePrice || product.originalPrice),
      compareAtPrice: product.salePrice ? Number(product.originalPrice) : null,
      images: productImagesWithUrls,
      inventoryQuantity: product.stockQuantity,
      trackInventory: true,
      isActive: product.status === 'active',
      sku: product.slug,
      category: product.category ? {
        id: product.category.id,
        nameVi: product.category.nameVi,
        nameEn: product.category.nameEn,
        name: product.category.nameVi || product.category.nameEn,
        slug: product.category.slug,
      } : null,
    };
  }

  async findById(id: number) {
    const product = await db.query.products.findFirst({
      where: eq(products.id, id),
      with: {
        category: true,
      },
    });

    if (!product) {
      throw new NotFoundException('Product not found');
    }

    // Manually fetch related data
    const [variants, productImagesData] = await Promise.all([
      db.select().from(productVariants).where(eq(productVariants.productId, id)),
      db
        .select({
          id: productImages.id,
          mediaId: productImages.mediaId,
          order: productImages.order,
          isPrimary: productImages.isPrimary,
          media: media,
        })
        .from(productImages)
        .leftJoin(media, eq(productImages.mediaId, media.id))
        .where(eq(productImages.productId, id))
        .orderBy(desc(productImages.isPrimary), asc(productImages.order)), // Sort by isPrimary first, then by order
    ]);

    // Add URLs to media objects
    const imagesWithUrls = productImagesData.map((img) => ({
      ...img,
      media: img.media ? MediaUrlUtil.addUrl(img.media) : null,
    }));

    return {
      ...product,
      variants,
      productImages: imagesWithUrls,
      images: imagesWithUrls, // backward compatibility for admin frontend
    };
  }

  async findBySlug(slug: string) {
    const product = await db.query.products.findFirst({
      where: eq(products.slug, slug),
    });

    if (!product) {
      throw new NotFoundException('Product not found');
    }

    const productWithRelations = await this.findById(product.id);
    return this.transformProductDetail(productWithRelations);
  }

  private transformProductDetail(product: any) {
    // Transform product images to frontend format and ensure primary image is first
    const productImagesWithUrls = product.productImages?.map((img: any) => {
      const mediaWithUrl = img.media ? MediaUrlUtil.addUrl(img.media) : null;

      return {
        id: img.id,
        mediaId: img.mediaId,
        url: mediaWithUrl?.url || '',
        alt: mediaWithUrl?.alt || mediaWithUrl?.filename || img.media?.filename || product.nameVi,
        order: img.order,
        isPrimary: img.isPrimary,
        media: mediaWithUrl,
      };
    }).sort((a: any, b: any) => {
      // Primary image always comes first
      if (a.isPrimary && !b.isPrimary) return -1;
      if (!a.isPrimary && b.isPrimary) return 1;
      // Then sort by order
      return a.order - b.order;
    }) || [];

    // Transform variants
    const transformedVariants = product.variants?.map((variant: any) => {
      // Combine name and value for display (e.g., "Color: Red" or "Size: XL")
      const displayName = variant.name && variant.value
        ? `${variant.name}: ${variant.value}`
        : variant.value || variant.name || '';

      return {
        id: variant.id,
        name: displayName,
        nameVi: displayName,
        nameEn: displayName,
        value: variant.value || '',
        sku: variant.sku,
        barcode: variant.barcode,
        priceAdjustment: variant.priceAdjustment ? Number(variant.priceAdjustment) : 0,
        stockQuantity: variant.stockQuantity,
        isActive: true, // Product variants don't have isActive in schema
      };
    }) || [];

    return {
      ...product,
      nameVi: product.nameVi,
      nameEn: product.nameEn,
      name: product.nameVi || product.nameEn,
      descriptionVi: product.descriptionVi,
      descriptionEn: product.descriptionEn,
      description: product.descriptionVi || product.descriptionEn,
      price: Number(product.salePrice || product.originalPrice),
      compareAtPrice: product.salePrice ? Number(product.originalPrice) : null,
      images: productImagesWithUrls,
      inventoryQuantity: product.stockQuantity,
      trackInventory: true,
      isActive: product.status === 'active',
      sku: product.slug,
      variants: transformedVariants,
      category: product.category ? {
        id: product.category.id,
        nameVi: product.category.nameVi,
        nameEn: product.category.nameEn,
        name: product.category.nameVi || product.category.nameEn,
        slug: product.category.slug,
      } : null,
    };
  }

  async update(id: number, updateProductDto: UpdateProductDto) {
    const product = await db.query.products.findFirst({
      where: eq(products.id, id),
    });

    if (!product) {
      throw new NotFoundException('Product not found');
    }

    // Check slug conflict
    if (updateProductDto.slug && updateProductDto.slug !== product.slug) {
      const existingProduct = await db.query.products.findFirst({
        where: eq(products.slug, updateProductDto.slug),
      });

      if (existingProduct) {
        throw new ConflictException('Product with this slug already exists');
      }
    }

    // Verify category if provided
    if (updateProductDto.categoryId) {
      const category = await db.query.categories.findFirst({
        where: eq(categories.id, updateProductDto.categoryId),
      });

      if (!category) {
        throw new NotFoundException('Category not found');
      }
    }

    // Calculate discount percentage
    let discountPercentage = updateProductDto.discountPercentage;
    if (updateProductDto.salePrice !== undefined && updateProductDto.originalPrice !== undefined) {
      discountPercentage = Math.round(
        ((updateProductDto.originalPrice - updateProductDto.salePrice) /
          updateProductDto.originalPrice) *
          100,
      );
    }

    // Update product
    const [updatedProduct] = await db
      .update(products)
      .set({
        ...updateProductDto,
        slug: updateProductDto.slug ? SlugUtil.generate(updateProductDto.slug) : undefined,
        discountPercentage,
        originalPrice: updateProductDto.originalPrice?.toString(),
        salePrice: updateProductDto.salePrice?.toString(),
        updatedAt: new Date(),
      })
      .where(eq(products.id, id))
      .returning();

    // Update variants if provided
    if (updateProductDto.variants) {
      // Delete existing variants
      await db.delete(productVariants).where(eq(productVariants.productId, id));

      // Insert new variants
      if (updateProductDto.variants.length > 0) {
        await db.insert(productVariants).values(
          updateProductDto.variants.map((variant) => ({
            ...variant,
            productId: id,
            priceAdjustment: variant.priceAdjustment?.toString(),
          })),
        );
      }
    }

    // Update images if provided
    if (updateProductDto.images) {
      // Delete existing images
      await db.delete(productImages).where(eq(productImages.productId, id));

      // Insert new images
      if (updateProductDto.images.length > 0) {
        await db.insert(productImages).values(
          updateProductDto.images.map((image) => ({
            ...image,
            productId: id,
          })),
        );
      }
    }

    return this.findById(id);
  }

  async delete(id: number) {
    const product = await db.query.products.findFirst({
      where: eq(products.id, id),
    });

    if (!product) {
      throw new NotFoundException('Product not found');
    }

    // Delete product (cascade will handle variants and images)
    await db.delete(products).where(eq(products.id, id));
  }

  async findFeatured(limit = 10) {
    const featuredProducts = await db.query.products.findMany({
      where: and(eq(products.featured, true), eq(products.status, 'active')),
      limit,
      with: {
        category: true,
        productImages: {
          orderBy: (productImages, { asc }) => [asc(productImages.order)],
          with: {
            media: true,
          },
        },
        variants: true,
      },
    });

    return featuredProducts.map((product) => this.transformProduct(product));
  }

  async findRelated(productId: number, limit = 4) {
    const product = await db.query.products.findFirst({
      where: eq(products.id, productId),
    });

    if (!product || !product.categoryId) {
      return [];
    }

    const relatedProducts = await db.query.products.findMany({
      where: and(
        eq(products.categoryId, product.categoryId),
        sql`${products.id} != ${productId}`,
        eq(products.status, 'active')
      ),
      limit,
      with: {
        category: true,
        productImages: {
          orderBy: (productImages, { asc }) => [asc(productImages.order)],
          with: {
            media: true,
          },
        },
        variants: true,
      },
    });

    return relatedProducts.map((product) => this.transformProduct(product));
  }

  async importProducts(productsData: (CreateProductDto & { categorySlug?: string })[]) {
    const results = {
      success: 0,
      failed: 0,
      errors: [] as Array<{ index: number; error: string }>,
    };

    for (let i = 0; i < productsData.length; i++) {
      const productData = productsData[i];
      try {
        // Resolve category by slug if provided
        let categoryId = productData.categoryId;
        if (!categoryId && (productData as any).categorySlug) {
          const category = await db.query.categories.findFirst({
            where: eq(categories.slug, (productData as any).categorySlug),
          });
          if (category) {
            categoryId = category.id;
          }
        }

        // Check if slug already exists
        const existingProduct = await db.query.products.findFirst({
          where: eq(products.slug, productData.slug),
        });

        if (existingProduct) {
          results.failed++;
          results.errors.push({
            index: i,
            error: `Product with slug "${productData.slug}" already exists`,
          });
          continue;
        }

        // Calculate discount percentage
        let discountPercentage = productData.discountPercentage || 0;
        if (productData.salePrice && productData.originalPrice) {
          discountPercentage = Math.round(
            ((productData.originalPrice - productData.salePrice) / productData.originalPrice) * 100,
          );
        }

        // Create product
        const [newProduct] = await db
          .insert(products)
          .values({
            ...productData,
            slug: SlugUtil.generate(productData.slug),
            discountPercentage,
            originalPrice: productData.originalPrice.toString(),
            salePrice: productData.salePrice?.toString(),
            categoryId,
          } as any)
          .returning();

        results.success++;
      } catch (error: any) {
        results.failed++;
        results.errors.push({
          index: i,
          error: error.message || 'Unknown error',
        });
      }
    }

    return results;
  }
}
