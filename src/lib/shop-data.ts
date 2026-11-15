import "server-only";
import { cache } from "react";
import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { shops, type Shop } from "@/db/schema";
import { SLUG_PATTERN } from "@/lib/utils";

/** A public (not hidden) shop by its link name. */
export const getPublicShop = cache(async (slug: string): Promise<Shop | null> => {
  if (!SLUG_PATTERN.test(slug)) return null;
  const [shop] = await db
    .select()
    .from(shops)
    .where(and(eq(shops.slug, slug), eq(shops.isHidden, false)))
    .limit(1);
  return shop ?? null;
});
