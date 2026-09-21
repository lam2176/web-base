import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { eq, or, like, and, sql, desc, inArray, ne } from 'drizzle-orm';
import { db } from '@/db';
import { orders, orderItems, products, discountCodes, storeInfo, orderStatusHistory } from '@/db/schema';
import { CouponService } from '../coupon/coupon.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderStatusDto } from './dto/update-order-status.dto';
import { UpdateOrderDto } from './dto/update-order.dto';
import { OrderQueryDto } from './dto/order-query.dto';
import { v4 as uuidv4 } from 'uuid';
import { EmailService } from '@shared/services/email.service';

@Injectable()
export class OrderService {
  private readonly logger = new Logger(OrderService.name);

  constructor(
    private readonly emailService: EmailService,
    private readonly couponService: CouponService,
  ) {}
  /**
   * Create a new order
   * - Generate unique order number
   * - Calculate subtotal and total
   * - Apply discount if provided
   * - Create order and order items
   * - Increment discount code usage
   */
  async create(createOrderDto: CreateOrderDto & { customerId?: number }) {
    const { items, discountCodeId, customerId, couponCode, ...orderData } = createOrderDto;

    // Validate items array
    if (!items || items.length === 0) {
      throw new BadRequestException('Order must have at least one item');
    }

    // Generate unique order number
    const orderNumber = `ORD-${Date.now()}-${uuidv4().substring(0, 8).toUpperCase()}`;

    // Fetch product details for each item and validate
    const itemsWithDetails = await Promise.all(
      items.map(async (item) => {
        const product = await db.query.products.findFirst({
          where: eq(products.id, item.productId),
        });

        if (!product) {
          throw new NotFoundException(`Product with ID ${item.productId} not found`);
        }

        // Use provided price or product's sale price or original price
        const price = item.price || parseFloat(product.salePrice || product.originalPrice);
        const total = price * item.quantity;

        return {
          productId: item.productId,
          productName: product.nameVi || product.nameEn,
          variantName: item.variantName || null,
          quantity: item.quantity,
          price: price.toString(),
          total: total.toString(),
          categoryId: product.categoryId ?? null,
        };
      })
    );

    // Calculate subtotal
    const subtotal = itemsWithDetails.reduce(
      (sum, item) => sum + parseFloat(item.total),
      0
    );

    // Get shipping fee from store info
    let shippingFee = 0;
    const store = await db.query.storeInfo.findFirst();
    if (store && store.shippingFee) {
      shippingFee = parseFloat(store.shippingFee as string);
    }

    // Apply discount code if provided
    let discountAmount = 0;
    let discountCodeToUpdate = null;

    if (discountCodeId) {
      const discountCode = await db.query.discountCodes.findFirst({
        where: eq(discountCodes.id, discountCodeId),
      });

      if (!discountCode) {
        throw new NotFoundException('Discount code not found');
      }

      // Validate discount code
      if (discountCode.status !== 'active') {
        throw new BadRequestException('Discount code is not active');
      }

      if (new Date(discountCode.expiryDate) < new Date()) {
        throw new BadRequestException('Discount code has expired');
      }

      if (discountCode.currentUsage >= discountCode.maxUsage) {
        throw new BadRequestException('Discount code has reached maximum usage');
      }

      // Check per-user usage if allowMultiple is false
      // Exclude cancelled orders - user can reuse code if previous order was cancelled
      if (!discountCode.allowMultiple) {
        const existingOrder = await db.query.orders.findFirst({
          where: and(
            eq(orders.discountCodeId, discountCode.id),
            ne(orders.status, 'cancelled'),
            or(
              eq(orders.customerEmail, orderData.customerEmail),
              eq(orders.customerPhone, orderData.customerPhone),
            ),
          ),
        });

        if (existingOrder) {
          throw new BadRequestException('You have already used this discount code');
        }
      }

      // Calculate discount
      if (discountCode.discountType === 'percentage') {
        discountAmount = (subtotal * parseFloat(discountCode.discountValue)) / 100;
      } else if (discountCode.discountType === 'fixed') {
        discountAmount = parseFloat(discountCode.discountValue);
      }

      // Ensure discount doesn't exceed subtotal
      discountAmount = Math.min(discountAmount, subtotal);
      discountCodeToUpdate = discountCode;
    }

    let couponDiscountAmount = 0;
    if (couponCode) {
      try {
        const coupon = await this.couponService.findActiveByCode(couponCode);
        couponDiscountAmount = this.calculateCouponDiscountAmount(
          coupon,
          itemsWithDetails,
          subtotal,
        );
      } catch (error) {
        this.logger.warn(`Coupon code "${couponCode}" was not applied: ${error?.message}`);
      }
    }

    const combinedDiscount = Math.min(subtotal, discountAmount + couponDiscountAmount);

    // Calculate total
    const total = subtotal + shippingFee - combinedDiscount;

    // Create order
    const [newOrder] = await db
      .insert(orders)
      .values({
        orderNumber,
        customerId: customerId || null,
        customerName: orderData.customerName,
        customerEmail: orderData.customerEmail,
        customerPhone: orderData.customerPhone,
        customerAddress: orderData.customerAddress,
        subtotal: subtotal.toFixed(2),
        shippingFee: shippingFee.toFixed(2),
        discountAmount: combinedDiscount.toFixed(2),
        total: total.toFixed(2),
        status: 'pending',
        discountCodeId: discountCodeId || null,
        notes: orderData.notes || null,
      })
      .returning();

    // Create order items
    await db.insert(orderItems).values(
      itemsWithDetails.map(({ categoryId, ...item }) => ({
        ...item,
        orderId: newOrder.id,
      }))
    );

    // Create initial status history entry
    await db.insert(orderStatusHistory).values({
      orderId: newOrder.id,
      status: 'pending',
      note: 'Order created',
      changedBy: 'system',
      changedByUserId: null,
    });

    // Increment discount code usage if applied
    if (discountCodeToUpdate) {
      await db
        .update(discountCodes)
        .set({
          currentUsage: discountCodeToUpdate.currentUsage + 1,
          updatedAt: new Date(),
        })
        .where(eq(discountCodes.id, discountCodeToUpdate.id));
    }

    const createdOrder = await this.findById(newOrder.id);

    // Send order confirmation email to customer (async, don't block response)
    this.sendOrderEmails(createdOrder, 'vi').catch(err => {
      this.logger.error(`Failed to send order emails for order ${createdOrder.orderNumber}:`, err);
    });

    return createdOrder;
  }

