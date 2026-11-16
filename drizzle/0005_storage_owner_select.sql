-- Deleting a photo through the storage API needs permission to read the file's row
-- as well as to delete it. Without this, deletes quietly remove nothing.
-- A signed-in user may read (and so delete) only the files in their own folder.
-- Runs only on Supabase (skipped on a plain Postgres database).
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'storage' AND table_name = 'objects') THEN
    EXECUTE 'DROP POLICY IF EXISTS "shop-media owner select" ON storage.objects';
    EXECUTE $q$
      CREATE POLICY "shop-media owner select" ON storage.objects
      FOR SELECT TO authenticated
      USING (bucket_id = 'shop-media' AND (storage.foldername(name))[1] = auth.uid()::text)
    $q$;
  END IF;
END
$$;
