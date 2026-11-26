import type { Metadata, Viewport } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { MessageCircle } from "lucide-react";
import { Avatar } from "@/components/Avatar";
import { ShopHeader } from "@/components/catalog/ShopHeader";
import { ShopToolbar } from "@/components/catalog/ShopToolbar";
import { Catalog } from "@/components/catalog/Catalog";
import { ShopDistance } from "@/components/catalog/ShopDistance";
import { ShopPhotos } from "@/components/catalog/ShopPhotos";
import { ReportButton } from "@/components/ReportButton";
import { InstallHint } from "@/components/InstallHint";
import { ratingOf, Stars } from "@/components/Stars";
import { getBusinessType, isPaid } from "@/lib/catalog-config";
import { isOpenNow, weeklySchedule } from "@/lib/business-hours";
import { themeCss } from "@/lib/theme-style";
import { isPropertyShop } from "@/lib/property";
import { resolveTheme } from "@/lib/themes";
import { cx } from "@/lib/utils";
import { getPublicShop, getShopPage } from "@/lib/shop-data";
import { CARD_SIZE, visitingCardPath } from "@/lib/visiting-card";
import {
  directionsUrl,
  formatDate,
  SITE_NAME,
  siteUrl,
  waLink,
} from "@/lib/utils";
import { Icon } from "@/components/Icon";
import { PageViewTracker } from "@/components/PageViewTracker";
import { buttonVariants } from "@/components/ui/button";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: PageProps<"/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const shop = await getPublicShop(slug);
  if (!shop) return { title: "Shop not found", robots: { index: false } };

  const type = getBusinessType(shop.businessType);
  // "Other" reads oddly in a title, so that type is left out.
  const title =
    shop.businessType === "other"
      ? `${shop.name}, ${shop.city}`
      : `${shop.name} - ${type.name} in ${shop.city}`;
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
      images: [
        {
          url: card,
          ...CARD_SIZE,
          alt: `${shop.name} visiting card`,
          type: "image/png",
        },
      ],
    },
    twitter: { card: "summary_large_image", images: [card] },
  };
}

