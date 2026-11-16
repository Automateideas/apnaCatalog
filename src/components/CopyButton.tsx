"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

type ButtonProps = React.ComponentProps<typeof Button>;

export function CopyButton({
  text,
  variant = "outline",
  size,
  className,
  label = "Copy link",
}: {
  text: string;
  variant?: ButtonProps["variant"];
  size?: ButtonProps["size"];
  className?: string;
  label?: string;
}) {
  const [copied, setCopied] = useState(false);
  return (
    <Button
      type="button"
      variant={variant}
      size={size}
      className={className}
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(text);
          setCopied(true);
          setTimeout(() => setCopied(false), 2000);
        } catch {
          // Clipboard is blocked (old browser or no permission): show the link to copy by hand.
          toast.error("Could not copy. Long-press the link to copy it.", {
            description: text,
            duration: 15000,
          });
        }
      }}
    >
      {copied ? "Copied" : label}
    </Button>
  );
}
