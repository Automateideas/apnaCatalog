/*
  Shop page themes.

  A theme is more than a colour: it sets the fonts, background, corner shape,
  card style, header design, how items are laid out and a small decoration.
  Every theme offers a few colours ("accents") that suit it.

  This file is plain data so it can be used on the server, in the browser and
  in server actions. Fonts are named by key here and loaded in theme-fonts.ts.
*/

export type FontKey =
  | "baloo"
  | "mukta"
  | "yatra"
  | "playfair"
  | "inter"
  | "cormorant"
  | "grotesk"
  | "fredoka"
  | "oswald"
  | "rozha"
  | "poppins"
  | "hind";

/** How the shop name, logo and description are shown at the top. */
export type HeaderStyle =
  | "banner" // coloured block, logo on the left
  | "center" // logo above a centred name, on the page colour
  | "hero" // tall dark block with a large name
  | "minimal" // centred name in capitals between thin lines
  | "split"; // white bar with a coloured edge, logo on the left

/** How items are laid out. */
export type ItemStyle =
  | "grid" // square photos, 2-4 per row
  | "portrait" // tall photos, fashion style, little text
  | "list" // one row per item, small photo
  | "menu"; // menu card: name, dotted line, price

export type Decor = "none" | "garland" | "confetti" | "hazard" | "diamond";

export type Accent = {
  id: string;
  name: string;
  primary: string;
  /** Hover / pressed shade. */
  dark: string;
  /** Very light tint for backgrounds. */
  soft: string;
  /** Text colour on top of `primary`. */
  on: string;
};

export type Theme = {
  id: string;
  name: string;
  /** One line shown in the theme picker. */
  tagline: string;
  fonts: { heading: FontKey; body: FontKey };
  heading: { weight: number; uppercase?: boolean; tracking?: string };
  colors: {
    /** Page background. */
    bg: string;
    /** Cards, sheets, inputs. */
    surface: string;
    text: string;
    muted: string;
    border: string;
  };
  dark?: boolean;
  /** Corner rounding of cards, buttons and photos. */
  radius: { card: string; button: string; photo: string };
  card: "border" | "shadow" | "flat" | "outline" | "pop";
  header: HeaderStyle;
  items: ItemStyle;
  /** Item text centred under the photo (grid / portrait). */
  center?: boolean;
  chips: "pill" | "square" | "underline";
  decor: Decor;
  accents: Accent[];
};

