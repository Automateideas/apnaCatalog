"use server";

import { revalidatePath } from "next/cache";
import { and, arrayOverlaps, eq, inArray, ne, or } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/db";
import { items, reviews, shops, user } from "@/db/schema";
import { isMediaUrl, mediaPathOf } from "@/lib/media-url";
import { deleteObjects } from "@/lib/r2";
import { requireAdmin } from "@/lib/auth";
import { PAID_PLAN_IDS } from "@/lib/catalog-config";
import { addPaidMonths, keepPaidPlan, rewardInviter } from "@/lib/invite";
import { setPendingOwner } from "@/lib/owner-change";
import { refreshShopRating } from "@/lib/shop-stats";
import { refreshShopPage, refreshShopPageById } from "@/lib/shop-data";
import type { ActionResult } from "@/lib/utils";

export async function adminSetShopHidden(id: string, hidden: boolean): Promise<ActionResult> {
  await requireAdmin();
  if (!z.uuid().safeParse(id).success) return { ok: false, error: "Shop not found." };
  await db.update(shops).set({ isHidden: Boolean(hidden) }).where(eq(shops.id, id));
  await refreshShopPageById(id);
  revalidatePath("/admin");
  return { ok: true };
}

/**
 * months = 0 moves the shop to the free plan; otherwise adds that many paid months.
 * A shop's first paid grant also gives its inviter a free month (see rewardInviter).
 */
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
    const found = await db.transaction(async (tx) => {
      const [current] = await tx
        .select({ plan: shops.plan, planExpiresAt: shops.planExpiresAt })
        .from(shops)
        .where(eq(shops.id, id))
        .limit(1)
        .for("update");
      if (!current) return false;
      await tx
        .update(shops)
        .set({ plan: keepPaidPlan(current), planExpiresAt: addPaidMonths(current, months) })
        .where(eq(shops.id, id));
      await rewardInviter(tx, id);
      return true;
    });
    if (!found) return { ok: false, error: "Shop not found." };
  }
  await refreshShopPageById(id);
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

  const found = await db.transaction(async (tx) => {
    const [current] = await tx
      .select({ plan: shops.plan, planExpiresAt: shops.planExpiresAt })
      .from(shops)
      .where(eq(shops.id, id))
      .limit(1)
      .for("update");
    if (!current) return false;
    await tx.update(shops).set({ plan: keepPaidPlan(current), planExpiresAt: expires }).where(eq(shops.id, id));
    await rewardInviter(tx, id);
    return true;
  });
  if (!found) return { ok: false, error: "Shop not found." };

  await refreshShopPageById(id);
  revalidatePath("/admin");
  return { ok: true };
}

/** Switches a shop with paid time to another paid plan (Starter, Pro or Business). */
export async function adminSetShopTier(id: string, tier: string): Promise<ActionResult> {
  await requireAdmin();
  if (!z.uuid().safeParse(id).success) return { ok: false, error: "Shop not found." };
  if (!(PAID_PLAN_IDS as readonly string[]).includes(tier)) return { ok: false, error: "Unknown plan." };
  const updated = await db
    .update(shops)
    .set({ plan: tier })
    .where(and(eq(shops.id, id), ne(shops.plan, "free")))
    .returning({ id: shops.id });
  if (updated.length === 0) return { ok: false, error: "Give the shop paid time first." };
  await refreshShopPageById(id);
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
  if (row) {
    await refreshShopRating(row.shopId);
    await refreshShopPageById(row.shopId);
  }
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

/**
 * Deletes a shop for good: the shop with its items, categories, orders, reviews and reports
 * (all removed by the database with the shop), the owner's login, and every photo in storage.
 * `confirmSlug` must match the shop's link, so a stray click cannot do this.
 */
export async function adminDeleteShop(id: string, confirmSlug: string): Promise<ActionResult> {
  const admin = await requireAdmin();
  if (!z.uuid().safeParse(id).success) return { ok: false, error: "Shop not found." };

  const [shop] = await db.select().from(shops).where(eq(shops.id, id)).limit(1);
  if (!shop) return { ok: false, error: "Shop not found." };
  if (confirmSlug.trim().toLowerCase() !== shop.slug) {
    return { ok: false, error: `Type the shop link "${shop.slug}" exactly to delete it.` };
  }
  if (shop.ownerId === admin.id) return { ok: false, error: "You cannot delete your own shop from here." };

  // Every photo the shop shows: logo, owner photo, shop photos and item photos.
  const itemRows = await db.select({ urls: items.imageUrls }).from(items).where(eq(items.shopId, id));
  const urls = [
    ...new Set(
      [shop.logoUrl, shop.ownerPhotoUrl, ...shop.shopPhotoUrls, ...itemRows.flatMap((row) => row.urls)].filter(
        (url): url is string => !!url && isMediaUrl(url),
      ),
    ),
  ];

  // Keep any file another shop also shows (a copied photo link).
  let keep = new Set<string>();
  if (urls.length > 0) {
    const [otherShops, otherItems] = await Promise.all([
      db
        .select({ logoUrl: shops.logoUrl, ownerPhotoUrl: shops.ownerPhotoUrl, shopPhotoUrls: shops.shopPhotoUrls })
        .from(shops)
        .where(
          and(
            ne(shops.id, id),
            or(inArray(shops.logoUrl, urls), inArray(shops.ownerPhotoUrl, urls), arrayOverlaps(shops.shopPhotoUrls, urls)),
          ),
        ),
      db
        .select({ urls: items.imageUrls })
        .from(items)
        .where(and(ne(items.shopId, id), arrayOverlaps(items.imageUrls, urls))),
    ]);
    keep = new Set(
      [
        ...otherShops.flatMap((s) => [s.logoUrl, s.ownerPhotoUrl, ...s.shopPhotoUrls]),
        ...otherItems.flatMap((row) => row.urls),
      ].filter((url): url is string => !!url),
    );
  }

  await db.transaction(async (tx) => {
    await tx.delete(shops).where(eq(shops.id, id));
    // The login goes too; its sessions and push subscriptions follow it.
    await tx.delete(user).where(eq(user.id, shop.ownerId));
  });

  const paths = urls
    .filter((url) => !keep.has(url))
    .map(mediaPathOf)
    .filter((path): path is string => path !== null);
  if (paths.length > 0) await deleteObjects(paths);

  revalidatePath("/admin");
  revalidatePath(`/${shop.slug}`);
  refreshShopPage(shop.slug);
  return { ok: true };
}
