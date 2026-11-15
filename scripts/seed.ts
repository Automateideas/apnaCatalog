/**
 * Adds demo shops so you can see the site working before real shops join.
 * Run with: npm run db:seed
 * Safe to run again: it skips shops whose link already exists.
 */
import { randomBytes, randomUUID } from "node:crypto";
import { config } from "dotenv";
import { eq, sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { categories, items, reviews, shops } from "../src/db/schema";
import { getBusinessType } from "../src/lib/catalog-config";

config({ path: ".env.local" });
config({ path: ".env" });

type DemoItem = [name: string, rupees: number, category: string, unit?: string, mrp?: number];

const DEMO: {
  slug: string;
  name: string;
  type: string;
  city: string;
  description: string;
  whatsapp: string;
  paid: boolean;
  items: DemoItem[];
  reviews: [name: string, rating: number, comment: string][];
}[] = [
  {
    slug: "demo-gift-store",
    name: "Demo Gift Store",
    type: "gift",
    city: "Dehradun",
    description: "Gifts for every occasion. Free gift wrapping on all orders.",
    whatsapp: "9000000001",
    paid: true,
    items: [
      ["Birthday Greeting Card", 60, "Greeting cards", "piece"],
      ["Photo Frame 8x10", 450, "Photo frames", "piece", 550],
      ["Teddy Bear Medium", 670, "Soft toys", "piece"],
      ["Scented Candle Set", 299, "Anniversary", "set of 3", 399],
      ["Brass Ganesha Showpiece", 850, "Showpieces", "piece"],
      ["Chocolate Gift Box", 520, "Birthday", "box"],
    ],
    reviews: [
      ["Ritu", 5, "Lovely collection and very polite owner."],
      ["Aman", 4, "Good prices. Gift wrapping was neat."],
    ],
  },
  {
    slug: "demo-kirana",
    name: "Demo Kirana Bhandar",
    type: "kirana",
    city: "Dehradun",
    description: "Daily needs at fair prices. Home delivery within 2 km.",
    whatsapp: "9000000002",
    paid: false,
    items: [
      ["Aashirvaad Atta", 445, "Atta, rice & dal", "10 kg", 470],
      ["Basmati Rice", 120, "Atta, rice & dal", "1 kg"],
      ["Toor Dal", 165, "Atta, rice & dal", "1 kg"],
      ["Mustard Oil", 175, "Oil & ghee", "1 litre"],
      ["Haldi Powder", 38, "Masala", "100 g"],
      ["Namkeen Mixture", 55, "Snacks", "200 g"],
      ["Detergent Powder", 112.5, "Household", "1 kg"],
    ],
    reviews: [["Sunita", 5, "Always fresh stock and quick delivery."]],
  },
  {
    slug: "demo-sweets",
    name: "Demo Mishthan Bhandar",
    type: "sweets",
    city: "Haridwar",
    description: "Fresh sweets made every morning in pure desi ghee.",
    whatsapp: "9000000003",
    paid: false,
    items: [
      ["Kaju Katli", 980, "Sweets", "1 kg"],
      ["Gulab Jamun", 380, "Sweets", "1 kg"],
      ["Motichoor Laddu", 420, "Sweets", "1 kg"],
      ["Aloo Bhujia", 240, "Namkeen", "1 kg"],
      ["Dry Fruit Gift Box", 1250, "Gift boxes", "box"],
    ],
    reviews: [],
  },
];

async function main() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL is not set. Add it to .env.local first.");
  const client = postgres(url, { prepare: false, max: 1 });
  const db = drizzle(client);

  for (const demo of DEMO) {
    const [existing] = await db.select({ id: shops.id }).from(shops).where(eq(shops.slug, demo.slug));
    if (existing) {
      console.log(`skip  ${demo.slug} (already there)`);
      continue;
    }
    const type = getBusinessType(demo.type);
    const [shop] = await db
      .insert(shops)
      .values({
        ownerId: randomUUID(),
        slug: demo.slug,
        name: demo.name,
        businessType: type.id,
        description: demo.description,
        city: demo.city,
        citySlug: demo.city.toLowerCase(),
        address: "Main Market",
        whatsapp: demo.whatsapp,
        phone: demo.whatsapp,
        ownerName: "Demo Owner",
        lat: 30.3165,
        lng: 78.0322,
        layout: type.layout,
        palette: type.palette,
        plan: demo.paid ? "paid" : "free",
        reviewToken: randomBytes(12).toString("base64url"),
      })
      .returning({ id: shops.id, reviewToken: shops.reviewToken });

    const cats = await db
      .insert(categories)
      .values(type.categories.map((name, i) => ({ shopId: shop.id, name, sort: i })))
      .returning({ id: categories.id, name: categories.name });
    const catId = (name: string) => cats.find((c) => c.name === name)?.id ?? null;

    await db.insert(items).values(
      demo.items.map(([name, rupees, category, unit, mrp]) => ({
        shopId: shop.id,
        categoryId: catId(category),
        name,
        price: Math.round(rupees * 100),
        mrp: mrp ? Math.round(mrp * 100) : null,
        unit: unit ?? null,
        // Demo photo so the shop qualifies for the home page listing.
        imageUrl: `https://placehold.co/600x600/f1f5f9/64748b/png?text=${encodeURIComponent(name)}`,
      })),
    );

    if (demo.reviews.length) {
      await db.insert(reviews).values(
        demo.reviews.map(([name, rating, comment], i) => ({
          shopId: shop.id,
          name,
          phone: `98${String(10000000 + i).padStart(8, "0")}`,
          rating,
          comment,
          editTokenHash: "seed",
        })),
      );
    }

    await db.execute(sql`
      UPDATE shops SET
        item_count = (SELECT count(*)::int FROM items WHERE shop_id = ${shop.id}),
        photo_count = (SELECT count(*)::int FROM items WHERE shop_id = ${shop.id} AND image_url IS NOT NULL),
        rating_count = (SELECT count(*)::int FROM reviews WHERE shop_id = ${shop.id}),
        rating_sum = (SELECT coalesce(sum(rating), 0)::int FROM reviews WHERE shop_id = ${shop.id})
      WHERE id = ${shop.id}
    `);
    console.log(`added ${demo.slug}  (review link: /${demo.slug}/review?t=${shop.reviewToken})`);
  }

  await client.end();
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
