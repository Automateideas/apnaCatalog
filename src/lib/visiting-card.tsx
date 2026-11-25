import "server-only";
import { ImageResponse } from "next/og";
import QRCode from "qrcode";
import type { Shop } from "@/db/schema";
import { getBusinessType } from "@/lib/catalog-config";
import { resolveTheme, type Accent, type FontKey, type Theme } from "@/lib/themes";
import { initials, SITE_NAME, siteUrl } from "@/lib/utils";

/*
  The shop's visiting card: one PNG made from the shop's details in the theme and colour the
  shopkeeper chose. Its size suits WhatsApp and Facebook link previews, so it is also the shop
  page's Open Graph image: every shared shop link shows the card.
*/

export const CARD_SIZE = { width: 1200, height: 630 };

/** Address of the card image. `v` changes when the shop is saved, so WhatsApp fetches a new design. */
export function visitingCardPath(shop: Pick<Shop, "slug" | "updatedAt">, opts?: { download?: boolean }): string {
  const v = new Date(shop.updatedAt).getTime().toString(36);
  return `/${shop.slug}/card?v=${v}${opts?.download ? "&download=1" : ""}`;
}

/* ---------- Fonts ---------- */

/** Google Fonts family of each theme font. */
const FAMILY: Record<FontKey, string> = {
  baloo: "Baloo 2",
  mukta: "Mukta",
  yatra: "Yatra One",
  playfair: "Playfair Display",
  inter: "Inter",
  cormorant: "Cormorant Garamond",
  grotesk: "Space Grotesk",
  fredoka: "Fredoka",
  oswald: "Oswald",
  rozha: "Rozha One",
  poppins: "Poppins",
  hind: "Hind",
  kalam: "Kalam",
  dmserif: "DM Serif Display",
  bebas: "Bebas Neue",
  nunito: "Nunito",
  laila: "Laila",
};

const fontCache = new Map<string, Promise<ArrayBuffer | null>>();

/**
 * A TrueType font from Google Fonts, cut down to the letters in `text` so it is small.
 * Fonts that lack the weight are asked for again at their default weight. Null on failure:
 * the card then uses the built-in font.
 */
function googleFont(family: string, weight: number, text: string): Promise<ArrayBuffer | null> {
  const key = `${family}|${weight}|${text}`;
  let font = fontCache.get(key);
  if (!font) {
    font = (async () => {
      for (const axis of [`:wght@${weight}`, ""]) {
        try {
          const url = `https://fonts.googleapis.com/css2?family=${encodeURIComponent(family)}${axis}&text=${encodeURIComponent(text)}`;
          const css = await fetch(url, { signal: AbortSignal.timeout(4000) });
          if (!css.ok) continue;
          const src = (await css.text()).match(/src: url\((.+?)\) format\('(opentype|truetype)'\)/);
          if (!src) continue;
          const file = await fetch(src[1], { signal: AbortSignal.timeout(4000) });
          if (file.ok) return await file.arrayBuffer();
        } catch {
          // try the next form, then give up
        }
      }
      return null;
    })();
    fontCache.set(key, font);
    // Only remember fonts while there are few, so the cache cannot grow without end.
    if (fontCache.size > 200) fontCache.delete(fontCache.keys().next().value!);
    font.then((data) => {
      if (!data) fontCache.delete(key);
    });
  }
  return font;
}

/* ---------- Pictures ---------- */

const ALLOWED_IMAGE_HOSTS = new Set(
  [process.env.NEXT_PUBLIC_MEDIA_BASE_URL].filter(Boolean).map((u) => new URL(u!).hostname),
);

/** A photo as a data URL, or null when it cannot be loaded in time. */
async function imageData(url: string | null | undefined): Promise<string | null> {
  if (!url) return null;
  try {
    const host = new URL(url).hostname;
    if (!ALLOWED_IMAGE_HOSTS.has(host)) return null;
    const res = await fetch(url, { signal: AbortSignal.timeout(4000) });
    const type = res.headers.get("content-type") ?? "";
    if (!res.ok || !type.startsWith("image/")) return null;
    const bytes = Buffer.from(await res.arrayBuffer());
    if (bytes.length > 4_000_000) return null;
    return `data:${type};base64,${bytes.toString("base64")}`;
  } catch {
    return null;
  }
}

