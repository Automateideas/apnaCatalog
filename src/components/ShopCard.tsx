import Link from "next/link";
import { Avatar } from "@/components/Avatar";
import { ratingOf, Stars } from "@/components/Stars";
import { getBusinessType, PALETTES } from "@/lib/catalog-config";
import { Badge } from "@/components/ui/badge";

export type ShopCardData = {
  slug: string;
  name: string;
  businessType: string;
  city: string;
  description: string | null;
  logoUrl: string | null;
  palette: string;
  itemCount: number;
  ratingSum: number;
  ratingCount: number;
  featured: boolean;
};

export function ShopCard({ shop }: { shop: ShopCardData }) {
  const type = getBusinessType(shop.businessType);
  const color = (PALETTES[shop.palette] ?? PALETTES.saffron).primary;
  return (
    <Link
      href={`/${shop.slug}`}
      className="rounded-xl border bg-card group relative flex min-w-0 gap-3 p-4 hover:border-slate-400"
    >
      {shop.featured && (
        <Badge className="absolute top-3 right-3 bg-amber-100 text-amber-800">Featured</Badge>
      )}
      <Avatar name={shop.name} src={shop.logoUrl} color={color} className="h-16 w-16 text-xl" />
      <div className="min-w-0 flex-1">
        <h3 className="truncate pr-16 font-semibold text-slate-900 group-hover:text-brand">
          {shop.name}
        </h3>
        <p className="mt-0.5 truncate text-sm text-slate-600">
          {type.name}, {shop.city}
        </p>
        <div className="mt-1.5 flex items-center gap-2 text-sm">
          {shop.ratingCount > 0 ? (
            <>
              <Stars value={ratingOf(shop)} />
              <span className="font-medium text-slate-800">{ratingOf(shop).toFixed(1)}</span>
              <span className="text-slate-500">({shop.ratingCount})</span>
            </>
          ) : (
            <span className="text-slate-500">New shop</span>
          )}
          <span className="ml-auto text-slate-500">{shop.itemCount} items</span>
        </div>
      </div>
    </Link>
  );
}
