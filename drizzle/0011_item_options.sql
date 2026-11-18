ALTER TABLE "items" ADD COLUMN "max_price" integer;--> statement-breakpoint
ALTER TABLE "items" ADD COLUMN "options" jsonb DEFAULT '[]'::jsonb NOT NULL;