export async function generateViewport({
  params,
}: PageProps<"/[slug]">): Promise<Viewport> {
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
            ? theme.decor === "hazard"
              ? "#1c1917"
              : accent.primary
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

  // eslint-disable-next-line react-hooks/purity
  const now = Date.now();

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
        ? {
            "@type": "AggregateRating",
            ratingValue: rating.toFixed(1),
            reviewCount: shop.ratingCount,
          }
        : undefined,
  };

  const action = "t-btn h-11 gap-1.5 px-1 text-sm font-semibold";
  // Drawn over the header's bottom edge, so they need a solid fill and a shadow.
  const overlap = theme.header === "banner" && theme.decor !== "hazard";
  const outline = cx(
    action,
    "border-(--t-border) bg-(--t-surface) text-(--t-text) hover:bg-(--ps)",
    overlap && "shadow-md",
  );

  return (
    <div className="t-page flex flex-1 flex-col">
      <ShopToolbar />
      <PageViewTracker shopId={shop.id} path={`/${slug}`} />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c"),
        }}
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

      <main className="mx-auto w-full max-w-5xl flex-1 px-4 pb-10 sm:px-6">
        <div
          className={cx(
            "no-print relative z-10 flex flex-wrap gap-2 whitespace-nowrap",
            overlap ? "-mt-5" : "mt-4",
          )}
        >
          <a
            href={waLink(
              shop.whatsapp,
              `Hi ${shop.name}, I saw your catalog on ${SITE_NAME}.`,
            )}
            target="_blank"
            rel="noopener noreferrer"
            className={buttonVariants({
              variant: "whatsapp",
              className: cx(action, overlap && "shadow-md"),
            })}
          >
            <MessageCircle className="size-4" /> WhatsApp
          </a>
          <a
            href={`tel:+91${callNumber}`}
            className={buttonVariants({
              variant: "outline",
              className: outline,
            })}
          >
            <Icon name="phone" /> Call
          </a>
          {directions && (
            <a
              href={directions}
              target="_blank"
              rel="noopener noreferrer"
              className={buttonVariants({
                variant: "outline",
                className: outline,
              })}
            >
              <Icon name="pin" /> Directions
            </a>
          )}
        </div>

        {(shop.instagram ||
          shop.facebook ||
          shop.youtube ||
          shop.businessHours) && (
          <div className="mt-3 space-y-2">
            <div className="flex flex-wrap items-center gap-3 text-sm">
              {shop.businessHours &&
                (() => {
                  const status = isOpenNow(shop.businessHours);
                  return (
                    <details className="group">
                      <summary
                        className={cx(
                          "inline-flex cursor-pointer list-none items-center gap-1.5 rounded-full px-2.5 py-1 font-medium select-none",
                          status.open
                            ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400"
                            : "bg-red-50 text-red-600 dark:bg-red-950/40 dark:text-red-400",
                        )}
                      >
                        <span
                          className={cx(
                            "size-1.5 rounded-full",
                            status.open ? "bg-emerald-500" : "bg-red-500",
                          )}
                        />
                        {status.label}
                        <svg className="size-3 opacity-60 transition-transform group-open:rotate-180" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M6 9l6 6 6-6" /></svg>
                      </summary>
                      <div className="t-card mt-2 w-56 overflow-hidden p-0">
                        {weeklySchedule(shop.businessHours).map((row) => (
                          <div
                            key={row.day}
                            className={cx(
                              "flex items-center justify-between px-3 py-1.5 text-xs",
                              row.isToday
                                ? "bg-(--ps) font-semibold text-(--pa)"
                                : "text-(--t-muted)",
                            )}
                          >
                            <span>{row.day}</span>
                            <span className={row.hours === "Closed" ? "opacity-50" : ""}>{row.hours}</span>
                          </div>
                        ))}
                      </div>
                    </details>
                  );
                })()}
              {shop.instagram && (
                <a
                  href={shop.instagram}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-(--t-muted) hover:text-(--t-text)"
                  aria-label="Instagram"
                >
                  <svg className="size-5" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" />
                  </svg>
                </a>
              )}
              {shop.facebook && (
                <a
                  href={shop.facebook}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-(--t-muted) hover:text-(--t-text)"
                  aria-label="Facebook"
                >
                  <svg className="size-5" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                  </svg>
                </a>
              )}
              {shop.youtube && (
                <a
                  href={shop.youtube}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-(--t-muted) hover:text-(--t-text)"
                  aria-label="YouTube"
                >
                  <svg className="size-5" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M23.498 6.186a3.016 3.016 0 00-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 00.502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 002.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 002.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
                  </svg>
                </a>
              )}
            </div>
          </div>
        )}

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
                  {shop.ownerName}{" "}
                  <span className="font-normal text-(--t-muted)">(owner)</span>
                </p>
              )}
              {shop.address && (
                <p className="text-(--t-muted)">{shop.address}</p>
              )}
            </div>
          </div>
        )}

        {isPropertyShop(shop.businessType) && shop.reraNumber && (
          <p className="mt-3 flex items-center gap-1.5 text-sm text-(--t-muted)">
            <Icon name="check" className="h-4 w-4 text-(--p)" />
            RERA registration:{" "}
            <span className="font-semibold text-(--t-text)">
              {shop.reraNumber}
            </span>
          </p>
        )}

        <InstallHint name={shop.name} />

        {shop.announcementActive && shop.announcement && (
          <div className="mt-4 rounded-(--t-radius) bg-(--ps) px-4 py-3 text-center text-sm font-medium text-(--pa)">
            {shop.announcement}
          </div>
        )}

        <div className="mt-5">
          <Catalog
            shop={{
              id: shop.id,
              name: shop.name,
              slug: shop.slug,
              whatsapp: shop.whatsapp,
            }}
            mode={isPropertyShop(shop.businessType) ? "enquiry" : "cart"}
            look={{
              items: theme.items,
              center: !!theme.center,
              chips: theme.chips,
            }}
            items={itemRows}
            categories={cats}
            serverNow={now}
          />
        </div>

        <section id="reviews" className="mt-10 scroll-mt-4">
          <h2 className="t-head text-xl text-(--t-text)">Customer reviews</h2>
          {reviewRows.length === 0 ? (
            <p className="mt-3 rounded-(--t-radius) border border-dashed border-(--t-border) px-4 py-6 text-center text-sm text-(--t-muted)">
              No reviews yet. Bought from {shop.name}? Ask the shop for its
              review link.
            </p>
          ) : (
            <>
              <div className="mt-2 flex items-center gap-2">
                <span className="text-3xl font-bold">{rating.toFixed(1)}</span>
                <div>
                  <Stars value={rating} className="text-lg" />
                  <p className="text-xs text-(--t-muted)">
                    {shop.ratingCount}{" "}
                    {shop.ratingCount === 1 ? "review" : "reviews"}
                  </p>
                </div>
              </div>
              <ul className="mt-3 space-y-3">
                {reviewRows.map((review) => (
                  <li key={review.id} className="t-card p-4">
                    <div className="flex items-center justify-between gap-2">
                      <p className="font-medium text-(--t-text)">
                        {review.name}
                      </p>
                      <time className="text-xs text-(--t-muted)">
                        {formatDate(review.updatedAt)}
                      </time>
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
          <Link
            href="/"
            className="font-semibold text-(--t-text) hover:underline"
          >
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
