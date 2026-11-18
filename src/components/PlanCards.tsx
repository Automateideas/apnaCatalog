import { Check } from "lucide-react";
import { FREE_ORDER_HISTORY, PAID_PLAN_IDS, type Plan, type PlanId, PLANS } from "@/lib/catalog-config";
import { cx, SITE_NAME } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";

/** Every plan, cheapest first. */
export const ALL_PLANS: Plan[] = [PLANS.free, ...PAID_PLAN_IDS.map((id) => PLANS[id])];

/** What a plan gives, one line each. */
export function planFeatures(plan: Plan): string[] {
  return [
    plan.items === null ? "Unlimited items" : `Up to ${plan.items} items`,
    `${plan.photos} photos per item`,
    plan.id === "free" ? `Last ${FREE_ORDER_HISTORY} orders` : "All orders",
    plan.hideBranding ? `Hide "Made with ${SITE_NAME}"` : `"Made with ${SITE_NAME}" shown`,
    ...(plan.featured ? ["Featured on the home page, shown first"] : []),
    "WhatsApp orders, reviews, QR code, all themes",
  ];
}

/**
 * The plan cards, used on the public pricing page and in the dashboard.
 * `action` draws each card's button (sign up, choose on WhatsApp...).
 */
export function PlanCards({
  current,
  action,
}: {
  /** The shop's plan, marked "Current". */
  current?: PlanId;
  action?: (plan: Plan, isCurrent: boolean) => React.ReactNode;
}) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {ALL_PLANS.map((plan) => {
        const isCurrent = plan.id === current;
        const popular = plan.id === "pro" && !isCurrent;
        return (
          <Card
            key={plan.id}
            className={cx("flex flex-col p-5", isCurrent && "border-2 border-brand", popular && "border-2 border-tag")}
          >
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-bold text-slate-900">{plan.name}</h2>
              {isCurrent && <Badge>Current</Badge>}
              {popular && <Badge className="bg-tag text-ink">Popular</Badge>}
            </div>
            <p className="text-sm text-slate-500">{plan.bestFor}</p>
            <p className="mt-3 text-2xl font-bold text-slate-900">
              ₹{plan.priceMonthly}
              <span className="text-sm font-normal text-slate-500">{plan.priceMonthly === 0 ? " forever" : "/month"}</span>
            </p>
            {plan.priceYearly > 0 && (
              <p className="text-sm text-slate-600">or ₹{plan.priceYearly.toLocaleString("en-IN")}/year (2 months free)</p>
            )}
            <ul className="mt-4 flex-1 space-y-1.5 text-sm text-slate-700">
              {planFeatures(plan).map((line) => (
                <li key={line} className="flex gap-2">
                  <Check className="mt-0.5 size-4 shrink-0 text-emerald-600" aria-hidden="true" />
                  {line}
                </li>
              ))}
            </ul>
            {action?.(plan, isCurrent)}
          </Card>
        );
      })}
    </div>
  );
}
