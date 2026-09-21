DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='pages' AND column_name='order') THEN
        ALTER TABLE "pages" ADD COLUMN "order" integer DEFAULT 0 NOT NULL;
    END IF;
END $$;