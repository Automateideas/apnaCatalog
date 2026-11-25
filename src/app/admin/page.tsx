import type { Metadata } from "next";
import Link from "next/link";
import { count, desc, eq, getTableColumns, or, sql } from "drizzle-orm";
import { db } from "@/db";
import { orders, reviews, shops } from "@/db/schema";
import { adminSetReviewHidden } from "@/app/actions/admin";
import { ActionButton } from "@/components/ActionButton";
import { AdminShopsTable, type AdminShopRow } from "./AdminShopsTable";
import { PushToggle } from "@/components/PushToggle";
import { OpenReports } from "./OpenReports";
import { Logo } from "@/components/SiteChrome";
import { Stars } from "@/components/Stars";
import { requireAdmin } from "@/lib/auth";
import { formatDate } from "@/lib/utils";
import { buttonVariants } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Admin", robots: { index: false, follow: false } };

export default async function AdminPage() {
  await requireAdmin();

  const [[stats], shopRows, flagged] = await Promise.all([
    db
      .select({
        shops: sql<number>`(SELECT count(*)::int FROM ${shops})`,
        paid: sql<number>`(SELECT count(*)::int FROM ${shops} WHERE plan <> 'free' AND (plan_expires_at IS NULL OR plan_expires_at > now()))`,
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
      .orderBy(desc(shops.createdAt))
      .limit(200),
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
        <div className="mx-auto flex h-14 w-full max-w-6xl items-center justify-between px-4 sm:px-6">
          <Logo />
          <Link href="/dashboard" className={buttonVariants({ variant: "ghost", size: "sm" })}>
            My shop
          </Link>
        </div>
      </header>

      <main className="mx-auto w-full max-w-6xl flex-1 space-y-6 px-4 py-6 sm:px-6">
        <h1 className="text-xl font-bold text-slate-900">Admin</h1>
        <PushToggle />

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

        <OpenReports />

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

        <AdminShopsTable
          data={shopRows.map((shop): AdminShopRow => ({
            id: shop.id,
            slug: shop.slug,
            name: shop.name,
            businessType: shop.businessType,
            city: shop.city,
            ownerEmail: shop.ownerEmail,
            pendingOwnerEmail: shop.pendingOwnerEmail,
            whatsapp: shop.whatsapp,
            itemCount: shop.itemCount,
            plan: shop.plan,
            planExpiresAt: shop.planExpiresAt?.toISOString() ?? null,
            isHidden: shop.isHidden,
            createdAt: shop.createdAt.toISOString(),
            inviterSlug: shop.inviterSlug,
            inviteRewardedAt: shop.inviteRewardedAt?.toISOString() ?? null,
          }))}
        />
      </main>
    </>
  );
}
