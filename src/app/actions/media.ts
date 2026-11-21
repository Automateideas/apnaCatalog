"use server";

import { z } from "zod";
import { getShopByOwner, getUser } from "@/lib/auth";
import { removeUnusedMedia } from "@/lib/media";
import { deleteObjects, signedUploadUrl } from "@/lib/r2";
import { mediaPathOf, mediaUrlOf } from "@/lib/media-url";
import { slugify } from "@/lib/utils";

/** Photos are shrunk in the browser first (about 250 KB); this is the hard limit. */
const MAX_BYTES = 2 * 1024 * 1024;
const TYPES = { "image/webp": "webp", "image/jpeg": "jpg" } as const;

const uploadInput = z.object({
  contentType: z.enum(["image/webp", "image/jpeg"]),
  size: z.number().int().min(1).max(MAX_BYTES),
  folder: z.string().max(200).optional(),
});

/**
 * The sub-folder inside the shop's folder, so photos are easy to find in R2:
 * "logo", "owner", "shop-photos" or "items/<item-name>". Anything else goes to "other".
 */
function subFolder(folder: string | undefined): string {
  if (folder === "logo" || folder === "owner" || folder === "shop-photos") return folder;
  if (folder?.startsWith("items/")) return `items/${slugify(folder.slice(6)) || "item"}`;
  return "other";
}

/**
 * A short-lived link to upload one photo straight to R2, into the user's own folder.
 * Returns the photo's public URL too, to store once the form is saved.
 */
export async function signPhotoUpload(
  raw: unknown,
): Promise<{ ok: true; uploadUrl: string; publicUrl: string } | { ok: false; error: string }> {
  const user = await getUser();
  if (!user) return { ok: false, error: "Please log in again." };
  const parsed = uploadInput.safeParse(raw);
  if (!parsed.success) return { ok: false, error: "Only JPG or WebP photos up to 2 MB can be uploaded." };

  const { contentType, size, folder } = parsed.data;
  // "<shop-link>/<sub-folder>/<file>". Before the shop exists: "new/<login id>/<file>".
  const shop = await getShopByOwner(user.id);
  const base = shop ? `${shop.slug}/${subFolder(folder)}` : `new/${user.id}`;
  const path = `${base}/${crypto.randomUUID()}.${TYPES[contentType]}`;
  try {
    const uploadUrl = await signedUploadUrl(path, contentType, size);
    return { ok: true, uploadUrl, publicUrl: mediaUrlOf(path) };
  } catch (error) {
    console.error("Could not sign photo upload", error);
    return { ok: false, error: "Photo upload is not available right now. Please try again." };
  }
}

/**
 * Deletes photos that were uploaded in a form but never saved. Only files in the user's own
 * folder, and never one their shop still shows.
 */
export async function discardPhotos(raw: unknown): Promise<void> {
  const urls = z.array(z.string().max(500)).max(30).safeParse(raw);
  if (!urls.success || urls.data.length === 0) return;
  const user = await getUser();
  if (!user) return;

  const shop = await getShopByOwner(user.id);
  if (shop) {
    // Same checks as after a save: still-used photos stay.
    await removeUnusedMedia(shop.id, urls.data);
    return;
  }
  // No shop yet (first-time setup): only the user's own folders.
  const paths = urls.data
    .map(mediaPathOf)
    .filter(
      (path): path is string =>
        path !== null && (path.startsWith(`new/${user.id}/`) || path.startsWith(`${user.id}/`)),
    );
  if (paths.length > 0) await deleteObjects(paths);
}
