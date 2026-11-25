"use server";

import { db } from "@/db";
import { pageViews } from "@/db/schema";

export async function recordPageView(shopId: string, path: string, referrer: string | null) {
  try {
    await db.insert(pageViews).values({ shopId, path, referrer });
  } catch {
    // Silently ignore — analytics should never break the page.
  }
}
