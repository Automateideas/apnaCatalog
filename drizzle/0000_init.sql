CREATE TABLE "categories" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"shop_id" uuid NOT NULL,
	"parent_id" uuid,
	"name" text NOT NULL,
	"sort" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"shop_id" uuid NOT NULL,
	"category_id" uuid,
	"name" text NOT NULL,
	"description" text,
	"price" integer NOT NULL,
	"mrp" integer,
	"unit" text,
	"image_url" text,
	"in_stock" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "orders" (
	"id" text PRIMARY KEY NOT NULL,
	"shop_id" uuid NOT NULL,
	"customer_name" text,
	"note" text,
	"lines" jsonb NOT NULL,
	"total" integer NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "reviews" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"shop_id" uuid NOT NULL,
	"name" text NOT NULL,
	"phone" text NOT NULL,
	"rating" integer NOT NULL,
	"comment" text,
	"edit_token_hash" text NOT NULL,
	"is_hidden" boolean DEFAULT false NOT NULL,
	"is_reported" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "shops" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"owner_id" uuid NOT NULL,
	"owner_email" text,
	"slug" text NOT NULL,
	"name" text NOT NULL,
	"business_type" text NOT NULL,
	"description" text,
	"city" text NOT NULL,
	"city_slug" text NOT NULL,
	"address" text,
	"phone" text,
	"whatsapp" text NOT NULL,
	"logo_url" text,
	"owner_name" text,
	"owner_photo_url" text,
	"lat" double precision,
	"lng" double precision,
	"maps_url" text,
	"layout" text NOT NULL,
	"palette" text NOT NULL,
	"hide_branding" boolean DEFAULT false NOT NULL,
	"plan" text DEFAULT 'free' NOT NULL,
	"plan_expires_at" timestamp with time zone,
	"is_hidden" boolean DEFAULT false NOT NULL,
	"review_token" text NOT NULL,
	"rating_sum" integer DEFAULT 0 NOT NULL,
	"rating_count" integer DEFAULT 0 NOT NULL,
	"item_count" integer DEFAULT 0 NOT NULL,
	"photo_count" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "categories" ADD CONSTRAINT "categories_shop_id_shops_id_fk" FOREIGN KEY ("shop_id") REFERENCES "public"."shops"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "categories" ADD CONSTRAINT "categories_parent_id_categories_id_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."categories"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "items" ADD CONSTRAINT "items_shop_id_shops_id_fk" FOREIGN KEY ("shop_id") REFERENCES "public"."shops"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "items" ADD CONSTRAINT "items_category_id_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."categories"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "orders" ADD CONSTRAINT "orders_shop_id_shops_id_fk" FOREIGN KEY ("shop_id") REFERENCES "public"."shops"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_shop_id_shops_id_fk" FOREIGN KEY ("shop_id") REFERENCES "public"."shops"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "categories_shop_idx" ON "categories" USING btree ("shop_id");--> statement-breakpoint
CREATE INDEX "items_shop_idx" ON "items" USING btree ("shop_id");--> statement-breakpoint
CREATE INDEX "orders_shop_idx" ON "orders" USING btree ("shop_id","created_at");--> statement-breakpoint
CREATE UNIQUE INDEX "reviews_shop_phone_key" ON "reviews" USING btree ("shop_id","phone");--> statement-breakpoint
CREATE UNIQUE INDEX "shops_slug_key" ON "shops" USING btree ("slug");--> statement-breakpoint
CREATE UNIQUE INDEX "shops_owner_key" ON "shops" USING btree ("owner_id");--> statement-breakpoint
CREATE INDEX "shops_city_idx" ON "shops" USING btree ("city_slug");--> statement-breakpoint
CREATE INDEX "shops_type_idx" ON "shops" USING btree ("business_type");