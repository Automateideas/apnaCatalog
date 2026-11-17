ALTER TABLE "shops" ADD COLUMN "invited_by" uuid;--> statement-breakpoint
ALTER TABLE "shops" ADD COLUMN "invite_rewarded_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "shops" ADD CONSTRAINT "shops_invited_by_shops_id_fk" FOREIGN KEY ("invited_by") REFERENCES "public"."shops"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "shops_invited_by_idx" ON "shops" USING btree ("invited_by");