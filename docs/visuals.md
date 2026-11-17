# Visuals and motion

Rules for every new illustration, animation, motion graphic or promo video, so it looks like
Apnacatalog and can be taken out again in one step.

## The look (from `src/app/globals.css` and the logo)

- **Subject:** hand-painted signboards and price tags of Indian bazaars. Warm, local, honest;
  never glossy SaaS gradients, glassmorphism or stock 3D blobs.
- **Colour:**
  - Navy `#1B2340` is the one colour for actions, headers and the logo box.
  - Orange `#F29A1F` is the price-tag colour: small accents, always with navy text on it,
    never white.
  - Cream `#FBF7F0` is the page; `#FDF1DC` is the soft surface.
  - WhatsApp green `#128C4A` only means WhatsApp. Red, amber and emerald only mean
    error, warning and done.
  - On shop pages the accent is the shop's own colour (`var(--p)`), and fonts, radius and
    surfaces come from the shop theme (`--t-*`). A visual there must use those variables,
    never the brand navy.
- **Type:** Baloo 2 for headings (signboard lettering), Mukta for text. Both have Devanagari,
  so Hindi works.
- **Shape:** buttons and inputs 8px, cards 12px, sheets 16px, chips and badges pill.
- **Logo:** the navy box with the "a" (ring + bar) and the orange dot; wordmark
  "apna" + orange "catalog". Light: `public/logo-light.svg`, dark: `public/logo-dark.svg`.
  Use the real files, never redraw it.
- **Real things first:** show the real product (a shop page, a WhatsApp order, the QR card)
  instead of made-up UI. The home hero's WhatsApp order card is the reference.
- **Parts:** UI comes from shadcn/ui (`src/components/ui`), sized for phones.

## Motion rules

- **Purpose:** motion explains something (an order arriving, a price tag landing, the
  distance appearing). No idle floating, breathing or pulsing loops.
- **Timing:** one entry 300-800 ms; a stagger in total at most 500 ms; exit about 75% of
  the entry. Eases: `power2/3.out` for entries, `back.out(1.4)` at most for a playful
  tag drop. No bounce or elastic.
- **Phones first:** animate only `transform` and `opacity`; no layout shift (reserve the
  space). Test at 375 px wide on a mid-range phone.
- **Reduced motion:** with `prefers-reduced-motion: reduce`, show the final state at once.
- **Works without JS:** the server-rendered page already shows the final, readable state.
  Animation only adds the way in.
- **Weight:** GSAP is loaded only inside the motion component, with a dynamic
  `import("gsap")`, so pages without motion never download it. CSS is enough for simple
  fades and slides (`tw-animate-css` is already installed).
- **Shop pages:** keep motion very light. They are for buying, and they load on slow
  phones.

## Easy to remove (the contract)

Every visual is one self-contained piece:

1. It lives in its own file under `src/components/motion/` (or `media/` for videos),
   with any CSS inside that file or a matching `.module.css`.
2. A page uses it in **one line** (one import plus one tag, or a wrapper around content that
   renders unchanged without it).
3. It never changes shared files (`globals.css`, `components/ui`, data or actions).
4. Its switch is listed in `src/lib/motion-flags.ts`. Set it to `false` to turn it off, or
   delete the file plus its one line to remove it fully.
5. The change is listed in the log below, with exactly what to delete.

## Promo videos (HyperFrames)

HyperFrames renders HTML to video. Use it for promotion films and WhatsApp, Instagram and
YouTube clips, not for the website itself. Keep each film in `media/<name>/`, outside `src/`,
so it never touches the app build. Use the same colours, fonts and logo as above, and real
screens of the product.

## Log

| Date | Visual | Where | To remove |
| --- | --- | --- | --- |
| 2026-11-17 | Link preview image (WhatsApp, Facebook, X) | `src/app/opengraph-image.tsx` | Delete the file |
