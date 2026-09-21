-- Enable pg_trgm extension first (for Vietnamese text search support)
CREATE EXTENSION IF NOT EXISTS pg_trgm;

--> statement-breakpoint

-- Add generated tsvector column for full-text search
-- This will index nameVi, nameEn, descriptionVi, and descriptionEn
ALTER TABLE "products" ADD COLUMN "search_vector" tsvector
  GENERATED ALWAYS AS (
    setweight(to_tsvector('simple', coalesce(name_vi, '')), 'A') ||
    setweight(to_tsvector('simple', coalesce(name_en, '')), 'A') ||
    setweight(to_tsvector('simple', coalesce(description_vi, '')), 'B') ||
    setweight(to_tsvector('simple', coalesce(description_en, '')), 'B') ||
    setweight(to_tsvector('simple', coalesce(slug, '')), 'C')
  ) STORED;

--> statement-breakpoint

-- Create GIN index for fast full-text search
CREATE INDEX "products_search_vector_idx" ON "products" USING GIN ("search_vector");

--> statement-breakpoint

-- Optional: Add trigram index on individual text columns for fuzzy matching
CREATE INDEX "products_name_vi_idx" ON "products" USING gin (name_vi gin_trgm_ops);

--> statement-breakpoint

CREATE INDEX "products_name_en_idx" ON "products" USING gin (name_en gin_trgm_ops);
