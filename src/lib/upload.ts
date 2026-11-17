import { discardPhotos, signPhotoUpload } from "@/app/actions/media";

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

  // Lower the quality step by step for busy photos that stay large, so each one is small.
  for (const quality of [0.8, 0.68, 0.55]) {
    const webp = await toBlob(canvas, "image/webp", quality);
    // Some older iPhones cannot write WebP.
    if (!webp || webp.type !== "image/webp") break;
    if (webp.size <= TARGET_BYTES || quality === 0.55) return { blob: webp, ext: "webp" };
  }
  for (const quality of [0.82, 0.68, 0.55]) {
    const jpeg = await toBlob(canvas, "image/jpeg", quality);
    if (!jpeg) throw new Error("encode failed");
    if (jpeg.size <= TARGET_BYTES || quality === 0.55) return { blob: jpeg, ext: "jpg" };
  }
  throw new Error("encode failed");
}

/** Aim for photos at most this big. A 1000 px photo is usually far below it. */
const TARGET_BYTES = 250 * 1024;

/**
 * Shrinks one photo and uploads it straight to R2 (into the user's own folder, chosen by the
 * server). Returns its public URL.
 */
export async function uploadPhoto(file: File, kind: PhotoKind): Promise<string> {
  const { blob } = await compress(file, kind);
  const signed = await signPhotoUpload({ contentType: blob.type, size: blob.size });
  if (!signed.ok) throw new Error(signed.error);
  const res = await fetch(signed.uploadUrl, { method: "PUT", body: blob, headers: { "content-type": blob.type } });
  if (!res.ok) throw new Error(`Upload failed (${res.status})`);
  return signed.publicUrl;
}

/**
 * Deletes photos that were uploaded in a form but never saved (the form was
 * closed, or the photo was taken off again), so they do not pile up in storage.
 * Failing is harmless, so errors are only logged.
 */
export async function discardUploads(urls: string[]): Promise<void> {
  if (urls.length === 0) return;
  try {
    await discardPhotos(urls);
  } catch (error) {
    console.error("Could not delete unused photos:", error);
  }
}
