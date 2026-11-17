import { asc, desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { categories, items } from "@/db/schema";
import { requireShop } from "@/lib/auth";
import { FREE_ITEM_LIMIT, isPaid } from "@/lib/catalog-config";
import { ItemsManager } from "./ItemsManager";

export default async function ItemsPage() {
  const { shop } = await requireShop();

  const [cats, rows] = await Promise.all([
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
        inStock: items.inStock,
        categoryId: items.categoryId,
      })
      .from(items)
      .where(eq(items.shopId, shop.id))
      .orderBy(desc(items.createdAt)),
  ]);

  return (
    <ItemsManager
      items={rows}
      categories={cats}
      itemLimit={isPaid(shop) ? null : FREE_ITEM_LIMIT}
    />
  );
}
