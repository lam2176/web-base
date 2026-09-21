import { pgTable, serial, varchar, integer, timestamp, pgEnum } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { media } from './media.schema';

export const bannerStatusEnum = pgEnum('banner_status', ['active', 'inactive']);

export const banners = pgTable('banners', {
  id: serial('id').primaryKey(),
  titleVi: varchar('title_vi', { length: 255 }),
  titleEn: varchar('title_en', { length: 255 }),
  subtitleVi: varchar('subtitle_vi', { length: 500 }),
  subtitleEn: varchar('subtitle_en', { length: 500 }),
  imageId: integer('image_id')
    .references(() => media.id, { onDelete: 'set null' }),
  link: varchar('link', { length: 500 }),
  order: integer('order').default(0),
  status: bannerStatusEnum('status').default('active').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const bannersRelations = relations(banners, ({ one }) => ({
  image: one(media, {
    fields: [banners.imageId],
    references: [media.id],
  }),
}));

export type Banner = typeof banners.$inferSelect;
export type NewBanner = typeof banners.$inferInsert;
