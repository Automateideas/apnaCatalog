"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cx } from "@/lib/utils";

const TABS = [
  { href: "/dashboard", label: "Home" },
  { href: "/dashboard/items", label: "Items" },
  { href: "/dashboard/orders", label: "Orders" },
  { href: "/dashboard/reviews", label: "Reviews" },
  { href: "/dashboard/shop", label: "Shop details" },
  { href: "/dashboard/theme", label: "Theme" },
  { href: "/dashboard/analytics", label: "Analytics" },
  { href: "/dashboard/plan", label: "Plan" },
];

function isActive(pathname: string | null, href: string) {
  return href === "/dashboard" ? pathname === href : (pathname?.startsWith(href) ?? false);
}

export function DashboardNav() {
  const pathname = usePathname();
  return (
    <nav
      aria-label="Dashboard"
      className="no-scrollbar lg:hidden mx-auto flex w-full max-w-7xl gap-1 overflow-x-auto px-2 sm:px-6"
    >
      {TABS.map((tab) => (
        <Link
          key={tab.href}
          href={tab.href}
          aria-current={isActive(pathname, tab.href) ? "page" : undefined}
          className={cx(
            "border-b-2 px-3 py-2.5 text-sm font-medium whitespace-nowrap",
            isActive(pathname, tab.href)
              ? "border-tag text-brand dark:border-tag dark:text-slate-100"
              : "border-transparent text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100",
          )}
        >
          {tab.label}
        </Link>
      ))}
    </nav>
  );
}

export function DashboardSidebar() {
  const pathname = usePathname();
  return (
    <aside className="hidden lg:block w-52 shrink-0">
      <nav aria-label="Dashboard" className="sticky top-20 flex flex-col gap-0.5">
        {TABS.map((tab) => (
          <Link
            key={tab.href}
            href={tab.href}
            aria-current={isActive(pathname, tab.href) ? "page" : undefined}
            className={cx(
              "rounded-lg px-3 py-2 text-sm font-medium",
              isActive(pathname, tab.href)
                ? "bg-brand text-white"
                : "text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-100",
            )}
          >
            {tab.label}
          </Link>
        ))}
      </nav>
    </aside>
  );
}
