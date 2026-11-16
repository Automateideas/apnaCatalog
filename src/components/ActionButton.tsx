"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
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
}: {
  action: () => Promise<ActionResult>;
  children: React.ReactNode;
  variant?: ButtonProps["variant"];
  size?: ButtonProps["size"];
  className?: string;
  confirm?: string;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  return (
    <>
      <Button
        type="button"
        variant={variant}
        size={size}
        className={className}
        disabled={pending}
        onClick={() => {
          if (confirm && !window.confirm(confirm)) return;
          setError(null);
          startTransition(async () => {
            try {
              const result = await action();
              if (!result.ok) setError(result.error);
              else router.refresh();
            } catch {
              setError("Failed. Try again.");
            }
          });
        }}
      >
        {pending ? "..." : children}
      </Button>
      {error && <span className="text-xs text-red-600">{error}</span>}
    </>
  );
}
