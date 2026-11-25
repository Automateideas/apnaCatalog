import type { Metadata } from "next";
import Link from "next/link";
import { getUser } from "@/lib/auth";
import { PLANS } from "@/lib/catalog-config";
import { SITE_NAME } from "@/lib/utils";
import { PlanCards } from "@/components/PlanCards";
import { SiteFooter, SiteHeader } from "@/components/SiteChrome";
import { buttonVariants } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "Pricing",
  description: `${SITE_NAME} is free for up to ${PLANS.free.items} items. Paid plans from ₹${PLANS.starter.priceMonthly}/month for more items, more photos and a featured listing.`,
  alternates: { canonical: "/pricing" },
};

const FAQ: [string, string][] = [
  ["Do I need to pay to start?", `No. Every business starts on the Free plan, with up to ${PLANS.free.items} items. No card needed.`],
  ["How do I pay for a plan?", "From your dashboard, message us on WhatsApp and pay by UPI. We switch on the plan for your business."],
  ["What happens when a plan ends?", "Your business moves to the Free plan. Nothing is deleted and your catalog stays online."],
  ["Do customers pay anything?", "No. Customers see your catalog and send orders on WhatsApp for free."],
];

export default async function PricingPage() {
  const user = await getUser();
  const start = user ? "/dashboard/plan" : "/login";

  return (
    <>
      <SiteHeader signedIn={Boolean(user)} />
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-10 sm:px-6">
        <h1 className="text-3xl font-extrabold text-slate-900 sm:text-4xl">Simple prices for every business</h1>
        <p className="mt-2 max-w-2xl text-lg text-slate-600">
          Start free. Upgrade when you need more items, more photos or a featured spot on the home page.
        </p>

        <div className="mt-8">
          <PlanCards
            action={(plan) => (
              <Link
                href={start}
                className={buttonVariants({ variant: plan.id === "free" ? "outline" : "default", className: "mt-4" })}
              >
                {plan.id === "free" ? "Start free" : user ? `Choose ${plan.name}` : "Start free, upgrade anytime"}
              </Link>
            )}
          />
        </div>
        <p className="mt-3 text-sm text-slate-500">Prices in Indian rupees. Pay monthly, or yearly and get 2 months free.</p>

        <section className="mt-12 max-w-2xl">
          <h2 className="text-2xl font-bold text-slate-900">Questions</h2>
          <dl className="mt-4 space-y-4">
            {FAQ.map(([q, a]) => (
              <div key={q}>
                <dt className="font-semibold text-slate-900">{q}</dt>
                <dd className="mt-0.5 text-slate-600">{a}</dd>
              </div>
            ))}
          </dl>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