async function qrData(url: string): Promise<string> {
  const svg = await QRCode.toString(url, {
    type: "svg",
    margin: 0,
    errorCorrectionLevel: "M",
    color: { dark: "#111111", light: "#ffffff" },
  });
  return `data:image/svg+xml;base64,${Buffer.from(svg).toString("base64")}`;
}

/* ---------- Helpers ---------- */

const px = (value: string) => parseFloat(value) || 0;

/** "+91 98765 43210" */
const formatPhone = (phone10: string) => `+91 ${phone10.slice(0, 5)} ${phone10.slice(5)}`;

function clip(text: string, max: number): string {
  return text.length > max ? `${text.slice(0, max - 1).trimEnd()}…` : text;
}

function nameSize(name: string): number {
  if (name.length <= 12) return 74;
  if (name.length <= 18) return 64;
  if (name.length <= 26) return 54;
  if (name.length <= 36) return 46;
  return 40;
}

/** Letter spacing like "0.08em" in pixels for a given font size. */
function tracking(value: string | undefined, size: number): number {
  if (!value) return 0;
  return value.endsWith("em") ? px(value) * size : px(value);
}

/* ---------- Icons (lucide shapes, drawn as SVG) ---------- */

function IconSvg({ d, color, size = 26 }: { d: string[]; color: string; size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {d.map((path) => (
        <path key={path} d={path} />
      ))}
    </svg>
  );
}

const ICONS = {
  phone: [
    "M13.832 16.568a1 1 0 0 0 1.213-.303l.355-.465A2 2 0 0 1 17 15h3a2 2 0 0 1 2 2v3a2 2 0 0 1-2 2A18 18 0 0 1 2 4a2 2 0 0 1 2-2h3a2 2 0 0 1 2 2v3a2 2 0 0 1-.8 1.6l-.468.351a1 1 0 0 0-.292 1.233 14 14 0 0 0 6.392 6.384",
  ],
  whatsapp: [
    "M7.9 20A9 9 0 1 0 4 16.1L2 22Z",
    "M9 10a.5.5 0 0 0 1 0V9a.5.5 0 0 0-1 0v1a5 5 0 0 0 5 5h1a.5.5 0 0 0 0-1h-1a.5.5 0 0 0 0 1",
  ],
  pin: [
    "M20 10c0 4.993-5.539 10.193-7.399 11.799a1 1 0 0 1-1.202 0C9.539 20.193 4 14.993 4 10a8 8 0 0 1 16 0",
    "M12 10m-3 0a3 3 0 1 0 6 0a3 3 0 1 0 -6 0",
  ],
  globe: [
    "M12 12m-10 0a10 10 0 1 0 20 0a10 10 0 1 0 -20 0",
    "M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20",
    "M2 12h20",
  ],
};

/* ---------- Decorations, matching the shop page ---------- */

const DECOR_HEIGHT = 26;

