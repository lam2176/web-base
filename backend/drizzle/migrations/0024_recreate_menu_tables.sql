-- Migration: Recreate menu tables
-- 0019_drop_menu_tables removed menus/menu_items, but the menu module and schema
-- (src/db/schema/menu.schema.ts) are still in use, so /menus/* queries failed.
-- Written to be idempotent so it is safe on databases that still have the tables.

DO $$ BEGIN
  CREATE TYPE "public"."menu_location" AS ENUM('header', 'footer', 'both', 'mobile', 'admin');
EXCEPTION WHEN duplicate_object THEN null;
END $$;--> statement-breakpoint
ALTER TYPE "public"."menu_location" ADD VALUE IF NOT EXISTS 'mobile';--> statement-breakpoint
ALTER TYPE "public"."menu_location" ADD VALUE IF NOT EXISTS 'admin';--> statement-breakpoint
DO $$ BEGIN
  CREATE TYPE "public"."menu_type" AS ENUM('page', 'product', 'category', 'custom', 'cart', 'account', 'login', 'register', 'profile');
EXCEPTION WHEN duplicate_object THEN null;
END $$;--> statement-breakpoint
ALTER TYPE "public"."menu_type" ADD VALUE IF NOT EXISTS 'cart';--> statement-breakpoint
ALTER TYPE "public"."menu_type" ADD VALUE IF NOT EXISTS 'account';--> statement-breakpoint
ALTER TYPE "public"."menu_type" ADD VALUE IF NOT EXISTS 'login';--> statement-breakpoint
ALTER TYPE "public"."menu_type" ADD VALUE IF NOT EXISTS 'register';--> statement-breakpoint
ALTER TYPE "public"."menu_type" ADD VALUE IF NOT EXISTS 'profile';--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "menus" (
	"id" serial PRIMARY KEY NOT NULL,
	"name_vi" varchar(255) NOT NULL,
	"name_en" varchar(255) NOT NULL,
	"location" "menu_location" NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "menu_items" (
	"id" serial PRIMARY KEY NOT NULL,
	"menu_id" integer NOT NULL,
	"parent_id" integer,
	"label_vi" varchar(255) NOT NULL,
	"label_en" varchar(255) NOT NULL,
	"type" "menu_type" NOT NULL,
	"url" varchar(500),
	"page_slug" varchar(255),
	"category_id" integer,
	"order" integer DEFAULT 0 NOT NULL,
	"open_in_new_tab" boolean DEFAULT false NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"icon_url" varchar(500),
	"icon_type" varchar(50),
	"visible_on_desktop" boolean DEFAULT true NOT NULL,
	"visible_on_mobile" boolean DEFAULT true NOT NULL,
	"requires_auth" boolean DEFAULT false NOT NULL,
	"admin_only" boolean DEFAULT false NOT NULL,
	"meta_title_vi" varchar(255),
	"meta_title_en" varchar(255),
	"meta_description_vi" text,
	"meta_description_en" text,
	"og_image_url" varchar(500),
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
DO $$ BEGIN
  ALTER TABLE "menu_items" ADD CONSTRAINT "menu_items_menu_id_menus_id_fk" FOREIGN KEY ("menu_id") REFERENCES "public"."menus"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN null;
END $$;--> statement-breakpoint
DO $$ BEGIN
  ALTER TABLE "menu_items" ADD CONSTRAINT "menu_items_parent_id_menu_items_id_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."menu_items"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN null;
END $$;
