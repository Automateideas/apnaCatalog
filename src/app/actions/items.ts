"use server";

import { revalidatePath } from "next/cache";
import { and, count, eq, isNull } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/db";
import { categories, items } from "@/db/schema";
import { getShopByOwner, requireUser } from "@/lib/auth";
import { FREE_ITEM_LIMIT, isPaid } from "@/lib/catalog-config";
import { refreshShopStats } from "@/lib/shop-stats";
import { isMediaUrl } from "@/lib/supabase/env";
import { rupeesToPaise, type ActionResult } from "@/lib/utils";

async function myShop() {
  const user = await requireUser();
  const shop = await getShopByOwner(user.id);
  return { user, shop };
}

const itemSchema = z.object({
  id: z.uuid().optional(),
  name: z.string().trim().min(1, "Enter the item name.").max(80),
  description: z.string().trim().max(500).optional().nullable(),
  price: z.number("Enter the price.").min(0, "Enter the price.").max(10_000_000),
  mrp: z.number().min(0).max(10_000_000).optional().nullable(),
  unit: z.string().trim().max(20).optional().nullable(),
  categoryId: z.uuid().optional().nullable(),
  imageUrl: z.string().optional().nullable(),
  inStock: z.boolean(),
});

export async function saveItem(input: z.input<typeof itemSchema>): Promise<ActionResult> {
  const { shop } = await myShop();
  if (!shop) return { ok: false, error: "Shop not found." };

  const parsed = itemSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0].message };
  const data = parsed.data;

  if (data.categoryId) {
    const [cat] = await db
      .select({ id: categories.id })
      .from(categories)
      .where(and(eq(categories.id, data.categoryId), eq(categories.shopId, shop.id)))
      .limit(1);
    if (!cat) return { ok: false, error: "Category not found." };
  }

  const price = rupeesToPaise(data.price);
  const mrp = data.mrp && rupeesToPaise(data.mrp) > price ? rupeesToPaise(data.mrp) : null;
  const imageUrl = data.imageUrl && isMediaUrl(data.imageUrl) ? data.imageUrl : null;

  const values = {
    name: data.name,
    description: data.description || null,
    price,
    mrp,
    unit: data.unit || null,
    categoryId: data.categoryId ?? null,
    imageUrl,
    inStock: data.inStock,
  };

  if (data.id) {
    await db
      .update(items)
      .set({ ...values, updatedAt: new Date() })
      .where(and(eq(items.id, data.id), eq(items.shopId, shop.id)));
  } else {
    if (!isPaid(shop)) {
      const [{ total }] = await db
        .select({ total: count() })
        .from(items)
        .where(eq(items.shopId, shop.id));
      if (total >= FREE_ITEM_LIMIT) {
        return {
          ok: false,
          error: `The free plan allows ${FREE_ITEM_LIMIT} items. Upgrade to add more.`,
        };
      }
    }
    await db.insert(items).values({ ...values, shopId: shop.id });
  }

  await refreshShopStats(shop.id);
  revalidatePath("/dashboard", "layout");
  return { ok: true };
}

export async function deleteItem(id: string): Promise<ActionResult> {
  const { shop } = await myShop();
  if (!shop) return { ok: false, error: "Shop not found." };
  if (!z.uuid().safeParse(id).success) return { ok: false, error: "Item not found." };

  await db.delete(items).where(and(eq(items.id, id), eq(items.shopId, shop.id)));
  await refreshShopStats(shop.id);
  revalidatePath("/dashboard", "layout");
  return { ok: true };
}

export async function setItemStock(id: string, inStock: boolean): Promise<ActionResult> {
  const { shop } = await myShop();
  if (!shop) return { ok: false, error: "Shop not found." };
  if (!z.uuid().safeParse(id).success) return { ok: false, error: "Item not found." };

  await db
    .update(items)
    .set({ inStock: Boolean(inStock), updatedAt: new Date() })
    .where(and(eq(items.id, id), eq(items.shopId, shop.id)));
  revalidatePath("/dashboard", "layout");
  return { ok: true };
}

const categorySchema = z.object({
  id: z.uuid().optional(),
  name: z.string().trim().min(1, "Enter a name.").max(40),
  parentId: z.uuid().optional().nullable(),
});

export async function saveCategory(input: z.input<typeof categorySchema>): Promise<ActionResult> {
  const { shop } = await myShop();
  if (!shop) return { ok: false, error: "Shop not found." };

  const parsed = categorySchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0].message };
  const data = parsed.data;

  if (data.id) {
    await db
      .update(categories)
      .set({ name: data.name })
      .where(and(eq(categories.id, data.id), eq(categories.shopId, shop.id)));
  } else {
    if (data.parentId) {
      // Only two levels: the parent must be a top-level category of this shop.
      const [parent] = await db
        .select({ id: categories.id })
        .from(categories)
        .where(
          and(
            eq(categories.id, data.parentId),
            eq(categories.shopId, shop.id),
            isNull(categories.parentId),
          ),
        )
        .limit(1);
      if (!parent) return { ok: false, error: "Category not found." };
    }
    const [{ total }] = await db
      .select({ total: count() })
      .from(categories)
      .where(eq(categories.shopId, shop.id));
    if (total >= 200) return { ok: false, error: "Too many categories." };
    await db
      .insert(categories)
      .values({ shopId: shop.id, name: data.name, parentId: data.parentId ?? null, sort: total });
  }

  revalidatePath("/dashboard", "layout");
  return { ok: true };
}

export async function deleteCategory(id: string): Promise<ActionResult> {
  const { shop } = await myShop();
  if (!shop) return { ok: false, error: "Shop not found." };
  if (!z.uuid().safeParse(id).success) return { ok: false, error: "Category not found." };

  // Subcategories are removed with it; items stay and become uncategorised.
  await db.delete(categories).where(and(eq(categories.id, id), eq(categories.shopId, shop.id)));
  revalidatePath("/dashboard", "layout");
  return { ok: true };
}
