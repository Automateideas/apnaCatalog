import "server-only";
import { cache } from "react";
import { revalidateTag, unstable_cache } from "next/cache";
import { and, asc, desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { categories, items, reviews, shops, type Shop } from "@/db/schema";
import { SLUG_PATTERN } from "@/lib/utils";

/**
 * The public shop page reads its data from Next.js' cache instead of the database, so a busy
 * shop costs no database work per visit. Every change to a shop calls refreshShopPage, and the
 * cache also renews itself every hour as a safety net.
 *
 * Bump CACHE_VERSION when the shape below changes: cached entries outlive a deployment.
 */
const CACHE_VERSION = "v1";
const shopTag = (slug: string) => `shop:${slug}`;

async function loadShopPage(slug: string) {
  const [shop] = await db
    .select()
    .from(shops)
    .where(and(eq(shops.slug, slug), eq(shops.isHidden, false)))
    .limit(1);
  if (!shop) return null;

  const [cats, itemRows, reviewRows] = await Promise.all([
    db
      .select({ id: categories.id, name: categories.name, parentId: categories.parentId })
      .from(categories)
      .where(eq(categories.shopId, shop.id))
      .orderBy(asc(categories.sort), asc(categories.createdAt)),
    db
      .select({
        id: items.id,
        name: items.name,
        description: items.description,
        price: items.price,
        mrp: items.mrp,
        unit: items.unit,
        imageUrl: items.imageUrl,
        imageUrls: items.imageUrls,
        maxPrice: items.maxPrice,
        options: items.options,
        listing: items.listing,
        details: items.details,
        inStock: items.inStock,
        categoryId: items.categoryId,
      })
      .from(items)
      .where(eq(items.shopId, shop.id))
      .orderBy(desc(items.inStock), asc(items.createdAt)),
    db
      .select({
        id: reviews.id,
        name: reviews.name,
        rating: reviews.rating,
        comment: reviews.comment,
        updatedAt: reviews.updatedAt,
      })
      .from(reviews)
      .where(and(eq(reviews.shopId, shop.id), eq(reviews.isHidden, false)))
      .orderBy(desc(reviews.updatedAt))
      .limit(30),
  ]);
  return { shop, categories: cats, items: itemRows, reviews: reviewRows };
}

export type ShopPageData = NonNullable<Awaited<ReturnType<typeof loadShopPage>>>;

// The cache stores JSON, so dates come back as strings.
const toDate = (value: Date | string | null): Date | null => (value == null ? null : new Date(value));

function revive(data: ShopPageData): ShopPageData {
  const shop: Shop = {
    ...data.shop,
    createdAt: toDate(data.shop.createdAt)!,
    updatedAt: toDate(data.shop.updatedAt)!,
    planExpiresAt: toDate(data.shop.planExpiresAt),
    inviteRewardedAt: toDate(data.shop.inviteRewardedAt),
  };
  return {
    ...data,
    shop,
    reviews: data.reviews.map((review) => ({ ...review, updatedAt: toDate(review.updatedAt)! })),
  };
}

/** Everything the public shop page shows, or null when the shop does not exist or is hidden. */
export const getShopPage = cache(async (slug: string): Promise<ShopPageData | null> => {
  if (!SLUG_PATTERN.test(slug)) return null;
  // Not cached in local development: the local app and the live site share one database, and a
  // change saved on the live site would not refresh the local cache.
  if (process.env.NODE_ENV === "development") return loadShopPage(slug);
  const data = await unstable_cache(() => loadShopPage(slug), ["shop-page", CACHE_VERSION, slug], {
    tags: [shopTag(slug)],
    revalidate: 3600,
  })();
  return data ? revive(data) : null;
});

/** A public (not hidden) shop by its link name. */
export const getPublicShop = cache(async (slug: string): Promise<Shop | null> => {
  return (await getShopPage(slug))?.shop ?? null;
});

/**
 * Call after anything on a shop's public page changes (shop details, items, categories,
 * reviews, plan, hidden). The next visit loads fresh data. Server Actions and Route Handlers only.
 */
export function refreshShopPage(slug: string) {
  revalidateTag(shopTag(slug), { expire: 0 });
}

/** refreshShopPage when only the shop id is at hand. */
export async function refreshShopPageById(shopId: string) {
  const [row] = await db.select({ slug: shops.slug }).from(shops).where(eq(shops.id, shopId)).limit(1);
  if (row) refreshShopPage(row.slug);
}
