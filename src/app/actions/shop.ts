"use server";

import { randomBytes } from "node:crypto";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { refreshShopPage } from "@/lib/shop-data";
import { count, eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/db";
import { categories, shops, type BusinessHour } from "@/db/schema";
import { getShopByOwner, requireUser } from "@/lib/auth";
import {
  BUSINESS_TYPE_IDS,
  getBusinessType,
  INVITE_COOKIE,
  isPaid,
  LAUNCH_OFFER_DAYS,
  LAUNCH_OFFER_SHOPS,
  MAX_SHOP_PHOTOS,
  RESERVED_SLUGS,
} from "@/lib/catalog-config";
import { removeUnusedMedia } from "@/lib/media";
import { getTheme, themeForType } from "@/lib/themes";
import { isMediaUrl } from "@/lib/media-url";
import { extractCoordsFromMapsUrl } from "@/lib/geo";
import {
  citySlugOf,
  normalizePhone,
  SLUG_PATTERN,
  slugify,
  titleCase,
  type ActionResult,
} from "@/lib/utils";

const businessType = z.string().refine((v) => BUSINESS_TYPE_IDS.includes(v), "Choose a shop type.");
const optionalText = (max: number) =>
  z
    .string()
    .trim()
    .max(max)
    .transform((v) => v || null)
    .nullable()
    .optional();

const createSchema = z.object({
  name: z.string().trim().min(2, "Enter your shop name.").max(60),
  businessType,
  state: z.string().trim().min(2, "Choose your state.").max(60),
  city: z.string().trim().min(2, "Enter your city.").max(40),
  whatsapp: z.string(),
  slug: z.string().trim().max(50).optional(),
});

async function slugTaken(slug: string): Promise<boolean> {
  const [row] = await db.select({ id: shops.id }).from(shops).where(eq(shops.slug, slug)).limit(1);
  return Boolean(row);
}

export async function createShop(input: z.input<typeof createSchema>): Promise<ActionResult> {
  const user = await requireUser();
  if (await getShopByOwner(user.id)) redirect("/dashboard");

  const parsed = createSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0].message };
  const data = parsed.data;

  const whatsapp = normalizePhone(data.whatsapp);
  if (!whatsapp) return { ok: false, error: "Enter a valid 10-digit WhatsApp number." };

  const custom = Boolean(data.slug);
  let slug = slugify(data.slug || data.name);
  if (!SLUG_PATTERN.test(slug)) {
    if (custom) {
      return { ok: false, error: "The link needs at least 3 English letters or numbers." };
    }
    // Shop name in Hindi or another script: links must be in English letters,
    // so start from a neutral link the owner can replace in the form.
    slug = `shop-${randomBytes(3).toString("hex")}`;
  }
  if (RESERVED_SLUGS.has(slug)) {
    if (custom) return { ok: false, error: "This link is not available. Try another." };
    slug = `${slug}-store`;
  }
  if (await slugTaken(slug)) {
    if (custom) return { ok: false, error: "This link is already taken. Try another." };
    const citySlug = slugify(data.city) || "shop";
    const candidates = [`${slug}-${citySlug}`.slice(0, 50), ...[2, 3, 4, 5, 6].map((n) => `${slug.slice(0, 46)}-${n}`)];
    let found: string | null = null;
    for (const candidate of candidates) {
      if (SLUG_PATTERN.test(candidate) && !(await slugTaken(candidate))) {
        found = candidate;
        break;
      }
    }
    if (!found) return { ok: false, error: "This shop name is taken. Type your own link below." };
    slug = found;
  }

  // Set by the invite link (/invite/[slug]) the seller opened before signing up.
  const cookieStore = await cookies();
  const inviteSlug = cookieStore.get(INVITE_COOKIE)?.value;
  let invitedBy: string | null = null;
  if (inviteSlug && SLUG_PATTERN.test(inviteSlug)) {
    const [inviter] = await db
      .select({ id: shops.id })
      .from(shops)
      .where(eq(shops.slug, inviteSlug))
      .limit(1);
    invitedBy = inviter?.id ?? null;
  }

  const type = getBusinessType(data.businessType);
  const [{ total }] = await db.select({ total: count() }).from(shops);
  const launchOffer = total < LAUNCH_OFFER_SHOPS;

  try {
    // One transaction, so a shop is never left without its starting categories.
    await db.transaction(async (tx) => {
      const [shop] = await tx
        .insert(shops)
        .values({
          ownerId: user.id,
          ownerEmail: user.email,
          slug,
          name: data.name,
          businessType: type.id,
          state: data.state,
          city: titleCase(data.city),
          citySlug: citySlugOf(data.city),
          whatsapp,
          phone: whatsapp,
          layout: type.layout,
          // No theme chosen yet: the shop shows the theme made for its business type.
          palette: themeForType(type.id).accents[0].id,
          plan: launchOffer ? "pro" : "free",
          planExpiresAt: launchOffer
            ? new Date(Date.now() + LAUNCH_OFFER_DAYS * 24 * 60 * 60 * 1000)
            : null,
          invitedBy,
          reviewToken: randomBytes(12).toString("base64url"),
        })
        .returning({ id: shops.id });

      await tx
        .insert(categories)
        .values(type.categories.map((name, i) => ({ shopId: shop.id, name, sort: i })));
    });
  } catch {
    return { ok: false, error: "Could not create the shop. The link may be taken; try another." };
  }

  cookieStore.delete(INVITE_COOKIE);
  // The link may have been visited before the shop existed ("not found" is cached too).
  refreshShopPage(slug);
  // The dashboard header was rendered without a shop; refresh it so the tabs appear.
  revalidatePath("/dashboard", "layout");
  redirect("/dashboard?welcome=1");
}

