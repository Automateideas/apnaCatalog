import type { Metadata, Viewport } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { MessageCircle } from "lucide-react";
import { Avatar } from "@/components/Avatar";
import { ShopHeader } from "@/components/catalog/ShopHeader";
import { Catalog } from "@/components/catalog/Catalog";
import { ShopDistance } from "@/components/catalog/ShopDistance";
import { ShopPhotos } from "@/components/catalog/ShopPhotos";
import { ReportButton } from "@/components/ReportButton";
import { InstallHint } from "@/components/InstallHint";
import { ratingOf, Stars } from "@/components/Stars";
import { getBusinessType, isPaid } from "@/lib/catalog-config";
import { themeCss } from "@/lib/theme-style";
import { isPropertyShop } from "@/lib/property";
import { resolveTheme } from "@/lib/themes";
import { cx } from "@/lib/utils";
import { getPublicShop, getShopPage } from "@/lib/shop-data";
import { CARD_SIZE, visitingCardPath } from "@/lib/visiting-card";
import { directionsUrl, formatDate, SITE_NAME, siteUrl, waLink } from "@/lib/utils";
import { Icon } from "@/components/Icon";
import { buttonVariants } from "@/components/ui/button";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: PageProps<"/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const shop = await getPublicShop(slug);
  if (!shop) return { title: "Shop not found", robots: { index: false } };

  const type = getBusinessType(shop.businessType);
  // "Other" reads oddly in a title, so that type is left out.
  const title =
    shop.businessType === "other" ? `${shop.name}, ${shop.city}` : `${shop.name} - ${type.name} in ${shop.city}`;
  const description =
    shop.description ||
    `See the catalog and prices of ${shop.name}, ${shop.city}. Order on WhatsApp.`;
  // Link previews (WhatsApp, Facebook) show the shop's visiting card, drawn in its own theme.
  const card = visitingCardPath(shop);
  return {
    title: { absolute: title },
    description,
    alternates: { canonical: `/${shop.slug}` },
    manifest: `/${shop.slug}/manifest.webmanifest`,
    icons: {
      icon: `/${shop.slug}/icon?size=192`,
      apple: `/${shop.slug}/icon?size=180`,
    },
    appleWebApp: { capable: true, title: shop.name, statusBarStyle: "default" },
    openGraph: {
      title,
      description,
      url: `/${shop.slug}`,
      images: [{ url: card, ...CARD_SIZE, alt: `${shop.name} visiting card`, type: "image/png" }],
    },
    twitter: { card: "summary_large_image", images: [card] },
  };
}

export async function generateViewport({ params }: PageProps<"/[slug]">): Promise<Viewport> {
  const { slug } = await params;
  const shop = await getPublicShop(slug);
  if (!shop) return { themeColor: "#1b2340" };
  const { theme, accent } = resolveTheme(shop);
  // Phone status bar: dark headers keep it dark, the others use the shop colour.
  const color =
    theme.decor === "awning"
      ? accent.primary
      : theme.header === "hero"
        ? "#0b0f19"
        : theme.header === "cover"
          ? "#111111"
          : theme.header === "banner"
            ? theme.decor === "hazard" ? "#1c1917" : accent.primary
            : theme.colors.bg;
  return { themeColor: color };
}

