import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { eq, and } from 'drizzle-orm';
import { db } from '@/db';
import { products, productVariants, discountCodes, storeInfo, carts, cartItems } from '@/db/schema';
import { CalculateCartDto } from './dto/calculate-cart.dto';
import { AddToCartDto } from './dto/add-to-cart.dto';
import { UpdateCartItemDto } from './dto/update-cart-item.dto';
import { UploadService } from '@shared/services/upload.service';

interface CartItemCalculation {
  productId: number;
  productName: string;
  variantName?: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

interface CartCalculationResult {
  items: CartItemCalculation[];
  subtotal: number;
  shippingFee: number;
  discountAmount: number;
  discountCode?: {
    code: string;
    name: string;
    discountType: string;
    discountValue: string;
  };
  total: number;
}

@Injectable()
export class CartService {
  constructor(private readonly uploadService: UploadService) {}

  /**
   * Get public URL for media file
   */
  private getMediaUrl(filepath?: string): string | undefined {
    if (!filepath) return undefined;
    // If already absolute URL, return as is
    if (filepath.startsWith('http://') || filepath.startsWith('https://')) {
      return filepath;
    }
    // Get public URL from Supabase
    return this.uploadService.getPublicUrl(filepath, 'PUBLIC');
  }

  /**
   * Get or create cart for customer/session
   */
  private async getOrCreateCart(customerId?: number, sessionId?: string) {
    if (!customerId && !sessionId) {
      throw new BadRequestException('Either customerId or sessionId is required');
    }

    // Find existing cart
    let cart;
    if (customerId) {
      cart = await db.query.carts.findFirst({
        where: eq(carts.customerId, customerId),
        with: {
          items: true,
        },
      });
    } else if (sessionId) {
      cart = await db.query.carts.findFirst({
        where: eq(carts.sessionId, sessionId),
        with: {
          items: true,
        },
      });
    }

    // Create cart if not exists
    if (!cart) {
      const [newCart] = await db
        .insert(carts)
        .values({
          customerId,
          sessionId,
        })
        .returning();

      return { ...newCart, items: [] };
    }

    return cart;
  }

  /**
   * Get cart with items
   */
  async getCart(customerId?: number, sessionId?: string) {
    const cart = await this.getOrCreateCart(customerId, sessionId);

    // Populate full product details for each item
    const itemsWithDetails = await Promise.all(
      (cart.items || []).map(async (item) => {
        const product = await db.query.products.findFirst({
          where: eq(products.id, item.productId),
          with: {
            productImages: {
              with: {
                media: true,
              },
              orderBy: (productImages, { asc }) => [asc(productImages.order)],
              limit: 1,
            },
          },
        });

        let variant = null;
        if (item.variantId) {
          variant = await db.query.productVariants.findFirst({
            where: eq(productVariants.id, item.variantId),
          });
        }

        // Check if cached data needs update
        let needsUpdate = false;
        const updates: any = {};
        let stockInfo: any = {
          isAvailable: true,
          inStock: true,
          availableQuantity: null,
        };

        if (product) {
          const currentProductName = product.nameVi || product.nameEn;
          const currentPrice = variant
            ? parseFloat(product.salePrice || product.originalPrice) + parseFloat(variant.priceAdjustment?.toString() || '0')
            : parseFloat(product.salePrice || product.originalPrice);
          const currentImage = product.productImages?.[0]?.media?.filepath;
          const currentVariantName = variant?.value;

          // Check product availability
          if (product.status !== 'active') {
            stockInfo.isAvailable = false;
          }

          // Check stock (for variant or product)
          const availableStock = variant ? variant.stockQuantity : product.stockQuantity;
          stockInfo.availableQuantity = availableStock;

          if (availableStock < item.quantity) {
            stockInfo.inStock = false;
          }

          // Compare cached vs current data
          if (item.productName !== currentProductName) {
            updates.productName = currentProductName;
            needsUpdate = true;
          }
          if (parseFloat(item.price) !== currentPrice) {
            updates.price = currentPrice.toString();
            needsUpdate = true;
          }
          if (item.image !== currentImage) {
            updates.image = currentImage;
            needsUpdate = true;
          }
          if (variant && item.variantName !== currentVariantName) {
            updates.variantName = currentVariantName;
            needsUpdate = true;
          }

          // Update cached data if needed
          if (needsUpdate) {
            await db
              .update(cartItems)
              .set({ ...updates, updatedAt: new Date() })
              .where(eq(cartItems.id, item.id));
          }
        } else {
          // Product deleted
          stockInfo.isAvailable = false;
        }

        return {
          ...item,
          ...updates, // Apply updates to returned data
          // Convert filepath to public URL
          image: this.getMediaUrl(updates.image || item.image),
          product,
          variant,
          // Stock & availability info
          ...stockInfo,
          // Flag if data changed (frontend can show notification)
          priceChanged: updates.price ? parseFloat(updates.price) !== parseFloat(item.price) : false,
          productChanged: needsUpdate,
          oldPrice: updates.price ? parseFloat(item.price) : null,
        };
      })
    );

    return {
      ...cart,
      items: itemsWithDetails,
    };
  }

