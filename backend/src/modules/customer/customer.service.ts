import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { db } from '@/db';
import { customers } from '@/db/schema';
import { eq, sql, desc } from 'drizzle-orm';
import { orders } from '@/db/schema/order.schema';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { ChangePasswordDto } from './dto/change-password.dto';

@Injectable()
export class CustomerService {
  /**
   * Get customer profile by ID
   */
  async getProfile(customerId: number) {
    const customer = await db.query.customers.findFirst({
      where: eq(customers.id, customerId),
    });

    if (!customer) {
      throw new NotFoundException('Customer not found');
    }

    // Don't return password
    const { password, ...customerData } = customer;
    return customerData;
  }

  /**
   * Update customer profile
   */
  async updateProfile(customerId: number, updateProfileDto: UpdateProfileDto) {
    const customer = await db.query.customers.findFirst({
      where: eq(customers.id, customerId),
    });

    if (!customer) {
      throw new NotFoundException('Customer not found');
    }

    const [updatedCustomer] = await db
      .update(customers)
      .set({
        ...updateProfileDto,
        updatedAt: new Date(),
      })
      .where(eq(customers.id, customerId))
      .returning();

    // Don't return password
    const { password, ...customerData } = updatedCustomer;
    return customerData;
  }

  /**
   * Change customer password
   */
  async changePassword(customerId: number, changePasswordDto: ChangePasswordDto) {
    const customer = await db.query.customers.findFirst({
      where: eq(customers.id, customerId),
    });

    if (!customer) {
      throw new NotFoundException('Customer not found');
    }

    // Verify current password
    const isPasswordValid = await bcrypt.compare(
      changePasswordDto.currentPassword,
      customer.password,
    );

    if (!isPasswordValid) {
      throw new BadRequestException('Current password is incorrect');
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(changePasswordDto.newPassword, 10);

    // Update password
    await db
      .update(customers)
      .set({
        password: hashedPassword,
        updatedAt: new Date(),
      })
      .where(eq(customers.id, customerId));

    return { message: 'Password changed successfully' };
  }

  /**
   * Deactivate customer account
   */
  async deactivateAccount(customerId: number) {
    await db
      .update(customers)
      .set({
        isActive: false,
        updatedAt: new Date(),
      })
      .where(eq(customers.id, customerId));

    return { message: 'Account deactivated successfully' };
  }

  /**
   * Update customer info from admin panel
   */
  async adminUpdateCustomer(
    customerId: number,
    data: Partial<{ fullName: string; phoneNumber?: string; email?: string; isActive?: boolean }> ,
  ) {
    const existingCustomer = await db.query.customers.findFirst({
      where: eq(customers.id, customerId),
    });

    if (!existingCustomer) {
      throw new NotFoundException('Customer not found');
    }

    const { email, ...rest } = data;

    // Check if email is being changed and if it's already taken by another customer
    if (email && email !== existingCustomer.email) {
      const emailExists = await db.query.customers.findFirst({
        where: eq(customers.email, email),
      });

      if (emailExists && emailExists.id !== customerId) {
        throw new BadRequestException('Email is already in use by another customer');
      }
    }

    await db
      .update(customers)
      .set({
        ...rest,
        ...(email && { email }),
        updatedAt: new Date(),
      })
      .where(eq(customers.id, customerId));

    return this.getAdminCustomerById(customerId);
  }

  /**
   * Get customer statistics for admin dashboard
   */
  async getAdminCustomerStats() {
    const customerStats = await this.baseCustomerStatsQuery();
    return customerStats.map((customer) => this.mapCustomerStats(customer));
  }

  async getAdminCustomerById(customerId: number) {
    const stats = await this.baseCustomerStatsQuery(customerId);
    if (stats.length === 0) {
      throw new NotFoundException('Customer not found');
    }
    return this.mapCustomerStats(stats[0]);
  }

  private baseCustomerStatsQuery(customerId?: number) {
    const query = db
      .select({
        id: customers.id,
        fullName: customers.fullName,
        email: customers.email,
        phoneNumber: customers.phoneNumber,
        totalOrders: sql<number>`COUNT(${orders.id})`,
        totalSpent: sql<string>`COALESCE(SUM(${orders.total}), '0')`,
        lastOrderAt: sql<Date | null>`MAX(${orders.createdAt})`,
        createdAt: customers.createdAt,
        isActive: customers.isActive,
      })
      .from(customers)
      .leftJoin(orders, eq(orders.customerId, customers.id))
      .groupBy(customers.id, customers.createdAt, customers.isActive)
      .orderBy(desc(sql`MAX(${orders.createdAt})`), desc(customers.createdAt));

    if (customerId) {
      return query.where(eq(customers.id, customerId));
    }

    return query;
  }

  private mapCustomerStats(customer: {
    id: number;
    fullName: string;
    email: string;
    phoneNumber: string | null;
    totalOrders: number;
    totalSpent: string;
    lastOrderAt: Date | null;
    isActive: boolean;
  }) {
    return {
      id: customer.id,
      fullName: customer.fullName,
      email: customer.email,
      phoneNumber: customer.phoneNumber,
      totalOrders: Number(customer.totalOrders ?? 0),
      totalSpent: Number(customer.totalSpent ?? 0),
      lastOrderAt: customer.lastOrderAt ? new Date(customer.lastOrderAt) : null,
      isActive: customer.isActive,
    };
  }
}
