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
  | "hind"
  | "kalam"
  | "dmserif"
  | "bebas"
  | "nunito"
  | "laila";

/** How the shop name, logo and description are shown at the top. */
export type HeaderStyle =
  | "banner" // coloured block, logo on the left
  | "center" // logo above a centred name, on the page colour
  | "hero" // tall dark block with a large name
  | "minimal" // centred name in capitals between thin lines
  | "split" // white bar with a coloured edge, logo on the left
  | "cover"; // the shop's own photo full width, name on top of it

/** Price level the theme is made for, so a dhaba and a fine-dining place look different. */
export type Level = "budget" | "standard" | "premium";

export const LEVELS: { id: Level; name: string; sign: string }[] = [
  { id: "budget", name: "Budget", sign: "₹" },
  { id: "standard", name: "Mid-range", sign: "₹₹" },
  { id: "premium", name: "Premium", sign: "₹₹₹" },
];

/** How items are laid out. */
export type ItemStyle =
  | "grid" // square photos, 2-4 per row
  | "portrait" // tall photos, fashion style, little text
  | "list" // one row per item, small photo
  | "menu"; // menu card: name, dotted line, price

export type Decor = "none" | "garland" | "confetti" | "hazard" | "diamond" | "awning";

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
  level: Level;
  /** Business types this theme suits. Every type has at least five. */
  for: string[];
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

/** A colour choice. `on` is the text colour on top of it (dark for light colours). */
function ac(id: string, name: string, primary: string, dark: string, soft: string, on = "#ffffff"): Accent {
  return { id, name, primary, dark, soft, on };
}

