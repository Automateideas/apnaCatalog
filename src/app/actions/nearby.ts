"use server";

import { and, desc, eq, ilike, isNotNull, or, sql } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/db";
import { shops } from "@/db/schema";
import type { ShopCardData } from "@/components/ShopCard";
import { BUSINESS_TYPES } from "@/lib/catalog-config";
import { reverseGeocode } from "@/lib/geo";
import { listedShop, paidNow } from "@/lib/shop-stats";

export type NearbyShop = ShopCardData & { lat: number; lng: number; meters: number };
export type DetectedCity = { city: string; citySlug: string };
export type DetectedLocality = { locality?: string; city?: string; citySlug?: string };

const input = z.object({
  lat: z.number().min(-90).max(90),
  lng: z.number().min(-180).max(180),
  type: z.string().max(40).optional(),
  q: z.string().max(60).optional(),
});

/** How many shops "Near me" shows. 24 + the customer fits one Mapbox Matrix request (25 points). */
const LIMIT = 24;

/**
 * The listed shops closest to a point, by straight-line distance.
 * The customer's location is only used for this query: it is not saved or logged.
 */
export async function nearbyShops(raw: unknown): Promise<{ ok: true; shops: NearbyShop[]; detectedCity?: DetectedCity; detectedLocality?: DetectedLocality } | { ok: false }> {
  const parsed = input.safeParse(raw);
  if (!parsed.success) return { ok: false };
  const { lat, lng } = parsed.data;
  const type = BUSINESS_TYPES.some((t) => t.id === parsed.data.type) ? parsed.data.type : "";
  const q = (parsed.data.q ?? "").trim().replace(/[\\%_]/g, "\\$&");

  // Haversine distance in metres.
  const meters = sql<number>`(6371000 * 2 * asin(sqrt(
    power(sin(radians(${shops.lat} - ${lat}) / 2), 2) +
    cos(radians(${lat})) * cos(radians(${shops.lat})) * power(sin(radians(${shops.lng} - ${lng}) / 2), 2)
  )))`;

  try {
    const rows = await db
      .select({
        slug: shops.slug,
        name: shops.name,
        businessType: shops.businessType,
        city: shops.city,
        description: shops.description,
        logoUrl: shops.logoUrl,
        coverUrl: sql<string | null>`${shops.shopPhotoUrls}[1]`,
        palette: shops.palette,
        theme: shops.theme,
        itemCount: shops.itemCount,
        ratingSum: shops.ratingSum,
        ratingCount: shops.ratingCount,
        featured: paidNow,
        lat: shops.lat,
        lng: shops.lng,
        meters,
      })
      .from(shops)
      .where(
        and(
          listedShop,
          isNotNull(shops.lat),
          isNotNull(shops.lng),
          type ? eq(shops.businessType, type) : undefined,
          q ? or(ilike(shops.name, `%${q}%`), ilike(shops.description, `%${q}%`)) : undefined,
        ),
      )
      .orderBy(meters, desc(shops.ratingCount))
      .limit(LIMIT);

    const mapped = rows.map((r) => ({ ...r, lat: r.lat!, lng: r.lng!, meters: Number(r.meters) }));

    const geo = await reverseGeocode(lat, lng).catch(() => null);
    const detectedLocality = geo ?? undefined;
    const detectedCity = geo?.city && geo.citySlug ? { city: geo.city, citySlug: geo.citySlug } : undefined;

    if (mapped.length === 0) {
      return { ok: true, shops: [], detectedCity, detectedLocality };
    }

    return { ok: true, shops: mapped, detectedCity, detectedLocality };
  } catch (error) {
    console.error("Nearby shops could not be loaded", error);
    return { ok: false };
  }
}
