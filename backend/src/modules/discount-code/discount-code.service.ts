import { Injectable, NotFoundException, ConflictException, BadRequestException } from '@nestjs/common';
import { eq, and, or, ne } from 'drizzle-orm';
import { db } from '@/db';
import { discountCodes, orders } from '@/db/schema';
import { CreateDiscountCodeDto } from './dto/create-discount-code.dto';
import { UpdateDiscountCodeDto } from './dto/update-discount-code.dto';

@Injectable()
export class DiscountCodeService {
  async create(createDiscountCodeDto: CreateDiscountCodeDto) {
    // Check if discount code already exists
    const existingCode = await db.query.discountCodes.findFirst({
      where: eq(discountCodes.code, createDiscountCodeDto.code),
    });

    if (existingCode) {
      throw new ConflictException('Discount code already exists');
    }

    // Validate expiry date
    const expiryDate = new Date(createDiscountCodeDto.expiryDate);
    const now = new Date();

    if (expiryDate <= now) {
      throw new BadRequestException('Expiry date must be in the future');
    }

    const [newDiscountCode] = await db
      .insert(discountCodes)
      .values({
        code: createDiscountCodeDto.code,
        name: createDiscountCodeDto.name,
        discountType: 'percentage',
        discountValue: createDiscountCodeDto.discountValue.toString(),
        maxUsage: createDiscountCodeDto.maxUsage,
        currentUsage: 0,
        expiryDate,
        status: createDiscountCodeDto.status || 'active',
        allowMultiple: createDiscountCodeDto.allowMultiple || false,
      })
      .returning();

    return newDiscountCode;
  }

  async findAll() {
    return db.select().from(discountCodes);
  }

  async findById(id: number) {
    const discountCode = await db.query.discountCodes.findFirst({
      where: eq(discountCodes.id, id),
    });

    if (!discountCode) {
      throw new NotFoundException('Discount code not found');
    }

    return discountCode;
  }

  async update(id: number, updateDiscountCodeDto: UpdateDiscountCodeDto) {
    const discountCode = await this.findById(id);

    // Check if code is being updated and if it conflicts with existing code
    if (updateDiscountCodeDto.code && updateDiscountCodeDto.code !== discountCode.code) {
      const existingCode = await db.query.discountCodes.findFirst({
        where: eq(discountCodes.code, updateDiscountCodeDto.code),
      });

      if (existingCode) {
        throw new ConflictException('Discount code already exists');
      }
    }

    // Validate expiry date if provided
    if (updateDiscountCodeDto.expiryDate) {
      const expiryDate = new Date(updateDiscountCodeDto.expiryDate);
      const now = new Date();

      if (expiryDate <= now) {
        throw new BadRequestException('Expiry date must be in the future');
      }
    }

    const updateData: any = {
      ...updateDiscountCodeDto,
      updatedAt: new Date(),
    };

    // Enforce percentage discount type
    updateData.discountType = 'percentage';

    // Convert expiry date if provided
    if (updateDiscountCodeDto.expiryDate) {
      updateData.expiryDate = new Date(updateDiscountCodeDto.expiryDate);
    }
    if (updateDiscountCodeDto.discountValue !== undefined) {
      updateData.discountValue = updateDiscountCodeDto.discountValue.toString();
    }
    if (updateDiscountCodeDto.allowMultiple === undefined) {
      updateData.allowMultiple = discountCode.allowMultiple || false;
    }

    const [updatedDiscountCode] = await db
      .update(discountCodes)
      .set(updateData)
      .where(eq(discountCodes.id, id))
      .returning();

    return updatedDiscountCode;
  }

  async delete(id: number) {
    await this.findById(id);
    await db.delete(discountCodes).where(eq(discountCodes.id, id));
  }

  async validateCode(code: string, customerEmail?: string, customerPhone?: string) {
    const discountCode = await db.query.discountCodes.findFirst({
      where: eq(discountCodes.code, code),
    });

    if (!discountCode) {
      return {
        valid: false,
        message: 'Discount code not found',
        discountCode: null,
      };
    }

    // Check status
    if (discountCode.status !== 'active') {
      return {
        valid: false,
        message: 'Discount code is not active',
        discountCode: null,
      };
    }

    const now = new Date();

    // Check if expired
    if (now >= discountCode.expiryDate) {
      return {
        valid: false,
        message: 'Discount code has expired',
        discountCode: null,
      };
    }

    // Check usage limit
    if (discountCode.currentUsage >= discountCode.maxUsage) {
      return {
        valid: false,
        message: 'Discount code has reached maximum usage limit',
        discountCode: null,
      };
    }

    // Check per-user usage if allowMultiple is false
    if (!discountCode.allowMultiple && (customerEmail || customerPhone)) {
      const conditions = [];
      if (customerEmail) {
        conditions.push(eq(orders.customerEmail, customerEmail));
      }
      if (customerPhone) {
        conditions.push(eq(orders.customerPhone, customerPhone));
      }

      // Exclude cancelled orders - user can reuse code if previous order was cancelled
      const existingOrder = await db.query.orders.findFirst({
        where: and(
          eq(orders.discountCodeId, discountCode.id),
          ne(orders.status, 'cancelled'),
          or(...conditions),
        ),
      });

      if (existingOrder) {
        return {
          valid: false,
          message: 'You have already used this discount code',
          discountCode: null,
        };
      }
    }

    return {
      valid: true,
      message: 'Discount code is valid',
      discountCode,
    };
  }

  async incrementUsage(id: number) {
    const discountCode = await this.findById(id);

    // Check if usage limit is reached
    if (discountCode.currentUsage >= discountCode.maxUsage) {
      throw new BadRequestException('Discount code has reached maximum usage limit');
    }

    const [updatedDiscountCode] = await db
      .update(discountCodes)
      .set({
        currentUsage: discountCode.currentUsage + 1,
        updatedAt: new Date(),
      })
      .where(eq(discountCodes.id, id))
      .returning();

    return updatedDiscountCode;
  }
}
