"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { changeLoginEmail } from "@/app/actions/shop";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Alert } from "@/components/ui/alert";

export function LoginEmailForm({
  currentEmail,
  pendingEmail,
}: {
  currentEmail: string | null;
  pendingEmail: string | null;
}) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const send = (value: string, confirmText?: string) => {
    if (confirmText && !window.confirm(confirmText)) return;
    setError(null);
    startTransition(async () => {
      const result = await changeLoginEmail(value);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      setEmail("");
      router.refresh();
    });
  };

  return (
    <Card className="space-y-3 p-4">
      <div>
        <h2 className="font-bold text-slate-900">Login account</h2>
        <p className="text-sm text-slate-600">
          You log in with Google as <strong>{currentEmail ?? "your Google account"}</strong>.
        </p>
      </div>

      {pendingEmail ? (
        <div className="space-y-2 rounded-lg bg-amber-50 p-3 text-sm text-amber-900">
          <p>
            Waiting for <strong>{pendingEmail}</strong>. Log out, then log in with that Google
            account, and this shop will open there. Until then nothing changes.
          </p>
          <Button
            type="button"
            variant="outline" size="sm"
            disabled={pending}
            onClick={() => send("")}
          >
            {pending ? "..." : "Cancel this change"}
          </Button>
        </div>
      ) : (
        <form
          className="space-y-2"
          onSubmit={(e) => {
            e.preventDefault();
            const value = email.trim().toLowerCase();
            send(
              value,
              `Move this shop to ${value}?\n\nAfter that account logs in, ${currentEmail ?? "the current account"} will no longer open this shop.`,
            );
          }}
        >
          <Label htmlFor="new-login-email">
            Change to another Google account
          </Label>
          <div className="flex flex-col gap-2 sm:flex-row">
            <Input
              id="new-login-email"
              type="email"
              required
              autoComplete="off"
              maxLength={200}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="newname@gmail.com"
            />
            <Button type="submit" variant="outline" className="shrink-0" disabled={pending}>
              {pending ? "Saving..." : "Change login email"}
            </Button>
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            Your shop, items, orders and reviews all stay. Only the Google account you log in
            with changes.
          </p>
        </form>
      )}

      {error && <Alert variant="destructive">{error}</Alert>}
    </Card>
  );
}