export const THEMES: Theme[] = [
  {
    id: "classic",
    name: "Classic",
    tagline: "Clean and friendly. Fits any shop.",
    level: "standard",
    for: ["other", "gift", "toys", "stationery", "kirana", "laundry", "property"],
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
    level: "budget",
    for: ["kirana", "stationery", "medical", "hardware", "other", "laundry", "property"],
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
    level: "standard",
    for: ["sweets"],
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
    level: "premium",
    for: ["clothing", "footwear", "furniture"],
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
    level: "premium",
    for: ["jewellery"],
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
    level: "standard",
    for: ["electronics", "mobile", "footwear"],
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
    level: "standard",
    for: ["medical", "laundry"],
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
    level: "standard",
    for: ["bakery"],
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
    level: "standard",
    for: ["toys", "gift", "stationery"],
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
    level: "standard",
    for: ["hardware"],
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
    level: "budget",
    for: ["restaurant"],
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
    level: "standard",
    for: ["cosmetics", "gift", "jewellery", "clothing"],
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

  /* ---------- Food ---------- */
  {
    id: "street",
    name: "Street Food",
    tagline: "Loud and hungry: chaat, rolls, momos, fast food.",
    level: "budget",
    for: ["restaurant", "sweets"],
    fonts: { heading: "bebas", body: "poppins" },
    heading: { weight: 400, tracking: "0.03em" },
    colors: { bg: "#fffbea", surface: "#ffffff", text: "#1a1a1a", muted: "#575757", border: "#1a1a1a" },
    radius: { card: "12px", button: "10px", photo: "10px" },
    card: "pop",
    header: "banner",
    items: "list",
    chips: "square",
    decor: "none",
    accents: [
      ac("rose", "Tomato", "#e11d2e", "#be123c", "#ffe8ea"),
      ac("haldi", "Mustard", "#f5b301", "#d99a00", "#fff5d6", "#1a1a1a"),
      ac("emerald", "Chutney", "#16a34a", "#15803d", "#e7f8ec"),
      ac("orange", "Masala", "#ea580c", "#c2410c", "#fff0e5"),
    ],
  },
  {
    id: "quick",
    name: "Quick Bites",
    tagline: "Clean app-like menu for cloud kitchens and snack corners.",
    level: "budget",
    for: ["restaurant", "bakery", "sweets", "laundry"],
    fonts: { heading: "nunito", body: "nunito" },
    heading: { weight: 800 },
    colors: { bg: "#f6f7fb", surface: "#ffffff", text: "#151827", muted: "#5f6480", border: "#e5e7f0" },
    radius: { card: "18px", button: "14px", photo: "14px" },
    card: "shadow",
    header: "split",
    items: "list",
    chips: "pill",
    decor: "none",
    accents: [
      ac("orange", "Zing orange", "#ea580c", "#c2410c", "#fff1e6"),
      ac("rose", "Berry", "#e11d48", "#be123c", "#ffe9ee"),
      ac("purple", "Grape", "#7c3aed", "#6d28d9", "#f1eafe"),
      ac("emerald", "Fresh green", "#059669", "#047857", "#e5f7f0"),
    ],
  },
  {
    id: "thali",
    name: "Thali House",
    tagline: "Round plates on banana-leaf green. Pure veg and family thalis.",
    level: "standard",
    for: ["restaurant", "sweets"],
    fonts: { heading: "laila", body: "mukta" },
    heading: { weight: 700 },
    colors: { bg: "#f5f8ec", surface: "#fffef7", text: "#1f3519", muted: "#5b684f", border: "#dbe4c6" },
    radius: { card: "16px", button: "999px", photo: "999px" },
    card: "border",
    header: "center",
    items: "grid",
    center: true,
    chips: "pill",
    decor: "garland",
    accents: [
      ac("emerald", "Banana leaf", "#3f7d20", "#336818", "#ebf5e1"),
      ac("saffron", "Kesar", "#d97706", "#b45309", "#fff3dc"),
      ac("rose", "Lal mirch", "#c0392b", "#a93226", "#fdecea"),
    ],
  },
  {
    id: "cafe",
    name: "Chalkboard Café",
    tagline: "Hand-written menu on a green board. Cafés and tea points.",
    level: "standard",
    for: ["restaurant", "bakery"],
    fonts: { heading: "kalam", body: "nunito" },
    heading: { weight: 700 },
    colors: { bg: "#1e2a25", surface: "#26352f", text: "#f3efe6", muted: "#b6c0b5", border: "#3b4c44" },
    dark: true,
    radius: { card: "10px", button: "8px", photo: "8px" },
    card: "border",
    header: "center",
    items: "menu",
    chips: "underline",
    decor: "none",
    accents: [
      ac("coffee", "Latte", "#d6b088", "#c39a70", "#33302a", "#1e2a25"),
      ac("mint", "Mint", "#7fd1ae", "#62bf98", "#22392f", "#1e2a25"),
      ac("rose", "Pink chalk", "#f4a6b8", "#ec8ca2", "#3a2c31", "#1e2a25"),
      ac("chalk", "Chalk", "#f3efe6", "#ddd8cc", "#2f3b35", "#1e2a25"),
    ],
  },
  {
    id: "family",
    name: "Family Restaurant",
    tagline: "Warm and welcoming, with your restaurant photo on top.",
    level: "standard",
    for: ["restaurant"],
    fonts: { heading: "dmserif", body: "poppins" },
    heading: { weight: 400 },
    colors: { bg: "#fdf8f3", surface: "#ffffff", text: "#2b1d14", muted: "#776353", border: "#eedfd0" },
    radius: { card: "16px", button: "12px", photo: "12px" },
    card: "shadow",
    header: "cover",
    items: "grid",
    chips: "pill",
    decor: "none",
    accents: [
      ac("saffron", "Terracotta", "#c2410c", "#9a3412", "#fdeee4"),
      ac("maroon", "Maroon", "#9f1239", "#881337", "#fde8ee"),
      ac("emerald", "Curry leaf", "#3f6212", "#365314", "#eef5e1"),
      ac("navy", "Navy", "#1e3a5f", "#16304f", "#e9eff7"),
    ],
  },
  {
    id: "fine",
    name: "Fine Dining",
    tagline: "Black, ivory and gold. For restaurants with a high bill.",
    level: "premium",
    for: ["restaurant"],
    fonts: { heading: "dmserif", body: "inter" },
    heading: { weight: 400, tracking: "0.01em" },
    colors: { bg: "#0d0d0c", surface: "#161614", text: "#f1ece2", muted: "#a59f92", border: "#2e2b27" },
    dark: true,
    radius: { card: "0px", button: "0px", photo: "0px" },
    card: "outline",
    header: "cover",
    items: "menu",
    center: true,
    chips: "underline",
    decor: "diamond",
    accents: [
      ac("gold", "Champagne", "#d4b483", "#bf9c68", "#24201a", "#0d0d0c"),
      ac("rose", "Bordeaux", "#c0394b", "#a52d3e", "#2a1517"),
      ac("mint", "Sage", "#a3bba2", "#8aa489", "#1b221b", "#0d0d0c"),
    ],
  },
  {
    id: "halwai",
    name: "Halwai",
    tagline: "Bright shop-front with an awning. Everyday sweets and namkeen.",
    level: "budget",
    for: ["sweets"],
    fonts: { heading: "baloo", body: "mukta" },
    heading: { weight: 800 },
    colors: { bg: "#fffaf0", surface: "#ffffff", text: "#3d1d0b", muted: "#7a5841", border: "#f0dcc0" },
    radius: { card: "10px", button: "8px", photo: "8px" },
    card: "border",
    header: "banner",
    items: "list",
    chips: "square",
    decor: "awning",
    accents: [
      ac("saffron", "Kesar", "#ea580c", "#c2410c", "#fff1e4"),
      ac("rose", "Laal", "#dc2626", "#b91c1c", "#fdecec"),
      ac("emerald", "Pista", "#15803d", "#166534", "#e8f7ed"),
      ac("haldi", "Haldi", "#eab308", "#ca8a04", "#fef8db", "#3d1d0b"),
    ],
  },
  {
    id: "shahi",
    name: "Shahi",
    tagline: "Royal maroon and gold for premium mithai and gift boxes.",
    level: "premium",
    for: ["sweets", "gift"],
    fonts: { heading: "rozha", body: "mukta" },
    heading: { weight: 400 },
    colors: { bg: "#250b12", surface: "#33121b", text: "#f8e9d2", muted: "#cdac8c", border: "#5a2633" },
    dark: true,
    radius: { card: "4px", button: "4px", photo: "4px" },
    card: "outline",
    header: "center",
    items: "grid",
    center: true,
    chips: "underline",
    decor: "diamond",
    accents: [
      ac("gold", "Gold", "#d4a64a", "#b98c33", "#3a1d16", "#250b12"),
      ac("rose", "Gulab", "#eba3ab", "#df8792", "#3d1a22", "#250b12"),
      ac("pista", "Pista", "#a8c76f", "#91b255", "#2c2414", "#250b12"),
    ],
  },
  {
    id: "homebaker",
    name: "Home Baker",
    tagline: "Hand-written and homely, on brown kraft paper.",
    level: "budget",
    for: ["bakery", "gift"],
    fonts: { heading: "kalam", body: "nunito" },
    heading: { weight: 700 },
    colors: { bg: "#f5ecdd", surface: "#fffaf2", text: "#4a3020", muted: "#856853", border: "#e4d0b4" },
    radius: { card: "14px", button: "999px", photo: "12px" },
    card: "border",
    header: "center",
    items: "list",
    chips: "pill",
    decor: "none",
    accents: [
      ac("choco", "Cocoa", "#7a4a2e", "#5f3820", "#f3e6da"),
      ac("rose", "Berry", "#c0365f", "#a52a50", "#fbe7ed"),
      ac("emerald", "Sage", "#5f7f4f", "#4d6a3f", "#ecf2e6"),
    ],
  },
  {
    id: "patisserie",
    name: "Pâtisserie",
    tagline: "French cake shop with a striped awning and tall photos.",
    level: "premium",
    for: ["bakery"],
    fonts: { heading: "dmserif", body: "inter" },
    heading: { weight: 400 },
    colors: { bg: "#fbf7f1", surface: "#ffffff", text: "#1f2340", muted: "#696d84", border: "#e8e2d6" },
    radius: { card: "4px", button: "999px", photo: "4px" },
    card: "flat",
    header: "center",
    items: "portrait",
    center: true,
    chips: "underline",
    decor: "awning",
    accents: [
      ac("navy", "Navy", "#1f2a5a", "#151d42", "#eceef6"),
      ac("rose", "Blush", "#c76c84", "#b05570", "#fbecf0"),
      ac("pista", "Pistachio", "#6f8f4e", "#5b783e", "#eef4e6"),
    ],
  },

  /* ---------- Daily needs ---------- */
  {
    id: "deals",
    name: "Daily Deals",
    tagline: "Big prices and bold colours. Shops that sell on price.",
    level: "budget",
    for: ["kirana", "stationery", "hardware", "electronics", "mobile", "footwear", "toys", "cosmetics", "furniture", "other"],
    fonts: { heading: "baloo", body: "mukta" },
    heading: { weight: 800 },
    colors: { bg: "#fff8e1", surface: "#ffffff", text: "#1b1b1b", muted: "#565656", border: "#f3d77a" },
    radius: { card: "10px", button: "8px", photo: "8px" },
    card: "border",
    header: "banner",
    items: "grid",
    chips: "square",
    decor: "none",
    accents: [
      ac("rose", "Sale red", "#e11d2e", "#be123c", "#ffe8ea"),
      ac("royal", "Blue", "#1d4ed8", "#1e40af", "#e9effd"),
      ac("emerald", "Green", "#15803d", "#166534", "#e8f7ed"),
      ac("purple", "Purple", "#7e22ce", "#6b21a8", "#f3e8fd"),
    ],
  },
  {
    id: "supermart",
    name: "Supermart",
    tagline: "Neat and modern like a supermarket app.",
    level: "standard",
    for: ["kirana", "medical", "electronics", "mobile", "other"],
    fonts: { heading: "inter", body: "inter" },
    heading: { weight: 700, tracking: "-0.01em" },
    colors: { bg: "#f3f6f4", surface: "#ffffff", text: "#0f1f17", muted: "#5a6a61", border: "#e0e8e3" },
    radius: { card: "12px", button: "10px", photo: "10px" },
    card: "shadow",
    header: "split",
    items: "grid",
    chips: "pill",
    decor: "none",
    accents: [
      ac("emerald", "Fresh green", "#16a34a", "#15803d", "#e8f8ee"),
      ac("royal", "Blue", "#2563eb", "#1d4ed8", "#eaf1ff"),
      ac("rose", "Red", "#dc2626", "#b91c1c", "#fdecec"),
      ac("orange", "Orange", "#ea580c", "#c2410c", "#fff0e6"),
    ],
  },
  {
    id: "fresh",
    name: "Organic & Gourmet",
    tagline: "Earthy and calm for organic, imported and gourmet stores.",
    level: "premium",
    for: ["kirana", "other"],
    fonts: { heading: "dmserif", body: "nunito" },
    heading: { weight: 400 },
    colors: { bg: "#f3f1e7", surface: "#fbfaf4", text: "#27301f", muted: "#676e5d", border: "#ddd9c7" },
    radius: { card: "6px", button: "999px", photo: "6px" },
    card: "flat",
    header: "cover",
    items: "grid",
    chips: "underline",
    decor: "none",
    accents: [
      ac("olive", "Olive", "#556b2f", "#445624", "#eef1e4"),
      ac("saffron", "Terracotta", "#b5562f", "#984724", "#f8ebe3"),
      ac("navy", "Ink", "#2f3a4a", "#232c39", "#eceef2"),
    ],
  },
  {
    id: "ayur",
    name: "Ayurveda",
    tagline: "Herbal greens and turmeric for ayurvedic and natural products.",
    level: "standard",
    for: ["medical", "cosmetics"],
    fonts: { heading: "laila", body: "hind" },
    heading: { weight: 600 },
    colors: { bg: "#f5f3e7", surface: "#fffdf6", text: "#2c3a1e", muted: "#687156", border: "#dfdbc3" },
    radius: { card: "12px", button: "999px", photo: "999px" },
    card: "outline",
    header: "center",
    items: "list",
    chips: "pill",
    decor: "garland",
    accents: [
      ac("emerald", "Tulsi", "#4d7c0f", "#3f6212", "#eef5e0"),
      ac("haldi", "Turmeric", "#b7791f", "#975a16", "#fbf1df"),
      ac("saffron", "Clay", "#9c4a2b", "#803c22", "#f6e9e2"),
    ],
  },
  {
    id: "pharma",
    name: "Pharmacy Plus",
    tagline: "Trustworthy blue, like a big pharmacy chain.",
    level: "premium",
    for: ["medical", "laundry"],
    fonts: { heading: "grotesk", body: "inter" },
    heading: { weight: 700, tracking: "-0.01em" },
    colors: { bg: "#f4f7fc", surface: "#ffffff", text: "#0b1b33", muted: "#57677f", border: "#dce4f0" },
    radius: { card: "16px", button: "12px", photo: "12px" },
    card: "shadow",
    header: "hero",
    items: "grid",
    chips: "pill",
    decor: "none",
    accents: [
      ac("royal", "Medical blue", "#0b63ce", "#0a54af", "#e7f0fc"),
      ac("teal", "Teal", "#0f9488", "#0d7a70", "#e3f6f4"),
      ac("emerald", "Green", "#16a34a", "#15803d", "#e8f8ee"),
    ],
  },
  {
    id: "notebook",
    name: "Notebook",
    tagline: "Blue ink on white paper for stationery and school shops.",
    level: "standard",
    for: ["stationery"],
    fonts: { heading: "kalam", body: "nunito" },
    heading: { weight: 700 },
    colors: { bg: "#fbfbf6", surface: "#ffffff", text: "#1d2a4a", muted: "#5b6886", border: "#d8e0f1" },
    radius: { card: "6px", button: "6px", photo: "4px" },
    card: "border",
    header: "split",
    items: "list",
    chips: "square",
    decor: "none",
    accents: [
      ac("royal", "Ink blue", "#1d4ed8", "#1e40af", "#eaf0fe"),
      ac("rose", "Red pen", "#dc2626", "#b91c1c", "#fdecec"),
      ac("emerald", "Green pen", "#15803d", "#166534", "#e8f7ed"),
      ac("yellow", "Pencil", "#eab308", "#ca8a04", "#fef8db", "#1d2a4a"),
    ],
  },
  {
    id: "bookhouse",
    name: "Book House",
    tagline: "Old library feel for bookshops and premium stationery.",
    level: "premium",
    for: ["stationery"],
    fonts: { heading: "cormorant", body: "inter" },
    heading: { weight: 700 },
    colors: { bg: "#f7f2e8", surface: "#fffcf6", text: "#2a1f17", muted: "#736558", border: "#e2d7c5" },
    radius: { card: "2px", button: "2px", photo: "2px" },
    card: "border",
    header: "minimal",
    items: "list",
    chips: "underline",
    decor: "none",
    accents: [
      ac("saffron", "Leather", "#7c2d12", "#651f0b", "#f6e9e2"),
      ac("emerald", "Forest", "#14532d", "#0f4023", "#e6f0e9"),
      ac("navy", "Navy", "#1e3a5f", "#16304f", "#e9eff7"),
    ],
  },
  {
    id: "paints",
    name: "Colour House",
    tagline: "Bright and colourful for paint and decor shops.",
    level: "standard",
    for: ["hardware"],
    fonts: { heading: "poppins", body: "poppins" },
    heading: { weight: 600 },
    colors: { bg: "#fafafa", surface: "#ffffff", text: "#18181b", muted: "#5d5d66", border: "#e4e4e7" },
    radius: { card: "20px", button: "999px", photo: "16px" },
    card: "shadow",
    header: "center",
    items: "grid",
    center: true,
    chips: "pill",
    decor: "confetti",
    accents: [
      ac("purple", "Magenta", "#c026d3", "#a21caf", "#fbe9fd"),
      ac("teal", "Teal", "#0d9488", "#0f766e", "#e4f6f4"),
      ac("royal", "Indigo", "#4f46e5", "#4338ca", "#eeedfd"),
      ac("haldi", "Sunflower", "#f59e0b", "#d97706", "#fef4dc", "#18181b"),
    ],
  },
  {
    id: "protools",
    name: "Pro Tools",
    tagline: "Steel grey and sharp for big hardware and tool dealers.",
    level: "premium",
    for: ["hardware", "electronics"],
    fonts: { heading: "grotesk", body: "inter" },
    heading: { weight: 700, uppercase: true, tracking: "0.02em" },
    colors: { bg: "#eceef1", surface: "#ffffff", text: "#111827", muted: "#4b5563", border: "#cfd4dc" },
    radius: { card: "4px", button: "4px", photo: "4px" },
    card: "border",
    header: "hero",
    items: "grid",
    chips: "square",
    decor: "none",
    accents: [
      ac("haldi", "Amber", "#f59e0b", "#d97706", "#fef4dc", "#111827"),
      ac("rose", "Red", "#dc2626", "#b91c1c", "#fdecec"),
      ac("royal", "Blue", "#2563eb", "#1d4ed8", "#eaf1ff"),
    ],
  },

  /* ---------- Tech ---------- */
  {
    id: "neon",
    name: "Neon",
    tagline: "Dark with glowing colour. Gaming, mobiles and accessories.",
    level: "premium",
    for: ["electronics", "mobile"],
    fonts: { heading: "grotesk", body: "inter" },
    heading: { weight: 700, tracking: "-0.01em" },
    colors: { bg: "#07080d", surface: "#11131c", text: "#e8ecf5", muted: "#8b93a8", border: "#252a3b" },
    dark: true,
    radius: { card: "14px", button: "10px", photo: "10px" },
    card: "border",
    header: "hero",
    items: "grid",
    chips: "pill",
    decor: "none",
    accents: [
      ac("cyan", "Cyan", "#22d3ee", "#06b6d4", "#0b2229", "#07080d"),
      ac("lime", "Lime", "#a3e635", "#84cc16", "#18220b", "#07080d"),
      ac("rose", "Pink", "#f472b6", "#ec4899", "#2a1020", "#07080d"),
      ac("violet", "Violet", "#a78bfa", "#8b5cf6", "#1a1530", "#07080d"),
    ],
  },
  {
    id: "showroom",
    name: "Showroom",
    tagline: "Big photos on clean white, like a brand store.",
    level: "premium",
    for: ["electronics", "mobile", "footwear", "furniture", "other", "property"],
    fonts: { heading: "inter", body: "inter" },
    heading: { weight: 600, tracking: "-0.02em" },
    colors: { bg: "#ffffff", surface: "#f5f5f7", text: "#1d1d1f", muted: "#6e6e73", border: "#e5e5ea" },
    radius: { card: "18px", button: "999px", photo: "14px" },
    card: "flat",
    header: "cover",
    items: "grid",
    center: true,
    chips: "pill",
    decor: "none",
    accents: [
      ac("slate", "Graphite", "#1d1d1f", "#000000", "#f0f0f2"),
      ac("royal", "Blue", "#0071e3", "#0062c4", "#e8f2fd"),
      ac("rose", "Red", "#d70015", "#b80012", "#fde8ea"),
    ],
  },

  /* ---------- Fashion and beauty ---------- */
  {
    id: "fashionstreet",
    name: "Fashion Street",
    tagline: "Pink and peppy for budget fashion, footwear and accessories.",
    level: "budget",
    for: ["clothing", "footwear", "cosmetics", "jewellery"],
    fonts: { heading: "poppins", body: "poppins" },
    heading: { weight: 600 },
    colors: { bg: "#fff5f7", surface: "#ffffff", text: "#1f1020", muted: "#6b586c", border: "#f4d0dc" },
    radius: { card: "12px", button: "8px", photo: "10px" },
    card: "border",
    header: "banner",
    items: "grid",
    chips: "pill",
    decor: "none",
    accents: [
      ac("rose", "Hot pink", "#e11d74", "#be185d", "#fde7f1"),
      ac("red", "Red", "#dc2626", "#b91c1c", "#fdecec"),
      ac("purple", "Purple", "#9333ea", "#7e22ce", "#f4e9fe"),
      ac("noir", "Black", "#111111", "#000000", "#f2f2f2"),
    ],
  },
  {
    id: "urban",
    name: "Urban",
    tagline: "Streetwear look: black, bold capitals and tall photos.",
    level: "standard",
    for: ["clothing", "footwear", "property"],
    fonts: { heading: "bebas", body: "inter" },
    heading: { weight: 400, tracking: "0.04em" },
    colors: { bg: "#f2f2f0", surface: "#ffffff", text: "#0a0a0a", muted: "#575757", border: "#0a0a0a" },
    radius: { card: "0px", button: "0px", photo: "0px" },
    card: "flat",
    header: "hero",
    items: "portrait",
    chips: "square",
    decor: "none",
    accents: [
      ac("noir", "Black", "#0a0a0a", "#000000", "#e9e9e7"),
      ac("orange", "Blaze", "#ff5a1f", "#e64a12", "#ffece4"),
      ac("olive", "Olive", "#4d5d2a", "#3c4920", "#eef1e6"),
      ac("royal", "Cobalt", "#1e40af", "#1e3a8a", "#e8edfa"),
    ],
  },
  {
    id: "ethnic",
    name: "Ethnic Wear",
    tagline: "Wedding colours and a toran on top. Sarees, lehengas, kundan.",
    level: "standard",
    for: ["clothing", "jewellery"],
    fonts: { heading: "yatra", body: "mukta" },
    heading: { weight: 400 },
    colors: { bg: "#fdf4ea", surface: "#fffaf3", text: "#4a1020", muted: "#85505e", border: "#efd5bf" },
    radius: { card: "8px", button: "999px", photo: "8px" },
    card: "outline",
    header: "center",
    items: "portrait",
    center: true,
    chips: "pill",
    decor: "garland",
    accents: [
      ac("maroon", "Maroon", "#9f1239", "#881337", "#fde8ee"),
      ac("rose", "Rani pink", "#c2185b", "#a3134c", "#fce7f0"),
      ac("teal", "Peacock", "#0f766e", "#115e59", "#e2f4f2"),
      ac("gold", "Gold", "#a16207", "#854d0e", "#fdf3d8"),
    ],
  },
  {
    id: "couture",
    name: "Couture",
    tagline: "Quiet luxury: ivory, serif type and your shop photo.",
    level: "premium",
    for: ["clothing", "cosmetics"],
    fonts: { heading: "dmserif", body: "inter" },
    heading: { weight: 400, tracking: "0.01em" },
    colors: { bg: "#f6f1ea", surface: "#fffdf9", text: "#1c1917", muted: "#77706b", border: "#e6ddd1" },
    radius: { card: "0px", button: "0px", photo: "0px" },
    card: "flat",
    header: "cover",
    items: "portrait",
    chips: "underline",
    decor: "none",
    accents: [
      ac("choco", "Espresso", "#3b2a20", "#2a1d16", "#efe8e1"),
      ac("gold", "Champagne", "#9a7a45", "#7f6436", "#f5eee1"),
      ac("noir", "Noir", "#111111", "#000000", "#efefef"),
    ],
  },
  {
    id: "diamond",
    name: "Diamond",
    tagline: "Bright white and platinum for diamond and bridal jewellery.",
    level: "premium",
    for: ["jewellery"],
    fonts: { heading: "cormorant", body: "inter" },
    heading: { weight: 600, uppercase: true, tracking: "0.08em" },
    colors: { bg: "#fbfbfc", surface: "#ffffff", text: "#16181d", muted: "#6b7280", border: "#e5e7eb" },
    radius: { card: "2px", button: "2px", photo: "2px" },
    card: "outline",
    header: "minimal",
    items: "grid",
    center: true,
    chips: "underline",
    decor: "diamond",
    accents: [
      ac("silver", "Platinum", "#4b5563", "#374151", "#f1f2f4"),
      ac("royal", "Sapphire", "#1e40af", "#1e3a8a", "#e8edfa"),
      ac("emerald", "Emerald", "#047857", "#065f46", "#e3f5ee"),
      ac("rose", "Ruby", "#9f1239", "#881337", "#fde8ee"),
    ],
  },
  {
    id: "spa",
    name: "Spa & Salon",
    tagline: "Soft sage and stone for salons, spas and skin care.",
    level: "premium",
    for: ["cosmetics", "laundry"],
    fonts: { heading: "cormorant", body: "nunito" },
    heading: { weight: 600 },
    colors: { bg: "#f2f0ea", surface: "#faf9f5", text: "#2f332b", muted: "#636a5c", border: "#deddd1" },
    radius: { card: "20px", button: "999px", photo: "20px" },
    card: "flat",
    header: "cover",
    items: "grid",
    center: true,
    chips: "pill",
    decor: "none",
    accents: [
      ac("emerald", "Sage", "#5f8466", "#4e6f55", "#e9efe8"),
      ac("nude", "Clay", "#a8705a", "#8f5c48", "#f6ebe5"),
      ac("purple", "Lavender", "#7f6fae", "#6a5b98", "#efecf7"),
    ],
  },

  /* ---------- Gifts, kids and home ---------- */
  {
    id: "party",
    name: "Party Time",
    tagline: "Balloons-and-confetti fun for gift and party shops.",
    level: "budget",
    for: ["gift", "toys"],
    fonts: { heading: "fredoka", body: "nunito" },
    heading: { weight: 600 },
    colors: { bg: "#fff5fb", surface: "#ffffff", text: "#2a1b3d", muted: "#6c5d81", border: "#f0d8ef" },
    radius: { card: "20px", button: "999px", photo: "16px" },
    card: "shadow",
    header: "banner",
    items: "grid",
    chips: "pill",
    decor: "confetti",
    accents: [
      ac("purple", "Grape", "#8b5cf6", "#7c3aed", "#f1ebff"),
      ac("rose", "Bubblegum", "#ec4899", "#db2777", "#fde8f3"),
      ac("cyan", "Sky", "#0284c7", "#0369a1", "#e4f3fb"),
      ac("orange", "Orange", "#ea580c", "#c2410c", "#fff0e5"),
    ],
  },
  {
    id: "hamper",
    name: "Gift Hamper",
    tagline: "Deep green and gold, like a luxury hamper box.",
    level: "premium",
    for: ["gift", "sweets"],
    fonts: { heading: "cormorant", body: "nunito" },
    heading: { weight: 700 },
    colors: { bg: "#0f2a22", surface: "#15362c", text: "#f3ead8", muted: "#b8b298", border: "#2c5044" },
    dark: true,
    radius: { card: "6px", button: "999px", photo: "6px" },
    card: "outline",
    header: "center",
    items: "grid",
    center: true,
    chips: "underline",
    decor: "diamond",
    accents: [
      ac("gold", "Gold", "#d4a64a", "#b98c33", "#1f3a2c", "#0f2a22"),
      ac("rose", "Ruby", "#e8707f", "#dc5566", "#33232a", "#0f2a22"),
      ac("cream", "Cream", "#efe3c8", "#ded0b0", "#203b31", "#0f2a22"),
    ],
  },
  {
    id: "nursery",
    name: "Little Ones",
    tagline: "Soft baby colours and round shapes for kids and baby stores.",
    level: "premium",
    for: ["toys"],
    fonts: { heading: "nunito", body: "nunito" },
    heading: { weight: 800 },
    colors: { bg: "#f5f9ff", surface: "#ffffff", text: "#23324a", muted: "#63738d", border: "#dfe8f6" },
    radius: { card: "24px", button: "999px", photo: "20px" },
    card: "shadow",
    header: "center",
    items: "grid",
    center: true,
    chips: "pill",
    decor: "none",
    accents: [
      ac("royal", "Baby blue", "#3b82d6", "#2f6fbf", "#e9f1fc"),
      ac("orange", "Peach", "#d4593a", "#bb4a2e", "#fdeee9"),
      ac("mint", "Mint", "#1f9e80", "#198a70", "#e3f6f1"),
      ac("yellow", "Lemon", "#f2c230", "#e0ae18", "#fef8de", "#23324a"),
    ],
  },
  {
    id: "timber",
    name: "Timber",
    tagline: "Warm wood tones and your showroom photo on top.",
    level: "standard",
    for: ["furniture", "property"],
    fonts: { heading: "playfair", body: "inter" },
    heading: { weight: 600 },
    colors: { bg: "#f5efe6", surface: "#fffaf3", text: "#2e2118", muted: "#786352", border: "#e4d6c2" },
    radius: { card: "6px", button: "6px", photo: "6px" },
    card: "border",
    header: "cover",
    items: "grid",
    chips: "underline",
    decor: "none",
    accents: [
      ac("choco", "Walnut", "#6b3f22", "#55311a", "#f3e9e0"),
      ac("saffron", "Teak", "#a0612b", "#854f22", "#f8ede3"),
      ac("olive", "Olive", "#556b2f", "#445624", "#eef1e4"),
      ac("slate", "Charcoal", "#333333", "#1f1f1f", "#efefef"),
    ],
  },
  {
    id: "nest",
    name: "Nest",
    tagline: "Light Scandinavian style for home decor and furnishing.",
    level: "standard",
    for: ["furniture", "gift", "property"],
    fonts: { heading: "inter", body: "inter" },
    heading: { weight: 600, tracking: "-0.01em" },
    colors: { bg: "#f4f4f0", surface: "#ffffff", text: "#23261f", muted: "#696c62", border: "#e2e3db" },
    radius: { card: "14px", button: "10px", photo: "12px" },
    card: "flat",
    header: "split",
    items: "grid",
    chips: "pill",
    decor: "none",
    accents: [
      ac("emerald", "Sage", "#6b8159", "#586b49", "#eef2ea"),
      ac("saffron", "Terracotta", "#c0673f", "#a65632", "#f9ece5"),
      ac("royal", "Ocean", "#2e6a8e", "#255a79", "#e6f0f5"),
      ac("haldi", "Mustard", "#c99a2e", "#b08523", "#f8f0dc", "#23261f"),
    ],
  },
];

const LEVEL_ORDER: Record<Level, number> = { budget: 0, standard: 1, premium: 2 };

/** Themes that suit a business type, budget first. */
export function themesForType(businessType: string): Theme[] {
  return THEMES.filter((t) => t.for.includes(businessType)).sort(
    (a, b) => LEVEL_ORDER[a.level] - LEVEL_ORDER[b.level],
  );
}

const BY_ID = new Map(THEMES.map((t) => [t.id, t]));

/**
 * The default theme of each business type, used until the shop picks one.
 * Changing an entry changes how existing shops look, so keep these stable.
 */
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
  laundry: "care",
  property: "nest",
  other: "classic",
};

export function getTheme(id: string | null | undefined): Theme | undefined {
  return id ? BY_ID.get(id) : undefined;
}

export function themeForType(businessType: string): Theme {
  return BY_ID.get(THEME_FOR_TYPE[businessType] ?? "classic") ?? THEMES[0];
}

/** Business types a theme suits, for "Made for" in the picker. */
export function typesForTheme(themeId: string): string[] {
  return getTheme(themeId)?.for ?? [];
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
