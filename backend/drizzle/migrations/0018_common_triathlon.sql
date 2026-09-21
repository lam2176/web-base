ALTER TYPE "public"."menu_location" ADD VALUE 'mobile';--> statement-breakpoint
ALTER TYPE "public"."menu_location" ADD VALUE 'admin';--> statement-breakpoint
ALTER TYPE "public"."menu_type" ADD VALUE 'cart';--> statement-breakpoint
ALTER TYPE "public"."menu_type" ADD VALUE 'account';--> statement-breakpoint
ALTER TYPE "public"."menu_type" ADD VALUE 'login';--> statement-breakpoint
ALTER TYPE "public"."menu_type" ADD VALUE 'register';--> statement-breakpoint
ALTER TYPE "public"."menu_type" ADD VALUE 'profile';--> statement-breakpoint
ALTER TABLE "menu_items" ADD COLUMN "icon_url" varchar(500);--> statement-breakpoint
ALTER TABLE "menu_items" ADD COLUMN "icon_type" varchar(50);--> statement-breakpoint
ALTER TABLE "menu_items" ADD COLUMN "visible_on_desktop" boolean DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE "menu_items" ADD COLUMN "visible_on_mobile" boolean DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE "menu_items" ADD COLUMN "requires_auth" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "menu_items" ADD COLUMN "admin_only" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "menu_items" ADD COLUMN "meta_title_vi" varchar(255);--> statement-breakpoint
ALTER TABLE "menu_items" ADD COLUMN "meta_title_en" varchar(255);--> statement-breakpoint
ALTER TABLE "menu_items" ADD COLUMN "meta_description_vi" text;--> statement-breakpoint
ALTER TABLE "menu_items" ADD COLUMN "meta_description_en" text;--> statement-breakpoint
ALTER TABLE "menu_items" ADD COLUMN "og_image_url" varchar(500);--> statement-breakpoint
ALTER TABLE "menu_items" ADD COLUMN "updated_at" timestamp DEFAULT now() NOT NULL;