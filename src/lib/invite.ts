import "server-only";
import { and, eq, isNotNull, isNull } from "drizzle-orm";
import { db } from "@/db";
import { shops } from "@/db/schema";
import { INVITE_REWARD_MONTHS } from "@/lib/catalog-config";
import { siteUrl } from "@/lib/utils";

type Tx = Parameters<Parameters<typeof db.transaction>[0]>[0];
type PlanFields = { plan: string; planExpiresAt: Date | null };

export function inviteUrl(slug: string): string {
  return `${siteUrl()}/invite/${slug}`;
}

/**
 * The end date after adding paid months. Time is added to what the shop already has,
 * so a grant never shortens a plan.
 */
export function addPaidMonths(current: PlanFields, months: number): Date {
  const stillActive =
    current.plan === "paid" && current.planExpiresAt && current.planExpiresAt > new Date();
  const expires = stillActive ? new Date(current.planExpiresAt!) : new Date();
  expires.setMonth(expires.getMonth() + months);
  return expires;
}

/**
 * Call when a shop is given paid time. The first time this happens for a shop that joined
 * through an invite link, the inviting shop gets its free month. Later calls do nothing.
 */
export async function rewardInviter(tx: Tx, shopId: string): Promise<void> {
  // Claiming the reward and checking it is unclaimed happen in one statement,
  // so two grants at the same moment cannot both pay out.
  const [claimed] = await tx
    .update(shops)
    .set({ inviteRewardedAt: new Date() })
    .where(and(eq(shops.id, shopId), isNotNull(shops.invitedBy), isNull(shops.inviteRewardedAt)))
    .returning({ invitedBy: shops.invitedBy });
  if (!claimed?.invitedBy) return;

  const [inviter] = await tx
    .select({ plan: shops.plan, planExpiresAt: shops.planExpiresAt })
    .from(shops)
    .where(eq(shops.id, claimed.invitedBy))
    .limit(1)
    .for("update");
  if (!inviter) return;
  // A paid plan with no end date cannot be made longer.
  if (inviter.plan === "paid" && !inviter.planExpiresAt) return;

  await tx
    .update(shops)
    .set({ plan: "paid", planExpiresAt: addPaidMonths(inviter, INVITE_REWARD_MONTHS) })
    .where(eq(shops.id, claimed.invitedBy));
}
