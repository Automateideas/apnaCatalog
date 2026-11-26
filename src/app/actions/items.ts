"use server";

import { revalidatePath } from "next/cache";
import { refreshShopPage } from "@/lib/shop-data";
import { and, count, eq, isNull } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/db";
import { categories, items } from "@/db/schema";
import { getShopByOwner, requireUser } from "@/lib/auth";
import { planOf } from "@/lib/catalog-config";
import { cleanDetails, isPropertyShop } from "@/lib/property";
import { removeUnusedMedia } from "@/lib/media";
import { refreshShopStats } from "@/lib/shop-stats";
import { isMediaUrl } from "@/lib/media-url";
import { type ItemOption, MAX_ITEM_OPTIONS } from "@/lib/item-options";
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
  /** Top of a price range, in rupees. */
  maxPrice: z.number().min(0).max(10_000_000).optional().nullable(),
  /** Discounted / clearance price, in rupees. */
  salePrice: z.number().min(0).max(10_000_000).optional().nullable(),
  /** Choices with their own price, in rupees. */
  options: z
    .array(
      z.object({
        id: z.string().trim().regex(/^[a-z0-9]{1,12}$/).optional(),
        name: z.string().trim().min(1, "Give every option a name.").max(40),
        price: z.number("Enter a price for every option.").min(0).max(10_000_000),
        maxPrice: z.number().min(0).max(10_000_000).optional().nullable(),
      }),
    )
    .max(MAX_ITEM_OPTIONS, `An item can have at most ${MAX_ITEM_OPTIONS} options.`)
    .optional(),
  unit: z.string().trim().max(20).optional().nullable(),
  categoryId: z.uuid().optional().nullable(),
  /** Main photo first. */
  imageUrls: z.array(z.string().max(500)).max(20).optional(),
  inStock: z.boolean(),
  /** Property listings only. */
  listing: z.enum(["sale", "rent"]).optional().nullable(),
  details: z
    .array(z.object({ label: z.string().max(30), value: z.string().max(60) }))
    .max(12)
    .optional(),
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

  // Options keep their id across edits, so carts that hold one still find it.
  const options: ItemOption[] = (data.options ?? []).map((o) => {
    const optPrice = rupeesToPaise(o.price);
    const optMax = o.maxPrice ? rupeesToPaise(o.maxPrice) : 0;
    return {
      id: o.id || Math.random().toString(36).slice(2, 10),
      name: o.name,
      price: optPrice,
      maxPrice: optMax > optPrice ? optMax : null,
    };
  });
  if (new Set(options.map((o) => o.name.toLowerCase())).size < options.length) {
    return { ok: false, error: "Two options have the same name." };
  }
  // With options, the item's own price is the lowest option price (used for sorting and "from").
  const price = options.length > 0 ? Math.min(...options.map((o) => o.price)) : rupeesToPaise(data.price);
  const maxRaw = data.maxPrice ? rupeesToPaise(data.maxPrice) : 0;
  const maxPrice = options.length === 0 && maxRaw > price ? maxRaw : null;
  const mrp = data.mrp && rupeesToPaise(data.mrp) > price ? rupeesToPaise(data.mrp) : null;
  const saleRaw = data.salePrice ? rupeesToPaise(data.salePrice) : 0;
  const salePrice = options.length === 0 && saleRaw > 0 && saleRaw < price ? saleRaw : null;
  // Only photos from our own storage, no repeats, main photo first.
  const imageUrls = [...new Set((data.imageUrls ?? []).filter(isMediaUrl))];

  const plan = planOf(shop);
  const photoError = {
    ok: false as const,
    error: `The ${plan.name} plan allows ${plan.photos} photos per item. Upgrade for more.`,
  };

  const values = {
    name: data.name,
    description: data.description || null,
    price,
    mrp: options.length > 0 ? null : mrp,
    maxPrice,
    salePrice: options.length > 0 ? null : salePrice,
    options,
    unit: data.unit || null,
    categoryId: data.categoryId ?? null,
    imageUrl: imageUrls[0] ?? null,
    imageUrls,
    inStock: data.inStock,
    // Listing fields only for property dealers; other shops never keep them.
    listing: isPropertyShop(shop.businessType) ? (data.listing ?? "sale") : null,
    details: isPropertyShop(shop.businessType) ? cleanDetails(data.details ?? []) : [],
  };

  // Photos the item had before this save, to delete the ones that were taken off.
  let oldImageUrls: string[] = [];

  if (data.id) {
    const mine = and(eq(items.id, data.id), eq(items.shopId, shop.id));
    const [existing] = await db.select({ imageUrls: items.imageUrls }).from(items).where(mine).limit(1);
    if (!existing) return { ok: false, error: "Item not found." };
    // Photos kept from a bigger plan stay; only adding past the limit is refused.
    if (imageUrls.length > Math.max(plan.photos, existing.imageUrls.length)) return photoError;
    oldImageUrls = existing.imageUrls;
    await db.update(items).set({ ...values, updatedAt: new Date() }).where(mine);
  } else {
    if (imageUrls.length > plan.photos) return photoError;
    if (plan.items !== null) {
      const [{ total }] = await db
        .select({ total: count() })
        .from(items)
        .where(eq(items.shopId, shop.id));
      if (total >= plan.items) {
        return {
          ok: false,
          error: `The ${plan.name} plan allows ${plan.items} items. Upgrade to add more.`,
        };
      }
    }
    await db.insert(items).values({ ...values, shopId: shop.id });
  }

  await removeUnusedMedia(
    shop.id,
    oldImageUrls.filter((url) => !imageUrls.includes(url)),
  );
  await refreshShopStats(shop.id);
  revalidatePath("/dashboard", "layout");
  refreshShopPage(shop.slug);
  return { ok: true };
}

export async function deleteItem(id: string): Promise<ActionResult> {
  const { shop } = await myShop();
  if (!shop) return { ok: false, error: "Shop not found." };
  if (!z.uuid().safeParse(id).success) return { ok: false, error: "Item not found." };

  const deleted = await db
    .delete(items)
    .where(and(eq(items.id, id), eq(items.shopId, shop.id)))
    .returning({ imageUrls: items.imageUrls });
  // The item's photos go with it, so they do not pile up in storage.
  await removeUnusedMedia(
    shop.id,
    deleted.flatMap((row) => row.imageUrls),
  );
  await refreshShopStats(shop.id);
  revalidatePath("/dashboard", "layout");
  refreshShopPage(shop.slug);
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
  refreshShopPage(shop.slug);
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
  refreshShopPage(shop.slug);
  return { ok: true };
}

export async function deleteCategory(id: string): Promise<ActionResult> {
  const { shop } = await myShop();
  if (!shop) return { ok: false, error: "Shop not found." };
  if (!z.uuid().safeParse(id).success) return { ok: false, error: "Category not found." };

  // Subcategories are removed with it; items stay and become uncategorised.
  await db.delete(categories).where(and(eq(categories.id, id), eq(categories.shopId, shop.id)));
  revalidatePath("/dashboard", "layout");
  refreshShopPage(shop.slug);
  return { ok: true };
}
