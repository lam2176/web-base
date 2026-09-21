-- Manual migration to add new columns to pages table
-- Run this in your database client or pgAdmin

ALTER TABLE pages ADD COLUMN IF NOT EXISTS keywords text;
ALTER TABLE pages ADD COLUMN IF NOT EXISTS featured_image_id integer;
ALTER TABLE pages ADD COLUMN IF NOT EXISTS featured_video_id integer;
ALTER TABLE pages ADD COLUMN IF NOT EXISTS featured_image_alt varchar(255);

-- Add foreign key constraints
ALTER TABLE pages ADD CONSTRAINT IF NOT EXISTS pages_featured_image_id_media_id_fk 
  FOREIGN KEY (featured_image_id) REFERENCES media(id) ON DELETE SET NULL;

ALTER TABLE pages ADD CONSTRAINT IF NOT EXISTS pages_featured_video_id_media_id_fk 
  FOREIGN KEY (featured_video_id) REFERENCES media(id) ON DELETE SET NULL;

-- Verify columns were added
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'pages' 
ORDER BY ordinal_position;

