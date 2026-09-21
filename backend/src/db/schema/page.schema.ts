import { pgTable, serial, varchar, text, timestamp, pgEnum, integer, boolean } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { media } from './media.schema';

export const pageStatusEnum = pgEnum('page_status', ['active', 'inactive']);

export const pages = pgTable('pages', {
  id: serial('id').primaryKey(),
  slug: varchar('slug', { length: 255 }).notNull().unique(),
  titleVi: varchar('title_vi', { length: 255 }).notNull(),
  titleEn: varchar('title_en', { length: 255 }).notNull(),
  contentVi: text('content_vi'),
  contentEn: text('content_en'),
  metaTitle: varchar('meta_title', { length: 255 }),
  metaDescription: text('meta_description'),
  keywords: text('keywords'),
  featuredImageId: integer('featured_image_id')
    .references(() => media.id, { onDelete: 'set null' }),
  featuredVideoId: integer('featured_video_id')
    .references(() => media.id, { onDelete: 'set null' }),
  featuredImageAlt: varchar('featured_image_alt', { length: 255 }),
  showInMenu: boolean('show_in_menu').default(false).notNull(),
  status: pageStatusEnum('status').default('active').notNull(),
  order: integer('order').default(0).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const pagesRelations = relations(pages, ({ one }) => ({
  featuredImage: one(media, {
    fields: [pages.featuredImageId],
    references: [media.id],
    relationName: 'page_featured_image',
  }),
  featuredVideo: one(media, {
    fields: [pages.featuredVideoId],
    references: [media.id],
    relationName: 'page_featured_video',
  }),
}));

export type Page = typeof pages.$inferSelect;
export type NewPage = typeof pages.$inferInsert;
