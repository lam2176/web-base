import {
  pgTable,
  serial,
  varchar,
  timestamp,
  decimal,
  json,
  pgEnum,
  boolean,
} from 'drizzle-orm/pg-core';

export const discountTypeEnum = pgEnum('discount_type', ['percentage', 'fixed']);
export const couponApplyToEnum = pgEnum('coupon_apply_to', ['all', 'category']);
export const couponStatusEnum = pgEnum('coupon_status', ['active', 'inactive']);

export const coupons = pgTable('coupons', {
  id: serial('id').primaryKey(),
  code: varchar('code', { length: 100 }).notNull().unique(),
  nameVi: varchar('name_vi', { length: 255 }).notNull(),
  nameEn: varchar('name_en', { length: 255 }).notNull(),
  discountType: discountTypeEnum('discount_type').notNull(),
  discountValue: decimal('discount_value', { precision: 12, scale: 2 }).notNull(),
  startDate: timestamp('start_date').notNull(),
  endDate: timestamp('end_date').notNull(),
  applyTo: couponApplyToEnum('apply_to').default('all').notNull(),
  categoryIds: json('category_ids').$type<number[]>(), // Array of category IDs
  status: couponStatusEnum('status').default('active').notNull(),
  allowMultiple: boolean('allow_multiple').default(false).notNull(), // Allow using multiple coupons together
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export type Coupon = typeof coupons.$inferSelect;
export type NewCoupon = typeof coupons.$inferInsert;
