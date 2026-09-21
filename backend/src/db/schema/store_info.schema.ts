import { pgTable, serial, varchar, text, integer, decimal, json, timestamp } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { media } from './media.schema';

export const storeInfo = pgTable('store_info', {
  id: serial('id').primaryKey(),
  nameVi: varchar('name_vi', { length: 255 }).notNull(),
  nameEn: varchar('name_en', { length: 255 }).notNull(),
  logoId: integer('logo_id').references(() => media.id, { onDelete: 'set null' }),
  bankQrId: integer('bank_qr_id').references(() => media.id, { onDelete: 'set null' }),
  address: text('address'),
  hotline: varchar('hotline', { length: 50 }),
  email: varchar('email', { length: 255 }),
  descriptionVi: text('description_vi'),
  descriptionEn: text('description_en'),
  currency: varchar('currency', { length: 10 }).default('VND').notNull(), // VND, USD, etc.
  shippingFee: decimal('shipping_fee', { precision: 12, scale: 2 }).default('0').notNull(),
  bankName: varchar('bank_name', { length: 255 }), // Bank name (e.g., Vietcombank, BIDV)
  bankAccountNumber: varchar('bank_account_number', { length: 50 }), // Bank account number
  bankAccountName: varchar('bank_account_name', { length: 255 }), // Account holder name
  socialLinks: json('social_links').$type<{
    facebook?: string;
    instagram?: string;
    tiktok?: string;
    youtube?: string;
  }>(),
  mapUrl: text('map_url'), // Google Maps embed URL (Vietnamese)
  mapUrlEn: text('map_url_en'), // Google Maps embed URL (English)
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const storeInfoRelations = relations(storeInfo, ({ one }) => ({
  logo: one(media, {
    fields: [storeInfo.logoId],
    references: [media.id],
  }),
  bankQr: one(media, {
    fields: [storeInfo.bankQrId],
    references: [media.id],
  }),
}));

export type StoreInfo = typeof storeInfo.$inferSelect;
export type NewStoreInfo = typeof storeInfo.$inferInsert;
