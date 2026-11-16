import type { CSSProperties } from "react";
import { themeVars } from "@/lib/theme-style";
import type { Accent, Theme } from "@/lib/themes";
import { cx } from "@/lib/utils";

/** Sample items in each theme's preview, so it reads like a real shop of that kind. */
const SAMPLES: Record<string, [string, string][]> = {
  classic: [["Gift hamper", "₹499"], ["Photo frame", "₹249"]],
  bazaar: [["Aashirvaad atta 5 kg", "₹265"], ["Fortune oil 1 L", "₹155"], ["Tata salt 1 kg", "₹28"]],
  mithai: [["Kaju katli", "₹950/kg"], ["Motichoor laddoo", "₹480/kg"], ["Aloo bhujia", "₹220/kg"]],
  boutique: [["Linen kurta", "₹1,299"], ["Silk dupatta", "₹899"]],
  jewels: [["Gold jhumka", "₹18,500"], ["Kundan set", "₹6,999"]],
  gadget: [["Redmi Note 14", "₹14,999"], ["Boat earbuds", "₹1,299"]],
  care: [["Dolo 650", "₹32"], ["BP monitor", "₹1,450"], ["Vicks inhaler", "₹55"]],
  bakery: [["Black forest", "₹550"], ["Choco muffin", "₹60"]],
  toyland: [["Teddy bear", "₹399"], ["Building blocks", "₹699"]],
  workshop: [["Hammer 500 g", "₹240"], ["PVC pipe 1 in", "₹95"], ["Asian paint 1 L", "₹410"]],
  dhaba: [["Paneer tikka", "₹220"], ["Dal makhani", "₹180"], ["Butter naan", "₹45"]],
  glow: [["Matte lipstick", "₹349"], ["Vitamin C serum", "₹499"]],
  street: [["Paneer roll", "₹90"], ["Veg momos", "₹70"], ["Pav bhaji", "₹110"]],
  quick: [["Veg burger", "₹79"], ["Cold coffee", "₹99"], ["Fries", "₹69"]],
  thali: [["Special thali", "₹249"], ["Mini thali", "₹149"]],
  cafe: [["Cappuccino", "₹140"], ["Masala chai", "₹40"], ["Brownie", "₹120"]],
  family: [["Shahi paneer", "₹280"], ["Veg biryani", "₹240"]],
  fine: [["Truffle risotto", "₹890"], ["Burrata salad", "₹740"], ["Tiramisu", "₹520"]],
  halwai: [["Jalebi", "₹200/kg"], ["Samosa", "₹15"], ["Rasgulla", "₹320/kg"]],
  shahi: [["Kaju pista roll", "₹1,600/kg"], ["Royal gift box", "₹2,499"]],
  homebaker: [["Choco truffle cake", "₹650"], ["Banana bread", "₹280"], ["Cookies box", "₹350"]],
  patisserie: [["Macarons box", "₹890"], ["Fruit tart", "₹320"]],
  deals: [["Pressure cooker", "₹899"], ["Dinner set", "₹649"]],
  supermart: [["Amul butter", "₹56"], ["Basmati rice 5 kg", "₹549"]],
  fresh: [["Cold-pressed oil", "₹420"], ["Organic honey", "₹380"]],
  ayur: [["Ashwagandha", "₹299"], ["Chyawanprash", "₹345"], ["Neem soap", "₹60"]],
  pharma: [["Glucometer", "₹899"], ["Multivitamin", "₹420"]],
  notebook: [["Classmate notebook", "₹55"], ["Gel pen pack", "₹100"], ["Geometry box", "₹120"]],
  bookhouse: [["Godaan", "₹199"], ["Leather diary", "₹650"], ["Fountain pen", "₹890"]],
  paints: [["Royale 4 L", "₹2,150"], ["Wall putty 20 kg", "₹780"]],
  protools: [["Bosch drill", "₹3,499"], ["Tool kit 108 pc", "₹4,250"]],
  neon: [["Gaming mouse", "₹1,499"], ["RGB keyboard", "₹2,299"]],
  showroom: [["Smart TV 43 in", "₹27,990"], ["Soundbar", "₹8,999"]],
  fashionstreet: [["Printed top", "₹399"], ["Denim jeans", "₹699"]],
  urban: [["Oversized tee", "₹799"], ["Cargo pants", "₹1,499"]],
  ethnic: [["Banarasi saree", "₹4,999"], ["Lehenga", "₹8,499"]],
  couture: [["Silk gown", "₹18,900"], ["Wool coat", "₹14,500"]],
  diamond: [["Solitaire ring", "₹62,000"], ["Diamond studs", "₹38,500"]],
  spa: [["Facial", "₹1,800"], ["Hair spa", "₹1,200"]],
  party: [["Balloon pack", "₹149"], ["Birthday kit", "₹499"]],
  hamper: [["Diwali hamper", "₹2,999"], ["Dry fruit box", "₹1,499"]],
  nursery: [["Baby romper", "₹499"], ["Soft rattle", "₹299"]],
  timber: [["Sheesham bed", "₹38,000"], ["Coffee table", "₹9,500"]],
  nest: [["Cushion set", "₹1,299"], ["Floor lamp", "₹3,499"]],
};

