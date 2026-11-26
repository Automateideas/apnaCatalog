import type { CSSProperties } from "react";
import { themeVars } from "@/lib/theme-style";
import type { Accent, Theme } from "@/lib/themes";
import { cx } from "@/lib/utils";

const SAMPLES: Record<string, [string, string, string?][]> = {
  classic:      [["Gift hamper", "₹499", "🎁"], ["Photo frame", "₹249", "🖼️"], ["Soft toy", "₹349", "🧸"]],
  bazaar:       [["Aashirvaad atta 5 kg", "₹265"], ["Fortune oil 1 L", "₹155"], ["Tata salt 1 kg", "₹28"]],
  mithai:       [["Kaju katli", "₹950/kg"], ["Motichoor laddoo", "₹480/kg"], ["Aloo bhujia", "₹220/kg"]],
  boutique:     [["Linen kurta", "₹1,299"], ["Silk dupatta", "₹899"]],
  jewels:       [["Gold jhumka", "₹18,500"], ["Kundan set", "₹6,999"]],
  gadget:       [["Redmi Note 14", "₹14,999"], ["Boat earbuds", "₹1,299"]],
  care:         [["Dolo 650", "₹32"], ["BP monitor", "₹1,450"], ["Vicks inhaler", "₹55"]],
  bakery:       [["Black forest", "₹550"], ["Choco muffin", "₹60"], ["Croissant", "₹80"]],
  toyland:      [["Teddy bear", "₹399"], ["Building blocks", "₹699"]],
  workshop:     [["Hammer 500 g", "₹240"], ["PVC pipe 1 in", "₹95"], ["Asian paint 1 L", "₹410"]],
  dhaba:        [["Paneer tikka", "₹220"], ["Dal makhani", "₹180"], ["Butter naan", "₹45"]],
  glow:         [["Matte lipstick", "₹349"], ["Vitamin C serum", "₹499"]],
  street:       [["Paneer roll", "₹90"], ["Veg momos", "₹70"], ["Pav bhaji", "₹110"]],
  quick:        [["Veg burger", "₹79"], ["Cold coffee", "₹99"], ["Fries", "₹69"]],
  thali:        [["Special thali", "₹249"], ["Mini thali", "₹149"]],
  cafe:         [["Cappuccino", "₹140"], ["Masala chai", "₹40"], ["Brownie", "₹120"]],
  family:       [["Shahi paneer", "₹280"], ["Veg biryani", "₹240"]],
  fine:         [["Truffle risotto", "₹890"], ["Burrata salad", "₹740"], ["Tiramisu", "₹520"]],
  halwai:       [["Jalebi", "₹200/kg"], ["Samosa", "₹15"], ["Rasgulla", "₹320/kg"]],
  shahi:        [["Kaju pista roll", "₹1,600/kg"], ["Royal gift box", "₹2,499"]],
  homebaker:    [["Choco truffle cake", "₹650"], ["Banana bread", "₹280"], ["Cookies box", "₹350"]],
  patisserie:   [["Macarons box", "₹890"], ["Fruit tart", "₹320"]],
  deals:        [["Pressure cooker", "₹899"], ["Dinner set", "₹649"]],
  supermart:    [["Amul butter", "₹56"], ["Basmati rice 5 kg", "₹549"]],
  fresh:        [["Cold-pressed oil", "₹420"], ["Organic honey", "₹380"]],
  ayur:         [["Ashwagandha", "₹299"], ["Chyawanprash", "₹345"], ["Neem soap", "₹60"]],
  pharma:       [["Glucometer", "₹899"], ["Multivitamin", "₹420"]],
  notebook:     [["Classmate notebook", "₹55"], ["Gel pen pack", "₹100"], ["Geometry box", "₹120"]],
  bookhouse:    [["Godaan", "₹199"], ["Leather diary", "₹650"], ["Fountain pen", "₹890"]],
  paints:       [["Royale 4 L", "₹2,150"], ["Wall putty 20 kg", "₹780"]],
  protools:     [["Bosch drill", "₹3,499"], ["Tool kit 108 pc", "₹4,250"]],
  neon:         [["Gaming mouse", "₹1,499"], ["RGB keyboard", "₹2,299"]],
  showroom:     [["Smart TV 43 in", "₹27,990"], ["Soundbar", "₹8,999"]],
  fashionstreet:[["Printed top", "₹399"], ["Denim jeans", "₹699"]],
  urban:        [["Oversized tee", "₹799"], ["Cargo pants", "₹1,499"]],
  ethnic:       [["Banarasi saree", "₹4,999"], ["Lehenga", "₹8,499"]],
  couture:      [["Silk gown", "₹18,900"], ["Wool coat", "₹14,500"]],
  diamond:      [["Solitaire ring", "₹62,000"], ["Diamond studs", "₹38,500"]],
  spa:          [["Facial", "₹1,800"], ["Hair spa", "₹1,200"]],
  party:        [["Balloon pack", "₹149"], ["Birthday kit", "₹499"]],
  hamper:       [["Diwali hamper", "₹2,999"], ["Dry fruit box", "₹1,499"]],
  nursery:      [["Baby romper", "₹499"], ["Soft rattle", "₹299"]],
  timber:       [["Sheesham bed", "₹38,000"], ["Coffee table", "₹9,500"]],
  nest:         [["Cushion set", "₹1,299"], ["Floor lamp", "₹3,499"]],
  sneaker:      [["Air Force 1", "₹7,495"], ["Running shoes", "₹3,999"]],
  goldsouk:     [["22K gold chain", "₹42,000"], ["Silver anklet", "₹1,200"]],
  runway:       [["Pearl necklace", "₹8,500"], ["Gold bracelet", "₹22,000"]],
  loft:         [["Steel shelf", "₹4,200"], ["Industrial lamp", "₹2,800"]],
  playroom:     [["Lego set", "₹1,299"], ["Soft blocks", "₹499"]],
  township:     [["2BHK flat", "₹45 L"], ["Shop space", "₹18 L"]],
  dhobi:        [["Shirt wash", "₹30"], ["Dry clean suit", "₹250"], ["Saree press", "₹40"]],
  freshpress:   [["Shirt laundry", "₹35"], ["Dry clean coat", "₹350"]],
  corner:       [["Maggi 12 pack", "₹144"], ["Bisleri 1 L", "₹20"], ["Parle-G", "₹10"]],
  mandi:        [["Basmati 25 kg", "₹1,850"], ["Chana dal 10 kg", "₹780"]],
};

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

  // ── Header ──────────────────────────────────────────────────────────────
  const header = (() => {
    switch (theme.header) {
      case "hero":
        return (
          <div
            className="relative overflow-hidden px-4 pt-4 pb-5"
            style={{
              background: theme.dark
                ? `radial-gradient(ellipse 140% 100% at 110% -10%, color-mix(in oklab, var(--p) 70%, transparent) 0%, transparent 55%), linear-gradient(160deg, ${theme.colors.bg}, color-mix(in oklab, ${theme.colors.bg} 60%, #000))`
                : `radial-gradient(ellipse 140% 100% at 110% -10%, color-mix(in oklab, var(--p) 60%, transparent) 0%, transparent 55%), linear-gradient(160deg, #0b0f19, #1a2540)`,
            }}
          >
            {/* Subtle grid lines */}
            <div
              className="absolute inset-0 opacity-[0.06]"
              style={{
                backgroundImage: "linear-gradient(var(--p) 1px, transparent 1px), linear-gradient(90deg, var(--p) 1px, transparent 1px)",
                backgroundSize: "20px 20px",
              }}
            />
            <div className="relative">
              <div className="mb-1.5 flex items-center gap-1.5">
                <div className="h-5 w-5 rounded-sm bg-white/20 backdrop-blur-sm" />
                <div className="h-1.5 w-12 rounded-full bg-white/30" />
              </div>
              <p className="t-head truncate text-[15px] leading-tight text-white">{shopName}</p>
              <div className="mt-1.5 flex items-center gap-2">
                <span className="rounded-full px-2 py-0.5 text-[8px] font-semibold text-white" style={{ background: "var(--p)" }}>Open</span>
                <span className="text-[8px] text-white/60">Order on WhatsApp</span>
              </div>
            </div>
          </div>
        );

      case "cover":
        return (
          <div
            className="relative overflow-hidden"
            style={{ height: 72 }}
          >
            {/* Simulated photo */}
            <div
              className="absolute inset-0"
              style={{
                background: `linear-gradient(135deg, color-mix(in oklab, var(--p) 40%, #1a1a1a) 0%, color-mix(in oklab, var(--p) 15%, #0a0a0a) 100%)`,
              }}
            />
            {/* Photo texture dots */}
            <div
              className="absolute inset-0 opacity-20"
              style={{
                backgroundImage: "radial-gradient(circle, rgba(255,255,255,0.4) 1px, transparent 1px)",
                backgroundSize: "8px 8px",
              }}
            />
            <div
              className="absolute inset-0"
              style={{ background: "linear-gradient(to top, rgba(0,0,0,0.75) 0%, rgba(0,0,0,0.1) 60%, transparent 100%)" }}
            />
            <div className={cx("absolute bottom-0 left-0 right-0 px-3 pb-2", theme.center && "text-center")}>
              <p className="t-head truncate text-[14px] leading-tight text-white">{shopName}</p>
              <p className="text-[8px] text-white/70">📍 Open now</p>
            </div>
          </div>
        );

      case "center":
        return (
          <div className="px-3 pt-4 pb-2 text-center" style={{ background: "var(--t-bg)" }}>
            {theme.decor === "garland" && (
              <div className="t-garland mx-auto mb-2 h-2.5 max-w-full opacity-80" />
            )}
            <div
              className="mx-auto mb-2 flex h-9 w-9 items-center justify-center rounded-full text-[16px]"
              style={{ background: "var(--p)", color: "var(--pt)" }}
            >
              {shopName.charAt(0).toUpperCase()}
            </div>
            <p className="t-head truncate text-[14px] leading-tight" style={{ color: "var(--t-text)" }}>{shopName}</p>
            {theme.decor === "diamond" && (
              <p className="mt-0.5 text-[9px]" style={{ color: "var(--p)" }}>— ◆ —</p>
            )}
            {theme.decor === "garland" && (
              <div className="t-garland mx-auto mt-2 h-2.5 max-w-full opacity-80" />
            )}
          </div>
        );

      case "minimal":
        return (
          <div className="px-4 pt-4 pb-2" style={{ background: "var(--t-bg)" }}>
            <div
              className="border-y py-2 text-center"
              style={{ borderColor: "var(--t-text)" }}
            >
              <p
                className="t-head truncate text-[11px] uppercase"
                style={{ color: "var(--t-text)", letterSpacing: "0.2em" }}
              >
                {shopName}
              </p>
            </div>
            <div className="mt-1.5 flex justify-center gap-4">
              {["Collection", "New In", "Sale"].map((l, i) => (
                <span
                  key={l}
                  className="text-[8px]"
                  style={{ color: i === 0 ? "var(--p)" : "var(--t-muted)" }}
                >
                  {l}
                </span>
              ))}
            </div>
          </div>
        );

      case "split":
        return (
          <div style={{ background: "var(--t-surface)", borderBottom: "1px solid var(--t-border)" }}>
            <div className="h-1.5" style={{ background: "var(--p)" }} />
            <div className="flex items-center gap-2.5 px-3 py-2.5">
              <div
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-[13px] font-bold"
                style={{ background: "var(--p)", color: "var(--pt)" }}
              >
                {shopName.charAt(0).toUpperCase()}
              </div>
              <div>
                <p className="t-head truncate text-[13px] leading-tight" style={{ color: "var(--t-text)" }}>{shopName}</p>
                <p className="text-[8px]" style={{ color: "var(--t-muted)" }}>Open · WhatsApp order</p>
              </div>
            </div>
          </div>
        );

      default: // banner
        return (
          <div
            className="relative overflow-hidden px-3 py-3"
            style={{
              background: theme.decor === "hazard" ? "#1c1917" : "var(--p)",
              color: theme.decor === "hazard" ? "var(--p)" : "var(--pt)",
            }}
          >
            {theme.decor === "confetti" && (
              <div className="t-confetti absolute inset-0 opacity-50" />
            )}
            {theme.decor === "awning" && (
              <div className="absolute inset-x-0 top-0 h-3 overflow-hidden">
                <div className="t-awning w-[200%] origin-top-left scale-50" />
              </div>
            )}
            <div className="relative flex items-center gap-2.5">
              <div
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-[13px] font-bold"
                style={{
                  background: "rgba(255,255,255,0.2)",
                  color: theme.decor === "hazard" ? "var(--p)" : "var(--pt)",
                  borderRadius: "var(--t-photo-radius)",
                }}
              >
                {shopName.charAt(0).toUpperCase()}
              </div>
              <div>
                <p
                  className="t-head truncate text-[14px] leading-tight"
                  style={{ color: theme.decor === "hazard" ? "var(--p)" : "var(--pt)" }}
                >
                  {shopName}
                </p>
                <p
                  className="text-[8px] opacity-75"
                  style={{ color: theme.decor === "hazard" ? "var(--p)" : "var(--pt)" }}
                >
                  Open now
                </p>
              </div>
            </div>
            {theme.decor === "hazard" && (
              <div className="t-hazard absolute inset-x-0 bottom-0 h-1.5" />
            )}
          </div>
        );
    }
  })();

  // ── Category chips ───────────────────────────────────────────────────────
  const chips = (
    <div
      className={cx("flex px-3 pt-2 pb-0.5", theme.chips === "underline" ? "gap-3" : "gap-1.5")}
      style={{ background: "var(--t-bg)" }}
    >
      {["All", "Popular", "New"].map((label, i) =>
        theme.chips === "underline" ? (
          <span
            key={label}
            className="border-b-2 pb-0.5 text-[9px] font-semibold"
            style={{
              borderColor: i === 0 ? "var(--p)" : "transparent",
              color: i === 0 ? "var(--t-text)" : "var(--t-muted)",
            }}
          >
            {label}
          </span>
        ) : (
          <span
            key={label}
            className={cx("px-2 py-0.5 text-[9px] font-semibold", theme.chips === "square" ? "rounded-sm" : "rounded-full")}
            style={
              i === 0
                ? { background: "var(--p)", color: "var(--pt)", border: "1px solid var(--p)" }
                : { background: "var(--t-surface)", color: "var(--t-text)", border: "1px solid var(--t-border)" }
            }
          >
            {label}
          </span>
        ),
      )}
    </div>
  );

  // ── Items ────────────────────────────────────────────────────────────────
  const items = (() => {
    if (theme.items === "menu") {
      return (
        <div className="mx-3 mt-2" style={{ background: "var(--t-surface)", borderRadius: "var(--t-radius)", border: "var(--t-card-border)", boxShadow: "var(--t-shadow)", padding: "6px 8px" }}>
          {samples.slice(0, 3).map(([name, price]) => (
            <div key={name} className="flex items-end gap-1 py-1" style={{ borderBottom: "1px dashed var(--t-border)" }}>
              <span className="t-head truncate text-[10px]" style={{ color: "var(--t-text)" }}>{name}</span>
              <span className="mb-0.5 flex-1 self-end border-b border-dotted opacity-30" style={{ borderColor: "var(--t-muted)" }} />
              <span className="text-[10px] font-bold whitespace-nowrap" style={{ color: "var(--p)" }}>{price}</span>
            </div>
          ))}
        </div>
      );
    }

    if (theme.items === "list") {
      return (
        <div className="mx-3 mt-2" style={{ background: "var(--t-surface)", borderRadius: "var(--t-radius)", border: "var(--t-card-border)", boxShadow: "var(--t-shadow)" }}>
          {samples.slice(0, 3).map(([name, price]) => (
            <div key={name} className="flex items-center gap-2 px-2 py-1.5" style={{ borderBottom: "1px solid var(--t-border)" }}>
              <div className="h-6 w-6 shrink-0" style={{ background: "var(--ps)", borderRadius: "var(--t-photo-radius)" }} />
              <span className="flex-1 truncate text-[10px]" style={{ color: "var(--t-text)" }}>{name}</span>
              <span className="text-[10px] font-bold" style={{ color: "var(--p)" }}>{price}</span>
              <span
                className="rounded px-1 py-px text-[8px] font-semibold"
                style={{ border: "1px solid var(--p)", color: "var(--p)", borderRadius: "var(--t-btn-radius)" }}
              >
                Add
              </span>
            </div>
          ))}
        </div>
      );
    }

    if (theme.items === "portrait") {
      return (
        <div className="mt-2 grid grid-cols-2 gap-2 px-3">
          {samples.slice(0, 2).map(([name, price]) => (
            <div key={name} className={cx(theme.center && "text-center")}>
              <div
                className="w-full"
                style={{
                  height: 52,
                  background: `linear-gradient(160deg, var(--ps), color-mix(in oklab, var(--p) 20%, var(--ps)))`,
                  borderRadius: "var(--t-photo-radius)",
                }}
              />
              <p className="t-head mt-1 truncate text-[10px]" style={{ color: "var(--t-text)" }}>{name}</p>
              <p className="text-[10px] font-bold" style={{ color: "var(--p)" }}>{price}</p>
            </div>
          ))}
        </div>
      );
    }

    // grid
    return (
      <div className="mt-2 grid grid-cols-2 gap-2 px-3">
        {samples.slice(0, 2).map(([name, price]) => (
          <div
            key={name}
            className={cx("overflow-hidden", theme.center && "text-center")}
            style={{
              background: "var(--t-surface)",
              borderRadius: "var(--t-radius)",
              border: "var(--t-card-border)",
              boxShadow: "var(--t-shadow)",
            }}
          >
            <div
              style={{
                height: 40,
                background: `linear-gradient(135deg, var(--ps), color-mix(in oklab, var(--p) 25%, var(--ps)))`,
              }}
            />
            <div className="p-1.5">
              <p className="truncate text-[9px]" style={{ color: "var(--t-text)" }}>{name}</p>
              <p className="text-[9px] font-bold" style={{ color: "var(--p)" }}>{price}</p>
            </div>
          </div>
        ))}
      </div>
    );
  })();

  return (
    <div
      style={style}
      className={cx("t-page pointer-events-none overflow-hidden select-none", className)}
      aria-hidden="true"
    >
      {theme.decor === "awning" && theme.header !== "banner" && (
        <div className="h-4 overflow-hidden">
          <div className="t-awning w-[200%] origin-top-left scale-50" />
        </div>
      )}
      {header}
      {chips}
      {items}
    </div>
  );
}
