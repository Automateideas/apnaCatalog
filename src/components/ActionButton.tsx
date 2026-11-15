"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { ActionResult } from "@/lib/utils";

/** A button that runs a server action, then reloads the page data. */
export function ActionButton({
  action,
  children,
  className = "btn-outline",
  confirm,
}: {
  action: () => Promise<ActionResult>;
  children: React.ReactNode;
  className?: string;
  confirm?: string;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  return (
    <>
      <button
        type="button"
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
      </button>
      {error && <span className="text-xs text-red-600">{error}</span>}
    </>
  );
}
