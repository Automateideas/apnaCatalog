ALTER TABLE "items" ADD COLUMN "listing" text;--> statement-breakpoint
ALTER TABLE "items" ADD COLUMN "details" jsonb DEFAULT '[]'::jsonb NOT NULL;--> statement-breakpoint
ALTER TABLE "shops" ADD COLUMN "rera_number" text;