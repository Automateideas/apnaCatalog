import {
  Baloo_2,
  Bebas_Neue,
  Cormorant_Garamond,
  DM_Serif_Display,
  Fredoka,
  Hind,
  Inter,
  Kalam,
  Laila,
  Mukta,
  Nunito,
  Oswald,
  Playfair_Display,
  Poppins,
  Rozha_One,
  Space_Grotesk,
  Yatra_One,
} from "next/font/google";
import type { Accent, FontKey, Theme } from "@/lib/themes";

/*
  Fonts for the shop themes. They are not preloaded: the browser downloads a
  font only when a theme on the page uses it, so a shop page loads just its own
  two fonts. Latin-only fonts fall back to Mukta for Hindi text.
*/
const baloo = Baloo_2({ display: "swap", preload: false, subsets: ["latin", "devanagari"], weight: ["600", "700", "800"] });
const mukta = Mukta({ display: "swap", preload: false, subsets: ["latin", "devanagari"], weight: ["400", "500", "600", "700"] });
const yatra = Yatra_One({ display: "swap", preload: false, subsets: ["latin", "devanagari"], weight: "400" });
const playfair = Playfair_Display({ display: "swap", preload: false, subsets: ["latin"], weight: ["500", "600", "700"] });
const inter = Inter({ display: "swap", preload: false, subsets: ["latin"] });
const cormorant = Cormorant_Garamond({ display: "swap", preload: false, subsets: ["latin"], weight: ["500", "600", "700"] });
const grotesk = Space_Grotesk({ display: "swap", preload: false, subsets: ["latin"] });
const fredoka = Fredoka({ display: "swap", preload: false, subsets: ["latin"] });
const oswald = Oswald({ display: "swap", preload: false, subsets: ["latin"] });
const rozha = Rozha_One({ display: "swap", preload: false, subsets: ["latin", "devanagari"], weight: "400" });
const poppins = Poppins({ display: "swap", preload: false, subsets: ["latin", "devanagari"], weight: ["400", "500", "600"] });
const hind = Hind({ display: "swap", preload: false, subsets: ["latin", "devanagari"], weight: ["400", "500", "600"] });

const kalam = Kalam({ display: "swap", preload: false, subsets: ["latin", "devanagari"], weight: ["400", "700"] });
const dmserif = DM_Serif_Display({ display: "swap", preload: false, subsets: ["latin"], weight: "400" });
const bebas = Bebas_Neue({ display: "swap", preload: false, subsets: ["latin"], weight: "400" });
const nunito = Nunito({ display: "swap", preload: false, subsets: ["latin"] });
const laila = Laila({ display: "swap", preload: false, subsets: ["latin", "devanagari"], weight: ["500", "600", "700"] });

const FONTS: Record<FontKey, { style: { fontFamily: string } }> = {
  baloo, mukta, yatra, playfair, inter, cormorant, grotesk, fredoka, oswald, rozha, poppins, hind,
  kalam, dmserif, bebas, nunito, laila,
};

/** True for dark colours like #1c1917, by perceived brightness. */
function isDarkColor(hex: string): boolean {
  const n = parseInt(hex.slice(1), 16);
  const [r, g, b] = [(n >> 16) & 255, (n >> 8) & 255, n & 255];
  return r * 0.299 + g * 0.587 + b * 0.114 < 128;
}

