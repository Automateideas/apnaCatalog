import Image from "next/image";
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
  /** The shop's first photo, used by the "cover" header. */
  coverUrl?: string | null;
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

/** The top of a shop page, with the theme's awning above it when it has one. */
export function ShopHeader(props: Props) {
  if (props.theme.decor !== "awning") return <HeaderBody {...props} />;
  return (
    <>
      <div className="t-awning" aria-hidden="true" />
      <HeaderBody {...props} />
    </>
  );
}

/** Each theme picks one of six designs. */
function HeaderBody({ theme, name, logoUrl, subtitle, description, rating, ratingCount, coverUrl }: Props) {
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
        <header className="w-full">
          <div className="mx-auto w-full max-w-5xl px-4 pt-8 pb-2 text-center sm:px-6">
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
          </div>
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
          <div className="mx-auto w-full max-w-5xl px-4 pt-8 pb-10 sm:px-6">
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

    case "cover":
      // The shop's own photo, darkened at the bottom so the name stays readable.
      // Without a photo, a deep wash of the shop colour stands in.
      return (
        <header className="relative isolate overflow-hidden bg-[#111] text-white">
          {coverUrl ? (
            <Image src={coverUrl} alt="" fill sizes="100vw" className="absolute inset-0 -z-10 object-cover" priority />
          ) : (
            <div
              className="absolute inset-0 -z-10"
              style={{ background: "radial-gradient(120% 120% at 100% 0%, var(--pd), #111 70%)" }}
            />
          )}
          <div className="absolute inset-0 -z-10 bg-linear-to-t from-black/85 via-black/45 to-black/10" />
          <div
            className={cx(
              "mx-auto w-full max-w-5xl px-4 pt-28 pb-7 sm:px-6 sm:pt-40",
              theme.center && "flex flex-col items-center text-center",
            )}
          >
            {logo("h-14 w-14 border border-white/50 text-lg shadow-lg")}
            <h1 className="t-head mt-3 text-4xl leading-[1.05] drop-shadow sm:text-5xl">{name}</h1>
            <p className="mt-1.5 text-sm text-white/80">{subtitle}</p>
            <RatingLink rating={rating} count={ratingCount} />
            {theme.decor === "diamond" && (
              <div className="mt-3 flex w-40 items-center gap-3 text-(--p)" aria-hidden="true">
                <span className="h-px flex-1 bg-(--p) opacity-70" />
                <span className="text-xs">◆</span>
                <span className="h-px flex-1 bg-(--p) opacity-70" />
              </div>
            )}
            {description && <p className="mt-3 max-w-xl text-sm text-white/85">{description}</p>}
          </div>
        </header>
      );

    case "minimal":
      return (
        <header className="w-full">
          <div className="mx-auto w-full max-w-5xl px-4 pt-8 pb-4 text-center sm:px-6">
          {logoUrl && logo("mx-auto mb-4 h-14 w-14 text-base")}
          <div className="border-y border-(--t-text) py-4">
            <h1 className="t-head text-2xl tracking-[0.18em] text-(--t-text) uppercase sm:text-3xl">{name}</h1>
            <p className="mt-1 text-xs tracking-[0.2em] text-(--t-muted) uppercase">{subtitle}</p>
          </div>
          <RatingLink rating={rating} count={ratingCount} className="text-(--t-text)" />
          {description && <p className="mx-auto mt-3 max-w-xl text-sm text-(--t-muted)">{description}</p>}
          </div>
        </header>
      );

    case "split":
      return (
        <header className="border-b border-(--t-border) bg-(--t-surface)">
          <div className="h-1.5 bg-(--p)" />
          <div className="mx-auto w-full max-w-5xl px-4 py-5 sm:px-6">
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
          <div className={cx("relative mx-auto w-full max-w-5xl px-4 pt-6 sm:px-6 sm:pt-8", theme.decor === "hazard" ? "pb-6" : "pb-10")}>
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
