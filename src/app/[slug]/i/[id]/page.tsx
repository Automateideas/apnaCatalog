import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { cache } from "react";
import { ArrowLeft, MessageCircle, Share2 } from "lucide-react";
import { and, eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/db";
import { items } from "@/db/schema";
import { ItemCarousel } from "@/components/catalog/ItemCarousel";
import { ReportButton } from "@/components/ReportButton";
import { buttonVariants } from "@/components/ui/button";
import { getBusinessType } from "@/lib/catalog-config";
import { formatPriceRange, itemPriceSpan } from "@/lib/item-options";
import { isPropertyShop, listingPrice, unavailableLabel } from "@/lib/property";
import { getPublicShop } from "@/lib/shop-data";
import { themeCss } from "@/lib/theme-style";
import { resolveTheme } from "@/lib/themes";
import { cx, siteUrl, waLink, waShareLink } from "@/lib/utils";

export const dynamic = "force-dynamic";

type Params = { params: Promise<{ slug: string; id: string }> };

/** One item of a shop, with its shop. Null when either is missing or hidden. */
const load = cache(async (slug: string, id: string) => {
  if (!z.uuid().safeParse(id).success) return null;
  const shop = await getPublicShop(slug);
  if (!shop) return null;
  const [item] = await db
    .select()
    .from(items)
    .where(and(eq(items.id, id), eq(items.shopId, shop.id)))
    .limit(1);
  return item ? { shop, item } : null;
});

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { slug, id } = await params;
  const found = await load(slug, id);
  if (!found) return { title: "Not found", robots: { index: false } };
  const { shop, item } = found;
  const property = isPropertyShop(shop.businessType);
  const where = item.details.find((d) => d.label === "Locality")?.value ?? shop.city;
  const what = property ? `${item.name} ${item.listing === "rent" ? "for rent" : "for sale"} in ${where}` : item.name;
  const title = `${what} | ${shop.name}`;
  const facts = item.details.map((d) => `${d.label}: ${d.value}`).join(", ");
  const description = [property ? listingPrice(item) : null, facts, item.description].filter(Boolean).join(". ").slice(0, 300);
  const url = `/${shop.slug}/i/${item.id}`;
  return {
    title: { absolute: title },
    description: description || `${item.name} at ${shop.name}, ${shop.city}.`,
    alternates: { canonical: url },
    openGraph: { title, url, images: item.imageUrls[0] ? [{ url: item.imageUrls[0], alt: item.name }] : undefined },
    twitter: { card: item.imageUrls[0] ? "summary_large_image" : "summary" },
  };
}

export default async function ItemPage({ params }: Params) {
  const { slug, id } = await params;
  const found = await load(slug, id);
  if (!found) notFound();
  const { shop, item } = found;
  const { theme, accent } = resolveTheme(shop);
  const property = isPropertyShop(shop.businessType);
  const url = `${siteUrl()}/${shop.slug}/i/${item.id}`;
  const span = itemPriceSpan(item);
  const price = property ? listingPrice(item) : formatPriceRange(span.min, span.max);

  return (
    <div className="t-page flex flex-1 flex-col">
      <style>{`${themeCss(":root", theme, accent)}body{background:var(--t-bg)}`}</style>

      <main className="mx-auto w-full max-w-xl flex-1 px-4 py-4">
        <Link href={`/${shop.slug}`} className="inline-flex items-center gap-1.5 text-sm font-medium text-(--t-muted) hover:text-(--t-text)">
          <ArrowLeft className="size-4" /> {shop.name}
        </Link>

        {item.imageUrls.length > 0 && (
          <div className="t-photo mt-3 aspect-4/3 w-full overflow-hidden bg-(--ps)">
            <ItemCarousel urls={item.imageUrls} name={item.name} />
          </div>
        )}

        <div className="mt-4 space-y-3">
          {property && item.listing && (
            <span className="inline-block rounded-full bg-(--ps) px-2.5 py-0.5 text-xs font-semibold text-(--pa)">
              {item.listing === "rent" ? "For rent" : "For sale"}
            </span>
          )}
          <h1 className="t-head text-2xl text-(--t-text)">{item.name}</h1>
          <p className="text-xl font-bold text-(--t-text)">
            {price}
            {!property && item.unit && <span className="ml-1.5 text-sm font-normal text-(--t-muted)">/ {item.unit}</span>}
          </p>

          {item.details.length > 0 && (
            <dl className="t-card grid grid-cols-2 gap-x-4 gap-y-3 p-4 text-sm">
              {item.details.map((d) => (
                <div key={d.label}>
                  <dt className="text-xs text-(--t-muted)">{d.label}</dt>
                  <dd className="font-medium text-(--t-text)">{d.value}</dd>
                </div>
              ))}
            </dl>
          )}

          {item.options.length > 0 && (
            <ul className="t-card divide-y divide-(--t-border) text-sm">
              {item.options.map((o) => (
                <li key={o.id} className="flex justify-between px-4 py-2.5">
                  <span className="text-(--t-text)">{o.name}</span>
                  <span className="font-semibold text-(--t-text)">{formatPriceRange(o.price, o.maxPrice)}</span>
                </li>
              ))}
            </ul>
          )}

          {item.description && <p className="whitespace-pre-line text-(--t-text) opacity-90">{item.description}</p>}

          {!item.inStock && (
            <p className="font-semibold text-(--t-muted)">{property ? unavailableLabel(item.listing) : "Out of stock"}</p>
          )}

          <div className="grid gap-2 pt-2">
            {property ? (
              item.inStock && (
                <a
                  href={waLink(shop.whatsapp, `Hi ${shop.name}, I am interested in: ${item.name} (${price}).\n${url}`)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={buttonVariants({ variant: "whatsapp", className: "h-12 text-base" })}
                >
                  <MessageCircle className="size-5" /> Enquire on WhatsApp
                </a>
              )
            ) : (
              <Link href={`/${shop.slug}`} className={buttonVariants({ className: "t-btn h-12 bg-(--p) text-base text-(--pt) hover:bg-(--pd)" })}>
                Order from {shop.name}
              </Link>
            )}
            <a
              href={waShareLink(`${item.name} (${price}) at ${shop.name}:\n${url}`)}
              target="_blank"
              rel="noopener noreferrer"
              className={cx(buttonVariants({ variant: "outline", className: "t-btn h-11" }), "border-(--t-border)")}
            >
              <Share2 className="size-4" /> Share
            </a>
          </div>

          <p className="pt-2 text-center text-xs text-(--t-muted)">
            {getBusinessType(shop.businessType).name}, {shop.city}
          </p>
          <div className="text-center">
            <ReportButton shopId={shop.id} itemId={item.id} what="item" />
          </div>
        </div>
      </main>
    </div>
  );
}
