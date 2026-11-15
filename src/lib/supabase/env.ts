export const SUPABASE_URL = (process.env.NEXT_PUBLIC_SUPABASE_URL ?? "").replace(/\/+$/, "");
export const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";
export const MEDIA_BUCKET = "shop-media";

export const isSupabaseConfigured = () =>
  SUPABASE_URL.startsWith("http") && SUPABASE_ANON_KEY.length > 0;

/** Public URL prefix of files a given user uploaded. */
export function mediaPrefix(userId: string): string {
  return `${SUPABASE_URL}/storage/v1/object/public/${MEDIA_BUCKET}/${userId}/`;
}
