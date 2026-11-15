import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Avatar } from "@/components/Avatar";
import { effectiveTheme } from "@/lib/catalog-config";
import { getPublicShop } from "@/lib/shop-data";
import { ReviewForm } from "./ReviewForm";
import { IconBadge } from "@/components/Icon";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Write a review",
  robots: { index: false, follow: false },
};

export default async function ReviewPage({ params, searchParams }: PageProps<"/[slug]/review">) {
  const { slug } = await params;
  const { t } = await searchParams;
  const token = typeof t === "string" ? t : "";

  const shop = await getPublicShop(slug);
  if (!shop) notFound();

  const { palette } = effectiveTheme(shop);
  const valid = token.length > 0 && token === shop.reviewToken;

  return (
    <main className="mx-auto w-full max-w-md flex-1 px-4 py-8">
      <div className="mb-5 flex items-center gap-3">
        <Avatar name={shop.name} src={shop.logoUrl} color={palette.primary} className="h-14 w-14 text-lg" />
        <div>
          <p className="text-sm text-slate-500">Review for</p>
          <h1 className="text-xl font-bold text-slate-900">{shop.name}</h1>
        </div>
      </div>

      {valid ? (
        <ReviewForm shop={{ id: shop.id, slug: shop.slug, name: shop.name }} token={token} />
      ) : (
        <div className="card p-6 text-center">
          <IconBadge name="link" />
          <h2 className="mt-3 text-lg font-bold">This review link is not valid</h2>
          <p className="mt-2 text-sm text-slate-600">
            Reviews can be written only from the link the shop sends to its customers. Please ask{" "}
            {shop.name} to send you the link again.
          </p>
          <Link href={`/${shop.slug}`} className="btn-outline mt-5">
            See the catalog
          </Link>
        </div>
      )}
    </main>
  );
}
