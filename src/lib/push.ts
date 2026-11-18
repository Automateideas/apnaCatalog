import "server-only";
import webpush from "web-push";
import { inArray } from "drizzle-orm";
import { db } from "@/db";
import { pushSubscriptions, user } from "@/db/schema";
import { siteUrl } from "@/lib/utils";

const PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY ?? "";
const PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY ?? "";

let ready = false;
function setup(): boolean {
  if (ready) return true;
  if (!PUBLIC_KEY || !PRIVATE_KEY) return false;
  // The "subject" tells push services who sends; the site address is allowed instead of an email.
  const site = siteUrl();
  webpush.setVapidDetails(site.startsWith("https://") ? site : "https://apnacatalog.vercel.app", PUBLIC_KEY, PRIVATE_KEY);
  ready = true;
  return true;
}

export type PushMessage = {
  title: string;
  body: string;
  /** Page to open when the notification is tapped. */
  url: string;
  /** Same tag replaces an older notification instead of stacking. */
  tag?: string;
};

/**
 * Sends a notification to every browser these logins turned notifications on in.
 * Browsers that stopped accepting (unsubscribed, uninstalled) are forgotten. Never throws.
 */
export async function pushToUsers(userIds: string[], message: PushMessage): Promise<void> {
  if (userIds.length === 0 || !setup()) return;
  try {
    const subs = await db.select().from(pushSubscriptions).where(inArray(pushSubscriptions.userId, userIds));
    const gone: string[] = [];
    await Promise.all(
      subs.map(async (s) => {
        try {
          await webpush.sendNotification(
            { endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } },
            JSON.stringify(message),
            { TTL: 60 * 60 * 24 },
          );
        } catch (error) {
          const status = (error as { statusCode?: number }).statusCode;
          if (status === 404 || status === 410) gone.push(s.endpoint);
          else console.error("Push not sent", status ?? error);
        }
      }),
    );
    if (gone.length > 0) await db.delete(pushSubscriptions).where(inArray(pushSubscriptions.endpoint, gone));
  } catch (error) {
    console.error("Push not sent", error);
  }
}

/** Login ids of the Apnacatalog team (ADMIN_EMAILS). */
export async function adminUserIds(): Promise<string[]> {
  const emails = (process.env.ADMIN_EMAILS ?? "")
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
  if (emails.length === 0) return [];
  const rows = await db.select({ id: user.id }).from(user).where(inArray(user.email, emails));
  return rows.map((r) => r.id);
}
