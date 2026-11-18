import Link from "next/link";
import { Avatar } from "@/components/Avatar";
import { ratingOf, Stars } from "@/components/Stars";
import { effectiveTheme, getBusinessType } from "@/lib/catalog-config";
import { cx } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

export type ShopCardData = {
  slug: string;
  name: string;
  businessType: string;
  city: string;
  description: string | null;
  logoUrl: string | null;
  /** The first photo of the shop itself, for the grid view. */
  coverUrl: string | null;
  palette: string;
  theme: string | null;
  itemCount: number;
  ratingSum: number;
  ratingCount: number;
  featured: boolean;
};

/** How the home page lists shops: list (default), grid with the shop photo, or compact without photos. */
export type ShopView = "list" | "grid" | "compact";

function Rating({ shop, small }: { shop: ShopCardData; small?: boolean }) {
  return shop.ratingCount > 0 ? (
    <>
      {!small && <Stars value={ratingOf(shop)} />}
      <span className="font-medium text-slate-800">{small ? "★ " : ""}{ratingOf(shop).toFixed(1)}</span>
      <span className="text-slate-500">({shop.ratingCount})</span>
    </>
  ) : (
    <span className="text-slate-500">New shop</span>
  );
}

export function ShopCard({
  shop,
  distance,
  view = "list",
}: {
  shop: ShopCardData;
  distance?: React.ReactNode;
  view?: ShopView;
}) {
  const type = getBusinessType(shop.businessType);
  const color = effectiveTheme(shop).palette.primary;
  const featured = shop.featured && (
    <Badge className={cx("absolute bg-amber-100 text-amber-800", view === "grid" ? "top-2 right-2" : "top-3 right-3")}>
      Featured
    </Badge>
  );
  const distanceLine = distance && (
    <p className="mt-0.5 flex items-center gap-1 text-sm font-medium text-emerald-700">{distance}</p>
  );

  // Grid: the shop's own photo on top, its logo overlapping the edge.
  if (view === "grid") {
    return (
      <Link
        href={`/${shop.slug}`}
        className="group relative flex min-w-0 flex-col overflow-hidden rounded-xl border bg-card hover:border-slate-400"
      >
        <div className="aspect-4/3 w-full" style={{ background: color }}>
          {shop.coverUrl && <img src={shop.coverUrl} alt="" loading="lazy" className="h-full w-full object-cover" />}
        </div>
        {featured}
        <div className="relative px-3 pt-8 pb-3">
          <Avatar
            name={shop.name}
            src={shop.logoUrl}
            color={color}
            className="absolute -top-7 left-3 h-14 w-14 text-lg ring-3 ring-white"
          />
          <h3 className="truncate font-semibold text-slate-900 group-hover:text-brand">{shop.name}</h3>
          <p className="truncate text-sm text-slate-600">
            {type.name}, {shop.city}
          </p>
          {distanceLine}
          <div className="mt-1 flex items-center gap-1.5 text-sm">
            <Rating shop={shop} small />
          </div>
        </div>
      </Link>
    );
  }

  // Compact: no photos, so many shops fit on one screen.
  if (view === "compact") {
    return (
      <Link
        href={`/${shop.slug}`}
        className="group relative block min-w-0 rounded-lg border bg-card px-3 py-2.5 hover:border-slate-400"
      >
        <h3 className="truncate text-sm font-semibold text-slate-900 group-hover:text-brand">{shop.name}</h3>
        <p className="truncate text-xs text-slate-600">
          {type.emoji} {type.name}
        </p>
        <div className="mt-1 flex items-center gap-1 text-xs">
          <Rating shop={shop} small />
        </div>
        {distance && <p className="mt-0.5 flex items-center gap-1 text-xs font-medium text-emerald-700">{distance}</p>}
      </Link>
    );
  }

  return (
    <Link
      href={`/${shop.slug}`}
      className="rounded-xl border bg-card group relative flex min-w-0 gap-3 p-4 hover:border-slate-400"
    >
      {featured}
      <Avatar name={shop.name} src={shop.logoUrl} color={color} className="h-16 w-16 text-xl" />
      <div className="min-w-0 flex-1">
        <h3 className="truncate pr-16 font-semibold text-slate-900 group-hover:text-brand">{shop.name}</h3>
        <p className="mt-0.5 truncate text-sm text-slate-600">
          {type.name}, {shop.city}
        </p>
        {distanceLine}
        <div className="mt-1.5 flex items-center gap-2 text-sm">
          <Rating shop={shop} />
          <span className="ml-auto text-slate-500">{shop.itemCount} items</span>
        </div>
      </div>
    </Link>
  );
}
