/** Distance helpers for "near me" features. Runs in the browser; uses the public Mapbox token. */

const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;
/** Up to this straight-line distance the walking route is shown, past it the driving one. */
export const WALK_LIMIT = 2000;

export type Point = { lat: number; lng: number };
export type Road = { meters: number; seconds: number; mode: "walk" | "drive" };

/** Straight-line distance in metres. */
export function straightMeters(a: Point, b: Point) {
  const rad = (d: number) => (d * Math.PI) / 180;
  const h =
    Math.sin(rad(b.lat - a.lat) / 2) ** 2 +
    Math.cos(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.sin(rad(b.lng - a.lng) / 2) ** 2;
  return 6371000 * 2 * Math.asin(Math.sqrt(h));
}

export function formatMeters(m: number) {
  if (m < 1000) return `${Math.max(10, Math.round(m / 10) * 10)} m`;
  return `${(m / 1000).toFixed(m < 10000 ? 1 : 0)} km`;
}

export function formatMinutes(s: number) {
  const min = Math.max(1, Math.round(s / 60));
  return min < 60 ? `${min} min` : `${Math.floor(min / 60)} h ${min % 60} min`;
}

export function formatRoad(road: Road) {
  return `${formatMeters(road.meters)} · ${formatMinutes(road.seconds)} ${road.mode}`;
}

/** Road distance and time from one point to each place, from the Mapbox Matrix API (max 24 places). */
export async function roadDistances(
  from: Point,
  list: (Point & { id: string })[],
  profile: "walking" | "driving",
) {
  const result = new Map<string, Road>();
  if (!MAPBOX_TOKEN || list.length === 0) return result;
  const points = [from, ...list];
  if (
    !points.every(
      ({ lat, lng }) =>
        Number.isFinite(lat) && Number.isFinite(lng) && Math.abs(lat) <= 90 && Math.abs(lng) <= 180,
    )
  ) {
    return result;
  }
  const coords = points.map((p) => `${p.lng.toFixed(6)},${p.lat.toFixed(6)}`).join(";");
  const url = new URL("https://api.mapbox.com/directions-matrix/v1/mapbox/" + profile + "/" + coords);
  url.searchParams.set("sources", "0");
  url.searchParams.set("annotations", "distance,duration");
  url.searchParams.set("access_token", MAPBOX_TOKEN);
  if (url.protocol !== "https:" || url.hostname !== "api.mapbox.com") return result;
  const res = await fetch(url);
  if (!res.ok) return result;
  const data = (await res.json()) as { distances?: (number | null)[][]; durations?: (number | null)[][] };
  list.forEach((place, i) => {
    const meters = data.distances?.[0]?.[i + 1];
    const seconds = data.durations?.[0]?.[i + 1];
    if (meters != null && seconds != null) {
      result.set(place.id, { meters, seconds, mode: profile === "walking" ? "walk" : "drive" });
    }
  });
  return result;
}

/** Walking route for close places, driving for far ones. Never throws: failures give an empty map. */
export async function roadDistancesAuto(from: Point, list: (Point & { id: string; meters: number })[]) {
  const [walk, drive] = await Promise.all([
    roadDistances(from, list.filter((p) => p.meters <= WALK_LIMIT), "walking").catch(() => new Map<string, Road>()),
    roadDistances(from, list.filter((p) => p.meters > WALK_LIMIT), "driving").catch(() => new Map<string, Road>()),
  ]);
  return new Map([...walk, ...drive]);
}

/** The customer's location, as a promise. */
export function currentPosition(): Promise<Point> {
  return new Promise((resolve, reject) => {
    if (!("geolocation" in navigator)) return reject(new Error("unsupported"));
    navigator.geolocation.getCurrentPosition(
      (p) => resolve({ lat: p.coords.latitude, lng: p.coords.longitude }),
      reject,
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 60000 },
    );
  });
}

/** Message for a failed location request. */
export function locationError(error: unknown) {
  if ((error as Error | null)?.message === "unsupported") return "This phone cannot share its location.";
  return (error as GeolocationPositionError | null)?.code === 1
    ? "Location is blocked. Allow location for this site in your browser settings, then try again."
    : "Could not get your location. Turn on location (GPS) and try again.";
}

/** True when the customer already allowed location for this site, so asking again shows no popup. */
export async function locationAllowed() {
  try {
    return (await navigator.permissions?.query({ name: "geolocation" }))?.state === "granted";
  } catch {
    return false;
  }
}
