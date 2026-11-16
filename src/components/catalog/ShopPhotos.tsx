"use client";

import { useState } from "react";
import { PhotoViewer } from "./PhotoViewer";

/**
 * Photos of the shop itself on the shop page, so customers can see the place
 * and know they found the right shop. Tap one to see it full size.
 */
export function ShopPhotos({ name, urls }: { name: string; urls: string[] }) {
  const [open, setOpen] = useState<number | null>(null);
  if (urls.length === 0) return null;

  return (
    <section className="mt-4" aria-label={`Photos of ${name}`}>
      <div className="no-scrollbar -mx-4 flex snap-x gap-2 overflow-x-auto px-4">
        {urls.map((url, i) => (
          <button
            key={url}
            type="button"
            onClick={() => setOpen(i)}
            className="t-photo aspect-4/3 w-44 shrink-0 snap-start bg-(--ps) sm:w-52"
            aria-label={`See photo ${i + 1} of ${urls.length} of the shop`}
          >
            <img
              src={url}
              alt=""
              loading={i < 2 ? "eager" : "lazy"}
              className="h-full w-full object-cover"
            />
          </button>
        ))}
      </div>
      {open !== null && (
        <PhotoViewer name={name} urls={urls} start={open} onClose={() => setOpen(null)} />
      )}
    </section>
  );
}
