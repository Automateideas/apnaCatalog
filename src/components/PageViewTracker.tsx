"use client";

import { useEffect } from "react";
import { recordPageView } from "@/app/actions/analytics";

export function PageViewTracker({ shopId, path }: { shopId: string; path: string }) {
  useEffect(() => {
    const key = `ac-pv-${shopId}-${path}`;
    try {
      if (sessionStorage.getItem(key)) return;
      sessionStorage.setItem(key, "1");
    } catch {}
    const referrer = document.referrer || null;
    recordPageView(shopId, path, referrer);
  }, [shopId, path]);
  return null;
}
