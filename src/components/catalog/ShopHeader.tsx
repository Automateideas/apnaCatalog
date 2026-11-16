import { Avatar } from "@/components/Avatar";
import { Stars } from "@/components/Stars";
import type { Theme } from "@/lib/themes";
import { cx } from "@/lib/utils";

type Props = {
  theme: Theme;
  name: string;
  logoUrl: string | null;
  /** e.g. "Sweets / Namkeen, Jaipur" */
  subtitle: string;
  description: string | null;
  rating: number;
  ratingCount: number;
};

function RatingLink({ rating, count, className }: { rating: number; count: number; className?: string }) {
  if (count === 0) return null;
  return (
    <a href="#reviews" className={cx("mt-1.5 inline-flex items-center gap-1.5 text-sm", className)}>
      <Stars value={rating} className="text-amber-400" />
      <span className="font-semibold">{rating.toFixed(1)}</span>
      <span className="opacity-80">
        ({count} {count === 1 ? "review" : "reviews"})
      </span>
    </a>
  );
}

/** The top of a shop page. Each theme picks one of five designs. */
export function ShopHeader({ theme, name, logoUrl, subtitle, description, rating, ratingCount }: Props) {
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
    case "center":
      return (
        <header className="mx-auto w-full max-w-3xl px-4 pt-8 pb-2 text-center">
          {logo("mx-auto h-24 w-24 text-3xl ring-2 ring-(--p) ring-offset-4 ring-offset-(--t-bg)", true)}
          <h1 className="t-head mt-4 text-3xl leading-tight text-(--t-text) sm:text-4xl">{name}</h1>
          <p className="mt-1 text-sm text-(--t-muted)">{subtitle}</p>
          <RatingLink rating={rating} count={ratingCount} className="text-(--t-text)" />
          {theme.decor === "diamond" ? (
            <div className="mx-auto mt-4 flex max-w-56 items-center gap-3 text-(--p)" aria-hidden="true">
              <span className="h-px flex-1 bg-(--p) opacity-60" />
              <span className="text-xs">◆</span>
              <span className="h-px flex-1 bg-(--p) opacity-60" />
            </div>
          ) : theme.decor === "garland" ? (
            <div className="t-garland mx-auto mt-4 max-w-72" aria-hidden="true" />
          ) : null}
          {description && (
            <p className="mx-auto mt-4 max-w-xl text-sm text-(--t-muted)">{description}</p>
          )}
        </header>
      );

    case "hero":
      return (
        <header
          className="text-white"
          style={{
            background:
              "radial-gradient(120% 90% at 100% 0%, color-mix(in oklab, var(--p) 55%, transparent), transparent 60%), linear-gradient(160deg, #0b0f19, #121a2b)",
          }}
        >
          <div className="mx-auto w-full max-w-3xl px-4 pt-8 pb-10">
            <div className="flex items-center gap-4">
              {logo("h-16 w-16 border border-white/20 text-xl")}
              <p className="text-sm text-white/75">{subtitle}</p>
            </div>
            <h1 className="t-head mt-5 text-4xl leading-[1.05] sm:text-5xl">{name}</h1>
            <RatingLink rating={rating} count={ratingCount} />
            {description && <p className="mt-4 max-w-xl text-sm text-white/85">{description}</p>}
          </div>
        </header>
      );

    case "minimal":
      return (
        <header className="mx-auto w-full max-w-3xl px-4 pt-8 pb-4 text-center">
          {logoUrl && logo("mx-auto mb-4 h-14 w-14 text-base")}
          <div className="border-y border-(--t-text) py-4">
            <h1 className="t-head text-2xl tracking-[0.18em] text-(--t-text) uppercase sm:text-3xl">{name}</h1>
            <p className="mt-1 text-xs tracking-[0.2em] text-(--t-muted) uppercase">{subtitle}</p>
          </div>
          <RatingLink rating={rating} count={ratingCount} className="text-(--t-text)" />
          {description && <p className="mx-auto mt-3 max-w-xl text-sm text-(--t-muted)">{description}</p>}
        </header>
      );

    case "split":
      return (
        <header className="border-b border-(--t-border) bg-(--t-surface)">
          <div className="h-1.5 bg-(--p)" />
          <div className="mx-auto w-full max-w-3xl px-4 py-5">
            <div className="flex items-center gap-4">
              {logo("h-16 w-16 text-xl")}
              <div className="min-w-0">
                <h1 className="t-head text-2xl leading-tight text-(--t-text)">{name}</h1>
                <p className="mt-0.5 text-sm text-(--t-muted)">{subtitle}</p>
                <RatingLink rating={rating} count={ratingCount} className="text-(--t-text)" />
              </div>
            </div>
            {description && <p className="mt-3 text-sm text-(--t-muted)">{description}</p>}
          </div>
        </header>
      );

    case "banner":
    default:
      return (
        <header
          className={cx(
            "relative",
            // Workshop: a black signboard with the colour on the name and the stripe.
            theme.decor === "hazard" ? "bg-[#1c1917] text-white [&_h1]:text-(--p)" : "bg-(--p) text-(--pt)",
          )}
        >
          {theme.decor === "confetti" && (
            <div className="t-confetti pointer-events-none absolute inset-0 opacity-40" aria-hidden="true" />
          )}
          <div className="relative mx-auto w-full max-w-3xl px-4 pt-6 pb-7">
            <div className="flex items-center gap-4">
              {logo("h-20 w-20 border-2 border-white/70 text-2xl shadow")}
              <div className="min-w-0">
                <h1 className="t-head text-2xl leading-tight sm:text-3xl">{name}</h1>
                <p className="mt-0.5 text-sm opacity-90">{subtitle}</p>
                <RatingLink rating={rating} count={ratingCount} />
              </div>
            </div>
            {description && <p className="mt-4 text-sm opacity-95">{description}</p>}
          </div>
          {theme.decor === "hazard" && <div className="t-hazard" aria-hidden="true" />}
        </header>
      );
  }
}
