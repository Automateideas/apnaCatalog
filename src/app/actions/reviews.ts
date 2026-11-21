"use server";

import { createHash, timingSafeEqual } from "node:crypto";
import { revalidatePath } from "next/cache";
import { refreshShopPage } from "@/lib/shop-data";
import { and, count, eq, gte } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/db";
import { reviews, shops } from "@/db/schema";
import { getShopByOwner, requireUser } from "@/lib/auth";
import { refreshShopRating } from "@/lib/shop-stats";
import { normalizePhone, type ActionResult } from "@/lib/utils";

const hash = (token: string) => createHash("sha256").update(token).digest("hex");

function sameHash(a: string, b: string): boolean {
  const x = Buffer.from(a);
  const y = Buffer.from(b);
  return x.length === y.length && timingSafeEqual(x, y);
}

/** Finds the shop for a review link. The token is the secret in the link. */
async function shopForReviewLink(slug: string, token: string) {
  const [shop] = await db
    .select({ id: shops.id, reviewToken: shops.reviewToken })
    .from(shops)
    .where(and(eq(shops.slug, slug), eq(shops.isHidden, false)))
    .limit(1);
  if (!shop || !sameHash(shop.reviewToken, token)) return null;
  return shop;
}

const submitSchema = z.object({
  slug: z.string().max(60),
  token: z.string().max(60),
  name: z.string().trim().min(2, "Enter your name.").max(50),
  phone: z.string(),
  rating: z.number().int().min(1, "Tap a star to rate.").max(5),
  comment: z.string().trim().max(600).optional(),
  editToken: z.string().min(16).max(100),
});

export async function submitReview(
  input: z.input<typeof submitSchema>,
): Promise<ActionResult<{ updated: boolean }>> {
  const parsed = submitSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0].message };
  const data = parsed.data;

  const phone = normalizePhone(data.phone);
  if (!phone) return { ok: false, error: "Enter a valid 10-digit mobile number." };

  const shop = await shopForReviewLink(data.slug, data.token);
  if (!shop) return { ok: false, error: "This review link is not valid. Ask the shop for a new one." };

  const [existing] = await db
    .select()
    .from(reviews)
    .where(and(eq(reviews.shopId, shop.id), eq(reviews.phone, phone)))
    .limit(1);

  const tokenHash = hash(data.editToken);

  if (existing) {
    if (!sameHash(existing.editTokenHash, tokenHash)) {
      return {
        ok: false,
        error:
          "A review from this number already exists. You can edit it only from the phone it was written on.",
      };
    }
    await db
      .update(reviews)
      .set({
        name: data.name,
        rating: data.rating,
        comment: data.comment || null,
        updatedAt: new Date(),
      })
      .where(eq(reviews.id, existing.id));
  } else {
    const [{ recent }] = await db
      .select({ recent: count() })
      .from(reviews)
      .where(
        and(eq(reviews.shopId, shop.id), gte(reviews.createdAt, new Date(Date.now() - 3600_000))),
      );
    if (recent >= 40) return { ok: false, error: "Too many reviews right now. Please try later." };

    try {
      await db.insert(reviews).values({
        shopId: shop.id,
        name: data.name,
        phone,
        rating: data.rating,
        comment: data.comment || null,
        editTokenHash: tokenHash,
      });
    } catch {
      return { ok: false, error: "A review from this number already exists." };
    }
  }

  await refreshShopRating(shop.id);
  revalidatePath(`/${data.slug}`);
  refreshShopPage(data.slug);
  return { ok: true, data: { updated: Boolean(existing) } };
}

const myReviewSchema = z.object({
  slug: z.string().max(60),
  token: z.string().max(60),
  phone: z.string().max(20),
  editToken: z.string().min(16).max(100),
});

/** Loads the reviewer's own review so they can edit it on the same phone. */
export async function getMyReview(input: {
  slug: string;
  token: string;
  phone: string;
  editToken: string;
}): Promise<{ name: string; phone: string; rating: number; comment: string } | null> {
  const parsed = myReviewSchema.safeParse(input);
  if (!parsed.success) return null;
  const phone = normalizePhone(parsed.data.phone);
  if (!phone) return null;
  const shop = await shopForReviewLink(parsed.data.slug, parsed.data.token);
  if (!shop) return null;

  const [row] = await db
    .select()
    .from(reviews)
    .where(and(eq(reviews.shopId, shop.id), eq(reviews.phone, phone)))
    .limit(1);
  if (!row || !sameHash(row.editTokenHash, hash(input.editToken))) return null;
  return { name: row.name, phone: row.phone, rating: row.rating, comment: row.comment ?? "" };
}

/** Shopkeeper flags a review for the admin to look at. */
export async function reportReview(id: string): Promise<ActionResult> {
  const user = await requireUser();
  const shop = await getShopByOwner(user.id);
  if (!shop) return { ok: false, error: "Shop not found." };
  if (!z.uuid().safeParse(id).success) return { ok: false, error: "Review not found." };

  await db
    .update(reviews)
    .set({ isReported: true })
    .where(and(eq(reviews.id, id), eq(reviews.shopId, shop.id)));
  revalidatePath("/dashboard/reviews");
  return { ok: true };
}
