import type { Metadata } from "next";
import { IconBadge } from "@/components/Icon";

export const metadata: Metadata = { title: "No internet", robots: { index: false } };

export default function OfflinePage() {
  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col items-center justify-center px-6 text-center">
      <IconBadge name="offline" />
      <h1 className="mt-4 text-xl font-bold">No internet</h1>
      <p className="mt-2 text-slate-600">
        Check your connection and try again. Catalogs you opened before still work offline.
      </p>
      {/* A plain link so this page needs no JavaScript while offline. */}
      {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
      <a href="/" className="btn-primary mt-6">
        Try again
      </a>
    </main>
  );
}
