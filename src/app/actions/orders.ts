"use server";

import { createHash, randomInt } from "node:crypto";
import { headers } from "next/headers";
import { and, count, eq, gte, inArray } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/db";
import { items, orders, shops, type OrderLine } from "@/db/schema";
import { formatPriceRange } from "@/lib/item-options";
import { siteUrl, waLink, type ActionResult } from "@/lib/utils";

const schema = z.object({
  shopId: z.uuid(),
  lines: z
    .array(
      z.object({
        itemId: z.uuid(),
        optionId: z.string().max(12).optional().nullable(),
        qty: z.number().int().min(1).max(999),
      }),
    )
    .min(1, "Your cart is empty.")
    .max(100),
  name: z.string().trim().max(60).optional(),
  note: z.string().trim().max(300).optional(),
});

/** One phone or computer may send this many orders to one shop per hour. */
const ORDERS_PER_CLIENT_PER_HOUR = 8;
/** Backstop for a single shop, in case many addresses are used. */
const ORDERS_PER_SHOP_PER_HOUR = 400;
/** The total is stored as a 32-bit number of paise. */
const MAX_TOTAL_PAISE = 2_000_000_000;

const ALPHABET = "abcdefghjkmnpqrstuvwxyz23456789";
function orderCode(): string {
  let code = "";
  for (let i = 0; i < 8; i++) code += ALPHABET[randomInt(ALPHABET.length)];
  return code;
}

/** A one-way fingerprint of the sender's network address, used only to limit spam. */
async function clientFingerprint(): Promise<string | null> {
  const h = await headers();
  const ip = h.get("x-forwarded-for")?.split(",")[0]?.trim() || h.get("x-real-ip");
  return ip ? createHash("sha256").update(`order:${ip}`).digest("hex").slice(0, 32) : null;
}

function isUniqueViolation(error: unknown): boolean {
  const code = (error as { code?: string; cause?: { code?: string } } | null)?.code;
  const causeCode = (error as { cause?: { code?: string } } | null)?.cause?.code;
  return code === "23505" || causeCode === "23505";
}

/** Saves the cart as an order and returns the WhatsApp link that sends it to the shop. */
export async function createOrder(
  input: z.input<typeof schema>,
): Promise<ActionResult<{ id: string; whatsappUrl: string }>> {
  const parsed = schema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0].message };
  const data = parsed.data;

  const hourAgo = new Date(Date.now() - 3600_000);
  const itemIds = [...new Set(data.lines.map((l) => l.itemId))];
  const clientHash = await clientFingerprint();

  // Prices always come from the database, never from the browser.
  const [[shop], rows, [{ fromShop }], [{ fromClient }]] = await Promise.all([
    db
      .select({ id: shops.id, name: shops.name, whatsapp: shops.whatsapp })
      .from(shops)
      .where(and(eq(shops.id, data.shopId), eq(shops.isHidden, false)))
      .limit(1),
    db
      .select()
      .from(items)
      .where(and(eq(items.shopId, data.shopId), inArray(items.id, itemIds))),
    db
      .select({ fromShop: count() })
      .from(orders)
      .where(and(eq(orders.shopId, data.shopId), gte(orders.createdAt, hourAgo))),
    clientHash
      ? db
          .select({ fromClient: count() })
          .from(orders)
          .where(
            and(
              eq(orders.shopId, data.shopId),
              eq(orders.clientHash, clientHash),
              gte(orders.createdAt, hourAgo),
            ),
          )
      : Promise.resolve([{ fromClient: 0 }]),
  ]);

  if (!shop) return { ok: false, error: "Shop not found." };
  if (fromClient >= ORDERS_PER_CLIENT_PER_HOUR || fromShop >= ORDERS_PER_SHOP_PER_HOUR) {
    return { ok: false, error: "Too many orders in a short time. Please try again later." };
  }

  const byId = new Map(rows.map((r) => [r.id, r]));
  // An item that is gone or out of stock, or an option that was removed or renamed away.
  const optionOf = (l: (typeof data.lines)[number]) =>
    l.optionId ? (byId.get(l.itemId)?.options.find((o) => o.id === l.optionId) ?? null) : null;
  const unavailable = data.lines.filter((l) => {
    const item = byId.get(l.itemId);
    if (!item?.inStock) return true;
    return l.optionId ? !optionOf(l) : item.options.length > 0;
  });
  if (unavailable.length > 0) {
    const names = unavailable
      .map((l) => byId.get(l.itemId)?.name)
      .filter(Boolean)
      .slice(0, 3)
      .join(", ");
    return {
      ok: false,
      error: `Some items are no longer available${names ? ` (${names})` : ""}. Refresh the page and check your cart.`,
    };
  }

  const lines: OrderLine[] = data.lines.map((line) => {
    const item = byId.get(line.itemId)!;
    const option = optionOf(line);
    const price = option ? option.price : item.price;
    const max = option ? option.maxPrice : item.maxPrice;
    return {
      itemId: item.id,
      name: item.name,
      unit: item.unit,
      qty: line.qty,
      price,
      option: option?.name ?? null,
      maxPrice: max && max > price ? max : null,
    };
  });
  const total = lines.reduce((sum, l) => sum + l.price * l.qty, 0);
  const maxTotal = lines.reduce((sum, l) => sum + (l.maxPrice ?? l.price) * l.qty, 0);
  if (total > MAX_TOTAL_PAISE) {
    return { ok: false, error: "This order is too large to send from the catalog. Please call the shop." };
  }

  let id = orderCode();
  for (let attempt = 0; ; attempt++) {
    try {
      await db.insert(orders).values({
        id,
        shopId: shop.id,
        customerName: data.name || null,
        note: data.note || null,
        lines,
        total,
        clientHash,
      });
      break;
    } catch (error) {
      // Retry only when the random order code happened to exist already.
      if (!isUniqueViolation(error) || attempt >= 2) throw error;
      id = orderCode();
    }
  }

  const shown = lines.slice(0, 25);
  const text = [
    `Namaste ${shop.name}, I want to order:`,
    "",
    ...shown.map(
      (l, i) =>
        `${i + 1}. ${l.name}${l.option ? ` - ${l.option}` : ""}${l.unit ? ` (${l.unit})` : ""} x ${l.qty} = ${formatPriceRange(l.price * l.qty, l.maxPrice ? l.maxPrice * l.qty : null)}`,
    ),
    ...(lines.length > shown.length ? [`...and ${lines.length - shown.length} more items`] : []),
    "",
    `Total: ${formatPriceRange(total, maxTotal)}`,
    ...(maxTotal > total ? ["(Final price as the shop confirms)"] : []),
    ...(data.name ? [`Name: ${data.name}`] : []),
    ...(data.note ? [`Note: ${data.note}`] : []),
    "",
    `Order details: ${siteUrl()}/o/${id}`,
  ].join("\n");

  return { ok: true, data: { id, whatsappUrl: waLink(shop.whatsapp, text) } };
}