const updateSchema = z.object({
  name: z.string().trim().min(2, "Enter your shop name.").max(60),
  businessType,
  description: optionalText(300),
  state: z.string().trim().max(60).nullable().optional(),
  city: z.string().trim().min(2, "Enter your city.").max(40),
  address: optionalText(200),
  phone: z.string().optional().nullable(),
  whatsapp: z.string(),
  ownerName: optionalText(60),
  reraNumber: optionalText(40),
  logoUrl: z.string().nullable().optional(),
  ownerPhotoUrl: z.string().nullable().optional(),
  shopPhotoUrls: z.array(z.string().max(500)).max(20).optional(),
  lat: z.number().min(-90).max(90).nullable().optional(),
  lng: z.number().min(-180).max(180).nullable().optional(),
  mapsUrl: optionalText(500),
  instagram: optionalText(200),
  facebook: optionalText(200),
  youtube: optionalText(200),
  businessHours: z
    .array(
      z.object({
        day: z.string(),
        open: z.string(),
        close: z.string(),
        closed: z.boolean(),
      }),
    )
    .max(7)
    .nullable()
    .optional(),
  announcement: optionalText(300),
  announcementActive: z.boolean().optional(),
});

/** True only for links whose host really is Google Maps (exact host match). */
function isGoogleMapsUrl(value: string): boolean {
  let url: URL;
  try {
    url = new URL(value);
  } catch {
    return false;
  }
  if (url.protocol !== "https:") return false;
  const host = url.hostname.toLowerCase();
  if (host === "maps.app.goo.gl") return true;
  if (host === "goo.gl") return url.pathname.startsWith("/maps");
  const google = /^(www\.|maps\.)?google\.(com|co\.in|in)$/.test(host);
  return google && (host.startsWith("maps.") || url.pathname.startsWith("/maps"));
}

function ownMedia(url: string | null | undefined): string | null {
  return url && isMediaUrl(url) ? url : null;
}

