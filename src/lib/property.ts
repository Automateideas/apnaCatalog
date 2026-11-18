import { formatPrice } from "@/lib/utils";
import type { ItemDetail } from "@/lib/item-options";

/** Shops of this business type list properties: an enquiry button instead of a cart. */
export const isPropertyShop = (businessType: string) => businessType === "property";

export type Listing = "sale" | "rent";
export const LISTINGS: { id: Listing; name: string }[] = [
  { id: "sale", name: "For sale" },
  { id: "rent", name: "For rent" },
];

/** The facts a dealer fills for each property, in this order. */
export const PROPERTY_FIELDS = ["BHK", "Area", "Furnishing", "Floor", "Locality", "Deposit", "Available from"] as const;
export const FURNISHING = ["Unfurnished", "Semi-furnished", "Fully furnished"];

/** "₹45 lakh", "₹1.25 crore", or "₹18,000" below one lakh. */
export function formatPropertyPrice(paise: number): string {
  const rupees = paise / 100;
  const short = (n: number) => n.toFixed(2).replace(/\.?0+$/, "");
  if (rupees >= 1_00_00_000) return `₹${short(rupees / 1_00_00_000)} crore`;
  if (rupees >= 1_00_000) return `₹${short(rupees / 1_00_000)} lakh`;
  return formatPrice(paise);
}

/** The price line of a listing: "₹18,000/month" for rent, "₹40 – 45 lakh" style ranges for sale. */
export function listingPrice(item: { price: number; maxPrice: number | null; listing: string | null }): string {
  const range =
    item.maxPrice && item.maxPrice > item.price
      ? `${formatPropertyPrice(item.price)} – ${formatPropertyPrice(item.maxPrice)}`
      : formatPropertyPrice(item.price);
  return item.listing === "rent" ? `${range}/month` : range;
}

/** Shown instead of "Out of stock" on a property that is no longer available. */
export const unavailableLabel = (listing: string | null) => (listing === "rent" ? "Rented" : "Sold");

/** Only the facts that were filled in, in the standard order first. */
export function cleanDetails(details: ItemDetail[]): ItemDetail[] {
  return details
    .map((d) => ({ label: d.label.trim(), value: d.value.trim() }))
    .filter((d) => d.label && d.value);
}
