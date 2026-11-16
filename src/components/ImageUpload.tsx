"use client";

import { useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { MEDIA_BUCKET } from "@/lib/supabase/env";
import { cx } from "@/lib/utils";
import { Icon } from "@/components/Icon";
import { Button } from "@/components/ui/button";

type Kind = "item" | "square";

function toBlob(canvas: HTMLCanvasElement, type: string, quality: number): Promise<Blob | null> {
  return new Promise((resolve) => canvas.toBlob(resolve, type, quality));
}

/**
 * Shrinks a photo in the browser before upload, so a 5 MB camera photo
 * becomes roughly 100 KB. "square" crops to the centre (logos, owner photo).
 */
async function compress(file: File, kind: Kind): Promise<{ blob: Blob; ext: string }> {
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

export function ImageUpload({
  value,
  onChange,
  userId,
  kind,
  label,
  round = false,
}: {
  value: string | null;
  onChange: (url: string | null) => void;
  userId: string;
  kind: Kind;
  label: string;
  round?: boolean;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const pick = async (file: File | undefined) => {
    if (!file) return;
    setError(null);
    setBusy(true);
    try {
      const { blob, ext } = await compress(file, kind);
      const path = `${userId}/${crypto.randomUUID()}.${ext}`;
      const supabase = createClient();
      const { error: uploadError } = await supabase.storage
        .from(MEDIA_BUCKET)
        .upload(path, blob, { contentType: blob.type, cacheControl: "31536000" });
      if (uploadError) throw uploadError;
      onChange(supabase.storage.from(MEDIA_BUCKET).getPublicUrl(path).data.publicUrl);
    } catch (e) {
      console.error(e);
      setError("Could not upload this photo. Try a JPG or PNG photo.");
    } finally {
      setBusy(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  return (
    <div>
      <span className="mb-1.5 block text-sm font-medium text-slate-700">{label}</span>
      <div className="flex items-center gap-3">
        <div
          className={cx(
            "flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden border border-slate-200 bg-slate-100 text-2xl text-slate-300",
            round ? "rounded-full" : "rounded-xl",
          )}
        >
          {value ? <img src={value} alt="" className="h-full w-full object-cover" /> : <Icon name="camera" className="h-6 w-6" />}
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            variant="outline" size="sm"
            disabled={busy}
            onClick={() => inputRef.current?.click()}
          >
            {busy ? "Uploading..." : value ? "Change photo" : "Add photo"}
          </Button>
          {value && !busy && (
            <Button type="button" variant="ghost" size="sm" onClick={() => onChange(null)}>
              Remove
            </Button>
          )}
        </div>
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => pick(e.target.files?.[0])}
        />
      </div>
      {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
    </div>
  );
}
