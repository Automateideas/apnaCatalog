import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { orders, shops } from "@/db/schema";
import { PrintButton } from "@/components/PrintButton";
import { formatPriceRange, maxTotalOf } from "@/lib/item-options";
import { formatDateTime, SITE_NAME } from "@/lib/utils";
import { Card } from "@/components/ui/card";
import { buttonVariants } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableFooter, TableHead, TableHeader, TableRow } from "@/components/ui/table";

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
    <main className="mx-auto w-full max-w-2xl flex-1 px-4 py-6 sm:px-6">
      <Card className="p-5 print:border-0 print:shadow-none">
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

        <Table className="mt-3 w-full text-sm">
          <TableHeader>
            <TableRow className="border-b border-slate-200 text-left text-slate-500">
              <TableHead className="py-2 pr-2 font-medium">#</TableHead>
              <TableHead className="py-2 pr-2 font-medium">Item</TableHead>
              <TableHead className="py-2 pr-2 text-right font-medium">Price</TableHead>
              <TableHead className="py-2 pr-2 text-right font-medium">Qty</TableHead>
              <TableHead className="py-2 text-right font-medium">Amount</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {order.lines.map((line, i) => (
              <TableRow key={`${line.itemId}-${i}`} className="border-b border-slate-100 align-top">
                <TableCell className="py-2 pr-2 text-slate-500">{i + 1}</TableCell>
                <TableCell className="py-2 pr-2">
                  {line.name}
                  {line.option && <span className="text-slate-700"> - {line.option}</span>}
                  {line.unit && <span className="text-slate-500"> ({line.unit})</span>}
                </TableCell>
                <TableCell className="py-2 pr-2 text-right whitespace-nowrap">{formatPriceRange(line.price, line.maxPrice)}</TableCell>
                <TableCell className="py-2 pr-2 text-right">{line.qty}</TableCell>
                <TableCell className="py-2 text-right font-medium whitespace-nowrap">
                  {formatPriceRange(line.price * line.qty, line.maxPrice ? line.maxPrice * line.qty : null)}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
          <TableFooter>
            <TableRow>
              <TableCell colSpan={4} className="pt-3 pr-2 text-right font-semibold">
                Total
              </TableCell>
              <TableCell className="pt-3 text-right text-lg font-bold whitespace-nowrap">
                {formatPriceRange(order.total, maxTotalOf(order.lines))}
              </TableCell>
            </TableRow>
          </TableFooter>
        </Table>

        <p className="mt-5 text-xs text-slate-500">
          This is an order request, not a bill. No payment has been made. The shop will confirm the
          final price and availability.
        </p>
      </Card>

      <div className="no-print mt-4 flex flex-col gap-2 sm:flex-row">
        <PrintButton>Save as PDF / Print</PrintButton>
        <Link href={`/${row.shopSlug}`} className={buttonVariants({ variant: "outline" })}>
          Back to {row.shopName}
        </Link>
      </div>
      <p className="no-print mt-6 text-center text-xs text-slate-400">Sent with {SITE_NAME}</p>
    </main>
  );
}
