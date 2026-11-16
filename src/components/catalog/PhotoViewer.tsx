"use client";

import { useRef, useState } from "react";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogClose, DialogContent, DialogTitle } from "@/components/ui/dialog";

/** Full-size photos of one item or of the shop. Swipe on a phone, arrows on a computer. */
export function PhotoViewer({
  name,
  urls,
  start = 0,
  onClose,
}: {
  name: string;
  urls: string[];
  /** The photo to open on. */
  start?: number;
  onClose: () => void;
}) {
  const track = useRef<HTMLDivElement | null>(null);
  const [index, setIndex] = useState(start);
  const many = urls.length > 1;

  // Open on the photo that was tapped. The dialog mounts its content late, so this
  // runs when the photo strip appears rather than when the viewer does.
  const opened = useRef(false);
  const attach = (el: HTMLDivElement | null) => {
    track.current = el;
    if (el && !opened.current) {
      opened.current = true;
      el.scrollTo({ left: start * el.clientWidth, behavior: "instant" });
    }
  };

  const go = (to: number) => {
    const el = track.current;
    if (el) el.scrollTo({ left: to * el.clientWidth, behavior: "smooth" });
  };

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent showCloseButton={false} className="gap-0 overflow-hidden p-0 text-base sm:max-w-lg">
        <div className="relative">
          <div
            ref={attach}
            className="no-scrollbar flex snap-x snap-mandatory overflow-x-auto"
            onScroll={(e) => {
              const el = e.currentTarget;
              setIndex(Math.round(el.scrollLeft / el.clientWidth));
            }}
          >
            {urls.map((url, i) => (
              <div key={url} className="aspect-square w-full shrink-0 snap-center bg-slate-100">
                <img
                  src={url}
                  alt={many ? `${name}, photo ${i + 1} of ${urls.length}` : name}
                  loading={i === start ? "eager" : "lazy"}
                  className="h-full w-full object-contain"
                />
              </div>
            ))}
          </div>

          {many && index > 0 && (
            <Button
              type="button"
              variant="outline"
              size="icon"
              className="absolute top-1/2 left-2 hidden -translate-y-1/2 rounded-full sm:inline-flex"
              aria-label="Previous photo"
              onClick={() => go(index - 1)}
            >
              <ChevronLeft className="size-5" />
            </Button>
          )}
          {many && index < urls.length - 1 && (
            <Button
              type="button"
              variant="outline"
              size="icon"
              className="absolute top-1/2 right-2 hidden -translate-y-1/2 rounded-full sm:inline-flex"
              aria-label="Next photo"
              onClick={() => go(index + 1)}
            >
              <ChevronRight className="size-5" />
            </Button>
          )}

          {many && (
            <span
              aria-live="polite"
              className="absolute bottom-2 left-1/2 -translate-x-1/2 rounded-full bg-black/60 px-2.5 py-0.5 text-xs font-medium text-white"
            >
              {index + 1} / {urls.length}
            </span>
          )}
        </div>

        <div className="flex items-center justify-between gap-3 py-2 pr-2 pl-4">
          <DialogTitle className="truncate text-base leading-snug font-semibold">{name}</DialogTitle>
          <DialogClose
            render={<Button variant="ghost" size="icon" className="shrink-0 text-slate-500" aria-label="Close photos" />}
          >
            <X className="size-5" />
          </DialogClose>
        </div>
      </DialogContent>
    </Dialog>
  );
}
