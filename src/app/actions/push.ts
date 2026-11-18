"use server";

import { and, eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/db";
import { pushSubscriptions } from "@/db/schema";
import { getUser } from "@/lib/auth";
import { pushToUsers } from "@/lib/push";
import type { ActionResult } from "@/lib/utils";

const subscription = z.object({
  endpoint: z.url().max(1000),
  keys: z.object({ p256dh: z.string().max(200), auth: z.string().max(100) }),
});

/** Remembers this browser for the logged-in user's notifications. */
export async function savePushSubscription(raw: unknown): Promise<ActionResult> {
  const user = await getUser();
  if (!user) return { ok: false, error: "Please log in again." };
  const parsed = subscription.safeParse(raw);
  if (!parsed.success) return { ok: false, error: "This browser cannot get notifications." };
  const { endpoint, keys } = parsed.data;
  await db
    .insert(pushSubscriptions)
    .values({ userId: user.id, endpoint, p256dh: keys.p256dh, auth: keys.auth })
    .onConflictDoUpdate({
      target: pushSubscriptions.endpoint,
      set: { userId: user.id, p256dh: keys.p256dh, auth: keys.auth },
    });
  return { ok: true };
}

/** Forgets this browser (notifications turned off here). */
export async function removePushSubscription(endpoint: string): Promise<void> {
  const user = await getUser();
  if (!user || typeof endpoint !== "string") return;
  await db
    .delete(pushSubscriptions)
    .where(and(eq(pushSubscriptions.endpoint, endpoint), eq(pushSubscriptions.userId, user.id)));
}

/** A test notification to all of the user's browsers. */
export async function sendTestPush(): Promise<ActionResult> {
  const user = await getUser();
  if (!user) return { ok: false, error: "Please log in again." };
  await pushToUsers([user.id], {
    title: "Notifications are on",
    body: "You will get new orders and reports here.",
    url: "/dashboard",
    tag: "test",
  });
  return { ok: true };
}
