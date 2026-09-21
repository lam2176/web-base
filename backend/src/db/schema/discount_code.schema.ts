import {
  pgTable,
  serial,
  varchar,
  timestamp,
  decimal,
  integer,
  pgEnum,
  boolean,
} from 'drizzle-orm/pg-core';

export const discountCodeTypeEnum = pgEnum('discount_code_type', ['percentage', 'fixed']);
export const discountCodeStatusEnum = pgEnum('discount_code_status', ['active', 'inactive']);

export const discountCodes = pgTable('discount_codes', {
  id: serial('id').primaryKey(),
  code: varchar('code', { length: 100 }).notNull().unique(),
  name: varchar('name', { length: 255 }).notNull(),
  discountType: discountCodeTypeEnum('discount_code_type').notNull(),
  discountValue: decimal('discount_value', { precision: 12, scale: 2 }).notNull(),
  maxUsage: integer('max_usage').default(1).notNull(), // Maximum number of times code can be used
  currentUsage: integer('current_usage').default(0).notNull(), // Current usage count
  expiryDate: timestamp('expiry_date').notNull(),
  status: discountCodeStatusEnum('status').default('active').notNull(),
  allowMultiple: boolean('allow_multiple').default(false).notNull(), // Allow user to reuse this discount code multiple times
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export type DiscountCode = typeof discountCodes.$inferSelect;
export type NewDiscountCode = typeof discountCodes.$inferInsert;