function Decor({ theme, accent }: { theme: Theme; accent: Accent }) {
  const { width } = CARD_SIZE;
  const row = (children: React.ReactNode, background = "transparent") => (
    <div
      style={{
        display: "flex",
        width,
        height: DECOR_HEIGHT,
        overflow: "hidden",
        background,
        alignItems: "flex-start",
      }}
    >
      {children}
    </div>
  );
  switch (theme.decor) {
    case "garland": {
      // Marigold flowers on a string, with leaves between them.
      const n = 30;
      return row(
        Array.from({ length: n }, (_, i) => (
          <div key={i} style={{ display: "flex", width: width / n, justifyContent: "center", alignItems: "center", height: DECOR_HEIGHT }}>
            <div
              style={{
                width: i % 2 ? 12 : 22,
                height: i % 2 ? 8 : 22,
                borderRadius: i % 2 ? "8px 0 8px 0" : 999,
                background: i % 2 ? "#15803d" : i % 4 === 0 ? "#f59e0b" : "#ea580c",
              }}
            />
          </div>
        )),
      );
    }
    case "awning": {
      // Shop awning: scallops in the shop colour and white.
      const n = 20;
      return row(
        Array.from({ length: n }, (_, i) => (
          <div
            key={i}
            style={{
              width: width / n,
              height: DECOR_HEIGHT,
              background: i % 2 ? "#ffffff" : accent.primary,
              borderRadius: `0 0 ${width / n / 2}px ${width / n / 2}px`,
            }}
          />
        )),
      );
    }
    case "hazard": {
      const n = 40;
      return row(
        Array.from({ length: n }, (_, i) => (
          <div
            key={i}
            style={{
              width: width / n + 2,
              height: DECOR_HEIGHT + 4,
              marginLeft: -1,
              background: i % 2 ? "#1c1917" : "#facc15",
              transform: "skewX(-30deg)",
            }}
          />
        )),
        "#1c1917",
      );
    }
    case "diamond": {
      const n = 34;
      return row(
        Array.from({ length: n }, (_, i) => (
          <div key={i} style={{ display: "flex", width: width / n, height: DECOR_HEIGHT, alignItems: "center", justifyContent: "center" }}>
            <div
              style={{
                width: i % 2 ? 7 : 12,
                height: i % 2 ? 7 : 12,
                background: i % 2 ? theme.colors.muted : accent.primary,
                transform: "rotate(45deg)",
              }}
            />
          </div>
        )),
      );
    }
    case "confetti": {
      const colors = [accent.primary, "#f59e0b", "#10b981", "#ec4899", "#3b82f6", "#8b5cf6"];
      const n = 36;
      return row(
        Array.from({ length: n }, (_, i) => (
          <div key={i} style={{ display: "flex", width: width / n, height: DECOR_HEIGHT, alignItems: i % 3 === 0 ? "flex-start" : i % 3 === 1 ? "center" : "flex-end", justifyContent: "center" }}>
            <div
              style={{
                width: i % 2 ? 9 : 14,
                height: i % 2 ? 9 : 6,
                borderRadius: i % 2 ? 999 : 2,
                background: colors[i % colors.length],
                transform: `rotate(${(i * 37) % 90}deg)`,
              }}
            />
          </div>
        )),
      );
    }
    default:
      return null;
  }
}

/* ---------- The card ---------- */