/** A small picture of a shop page in the given theme. Uses the same CSS as the real page. */
export function ThemePreview({
  theme,
  accent,
  shopName,
  className,
}: {
  theme: Theme;
  accent: Accent;
  shopName: string;
  className?: string;
}) {
  const samples = SAMPLES[theme.id] ?? SAMPLES.classic;
  const style = themeVars(theme, accent) as CSSProperties;

  const header = (() => {
    switch (theme.header) {
      case "center":
        return (
          <div className="px-3 pt-3 pb-1 text-center">
            <div className="mx-auto h-7 w-7 rounded-full bg-(--p) ring-2 ring-(--p) ring-offset-2 ring-offset-(--t-bg)" />
            <p className="t-head mt-1.5 truncate text-[15px] leading-tight text-(--t-text)">{shopName}</p>
            {theme.decor === "garland" && <div className="t-garland mx-auto mt-1 h-2! max-w-24 bg-size-[8px_8px]!" />}
            {theme.decor === "diamond" && <p className="mt-0.5 text-[8px] text-(--p)">— ◆ —</p>}
          </div>
        );
      case "hero":
        return (
          <div
            className="px-3 pt-3 pb-4 text-white"
            style={{
              background:
                "radial-gradient(120% 90% at 100% 0%, color-mix(in oklab, var(--p) 55%, transparent), transparent 60%), linear-gradient(160deg, #0b0f19, #121a2b)",
            }}
          >
            <p className="t-head truncate text-lg leading-none">{shopName}</p>
            <p className="mt-1 text-[9px] text-white/70">Open now · Order on WhatsApp</p>
          </div>
        );
      case "cover":
        return (
          <div
            className={cx("px-3 pt-10 pb-2.5 text-white", theme.center && "text-center")}
            style={{
              background:
                "linear-gradient(to top, rgb(0 0 0 / 0.8), rgb(0 0 0 / 0.15)), radial-gradient(90% 120% at 80% 0%, var(--p), #2a2420 75%)",
            }}
          >
            <p className="t-head truncate text-lg leading-none">{shopName}</p>
            <p className="mt-1 text-[8px] text-white/75">Your shop photo shows here</p>
          </div>
        );
      case "minimal":
        return (
          <div className="px-3 pt-3">
            <div className="border-y border-(--t-text) py-1.5 text-center">
              <p className="t-head truncate text-[12px] tracking-[0.18em] text-(--t-text) uppercase">{shopName}</p>
            </div>
          </div>
        );
      case "split":
        return (
          <div className="border-b border-(--t-border) bg-(--t-surface)">
            <div className="h-1 bg-(--p)" />
            <div className="flex items-center gap-2 px-3 py-2">
              <div className="t-photo h-6 w-6 bg-(--p)" />
              <p className="t-head truncate text-[13px] text-(--t-text)">{shopName}</p>
            </div>
          </div>
        );
      default:
        return (
          <div
            className={cx(
              "relative px-3 py-3",
              theme.decor === "hazard" ? "bg-[#1c1917] text-white" : "bg-(--p) text-(--pt)",
            )}
          >
            {theme.decor === "confetti" && <div className="t-confetti absolute inset-0 opacity-40" />}
            <div className="relative flex items-center gap-2">
              <div className="t-photo h-7 w-7 border border-white/60 bg-white/25" />
              <p className={cx("t-head truncate text-[14px]", theme.decor === "hazard" && "text-(--p)")}>{shopName}</p>
            </div>
            {theme.decor === "hazard" && <div className="t-hazard absolute inset-x-0 bottom-0 h-1!" />}
          </div>
        );
    }
  })();

  const chips = (
    <div className={cx("flex px-3 pt-2", theme.chips === "underline" ? "gap-3" : "gap-1.5")}>
      {["All", "New", "Popular"].map((label, i) =>
        theme.chips === "underline" ? (
          <span
            key={label}
            className={cx(
              "border-b-2 text-[9px] font-medium",
              i === 0 ? "border-(--p) text-(--t-text)" : "border-transparent text-(--t-muted)",
            )}
          >
            {label}
          </span>
        ) : (
          <span
            key={label}
            className={cx(
              "border px-1.5 py-px text-[9px] font-medium",
              theme.chips === "square" ? "rounded-sm" : "rounded-full",
              i === 0 ? "border-(--p) bg-(--p) text-(--pt)" : "border-(--t-border) bg-(--t-surface) text-(--t-text)",
            )}
          >
            {label}
          </span>
        ),
      )}
    </div>
  );

  const add = <span className="t-btn border border-(--pa) px-1.5 text-[8px] font-semibold text-(--pa)">Add +</span>;

  const items = (() => {
    if (theme.items === "list" || theme.items === "menu") {
      const menu = theme.items === "menu";
      return (
        <div className={cx("t-card mx-3 mt-2 divide-y", menu ? "divide-dashed px-2" : "", "divide-(--t-border)")}>
          {samples.slice(0, 3).map(([name, price]) => (
            <div key={name} className={cx("flex items-center gap-1.5 py-1.5", !menu && "px-1.5")}>
              {!menu && <div className="t-photo h-5 w-5 shrink-0 bg-(--ps)" />}
              <span className={cx("truncate text-[10px] text-(--t-text)", menu && "t-head")}>{name}</span>
              {menu && <span className="mb-0.5 flex-1 self-end border-b border-dotted border-(--t-muted) opacity-60" />}
              <span className={cx("text-[10px] font-semibold whitespace-nowrap text-(--t-text)", !menu && "ml-auto")}>
                {price}
              </span>
              {!menu && add}
            </div>
          ))}
        </div>
      );
    }
    const tall = theme.items === "portrait";
    return (
      <div className="mt-2 grid grid-cols-2 gap-2 px-3">
        {samples.slice(0, 2).map(([name, price]) => (
          <div key={name} className={cx(!tall && "t-card overflow-hidden", theme.center && "text-center")}>
            <div className={cx(tall ? "t-photo h-16" : "h-10", "bg-(--ps)")} />
            <div className={tall ? "pt-1" : "p-1.5"}>
              <p className={cx("truncate text-[10px] text-(--t-text)", tall && "t-head")}>{name}</p>
              <p className="text-[10px] font-semibold text-(--t-text)">{price}</p>
            </div>
          </div>
        ))}
      </div>
    );
  })();

  return (
    <div
      style={style}
      className={cx("t-page pointer-events-none h-52 overflow-hidden select-none", className)}
      aria-hidden="true"
    >
      {theme.decor === "awning" && (
        <div className="h-3.5 overflow-hidden">
          <div className="t-awning w-[200%] origin-top-left scale-50" />
        </div>
      )}
      {header}
      {chips}
      {items}
    </div>
  );
}
