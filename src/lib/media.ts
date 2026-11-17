import "server-only";
import { and, arrayOverlaps, eq } from "drizzle-orm";
import { db } from "@/db";
import { items, shops } from "@/db/schema";
import { deleteObjects } from "@/lib/r2";
import { isMediaUrl, mediaPathOf } from "@/lib/supabase/env";

/**
 * Deletes photos from storage once nothing in the shop uses them any more.
 * Call it after the database has been updated.
 *
 * It never throws: a photo that could not be deleted only wastes a little space,
 * and that must not undo a save that already worked.
 *
 * Only files in the folder of the user who owns the shop now are deleted, so a URL copied from
 * another shop can never remove that shop's photo. (Photos uploaded by a previous owner of a
 * shop that changed its login email therefore stay behind.)
 */
export async function removeUnusedMedia(shopId: string, urls: (string | null | undefined)[]) {
  const candidates = [...new Set(urls.filter((url): url is string => !!url && isMediaUrl(url)))];
  if (candidates.length === 0) return;

  try {
    // Keep anything still shown somewhere in this shop (e.g. the same file used twice).
    const [[shop], itemRows] = await Promise.all([
      db
        .select({
          ownerId: shops.ownerId,
          logoUrl: shops.logoUrl,
          ownerPhotoUrl: shops.ownerPhotoUrl,
          shopPhotoUrls: shops.shopPhotoUrls,
        })
        .from(shops)
        .where(eq(shops.id, shopId))
        .limit(1),
      db
        .select({ urls: items.imageUrls })
        .from(items)
        .where(and(eq(items.shopId, shopId), arrayOverlaps(items.imageUrls, candidates))),
    ]);
    if (!shop) return;
    const stillUsed = new Set<string | null | undefined>([
      shop.logoUrl,
      shop.ownerPhotoUrl,
      ...shop.shopPhotoUrls,
      ...itemRows.flatMap((row) => row.urls),
    ]);

    const paths = candidates
      .filter((url) => !stillUsed.has(url))
      .map(mediaPathOf)
      .filter((path): path is string => path !== null && path.startsWith(`${shop.ownerId}/`));
    if (paths.length > 0) await deleteObjects(paths);
  } catch (error) {
    console.error("Could not delete photos from storage:", error);
  }
}
