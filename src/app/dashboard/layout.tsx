import type { Metadata } from "next";
import Link from "next/link";
import { Logo } from "@/components/SiteChrome";
import { getShopByOwner, isAdminEmail, requireUser } from "@/lib/auth";
import { DashboardNav } from "./DashboardNav";
import { Icon } from "@/components/Icon";

// Every dashboard page depends on who is logged in, so never prerender them.
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "My shop",
  robots: { index: false, follow: false },
};

export default async function DashboardLayout({ children }: LayoutProps<"/dashboard">) {
  const user = await requireUser();
  const shop = await getShopByOwner(user.id);

  return (
    <>
      <header className="sticky top-0 z-30 border-b border-slate-200 bg-white">
        <div className="mx-auto flex h-14 w-full max-w-4xl items-center justify-between gap-3 px-4">
          <Logo />
          <div className="flex items-center gap-1">
            {isAdminEmail(user.email) && (
              <Link href="/admin" className="btn-ghost min-h-9 px-3 py-1.5">
                Admin
              </Link>
            )}
            {shop && (
              <Link
                href={`/${shop.slug}`}
                target="_blank"
                className="btn-outline min-h-9 px-3 py-1.5"
              >
                View shop <Icon name="external" />
              </Link>
            )}
            <form action="/auth/signout" method="post">
              <button type="submit" className="btn-ghost min-h-9 px-3 py-1.5">
                Log out
              </button>
            </form>
          </div>
        </div>
        {shop && <DashboardNav />}
      </header>
      <main className="mx-auto w-full max-w-4xl flex-1 px-4 py-6">{children}</main>
    </>
  );
}
