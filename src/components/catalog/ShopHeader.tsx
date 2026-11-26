import Image from "next/image";
import { Avatar } from "@/components/Avatar";
import { Stars } from "@/components/Stars";
import type { Theme } from "@/lib/themes";
import { cx } from "@/lib/utils";

type Props = {
  theme: Theme;
  name: string;
  logoUrl: string | null;
  subtitle: string;
  description: string | null;
  rating: number;
  ratingCount: number;
  coverUrl?: string | null;
};

function RatingLink({
  rating,
  count,
  className,
}: {
  rating: number;
  count: number;
  className?: string;
}) {
  if (count === 0) return null;
  return (
    <a
      href="#reviews"
      className={cx("mt-2 inline-flex items-center gap-1.5 text-sm", className)}
    >
      <Stars value={rating} className="text-amber-400" />
      <span className="font-semibold">{rating.toFixed(1)}</span>
      <span className="opacity-70">
        ({count} {count === 1 ? "review" : "reviews"})
      </span>
    </a>
  );
}

export function ShopHeader(props: Props) {
  if (props.theme.decor !== "awning") return <HeaderBody {...props} />;
  return (
    <>
      <div className="t-awning" aria-hidden="true" />
      <HeaderBody {...props} />
    </>
  );
}

function HeaderBody({
  theme,
  name,
  logoUrl,
  subtitle,
  description,
  rating,
  ratingCount,
  coverUrl,
}: Props) {
  const logo = (className: string, round = false) => (
    <Avatar
      name={name}
      src={logoUrl}
      color="var(--pd)"
      round={round}
      radius={round ? undefined : "var(--t-photo-radius)"}
      className={className}
    />
  );

  switch (theme.header) {
    // ── CENTER ──────────────────────────────────────────────────────────────
    case "center":
      return (
        <header className="w-full" style={{ background: "var(--t-bg)" }}>
          <div className="mx-auto w-full max-w-5xl px-4 pt-10 pb-6 text-center sm:px-6">
            {logo(
              "mx-auto h-24 w-24 text-3xl shadow-lg ring-4 ring-(--p)/20 ring-offset-4 ring-offset-(--t-bg)",
              true,
            )}
            <h1 className="t-head mt-5 text-3xl leading-tight text-(--t-text) sm:text-4xl">
              {name}
            </h1>
            <p className="mt-1.5 text-sm text-(--t-muted)">{subtitle}</p>
            <RatingLink
              rating={rating}
              count={ratingCount}
              className="justify-center text-(--t-text)"
            />
            {theme.decor === "diamond" && (
              <div
                className="mx-auto mt-5 flex max-w-48 items-center gap-3"
                aria-hidden="true"
              >
                <span
                  className="h-px flex-1 opacity-40"
                  style={{ background: "var(--p)" }}
                />
                <span className="text-sm" style={{ color: "var(--p)" }}>
                  ◆
                </span>
                <span
                  className="h-px flex-1 opacity-40"
                  style={{ background: "var(--p)" }}
                />
              </div>
            )}
            {theme.decor === "garland" && (
              <div
                className="t-garland mx-auto mt-5 max-w-72"
                aria-hidden="true"
              />
            )}
            {description && (
              <p className="mx-auto mt-4 max-w-xl text-sm leading-relaxed text-(--t-muted)">
                {description}
              </p>
            )}
          </div>
        </header>
      );

    // ── HERO ────────────────────────────────────────────────────────────────
    case "hero":
      return (
        <header
          className="relative overflow-hidden text-white"
          style={{
            background: theme.dark
              ? `radial-gradient(ellipse 160% 120% at 110% -20%, color-mix(in oklab, var(--p) 65%, transparent), transparent 55%), linear-gradient(160deg, ${theme.colors.bg}, color-mix(in oklab, ${theme.colors.bg} 50%, #000))`
              : "radial-gradient(ellipse 160% 120% at 110% -20%, color-mix(in oklab, var(--p) 60%, transparent), transparent 55%), linear-gradient(160deg, #080c18, #111827)",
          }}
        >
          {/* Subtle noise texture */}
          <div
            className="pointer-events-none absolute inset-0 opacity-[0.03]"
            style={{
              backgroundImage:
                "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='1'/%3E%3C/svg%3E\")",
              backgroundSize: "200px 200px",
            }}
            aria-hidden="true"
          />
          {/* Subtle grid */}
          <div
            className="pointer-events-none absolute inset-0 opacity-[0.04]"
            style={{
              backgroundImage:
                "linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)",
              backgroundSize: "40px 40px",
            }}
            aria-hidden="true"
          />
          <div className="relative mx-auto w-full max-w-5xl px-4 pt-10 pb-12 sm:px-6 sm:pt-14">
            <div className="flex items-center gap-4">
              {logo("h-16 w-16 border border-white/20 text-xl shadow-xl")}
              <p className="text-sm text-white/70">{subtitle}</p>
            </div>
            <h1 className="t-head mt-6 text-4xl leading-[1.05] sm:text-5xl lg:text-6xl">
              {name}
            </h1>
            <RatingLink
              rating={rating}
              count={ratingCount}
              className="text-white/90"
            />
            {description && (
              <p className="mt-4 max-w-xl text-sm leading-relaxed text-white/80">
                {description}
              </p>
            )}
          </div>
        </header>
      );

    // ── COVER ───────────────────────────────────────────────────────────────
    case "cover":
      return (
        <header className="relative isolate overflow-hidden bg-[#111] text-white">
          {coverUrl ? (
            <Image
              src={coverUrl}
              alt=""
              fill
              sizes="100vw"
              className="absolute inset-0 -z-10 object-cover"
              priority
            />
          ) : (
            <div
              className="absolute inset-0 -z-10"
              style={{
                background:
                  "radial-gradient(ellipse 140% 120% at 100% 0%, var(--pd), #0a0a0a 65%)",
              }}
            />
          )}
          {/* Multi-layer gradient for depth */}
          <div className="absolute inset-0 -z-10 bg-linear-to-t from-black/90 via-black/40 to-black/10" />
          <div className="absolute inset-0 -z-10 bg-linear-to-r from-black/30 to-transparent" />
          <div
            className={cx(
              "mx-auto w-full max-w-5xl px-4 pt-32 pb-8 sm:px-6 sm:pt-44",
              theme.center && "flex flex-col items-center text-center",
            )}
          >
            {logo("h-16 w-16 border-2 border-white/40 text-lg shadow-2xl")}
            <h1 className="t-head mt-4 text-4xl leading-[1.05] drop-shadow-lg sm:text-5xl">
              {name}
            </h1>
            <p className="mt-1.5 text-sm text-white/75">{subtitle}</p>
            <RatingLink
              rating={rating}
              count={ratingCount}
              className="text-white/90"
            />
            {theme.decor === "diamond" && (
              <div
                className={cx(
                  "mt-4 flex w-40 items-center gap-3",
                  theme.center && "mx-auto",
                )}
                aria-hidden="true"
              >
                <span className="h-px flex-1 bg-white/30" />
                <span className="text-xs" style={{ color: "var(--p)" }}>
                  ◆
                </span>
                <span className="h-px flex-1 bg-white/30" />
              </div>
            )}
            {description && (
              <p className="mt-4 max-w-xl text-sm leading-relaxed text-white/80">
                {description}
              </p>
            )}
          </div>
        </header>
      );

    // ── MINIMAL ─────────────────────────────────────────────────────────────
    case "minimal":
      return (
        <header className="w-full" style={{ background: "var(--t-bg)" }}>
          <div className="mx-auto w-full max-w-5xl px-4 pt-10 pb-6 text-center sm:px-6">
            {logoUrl && logo("mx-auto mb-5 h-14 w-14 text-base opacity-90")}
            <div
              className="border-y py-5"
              style={{ borderColor: "var(--t-text)" }}
            >
              <h1
                className="t-head text-2xl text-(--t-text) uppercase sm:text-3xl"
                style={{ letterSpacing: "0.2em" }}
              >
                {name}
              </h1>
              <p
                className="mt-1.5 text-xs text-(--t-muted) uppercase"
                style={{ letterSpacing: "0.18em" }}
              >
                {subtitle}
              </p>
            </div>
            <RatingLink
              rating={rating}
              count={ratingCount}
              className="justify-center text-(--t-text)"
            />
            {description && (
              <p className="mx-auto mt-4 max-w-xl text-sm leading-relaxed text-(--t-muted)">
                {description}
              </p>
            )}
          </div>
        </header>
      );

    // ── SPLIT ───────────────────────────────────────────────────────────────
    case "split":
      return (
        <header
          style={{
            background: "var(--t-surface)",
            borderBottom: "1px solid var(--t-border)",
          }}
        >
          <div className="h-1.5" style={{ background: "var(--p)" }} />
          <div className="mx-auto w-full max-w-5xl px-4 py-6 sm:px-6">
            <div className="flex items-center gap-5">
              {logo("h-20 w-20 text-2xl shadow-sm")}
              <div className="min-w-0">
                <h1 className="t-head text-2xl leading-tight text-(--t-text) sm:text-3xl">
                  {name}
                </h1>
                <p className="mt-1 text-sm text-(--t-muted)">{subtitle}</p>
                <RatingLink
                  rating={rating}
                  count={ratingCount}
                  className="text-(--t-text)"
                />
              </div>
            </div>
            {description && (
              <p className="mt-4 max-w-2xl text-sm leading-relaxed text-(--t-muted)">
                {description}
              </p>
            )}
          </div>
        </header>
      );

    // ── BANNER (default) ────────────────────────────────────────────────────
    case "banner":
    default:
      return (
        <header
          className={cx(
            "relative overflow-hidden",
            theme.decor === "hazard"
              ? "bg-[#1c1917] text-white [&_h1]:text-(--p)"
              : "bg-(--p) text-(--pt)",
          )}
        >
          {/* Radial glow for depth */}
          {theme.decor !== "hazard" && (
            <div
              className="pointer-events-none absolute inset-0 opacity-20"
              style={{
                background:
                  "radial-gradient(ellipse 80% 80% at 110% 50%, rgba(255,255,255,0.3), transparent)",
              }}
              aria-hidden="true"
            />
          )}
          {theme.decor === "confetti" && (
            <div
              className="t-confetti pointer-events-none absolute inset-0 opacity-40"
              aria-hidden="true"
            />
          )}
          <div
            className={cx(
              "relative mx-auto w-full max-w-5xl px-4 pt-7 sm:px-6 sm:pt-9",
              theme.decor === "hazard" ? "pb-7" : "pb-12",
            )}
          >
            <div className="flex items-center gap-4">
              {logo("h-20 w-20 border-2 border-white/50 text-2xl shadow-lg")}
              <div className="min-w-0">
                <h1 className="t-head text-2xl leading-tight sm:text-3xl">
                  {name}
                </h1>
                <p className="mt-0.5 text-sm opacity-85">{subtitle}</p>
                <RatingLink rating={rating} count={ratingCount} />
              </div>
            </div>
            {description && (
              <p className="mt-4 max-w-2xl text-sm leading-relaxed opacity-90">
                {description}
              </p>
            )}
          </div>
          {theme.decor === "hazard" && (
            <div className="t-hazard" aria-hidden="true" />
          )}
        </header>
      );
  }
}
