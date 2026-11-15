import { requireShop } from "@/lib/auth";
import {
  FREE_ITEM_LIMIT,
  FREE_ORDER_HISTORY,
  isPaid,
  PRICE_MONTHLY,
  PRICE_YEARLY,
} from "@/lib/catalog-config";
import { formatDate, SITE_NAME } from "@/lib/utils";

const ROWS: [string, string, string][] = [
  ["Items", `Up to ${FREE_ITEM_LIMIT}`, "Unlimited"],
  ["Themes", "1 layout, 2 colours", "All layouts and colours"],
  ["Home page listing", "Normal", "Featured, shown first"],
  ["Order history", `Last ${FREE_ORDER_HISTORY} orders`, "All orders"],
  [`"Made with ${SITE_NAME}" label`, "Shown", "Can be hidden"],
  ["WhatsApp orders, reviews, QR code, map", "Yes", "Yes"],
];

export default async function PlanPage() {
  const { shop } = await requireShop();
  const paid = isPaid(shop);
  const support = (process.env.NEXT_PUBLIC_SUPPORT_WHATSAPP ?? "").replace(/\D/g, "");
  const upgradeText = `Hi, I want the paid plan for my shop "${shop.name}" (${shop.slug}) on ${SITE_NAME}.`;
  const helpText = `Hi, I need help with my shop "${shop.name}" (${shop.slug}) on ${SITE_NAME}.`;
  const wa = (text: string) => `https://wa.me/${support}?text=${encodeURIComponent(text)}`;

  return (
    <div className="space-y-5">
      <h1 className="text-xl font-bold text-slate-900">Plan</h1>

      <section className="card p-5">
        <p className="text-sm text-slate-500">Your current plan</p>
        <p className="mt-1 text-2xl font-bold text-slate-900">{paid ? "Paid" : "Free"}</p>
        {paid && shop.planExpiresAt && (
          <p className="mt-1 text-sm text-slate-600">
            Active until <strong>{formatDate(shop.planExpiresAt)}</strong>. After that your shop
            moves to the free plan. Nothing is deleted.
          </p>
        )}
        {!paid && shop.plan === "paid" && (
          <p className="mt-1 text-sm text-amber-800">
            Your paid plan has ended. Your shop and all its items are still online.
          </p>
        )}
      </section>

      <section className="card overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-slate-50 text-left">
              <th className="px-4 py-3 font-medium text-slate-500"> </th>
              <th className="px-4 py-3 font-semibold text-slate-900">Free</th>
              <th className="px-4 py-3 font-semibold text-brand">Paid</th>
            </tr>
          </thead>
          <tbody>
            {ROWS.map(([label, free, paidValue]) => (
              <tr key={label} className="border-t border-slate-100 align-top">
                <th scope="row" className="px-4 py-3 text-left font-medium text-slate-700">
                  {label}
                </th>
                <td className="px-4 py-3 text-slate-600">{free}</td>
                <td className="px-4 py-3 font-medium text-slate-900">{paidValue}</td>
              </tr>
            ))}
            <tr className="border-t border-slate-200 bg-slate-50">
              <th scope="row" className="px-4 py-3 text-left font-medium text-slate-700">
                Price
              </th>
              <td className="px-4 py-3 font-semibold text-slate-900">₹0 forever</td>
              <td className="px-4 py-3 font-semibold text-slate-900">
                ₹{PRICE_YEARLY}/year <span className="font-normal text-slate-500">or ₹{PRICE_MONTHLY}/month</span>
              </td>
            </tr>
          </tbody>
        </table>
      </section>

      {support ? (
        <div className="flex flex-col gap-2 sm:flex-row">
          <a href={wa(upgradeText)} target="_blank" rel="noopener noreferrer" className="btn-whatsapp">
            {paid ? "Renew on WhatsApp" : "Upgrade on WhatsApp"}
          </a>
          <a href={wa(helpText)} target="_blank" rel="noopener noreferrer" className="btn-outline">
            Get help
          </a>
        </div>
      ) : (
        <p className="text-sm text-slate-500">To upgrade, contact the {SITE_NAME} team.</p>
      )}
      <p className="text-xs text-slate-500">
        Message us on WhatsApp, pay by UPI, and we switch on the paid plan for your shop.
      </p>
    </div>
  );
}
