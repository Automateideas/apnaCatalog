export const SITE_NAME = "Apnacatalog";

export function siteUrl(): string {
  // On Vercel, fall back to the production domain, so canonical links and the sitemap never
  // point at localhost when NEXT_PUBLIC_SITE_URL is missing.
  const vercel = process.env.NEXT_PUBLIC_VERCEL_PROJECT_PRODUCTION_URL || process.env.VERCEL_PROJECT_PRODUCTION_URL;
  return (process.env.NEXT_PUBLIC_SITE_URL || (vercel ? `https://${vercel}` : "http://localhost:3210")).replace(
    /\/+$/,
    "",
  );
}

export function slugify(input: string): string {
  return input
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 50)
    .replace(/-+$/g, "");
}

/**
 * Key used to group and filter shops by city. Falls back to the name itself
 * for cities written in Hindi or another non-Latin script.
 */
export function citySlugOf(name: string): string {
  return (
    slugify(name) || name.trim().toLowerCase().replace(/\s+/g, "-").slice(0, 50)
  );
}

export const SLUG_PATTERN = /^[a-z0-9][a-z0-9-]{1,48}[a-z0-9]$/;

/** Returns a 10-digit Indian mobile number, or null if the input is not one. */
export function normalizePhone(
  input: string | null | undefined,
): string | null {
  if (!input) return null;
  let digits = input.replace(/\D/g, "");
  if (digits.length === 12 && digits.startsWith("91")) digits = digits.slice(2);
  if (digits.length === 11 && digits.startsWith("0")) digits = digits.slice(1);
  return /^[6-9]\d{9}$/.test(digits) ? digits : null;
}

export function waLink(phone10: string, text?: string): string {
  const base = `https://wa.me/91${phone10}`;
  return text ? `${base}?text=${encodeURIComponent(text)}` : base;
}

/** Opens WhatsApp's "choose a contact" screen with the text filled in. */
export function waShareLink(text: string): string {
  return `https://wa.me/?text=${encodeURIComponent(text)}`;
}

const inrWhole = new Intl.NumberFormat("en-IN", { maximumFractionDigits: 0 });
const inrPaise = new Intl.NumberFormat("en-IN", {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

/** Formats paise as rupees: 124000 -> "₹1,240", 24950 -> "₹249.50". */
export function formatPrice(paise: number): string {
  return `₹${(paise % 100 === 0 ? inrWhole : inrPaise).format(paise / 100)}`;
}

export function rupeesToPaise(value: number): number {
  return Math.round(value * 100);
}

export function formatDate(date: Date): string {
  return new Intl.DateTimeFormat("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "Asia/Kolkata",
  }).format(date);
}

export function formatDateTime(date: Date): string {
  return new Intl.DateTimeFormat("en-IN", {
    day: "numeric",
    month: "short",
    hour: "numeric",
    minute: "2-digit",
    timeZone: "Asia/Kolkata",
  }).format(date);
}

export function initials(name: string): string {
  const words = name.trim().split(/\s+/).filter(Boolean);
  const letters =
    words.length > 1
      ? words[0][0] + words[1][0]
      : (words[0] ?? "A").slice(0, 2);
  return letters.toUpperCase();
}

export function titleCase(input: string): string {
  return input
    .trim()
    .replace(/\s+/g, " ")
    .toLowerCase()
    .replace(/\b[a-z]/g, (c) => c.toUpperCase());
}

export function directionsUrl(shop: {
  lat: number | null;
  lng: number | null;
  mapsUrl: string | null;
}): string | null {
  if (shop.lat != null && shop.lng != null) {
    return `https://www.google.com/maps/dir/?api=1&destination=${shop.lat},${shop.lng}`;
  }
  return shop.mapsUrl || null;
}

export type ActionResult<T = undefined> =
  | ({ ok: true } & (T extends undefined ? { data?: undefined } : { data: T }))
  | { ok: false; error: string };

export function cx(...parts: (string | false | null | undefined)[]): string {
  return parts.filter(Boolean).join(" ");
}
