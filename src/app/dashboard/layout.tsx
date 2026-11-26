import type { Metadata } from "next";
import Link from "next/link";
import { Bell, LogOut } from "lucide-react";
import { and, count, eq, isNull } from "drizzle-orm";
import { db } from "@/db";
import { reports } from "@/db/schema";
import { Logo } from "@/components/SiteChrome";
import { getShopByOwner, isAdminEmail, requireUser } from "@/lib/auth";
import { Icon } from "@/components/Icon";
import { Button, buttonVariants } from "@/components/ui/button";
import { DashboardNav, DashboardSidebar } from "./DashboardNavClient";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "My shop",
  robots: { index: false, follow: false },
};

export default async function DashboardLayout({
  children,
}: LayoutProps<"/dashboard">) {
  const user = await requireUser();
  const shop = await getShopByOwner(user.id);
  const [{ unseen }] = shop
    ? await db
        .select({ unseen: count() })
        .from(reports)
        .where(and(eq(reports.shopId, shop.id), isNull(reports.seenByShopAt)))
    : [{ unseen: 0 }];

  return (
    <>
      <header className="sticky top-0 z-30 border-b border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-900">
        <div className="mx-auto flex h-14 w-full max-w-7xl items-center justify-between gap-3 px-4 sm:px-6">
          <Logo />
          <div className="flex items-center gap-1">
            {isAdminEmail(user.email) && (
              <Link href="/admin" className={buttonVariants({ variant: "ghost", size: "sm" })}>
                Admin
              </Link>
            )}
            {shop && (
              <Link
                href="/dashboard/reports"
                aria-label={unseen > 0 ? `Notifications, ${unseen} new` : "Notifications"}
                className={buttonVariants({ variant: "ghost", size: "icon", className: "relative" })}
              >
                <Bell />
                {unseen > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-red-600 px-1 text-[11px] font-bold text-white">
                    {unseen > 9 ? "9+" : unseen}
                  </span>
                )}
              </Link>
            )}
            {shop && (
              <Link
                href={`/${shop.slug}`}
                target="_blank"
                className={buttonVariants({ variant: "outline", size: "sm" })}
              >
                View shop <Icon name="external" />
              </Link>
            )}
            <form action="/auth/signout" method="post">
              <Button type="submit" variant="ghost" size="sm" aria-label="Log out">
                <LogOut className="size-4 sm:hidden" />
                <span className="hidden sm:inline">Log out</span>
              </Button>
            </form>
          </div>
        </div>
      </header>
      <div className="mx-auto w-full max-w-7xl flex-1 px-4 sm:px-6">
        {shop && <DashboardNav />}
        <div className="flex gap-8 py-6">
          {shop && <DashboardSidebar />}
          <main className="min-w-0 flex-1">
            {children}
          </main>
        </div>
      </div>
    </>
  );
}
