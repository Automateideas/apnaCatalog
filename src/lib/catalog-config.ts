export type LayoutId = "grid" | "list" | "menu";

export const LAYOUTS: Record<LayoutId, { name: string; hint: string }> = {
  grid: { name: "Photo grid", hint: "Big photos. Good for gifts, clothes, jewellery." },
  list: { name: "Compact list", hint: "Many items, small photos. Good for kirana, hardware." },
  menu: { name: "Menu", hint: "Reads like a menu card. Good for sweets, food, bakery." },
};

export type Palette = { name: string; primary: string; dark: string; soft: string };

export const PALETTES: Record<string, Palette> = {
  saffron: { name: "Saffron", primary: "#ea580c", dark: "#c2410c", soft: "#fff7ed" },
  rose: { name: "Rose", primary: "#e11d48", dark: "#be123c", soft: "#fff1f2" },
  emerald: { name: "Emerald", primary: "#059669", dark: "#047857", soft: "#ecfdf5" },
  royal: { name: "Royal blue", primary: "#2563eb", dark: "#1d4ed8", soft: "#eff6ff" },
  purple: { name: "Purple", primary: "#7c3aed", dark: "#6d28d9", soft: "#f5f3ff" },
  teal: { name: "Teal", primary: "#0d9488", dark: "#0f766e", soft: "#f0fdfa" },
  gold: { name: "Gold", primary: "#b45309", dark: "#92400e", soft: "#fffbeb" },
  slate: { name: "Slate", primary: "#334155", dark: "#1e293b", soft: "#f1f5f9" },
};

export type BusinessType = {
  id: string;
  name: string;
  emoji: string;
  layout: LayoutId;
  palette: string;
  /** Categories created for a new shop of this type. */
  categories: string[];
};

export const BUSINESS_TYPES: BusinessType[] = [
  { id: "gift", name: "Gift shop", emoji: "🎁", layout: "grid", palette: "rose", categories: ["Birthday", "Anniversary", "Greeting cards", "Soft toys", "Photo frames", "Showpieces"] },
  { id: "kirana", name: "Kirana / Grocery", emoji: "🛒", layout: "list", palette: "emerald", categories: ["Atta, rice & dal", "Oil & ghee", "Masala", "Snacks", "Drinks", "Household"] },
  { id: "clothing", name: "Clothing", emoji: "👕", layout: "grid", palette: "purple", categories: ["Men", "Women", "Kids", "Ethnic wear", "Winter wear"] },
  { id: "footwear", name: "Footwear", emoji: "👟", layout: "grid", palette: "slate", categories: ["Men", "Women", "Kids", "Sports", "Sandals & slippers"] },
  { id: "jewellery", name: "Jewellery", emoji: "💍", layout: "grid", palette: "gold", categories: ["Rings", "Earrings", "Necklaces", "Bangles", "Artificial jewellery"] },
  { id: "electronics", name: "Electronics", emoji: "📺", layout: "grid", palette: "royal", categories: ["TV & audio", "Kitchen appliances", "Fans & coolers", "Lights", "Accessories"] },
  { id: "mobile", name: "Mobile shop", emoji: "📱", layout: "grid", palette: "royal", categories: ["Smartphones", "Feature phones", "Covers & glass", "Chargers & cables", "Earphones"] },
  { id: "hardware", name: "Hardware / Paint", emoji: "🔧", layout: "list", palette: "slate", categories: ["Tools", "Plumbing", "Electrical", "Paint", "Fittings"] },
  { id: "medical", name: "Medical store", emoji: "💊", layout: "list", palette: "teal", categories: ["Health care", "Baby care", "Personal care", "Devices", "Ayurvedic"] },
  { id: "stationery", name: "Stationery / Books", emoji: "📚", layout: "list", palette: "royal", categories: ["Notebooks", "Pens & pencils", "School supplies", "Office supplies", "Books"] },
  { id: "sweets", name: "Sweets / Namkeen", emoji: "🍬", layout: "menu", palette: "saffron", categories: ["Sweets", "Namkeen", "Dry fruits", "Gift boxes", "Snacks"] },
  { id: "bakery", name: "Bakery / Cake", emoji: "🎂", layout: "menu", palette: "rose", categories: ["Cakes", "Pastries", "Breads", "Cookies", "Snacks"] },
  { id: "restaurant", name: "Restaurant / Food", emoji: "🍽️", layout: "menu", palette: "saffron", categories: ["Starters", "Main course", "Breads", "Rice", "Drinks", "Desserts"] },
  { id: "cosmetics", name: "Cosmetics / Beauty", emoji: "💄", layout: "grid", palette: "rose", categories: ["Makeup", "Skin care", "Hair care", "Fragrance", "Bangles & bindi"] },
  { id: "furniture", name: "Furniture / Home", emoji: "🛋️", layout: "grid", palette: "gold", categories: ["Beds", "Sofas", "Tables & chairs", "Storage", "Decor"] },
  { id: "toys", name: "Toys / Kids", emoji: "🧸", layout: "grid", palette: "teal", categories: ["Soft toys", "Games", "Learning toys", "Ride-ons", "School bags"] },
  { id: "other", name: "Other", emoji: "🏪", layout: "grid", palette: "saffron", categories: ["Popular", "New arrivals"] },
];

