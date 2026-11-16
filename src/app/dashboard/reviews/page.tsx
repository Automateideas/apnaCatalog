import { desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { reviews } from "@/db/schema";
import { reportReview } from "@/app/actions/reviews";
import { ActionButton } from "@/components/ActionButton";
import { CopyButton } from "@/components/CopyButton";
import { ratingOf, Stars } from "@/components/Stars";
import { requireShop } from "@/lib/auth";
import { formatDate, siteUrl, waShareLink } from "@/lib/utils";
import { Card } from "@/components/ui/card";
import { buttonVariants } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export default async function ReviewsPage() {
  const { shop } = await requireShop();
  const reviewUrl = `${siteUrl()}/${shop.slug}/review?t=${shop.reviewToken}`;

  const rows = await db
    .select()
    .from(reviews)
    .where(eq(reviews.shopId, shop.id))
    .orderBy(desc(reviews.updatedAt))
    .limit(500);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Reviews</h1>
          {shop.ratingCount > 0 ? (
            <p className="mt-1 flex items-center gap-2 text-sm text-slate-600">
              <Stars value={ratingOf(shop)} className="text-base" />
              <strong className="text-slate-900">{ratingOf(shop).toFixed(1)}</strong> from{" "}
              {shop.ratingCount} {shop.ratingCount === 1 ? "review" : "reviews"}
            </p>
          ) : (
            <p className="text-sm text-slate-500">No reviews yet.</p>
          )}
        </div>
      </div>

      <Card className="p-4">
        <p className="text-sm text-slate-700">
          Send this link to your customers. Only people with the link can review your shop, and each
          mobile number can review once.
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          <a
            href={waShareLink(
              `Thank you for shopping at ${shop.name}! Please rate us, it takes 30 seconds:\n${reviewUrl}`,
            )}
            target="_blank"
            rel="noopener noreferrer"
            className={buttonVariants({ variant: "whatsapp" })}
          >
            Send review link on WhatsApp
          </a>
          <CopyButton text={reviewUrl} label="Copy review link" />
        </div>
      </Card>

      {rows.length > 0 && (
        <ul className="space-y-3">
          {rows.map((review) => (
            <li key={review.id} className="rounded-xl border bg-card p-4">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <p className="font-medium text-slate-900">{review.name}</p>
                  <a href={`tel:+91${review.phone}`} className="text-sm text-brand hover:underline">
                    +91 {review.phone}
                  </a>
                </div>
                <time className="text-xs text-slate-400">{formatDate(review.updatedAt)}</time>
              </div>
              <Stars value={review.rating} className="mt-1.5" />
              {review.comment && (
                <p className="mt-1.5 text-sm whitespace-pre-line text-slate-700">{review.comment}</p>
              )}
              <div className="mt-3 flex items-center gap-2 text-xs">
                {review.isHidden ? (
                  <Badge variant="outline">Hidden by admin</Badge>
                ) : review.isReported ? (
                  <Badge className="bg-amber-100 text-amber-800">Reported, waiting for admin</Badge>
                ) : (
                  <ActionButton
                    action={reportReview.bind(null, review.id)}
                    variant="ghost"
                    size="xs"
                    className="text-slate-500"
                    confirm="Report this review as fake or abusive? Our team will check it."
                  >
                    Report this review
                  </ActionButton>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
