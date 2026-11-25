import Link from "next/link";
import { PushToggle } from "@/components/PushToggle";
import QRCode from "qrcode";
import { count, eq } from "drizzle-orm";
import { db } from "@/db";
import { orders } from "@/db/schema";
import { CopyButton } from "@/components/CopyButton";
import { SendToNumberButton } from "@/components/SendToNumberButton";
import { ratingOf } from "@/components/Stars";
import { requireShop } from "@/lib/auth";
import { isPaid, MAX_SHOP_PHOTOS, MIN_ITEMS_TO_LIST, planOf } from "@/lib/catalog-config";
import { formatDate, SITE_NAME, siteUrl, waShareLink } from "@/lib/utils";
import { Icon } from "@/components/Icon";
import { Alert } from "@/components/ui/alert";
import { Card } from "@/components/ui/card";
import { buttonVariants } from "@/components/ui/button";
import { visitingCardPath } from "@/lib/visiting-card";
import { InviteCard } from "./InviteCard";
import { VisitingCard } from "./VisitingCard";

export default async function DashboardHome({ searchParams }: PageProps<"/dashboard">) {
  const { shop } = await requireShop();
  const { welcome } = await searchParams;

  const shopUrl = `${siteUrl()}/${shop.slug}`;
  const shareText = `See the catalog of ${shop.name} and order on WhatsApp:\n${shopUrl}`;
  const reviewUrl = `${shopUrl}/review?t=${shop.reviewToken}`;

  const [[{ orderCount }], qrSvg, qrPng] = await Promise.all([
    db.select({ orderCount: count() }).from(orders).where(eq(orders.shopId, shop.id)),
    QRCode.toString(shopUrl, { type: "svg", margin: 1, errorCorrectionLevel: "M" }),
    QRCode.toDataURL(shopUrl, { width: 1024, margin: 2, errorCorrectionLevel: "M" }),
  ]);

  const paid = isPaid(shop);
  const hasItems = shop.itemCount >= MIN_ITEMS_TO_LIST;
  const hasPhoto = Boolean(shop.logoUrl) || shop.photoCount > 0;
  const listed = hasItems && hasPhoto && !shop.isHidden;

  const steps = [
    {
      done: hasItems,
      text: `Add at least ${MIN_ITEMS_TO_LIST} items (${Math.min(shop.itemCount, MIN_ITEMS_TO_LIST)}/${MIN_ITEMS_TO_LIST})`,
      href: "/dashboard/items",
    },
    { done: hasPhoto, text: "Add your logo or one item photo", href: "/dashboard/shop" },
  ];

  // What customers look for before they trust a new shop and walk in.
  const trust = [
    {
      done: Boolean(shop.ownerPhotoUrl),
      text: "Add your own photo, so customers know who they are dealing with",
      href: "/dashboard/shop",
    },
    {
      done: shop.shopPhotoUrls.length > 0,
      text: `Add photos of your business, so customers know they reached the right place (${shop.shopPhotoUrls.length}/${MAX_SHOP_PHOTOS})`,
      href: "/dashboard/shop",
    },
    {
      done: shop.lat != null || Boolean(shop.mapsUrl),
      text: "Add your map location, so customers get directions in Google Maps",
      href: "/dashboard/shop",
    },
    {
      done: Boolean(shop.address),
      text: "Add your business address",
      href: "/dashboard/shop",
    },
  ];
  const trustLeft = trust.filter((s) => !s.done).length;

  return (
    <div className="space-y-5">
      {welcome && (
        <Alert variant="success">
          Your catalog is created{paid ? " and you got the launch offer: all paid features free" : ""}
          . Now add your items.
        </Alert>
      )}

      {shop.isHidden && (
        <Alert variant="destructive">
          Your catalog is hidden by the {SITE_NAME} team and customers cannot open it. Contact support
          from the Plan page.
        </Alert>
      )}

      <PushToggle />

      <Card className="p-5">
        <h1 className="text-xl font-bold text-slate-900">{shop.name}</h1>
        <p className="mt-3 text-sm text-slate-500">Your catalog link</p>
        <a
          href={shopUrl}
          target="_blank"
          className="font-semibold break-all text-brand hover:underline"
        >
          {shopUrl.replace(/^https?:\/\//, "")}
        </a>
        <div className="mt-3 flex flex-wrap gap-2">
          <CopyButton text={shopUrl} />
          <a
            href={waShareLink(shareText)}
            target="_blank"
            rel="noopener noreferrer"
            className={buttonVariants({ variant: "whatsapp" })}
          >
            Share on WhatsApp
          </a>
          <SendToNumberButton
            text={shareText}
          />
        </div>
      </Card>

      {/* The card is served from the public shop page, so a hidden shop has none. */}
      {!shop.isHidden && (
        <VisitingCard
          src={visitingCardPath(shop)}
          downloadSrc={visitingCardPath(shop, { download: true })}
          fileName={`${shop.slug}-visiting-card.png`}
          shareText={shareText}
        />
      )}

      <section className="grid grid-cols-3 gap-3">
        {[
          {
            label: "Items",
            value: planOf(shop).items === null ? String(shop.itemCount) : `${shop.itemCount}/${planOf(shop).items}`,
            href: "/dashboard/items",
          },
          { label: "Orders", value: String(orderCount), href: "/dashboard/orders" },
          {
            label: "Rating",
            value: shop.ratingCount ? `${ratingOf(shop).toFixed(1)} / 5` : "-",
            href: "/dashboard/reviews",
          },
        ].map((stat) => (
          <Link key={stat.label} href={stat.href} className="rounded-xl border bg-card p-4 hover:border-slate-300">
            <p className="text-2xl font-bold text-slate-900">{stat.value}</p>
            <p className="text-sm text-slate-500">{stat.label}</p>
          </Link>
        ))}
      </section>

      <Card className="p-5">
        <h2 className="font-bold text-slate-900">
          {listed ? "Your business is on the home page" : "Get listed on the home page"}
        </h2>
        <p className="mt-1 text-sm text-slate-600">
          {listed
            ? `People searching for businesses in ${shop.city} can find you.`
            : "Your link already works. Finish these steps to also appear in the city listing."}
        </p>
        <Steps steps={steps} />
      </Card>

      {/* Hidden once everything is filled in. */}
      {trustLeft > 0 && (
        <Card className="p-5">
          <h2 className="font-bold text-slate-900">Help customers trust your business</h2>
          <p className="mt-1 text-sm text-slate-600">
            New customers want to see who runs the business, what it looks like and how to reach it.{" "}
            {trustLeft === 1 ? "1 thing left." : `${trustLeft} things left.`}
          </p>
          <Steps steps={trust} />
          <Link href="/dashboard/shop" className={buttonVariants({ className: "mt-4" })}>
            Fill in business details
          </Link>
        </Card>
      )}

      <div className="grid gap-5 sm:grid-cols-2">
        <Card className="p-5">
          <h2 className="font-bold text-slate-900">QR code for your counter</h2>
          <p className="mt-1 text-sm text-slate-600">
            Print it and display it. Customers scan it to open your catalog.
          </p>
          <div
            className="mx-auto mt-3 w-44"
            role="img"
            aria-label="QR code of your shop link"
            dangerouslySetInnerHTML={{ __html: qrSvg }}
          />
          <a href={qrPng} download={`${shop.slug}-qr.png`} className={buttonVariants({ variant: "outline", className: "mt-3 w-full" })}>
            Download QR code
          </a>
        </Card>

        <Card className="p-5">
          <h2 className="font-bold text-slate-900">Ask customers for a review</h2>
          <p className="mt-1 text-sm text-slate-600">
            Only people who get this link from you can write a review. Send it to happy customers.
          </p>
          <div className="mt-3 flex flex-col gap-2">
            <a
              href={waShareLink(
                `Thank you for shopping at ${shop.name}! Please rate us, it takes 30 seconds:\n${reviewUrl}`,
              )}
              target="_blank"
              rel="noopener noreferrer"
              className={buttonVariants({ variant: "whatsapp" })}
            >
              Send review link on WhatsApp
            </a>
            <CopyButton text={reviewUrl} label="Copy review link" />
          </div>
        </Card>
      </div>

      <InviteCard shop={shop} />

      {paid && shop.planExpiresAt && (
        <p className="rounded-xl bg-amber-50 px-4 py-3 text-sm text-amber-900">
          Paid plan is active until <strong>{formatDate(shop.planExpiresAt)}</strong>.{" "}
          <Link href="/dashboard/plan" className="font-semibold underline">
            See plan
          </Link>
        </p>
      )}
    </div>
  );
}

function Steps({ steps }: { steps: { done: boolean; text: string; href: string }[] }) {
  return (
    <ul className="mt-3 space-y-2">
      {steps.map((step) => (
        <li key={step.text}>
          <Link href={step.href} className="flex items-start gap-2 text-sm hover:underline">
            <span
              className={
                step.done
                  ? "mt-px flex size-5 shrink-0 items-center justify-center rounded-full bg-emerald-500 text-xs text-white"
                  : "mt-px size-5 shrink-0 rounded-full border-2 border-slate-300"
              }
            >
              {step.done ? <Icon name="check" className="h-3 w-3" /> : null}
            </span>
            <span className={step.done ? "text-slate-500 line-through" : "text-slate-800"}>{step.text}</span>
          </Link>
        </li>
      ))}
    </ul>
  );
}
