-- Migration: Drop menu tables
-- This migration removes all menu-related tables from the database

-- Drop foreign key constraints first
ALTER TABLE IF EXISTS "menu_items" DROP CONSTRAINT IF EXISTS "menu_items_menu_id_menus_id_fk";
ALTER TABLE IF EXISTS "menu_items" DROP CONSTRAINT IF EXISTS "menu_items_parent_id_menu_items_id_fk";

-- Drop the menu_items table
DROP TABLE IF EXISTS "menu_items";

-- Drop the menus table
DROP TABLE IF EXISTS "menus";

-- Drop enum types if they exist
DROP TYPE IF EXISTS "menu_location";
DROP TYPE IF EXISTS "menu_type";

