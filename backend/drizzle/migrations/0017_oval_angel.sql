DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='pages' AND column_name='keywords') THEN
        ALTER TABLE "pages" ADD COLUMN "keywords" text;
    END IF;
END $$;--> statement-breakpoint
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='pages' AND column_name='featured_image_id') THEN
        ALTER TABLE "pages" ADD COLUMN "featured_image_id" integer;
    END IF;
END $$;--> statement-breakpoint
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='pages' AND column_name='featured_video_id') THEN
        ALTER TABLE "pages" ADD COLUMN "featured_video_id" integer;
    END IF;
END $$;--> statement-breakpoint
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='pages' AND column_name='featured_image_alt') THEN
        ALTER TABLE "pages" ADD COLUMN "featured_image_alt" varchar(255);
    END IF;
END $$;--> statement-breakpoint
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name='pages_featured_image_id_media_id_fk') THEN
        ALTER TABLE "pages" ADD CONSTRAINT "pages_featured_image_id_media_id_fk" FOREIGN KEY ("featured_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
    END IF;
END $$;--> statement-breakpoint
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name='pages_featured_video_id_media_id_fk') THEN
        ALTER TABLE "pages" ADD CONSTRAINT "pages_featured_video_id_media_id_fk" FOREIGN KEY ("featured_video_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
    END IF;
END $$;