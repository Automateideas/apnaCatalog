ALTER TABLE "items" ADD COLUMN "image_urls" text[] DEFAULT '{}'::text[] NOT NULL;
--> statement-breakpoint
-- Items that already had one photo keep it as their main photo.
UPDATE "items" SET "image_urls" = ARRAY["image_url"] WHERE "image_url" IS NOT NULL;
