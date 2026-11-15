import { cx } from "@/lib/utils";

/** Read-only star rating. `value` may be fractional. */
export function Stars({ value, className }: { value: number; className?: string }) {
  const rounded = Math.round(value * 2) / 2;
  return (
    <span
      className={cx("inline-flex items-center gap-0.5 text-amber-500", className)}
      role="img"
      aria-label={`${value.toFixed(1)} out of 5 stars`}
    >
      {[1, 2, 3, 4, 5].map((n) => (
        <svg key={n} viewBox="0 0 20 20" className="h-[1em] w-[1em]" aria-hidden="true">
          <defs>
            <linearGradient id={`half-${n}`}>
              <stop offset="50%" stopColor="currentColor" />
              <stop offset="50%" stopColor="#e2e8f0" />
            </linearGradient>
          </defs>
          <path
            fill={rounded >= n ? "currentColor" : rounded >= n - 0.5 ? `url(#half-${n})` : "#e2e8f0"}
            d="M10 1.5l2.6 5.3 5.9.9-4.3 4.1 1 5.8L10 14.9l-5.2 2.7 1-5.8L1.5 7.7l5.9-.9z"
          />
        </svg>
      ))}
    </span>
  );
}

export function ratingOf(shop: { ratingSum: number; ratingCount: number }): number {
  return shop.ratingCount > 0 ? shop.ratingSum / shop.ratingCount : 0;
}
