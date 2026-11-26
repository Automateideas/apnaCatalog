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
      className="no-scrollbar flex w-full overflow-x-auto"
    >
      {TABS.map((tab) => (
        <Link
          key={tab.href}
          href={tab.href}
          aria-current={isActive(pathname, tab.href) ? "page" : undefined}
          className={cx(
            "border-b-2 px-3 py-2.5 text-sm font-medium whitespace-nowrap transition-colors",
            isActive(pathname, tab.href)
              ? "border-brand text-brand dark:border-blue-400 dark:text-blue-400"
              : "border-transparent text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-100",
          )}
        >
          {tab.label}
        </Link>
      ))}
    </nav>
  );
}
