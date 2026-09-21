import { pgTable, serial, varchar, integer, boolean, timestamp, pgEnum, text } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

export const menuLocationEnum = pgEnum('menu_location', ['header', 'footer', 'both', 'mobile', 'admin']);
export const menuTypeEnum = pgEnum('menu_type', ['page', 'product', 'category', 'custom', 'cart', 'account', 'login', 'register', 'profile']);

export const menus = pgTable('menus', {
  id: serial('id').primaryKey(),
  nameVi: varchar('name_vi', { length: 255 }).notNull(),
  nameEn: varchar('name_en', { length: 255 }).notNull(),
  location: menuLocationEnum('location').notNull(),
  isActive: boolean('is_active').default(true).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const menuItems = pgTable('menu_items', {
  id: serial('id').primaryKey(),
  menuId: integer('menu_id')
    .references(() => menus.id, { onDelete: 'cascade' })
    .notNull(),
  parentId: integer('parent_id')
    .references(() => menuItems.id, { onDelete: 'cascade' }),
  labelVi: varchar('label_vi', { length: 255 }).notNull(),
  labelEn: varchar('label_en', { length: 255 }).notNull(),
  type: menuTypeEnum('type').notNull(),
  url: varchar('url', { length: 500 }),
  pageSlug: varchar('page_slug', { length: 255 }),
  categoryId: integer('category_id'),
  order: integer('order').default(0).notNull(),
  openInNewTab: boolean('open_in_new_tab').default(false).notNull(),
  isActive: boolean('is_active').default(true).notNull(),
  
  // Icon/Image fields
  iconUrl: varchar('icon_url', { length: 500 }),
  iconType: varchar('icon_type', { length: 50 }), // 'lucide', 'svg', 'image'
  
  // Visibility rules
  visibleOnDesktop: boolean('visible_on_desktop').default(true).notNull(),
  visibleOnMobile: boolean('visible_on_mobile').default(true).notNull(),
  requiresAuth: boolean('requires_auth').default(false).notNull(),
  adminOnly: boolean('admin_only').default(false).notNull(),
  
  // SEO fields (cho menu trỏ tới page hoặc category)
  metaTitleVi: varchar('meta_title_vi', { length: 255 }),
  metaTitleEn: varchar('meta_title_en', { length: 255 }),
  metaDescriptionVi: text('meta_description_vi'),
  metaDescriptionEn: text('meta_description_en'),
  ogImageUrl: varchar('og_image_url', { length: 500 }),
  
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const menusRelations = relations(menus, ({ many }) => ({
  items: many(menuItems),
}));

export const menuItemsRelations = relations(menuItems, ({ one, many }) => ({
  menu: one(menus, {
    fields: [menuItems.menuId],
    references: [menus.id],
  }),
  parent: one(menuItems, {
    fields: [menuItems.parentId],
    references: [menuItems.id],
    relationName: 'menu_item_parent',
  }),
  children: many(menuItems, {
    relationName: 'menu_item_parent',
  }),
}));

export type Menu = typeof menus.$inferSelect;
export type NewMenu = typeof menus.$inferInsert;
export type MenuItem = typeof menuItems.$inferSelect;
export type NewMenuItem = typeof menuItems.$inferInsert;

