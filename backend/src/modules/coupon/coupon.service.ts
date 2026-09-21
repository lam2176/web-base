import { Injectable, NotFoundException, ConflictException, BadRequestException } from '@nestjs/common';
import { eq, and, gte, lte } from 'drizzle-orm';
import { db } from '@/db';
import { coupons } from '@/db/schema';
import { CreateCouponDto } from './dto/create-coupon.dto';
import { UpdateCouponDto } from './dto/update-coupon.dto';

@Injectable()
export class CouponService {
  /**
   * Check if two date ranges overlap
   * Two ranges [start1, end1] and [start2, end2] overlap if:
   * start1 <= end2 AND start2 <= end1
   */
  private dateRangesOverlap(
    start1: Date,
    end1: Date,
    start2: Date,
    end2: Date,
  ): boolean {
    return start1 <= end2 && start2 <= end1;
  }

  /**
   * Check if there are any active coupons with overlapping date ranges
   */
  private async checkDateOverlap(
    startDate: Date,
    endDate: Date,
    excludeCouponId?: number,
  ): Promise<boolean> {
    // Get all active coupons (excluding the current one if updating)
    const allCoupons = await db.query.coupons.findMany({
      where: eq(coupons.status, 'active'),
    });

    // Filter out the coupon being updated
    const couponsToCheck = excludeCouponId
      ? allCoupons.filter((c) => c.id !== excludeCouponId)
      : allCoupons;

    // Check if any coupon has overlapping date range
    for (const coupon of couponsToCheck) {
      if (
        this.dateRangesOverlap(
          startDate,
          endDate,
          coupon.startDate,
          coupon.endDate,
        )
      ) {
        return true;
      }
    }

    return false;
  }
  async create(createCouponDto: CreateCouponDto) {
    // Check if coupon code already exists
    const existingCoupon = await db.query.coupons.findFirst({
      where: eq(coupons.code, createCouponDto.code),
    });

    if (existingCoupon) {
      throw new ConflictException('Coupon with this code already exists');
    }

    // Validate categoryIds if applyTo is 'category'
    if (createCouponDto.applyTo === 'category') {
      if (!createCouponDto.categoryIds || createCouponDto.categoryIds.length === 0) {
        throw new BadRequestException('categoryIds is required when applyTo is "category"');
      }
    }

    // Validate dates
    const startDate = new Date(createCouponDto.startDate);
    const endDate = new Date(createCouponDto.endDate);

    if (startDate >= endDate) {
      throw new BadRequestException('End date must be after start date');
    }

    // Check if status is active, then validate date overlap
    const status = createCouponDto.status || 'active';
    if (status === 'active') {
      const hasOverlap = await this.checkDateOverlap(startDate, endDate);
      if (hasOverlap) {
        throw new ConflictException(
          'There is already an active coupon in this time period. Only one active coupon is allowed at a time.',
        );
      }
    }

    const [newCoupon] = await db
      .insert(coupons)
      .values({
        code: createCouponDto.code,
        nameVi: createCouponDto.nameVi,
        nameEn: createCouponDto.nameEn,
        discountType: createCouponDto.discountType,
        discountValue: createCouponDto.discountValue.toString(),
        startDate,
        endDate,
        applyTo: createCouponDto.applyTo || 'all',
        categoryIds: createCouponDto.categoryIds || null,
        status,
        allowMultiple: createCouponDto.allowMultiple || false,
      })
      .returning();

    return newCoupon;
  }

  async findAll() {
    return db.select().from(coupons);
  }

  async findActive() {
    const now = new Date();

    return db
      .select()
      .from(coupons)
      .where(
        and(
          eq(coupons.status, 'active'),
          lte(coupons.startDate, now),
          gte(coupons.endDate, now),
        ),
      );
  }

  async findById(id: number) {
    const coupon = await db.query.coupons.findFirst({
      where: eq(coupons.id, id),
    });

    if (!coupon) {
      throw new NotFoundException('Coupon not found');
    }

    return coupon;
  }

