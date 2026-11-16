"use client";

import { useRef, useState } from "react";
import { uploadPhoto, type PhotoKind } from "@/lib/upload";
import { cx } from "@/lib/utils";
import { Icon } from "@/components/Icon";
import { Button } from "@/components/ui/button";

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
  kind: PhotoKind;
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
      onChange(await uploadPhoto(file, kind, userId));
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
