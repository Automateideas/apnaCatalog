import "server-only";
import { and, eq, gte, isNotNull, or, sql } from "drizzle-orm";
import { db } from "@/db";
import { shops } from "@/db/schema";
import { MIN_ITEMS_TO_LIST } from "@/lib/catalog-config";

/** Recounts items and item photos for a shop. Call after any item change. */
export async function refreshShopStats(shopId: string) {
  await db.execute(sql`
    UPDATE shops SET
      item_count = (SELECT count(*)::int FROM items WHERE shop_id = ${shopId}),
      photo_count = (SELECT count(*)::int FROM items WHERE shop_id = ${shopId} AND image_url IS NOT NULL),
      updated_at = now()
    WHERE id = ${shopId}
  `);
}

/** Recomputes the rating from visible reviews. Call after any review change. */
export async function refreshShopRating(shopId: string) {
  await db.execute(sql`
    UPDATE shops SET
      rating_count = (SELECT count(*)::int FROM reviews WHERE shop_id = ${shopId} AND NOT is_hidden),
      rating_sum = (SELECT coalesce(sum(rating), 0)::int FROM reviews WHERE shop_id = ${shopId} AND NOT is_hidden)
    WHERE id = ${shopId}
  `);
}

/** Shops shown on the home page: not hidden, enough items, at least one photo. */
export const listedShop = and(
  eq(shops.isHidden, false),
  gte(shops.itemCount, MIN_ITEMS_TO_LIST),
  or(isNotNull(shops.logoUrl), gte(shops.photoCount, 1)),
);

/** True while a paid plan is active. Paid shops are featured first. */
/** Plans that are featured on the home page (Pro and Business; "paid" is the old name of Pro). */
export const paidNow = sql<boolean>`(${shops.plan} IN ('paid', 'pro', 'business') AND (${shops.planExpiresAt} IS NULL OR ${shops.planExpiresAt} > now()))`;
