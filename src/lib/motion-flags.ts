/**
 * On/off switch for every animation and motion graphic on the site (see docs/visuals.md).
 * Set one to false to turn that visual off without touching any page.
 */
export const MOTION = {
  /** Item photos slide every 3 seconds on the shop page (src/components/catalog/ItemCarousel.tsx). */
  itemCarouselAutoplay: true,
} as const satisfies Record<string, boolean>;
