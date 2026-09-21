import { pgTable, serial, varchar, timestamp, integer } from 'drizzle-orm/pg-core';

export const media = pgTable('media', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 255 }), // Custom display name for easier search
  filename: varchar('filename', { length: 255 }).notNull(), // Original filename
  filepath: varchar('filepath', { length: 500 }).notNull(),
  mimetype: varchar('mimetype', { length: 100 }).notNull(),
  size: integer('size').notNull(), // in bytes
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export type Media = typeof media.$inferSelect;
export type NewMedia = typeof media.$inferInsert;
