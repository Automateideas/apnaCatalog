import type { Metadata } from "next";
import Link from "next/link";
import { Grievance } from "@/components/Grievance";
import { SiteFooter, SiteHeader } from "@/components/SiteChrome";
import { SITE_NAME } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Terms of use",
  description: `Rules for using ${SITE_NAME}.`,
};

export default function TermsPage() {
  return (
    <>
      <SiteHeader signedIn={false} />
      <main className="mx-auto w-full max-w-2xl flex-1 space-y-4 px-4 py-8 text-slate-700">
        <h1 className="text-2xl font-bold text-slate-900">Terms of use</h1>
        <p>
          {SITE_NAME} is a catalog and listing service. We show what shops publish and help
          customers contact them. We are not the seller and we do not handle payment or delivery.
        </p>

        <h2 className="pt-2 text-lg font-bold text-slate-900">For shopkeepers</h2>
        <ul className="list-disc space-y-1 pl-5">
          <li>List only your own real shop, with correct prices and contact details.</li>
          <li>Do not list illegal, counterfeit or restricted goods.</li>
          <li>
            Do not post content that is obscene, defamatory, hateful, misleading, harms children,
            infringes someone&apos;s rights, impersonates someone, threatens India&apos;s unity or
            public order, or contains viruses.
          </li>
          <li>Use only photos you are allowed to use.</li>
          <li>Do not write reviews for your own shop or pay for reviews.</li>
          <li>Use customer phone numbers only to serve those customers, not for spam.</li>
        </ul>
        <p>
          We may hide or remove a shop, item or review that breaks these rules, and block the
          account. You must be 18 or older to open a shop.
        </p>

        <h2 className="pt-2 text-lg font-bold text-slate-900">For customers</h2>
        <ul className="list-disc space-y-1 pl-5">
          <li>
            Prices and stock are entered by the shop. The shop confirms the final price and
            availability when you order.
          </li>
          <li>Any payment, delivery, return or dispute is between you and the shop.</li>
          <li>Write honest reviews about your own experience.</li>
        </ul>

        <h2 className="pt-2 text-lg font-bold text-slate-900">Plans</h2>
        <p>
          The free plan stays free within its limits. Paid plan features and prices are shown in
          the dashboard. When a paid plan ends, the shop moves to the free plan and nothing is
          deleted.
        </p>
        <p>
          Invite a seller: when a seller who joined through your invite link starts a paid plan
          for the first time, you get one month of the paid plan free. Inviting yourself or making
          fake shops to earn free months is not allowed, and we may take such months back.
        </p>

        <h2 className="pt-2 text-lg font-bold text-slate-900">No warranty</h2>
        <p>
          The service is provided as it is. We try to keep it running and correct, but we cannot
          promise it will always be available or free of mistakes.
        </p>

        <h2 className="pt-2 text-lg font-bold text-slate-900">Law</h2>
        <p>
          These terms follow the laws of India. How we handle personal data is explained in the{" "}
          <Link href="/privacy" className="text-brand underline">
            privacy policy
          </Link>
          .
        </p>

        <Grievance />
      </main>
      <SiteFooter />
    </>
  );
}
