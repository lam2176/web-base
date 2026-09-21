import { pgTable, serial, varchar, text, timestamp, integer, pgEnum, boolean } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { media } from './media.schema';

export const statusEnum = pgEnum('status', ['active', 'inactive']);

export const categories = pgTable('categories', {
  id: serial('id').primaryKey(),
  slug: varchar('slug', { length: 255 }).notNull().unique(),
  nameVi: varchar('name_vi', { length: 255 }).notNull(),
  nameEn: varchar('name_en', { length: 255 }).notNull(),
  descriptionVi: text('description_vi'),
  descriptionEn: text('description_en'),
  image: varchar('image', { length: 500 }), // Keep for backward compatibility
  parentId: integer('parent_id'),
  order: integer('order').default(0),
  status: statusEnum('status').default('active').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const categoryImages = pgTable('category_images', {
  id: serial('id').primaryKey(),
  categoryId: integer('category_id')
    .references(() => categories.id, { onDelete: 'cascade' })
    .notNull(),
  mediaId: integer('media_id')
    .references(() => media.id, { onDelete: 'cascade' })
    .notNull(),
  order: integer('order').default(0),
  isPrimary: boolean('is_primary').default(false),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// Relations
export const categoriesRelations = relations(categories, ({ one, many }) => ({
  parent: one(categories, {
    fields: [categories.parentId],
    references: [categories.id],
    relationName: 'parent',
  }),
  children: many(categories, {
    relationName: 'parent',
  }),
  categoryImages: many(categoryImages),
}));

export const categoryImagesRelations = relations(categoryImages, ({ one }) => ({
  category: one(categories, {
    fields: [categoryImages.categoryId],
    references: [categories.id],
  }),
  media: one(media, {
    fields: [categoryImages.mediaId],
    references: [media.id],
  }),
}));

export type Category = typeof categories.$inferSelect;
export type NewCategory = typeof categories.$inferInsert;
export type CategoryImage = typeof categoryImages.$inferSelect;
export type NewCategoryImage = typeof categoryImages.$inferInsert;
