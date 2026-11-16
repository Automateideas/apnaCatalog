"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import Link from "next/link";
import { getMyReview, submitReview } from "@/app/actions/reviews";
import { useStored } from "@/lib/use-stored";
import { cx } from "@/lib/utils";
import { IconBadge } from "@/components/Icon";
import { Card } from "@/components/ui/card";
import { Button, buttonVariants } from "@/components/ui/button";
import { Alert } from "@/components/ui/alert";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

type Saved = { phone: string; editToken: string };

function parseSaved(raw: string | null): Saved | null {
  if (!raw) return null;
  try {
    const value = JSON.parse(raw) as Partial<Saved>;
    if (typeof value.phone === "string" && typeof value.editToken === "string") {
      return { phone: value.phone, editToken: value.editToken };
    }
  } catch {
    // Ignore a corrupted entry.
  }
  return null;
}

function newToken(): string {
  const bytes = new Uint8Array(24);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
}

const LABELS = ["", "Bad", "Not good", "Okay", "Good", "Excellent"];

export function ReviewForm({
  shop,
  token,
}: {
  shop: { id: string; slug: string; name: string };
  token: string;
}) {
  const [rawSaved, setRawSaved] = useStored(`ac-review-${shop.id}`);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [editing, setEditing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState<"new" | "updated" | null>(null);
  const [pending, startTransition] = useTransition();
  const loaded = useRef(false);

  // On the phone that wrote a review, load it so the customer can edit it.
  useEffect(() => {
    const saved = parseSaved(rawSaved);
    if (!saved || loaded.current) return;
    loaded.current = true;
    getMyReview({ slug: shop.slug, token, phone: saved.phone, editToken: saved.editToken })
      .then((mine) => {
        if (!mine) return;
        setName(mine.name);
        setPhone(mine.phone);
        setRating(mine.rating);
        setComment(mine.comment);
        setEditing(true);
      })
      .catch(() => {});
  }, [rawSaved, shop.slug, token]);

  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);
    if (rating === 0) {
      setError("Tap a star to rate.");
      return;
    }
    const saved = parseSaved(rawSaved);
    const editToken = saved?.editToken ?? newToken();
    startTransition(async () => {
      try {
        const result = await submitReview({
          slug: shop.slug,
          token,
          name,
          phone,
          rating,
          comment,
          editToken,
        });
        if (!result.ok) {
          setError(result.error);
          return;
        }
        loaded.current = true;
        setRawSaved(JSON.stringify({ phone, editToken }));
        setEditing(true);
        setDone(result.data.updated ? "updated" : "new");
      } catch {
        setError("Could not save your review. Check your internet and try again.");
      }
    });
  };

  if (done) {
    return (
      <Card className="p-6 text-center">
        <IconBadge name="check" />
        <h2 className="mt-3 text-xl font-bold">
          {done === "new" ? "Thank you for your review!" : "Your review was updated."}
        </h2>
        <p className="mt-2 text-sm text-slate-600">
          You can change it any time by opening this link again on this phone.
        </p>
        <div className="mt-5 flex flex-col gap-2 sm:flex-row sm:justify-center">
          <Link href={`/${shop.slug}`} className={buttonVariants()}>
            See {shop.name}&apos;s catalog
          </Link>
          <Button type="button" variant="outline" onClick={() => setDone(null)}>
            Edit my review
          </Button>
        </div>
      </Card>
    );
  }

  return (
    <form onSubmit={submit} className="rounded-xl border bg-card space-y-5 p-5">
      {editing && (
        <Alert variant="success">You already reviewed this shop. You can change your review below.</Alert>
      )}

      <div>
        <span className="mb-1.5 block text-sm font-medium text-slate-700">Your rating</span>
        <div className="flex items-center gap-1" role="radiogroup" aria-label="Rating">
          {[1, 2, 3, 4, 5].map((n) => (
            <button
              key={n}
              type="button"
              role="radio"
              aria-checked={rating === n}
              aria-label={`${n} star${n > 1 ? "s" : ""}`}
              onClick={() => setRating(n)}
              className={cx(
                "h-12 w-12 transition-colors",
                n <= rating ? "text-amber-500" : "text-slate-300 hover:text-amber-300",
              )}
            >
              <svg viewBox="0 0 20 20" className="mx-auto h-9 w-9" fill="currentColor" aria-hidden="true">
                <path d="M10 1.5l2.6 5.3 5.9.9-4.3 4.1 1 5.8L10 14.9l-5.2 2.7 1-5.8L1.5 7.7l5.9-.9z" />
              </svg>
            </button>
          ))}
          <span className="ml-2 text-sm font-medium text-slate-600">{LABELS[rating]}</span>
        </div>
      </div>

      <div>
        <Label htmlFor="review-name">
          Your name
        </Label>
        <Input
          id="review-name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          minLength={2}
          maxLength={50}
          autoComplete="name"
        />
      </div>

      <div>
        <Label htmlFor="review-phone">
          Mobile number
        </Label>
        <Input
          id="review-phone"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          required
          type="tel"
          inputMode="numeric"
          maxLength={14}
          autoComplete="tel-national"
          placeholder="10-digit number"
          readOnly={editing}
        />
        <p className="mt-1 text-sm text-muted-foreground">
          One review per number. Your number is shown only to {shop.name}, never on the public page.
        </p>
      </div>

      <div>
        <Label htmlFor="review-comment">
          Your review (optional)
        </Label>
        <Textarea
          id="review-comment"
          rows={4}
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          maxLength={600}
          placeholder="How was the shop, the products, the service?"
        />
      </div>

      {error && <Alert variant="destructive">{error}</Alert>}

      <Button type="submit" className="w-full text-base" disabled={pending}>
        {pending ? "Saving..." : editing ? "Update review" : "Submit review"}
      </Button>
      <p className="text-center text-xs text-slate-500">
        Your name, rating and review will be visible to everyone. By submitting you agree to our{" "}
        <Link href="/privacy" className="underline">
          privacy policy
        </Link>
        .
      </p>
    </form>
  );
}
