"use client";

import { useState } from "react";
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
          window.prompt("Copy this link:", text);
        }
      }}
    >
      {copied ? "Copied" : label}
    </Button>
  );
}
