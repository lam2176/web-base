import { pgTable, serial, integer, varchar, text, timestamp } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { orders } from './order.schema';
import { users } from './user.schema';

export const orderStatusHistory = pgTable('order_status_history', {
  id: serial('id').primaryKey(),
  orderId: integer('order_id')
    .notNull()
    .references(() => orders.id, { onDelete: 'cascade' }),
  type: varchar('type', { length: 20 }).default('status').notNull(), // 'status' or 'payment_status'
  status: varchar('status', { length: 50 }).notNull(), // pending, confirmed, shipping, completed, cancelled, unpaid, paid, refunded
  note: text('note'), // Optional note about the status change
  changedBy: varchar('changed_by', { length: 100 }), // Who made the change (e.g., "admin", "system", admin email)
  changedByUserId: integer('changed_by_user_id').references(() => users.id, { onDelete: 'set null' }), // Reference to admin user if applicable
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const orderStatusHistoryRelations = relations(orderStatusHistory, ({ one }) => ({
  order: one(orders, {
    fields: [orderStatusHistory.orderId],
    references: [orders.id],
  }),
  changedByUser: one(users, {
    fields: [orderStatusHistory.changedByUserId],
    references: [users.id],
  }),
}));

export type OrderStatusHistory = typeof orderStatusHistory.$inferSelect;
export type NewOrderStatusHistory = typeof orderStatusHistory.$inferInsert;
