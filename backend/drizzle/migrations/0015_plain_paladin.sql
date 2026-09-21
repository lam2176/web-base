ALTER TABLE "pages" ADD COLUMN "meta_keywords" text;--> statement-breakpoint
ALTER TABLE "pages" ADD COLUMN "featured_image" varchar(500);--> statement-breakpoint
ALTER TABLE "pages" ADD COLUMN "featured_image_alt" varchar(255);--> statement-breakpoint
ALTER TABLE "pages" ADD COLUMN "video_url" varchar(500);