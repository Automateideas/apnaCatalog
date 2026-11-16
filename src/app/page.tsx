import Link from "next/link";
import { and, desc, eq, ilike, or, sql } from "drizzle-orm";
import { db, isDbConfigured } from "@/db";
import { shops } from "@/db/schema";
import { IconBadge } from "@/components/Icon";
import { ShopCard, type ShopCardData } from "@/components/ShopCard";
import { SiteFooter, SiteHeader } from "@/components/SiteChrome";
import { getUser } from "@/lib/auth";
import { BUSINESS_TYPES, FREE_ITEM_LIMIT, getBusinessType } from "@/lib/catalog-config";
import { listedShop, paidNow } from "@/lib/shop-stats";
import { citySlugOf, cx } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { NativeSelect } from "@/components/ui/native-select";
import { Button, buttonVariants } from "@/components/ui/button";
import { Alert } from "@/components/ui/alert";
import { Card } from "@/components/ui/card";

export const dynamic = "force-dynamic";

const PAGE_SIZE = 24;

type City = { city: string; citySlug: string; total: number };

async function loadShops(filters: { city: string; type: string; q: string; page: number }) {
  const q = filters.q.replace(/[\\%_]/g, "\\$&");
  const where = and(
    listedShop,
    filters.city ? eq(shops.citySlug, filters.city) : undefined,
    filters.type ? eq(shops.businessType, filters.type) : undefined,
    q ? or(ilike(shops.name, `%${q}%`), ilike(shops.description, `%${q}%`)) : undefined,
  );

  const [rows, cities] = await Promise.all([
    db
      .select({
        slug: shops.slug,
        name: shops.name,
        businessType: shops.businessType,
        city: shops.city,
        description: shops.description,
        logoUrl: shops.logoUrl,
        palette: shops.palette,
        itemCount: shops.itemCount,
        ratingSum: shops.ratingSum,
        ratingCount: shops.ratingCount,
        featured: paidNow,
      })
      .from(shops)
      .where(where)
      .orderBy(desc(paidNow), desc(shops.ratingCount), desc(shops.createdAt))
      .limit(PAGE_SIZE + 1)
      .offset((filters.page - 1) * PAGE_SIZE),
    db
      .select({
        city: sql<string>`min(${shops.city})`,
        citySlug: shops.citySlug,
        total: sql<number>`count(*)::int`,
      })
      .from(shops)
      .where(listedShop)
      .groupBy(shops.citySlug)
      .orderBy(desc(sql`count(*)`), shops.citySlug)
      .limit(200),
  ]);

  return {
    shops: rows.slice(0, PAGE_SIZE) as ShopCardData[],
    hasMore: rows.length > PAGE_SIZE,
    cities: cities as City[],
  };
}

function first(value: string | string[] | undefined): string {
  return (Array.isArray(value) ? value[0] : value)?.trim() ?? "";
}

