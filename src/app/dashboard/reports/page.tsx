import Link from "next/link";
import { desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { items, reports } from "@/db/schema";
import { requireShop } from "@/lib/auth";
import { reasonLabel } from "@/lib/report-reasons";
import { formatDateTime } from "@/lib/utils";
import { Card } from "@/components/ui/card";
import { MarkReportsSeen } from "./MarkReportsSeen";

/** Reports visitors sent about this shop. The reporter's contact is never shown here. */
export default async function ReportsPage() {
  const { shop } = await requireShop();
  const rows = await db
    .select({
      id: reports.id,
      reason: reports.reason,
      details: reports.details,
      itemId: reports.itemId,
      itemName: items.name,
      seen: reports.seenByShopAt,
      resolved: reports.resolvedAt,
      createdAt: reports.createdAt,
    })
    .from(reports)
    .leftJoin(items, eq(items.id, reports.itemId))
    .where(eq(reports.shopId, shop.id))
    .orderBy(desc(reports.createdAt))
    .limit(50);
  const unseen = rows.some((r) => !r.seen);

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold text-slate-900">Notifications</h1>
      {unseen && <MarkReportsSeen />}

      {rows.length === 0 ? (
        <Card className="p-6 text-center text-slate-600">No notifications. All good.</Card>
      ) : (
        <>
          <p className="text-sm text-slate-600">
            Visitors reported these. Please check them: remove or fix anything that breaks the rules. Our team
            reviews every report and may hide items or the shop.
          </p>
          <ul className="space-y-3">
            {rows.map((r) => (
              <li key={r.id}>
                <Card className={r.seen ? "p-4" : "border-2 border-amber-300 p-4"}>
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="font-semibold text-slate-900">{reasonLabel(r.reason)}</p>
                    <span className="text-xs text-slate-500">{formatDateTime(r.createdAt)}</span>
                  </div>
                  <p className="mt-1 text-sm text-slate-700">
                    {r.itemId && r.itemName ? (
                      <>
                        Item:{" "}
                        <Link href={`/${shop.slug}/i/${r.itemId}`} target="_blank" className="font-medium text-brand underline">
                          {r.itemName}
                        </Link>
                      </>
                    ) : (
                      "About your whole shop"
                    )}
                  </p>
                  {r.details && <p className="mt-1 text-sm whitespace-pre-line text-slate-600">&ldquo;{r.details}&rdquo;</p>}
                  {r.resolved && <p className="mt-2 text-xs font-medium text-emerald-700">Closed by the Apnacatalog team</p>}
                </Card>
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
}
