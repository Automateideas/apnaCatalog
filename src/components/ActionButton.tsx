"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { confirmDialog } from "@/components/dialogs";
import { Button } from "@/components/ui/button";
import type { ActionResult } from "@/lib/utils";

type ButtonProps = React.ComponentProps<typeof Button>;

/** A button that runs a server action, then reloads the page data. */
export function ActionButton({
  action,
  children,
  variant = "outline",
  size,
  className,
  confirm,
  destructive,
  success,
}: {
  action: () => Promise<ActionResult>;
  children: React.ReactNode;
  variant?: ButtonProps["variant"];
  size?: ButtonProps["size"];
  className?: string;
  /** Question to ask before running the action. */
  confirm?: string;
  /** Shows the confirm button in red. */
  destructive?: boolean;
  /** Message to show when the action worked. */
  success?: string;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  return (
    <Button
      type="button"
      variant={variant}
      size={size}
      className={className}
      disabled={pending}
      onClick={async () => {
        if (confirm && !(await confirmDialog({ title: confirm, destructive }))) return;
        startTransition(async () => {
          try {
            const result = await action();
            if (!result.ok) {
              toast.error(result.error);
              return;
            }
            if (success) toast.success(success);
            router.refresh();
          } catch {
            toast.error("Failed. Check your internet and try again.");
          }
        });
      }}
    >
      {pending ? "..." : children}
    </Button>
  );
}