export const THEMES: Theme[] = [
  {
    id: "classic",
    name: "Classic",
    tagline: "Clean and friendly. Fits any shop.",
    fonts: { heading: "baloo", body: "mukta" },
    heading: { weight: 700 },
    colors: { bg: "#faf7f2", surface: "#ffffff", text: "#1f2937", muted: "#6b7280", border: "#e5e1d8" },
    radius: { card: "14px", button: "10px", photo: "10px" },
    card: "border",
    header: "banner",
    items: "grid",
    chips: "pill",
    decor: "none",
    accents: [
      { id: "saffron", name: "Saffron", primary: "#ea580c", dark: "#c2410c", soft: "#fff7ed", on: "#ffffff" },
      { id: "royal", name: "Royal blue", primary: "#2563eb", dark: "#1d4ed8", soft: "#eff6ff", on: "#ffffff" },
      { id: "emerald", name: "Emerald", primary: "#059669", dark: "#047857", soft: "#ecfdf5", on: "#ffffff" },
      { id: "slate", name: "Slate", primary: "#334155", dark: "#1e293b", soft: "#f1f5f9", on: "#ffffff" },
    ],
  },
  {
    id: "bazaar",
    name: "Bazaar",
    tagline: "Fast price list. Many items, easy to scan.",
    fonts: { heading: "baloo", body: "mukta" },
    heading: { weight: 800 },
    colors: { bg: "#f3f5ef", surface: "#ffffff", text: "#14231a", muted: "#5f6b63", border: "#dfe5dc" },
    radius: { card: "8px", button: "6px", photo: "6px" },
    card: "border",
    header: "split",
    items: "list",
    chips: "square",
    decor: "none",
    accents: [
      { id: "emerald", name: "Sabzi green", primary: "#15803d", dark: "#166534", soft: "#ecfdf3", on: "#ffffff" },
      { id: "saffron", name: "Haldi", primary: "#d97706", dark: "#b45309", soft: "#fffbeb", on: "#ffffff" },
      { id: "royal", name: "Blue", primary: "#1d4ed8", dark: "#1e40af", soft: "#eff6ff", on: "#ffffff" },
      { id: "rose", name: "Red", primary: "#dc2626", dark: "#b91c1c", soft: "#fef2f2", on: "#ffffff" },
    ],
  },
  {
    id: "mithai",
    name: "Mithai",
    tagline: "Festive menu card for sweets and namkeen.",
    fonts: { heading: "yatra", body: "mukta" },
    heading: { weight: 400 },
    colors: { bg: "#fff6e5", surface: "#fffcf5", text: "#4a2410", muted: "#8a6248", border: "#efd9b4" },
    radius: { card: "6px", button: "999px", photo: "999px" },
    card: "outline",
    header: "center",
    items: "menu",
    chips: "pill",
    decor: "garland",
    accents: [
      { id: "saffron", name: "Kesar", primary: "#c2410c", dark: "#9a3412", soft: "#ffedd5", on: "#ffffff" },
      { id: "maroon", name: "Maroon", primary: "#9f1239", dark: "#881337", soft: "#ffe4e6", on: "#ffffff" },
      { id: "pista", name: "Pista", primary: "#4d7c0f", dark: "#3f6212", soft: "#ecfccb", on: "#ffffff" },
      { id: "gold", name: "Gold", primary: "#a16207", dark: "#854d0e", soft: "#fef3c7", on: "#ffffff" },
    ],
  },
  {
    id: "boutique",
    name: "Boutique",
    tagline: "Fashion magazine look with tall photos.",
    fonts: { heading: "playfair", body: "inter" },
    heading: { weight: 600 },
    colors: { bg: "#ffffff", surface: "#ffffff", text: "#111111", muted: "#6b6b6b", border: "#e7e7e7" },
    radius: { card: "0px", button: "0px", photo: "0px" },
    card: "flat",
    header: "minimal",
    items: "portrait",
    chips: "underline",
    decor: "none",
    accents: [
      { id: "noir", name: "Noir", primary: "#111111", dark: "#000000", soft: "#f4f4f4", on: "#ffffff" },
      { id: "wine", name: "Wine", primary: "#7f1d3a", dark: "#5f1529", soft: "#fbeff3", on: "#ffffff" },
      { id: "olive", name: "Olive", primary: "#4b5320", dark: "#363c17", soft: "#f3f4ea", on: "#ffffff" },
      { id: "navy", name: "Navy", primary: "#1e2a4a", dark: "#121a30", soft: "#eef1f7", on: "#ffffff" },
    ],
  },
  {
    id: "jewels",
    name: "Jewels",
    tagline: "Black and gold, like a jewellery showroom.",
    fonts: { heading: "cormorant", body: "inter" },
    heading: { weight: 600, tracking: "0.02em" },
    colors: { bg: "#0f0d0b", surface: "#19150f", text: "#f5ecd7", muted: "#b6a684", border: "#3b3224" },
    dark: true,
    radius: { card: "2px", button: "2px", photo: "2px" },
    card: "outline",
    header: "center",
    items: "grid",
    center: true,
    chips: "underline",
    decor: "diamond",
    accents: [
      { id: "gold", name: "Gold", primary: "#c9a24a", dark: "#a8842f", soft: "#2a2215", on: "#0f0d0b" },
      { id: "rosegold", name: "Rose gold", primary: "#d39a86", dark: "#b97d69", soft: "#2b1d19", on: "#0f0d0b" },
      { id: "silver", name: "Silver", primary: "#c7ccd4", dark: "#a5acb6", soft: "#1d2024", on: "#0f0d0b" },
      { id: "emerald", name: "Emerald", primary: "#3fa37a", dark: "#2f8562", soft: "#13241c", on: "#0f0d0b" },
    ],
  },
  {
    id: "gadget",
    name: "Gadget",
    tagline: "Sharp and modern for phones and electronics.",
    fonts: { heading: "grotesk", body: "inter" },
    heading: { weight: 700, tracking: "-0.01em" },
    colors: { bg: "#eef2f8", surface: "#ffffff", text: "#0b1220", muted: "#5b6577", border: "#dbe2ee" },
    radius: { card: "16px", button: "12px", photo: "12px" },
    card: "shadow",
    header: "hero",
    items: "grid",
    chips: "pill",
    decor: "none",
    accents: [
      { id: "royal", name: "Electric blue", primary: "#2563eb", dark: "#1d4ed8", soft: "#e8efff", on: "#ffffff" },
      { id: "violet", name: "Violet", primary: "#7c3aed", dark: "#6d28d9", soft: "#f1eafe", on: "#ffffff" },
      { id: "cyan", name: "Cyan", primary: "#0891b2", dark: "#0e7490", soft: "#e3f6fb", on: "#ffffff" },
      { id: "orange", name: "Orange", primary: "#ea580c", dark: "#c2410c", soft: "#fff1e8", on: "#ffffff" },
    ],
  },
  {
    id: "care",
    name: "Care",
    tagline: "Calm and clear for medical and health stores.",
    fonts: { heading: "inter", body: "hind" },
    heading: { weight: 700 },
    colors: { bg: "#f2f8f8", surface: "#ffffff", text: "#0f2a2e", muted: "#55707a", border: "#d7e7e9" },
    radius: { card: "12px", button: "10px", photo: "10px" },
    card: "border",
    header: "split",
    items: "list",
    chips: "pill",
    decor: "none",
    accents: [
      { id: "teal", name: "Teal", primary: "#0d9488", dark: "#0f766e", soft: "#e6f7f5", on: "#ffffff" },
      { id: "royal", name: "Blue", primary: "#2563eb", dark: "#1d4ed8", soft: "#eaf1ff", on: "#ffffff" },
      { id: "emerald", name: "Green", primary: "#16a34a", dark: "#15803d", soft: "#eafaf0", on: "#ffffff" },
    ],
  },
  {
    id: "bakery",
    name: "Bakery",
    tagline: "Soft pastel and round, like a cake box.",
    fonts: { heading: "fredoka", body: "mukta" },
    heading: { weight: 600 },
    colors: { bg: "#fff4f6", surface: "#ffffff", text: "#4f1d2c", muted: "#94606f", border: "#f6d7df" },
    radius: { card: "24px", button: "999px", photo: "20px" },
    card: "shadow",
    header: "center",
    items: "grid",
    center: true,
    chips: "pill",
    decor: "none",
    accents: [
      { id: "rose", name: "Strawberry", primary: "#e0457b", dark: "#c22f63", soft: "#ffe6ef", on: "#ffffff" },
      { id: "choco", name: "Chocolate", primary: "#7a4a2e", dark: "#5f3820", soft: "#f6ebe3", on: "#ffffff" },
      { id: "mint", name: "Mint", primary: "#0f9b83", dark: "#0b7f6b", soft: "#e2f7f2", on: "#ffffff" },
      { id: "lavender", name: "Lavender", primary: "#8b5cf6", dark: "#7444e8", soft: "#f1ebff", on: "#ffffff" },
    ],
  },
  {
    id: "toyland",
    name: "Toyland",
    tagline: "Bright, bold and playful for kids.",
    fonts: { heading: "baloo", body: "mukta" },
    heading: { weight: 800 },
    colors: { bg: "#fff9e8", surface: "#ffffff", text: "#1f2937", muted: "#5b6472", border: "#1f2937" },
    radius: { card: "18px", button: "14px", photo: "12px" },
    card: "pop",
    header: "banner",
    items: "grid",
    chips: "pill",
    decor: "confetti",
    accents: [
      { id: "rose", name: "Cherry", primary: "#ef4444", dark: "#dc2626", soft: "#fee9e9", on: "#ffffff" },
      { id: "royal", name: "Sky", primary: "#3b82f6", dark: "#2563eb", soft: "#e8f0fe", on: "#ffffff" },
      { id: "emerald", name: "Lime", primary: "#16a34a", dark: "#15803d", soft: "#e8f8ee", on: "#ffffff" },
      { id: "purple", name: "Grape", primary: "#8b5cf6", dark: "#7c3aed", soft: "#f0eaff", on: "#ffffff" },
    ],
  },
  {
    id: "workshop",
    name: "Workshop",
    tagline: "Strong and no-nonsense for hardware and tools.",
    fonts: { heading: "oswald", body: "inter" },
    heading: { weight: 600, uppercase: true, tracking: "0.03em" },
    colors: { bg: "#f1f1ee", surface: "#ffffff", text: "#1c1917", muted: "#5c5751", border: "#1c1917" },
    radius: { card: "2px", button: "2px", photo: "0px" },
    card: "outline",
    header: "banner",
    items: "list",
    chips: "square",
    decor: "hazard",
    accents: [
      { id: "yellow", name: "Safety yellow", primary: "#facc15", dark: "#eab308", soft: "#fef9db", on: "#1c1917" },
      { id: "orange", name: "Orange", primary: "#f97316", dark: "#ea580c", soft: "#fff1e6", on: "#1c1917" },
      { id: "rose", name: "Red", primary: "#dc2626", dark: "#b91c1c", soft: "#fdecec", on: "#ffffff" },
      { id: "royal", name: "Blue", primary: "#1d4ed8", dark: "#1e40af", soft: "#e9effd", on: "#ffffff" },
    ],
  },
  {
    id: "dhaba",
    name: "Dhaba",
    tagline: "Warm dark menu for restaurants and food.",
    fonts: { heading: "rozha", body: "mukta" },
    heading: { weight: 400 },
    colors: { bg: "#1b1310", surface: "#261b16", text: "#fbefe0", muted: "#c6ae95", border: "#45322a" },
    dark: true,
    radius: { card: "12px", button: "10px", photo: "10px" },
    card: "border",
    header: "hero",
    items: "menu",
    chips: "pill",
    decor: "none",
    accents: [
      { id: "chilli", name: "Chilli", primary: "#e5484d", dark: "#cf3a3f", soft: "#3a1c1b", on: "#ffffff" },
      { id: "haldi", name: "Haldi", primary: "#f2b705", dark: "#d9a300", soft: "#3a2d0c", on: "#1b1310" },
      { id: "saffron", name: "Tandoor", primary: "#f97316", dark: "#ea580c", soft: "#3a2212", on: "#1b1310" },
      { id: "emerald", name: "Pudina", primary: "#22c55e", dark: "#16a34a", soft: "#14301f", on: "#1b1310" },
    ],
  },
  {
    id: "glow",
    name: "Glow",
    tagline: "Soft blush and rounded for beauty and gifts.",
    fonts: { heading: "poppins", body: "poppins" },
    heading: { weight: 600 },
    colors: { bg: "#fdf4f1", surface: "#ffffff", text: "#3b2626", muted: "#8a6a6a", border: "#f1dcd6" },
    radius: { card: "18px", button: "999px", photo: "14px" },
    card: "shadow",
    header: "center",
    items: "portrait",
    center: true,
    chips: "pill",
    decor: "none",
    accents: [
      { id: "rose", name: "Blush", primary: "#db2777", dark: "#be185d", soft: "#fdeaf3", on: "#ffffff" },
      { id: "nude", name: "Nude", primary: "#a86e52", dark: "#8c5940", soft: "#f8ece6", on: "#ffffff" },
      { id: "berry", name: "Berry", primary: "#9d174d", dark: "#831843", soft: "#fbe7ef", on: "#ffffff" },
      { id: "purple", name: "Lilac", primary: "#9061f9", dark: "#7e4ff0", soft: "#f2ecff", on: "#ffffff" },
    ],
  },
];

