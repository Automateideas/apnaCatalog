import Link from "next/link";
import { SITE_NAME } from "@/lib/utils";

export function Logo({ className = "" }: { className?: string }) {
  return (
    <Link href="/" className={`inline-flex items-center gap-2 font-bold text-slate-900 ${className}`}>
      {/* The mark is a price tag: yellow tile, punched hole, the letter. */}
      <span className="relative flex h-8 w-8 items-center justify-center rounded-lg bg-tag font-display text-xl leading-none font-extrabold text-ink">
        <span className="absolute top-1 right-1 h-1 w-1 rounded-full bg-ink/70" />A
      </span>
      <span className="font-display text-xl font-bold tracking-tight">{SITE_NAME}</span>
    </Link>
  );
}

export function SiteHeader({ signedIn }: { signedIn: boolean }) {
  return (
    <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/95 backdrop-blur">
      <div className="mx-auto flex h-14 w-full max-w-6xl items-center justify-between px-4">
        <Logo />
        <Link href={signedIn ? "/dashboard" : "/login"} className="btn-primary min-h-9 px-3 py-1.5">
          {signedIn ? "My shop" : "Add your shop free"}
        </Link>
      </div>
    </header>
  );
}

export function SiteFooter() {
  return (
    <footer className="no-print mt-auto border-t border-slate-200 bg-white">
      <div className="mx-auto flex w-full max-w-6xl flex-col items-center justify-between gap-3 px-4 py-6 text-sm text-slate-500 sm:flex-row">
        <p>
          © {new Date().getFullYear()} {SITE_NAME}. Made for local shops in India.
        </p>
        <nav className="flex gap-5">
          <Link href="/login" className="hover:text-slate-900">
            Shop login
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
