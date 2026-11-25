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

export function DashboardNav() {
  const pathname = usePathname();
  return (
    <nav
      aria-label="Dashboard"
      className="no-scrollbar mx-auto flex w-full max-w-4xl gap-1 overflow-x-auto px-2 sm:px-6"
    >
      {TABS.map((tab) => {
        const active =
          tab.href === "/dashboard"
            ? pathname === tab.href
            : pathname?.startsWith(tab.href) ?? false;
        return (
          <Link
            key={tab.href}
            href={tab.href}
            aria-current={active ? "page" : undefined}
            className={cx(
              "border-b-2 px-3 py-2.5 text-sm font-medium whitespace-nowrap",
              active
                ? "border-tag text-brand dark:border-tag dark:text-slate-100"
                : "border-transparent text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100",
            )}
            suppressHydrationWarning
          >
            {tab.label}
          </Link>
        );
      })}
    </nav>
  );
}
