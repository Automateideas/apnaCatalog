import type { Metadata } from "next";
import Link from "next/link";
import { count, desc, eq, getTableColumns, ilike, or, sql } from "drizzle-orm";
import { db } from "@/db";
import { orders, reviews, shops } from "@/db/schema";
import {
  adminSetReviewHidden,
  adminSetShopHidden,
  adminSetShopPlan,
} from "@/app/actions/admin";
import { ActionButton } from "@/components/ActionButton";
import { LoginEmailButton } from "./LoginEmailButton";
import { PlanDateButton } from "./PlanDateButton";
import { Logo } from "@/components/SiteChrome";
import { Stars } from "@/components/Stars";
import { requireAdmin } from "@/lib/auth";
import { getBusinessType, isPaid } from "@/lib/catalog-config";
import { formatDate } from "@/lib/utils";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Admin", robots: { index: false, follow: false } };

/** A date as YYYY-MM-DD in India time, the format a date input uses. */
function dateInIndia(date: Date): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Kolkata" }).format(date);
}

export default async function AdminPage({ searchParams }: PageProps<"/admin">) {
  await requireAdmin();
  const params = await searchParams;
  const q = (typeof params.q === "string" ? params.q : "").trim().slice(0, 60);
  const like = `%${q.replace(/[\\%_]/g, "\\$&")}%`;

  const [[stats], shopRows, flagged] = await Promise.all([
    db
      .select({
        shops: sql<number>`(SELECT count(*)::int FROM ${shops})`,
        paid: sql<number>`(SELECT count(*)::int FROM ${shops} WHERE plan = 'paid' AND (plan_expires_at IS NULL OR plan_expires_at > now()))`,
        orders: sql<number>`(SELECT count(*)::int FROM ${orders})`,
        reviews: sql<number>`(SELECT count(*)::int FROM ${reviews})`,
      })
      .from(sql`(SELECT 1) AS one`),
    db
      .select({
        ...getTableColumns(shops),
        // Written by hand: Drizzle would drop the "shops." prefix here, and a bare
        // invited_by inside the subquery would mean the inviter's own column.
        inviterSlug: sql<string | null>`(SELECT inviter.slug FROM shops AS inviter WHERE inviter.id = shops.invited_by)`,
      })
      .from(shops)
      .where(
        q
          ? or(
              ilike(shops.name, like),
              ilike(shops.slug, like),
              ilike(shops.city, like),
              ilike(shops.ownerEmail, like),
              ilike(shops.whatsapp, like),
            )
          : undefined,
      )
      .orderBy(desc(shops.createdAt))
      .limit(100),
    db
      .select({ review: reviews, shopName: shops.name, shopSlug: shops.slug })
      .from(reviews)
      .innerJoin(shops, eq(shops.id, reviews.shopId))
      .where(or(eq(reviews.isReported, true), eq(reviews.isHidden, true)))
      .orderBy(desc(reviews.isReported), desc(reviews.updatedAt))
      .limit(100),
  ]);

  const [{ reported }] = await db
    .select({ reported: count() })
    .from(reviews)
    .where(eq(reviews.isReported, true));

  return (
    <>
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex h-14 w-full max-w-6xl items-center justify-between px-4">
          <Logo />
          <Link href="/dashboard" className={buttonVariants({ variant: "ghost", size: "sm" })}>
            My shop
          </Link>
        </div>
      </header>

      <main className="mx-auto w-full max-w-6xl flex-1 space-y-6 px-4 py-6">
        <h1 className="text-xl font-bold text-slate-900">Admin</h1>

        <section className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[
            ["Shops", stats.shops],
            ["Paid shops", stats.paid],
            ["Orders", stats.orders],
            ["Reviews", stats.reviews],
          ].map(([label, value]) => (
            <Card key={label} className="p-4">
              <p className="text-2xl font-bold text-slate-900">{value}</p>
              <p className="text-sm text-slate-500">{label}</p>
            </Card>
          ))}
        </section>

        <section>
          <h2 className="font-bold text-slate-900">
            Reported and hidden reviews{reported > 0 && ` (${reported} waiting)`}
          </h2>
          {flagged.length === 0 ? (
            <p className="mt-2 text-sm text-slate-500">Nothing to check.</p>
          ) : (
            <ul className="mt-3 space-y-2">
              {flagged.map(({ review, shopName, shopSlug }) => (
                <li key={review.id} className="rounded-xl border bg-card flex flex-wrap items-start justify-between gap-3 p-4">
                  <div className="min-w-0 text-sm">
                    <p className="font-medium text-slate-900">
                      {review.name}, +91 {review.phone}, on{" "}
                      <Link href={`/${shopSlug}`} className="text-brand underline" target="_blank">
                        {shopName}
                      </Link>
                    </p>
                    <Stars value={review.rating} />
                    {review.comment && <p className="mt-1 whitespace-pre-line text-slate-700">{review.comment}</p>}
                    <p className="mt-1 text-xs text-slate-400">
                      {formatDate(review.updatedAt)} ·{" "}
                      {review.isHidden ? "Hidden" : "Reported by shop"}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    {review.isHidden ? (
                      <ActionButton size="xs" action={adminSetReviewHidden.bind(null, review.id, false)}>
                        Show again
                      </ActionButton>
                    ) : (
                      <>
                        <ActionButton size="xs" action={adminSetReviewHidden.bind(null, review.id, true)}>
                          Hide review
                        </ActionButton>
                        <ActionButton size="xs" action={adminSetReviewHidden.bind(null, review.id, false)}>
                          Keep it
                        </ActionButton>
                      </>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="font-bold text-slate-900">Shops</h2>
            <form action="/admin" className="flex gap-2">
              <Input
                name="q"
                defaultValue={q}
                className="min-h-9 py-1.5 text-sm"
                placeholder="Name, link, city, email, phone"
                aria-label="Search shops"
              />
              <Button type="submit" variant="outline" size="sm">
                Search
              </Button>
            </form>
          </div>

          <Card className="mt-3 overflow-x-auto">
            <Table className="w-full min-w-[720px] text-sm">
              <TableHeader>
                <TableRow className="bg-slate-50 text-left text-slate-500">
                  <TableHead className="px-3 py-2 font-medium">Shop</TableHead>
                  <TableHead className="px-3 py-2 font-medium">Owner</TableHead>
                  <TableHead className="px-3 py-2 font-medium">Items</TableHead>
                  <TableHead className="px-3 py-2 font-medium">Plan</TableHead>
                  <TableHead className="px-3 py-2 font-medium">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {shopRows.map((shop) => {
                  const paid = isPaid(shop);
                  return (
                    <TableRow key={shop.id} className="border-t border-slate-100 align-top">
                      <TableCell className="px-3 py-2">
                        <Link href={`/${shop.slug}`} target="_blank" className="font-medium text-brand underline">
                          {shop.name}
                        </Link>
                        <p className="text-xs text-slate-500">
                          /{shop.slug} · {getBusinessType(shop.businessType).name} · {shop.city}
                        </p>
                        <p className="text-xs text-slate-400">Joined {formatDate(shop.createdAt)}</p>
                        {shop.inviterSlug && (
                          <p className="text-xs text-slate-500">
                            Invited by /{shop.inviterSlug} ·{" "}
                            {shop.inviteRewardedAt
                              ? `free month given ${formatDate(shop.inviteRewardedAt)}`
                              : "inviter gets a free month on first paid plan"}
                          </p>
                        )}
                        {shop.isHidden && (
                          <Badge variant="destructive">Hidden</Badge>
                        )}
                      </TableCell>
                      <TableCell className="px-3 py-2 text-xs text-slate-600">
                        <p>{shop.ownerEmail ?? "-"}</p>
                        {shop.pendingOwnerEmail && (
                          <p className="text-amber-700">Moving to {shop.pendingOwnerEmail}</p>
                        )}
                        <p>+91 {shop.whatsapp}</p>
                      </TableCell>
                      <TableCell className="px-3 py-2">{shop.itemCount}</TableCell>
                      <TableCell className="px-3 py-2">
                        <span className={paid ? "font-semibold text-emerald-700" : "text-slate-600"}>
                          {paid ? "Paid" : "Free"}
                        </span>
                        {paid && shop.planExpiresAt && (
                          <p className="text-xs text-slate-500">till {formatDate(shop.planExpiresAt)}</p>
                        )}
                      </TableCell>
                      <TableCell className="px-3 py-2">
                        <div className="flex flex-wrap items-center gap-1.5">
                          <ActionButton
                            size="xs"
                            action={adminSetShopPlan.bind(null, shop.id, 1)}
                            confirm={`Add 1 month of the paid plan to ${shop.name}?`}
                            success={`Added 1 month to ${shop.name}.`}
                          >
                            Paid 1 mo
                          </ActionButton>
                          <ActionButton
                            size="xs"
                            action={adminSetShopPlan.bind(null, shop.id, 12)}
                            confirm={`Add 1 year of the paid plan to ${shop.name}?`}
                            success={`Added 1 year to ${shop.name}.`}
                          >
                            Paid 1 yr
                          </ActionButton>
                          <PlanDateButton
                            shopId={shop.id}
                            shopName={shop.name}
                            currentDate={paid && shop.planExpiresAt ? dateInIndia(shop.planExpiresAt) : null}
                          />
                          {shop.plan === "paid" && (
                            <ActionButton
                              size="xs"
                              action={adminSetShopPlan.bind(null, shop.id, 0)}
                              confirm={`Move ${shop.name} to the free plan now?`}
                              destructive
                              success={`${shop.name} is now on the free plan.`}
                            >
                              Make free
                            </ActionButton>
                          )}
                          <ActionButton
                            size="xs"
                            action={adminSetShopHidden.bind(null, shop.id, !shop.isHidden)}
                            confirm={
                              shop.isHidden
                                ? `Show ${shop.name} to the public again?`
                                : `Hide ${shop.name}? Customers will not be able to open it.`
                            }
                            destructive={!shop.isHidden}
                          >
                            {shop.isHidden ? "Unhide" : "Hide"}
                          </ActionButton>
                          <LoginEmailButton
                            shopId={shop.id}
                            shopName={shop.name}
                            pendingEmail={shop.pendingOwnerEmail}
                          />
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
                {shopRows.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={5} className="px-3 py-8 text-center text-slate-500">
                      No shops found.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </Card>
          <p className="mt-2 text-xs text-slate-500">Showing the newest 100 shops. Use search to find others.</p>
        </section>
      </main>
    </>
  );
}
