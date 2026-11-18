import { formatPrice } from "@/lib/utils";

/**
 * One choice inside an item, for example "Dry clean" or "Steam press" for a shirt, or "500 g"
 * for a sweet. Prices are in paise. `maxPrice` makes the price a range ("₹200 – ₹500"),
 * for work whose final price the shop sets after seeing it.
 */
export type ItemOption = { id: string; name: string; price: number; maxPrice: number | null };

export const MAX_ITEM_OPTIONS = 8;

/** "₹200" or "₹200 – ₹500". */
export function formatPriceRange(price: number, maxPrice: number | null | undefined): string {
  return maxPrice && maxPrice > price ? `${formatPrice(price)} – ${formatPrice(maxPrice)}` : formatPrice(price);
}

/** The lowest and highest price an item can cost, across its options. */
export function itemPriceSpan(item: { price: number; maxPrice: number | null; options: ItemOption[] }) {
  if (item.options.length === 0) return { min: item.price, max: Math.max(item.price, item.maxPrice ?? 0) };
  return {
    min: Math.min(...item.options.map((o) => o.price)),
    max: Math.max(...item.options.map((o) => Math.max(o.price, o.maxPrice ?? 0))),
  };
}

/** Cart key of an item, or of one option of it. */
export const cartKey = (itemId: string, optionId?: string | null) => (optionId ? `${itemId}:${optionId}` : itemId);
export const parseCartKey = (key: string) => {
  const [itemId, optionId = null] = key.split(":");
  return { itemId, optionId };
};

/** Top of an order's total when some lines have a price range. */
export const maxTotalOf = (lines: { price: number; maxPrice?: number | null; qty: number }[]) =>
  lines.reduce((sum, l) => sum + (l.maxPrice ?? l.price) * l.qty, 0);

/** One fact about an item, e.g. { label: "Area", value: "1,150 sq ft" }. */
export type ItemDetail = { label: string; value: string };