export async function renderVisitingCard(shop: Shop, opts: { download?: boolean; immutable?: boolean } = {}) {
  const { theme, accent } = resolveTheme(shop);
  const type = getBusinessType(shop.businessType);
  const shopUrl = `${siteUrl()}/${shop.slug}`;
  const shortUrl = shopUrl.replace(/^https?:\/\/(www\.)?/, "");

  const name = theme.heading.uppercase ? shop.name.toUpperCase() : shop.name;
  const typeLabel = shop.businessType === "other" ? "" : type.name;
  const address = shop.address ? clip(shop.address.replace(/\s+/g, " ").trim(), 95) : "";
  const description = shop.description ? clip(shop.description.replace(/\s+/g, " ").trim(), 110) : "";
  const showPhone =Boolean(shop.phone && shop.phone !== shop.whatsapp);
  const rating = shop.ratingCount ? shop.ratingSum / shop.ratingCount : 0;

  const texts = [
    name,
    typeLabel,
    shop.ownerName ?? "",
    shop.city,
    address,
    description,
    shortUrl,
    formatPhone(shop.whatsapp),
    shop.phone ? formatPhone(shop.phone) : "",
    "Scan to see our catalog Order on WhatsApp Made with Call Owner reviews ★ 0123456789.,()",
    SITE_NAME,
    initials(shop.name),
  ].join(" ");

  const [heading, body, bodyBold, logo, cover, qr] = await Promise.all([
    googleFont(FAMILY[theme.fonts.heading], theme.heading.weight, texts),
    googleFont("Mukta", 400, texts),
    googleFont("Mukta", 700, texts),
    imageData(shop.logoUrl || shop.ownerPhotoUrl),
    theme.header === "cover" ? imageData(shop.shopPhotoUrls[0]) : Promise.resolve(null),
    qrData(shopUrl),
  ]);

  const fonts: { name: string; data: ArrayBuffer; weight: 400 | 700; style: "normal" }[] = [];
  if (heading) fonts.push({ name: "Heading", data: heading, weight: 700, style: "normal" });
  if (body) fonts.push({ name: "Body", data: body, weight: 400, style: "normal" });
  if (bodyBold) fonts.push({ name: "Body", data: bodyBold, weight: 700, style: "normal" });

  // The top of the card (logo and name) follows the theme's header style.
  const header = theme.header;
  const topBg =
    header === "banner"
      ? theme.decor === "hazard"
        ? "#1c1917"
        : accent.primary
      : header === "hero"
        ? "#0b0f19"
        : header === "cover"
          ? "#111111"
          : "transparent";
  const topText = header === "banner" ? (theme.decor === "hazard" ? "#ffffff" : accent.on) : header === "hero" || header === "cover" ? "#ffffff" : theme.colors.text;
  const topMuted = topBg === "transparent" ? theme.colors.muted : "rgba(255,255,255,0.78)";
  const filledTop = topBg !== "transparent";

  const size = nameSize(name);
  const logoSize = 132;
  const logoRadius = Math.min(logoSize / 2, px(theme.radius.photo) * 2.4);
  const chipRadius = theme.chips === "pill" ? 999 : theme.chips === "square" ? 6 : 0;
  const decor = theme.decor !== "none";
  const mainHeight = CARD_SIZE.height - (decor ? DECOR_HEIGHT : 0);
  const panelWidth = 400;

  const contact: { icon: keyof typeof ICONS; text: string; bold?: boolean }[] = [
    { icon: "whatsapp", text: formatPhone(shop.whatsapp), bold: true },
    ...(showPhone ? [{ icon: "phone" as const, text: formatPhone(shop.phone!), bold: true }] : []),
    { icon: "pin", text: address ? `${address}${address.toLowerCase().includes(shop.city.toLowerCase()) ? "" : `, ${shop.city}`}` : shop.city },
  ];

  const element = (
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        background: theme.colors.bg,
        color: theme.colors.text,
        fontFamily: "Body",
      }}
    >
      {decor && <Decor theme={theme} accent={accent} />}

      <div style={{ display: "flex", height: mainHeight, width: "100%" }}>
        {/* Left: who and where */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            width: CARD_SIZE.width - panelWidth,
            height: mainHeight,
            position: "relative",
            borderLeft: header === "split" ? `16px solid ${accent.primary}` : "none",
          }}
        >
          {/* Logo, name, type */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              padding: filledTop ? "44px 48px 40px" : "52px 48px 18px",
              background: topBg,
              position: "relative",
              overflow: "hidden",
            }}
          >
            {cover && (
              // eslint-disable-next-line jsx-a11y/alt-text
              <img
                src={cover}
                width={CARD_SIZE.width - panelWidth}
                height={300}
                style={{ position: "absolute", top: 0, left: 0, objectFit: "cover", opacity: 0.45 }}
              />
            )}
            <div
              style={{
                display: "flex",
                width: logoSize,
                height: logoSize,
                flexShrink: 0,
                borderRadius: logoRadius,
                overflow: "hidden",
                alignItems: "center",
                justifyContent: "center",
                background: logo ? "#ffffff" : filledTop ? "rgba(255,255,255,0.18)" : accent.primary,
                border: `4px solid ${filledTop ? "rgba(255,255,255,0.9)" : accent.soft}`,
                color: filledTop ? topText : accent.on,
                fontFamily: "Heading",
                fontSize: 52,
                fontWeight: 700,
              }}
            >
              {logo ? (
                // eslint-disable-next-line jsx-a11y/alt-text
                <img src={logo} width={logoSize} height={logoSize} style={{ objectFit: "cover" }} />
              ) : (
                initials(shop.name)
              )}
            </div>

            <div style={{ display: "flex", flexDirection: "column", marginLeft: 32, flex: 1, minWidth: 0 }}>
              {typeLabel && (
                <div style={{ display: "flex" }}>
                  <div
                    style={{
                      display: "flex",
                      fontSize: 24,
                      fontWeight: 700,
                      padding: theme.chips === "underline" ? "0 0 2px" : "4px 18px",
                      borderRadius: chipRadius,
                      background: theme.chips === "underline" ? "transparent" : filledTop ? "rgba(255,255,255,0.18)" : accent.soft,
                      color: filledTop ? topText : accent.dark,
                      borderBottom: theme.chips === "underline" ? `3px solid ${filledTop ? topText : accent.primary}` : "none",
                    }}
                  >
                    {typeLabel}
                  </div>
                </div>
              )}
              {header === "minimal" && <div style={{ display: "flex", height: 2, width: 80, background: theme.colors.text, marginTop: 16 }} />}
              <div
                style={{
                  display: "flex",
                  fontFamily: "Heading",
                  fontWeight: 700,
                  fontSize: size,
                  lineHeight: 1.08,
                  letterSpacing: tracking(theme.heading.tracking, size),
                  color: topText,
                  marginTop: header === "minimal" ? 12 : 8,
                }}
              >
                {name}
              </div>
              {header === "minimal" && <div style={{ display: "flex", height: 2, width: 80, background: theme.colors.text, marginTop: 14 }} />}
              {shop.ownerName && (
                <div style={{ display: "flex", fontSize: 26, color: topMuted, marginTop: 8 }}>{shop.ownerName}</div>
              )}
            </div>
          </div>

          {/* Contact */}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              justifyContent: "center",
              flex: 1,
              padding: "16px 48px 64px",
              gap: 18,
            }}
          >
            {description && (
              <div
                style={{
                  display: "flex",
                  fontSize: 25,
                  lineHeight: 1.35,
                  color: theme.colors.muted,
                  marginBottom: 6,
                  maxWidth: CARD_SIZE.width - panelWidth - 96,
                }}
              >
                {description}
              </div>
            )}
            {contact.map((row) => (
              <div key={row.icon} style={{ display: "flex", alignItems: "center" }}>
                <div
                  style={{
                    display: "flex",
                    width: 50,
                    height: 50,
                    flexShrink: 0,
                    borderRadius: theme.chips === "pill" ? 999 : 10,
                    background: accent.primary,
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <IconSvg d={ICONS[row.icon]} color={accent.on} />
                </div>
                <div
                  style={{
                    display: "flex",
                    marginLeft: 20,
                    fontSize: row.bold ? 34 : 27,
                    fontWeight: row.bold ? 700 : 400,
                    lineHeight: 1.25,
                    color: theme.colors.text,
                    maxWidth: CARD_SIZE.width - panelWidth - 170,
                  }}
                >
                  {row.text}
                </div>
              </div>
            ))}
          </div>

          {/* Footer */}
          <div
            style={{
              display: "flex",
              position: "absolute",
              left: 48,
              right: 40,
              bottom: 26,
              alignItems: "center",
              justifyContent: "space-between",
              fontSize: 21,
              color: theme.colors.muted,
            }}
          >
            {rating > 0 ? (
              <div style={{ display: "flex", alignItems: "center", fontWeight: 700, color: theme.colors.text }}>
                <svg width={24} height={24} viewBox="0 0 24 24" fill="#f59e0b">
                  <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                </svg>
                <div style={{ display: "flex", marginLeft: 8 }}>
                  {rating.toFixed(1)} ({shop.ratingCount} {shop.ratingCount === 1 ? "review" : "reviews"})
                </div>
              </div>
            ) : (
              <div style={{ display: "flex" }} />
            )}
            {!shop.hideBranding && <div style={{ display: "flex" }}>Made with {SITE_NAME}</div>}
          </div>
        </div>

        {/* Right: QR code to the catalog */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            width: panelWidth,
            height: mainHeight,
            background: header === "hero" ? "#0b0f19" : accent.primary,
            color: header === "hero" ? "#ffffff" : accent.on,
            borderLeft: header === "hero" ? `10px solid ${accent.primary}` : "none",
          }}
        >
          <div style={{ display: "flex", fontSize: 30, fontWeight: 700 }}>Scan to see our catalog</div>
          <div
            style={{
              display: "flex",
              marginTop: 20,
              padding: 20,
              background: "#ffffff",
              borderRadius: Math.min(28, px(theme.radius.card) * 1.4),
              boxShadow: "0 8px 24px rgba(0,0,0,0.18)",
            }}
          >
            {/* eslint-disable-next-line jsx-a11y/alt-text */}
            <img src={qr} width={244} height={244} />
          </div>
          <div style={{ display: "flex", alignItems: "center", marginTop: 22, fontSize: 25, fontWeight: 700 }}>
            <IconSvg d={ICONS.globe} color={header === "hero" ? "#ffffff" : accent.on} size={24} />
            <div style={{ display: "flex", marginLeft: 8 }}>{clip(shortUrl, 26)}</div>
          </div>
          <div style={{ display: "flex", marginTop: 6, fontSize: 22, opacity: 0.85 }}>Order on WhatsApp</div>
        </div>
      </div>
    </div>
  );

  const headers: Record<string, string> = {
    "Cache-Control": opts.immutable
      ? "public, max-age=86400, s-maxage=604800"
      : "public, max-age=600, s-maxage=3600",
  };
  if (opts.download) headers["Content-Disposition"] = `attachment; filename="${shop.slug}-visiting-card.png"`;

  return new ImageResponse(element, { ...CARD_SIZE, fonts: fonts.length ? fonts : undefined, headers });
}
