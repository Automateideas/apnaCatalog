export const SUPABASE_URL = (process.env.NEXT_PUBLIC_SUPABASE_URL ?? "").replace(/\/+$/, "");
// New Supabase projects call this the "publishable" key (sb_publishable_...);
// older ones call it the "anon" key. Either name works here.
export const SUPABASE_ANON_KEY =
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";
export const MEDIA_BUCKET = "shop-media";

export const isSupabaseConfigured = () =>
  SUPABASE_URL.startsWith("http") && SUPABASE_ANON_KEY.length > 0;

/**
 * True for a photo stored in our own bucket. Not tied to one user's folder, because a shop
 * keeps its old photos after it moves to a different login account.
 */
export function isMediaUrl(url: string): boolean {
  return url.startsWith(`${SUPABASE_URL}/storage/v1/object/public/${MEDIA_BUCKET}/`) && !url.includes("..");
}

/** Public URL prefix of files a given user uploaded. */
export function mediaPrefix(userId: string): string {
  return `${SUPABASE_URL}/storage/v1/object/public/${MEDIA_BUCKET}/${userId}/`;
}
