import Link from "next/link";
import { SITE_NAME } from "@/lib/utils";
import { SiteNav } from "@/components/SiteNav";

export function Logo({ className = "" }: { className?: string }) {
  return (
    <Link
      href="/"
      aria-label={SITE_NAME}
      className={`inline-flex items-center gap-2 text-[#1B2340] ${className}`}
    >
      {/* Same mark as public/icon-light.svg, inlined so it never flashes in late. */}
      <svg aria-hidden="true" viewBox="0 0 100 100" className="h-8 w-8 shrink-0">
        <rect width="100" height="100" rx="26" fill="#1B2340" />
        <circle cx="46" cy="54" r="21" fill="none" stroke="#FBF7F0" strokeWidth="11" />
        <rect x="62" y="20" width="11" height="68" rx="5.5" fill="#FBF7F0" />
        <circle cx="67.5" cy="28" r="4.5" fill="#F29A1F" />
      </svg>
      <span className="font-display text-xl leading-none font-bold tracking-tight">
        apna<span className="font-semibold text-[#F29A1F]">catalog</span>
      </span>
    </Link>
  );
}

export function SiteHeader({ signedIn }: { signedIn: boolean }) {
  return (
    <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/95 backdrop-blur">
      <div className="mx-auto flex h-14 w-full max-w-6xl items-center justify-between px-4">
        <Logo />
        <SiteNav signedIn={signedIn} />
      </div>
    </header>
  );
}

export function SiteFooter() {
  return (
    <footer className="no-print mt-auto border-t border-slate-200 bg-white">
      <div className="mx-auto flex w-full max-w-6xl flex-col items-center justify-between gap-3 px-4 py-6 text-sm text-slate-500 sm:flex-row">
        <p>
          © {new Date().getFullYear()} {SITE_NAME}. Made for local businesses in India.
        </p>
        <nav className="flex gap-5">
          <Link href="/pricing" className="hover:text-slate-900">
            Pricing
          </Link>
          <Link href="/login" className="hover:text-slate-900">
            Login
          </Link>
          <Link href="/privacy" className="hover:text-slate-900">
            Privacy
          </Link>
          <Link href="/terms" className="hover:text-slate-900">
            Terms
          </Link>
        </nav>
      </div>
    </footer>
  );
}