export default async function HomePage({ searchParams }: PageProps<"/">) {
  const params = await searchParams;
  const filters = {
    city: citySlugOf(first(params.city)),
    type: BUSINESS_TYPES.some((t) => t.id === first(params.type)) ? first(params.type) : "",
    q: first(params.q).slice(0, 60),
    page: Math.min(Math.max(Number.parseInt(first(params.page) || "1", 10) || 1, 1), 500),
  };

  // Start the login check now; it runs while the shops load.
  const userPromise = getUser();

  let data: Awaited<ReturnType<typeof loadShops>> | null = null;
  let problem: string | null = null;
  if (!isDbConfigured()) {
    problem = "The database is not connected yet. Add DATABASE_URL to .env.local (see README).";
  } else {
    try {
      data = await loadShops(filters);
    } catch (error) {
      console.error("Home page could not load shops", error);
      problem = "Shops could not be loaded right now. Please try again in a minute.";
    }
  }

  const user = await userPromise;

  const link = (changes: Partial<typeof filters>) => {
    const next = { ...filters, page: 1, ...changes };
    const qs = new URLSearchParams();
    if (next.city) qs.set("city", next.city);
    if (next.type) qs.set("type", next.type);
    if (next.q) qs.set("q", next.q);
    if (next.page > 1) qs.set("page", String(next.page));
    const s = qs.toString();
    return s ? `/?${s}` : "/";
  };

  const cityName = data?.cities.find((c) => c.citySlug === filters.city)?.city;
  const filtered = Boolean(filters.city || filters.type || filters.q);
  const heading = filters.type
    ? `${getBusinessType(filters.type).name} shops${cityName ? ` in ${cityName}` : ""}`
    : cityName
      ? `Shops in ${cityName}`
      : "Shops near you";

  return (
    <>
      <SiteHeader signedIn={Boolean(user)} />

      <section className="bg-brand text-white">
        <div className="mx-auto grid w-full max-w-6xl items-center gap-10 px-4 py-10 sm:py-14 lg:grid-cols-[1.15fr_0.85fr]">
          <div>
          <h1 className="max-w-xl text-4xl font-extrabold sm:text-5xl">
            Your city&apos;s shops, with prices, on your phone.
          </h1>
          <p className="mt-3 max-w-lg text-lg text-white/80">
            Open a shop&apos;s catalog, pick what you need, and send the order to the shopkeeper on
            WhatsApp.
          </p>

          <form action="/" className="mt-6 flex max-w-xl flex-col gap-2 sm:flex-row">
            {filters.type && <input type="hidden" name="type" value={filters.type} />}
            <Input
              name="q"
              defaultValue={filters.q}
              placeholder="Search a shop by name"
              aria-label="Search a shop by name"
              className="sm:flex-1"
              maxLength={60}
            />
            <NativeSelect
              name="city"
              defaultValue={filters.city}
              aria-label="City"
              className="sm:w-48"
            >
              <option value="">All cities</option>
              {data?.cities.map((c) => (
                <option key={c.citySlug} value={c.citySlug}>
                  {c.city} ({c.total})
                </option>
              ))}
            </NativeSelect>
            <Button variant="tag" type="submit">
              Search
            </Button>
          </form>
          </div>

          {/* What the product does, shown as the thing itself: an order arriving on WhatsApp. */}
          <div aria-hidden="true" className="relative mx-auto hidden w-full max-w-sm lg:block">
            <div className="-rotate-2 rounded-2xl rounded-tl-sm bg-white p-5 text-slate-800 shadow-xl">
              <p className="text-sm text-slate-500">New order on WhatsApp</p>
              <ul className="mt-3 space-y-1.5">
                {[
                  ["Photo Frame 8x10", "2", "₹900"],
                  ["Birthday Greeting Card", "3", "₹180"],
                  ["Teddy Bear, medium", "1", "₹670"],
                ].map(([item, qty, amount]) => (
                  <li key={item} className="flex items-baseline justify-between gap-3">
                    <span>
                      {item} <span className="text-slate-500">x {qty}</span>
                    </span>
                    <span className="font-semibold">{amount}</span>
                  </li>
                ))}
              </ul>
              <p className="mt-3 border-t border-dashed border-slate-300 pt-3 text-sm text-slate-500">
                Order details: apnacatalog.in/o/x7k2pq9d
              </p>
            </div>
            <div className="absolute -right-3 -bottom-6 rotate-6 rounded-lg bg-tag px-4 py-2 text-ink shadow-lg">
              <span className="block text-xs font-semibold">Total</span>
              <span className="font-display text-3xl leading-none font-extrabold">₹1,750</span>
            </div>
          </div>
        </div>
      </section>

      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-6">
        <nav aria-label="Shop type" className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4 pb-2">
          <Link
            href={link({ type: "" })}
            className={cx(
              "rounded-full border px-3 py-1.5 text-sm font-medium whitespace-nowrap",
              !filters.type
                ? "border-brand bg-brand text-white"
                : "border-slate-200 bg-white text-slate-700 hover:border-slate-300",
            )}
          >
            All
          </Link>
          {BUSINESS_TYPES.filter((t) => t.id !== "other").map((t) => (
            <Link
              key={t.id}
              href={link({ type: t.id })}
              className={cx(
                "rounded-full border px-3 py-1.5 text-sm font-medium whitespace-nowrap",
                filters.type === t.id
                  ? "border-brand bg-brand text-white"
                  : "border-slate-200 bg-white text-slate-700 hover:border-slate-300",
              )}
            >
              {t.name}
            </Link>
          ))}
        </nav>

        <div className="mt-5 flex items-baseline justify-between gap-3">
          <h2 className="text-xl font-bold text-slate-900">{heading}</h2>
          {filtered && (
            <Link href="/" className="text-sm font-medium text-brand hover:underline">
              Clear filters
            </Link>
          )}
        </div>

        {problem && <Alert variant="destructive" className="mt-4">{problem}</Alert>}

        {data && data.shops.length > 0 && (
          <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {data.shops.map((shop) => (
              <ShopCard key={shop.slug} shop={shop} />
            ))}
          </div>
        )}

        {data && data.shops.length === 0 && (
          <Card className="mt-4 px-6 py-12 text-center">
            <IconBadge name="store" />
            <p className="mt-3 font-semibold text-slate-900">
              {filtered ? "No shops match this search yet." : "No shops are listed yet."}
            </p>
            <p className="mt-1 text-sm text-slate-600">
              Own a shop? Add it free and be the first one here.
            </p>
            <Link href="/login" className={buttonVariants({ className: "mt-5" })}>
              Add your shop free
            </Link>
          </Card>
        )}

        {data && (filters.page > 1 || data.hasMore) && (
          <div className="mt-6 flex justify-center gap-3">
            {filters.page > 1 && (
              <Link href={link({ page: filters.page - 1 })} className={buttonVariants({ variant: "outline" })}>
                Previous page
              </Link>
            )}
            {data.hasMore && (
              <Link href={link({ page: filters.page + 1 })} className={buttonVariants({ variant: "outline" })}>
                Next page
              </Link>
            )}
          </div>
        )}

        <section className="mt-12 rounded-2xl bg-ink px-6 py-10 text-white sm:px-10">
          <h2 className="text-3xl font-bold">Have a shop? Put your catalog online in 2 minutes.</h2>
          <div className="mt-6 grid gap-5 sm:grid-cols-3">
            {[
              ["1. Add your items", "Name, price and a photo. Do it from your phone."],
              ["2. Share your link", "Send it on WhatsApp or print the QR code for your counter."],
              ["3. Get orders on WhatsApp", "Customers pick items and the order lands in your chat."],
            ].map(([title, text]) => (
              <div key={title}>
                <h3 className="font-semibold">{title}</h3>
                <p className="mt-1 text-sm text-slate-300">{text}</p>
              </div>
            ))}
          </div>
          <div className="mt-7 flex flex-wrap items-center gap-4">
            <Link href="/login" className={buttonVariants({ variant: "tag" })}>
              Add your shop free
            </Link>
            <span className="text-sm text-slate-300">
              Free forever for up to {FREE_ITEM_LIMIT} items. No app needed.
            </span>
          </div>
        </section>
      </main>

      <SiteFooter />
    </>
  );
}