  /**
   * Send order confirmation email to customer and notification to admins
   */
  private async sendOrderEmails(order: any, locale: string = 'vi'): Promise<void> {
    try {
      // Prepare order data for emails
      const emailData = {
        orderNumber: order.orderNumber,
        customerName: order.customerName,
        customerEmail: order.customerEmail,
        customerPhone: order.customerPhone,
        customerAddress: order.customerAddress,
        subtotal: order.subtotal,
        shippingFee: order.shippingFee,
        discountAmount: order.discountAmount,
        total: order.total,
        createdAt: order.createdAt,
        notes: order.notes,
        items: order.items || [],
      };

      // Send confirmation email to customer
      await this.emailService.sendOrderConfirmation(emailData, locale);
      this.logger.log(`Order confirmation email sent to ${order.customerEmail}`);

      // Send notification to admins
      await this.emailService.sendNewOrderNotificationToAdmin(emailData, locale);
      this.logger.log(`Order notification sent to admins for order ${order.orderNumber}`);
    } catch (error) {
      this.logger.error(`Error sending order emails: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Find all orders with pagination, filter by status, search by customer info
   */
  async findAll(query: OrderQueryDto) {
    const { page = 1, limit = 10, status, search } = query;
    const offset = (page - 1) * limit;

    let conditions = [];

    // Status filter
    if (status) {
      conditions.push(eq(orders.status, status));
    }

    // Search filter
    if (search) {
      conditions.push(
        or(
          like(orders.customerName, `%${search}%`),
          like(orders.customerEmail, `%${search}%`),
          like(orders.customerPhone, `%${search}%`),
          like(orders.orderNumber, `%${search}%`)
        )
      );
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    // Get total count
    const [{ count }] = await db
      .select({ count: sql<number>`count(*)` })
      .from(orders)
      .where(whereClause);

    // Get orders
    const allOrders = await db
      .select()
      .from(orders)
      .where(whereClause)
      .limit(limit)
      .offset(offset)
      .orderBy(sql`${orders.createdAt} desc`);

    let itemsCountMap = new Map<number, number>();
    const orderIds = allOrders.map((order) => order.id);

    if (orderIds.length > 0) {
      const counts = await db
        .select({
          orderId: orderItems.orderId,
          itemCount: sql<number>`sum(${orderItems.quantity})`,
        })
        .from(orderItems)
        .where(inArray(orderItems.orderId, orderIds))
        .groupBy(orderItems.orderId);

      counts.forEach(({ orderId, itemCount }) => {
        itemsCountMap.set(orderId, Number(itemCount) || 0);
      });
    }

    const dataWithCounts = allOrders.map((order) => ({
      ...order,
      itemsCount: itemsCountMap.get(order.id) ?? 0,
    }));

    return {
      data: dataWithCounts,
      pagination: {
        page,
        limit,
        total: Number(count),
        totalPages: Math.ceil(Number(count) / limit),
      },
    };
  }

  /**
   * Find order by ID with order items
   */
  async findById(id: number) {
    const order = await db.query.orders.findFirst({
      where: eq(orders.id, id),
    });

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    // Fetch order items
    const items = await db
      .select()
      .from(orderItems)
      .where(eq(orderItems.orderId, id));

    // Fetch discount code if applied
    let discountCode = null;
    if (order.discountCodeId) {
      discountCode = await db.query.discountCodes.findFirst({
        where: eq(discountCodes.id, order.discountCodeId),
      });
    }

    // Fetch status history (includes both order status and payment status)
    const statusHistory = await db
      .select()
      .from(orderStatusHistory)
      .where(eq(orderStatusHistory.orderId, id))
      .orderBy(desc(orderStatusHistory.createdAt));

    return {
      ...order,
      items,
      discountCode,
      statusHistory,
    };
  }

  /**
   * Find order by order number with order items
   */
  async findByOrderNumber(orderNumber: string) {
    const order = await db.query.orders.findFirst({
      where: eq(orders.orderNumber, orderNumber),
    });

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    // Fetch order items
    const items = await db
      .select()
      .from(orderItems)
      .where(eq(orderItems.orderId, order.id));

    // Fetch discount code if applied
    let discountCode = null;
    if (order.discountCodeId) {
      discountCode = await db.query.discountCodes.findFirst({
        where: eq(discountCodes.id, order.discountCodeId),
      });
    }

    return {
      ...order,
      items,
      discountCode,
    };
  }

  /**
   * Update order status
   */
  async updateStatus(
    id: number,
    updateOrderStatusDto: UpdateOrderStatusDto,
    changedBy?: string,
    changedByUserId?: number,
    note?: string
  ) {
    const order = await db.query.orders.findFirst({
      where: eq(orders.id, id),
    });

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    const [updatedOrder] = await db
      .update(orders)
      .set({
        status: updateOrderStatusDto.status,
        updatedAt: new Date(),
      })
      .where(eq(orders.id, id))
      .returning();

    // Create status history entry
    await db.insert(orderStatusHistory).values({
      orderId: updatedOrder.id,
      type: 'status',
      status: updateOrderStatusDto.status,
      note: note || `Status changed to ${updateOrderStatusDto.status}`,
      changedBy: changedBy || 'admin',
      changedByUserId: changedByUserId || null,
    });

    return this.findById(updatedOrder.id);
  }

  /**
   * Update order details
   */
  async update(id: number, updateOrderDto: UpdateOrderDto) {
    const existingOrder = await db.query.orders.findFirst({
      where: eq(orders.id, id),
    });

    if (!existingOrder) {
      throw new NotFoundException('Order not found');
    }

    return await db.transaction(async (tx) => {
      const updateData: Record<string, any> = {
        updatedAt: new Date(),
      };

      // Update customer info
      if (updateOrderDto.customerName !== undefined) {
        updateData.customerName = updateOrderDto.customerName;
      }
      if (updateOrderDto.customerEmail !== undefined) {
        updateData.customerEmail = updateOrderDto.customerEmail;
      }
      if (updateOrderDto.customerPhone !== undefined) {
        updateData.customerPhone = updateOrderDto.customerPhone;
      }
      if (updateOrderDto.customerAddress !== undefined) {
        updateData.customerAddress = updateOrderDto.customerAddress;
      }
      if (updateOrderDto.notes !== undefined) {
        updateData.notes = updateOrderDto.notes;
      }

      let statusChanged = false;
      if (updateOrderDto.status && updateOrderDto.status !== existingOrder.status) {
        updateData.status = updateOrderDto.status;
        statusChanged = true;
      }

      let paymentStatusChanged = false;
      if (updateOrderDto.paymentStatus !== undefined) {
        const existingPaymentStatus = existingOrder.paymentStatus || 'unpaid';
        if (updateOrderDto.paymentStatus !== existingPaymentStatus) {
          updateData.paymentStatus = updateOrderDto.paymentStatus;
          paymentStatusChanged = true;
        }
      }

      // Handle order items update
      let recalculatedSubtotal: number | undefined;
      if (updateOrderDto.items) {
        const itemsWithDetails = await Promise.all(
          updateOrderDto.items.map(async (itemDto) => {
            let productId = itemDto.productId;
            let productName = itemDto.productName;
            let price = itemDto.price;

            // If updating existing item, get existing data
            if (itemDto.id) {
              const existingItem = await tx.query.orderItems.findFirst({
                where: eq(orderItems.id, itemDto.id),
              });
              if (!existingItem) {
                throw new NotFoundException(`Order item with ID ${itemDto.id} not found`);
              }
              if (!productId) productId = existingItem.productId;
              if (!productName) productName = existingItem.productName;
              if (price === undefined || price === null) {
                price = parseFloat(existingItem.price);
              }
            }

            // Fetch product if needed
            if (!productName || price === undefined || price === null) {
              if (!productId) {
                throw new BadRequestException('Product ID is required');
              }
              const product = await db.query.products.findFirst({
                where: eq(products.id, productId),
              });
              if (!product) {
                throw new NotFoundException(`Product with ID ${productId} not found`);
              }
              if (!productName) {
                productName = product.nameVi || product.nameEn;
              }
              if (price === undefined || price === null) {
                price = parseFloat(product.salePrice || product.originalPrice);
              }
            }

            const quantity = itemDto.quantity || 1;
            const total = price * quantity;

            return {
              productId: productId!,
              productName: productName!,
              variantName: itemDto.variantName || null,
              quantity,
              price: price.toString(),
              total: total.toString(),
            };
          })
        );

        // Delete existing items
        await tx.delete(orderItems).where(eq(orderItems.orderId, id));

        // Insert new items
        if (itemsWithDetails.length > 0) {
          await tx.insert(orderItems).values(
            itemsWithDetails.map((item) => ({
              orderId: id,
              ...item,
            }))
          );

          recalculatedSubtotal = itemsWithDetails.reduce(
            (sum, item) => sum + parseFloat(item.total),
            0
          );
        } else {
          recalculatedSubtotal = 0;
        }
      }

      // Calculate totals
      const existingSubtotal = parseFloat(existingOrder.subtotal);
      const existingShipping = parseFloat(existingOrder.shippingFee);
      const existingDiscount = parseFloat(existingOrder.discountAmount);

      const subtotal = updateOrderDto.subtotal ?? recalculatedSubtotal ?? existingSubtotal;
      const shippingFee = updateOrderDto.shippingFee ?? existingShipping;
      const discountAmount = updateOrderDto.discountAmount ?? existingDiscount;
      const total = updateOrderDto.total ?? subtotal + shippingFee - discountAmount;

      updateData.subtotal = subtotal.toFixed(2);
      updateData.shippingFee = shippingFee.toFixed(2);
      updateData.discountAmount = discountAmount.toFixed(2);
      updateData.total = total.toFixed(2);

      // Update order
      await tx
        .update(orders)
        .set(updateData)
        .where(eq(orders.id, id));

      // Create status history entry if status changed
      if (statusChanged) {
        await tx.insert(orderStatusHistory).values({
          orderId: id,
          type: 'status',
          status: updateOrderDto.status!,
          note: 'Order status updated',
          changedBy: 'admin',
          changedByUserId: null,
        });
      }

      // Create payment status history entry if payment status changed
      if (paymentStatusChanged) {
        await tx.insert(orderStatusHistory).values({
          orderId: id,
          type: 'payment_status',
          status: updateOrderDto.paymentStatus!,
          note: 'Payment status updated',
          changedBy: 'admin',
          changedByUserId: null,
        });
      }

      return this.findById(id);
    });
  }

  private calculateCouponDiscountAmount(
    coupon: any,
    items: Array<{ total: string; categoryId?: number | null }>,
    subtotal: number,
  ) {
    const categoryIds: number[] = Array.isArray(coupon.categoryIds)
      ? coupon.categoryIds
      : [];

    const applicableAmount =
      coupon.applyTo === 'category' && categoryIds.length > 0
        ? items.reduce((sum, item) => {
            if (item.categoryId && categoryIds.includes(item.categoryId)) {
              return sum + parseFloat(item.total);
            }
            return sum;
          }, 0)
        : subtotal;

    if (applicableAmount <= 0) {
      return 0;
    }

    const discountValue = parseFloat(coupon.discountValue || '0');
    if (!discountValue || discountValue <= 0) {
      return 0;
    }

    const discount =
      coupon.discountType === 'percentage'
        ? (applicableAmount * discountValue) / 100
        : discountValue;

    return Math.min(discount, applicableAmount);
  }

  /**
   * Get orders for a specific customer
   */
  async findCustomerOrders(customerId: number, page = 1, limit = 10) {
    const offset = (page - 1) * limit;

    // Get total count
    const [{ count }] = await db
      .select({ count: sql<number>`count(*)` })
      .from(orders)
      .where(eq(orders.customerId, customerId));

    // Get orders with items
    const customerOrders = await db.query.orders.findMany({
      where: eq(orders.customerId, customerId),
      limit,
      offset,
      orderBy: (orders, { desc }) => [desc(orders.createdAt)],
    });

    // Get order items for each order
    const ordersWithItems = await Promise.all(
      customerOrders.map(async (order) => {
        const items = await db.query.orderItems.findMany({
          where: eq(orderItems.orderId, order.id),
        });
        return { ...order, items };
      })
    );

    return {
      data: ordersWithItems,
      pagination: {
        page,
        limit,
        total: Number(count),
        totalPages: Math.ceil(Number(count) / limit),
      },
    };
  }

  /**
   * Get a specific order by ID for a customer
   */
  async findCustomerOrderById(customerId: number, orderId: number) {
    const order = await db.query.orders.findFirst({
      where: and(
        eq(orders.id, orderId),
        eq(orders.customerId, customerId)
      ),
    });

    if (!order) {
      throw new NotFoundException('Order not found or does not belong to customer');
    }

    // Get order items
    const items = await db.query.orderItems.findMany({
      where: eq(orderItems.orderId, order.id),
    });

    // Get status history
    const statusHistory = await db.query.orderStatusHistory.findMany({
      where: eq(orderStatusHistory.orderId, order.id),
      orderBy: [desc(orderStatusHistory.createdAt)],
    });

    return {
      data: { ...order, items, statusHistory },
    };
  }

  /**
   * Delete order
   */
  async delete(id: number) {
    const order = await db.query.orders.findFirst({
      where: eq(orders.id, id),
    });

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    // Delete order (cascade will handle order items)
    await db.delete(orders).where(eq(orders.id, id));

    return { message: 'Order deleted successfully' };
  }
}