export async function updateShop(input: z.input<typeof updateSchema>): Promise<ActionResult> {
  const user = await requireUser();
  const shop = await getShopByOwner(user.id);
  if (!shop) return { ok: false, error: "Shop not found." };

  const parsed = updateSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0].message };
  const data = parsed.data;

  const whatsapp = normalizePhone(data.whatsapp);
  if (!whatsapp) return { ok: false, error: "Enter a valid 10-digit WhatsApp number." };
  const phone = data.phone ? normalizePhone(data.phone) : null;
  if (data.phone && !phone) return { ok: false, error: "Enter a valid 10-digit phone number." };

  if (data.mapsUrl && !isGoogleMapsUrl(data.mapsUrl)) {
    return { ok: false, error: "Paste a Google Maps link (it starts with https://maps.app.goo.gl/...)." };
  }

  const shopPhotoUrls = [...new Set((data.shopPhotoUrls ?? []).filter(isMediaUrl))];
  if (shopPhotoUrls.length > MAX_SHOP_PHOTOS) {
    return { ok: false, error: `A shop can have at most ${MAX_SHOP_PHOTOS} photos.` };
  }

  // Keep the old layout column in step with the type, for older app versions.
  const newType = getBusinessType(data.businessType);

  let lat = data.lat ?? null;
  let lng = data.lng ?? null;
  if (lat == null && lng == null && data.mapsUrl) {
    const extracted = await extractCoordsFromMapsUrl(data.mapsUrl).catch(() => null);
    if (extracted) {
      lat = extracted.lat;
      lng = extracted.lng;
    }
  }

  await db
    .update(shops)
    .set({
      layout: newType.layout,
      name: data.name,
      businessType: data.businessType,
      description: data.description ?? null,
      state: data.state ?? null,
      city: titleCase(data.city),
      citySlug: citySlugOf(data.city),
      address: data.address ?? null,
      phone,
      whatsapp,
      ownerName: data.ownerName ?? null,
      reraNumber: data.businessType === "property" ? (data.reraNumber ?? null) : null,
      logoUrl: ownMedia(data.logoUrl),
      ownerPhotoUrl: ownMedia(data.ownerPhotoUrl),
      shopPhotoUrls,
      lat,
      lng,
      mapsUrl: data.mapsUrl ?? null,
      instagram: data.instagram ?? null,
      facebook: data.facebook ?? null,
      youtube: data.youtube ?? null,
      businessHours: (data.businessHours as BusinessHour[] | null) ?? null,
      announcement: data.announcement ?? null,
      announcementActive: data.announcementActive ?? false,
      updatedAt: new Date(),
    })
    .where(eq(shops.id, shop.id));

  // A replaced or removed logo, owner photo or shop photo is deleted from storage.
  await removeUnusedMedia(shop.id, [shop.logoUrl, shop.ownerPhotoUrl, ...shop.shopPhotoUrls]);

  revalidatePath("/dashboard", "layout");
  revalidatePath(`/${shop.slug}`);
  refreshShopPage(shop.slug);
  return { ok: true };
}

const themeSchema = z.object({
  theme: z.string(),
  accent: z.string(),
  hideBranding: z.boolean(),
});

/** Every shop can use every theme; hiding the Apnacatalog line needs the paid plan. */
export async function updateTheme(input: z.input<typeof themeSchema>): Promise<ActionResult> {
  const user = await requireUser();
  const shop = await getShopByOwner(user.id);
  if (!shop) return { ok: false, error: "Shop not found." };

  const parsed = themeSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Invalid theme." };
  const theme = getTheme(parsed.data.theme);
  const accent = theme?.accents.find((a) => a.id === parsed.data.accent);
  if (!theme || !accent) return { ok: false, error: "Invalid theme." };
  if (parsed.data.hideBranding && !isPaid(shop)) {
    return { ok: false, error: "Hiding the Apnacatalog line needs the paid plan." };
  }

  await db
    .update(shops)
    .set({ theme: theme.id, palette: accent.id, hideBranding: parsed.data.hideBranding, updatedAt: new Date() })
    .where(eq(shops.id, shop.id));

  revalidatePath("/dashboard", "layout");
  revalidatePath(`/${shop.slug}`);
  refreshShopPage(shop.slug);
  return { ok: true };
}
