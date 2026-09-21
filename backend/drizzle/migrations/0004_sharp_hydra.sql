ALTER TABLE "store_info" RENAME COLUMN "bank_info" TO "bank_name";--> statement-breakpoint
ALTER TABLE "store_info" ADD COLUMN "bank_account_number" varchar(50);--> statement-breakpoint
ALTER TABLE "store_info" ADD COLUMN "bank_account_name" varchar(255);