  /**
   * Add item to cart
   */
  async addToCart(addToCartDto: AddToCartDto, customerId?: number, sessionId?: string) {
    const { productId, variantId, quantity } = addToCartDto;

    // Validate product
    const product = await db.query.products.findFirst({
      where: eq(products.id, productId),
      with: {
        variants: true,
        productImages: {
          with: {
            media: true,
          },
          orderBy: (productImages, { asc }) => [asc(productImages.order)],
          limit: 1,
        },
      },
    });

    if (!product) {
      throw new NotFoundException(`Product with ID ${productId} not found`);
    }

    if (product.status !== 'active') {
      throw new BadRequestException(`Product is not available`);
    }

    // Get variant if specified
    let variant = null;
    let variantName = null;
    let price = parseFloat(product.salePrice || product.originalPrice);

    if (variantId) {
      variant = product.variants?.find(v => v.id === variantId);
      if (!variant) {
        throw new NotFoundException(`Variant with ID ${variantId} not found`);
      }
      if (variant.priceAdjustment) {
        price += parseFloat(variant.priceAdjustment.toString());
      }
      // Use variant value (e.g., "256GB - Natural Titanium") instead of name (e.g., "Storage")
      variantName = variant.value;
    }

    // Get or create cart
    const cart = await this.getOrCreateCart(customerId, sessionId);

    // Check if item already exists in cart
    const existingItem = await db.query.cartItems.findFirst({
      where: and(
        eq(cartItems.cartId, cart.id),
        eq(cartItems.productId, productId),
        variantId ? eq(cartItems.variantId, variantId) : eq(cartItems.variantId, null as any)
      ),
    });

    if (existingItem) {
      // Update quantity
      const [updated] = await db
        .update(cartItems)
        .set({
          quantity: existingItem.quantity + quantity,
          updatedAt: new Date(),
        })
        .where(eq(cartItems.id, existingItem.id))
        .returning();

      return updated;
    } else {
      // Add new item
      const [newItem] = await db
        .insert(cartItems)
        .values({
          cartId: cart.id,
          productId,
          variantId,
          quantity,
          productName: product.nameVi || product.nameEn,
          variantName,
          price: price.toString(),
          image: product.productImages?.[0]?.media?.filepath,
          slug: product.slug,
        })
        .returning();

      return newItem;
    }
  }

  /**
   * Update cart item quantity
   */
  async updateCartItem(itemId: number, updateDto: UpdateCartItemDto, customerId?: number, sessionId?: string) {
    const { quantity } = updateDto;

    // Verify cart ownership
    const cart = await this.getOrCreateCart(customerId, sessionId);

    const item = await db.query.cartItems.findFirst({
      where: and(
        eq(cartItems.id, itemId),
        eq(cartItems.cartId, cart.id)
      ),
    });

    if (!item) {
      throw new NotFoundException('Cart item not found');
    }

    if (quantity <= 0) {
      throw new BadRequestException('Quantity must be greater than 0');
    }

    const [updated] = await db
      .update(cartItems)
      .set({
        quantity,
        updatedAt: new Date(),
      })
      .where(eq(cartItems.id, itemId))
      .returning();

    return updated;
  }

