import Link from "next/link";
import { desc, eq, isNull } from "drizzle-orm";
import { db } from "@/db";
import { items, reports, shops } from "@/db/schema";
import { adminSetShopHidden } from "@/app/actions/admin";
import { resolveReport } from "@/app/actions/reports";
import { ActionButton } from "@/components/ActionButton";
import { reasonLabel } from "@/lib/report-reasons";
import { formatDateTime } from "@/lib/utils";

/** Reports nobody has closed yet, newest first. Each has its contact, so the team can follow up. */
export async function OpenReports() {
  const rows = await db
    .select({
      id: reports.id,
      reason: reports.reason,
      details: reports.details,
      contact: reports.contact,
      createdAt: reports.createdAt,
      itemId: reports.itemId,
      itemName: items.name,
      shopId: shops.id,
      shopName: shops.name,
      shopSlug: shops.slug,
      shopHidden: shops.isHidden,
    })
    .from(reports)
    .innerJoin(shops, eq(shops.id, reports.shopId))
    .leftJoin(items, eq(items.id, reports.itemId))
    .where(isNull(reports.resolvedAt))
    .orderBy(desc(reports.createdAt))
    .limit(50);

  return (
    <section>
      <h2 className="font-bold text-slate-900">Reports{rows.length > 0 && ` (${rows.length} open)`}</h2>
      {rows.length === 0 ? (
        <p className="mt-2 text-sm text-slate-500">No open reports.</p>
      ) : (
        <ul className="mt-3 space-y-2">
          {rows.map((r) => (
            <li key={r.id} className="flex flex-wrap items-start justify-between gap-3 rounded-xl border bg-card p-4">
              <div className="min-w-0 text-sm">
                <p className="font-semibold text-red-700">{reasonLabel(r.reason)}</p>
                <p className="text-slate-800">
                  <Link href={`/${r.shopSlug}`} target="_blank" className="font-medium text-brand underline">
                    {r.shopName}
                  </Link>
                  {r.itemId && r.itemName && (
                    <>
                      {" · "}
                      <Link href={`/${r.shopSlug}/i/${r.itemId}`} target="_blank" className="text-brand underline">
                        {r.itemName}
                      </Link>
                    </>
                  )}
                  {r.shopHidden && <span className="ml-2 text-xs font-semibold text-slate-500">(shop hidden)</span>}
                </p>
                {r.details && <p className="mt-1 whitespace-pre-line text-slate-600">&ldquo;{r.details}&rdquo;</p>}
                <p className="mt-1 text-xs text-slate-500">
                  {formatDateTime(r.createdAt)}
                  {r.contact && ` · Reporter: ${r.contact}`}
                </p>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {!r.shopHidden && (
                  <ActionButton
                    size="xs"
                    destructive
                    action={adminSetShopHidden.bind(null, r.shopId, true)}
                    confirm={`Hide ${r.shopName}? Customers will not be able to open it.`}
                    success={`${r.shopName} is hidden.`}
                  >
                    Hide shop
                  </ActionButton>
                )}
                <ActionButton size="xs" action={resolveReport.bind(null, r.id)} success="Report closed.">
                  Mark done
                </ActionButton>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
