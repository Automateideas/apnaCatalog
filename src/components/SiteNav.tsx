"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu } from "lucide-react";
import { cx } from "@/lib/utils";
import { Button, buttonVariants } from "@/components/ui/button";
import { Sheet, SheetContent, SheetDescription, SheetTitle } from "@/components/ui/sheet";

const LINKS = [
  { href: "/#shops", label: "Find businesses" },
  { href: "/#how-it-works", label: "How it works" },
  { href: "/pricing", label: "Pricing" },
];

/** Site navigation: links in the header on computers, a menu on phones. */
export function SiteNav({ signedIn }: { signedIn: boolean }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const isActive = (href: string) => (href.startsWith("/#") ? false : pathname === href);
  const cta = signedIn
    ? { href: "/dashboard", label: "Dashboard" }
    : { href: "/login", label: "Add your business free" };

  return (
    <>
      <nav aria-label="Main" className="hidden items-center gap-6 md:flex">
        {LINKS.map((l) => (
          <Link
            key={l.href}
            href={l.href}
            aria-current={isActive(l.href) ? "page" : undefined}
            className={cx(
              "text-sm font-medium hover:text-slate-900",
              isActive(l.href) ? "text-slate-900 underline decoration-tag decoration-2 underline-offset-8" : "text-slate-600",
            )}
          >
            {l.label}
          </Link>
        ))}
        {!signedIn && (
          <Link href="/login" className="text-sm font-medium text-slate-600 hover:text-slate-900">
            Log in
          </Link>
        )}
        <Link href={cta.href} className={buttonVariants({ size: "sm" })}>
          {cta.label}
        </Link>
      </nav>

      <div className="flex items-center gap-2 md:hidden">
        <Link href={cta.href} className={buttonVariants({ size: "sm" })}>
          {signedIn ? "Dashboard" : "Get started"}
        </Link>
        <Button variant="ghost" size="icon" aria-label="Open menu" aria-expanded={open} onClick={() => setOpen(true)}>
          <Menu />
        </Button>
      </div>

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent side="right" className="w-72 gap-0 p-0">
          <SheetTitle className="border-b border-slate-100 px-5 py-4 text-base font-bold">Menu</SheetTitle>
          <SheetDescription className="sr-only">Pages of the site</SheetDescription>
          <nav aria-label="Main" className="flex flex-col p-2">
            {[...LINKS, ...(signedIn ? [] : [{ href: "/login", label: "Log in" }])].map((l) => (
              <Link
                key={l.href}
                href={l.href}
                onClick={() => setOpen(false)}
                aria-current={isActive(l.href) ? "page" : undefined}
                className={cx(
                  "rounded-lg px-3 py-3 text-base font-medium hover:bg-slate-100",
                  isActive(l.href) ? "bg-brand-soft text-slate-900" : "text-slate-700",
                )}
              >
                {l.label}
              </Link>
            ))}
            <Link
              href={cta.href}
              onClick={() => setOpen(false)}
              className={buttonVariants({ className: "mx-3 mt-3" })}
            >
              {cta.label}
            </Link>
          </nav>
        </SheetContent>
      </Sheet>
    </>
  );
}
