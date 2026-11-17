import { count, eq } from "drizzle-orm";
import { db } from "@/db";
import { shops, type Shop } from "@/db/schema";
import { CopyButton } from "@/components/CopyButton";
import { INVITE_REWARD_MONTHS } from "@/lib/catalog-config";
import { inviteUrl } from "@/lib/invite";
import { SITE_NAME, waShareLink } from "@/lib/utils";
import { Card } from "@/components/ui/card";
import { buttonVariants } from "@/components/ui/button";

const plural = (n: number, word: string) => `${n} ${word}${n === 1 ? "" : "s"}`;

/** The shop's invite link, and how many sellers it has brought in so far. */
export async function InviteCard({ shop }: { shop: Pick<Shop, "id" | "slug"> }) {
  const [{ joined, rewarded }] = await db
    .select({ joined: count(), rewarded: count(shops.inviteRewardedAt) })
    .from(shops)
    .where(eq(shops.invitedBy, shop.id));

  const url = inviteUrl(shop.slug);
  const shareText = `I made an online catalog for my shop on ${SITE_NAME}. Customers see my items and order on WhatsApp. Make yours free:\n${url}`;

  return (
    <Card className="p-5">
      <h2 className="font-bold text-slate-900">Invite a seller</h2>
      <p className="mt-1 text-sm text-slate-600">
        When a seller who joined through your invite link starts a paid plan for the first time,
        you get one month free.
      </p>
      <p className="mt-3 text-sm text-slate-500">Your invite link</p>
      <p className="font-semibold break-all text-slate-900">{url.replace(/^https?:\/\//, "")}</p>
      <div className="mt-3 flex flex-wrap gap-2">
        <a
          href={waShareLink(shareText)}
          target="_blank"
          rel="noopener noreferrer"
          className={buttonVariants({ variant: "whatsapp" })}
        >
          Invite on WhatsApp
        </a>
        <CopyButton text={url} label="Copy invite link" />
      </div>
      {joined > 0 && (
        <p className="mt-3 text-sm text-slate-600">
          {plural(joined, "seller")} joined through your link.{" "}
          {rewarded > 0
            ? `You earned ${plural(rewarded * INVITE_REWARD_MONTHS, "free month")}.`
            : "No one has started a paid plan yet."}
        </p>
      )}
    </Card>
  );
}
