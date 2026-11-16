import "server-only";
import { cache } from "react";
import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { shops, type Shop } from "@/db/schema";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/env";

export type SessionUser = { id: string; email: string | null };

/** The signed-in user, verified with Supabase. Null when signed out. */
export const getUser = cache(async (): Promise<SessionUser | null> => {
  // Local development only: lets you try the dashboard before setting up Supabase.
  // Ignored in production builds. Photo upload still needs Supabase.
  if (process.env.NODE_ENV === "development" && process.env.DEV_LOGIN_EMAIL) {
    return { id: "00000000-0000-4000-8000-000000000001", email: process.env.DEV_LOGIN_EMAIL };
  }
  if (!isSupabaseConfigured()) return null;
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) return null;
  // The email decides admin access and shop transfers, so only trust one Google has verified.
  const meta = data.user.app_metadata ?? {};
  const viaGoogle =
    meta.provider === "google" ||
    (Array.isArray(meta.providers) && meta.providers.includes("google"));
  return { id: data.user.id, email: viaGoogle ? (data.user.email ?? null) : null };
});

export async function requireUser(): Promise<SessionUser> {
  const user = await getUser();
  if (!user) redirect("/login");
  return user;
}

export const getShopByOwner = cache(async (ownerId: string): Promise<Shop | null> => {
  const [shop] = await db.select().from(shops).where(eq(shops.ownerId, ownerId)).limit(1);
  return shop ?? null;
});

/** For dashboard pages: signed-in user plus their shop. Sends new users to onboarding. */
export async function requireShop(): Promise<{ user: SessionUser; shop: Shop }> {
  const user = await requireUser();
  const shop = await getShopByOwner(user.id);
  if (!shop) redirect("/dashboard/new");
  return { user, shop };
}

export function isAdminEmail(email: string | null | undefined): boolean {
  if (!email) return false;
  const admins = (process.env.ADMIN_EMAILS ?? "")
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
  return admins.includes(email.toLowerCase());
}

export async function requireAdmin(): Promise<SessionUser> {
  const user = await requireUser();
  if (!isAdminEmail(user.email)) redirect("/");
  return user;
}