export default async function ShopPage({ params }: PageProps<"/[slug]">) {
  const { slug } = await params;
  const data = await getShopPage(slug);
  if (!data) notFound();
  const { shop, categories: cats, items: itemRows, reviews: reviewRows } = data;

  const type = getBusinessType(shop.businessType);
  const { theme, accent } = resolveTheme(shop);
  const paid = isPaid(shop);
  const rating = ratingOf(shop);
  const directions = directionsUrl(shop);
  const callNumber = shop.phone || shop.whatsapp;

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    name: shop.name,
    url: `${siteUrl()}/${shop.slug}`,
    description: shop.description ?? undefined,
    image: [shop.logoUrl, ...shop.shopPhotoUrls].filter(Boolean),
    telephone: `+91${callNumber}`,
    address: {
      "@type": "PostalAddress",
      streetAddress: shop.address ?? undefined,
      addressLocality: shop.city,
      addressCountry: "IN",
    },
    geo:
      shop.lat != null && shop.lng != null
        ? { "@type": "GeoCoordinates", latitude: shop.lat, longitude: shop.lng }
        : undefined,
    aggregateRating:
      shop.ratingCount > 0
        ? { "@type": "AggregateRating", ratingValue: rating.toFixed(1), reviewCount: shop.ratingCount }
        : undefined,
  };

  const action = "t-btn h-11 gap-1.5 px-1 text-sm font-semibold";
  // Drawn over the header's bottom edge, so they need a solid fill and a shadow.
  const overlap = theme.header === "banner" && theme.decor !== "hazard";
  const outline = cx(action, "border-(--t-border) bg-(--t-surface) text-(--t-text) hover:bg-(--ps)", overlap && "shadow-md");

  return (
    <div className="t-page flex flex-1 flex-col">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }}
      />

      {/* Sheets and dialogs are drawn outside this wrapper, so the theme is set on the page root. */}
      <style>{`${themeCss(":root", theme, accent)}body{background:var(--t-bg)}`}</style>

      <ShopHeader
        theme={theme}
        name={shop.name}
        logoUrl={shop.logoUrl}
        subtitle={`${type.name}, ${shop.city}`}
        description={shop.description}
        rating={rating}
        ratingCount={shop.ratingCount}
        coverUrl={shop.shopPhotoUrls[0] ?? null}
      />

      <main className="mx-auto w-full max-w-5xl flex-1 px-4 pb-10">
        <div
          className={cx(
            "no-print relative z-10 grid gap-2 whitespace-nowrap",
            directions ? "grid-cols-3" : "grid-cols-2",
            // Overlap the coloured header a little, unless it ends in a decoration.
            overlap ? "-mt-5" : "mt-4",
          )}
        >
          <a
            href={waLink(shop.whatsapp, `Hi ${shop.name}, I saw your catalog on ${SITE_NAME}.`)}
            target="_blank"
            rel="noopener noreferrer"
            className={buttonVariants({ variant: "whatsapp", className: cx(action, overlap && "shadow-md") })}
          >
            <MessageCircle className="size-4" /> WhatsApp
          </a>
          <a href={`tel:+91${callNumber}`} className={buttonVariants({ variant: "outline", className: outline })}>
            <Icon name="phone" /> Call
          </a>
          {/* No map location yet: a button that goes nowhere only confuses, so it is left out. */}
          {directions && (
            <a href={directions} target="_blank" rel="noopener noreferrer" className={buttonVariants({ variant: "outline", className: outline })}>
              <Icon name="pin" /> Directions
            </a>
          )}
        </div>

        {/* Only shops with an exact map point; a pasted Maps link has no coordinates to measure from. */}
        {shop.lat != null && shop.lng != null && (
          <ShopDistance lat={shop.lat} lng={shop.lng} directions={directions} />
        )}

        <ShopPhotos name={shop.name} urls={shop.shopPhotoUrls} />

        {(shop.address || shop.ownerName || shop.ownerPhotoUrl) && (
          <div className="t-card mt-4 flex items-center gap-3 p-3">
            {(shop.ownerName || shop.ownerPhotoUrl) && (
              <Avatar
                name={shop.ownerName || shop.name}
                src={shop.ownerPhotoUrl}
                color={accent.primary}
                round
                className="h-12 w-12 text-sm"
              />
            )}
            <div className="min-w-0 text-sm">
              {shop.ownerName && (
                <p className="font-medium text-(--t-text)">
                  {shop.ownerName} <span className="font-normal text-(--t-muted)">(owner)</span>
                </p>
              )}
              {shop.address && <p className="text-(--t-muted)">{shop.address}</p>}
            </div>
          </div>
        )}

        {isPropertyShop(shop.businessType) && shop.reraNumber && (
          <p className="mt-3 flex items-center gap-1.5 text-sm text-(--t-muted)">
            <Icon name="check" className="h-4 w-4 text-(--p)" />
            RERA registration: <span className="font-semibold text-(--t-text)">{shop.reraNumber}</span>
          </p>
        )}

        <InstallHint name={shop.name} />

        <div className="mt-5">
          <Catalog
            shop={{ id: shop.id, name: shop.name, slug: shop.slug, whatsapp: shop.whatsapp }}
            mode={isPropertyShop(shop.businessType) ? "enquiry" : "cart"}
            look={{ items: theme.items, center: !!theme.center, chips: theme.chips }}
            items={itemRows}
            categories={cats}
          />
        </div>

        <section id="reviews" className="mt-10 scroll-mt-4">
          <h2 className="t-head text-xl text-(--t-text)">Customer reviews</h2>
          {reviewRows.length === 0 ? (
            <p className="mt-3 rounded-(--t-radius) border border-dashed border-(--t-border) px-4 py-6 text-center text-sm text-(--t-muted)">
              No reviews yet. Bought from {shop.name}? Ask the shop for its review link.
            </p>
          ) : (
            <>
              <div className="mt-2 flex items-center gap-2">
                <span className="text-3xl font-bold">{rating.toFixed(1)}</span>
                <div>
                  <Stars value={rating} className="text-lg" />
                  <p className="text-xs text-(--t-muted)">
                    {shop.ratingCount} {shop.ratingCount === 1 ? "review" : "reviews"}
                  </p>
                </div>
              </div>
              <ul className="mt-3 space-y-3">
                {reviewRows.map((review) => (
                  <li key={review.id} className="t-card p-4">
                    <div className="flex items-center justify-between gap-2">
                      <p className="font-medium text-(--t-text)">{review.name}</p>
                      <time className="text-xs text-(--t-muted)">{formatDate(review.updatedAt)}</time>
                    </div>
                    <Stars value={review.rating} className="mt-1 text-sm" />
                    {review.comment && (
                      <p className="mt-1.5 text-sm whitespace-pre-line text-(--t-text) opacity-90">
                        {review.comment}
                      </p>
                    )}
                  </li>
                ))}
              </ul>
            </>
          )}
        </section>

        <div className="no-print mt-10 text-center">
          <ReportButton shopId={shop.id} what="shop" />
        </div>
      </main>

      {!(paid && shop.hideBranding) && (
        <footer className="no-print border-t border-(--t-border) bg-(--t-surface) py-4 text-center text-sm text-(--t-muted)">
          Catalog made with{" "}
          <Link href="/" className="font-semibold text-(--t-text) hover:underline">
            {SITE_NAME}
          </Link>
          .{" "}
          <Link href="/login" className="underline">
            Create yours free
          </Link>
        </footer>
      )}
    </div>
  );
}