export const BUSINESS_TYPE_IDS = BUSINESS_TYPES.map((t) => t.id);

export function getBusinessType(id: string | null | undefined): BusinessType {
  return BUSINESS_TYPES.find((t) => t.id === id) ?? BUSINESS_TYPES[BUSINESS_TYPES.length - 1];
}

/* ---------- Plans ---------- */

export const FREE_ITEM_LIMIT = 25;
export const FREE_ORDER_HISTORY = 10;
/** Every free shop can also use this palette, besides its business default. */
export const FREE_EXTRA_PALETTE = "slate";
/** The first N shops get the paid plan free for LAUNCH_OFFER_DAYS. */
export const LAUNCH_OFFER_SHOPS = 100;
export const LAUNCH_OFFER_DAYS = 90;
export const PRICE_MONTHLY = 99;
export const PRICE_YEARLY = 999;
/** A shop appears on the home page once it has this many items and a photo. */
export const MIN_ITEMS_TO_LIST = 3;

type PlanFields = { plan: string; planExpiresAt: Date | null };

export function isPaid(shop: PlanFields): boolean {
  if (shop.plan !== "paid") return false;
  return !shop.planExpiresAt || shop.planExpiresAt.getTime() > Date.now();
}

export function freePalettes(businessType: string): string[] {
  const base = getBusinessType(businessType).palette;
  return base === FREE_EXTRA_PALETTE ? [base, "saffron"] : [base, FREE_EXTRA_PALETTE];
}

type ThemeFields = PlanFields & { businessType: string; layout: string; palette: string };

/** The theme actually shown. Falls back to the free theme when a paid plan lapses. */
export function effectiveTheme(shop: ThemeFields): { layout: LayoutId; palette: Palette } {
  const type = getBusinessType(shop.businessType);
  const paid = isPaid(shop);
  const layout =
    paid && shop.layout in LAYOUTS ? (shop.layout as LayoutId) : type.layout;
  const allowed = paid ? Object.keys(PALETTES) : freePalettes(shop.businessType);
  const paletteId = allowed.includes(shop.palette) ? shop.palette : type.palette;
  return { layout, palette: PALETTES[paletteId] ?? PALETTES.saffron };
}

/* ---------- Slugs ---------- */

export const RESERVED_SLUGS = new Set([
  "admin", "api", "app", "app-icon", "auth", "dashboard", "login", "logout", "signup",
  "o", "order", "orders", "offline", "privacy", "terms", "about", "contact", "help",
  "support", "pricing", "plans", "shop", "shops", "city", "cities", "search", "review",
  "reviews", "manifest", "sitemap", "robots", "favicon", "icon", "sw", "static", "public",
  "_next", "www", "apnacatalog", "apna-catalog", "blog", "new", "settings",
]);
