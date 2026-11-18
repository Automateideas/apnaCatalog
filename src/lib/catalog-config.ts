import { resolveTheme, type Accent, type ResolvedTheme } from "@/lib/themes";

export type LayoutId = "grid" | "list" | "menu";

export const LAYOUTS: Record<LayoutId, { name: string; hint: string }> = {
  grid: { name: "Photo grid", hint: "Big photos. Good for gifts, clothes, jewellery." },
  list: { name: "Compact list", hint: "Many items, small photos. Good for kirana, hardware." },
  menu: { name: "Menu", hint: "Reads like a menu card. Good for sweets, food, bakery." },
};

export type BusinessType = {
  id: string;
  name: string;
  emoji: string;
  /** Old layout id, still stored for older app versions. The look now comes from the theme. */
  layout: LayoutId;
  /** Categories created for a new shop of this type. */
  categories: string[];
};

export const BUSINESS_TYPES: BusinessType[] = [
  { id: "gift", name: "Gift shop", emoji: "🎁", layout: "grid", categories: ["Birthday", "Anniversary", "Greeting cards", "Soft toys", "Photo frames", "Showpieces"] },
  { id: "kirana", name: "Kirana / Grocery", emoji: "🛒", layout: "list", categories: ["Atta, rice & dal", "Oil & ghee", "Masala", "Snacks", "Drinks", "Household"] },
  { id: "clothing", name: "Clothing", emoji: "👕", layout: "grid", categories: ["Men", "Women", "Kids", "Ethnic wear", "Winter wear"] },
  { id: "footwear", name: "Footwear", emoji: "👟", layout: "grid", categories: ["Men", "Women", "Kids", "Sports", "Sandals & slippers"] },
  { id: "jewellery", name: "Jewellery", emoji: "💍", layout: "grid", categories: ["Rings", "Earrings", "Necklaces", "Bangles", "Artificial jewellery"] },
  { id: "electronics", name: "Electronics", emoji: "📺", layout: "grid", categories: ["TV & audio", "Kitchen appliances", "Fans & coolers", "Lights", "Accessories"] },
  { id: "mobile", name: "Mobile shop", emoji: "📱", layout: "grid", categories: ["Smartphones", "Feature phones", "Covers & glass", "Chargers & cables", "Earphones"] },
  { id: "hardware", name: "Hardware / Paint", emoji: "🔧", layout: "list", categories: ["Tools", "Plumbing", "Electrical", "Paint", "Fittings"] },
  { id: "medical", name: "Medical store", emoji: "💊", layout: "list", categories: ["Health care", "Baby care", "Personal care", "Devices", "Ayurvedic"] },
  { id: "stationery", name: "Stationery / Books", emoji: "📚", layout: "list", categories: ["Notebooks", "Pens & pencils", "School supplies", "Office supplies", "Books"] },
  { id: "sweets", name: "Sweets / Namkeen", emoji: "🍬", layout: "menu", categories: ["Sweets", "Namkeen", "Dry fruits", "Gift boxes", "Snacks"] },
  { id: "bakery", name: "Bakery / Cake", emoji: "🎂", layout: "menu", categories: ["Cakes", "Pastries", "Breads", "Cookies", "Snacks"] },
  { id: "restaurant", name: "Restaurant / Food", emoji: "🍽️", layout: "menu", categories: ["Starters", "Main course", "Breads", "Rice", "Drinks", "Desserts"] },
  { id: "cosmetics", name: "Cosmetics / Beauty", emoji: "💄", layout: "grid", categories: ["Makeup", "Skin care", "Hair care", "Fragrance", "Bangles & bindi"] },
  { id: "furniture", name: "Furniture / Home", emoji: "🛋️", layout: "grid", categories: ["Beds", "Sofas", "Tables & chairs", "Storage", "Decor"] },
  { id: "toys", name: "Toys / Kids", emoji: "🧸", layout: "grid", categories: ["Soft toys", "Games", "Learning toys", "Ride-ons", "School bags"] },
  { id: "property", name: "Property dealer", emoji: "🏠", layout: "grid", categories: ["Flats", "Houses", "Plots", "Shops & offices"] },
  { id: "laundry", name: "Laundry / Dry clean", emoji: "👔", layout: "list", categories: ["Men", "Women", "Kids", "Household"] },
  { id: "other", name: "Other", emoji: "🏪", layout: "grid", categories: ["Popular", "New arrivals"] },
];

