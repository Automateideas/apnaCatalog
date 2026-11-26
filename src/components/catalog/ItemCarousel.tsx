"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Autoplay from "embla-carousel-autoplay";
import { cx } from "@/lib/utils";
import { MOTION } from "@/lib/motion-flags";
import Image from "next/image";
import {
  Carousel,
  type CarouselApi,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";

/**
 * An item's photos. With more than one, they slide every 3 seconds, with ‹ › buttons and dots.
 * Sliding pauses while the photos are off screen or touched, and never starts for visitors who
 * asked their phone for less motion. Turn it off for everyone with MOTION.itemCarouselAutoplay.
 */
export function ItemCarousel({
  urls,
  name,
  onOpen,
  autoplay = true,
  className,
}: {
  urls: string[];
  name: string;
  /** Tapping a photo. */
  onOpen?: (index: number) => void;
  autoplay?: boolean;
  className?: string;
}) {
  const root = useRef<HTMLDivElement>(null);
  const [api, setApi] = useState<CarouselApi>();
  const [index, setIndex] = useState(0);
  const many = urls.length > 1;
  const plugin = useMemo(
    () => Autoplay({ delay: 3000, playOnInit: false, stopOnInteraction: false, stopOnMouseEnter: true }),
    [],
  );

  useEffect(() => {
    if (!api) return;
    const onSelect = () => setIndex(api.selectedScrollSnap());
    api.on("select", onSelect);
    return () => {
      api.off("select", onSelect);
    };
  }, [api]);

  // Slide only while on screen, and only when motion is welcome.
  useEffect(() => {
    if (!api || !many || !autoplay || !MOTION.itemCarouselAutoplay) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const el = root.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => (entry.isIntersecting ? plugin.play() : plugin.stop()),
      { threshold: 0.6 },
    );
    observer.observe(el);
    return () => {
      observer.disconnect();
      plugin.stop();
    };
  }, [api, many, autoplay, plugin]);

  const photo = (url: string, i: number) => (
    <button
      type="button"
      onClick={() => onOpen?.(i)}
      className="relative block h-full w-full cursor-pointer"
      aria-label={many ? `Photo ${i + 1} of ${urls.length}: ${name}` : `Open ${name}`}
    >
      <Image src={url} alt="" fill sizes="(max-width: 640px) 50vw, 33vw" className="object-cover" priority={i === 0} />
    </button>
  );

  if (!many) return <div className={cx("h-full w-full", className)}>{photo(urls[0] ?? "", 0)}</div>;

  return (
    <div ref={root} className={cx("relative h-full w-full", className)}>
      <Carousel
        setApi={setApi}
        opts={{ loop: true }}
        plugins={[plugin]}
        className="h-full **:data-[slot=carousel-content]:h-full **:data-[slot=carousel-content]>div:h-full"
        aria-label={`${urls.length} photos of ${name}`}
      >
        <CarouselContent className="ml-0">
          {urls.map((url, i) => (
            <CarouselItem key={url} className="h-full pl-0">
              {photo(url, i)}
            </CarouselItem>
          ))}
        </CarouselContent>
        <CarouselPrevious className="left-1.5 size-7 border-0 bg-white/85 text-slate-800 shadow-sm disabled:opacity-0" />
        <CarouselNext className="right-1.5 size-7 border-0 bg-white/85 text-slate-800 shadow-sm disabled:opacity-0" />
      </Carousel>
      <div className="pointer-events-none absolute inset-x-0 bottom-1.5 flex justify-center gap-1" aria-hidden="true">
        {urls.map((url, i) => (
          <span
            key={url}
            className={cx("h-1.5 rounded-full bg-white shadow transition-all", i === index ? "w-4" : "w-1.5 opacity-60")}
          />
        ))}
      </div>
    </div>
  );
}
