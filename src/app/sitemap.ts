import type { MetadataRoute } from "next";
import { desc } from "drizzle-orm";
import { db, isDbConfigured } from "@/db";
import { shops } from "@/db/schema";
import { listedShop } from "@/lib/shop-stats";
import { siteUrl } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = siteUrl();
  const pages: MetadataRoute.Sitemap = [
    { url: base, changeFrequency: "daily", priority: 1 },
    { url: `${base}/pricing`, changeFrequency: "monthly", priority: 0.6 },
    { url: `${base}/privacy`, changeFrequency: "yearly", priority: 0.2 },
    { url: `${base}/terms`, changeFrequency: "yearly", priority: 0.2 },
  ];
  if (!isDbConfigured()) return pages;

  try {
    const rows = await db
      .select({ slug: shops.slug, updatedAt: shops.updatedAt })
      .from(shops)
      .where(listedShop)
      .orderBy(desc(shops.updatedAt))
      .limit(45000);
    return [
      ...pages,
      ...rows.map((shop) => ({
        url: `${base}/${shop.slug}`,
        lastModified: shop.updatedAt,
        changeFrequency: "weekly" as const,
        priority: 0.8,
      })),
    ];
  } catch (error) {
    console.error("Sitemap could not load shops", error);
    return pages;
  }
}
