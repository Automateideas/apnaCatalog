-- The app reads and writes these tables only from the server, through Drizzle.
-- Row level security with no policies blocks every request made with the public
-- Supabase key, so nobody can read phone numbers or change data from a browser.
ALTER TABLE "shops" ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
ALTER TABLE "categories" ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
ALTER TABLE "items" ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
ALTER TABLE "reviews" ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
ALTER TABLE "orders" ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_rating_check" CHECK ("rating" BETWEEN 1 AND 5);
--> statement-breakpoint
ALTER TABLE "items" ADD CONSTRAINT "items_price_check" CHECK ("price" >= 0);
--> statement-breakpoint
-- Photo storage. Runs only on Supabase (skipped on a plain Postgres database).
-- Each signed-in user may upload only into a folder named after their own user id.
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'storage' AND table_name = 'buckets') THEN
    EXECUTE $q$
      INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
      VALUES ('shop-media', 'shop-media', true, 2097152, ARRAY['image/webp', 'image/jpeg'])
      ON CONFLICT (id) DO UPDATE
        SET public = EXCLUDED.public,
            file_size_limit = EXCLUDED.file_size_limit,
            allowed_mime_types = EXCLUDED.allowed_mime_types
    $q$;

    EXECUTE 'DROP POLICY IF EXISTS "shop-media owner insert" ON storage.objects';
    EXECUTE 'DROP POLICY IF EXISTS "shop-media owner update" ON storage.objects';
    EXECUTE 'DROP POLICY IF EXISTS "shop-media owner delete" ON storage.objects';

    EXECUTE $q$
      CREATE POLICY "shop-media owner insert" ON storage.objects
      FOR INSERT TO authenticated
      WITH CHECK (bucket_id = 'shop-media' AND (storage.foldername(name))[1] = auth.uid()::text)
    $q$;
    EXECUTE $q$
      CREATE POLICY "shop-media owner update" ON storage.objects
      FOR UPDATE TO authenticated
      USING (bucket_id = 'shop-media' AND (storage.foldername(name))[1] = auth.uid()::text)
    $q$;
    EXECUTE $q$
      CREATE POLICY "shop-media owner delete" ON storage.objects
      FOR DELETE TO authenticated
      USING (bucket_id = 'shop-media' AND (storage.foldername(name))[1] = auth.uid()::text)
    $q$;
  END IF;
END
$$;
