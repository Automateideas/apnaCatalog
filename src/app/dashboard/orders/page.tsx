import Link from "next/link";
import { count, desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { orders } from "@/db/schema";
import { requireShop } from "@/lib/auth";
import { FREE_ORDER_HISTORY, isPaid } from "@/lib/catalog-config";
import { formatPriceRange, maxTotalOf } from "@/lib/item-options";
import { formatDateTime } from "@/lib/utils";
import { IconBadge } from "@/components/Icon";
import { Card } from "@/components/ui/card";

export default async function OrdersPage() {
  const { shop } = await requireShop();
  const paid = isPaid(shop);

  const [rows, [{ total }]] = await Promise.all([
    db
      .select()
      .from(orders)
      .where(eq(orders.shopId, shop.id))
      .orderBy(desc(orders.createdAt))
      .limit(paid ? 300 : FREE_ORDER_HISTORY),
    db.select({ total: count() }).from(orders).where(eq(orders.shopId, shop.id)),
  ]);

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-bold text-slate-900">Orders</h1>
        <p className="text-sm text-slate-500">
          Orders customers sent you on WhatsApp from your catalog. {total} in total.
        </p>
      </div>

      {rows.length === 0 ? (
        <Card className="px-6 py-12 text-center">
          <IconBadge name="receipt" />
          <p className="mt-3 font-semibold text-slate-900">No orders yet</p>
          <p className="mt-1 text-sm text-slate-600">
            Share your shop link. When a customer sends an order, it shows up here too.
          </p>
        </Card>
      ) : (
        <ul className="rounded-xl border bg-card divide-y divide-slate-100">
          {rows.map((order) => (
            <li key={order.id}>
              <Link
                href={`/o/${order.id}`}
                target="_blank"
                className="flex items-center justify-between gap-3 p-4 hover:bg-slate-50"
              >
                <div className="min-w-0">
                  <p className="font-medium text-slate-900">
                    #{order.id.toUpperCase()}
                    {order.customerName && (
                      <span className="font-normal text-slate-600"> from {order.customerName}</span>
                    )}
                  </p>
                  <p className="truncate text-sm text-slate-500">
                    {formatDateTime(order.createdAt)}:{" "}
                    {order.lines.map((l) => `${l.name}${l.option ? ` - ${l.option}` : ""} × ${l.qty}`).join(", ")}
                  </p>
                </div>
                <span className="shrink-0 font-bold text-slate-900">{formatPriceRange(order.total, maxTotalOf(order.lines))}</span>
              </Link>
            </li>
          ))}
        </ul>
      )}

      {!paid && total > FREE_ORDER_HISTORY && (
        <p className="rounded-xl bg-amber-50 px-4 py-3 text-sm text-amber-900">
          The free plan shows your last {FREE_ORDER_HISTORY} orders.{" "}
          <Link href="/dashboard/plan" className="font-semibold underline">
            Upgrade to see all {total}
          </Link>
        </p>
      )}
    </div>
  );
}
