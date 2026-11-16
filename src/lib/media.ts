import "server-only";
import { and, arrayOverlaps, eq } from "drizzle-orm";
import { db } from "@/db";
import { items, shops } from "@/db/schema";
import { createClient } from "@/lib/supabase/server";
import { isMediaUrl, MEDIA_BUCKET, mediaPathOf } from "@/lib/supabase/env";

/**
 * Deletes photos from storage once nothing in the shop uses them any more.
 * Call it after the database has been updated.
 *
 * It never throws: a photo that could not be deleted only wastes a little space,
 * and that must not undo a save that already worked.
 *
 * The files are removed as the logged-in user, so storage rules still apply:
 * a user can only delete from their own folder. (Photos uploaded by a previous
 * owner of a shop that changed its login email therefore stay behind.)
 */
export async function removeUnusedMedia(shopId: string, urls: (string | null | undefined)[]) {
  const candidates = [...new Set(urls.filter((url): url is string => !!url && isMediaUrl(url)))];
  if (candidates.length === 0) return;

  try {
    // Keep anything still shown somewhere in this shop (e.g. the same file used twice).
    const [[shop], itemRows] = await Promise.all([
      db
        .select({ logoUrl: shops.logoUrl, ownerPhotoUrl: shops.ownerPhotoUrl, shopPhotoUrls: shops.shopPhotoUrls })
        .from(shops)
        .where(eq(shops.id, shopId))
        .limit(1),
      db
        .select({ urls: items.imageUrls })
        .from(items)
        .where(and(eq(items.shopId, shopId), arrayOverlaps(items.imageUrls, candidates))),
    ]);
    const stillUsed = new Set<string | null | undefined>([
      shop?.logoUrl,
      shop?.ownerPhotoUrl,
      ...(shop?.shopPhotoUrls ?? []),
      ...itemRows.flatMap((row) => row.urls),
    ]);

    const paths = candidates
      .filter((url) => !stillUsed.has(url))
      .map(mediaPathOf)
      .filter((path): path is string => path !== null);
    if (paths.length === 0) return;

    const supabase = await createClient();
    const { error } = await supabase.storage.from(MEDIA_BUCKET).remove(paths);
    if (error) console.error("Could not delete photos from storage:", error.message);
  } catch (error) {
    console.error("Could not delete photos from storage:", error);
  }
}