export const BUSINESS_TYPE_IDS = BUSINESS_TYPES.map((t) => t.id);

export function getBusinessType(id: string | null | undefined): BusinessType {
  return BUSINESS_TYPES.find((t) => t.id === id) ?? BUSINESS_TYPES[BUSINESS_TYPES.length - 1];
}

/* ---------- Plans ---------- */

export const FREE_ORDER_HISTORY = 10;
/** The first N shops get the paid plan free for LAUNCH_OFFER_DAYS. */
export const LAUNCH_OFFER_SHOPS = 100;
export const LAUNCH_OFFER_DAYS = 90;
/** Free paid-plan months a shop gets when a seller it invited starts a paid plan for the first time. */
export const INVITE_REWARD_MONTHS = 1;
/** Cookie that remembers whose invite link a new seller opened, until they create their shop. */
export const INVITE_COOKIE = "invite";
export const INVITE_COOKIE_DAYS = 30;
/** Most photos any plan allows on one item. The first one is the main photo. */
export const MAX_ITEM_PHOTOS = 15;
/** Photos of the shop itself (front, inside), shown on the shop page. */
export const MAX_SHOP_PHOTOS = 5;
/** A shop appears on the home page once it has this many items and a photo. */
export const MIN_ITEMS_TO_LIST = 3;

export type PlanId = "free" | "starter" | "pro" | "business";

export type Plan = {
  id: PlanId;
  name: string;
  /** Rupees. A year costs 10 months. */
  priceMonthly: number;
  priceYearly: number;
  /** Items allowed; null = no limit. */
  items: number | null;
  /** Photos allowed on one item. */
  photos: number;
  /** Shown first, with a "Featured" badge, on the home page. */
  featured: boolean;
  hideBranding: boolean;
  bestFor: string;
};

export const PLANS: Record<PlanId, Plan> = {
  free: { id: "free", name: "Free", priceMonthly: 0, priceYearly: 0, items: 20, photos: 2, featured: false, hideBranding: false, bestFor: "Trying it out" },
  starter: { id: "starter", name: "Starter", priceMonthly: 149, priceYearly: 1490, items: 100, photos: 3, featured: false, hideBranding: true, bestFor: "Small shops" },
  pro: { id: "pro", name: "Pro", priceMonthly: 249, priceYearly: 2490, items: null, photos: 5, featured: true, hideBranding: true, bestFor: "Growing shops" },
  business: { id: "business", name: "Business", priceMonthly: 399, priceYearly: 3990, items: null, photos: 15, featured: true, hideBranding: true, bestFor: "Property dealers and big catalogs" },
};

export const PAID_PLAN_IDS = ["starter", "pro", "business"] as const satisfies PlanId[];

/** Items on the free plan (used in marketing text). */
export const FREE_ITEM_LIMIT = PLANS.free.items!;

type PlanFields = { plan: string; planExpiresAt: Date | null };

/** The plan a shop has right now. An ended plan is Free; the old single "paid" plan is Pro. */
export function planOf(shop: PlanFields): Plan {
  const active = !shop.planExpiresAt || shop.planExpiresAt.getTime() > Date.now();
  if (!active || shop.plan === "free") return PLANS.free;
  if (shop.plan === "paid") return PLANS.pro;
  return PLANS[shop.plan as PlanId] ?? PLANS.free;
}

export function isPaid(shop: PlanFields): boolean {
  return planOf(shop).id !== "free";
}

type ThemeFields = { businessType: string; theme: string | null; palette: string };

/** The theme and colour a shop shows. Every shop can use every theme. */
export function effectiveTheme(shop: ThemeFields): ResolvedTheme & { palette: Accent } {
  const resolved = resolveTheme(shop);
  return { ...resolved, palette: resolved.accent };
}

/* ---------- Slugs ---------- */

export const RESERVED_SLUGS = new Set([
  "admin", "api", "app", "app-icon", "auth", "dashboard", "login", "logout", "signup",
  "o", "order", "orders", "offline", "privacy", "terms", "about", "contact", "help",
  "support", "pricing", "plans", "shop", "shops", "city", "cities", "search", "review",
  "reviews", "manifest", "sitemap", "robots", "favicon", "icon", "sw", "static", "public",
  "_next", "www", "apnacatalog", "apna-catalog", "blog", "new", "settings",
  "invite",
]);
