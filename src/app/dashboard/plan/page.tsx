import { requireShop } from "@/lib/auth";
import { type Plan, planOf } from "@/lib/catalog-config";
import { formatDate, SITE_NAME } from "@/lib/utils";
import { PlanCards } from "@/components/PlanCards";
import { Card } from "@/components/ui/card";
import { buttonVariants } from "@/components/ui/button";
import { InviteCard } from "../InviteCard";

export default async function PlanPage() {
  const { shop } = await requireShop();
  const current = planOf(shop);
  const support = (process.env.NEXT_PUBLIC_SUPPORT_WHATSAPP ?? "").replace(/\D/g, "");
  const ask = (plan: Plan) =>
    `https://wa.me/${support}?text=${encodeURIComponent(
      `Hi, I want the ${plan.name} plan (₹${plan.priceMonthly}/month) for my shop "${shop.name}" (${shop.slug}) on ${SITE_NAME}.`,
    )}`;
  const ended = current.id === "free" && shop.plan !== "free";

  return (
    <div className="space-y-5">
      <h1 className="text-xl font-bold text-slate-900">Plan</h1>

      <Card className="p-5">
        <p className="text-sm text-slate-500">Your current plan</p>
        <p className="mt-1 text-2xl font-bold text-slate-900">{current.name}</p>
        {current.id !== "free" && shop.planExpiresAt && (
          <p className="mt-1 text-sm text-slate-600">
            Active until <strong>{formatDate(shop.planExpiresAt)}</strong>. After that your shop moves to the
            free plan. Nothing is deleted.
          </p>
        )}
        {ended && (
          <p className="mt-1 text-sm text-amber-800">
            Your paid plan has ended. Your shop and all its items are still online.
          </p>
        )}
      </Card>

      <PlanCards
        current={current.id}
        action={(plan, isCurrent) =>
          plan.id !== "free" &&
          support && (
            <a
              href={ask(plan)}
              target="_blank"
              rel="noopener noreferrer"
              className={buttonVariants({ variant: isCurrent ? "outline" : "whatsapp", className: "mt-4" })}
            >
              {isCurrent ? "Renew on WhatsApp" : `Choose ${plan.name}`}
            </a>
          )
        }
      />

      <p className="text-xs text-slate-500">
        {support
          ? "Message us on WhatsApp, pay by UPI, and we switch on the plan for your shop."
          : `To upgrade, contact the ${SITE_NAME} team.`}
      </p>

      <InviteCard shop={shop} />
    </div>
  );
}
