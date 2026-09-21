ALTER TABLE "media" ADD COLUMN "name" varchar(255);--> statement-breakpoint
ALTER TABLE "media" ADD COLUMN "updated_at" timestamp DEFAULT now() NOT NULL;