  /**
   * Remove item from cart
   */
  async removeCartItem(itemId: number, customerId?: number, sessionId?: string) {
    // Verify cart ownership
    const cart = await this.getOrCreateCart(customerId, sessionId);

    const item = await db.query.cartItems.findFirst({
      where: and(
        eq(cartItems.id, itemId),
        eq(cartItems.cartId, cart.id)
      ),
    });

    if (!item) {
      throw new NotFoundException('Cart item not found');
    }

    await db
      .delete(cartItems)
      .where(eq(cartItems.id, itemId));

    return { message: 'Item removed from cart' };
  }

  /**
   * Clear cart
   */
  async clearCart(customerId?: number, sessionId?: string) {
    const cart = await this.getOrCreateCart(customerId, sessionId);

    await db
      .delete(cartItems)
      .where(eq(cartItems.cartId, cart.id));

    return { message: 'Cart cleared' };
  }

  /**
   * Calculate cart totals
   * - Fetch product prices from database
   * - Apply discount code if provided
   * - Calculate subtotal, shipping fee, discount, and total
   */
  async calculateCart(calculateCartDto: CalculateCartDto): Promise<CartCalculationResult> {
    const { items, discountCode } = calculateCartDto;

    if (!items || items.length === 0) {
      throw new BadRequestException('Cart must have at least one item');
    }

    // Fetch product details and calculate item totals
    const itemCalculations: CartItemCalculation[] = await Promise.all(
      items.map(async (item) => {
        const product = await db.query.products.findFirst({
          where: eq(products.id, item.productId),
        });

        if (!product) {
          throw new NotFoundException(`Product with ID ${item.productId} not found`);
        }

        if (product.status !== 'active') {
          throw new BadRequestException(`Product "${product.nameVi || product.nameEn}" is not available`);
        }

        // Use sale price if available, otherwise use original price
        const unitPrice = parseFloat(product.salePrice || product.originalPrice);
        const total = unitPrice * item.quantity;

        return {
          productId: product.id,
          productName: product.nameVi || product.nameEn,
          variantName: item.variantName,
          quantity: item.quantity,
          unitPrice,
          total,
        };
      })
    );

    // Calculate subtotal
    const subtotal = itemCalculations.reduce((sum, item) => sum + item.total, 0);

    // Get shipping fee from store info
    let shippingFee = 0;
    const store = await db.query.storeInfo.findFirst();
    if (store && store.shippingFee) {
      shippingFee = parseFloat(store.shippingFee as string);
    }

    // Apply discount code if provided
    let discountAmount = 0;
    let discountCodeInfo = undefined;

    if (discountCode) {
      const code = await db.query.discountCodes.findFirst({
        where: eq(discountCodes.code, discountCode),
      });

      if (!code) {
        throw new NotFoundException('Discount code not found');
      }

      // Validate discount code
      if (code.status !== 'active') {
        throw new BadRequestException('Discount code is not active');
      }

      if (new Date(code.expiryDate) < new Date()) {
        throw new BadRequestException('Discount code has expired');
      }

      if (code.currentUsage >= code.maxUsage) {
        throw new BadRequestException('Discount code has reached maximum usage');
      }

      // Calculate discount
      if (code.discountType === 'percentage') {
        discountAmount = (subtotal * parseFloat(code.discountValue)) / 100;
      } else if (code.discountType === 'fixed') {
        discountAmount = parseFloat(code.discountValue);
      }

      // Ensure discount doesn't exceed subtotal
      discountAmount = Math.min(discountAmount, subtotal);

      discountCodeInfo = {
        code: code.code,
        name: code.name,
        discountType: code.discountType,
        discountValue: code.discountValue,
      };
    }

    // Calculate total
    const total = Math.max(0, subtotal + shippingFee - discountAmount);

    return {
      items: itemCalculations,
      subtotal: parseFloat(subtotal.toFixed(2)),
      shippingFee: parseFloat(shippingFee.toFixed(2)),
      discountAmount: parseFloat(discountAmount.toFixed(2)),
      discountCode: discountCodeInfo,
      total: parseFloat(total.toFixed(2)),
    };
  }
}
