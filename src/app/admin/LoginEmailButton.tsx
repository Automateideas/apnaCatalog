"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { adminSetShopLoginEmail } from "@/app/actions/admin";
import { confirmDialog, promptDialog } from "@/components/dialogs";
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
  const [pending, startTransition] = useTransition();

  const run = (email: string, done: string) => {
    startTransition(async () => {
      try {
        const result = await adminSetShopLoginEmail(shopId, email);
        if (!result.ok) {
          toast.error(result.error);
          return;
        }
        toast.success(done);
        router.refresh();
      } catch {
        toast.error("Failed. Check your internet and try again.");
      }
    });
  };

  return (
    <Button
      type="button"
      variant="outline"
      size="xs"
      disabled={pending}
      onClick={async () => {
        if (pendingEmail) {
          const ok = await confirmDialog({
            title: `Cancel the move of ${shopName}?`,
            description: `It will stay with the current account and not move to ${pendingEmail}.`,
            confirmLabel: "Cancel the move",
          });
          if (ok) run("", "Email change cancelled.");
          return;
        }
        const email = await promptDialog({
          title: `New login email for ${shopName}`,
          description: "The shop moves when that Google account logs in.",
          label: "Google email",
          type: "email",
          placeholder: "name@gmail.com",
          maxLength: 254,
        });
        if (email) run(email, `${shopName} will move when ${email} logs in.`);
      }}
    >
      {pending ? "..." : pendingEmail ? "Cancel email change" : "Change email"}
    </Button>
  );
}
