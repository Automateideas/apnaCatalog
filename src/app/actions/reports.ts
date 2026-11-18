"use server";

import { createHash } from "node:crypto";
import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { and, count, eq, gte, isNull } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/db";
import { items, reports, shops } from "@/db/schema";
import { getShopByOwner, getUser, requireAdmin } from "@/lib/auth";
import { escapeHtml, sendEmail } from "@/lib/email";
import { adminUserIds, pushToUsers } from "@/lib/push";
import { REPORT_REASONS, reasonLabel } from "@/lib/report-reasons";
import { siteUrl, type ActionResult } from "@/lib/utils";

const input = z.object({
  shopId: z.uuid(),
  itemId: z.uuid().optional().nullable(),
  reason: z.enum(REPORT_REASONS.map((r) => r.id) as [string, ...string[]], "Choose a reason."),
  details: z.string().trim().max(1000).optional(),
  contact: z.string().trim().max(100).optional(),
});

/** One phone or computer may send this many reports per hour. */
const REPORTS_PER_CLIENT_PER_HOUR = 5;

async function clientHash(): Promise<string | null> {
  const h = await headers();
  const ip = h.get("x-forwarded-for")?.split(",")[0]?.trim() || h.get("x-real-ip");
  return ip ? createHash("sha256").update(`report:${ip}`).digest("hex").slice(0, 32) : null;
}

/** Saves a visitor's report, then emails the Apnacatalog team (ADMIN_EMAILS). */
export async function createReport(raw: z.input<typeof input>): Promise<ActionResult> {
  const parsed = input.safeParse(raw);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0].message };
  const data = parsed.data;

  const hash = await clientHash();
  if (hash) {
    const hourAgo = new Date(Date.now() - 3600_000);
    const [{ recent }] = await db
      .select({ recent: count() })
      .from(reports)
      .where(and(eq(reports.clientHash, hash), gte(reports.createdAt, hourAgo)));
    if (recent >= REPORTS_PER_CLIENT_PER_HOUR) {
      return { ok: false, error: "Too many reports in a short time. Please try again later." };
    }
  }

  const [shop] = await db
    .select({ id: shops.id, name: shops.name, slug: shops.slug, ownerEmail: shops.ownerEmail, ownerId: shops.ownerId })
    .from(shops)
    .where(eq(shops.id, data.shopId))
    .limit(1);
  if (!shop) return { ok: false, error: "Shop not found." };

  let itemName: string | null = null;
  if (data.itemId) {
    const [item] = await db
      .select({ name: items.name })
      .from(items)
      .where(and(eq(items.id, data.itemId), eq(items.shopId, shop.id)))
      .limit(1);
    if (!item) return { ok: false, error: "Item not found." };
    itemName = item.name;
  }

  await db.insert(reports).values({
    shopId: shop.id,
    itemId: data.itemId ?? null,
    reason: data.reason,
    details: data.details || null,
    contact: data.contact || null,
    clientHash: hash,
  });

  // Phone notifications: the shop owner sees it on the bell page, the team in admin.
  const what = itemName ? `"${itemName}"` : "your shop";
  await Promise.all([
    pushToUsers([shop.ownerId], {
      title: "A customer reported " + what,
      body: `${reasonLabel(data.reason)}. Please check it.`,
      url: "/dashboard/reports",
      tag: "report",
    }),
    adminUserIds().then((ids) =>
      pushToUsers(ids, {
        title: `Report: ${reasonLabel(data.reason)}`,
        body: `${shop.name}${itemName ? ` · ${itemName}` : ""}`,
        url: "/admin",
        tag: "admin-report",
      }),
    ),
  ]);

  const admins = (process.env.ADMIN_EMAILS ?? "")
    .split(",")
    .map((e) => e.trim())
    .filter(Boolean);
  const shopUrl = `${siteUrl()}/${shop.slug}`;
  const itemUrl = data.itemId ? `${shopUrl}/i/${data.itemId}` : null;
  const row = (label: string, value: string) =>
    `<tr><td style="padding:4px 12px 4px 0;color:#64748b">${label}</td><td style="padding:4px 0">${value}</td></tr>`;
  await sendEmail(
    admins,
    `Report: ${reasonLabel(data.reason)} - ${shop.name}`,
    `<h2 style="font-family:sans-serif">New report on Apnacatalog</h2>
<table style="font-family:sans-serif;font-size:14px">
${row("Reason", escapeHtml(reasonLabel(data.reason)))}
${row("Shop", `<a href="${shopUrl}">${escapeHtml(shop.name)}</a> (/${escapeHtml(shop.slug)})`)}
${itemUrl && itemName ? row("Item", `<a href="${itemUrl}">${escapeHtml(itemName)}</a>`) : ""}
${row("Details", escapeHtml(data.details || "-").replace(/\n/g, "<br>"))}
${row("Reporter contact", escapeHtml(data.contact || "-"))}
${row("Shop login", escapeHtml(shop.ownerEmail || "-"))}
${row("Time", new Date().toLocaleString("en-IN", { timeZone: "Asia/Kolkata" }))}
</table>
<p style="font-family:sans-serif;font-size:14px">Review it in the admin page: <a href="${siteUrl()}/admin">${siteUrl()}/admin</a>.
Content that shows nudity or sexual material must be removed within 24 hours.</p>`,
  );
  return { ok: true };
}

/** The shop owner opened their notifications: their reports no longer count on the bell. */
export async function markReportsSeen(): Promise<void> {
  const user = await getUser();
  if (!user) return;
  const shop = await getShopByOwner(user.id);
  if (!shop) return;
  await db
    .update(reports)
    .set({ seenByShopAt: new Date() })
    .where(and(eq(reports.shopId, shop.id), isNull(reports.seenByShopAt)));
}

/** Admin: closes a report after acting on it. */
export async function resolveReport(id: string): Promise<ActionResult> {
  await requireAdmin();
  if (!z.uuid().safeParse(id).success) return { ok: false, error: "Report not found." };
  await db.update(reports).set({ resolvedAt: new Date() }).where(eq(reports.id, id));
  revalidatePath("/admin");
  return { ok: true };
}