const BY_ID = new Map(THEMES.map((t) => [t.id, t]));

/** The theme made for each business type. */
const THEME_FOR_TYPE: Record<string, string> = {
  gift: "glow",
  kirana: "bazaar",
  clothing: "boutique",
  footwear: "gadget",
  jewellery: "jewels",
  electronics: "gadget",
  mobile: "gadget",
  hardware: "workshop",
  medical: "care",
  stationery: "bazaar",
  sweets: "mithai",
  bakery: "bakery",
  restaurant: "dhaba",
  cosmetics: "glow",
  furniture: "boutique",
  toys: "toyland",
  other: "classic",
};

export function getTheme(id: string | null | undefined): Theme | undefined {
  return id ? BY_ID.get(id) : undefined;
}

export function themeForType(businessType: string): Theme {
  return BY_ID.get(THEME_FOR_TYPE[businessType] ?? "classic") ?? THEMES[0];
}

/** Business types a theme was made for, for "Best for" in the picker. */
export function typesForTheme(themeId: string): string[] {
  return Object.entries(THEME_FOR_TYPE)
    .filter(([, id]) => id === themeId)
    .map(([type]) => type);
}

export type ResolvedTheme = { theme: Theme; accent: Accent };

/** The theme and colour a shop shows. Unknown or missing values fall back to defaults. */
export function resolveTheme(shop: {
  businessType: string;
  theme: string | null;
  palette: string;
}): ResolvedTheme {
  const theme = getTheme(shop.theme) ?? themeForType(shop.businessType);
  const accent = theme.accents.find((a) => a.id === shop.palette) ?? theme.accents[0];
  return { theme, accent };
}
