import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { orders, shops } from "@/db/schema";
import { PrintButton } from "@/components/PrintButton";
import { formatDateTime, formatPrice, SITE_NAME } from "@/lib/utils";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Order details",
  robots: { index: false, follow: false },
};

export default async function OrderPage({ params }: PageProps<"/o/[id]">) {
  const { id } = await params;
  if (!/^[a-z0-9]{8}$/.test(id)) notFound();

  const [row] = await db
    .select({
      order: orders,
      shopName: shops.name,
      shopSlug: shops.slug,
      shopCity: shops.city,
      shopAddress: shops.address,
      shopPhone: shops.whatsapp,
    })
    .from(orders)
    .innerJoin(shops, eq(shops.id, orders.shopId))
    .where(eq(orders.id, id))
    .limit(1);
  if (!row) notFound();

  const { order } = row;

  return (
    <main className="mx-auto w-full max-w-2xl flex-1 px-4 py-6">
      <div className="card p-5 print:border-0 print:shadow-none">
        <div className="flex items-start justify-between gap-4 border-b border-slate-200 pb-4">
          <div>
            <h1 className="text-xl font-bold text-slate-900">{row.shopName}</h1>
            <p className="text-sm text-slate-600">
              {[row.shopAddress, row.shopCity].filter(Boolean).join(", ")}
            </p>
            <p className="text-sm text-slate-600">+91 {row.shopPhone}</p>
          </div>
          <div className="text-right text-sm">
            <p className="font-semibold text-slate-900">Order #{order.id.toUpperCase()}</p>
            <p className="text-slate-500">{formatDateTime(order.createdAt)}</p>
          </div>
        </div>

        {(order.customerName || order.note) && (
          <div className="border-b border-slate-200 py-3 text-sm">
            {order.customerName && (
              <p>
                <span className="text-slate-500">Customer:</span> {order.customerName}
              </p>
            )}
            {order.note && (
              <p className="whitespace-pre-line">
                <span className="text-slate-500">Note:</span> {order.note}
              </p>
            )}
          </div>
        )}

        <table className="mt-3 w-full text-sm">
          <thead>
            <tr className="border-b border-slate-200 text-left text-slate-500">
              <th className="py-2 pr-2 font-medium">#</th>
              <th className="py-2 pr-2 font-medium">Item</th>
              <th className="py-2 pr-2 text-right font-medium">Price</th>
              <th className="py-2 pr-2 text-right font-medium">Qty</th>
              <th className="py-2 text-right font-medium">Amount</th>
            </tr>
          </thead>
          <tbody>
            {order.lines.map((line, i) => (
              <tr key={`${line.itemId}-${i}`} className="border-b border-slate-100 align-top">
                <td className="py-2 pr-2 text-slate-500">{i + 1}</td>
                <td className="py-2 pr-2">
                  {line.name}
                  {line.unit && <span className="text-slate-500"> ({line.unit})</span>}
                </td>
                <td className="py-2 pr-2 text-right whitespace-nowrap">{formatPrice(line.price)}</td>
                <td className="py-2 pr-2 text-right">{line.qty}</td>
                <td className="py-2 text-right font-medium whitespace-nowrap">
                  {formatPrice(line.price * line.qty)}
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr>
              <td colSpan={4} className="pt-3 pr-2 text-right font-semibold">
                Total
              </td>
              <td className="pt-3 text-right text-lg font-bold whitespace-nowrap">
                {formatPrice(order.total)}
              </td>
            </tr>
          </tfoot>
        </table>

        <p className="mt-5 text-xs text-slate-500">
          This is an order request, not a bill. No payment has been made. The shop will confirm the
          final price and availability.
        </p>
      </div>

      <div className="no-print mt-4 flex flex-col gap-2 sm:flex-row">
        <PrintButton className="btn-primary">Save as PDF / Print</PrintButton>
        <Link href={`/${row.shopSlug}`} className="btn-outline">
          Back to {row.shopName}
        </Link>
      </div>
      <p className="no-print mt-6 text-center text-xs text-slate-400">Sent with {SITE_NAME}</p>
    </main>
  );
}
