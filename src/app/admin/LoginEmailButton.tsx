"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { adminSetShopLoginEmail } from "@/app/actions/admin";
import { Button } from "@/components/ui/button";

/** Admin: move a shop to another Google account, e.g. when the owner lost the old one. */
export function LoginEmailButton({
  shopId,
  shopName,
  pendingEmail,
}: {
  shopId: string;
  shopName: string;
  pendingEmail: string | null;
}) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const run = (email: string) => {
    setError(null);
    startTransition(async () => {
      const result = await adminSetShopLoginEmail(shopId, email);
      if (!result.ok) setError(result.error);
      else router.refresh();
    });
  };

  return (
    <>
      <Button
        type="button"
        variant="outline"
        size="xs"
        disabled={pending}
        onClick={() => {
          if (pendingEmail) {
            if (window.confirm(`Cancel the move of ${shopName} to ${pendingEmail}?`)) run("");
            return;
          }
          const email = window.prompt(
            `New Google email for ${shopName}.\nThe shop moves when that account logs in.`,
          );
          if (email?.trim()) run(email);
        }}
      >
        {pending ? "..." : pendingEmail ? "Cancel email change" : "Change email"}
      </Button>
      {error && <span className="text-xs text-red-600">{error}</span>}
    </>
  );
}
