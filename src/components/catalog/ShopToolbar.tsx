"use client";

import { DarkModeToggle } from "@/components/DarkModeToggle";

export function ShopToolbar() {
  return (
    <div className="no-print fixed top-3 right-3 z-50 flex items-center rounded-full bg-black/40 px-1 py-0.5 text-white backdrop-blur-md [&_button]:text-white/80 [&_button]:hover:bg-white/20 [&_button]:hover:text-white">
      <DarkModeToggle />
    </div>
  );
}
