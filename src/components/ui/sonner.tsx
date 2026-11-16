"use client";

import { Toaster as Sonner, type ToasterProps } from "sonner";

/** Toast messages. Shown at the top so they never cover the cart bar or a bottom sheet. */
function Toaster(props: ToasterProps) {
  return (
    <Sonner
      theme="light"
      position="top-center"
      richColors
      duration={4000}
      style={
        {
          "--normal-bg": "var(--popover)",
          "--normal-text": "var(--popover-foreground)",
          "--normal-border": "var(--border)",
          "--border-radius": "var(--radius)",
        } as React.CSSProperties
      }
      toastOptions={{ classNames: { toast: "font-sans text-sm" } }}
      {...props}
    />
  );
}

export { Toaster };