function hexToRgb(hex: string): [number, number, number] {
  const n = parseInt(hex.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

function rgbToHex(r: number, g: number, b: number): string {
  return "#" + [r, g, b].map((c) => Math.round(Math.max(0, Math.min(255, c))).toString(16).padStart(2, "0")).join("");
}


/** A font stack that still shows Hindi well when the theme font has no Devanagari. */
export function fontStack(key: FontKey): string {
  return `${FONTS[key].style.fontFamily}, ${mukta.style.fontFamily}, ui-sans-serif, system-ui, sans-serif`;
}

const CARD: Record<Theme["card"], { border: string; shadow: string }> = {
  border: { border: "1px solid var(--t-border)", shadow: "none" },
  shadow: { border: "1px solid transparent", shadow: "0 1px 2px rgb(0 0 0 / 0.04), 0 6px 20px rgb(0 0 0 / 0.06)" },
  flat: { border: "0 solid transparent", shadow: "none" },
  outline: { border: "1px solid var(--t-border)", shadow: "inset 0 0 0 3px var(--t-surface), inset 0 0 0 4px var(--t-border)" },
  pop: { border: "2px solid var(--t-border)", shadow: "4px 4px 0 var(--t-border)" },
};

/**
 * The CSS variables of a theme. Shop components read only these, so one set of
 * components draws every theme. It also re-points the shadcn colours, so
 * sheets, inputs and dialogs on the shop page follow the theme too.
 */
export function themeVars(theme: Theme, accent: Accent): Record<string, string> {
  const c = theme.colors;
  const card = CARD[theme.card];
  return {
    "--t-bg": c.bg,
    "--t-surface": c.surface,
    "--t-text": c.text,
    "--t-muted": c.muted,
    "--t-border": c.border,
    "--t-radius": theme.radius.card,
    "--t-btn-radius": theme.radius.button,
    "--t-photo-radius": theme.radius.photo,
    "--t-card-border": card.border,
    "--t-shadow": card.shadow,
    "--t-font-head": fontStack(theme.fonts.heading),
    "--t-font-body": fontStack(theme.fonts.body),
    "--t-head-weight": String(theme.heading.weight),
    "--t-head-case": theme.heading.uppercase ? "uppercase" : "none",
    "--t-head-tracking": theme.heading.tracking ?? "normal",
    "--p": accent.primary,
    "--pd": accent.dark,
    "--ps": accent.soft,
    "--pt": accent.on,
    // The colour for accent-coloured text and outlines. A light accent (e.g. yellow)
    // is unreadable as text on a light page, so the page text colour is used instead.
    "--pa": !theme.dark && isDarkColor(accent.on) ? c.text : accent.primary,
    // shadcn components
    "--background": c.bg,
    "--foreground": c.text,
    "--card": c.surface,
    "--card-foreground": c.text,
    "--popover": c.surface,
    "--popover-foreground": c.text,
    "--muted": accent.soft,
    "--muted-foreground": c.muted,
    "--border": theme.card === "pop" || theme.id === "workshop" ? "#d6d3d1" : c.border,
    "--input": theme.dark ? c.border : "#cbd5e1",
    "--primary": accent.primary,
    "--primary-foreground": accent.on,
    "--ring": accent.primary,
  };
}

/**
 * Mix a small amount of the theme's background hue into a neutral dark base.
 * This gives each theme a subtle warm/cool character without garish saturation.
 */
function tintedDark(base: [number, number, number], themeHex: string, amount: number): string {
  const [tr, tg, tb] = hexToRgb(themeHex);
  return rgbToHex(
    base[0] + (tr - base[0]) * amount,
    base[1] + (tg - base[1]) * amount,
    base[2] + (tb - base[2]) * amount,
  );
}

/**
 * Dark-mode overrides for a light theme's colour variables.
 * Uses a neutral dark palette with a subtle hue tint from the theme.
 * Already-dark themes return an empty object.
 */
function darkVars(theme: Theme, accent: Accent): Record<string, string> {
  if (theme.dark) return {};
  const c = theme.colors;
  const tint = 0.08;
  const darkBg = tintedDark([17, 17, 20], c.bg, tint);
  const darkSurface = tintedDark([26, 26, 30], c.bg, tint);
  const darkBorder = tintedDark([48, 48, 54], c.bg, tint * 1.5);
  const darkText = "#e8e6e3";
  const darkMuted = "#9ca3af";
  const darkAccentSoft = tintedDark([30, 30, 36], accent.primary, 0.12);
  const darkShadow = theme.card === "shadow"
    ? "0 1px 2px rgb(0 0 0 / 0.3), 0 6px 20px rgb(0 0 0 / 0.25)"
    : undefined;
  const vars: Record<string, string> = {
    "--t-bg": darkBg,
    "--t-surface": darkSurface,
    "--t-text": darkText,
    "--t-muted": darkMuted,
    "--t-border": darkBorder,
    "--t-card-border": theme.card === "pop"
      ? `2px solid ${darkBorder}`
      : theme.card === "flat"
        ? "0 solid transparent"
        : `1px solid ${darkBorder}`,
    "--ps": darkAccentSoft,
    "--pa": accent.primary,
    "--background": darkBg,
    "--foreground": darkText,
    "--card": darkSurface,
    "--card-foreground": darkText,
    "--popover": darkSurface,
    "--popover-foreground": darkText,
    "--muted": darkAccentSoft,
    "--muted-foreground": darkMuted,
    "--border": darkBorder,
    "--input": darkBorder,
  };
  if (darkShadow) vars["--t-shadow"] = darkShadow;
  return vars;
}

/** The variables as one CSS rule, e.g. for `:root` so portalled sheets get them. */
export function themeCss(selector: string, theme: Theme, accent: Accent): string {
  const body = Object.entries(themeVars(theme, accent))
    .map(([k, v]) => `${k}:${v}`)
    .join(";");
  const dark = darkVars(theme, accent);
  const darkBody = Object.entries(dark)
    .map(([k, v]) => `${k}:${v}`)
    .join(";");
  let css = `${selector}{${body}}`;
  if (darkBody) {
    const darkSelector = selector === ":root" ? ":root.dark" : `.dark ${selector}`;
    css += `${darkSelector}{${darkBody}}`;
  }
  return css;
}
