CREATE TABLE "page_views" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"shop_id" uuid NOT NULL,
	"path" text NOT NULL,
	"referrer" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "shops" ADD COLUMN "instagram" text;--> statement-breakpoint
ALTER TABLE "shops" ADD COLUMN "facebook" text;--> statement-breakpoint
ALTER TABLE "shops" ADD COLUMN "youtube" text;--> statement-breakpoint
ALTER TABLE "shops" ADD COLUMN "business_hours" jsonb;--> statement-breakpoint
ALTER TABLE "shops" ADD COLUMN "announcement" text;--> statement-breakpoint
ALTER TABLE "shops" ADD COLUMN "announcement_active" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "page_views" ADD CONSTRAINT "page_views_shop_id_shops_id_fk" FOREIGN KEY ("shop_id") REFERENCES "public"."shops"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "page_views_shop_idx" ON "page_views" USING btree ("shop_id","created_at");