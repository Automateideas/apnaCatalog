"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { adminDeleteShop } from "@/app/actions/admin";
import { promptDialog } from "@/components/dialogs";
import { Button } from "@/components/ui/button";

/** Admin: delete a shop, its login and all its photos for good. Asks for the shop link first. */
export function DeleteShopButton({ shopId, shopName, slug }: { shopId: string; shopName: string; slug: string }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  return (
    <Button
      type="button"
      variant="destructive"
      size="xs"
      disabled={pending}
      onClick={async () => {
        const typed = await promptDialog({
          title: `Delete ${shopName} for good?`,
          description: `This removes the shop, all its items, orders, reviews, the owner's login and every photo. It cannot be undone. Type ${slug} to confirm.`,
          label: "Shop link",
          placeholder: slug,
          maxLength: 60,
          confirmLabel: "Delete for good",
          validate: (value) => (value.trim().toLowerCase() === slug ? null : `Type ${slug} exactly.`),
        });
        if (!typed) return;
        startTransition(async () => {
          try {
            const result = await adminDeleteShop(shopId, typed);
            if (!result.ok) {
              toast.error(result.error);
              return;
            }
            toast.success(`${shopName} was deleted.`);
            router.refresh();
          } catch {
            toast.error("Failed. Check your internet and try again.");
          }
        });
      }}
    >
      {pending ? "..." : "Delete"}
    </Button>
  );
}
