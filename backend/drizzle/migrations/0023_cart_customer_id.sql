-- Migration: Change carts.user_id to carts.customer_id
-- This fixes the foreign key reference from users (admin) table to customers table

-- Drop existing foreign key constraint if exists
ALTER TABLE "carts" DROP CONSTRAINT IF EXISTS "carts_user_id_users_id_fk";

-- Rename column from user_id to customer_id
ALTER TABLE "carts" RENAME COLUMN "user_id" TO "customer_id";

-- Add new foreign key constraint to customers table
ALTER TABLE "carts" ADD CONSTRAINT "carts_customer_id_customers_id_fk"
  FOREIGN KEY ("customer_id") REFERENCES "customers"("id") ON DELETE CASCADE ON UPDATE NO ACTION;
