"use client";

import { useEffect, useRef, useState } from "react";
import { Camera, Plus, Star, X } from "lucide-react";
import { toast } from "sonner";
import { MAX_ITEM_PHOTOS } from "@/lib/catalog-config";
import { discardUploads, uploadPhoto } from "@/lib/upload";

/**
 * The photos of one item in the item form: add (several at once), remove, and
 * choose the main photo. The first photo is the main one.
 *
 * Nothing is saved here; the form saves the list. A photo that was uploaded
 * here and then taken off again is deleted from storage straight away, because
 * no saved item ever pointed at it.
 */
export function ItemPhotos({
  value,
  savedUrls,
  onAdd,
  onChange,
  onBusyChange,
  folder,
  max = MAX_ITEM_PHOTOS,
  label = "Photos",
  hint = `Up to ${max} photos. Customers see the main photo first.`,
}: {
  /** Where the photos go inside the shop's folder in storage, e.g. "items/Red saree". */
  folder?: string;
  /** Most photos allowed. */
  max?: number;
  label?: string;
  hint?: string;
  value: string[];
  /** Photos the saved item already has. Those are only deleted when the form is saved. */
  savedUrls: string[];
  /** Called once per finished upload. */
  onAdd: (url: string) => void;
  onChange: (urls: string[]) => void;
  /** Tells the form when uploads start and finish. */
  onBusyChange?: (busy: boolean) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const cameraRef = useRef<HTMLInputElement>(null);
  const [progress, setProgress] = useState<{ done: number; total: number } | null>(null);
  const mounted = useRef(true);
  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);

  const busy = progress !== null;
  useEffect(() => {
    onBusyChange?.(busy);
    return () => onBusyChange?.(false);
  }, [busy, onBusyChange]);

  const room = max - value.length;

  const pick = async (fileList: FileList | null) => {
    const picked = Array.from(fileList ?? []);
    if (inputRef.current) inputRef.current.value = "";
    if (picked.length === 0) return;

    const files = picked.slice(0, room);
    if (picked.length > files.length) {
      toast.info(`Only ${max} photos are allowed here. Added the first ${files.length}.`);
    }

    let failed = 0;
    setProgress({ done: 0, total: files.length });
    for (const [index, file] of files.entries()) {
      try {
        const url = await uploadPhoto(file, "item", folder);
        // The form was closed while this was uploading: nothing will ever use the file.
        if (!mounted.current) {
          void discardUploads([url]);
          return;
        }
        onAdd(url);
      } catch (error) {
        console.error(error);
        failed += 1;
      }
      if (mounted.current) setProgress({ done: index + 1, total: files.length });
    }
    if (!mounted.current) return;
    setProgress(null);
    if (failed > 0) {
      toast.error(
        failed === 1
          ? "Could not upload one photo. Try a JPG or PNG photo."
          : `Could not upload ${failed} photos. Try JPG or PNG photos.`,
      );
    }
  };

  const remove = (url: string) => {
    onChange(value.filter((u) => u !== url));
    if (!savedUrls.includes(url)) void discardUploads([url]);
  };

  return (
    <div>
      <div className="mb-1.5 flex items-baseline justify-between">
        <span className="text-sm font-medium text-slate-700">{label}</span>
        <span className="text-xs text-slate-500">
          {value.length} of {max}
        </span>
      </div>

      <ul className="grid grid-cols-4 gap-2 sm:grid-cols-5">
        {value.map((url, index) => (
          <li key={url} className="relative aspect-square overflow-hidden rounded-xl border border-slate-200 bg-slate-100">
            <img src={url} alt={`Photo ${index + 1}`} className="h-full w-full object-contain" />
            {index === 0 ? (
              <span className="absolute bottom-1 left-1 rounded bg-brand px-1.5 py-0.5 text-[10px] font-semibold text-white">
                Main
              </span>
            ) : (
              <button
                type="button"
                className="absolute bottom-1 left-1 flex size-7 items-center justify-center rounded-full bg-white/90 text-slate-700 shadow-sm hover:bg-white"
                aria-label={`Make photo ${index + 1} the main photo`}
                title="Make main photo"
                onClick={() => onChange([url, ...value.filter((u) => u !== url)])}
              >
                <Star className="size-3.5" />
              </button>
            )}
            <button
              type="button"
              className="absolute top-1 right-1 flex size-7 items-center justify-center rounded-full bg-white/90 text-red-600 shadow-sm hover:bg-white"
              aria-label={`Remove photo ${index + 1}`}
              title="Remove photo"
              onClick={() => remove(url)}
            >
              <X className="size-4" />
            </button>
          </li>
        ))}

        {room > 0 && (
          <>
            <li>
              <button
                type="button"
                disabled={busy}
                onClick={() => inputRef.current?.click()}
                className="flex aspect-square w-full flex-col items-center justify-center gap-0.5 rounded-xl border border-dashed border-slate-300 bg-card text-xs font-medium text-slate-600 hover:border-slate-400 hover:bg-slate-50 disabled:opacity-60"
              >
                {progress ? (
                  <span aria-live="polite">
                    {progress.done}/{progress.total}
                    <br />
                    Uploading
                  </span>
                ) : (
                  <>
                    <Plus className="size-5" />
                    Gallery
                  </>
                )}
              </button>
            </li>
            <li>
              <button
                type="button"
                disabled={busy}
                onClick={() => cameraRef.current?.click()}
                className="flex aspect-square w-full flex-col items-center justify-center gap-0.5 rounded-xl border border-dashed border-slate-300 bg-card text-xs font-medium text-slate-600 hover:border-slate-400 hover:bg-slate-50 disabled:opacity-60"
              >
                <Camera className="size-5" />
                Camera
              </button>
            </li>
          </>
        )}
      </ul>

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={(e) => pick(e.target.files)}
      />
      <input
        ref={cameraRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={(e) => pick(e.target.files)}
      />
      <p className="mt-1.5 text-xs text-slate-500">{hint}</p>
    </div>
  );
}
