"use server";

import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/db";
import { reviews, shops } from "@/db/schema";
import { requireAdmin } from "@/lib/auth";
import { setPendingOwner } from "@/lib/owner-change";
import { refreshShopRating } from "@/lib/shop-stats";
import type { ActionResult } from "@/lib/utils";

export async function adminSetShopHidden(id: string, hidden: boolean): Promise<ActionResult> {
  await requireAdmin();
  if (!z.uuid().safeParse(id).success) return { ok: false, error: "Shop not found." };
  await db.update(shops).set({ isHidden: Boolean(hidden) }).where(eq(shops.id, id));
  revalidatePath("/admin");
  return { ok: true };
}

/** months = 0 moves the shop to the free plan; otherwise adds that many paid months. */
export async function adminSetShopPlan(id: string, months: number): Promise<ActionResult> {
  await requireAdmin();
  if (!z.uuid().safeParse(id).success) return { ok: false, error: "Shop not found." };
  if (!Number.isInteger(months) || months < 0 || months > 36) {
    return { ok: false, error: "Invalid plan length." };
  }

  if (months === 0) {
    await db
      .update(shops)
      .set({ plan: "free", planExpiresAt: null, hideBranding: false })
      .where(eq(shops.id, id));
  } else {
    // Add to the time the shop already has, so a grant never shortens a plan.
    const [current] = await db
      .select({ plan: shops.plan, planExpiresAt: shops.planExpiresAt })
      .from(shops)
      .where(eq(shops.id, id))
      .limit(1);
    if (!current) return { ok: false, error: "Shop not found." };
    const stillActive =
      current.plan === "paid" && current.planExpiresAt && current.planExpiresAt > new Date();
    const expires = stillActive ? new Date(current.planExpiresAt!) : new Date();
    expires.setMonth(expires.getMonth() + months);
    await db.update(shops).set({ plan: "paid", planExpiresAt: expires }).where(eq(shops.id, id));
  }
  revalidatePath("/admin");
  return { ok: true };
}

const MAX_PLAN_YEARS = 5;

/**
 * Sets the paid plan to end on a chosen day (YYYY-MM-DD), replacing the current end date.
 * The plan lasts until the end of that day in India.
 */
export async function adminSetShopPlanUntil(id: string, date: string): Promise<ActionResult> {
  await requireAdmin();
  if (!z.uuid().safeParse(id).success) return { ok: false, error: "Shop not found." };
  if (!z.iso.date().safeParse(date).success) return { ok: false, error: "Choose a valid date." };

  const expires = new Date(`${date}T23:59:59+05:30`);
  const latest = new Date();
  latest.setFullYear(latest.getFullYear() + MAX_PLAN_YEARS);
  if (expires <= new Date()) return { ok: false, error: "Choose today or a later date." };
  if (expires > latest) {
    return { ok: false, error: `The date can be at most ${MAX_PLAN_YEARS} years from today.` };
  }

  const updated = await db
    .update(shops)
    .set({ plan: "paid", planExpiresAt: expires })
    .where(eq(shops.id, id))
    .returning({ id: shops.id });
  if (updated.length === 0) return { ok: false, error: "Shop not found." };

  revalidatePath("/admin");
  return { ok: true };
}

export async function adminSetReviewHidden(id: string, hidden: boolean): Promise<ActionResult> {
  await requireAdmin();
  if (!z.uuid().safeParse(id).success) return { ok: false, error: "Review not found." };
  const [row] = await db
    .update(reviews)
    .set({ isHidden: Boolean(hidden), isReported: false })
    .where(eq(reviews.id, id))
    .returning({ shopId: reviews.shopId });
  if (row) await refreshShopRating(row.shopId);
  revalidatePath("/admin");
  return { ok: true };
}

/** For a shopkeeper who lost their old Google account. Empty email cancels a pending change. */
export async function adminSetShopLoginEmail(id: string, email: string): Promise<ActionResult> {
  await requireAdmin();
  if (!z.uuid().safeParse(id).success) return { ok: false, error: "Shop not found." };
  const [shop] = await db
    .select({ id: shops.id, ownerEmail: shops.ownerEmail })
    .from(shops)
    .where(eq(shops.id, id))
    .limit(1);
  if (!shop) return { ok: false, error: "Shop not found." };

  const result = await setPendingOwner(shop, email);
  if (result.ok) revalidatePath("/admin");
  return result;
}
