"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { adminSetShopPlanUntil } from "@/app/actions/admin";
import { promptDialog } from "@/components/dialogs";
import { Button } from "@/components/ui/button";

/** Today's date in India as YYYY-MM-DD, the format a date input uses. */
function todayInIndia(): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Kolkata" }).format(new Date());
}

/** Admin: pick the exact day a shop's paid plan ends. */
export function PlanDateButton({
  shopId,
  shopName,
  currentDate,
}: {
  shopId: string;
  shopName: string;
  /** The current end date as YYYY-MM-DD, when the shop is on the paid plan. */
  currentDate: string | null;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  return (
    <Button
      type="button"
      variant="outline"
      size="xs"
      disabled={pending}
      onClick={async () => {
        const today = todayInIndia();
        const date = await promptDialog({
          title: `Paid plan end date for ${shopName}`,
          description:
            "The paid plan runs until the end of this day. This replaces the current end date, so it can also shorten a plan.",
          label: "Paid till",
          type: "date",
          min: today,
          defaultValue: currentDate && currentDate >= today ? currentDate : undefined,
          confirmLabel: "Set date",
        });
        if (!date) return;
        startTransition(async () => {
          try {
            const result = await adminSetShopPlanUntil(shopId, date);
            if (!result.ok) {
              toast.error(result.error);
              return;
            }
            const shown = new Date(`${date}T12:00:00+05:30`).toLocaleDateString("en-IN", {
              day: "numeric",
              month: "short",
              year: "numeric",
              timeZone: "Asia/Kolkata",
            });
            toast.success(`${shopName} is on the paid plan till ${shown}.`);
            router.refresh();
          } catch {
            toast.error("Failed. Check your internet and try again.");
          }
        });
      }}
    >
      {pending ? "..." : "Set date"}
    </Button>
  );
}
