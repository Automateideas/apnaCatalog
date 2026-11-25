import "server-only";

import { citySlugOf } from "@/lib/utils";

const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;

/** Try to pull lat/lng from a Google Maps URL — full or short (goo.gl). */
export async function extractCoordsFromMapsUrl(url: string): Promise<{ lat: number; lng: number } | null> {
  const direct = parseCoordsFromUrl(url);
  if (direct) return direct;

  if (/maps\.app\.goo\.gl|goo\.gl\/maps/i.test(url)) {
    try {
      const res = await fetch(url, { redirect: "follow", signal: AbortSignal.timeout(5000) });
      return parseCoordsFromUrl(res.url);
    } catch {
      return null;
    }
  }
  return null;
}

function parseCoordsFromUrl(url: string): { lat: number; lng: number } | null {
  let m = url.match(/@(-?\d+\.\d{3,}),(-?\d+\.\d{3,})/);
  if (m) return coord(m[1], m[2]);

  m = url.match(/[?&]q=(-?\d+\.\d{3,}),(-?\d+\.\d{3,})/);
  if (m) return coord(m[1], m[2]);

  m = url.match(/[?&]ll=(-?\d+\.\d{3,}),(-?\d+\.\d{3,})/);
  if (m) return coord(m[1], m[2]);

  return null;
}

function coord(latStr: string, lngStr: string) {
  const lat = Number(latStr);
  const lng = Number(lngStr);
  if (lat < -90 || lat > 90 || lng < -180 || lng > 180) return null;
  return { lat: Number(lat.toFixed(6)), lng: Number(lng.toFixed(6)) };
}

export type GeoLocation = {
  locality?: string;
  city?: string;
  citySlug?: string;
};

/** Reverse-geocode a point to locality + city via Mapbox. */
export async function reverseGeocode(lat: number, lng: number): Promise<GeoLocation | null> {
  if (!MAPBOX_TOKEN) return null;
  try {
    const res = await fetch(
      `https://api.mapbox.com/geocoding/v5/mapbox.places/${lng.toFixed(6)},${lat.toFixed(6)}.json?types=locality,neighborhood,place&language=en&access_token=${MAPBOX_TOKEN}`,
      { signal: AbortSignal.timeout(5000) },
    );
    if (!res.ok) return null;
    const data = (await res.json()) as { features?: { place_type?: string[]; text?: string }[] };
    const features = data.features ?? [];
    const locality = features.find((f) => f.place_type?.some((t) => t === "locality" || t === "neighborhood"))?.text;
    const city = features.find((f) => f.place_type?.includes("place"))?.text;
    if (!locality && !city) return null;
    return { locality: locality ?? undefined, city: city ?? undefined, citySlug: city ? citySlugOf(city) : undefined };
  } catch {
    return null;
  }
}

/** Reverse-geocode a point to a city name via Mapbox. */
export async function reverseGeocodeCity(lat: number, lng: number): Promise<{ city: string; citySlug: string } | null> {
  const geo = await reverseGeocode(lat, lng);
  if (!geo?.city || !geo.citySlug) return null;
  return { city: geo.city, citySlug: geo.citySlug };
}