  async update(id: number, updateCouponDto: UpdateCouponDto) {
    const coupon = await this.findById(id);

    // Check if code is being updated and if it conflicts with existing coupon
    if (updateCouponDto.code && updateCouponDto.code !== coupon.code) {
      const existingCoupon = await db.query.coupons.findFirst({
        where: eq(coupons.code, updateCouponDto.code),
      });

      if (existingCoupon) {
        throw new ConflictException('Coupon with this code already exists');
      }
    }

    // Validate categoryIds if applyTo is 'category'
    if (updateCouponDto.applyTo === 'category') {
      if (!updateCouponDto.categoryIds || updateCouponDto.categoryIds.length === 0) {
        throw new BadRequestException('categoryIds is required when applyTo is "category"');
      }
    }

    // Validate dates if both are provided
    let startDate: Date | undefined;
    let endDate: Date | undefined;
    
    if (updateCouponDto.startDate && updateCouponDto.endDate) {
      startDate = new Date(updateCouponDto.startDate);
      endDate = new Date(updateCouponDto.endDate);

      if (startDate >= endDate) {
        throw new BadRequestException('End date must be after start date');
      }
    } else if (updateCouponDto.startDate) {
      startDate = new Date(updateCouponDto.startDate);
      endDate = coupon.endDate;
    } else if (updateCouponDto.endDate) {
      startDate = coupon.startDate;
      endDate = new Date(updateCouponDto.endDate);
    } else {
      startDate = coupon.startDate;
      endDate = coupon.endDate;
    }

    // Check if status is being updated to active or is already active
    const newStatus = updateCouponDto.status !== undefined ? updateCouponDto.status : coupon.status;
    if (newStatus === 'active' && startDate && endDate) {
      const hasOverlap = await this.checkDateOverlap(startDate, endDate, id);
      if (hasOverlap) {
        throw new ConflictException(
          'There is already an active coupon in this time period. Only one active coupon is allowed at a time.',
        );
      }
    }

    const updateData: any = {
      ...updateCouponDto,
      updatedAt: new Date(),
    };

    // Convert dates if provided
    if (updateCouponDto.startDate) {
      updateData.startDate = new Date(updateCouponDto.startDate);
    }
    if (updateCouponDto.endDate) {
      updateData.endDate = new Date(updateCouponDto.endDate);
    }
    if (updateCouponDto.discountValue !== undefined) {
      updateData.discountValue = updateCouponDto.discountValue.toString();
    }

    const [updatedCoupon] = await db
      .update(coupons)
      .set(updateData)
      .where(eq(coupons.id, id))
      .returning();

    return updatedCoupon;
  }

  async delete(id: number) {
    await this.findById(id);
    await db.delete(coupons).where(eq(coupons.id, id));
  }

  async findActiveByCode(code: string) {
    const now = new Date();
    const coupon = await db.query.coupons.findFirst({
      where: and(
        eq(coupons.code, code),
        eq(coupons.status, 'active'),
        lte(coupons.startDate, now),
        gte(coupons.endDate, now),
      ),
    });

    if (!coupon) {
      throw new NotFoundException('Coupon not found or inactive');
    }

    return coupon;
  }

  async validateCoupon(code: string) {
    const coupon = await db.query.coupons.findFirst({
      where: eq(coupons.code, code),
    });

    if (!coupon) {
      return {
        valid: false,
        message: 'Coupon not found',
        coupon: null,
      };
    }

    // Check status
    if (coupon.status !== 'active') {
      return {
        valid: false,
        message: 'Coupon is not active',
        coupon: null,
      };
    }

    const now = new Date();

    // Check if current date is between startDate and endDate
    if (now < coupon.startDate) {
      return {
        valid: false,
        message: 'Coupon has not started yet',
        coupon: null,
      };
    }

    if (now > coupon.endDate) {
      return {
        valid: false,
        message: 'Coupon has expired',
        coupon: null,
      };
    }

    return {
      valid: true,
      message: 'Coupon is valid',
      coupon,
    };
  }
}
