export const SUPABASE_URL = (process.env.NEXT_PUBLIC_SUPABASE_URL ?? "").replace(/\/+$/, "");
// New Supabase projects call this the "publishable" key (sb_publishable_...);
// older ones call it the "anon" key. Either name works here.
export const SUPABASE_ANON_KEY =
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";

export const isSupabaseConfigured = () =>
  SUPABASE_URL.startsWith("http") && SUPABASE_ANON_KEY.length > 0;

/** Public address of the photo bucket (Cloudflare R2). Photos live at "<base>/<userId>/<file>". */
export const MEDIA_BASE_URL = (process.env.NEXT_PUBLIC_MEDIA_BASE_URL ?? "").replace(/\/+$/, "");

/**
 * True for a photo stored in our own bucket. Not tied to one user's folder, because a shop
 * keeps its old photos after it moves to a different login account.
 */
export function isMediaUrl(url: string): boolean {
  return MEDIA_BASE_URL.startsWith("http") && url.startsWith(`${MEDIA_BASE_URL}/`) && !url.includes("..");
}

/** The path of one of our photos inside the bucket ("<userId>/<file>"), or null for any other URL. */
export function mediaPathOf(url: string): string | null {
  if (!isMediaUrl(url)) return null;
  const path = url.slice(`${MEDIA_BASE_URL}/`.length).split("?")[0];
  return path ? decodeURIComponent(path) : null;
}

/** Public URL of a file in the bucket. */
export const mediaUrlOf = (path: string) => `${MEDIA_BASE_URL}/${path}`;
