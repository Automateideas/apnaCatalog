"use client";

import { Button } from "@/components/ui/button";

export function PrintButton({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <Button type="button" className={className} onClick={() => window.print()}>
      {children}
    </Button>
  );
}
