import { createClient } from "@/lib/supabase/client";
import { MEDIA_BUCKET, mediaPathOf } from "@/lib/supabase/env";

/** Browser-side photo upload. "square" crops to the centre (logos, owner photo). */
export type PhotoKind = "item" | "square";

function toBlob(canvas: HTMLCanvasElement, type: string, quality: number): Promise<Blob | null> {
  return new Promise((resolve) => canvas.toBlob(resolve, type, quality));
}

/**
 * Shrinks a photo in the browser before upload, so a 5 MB camera photo
 * becomes roughly 100 KB.
 */
async function compress(file: File, kind: PhotoKind): Promise<{ blob: Blob; ext: string }> {
  const bitmap = await createImageBitmap(file);
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("no canvas");

  if (kind === "square") {
    const side = Math.min(bitmap.width, bitmap.height);
    canvas.width = canvas.height = 512;
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, 512, 512);
    ctx.drawImage(bitmap, (bitmap.width - side) / 2, (bitmap.height - side) / 2, side, side, 0, 0, 512, 512);
    bitmap.close();
    const blob = await toBlob(canvas, "image/jpeg", 0.88);
    if (!blob) throw new Error("encode failed");
    return { blob, ext: "jpg" };
  }

  const scale = Math.min(1, 1000 / Math.max(bitmap.width, bitmap.height));
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close();

  const webp = await toBlob(canvas, "image/webp", 0.8);
  if (webp && webp.type === "image/webp") return { blob: webp, ext: "webp" };
  // Some older iPhones cannot write WebP.
  const jpeg = await toBlob(canvas, "image/jpeg", 0.82);
  if (!jpeg) throw new Error("encode failed");
  return { blob: jpeg, ext: "jpg" };
}

/** Shrinks and uploads one photo to the user's folder. Returns its public URL. */
export async function uploadPhoto(file: File, kind: PhotoKind, userId: string): Promise<string> {
  const { blob, ext } = await compress(file, kind);
  const path = `${userId}/${crypto.randomUUID()}.${ext}`;
  const supabase = createClient();
  const { error } = await supabase.storage
    .from(MEDIA_BUCKET)
    .upload(path, blob, { contentType: blob.type, cacheControl: "31536000" });
  if (error) throw error;
  return supabase.storage.from(MEDIA_BUCKET).getPublicUrl(path).data.publicUrl;
}

/**
 * Deletes photos that were uploaded in a form but never saved (the form was
 * closed, or the photo was taken off again), so they do not pile up in storage.
 * Failing is harmless, so errors are only logged.
 */
export async function discardUploads(urls: string[]): Promise<void> {
  const paths = urls.map(mediaPathOf).filter((path): path is string => path !== null);
  if (paths.length === 0) return;
  try {
    const { error } = await createClient().storage.from(MEDIA_BUCKET).remove(paths);
    if (error) console.error("Could not delete unused photos:", error.message);
  } catch (error) {
    console.error("Could not delete unused photos:", error);
  }
}
