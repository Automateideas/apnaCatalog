import type { Metadata } from "next";
import { SiteFooter, SiteHeader } from "@/components/SiteChrome";
import { SITE_NAME } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Privacy policy",
  description: `How ${SITE_NAME} collects and uses information.`,
};

export default function PrivacyPage() {
  return (
    <>
      <SiteHeader signedIn={false} />
      <main className="mx-auto w-full max-w-2xl flex-1 space-y-4 px-4 py-8 text-slate-700">
        <h1 className="text-2xl font-bold text-slate-900">Privacy policy</h1>
        <p>
          {SITE_NAME} lets shops publish a catalog and lets customers send orders and reviews to
          those shops. This page explains what information we keep and who can see it.
        </p>

        <h2 className="pt-2 text-lg font-bold text-slate-900">Shopkeepers</h2>
        <p>
          We store your login email, shop name, city, address, phone and WhatsApp numbers, shop
          location, logo, your name and photo if you add them, and your items. Everything on your
          shop page is public. Your email is never shown publicly.
        </p>

        <h2 className="pt-2 text-lg font-bold text-slate-900">Customers who order</h2>
        <p>
          You do not need an account. Your cart stays in your own browser. When you send an order,
          we save the items, the total, and the name and note you typed, so the shop can open the
          order from the link in your WhatsApp message. Anyone who has that link can open the
          order. To stop spam orders we also keep a scrambled, one-way fingerprint of your network
          address with the order; it cannot be turned back into the address. The WhatsApp message
          itself is sent by you from your own WhatsApp.
        </p>

        <h2 className="pt-2 text-lg font-bold text-slate-900">Customers who review</h2>
        <p>
          When you write a review we store your name, mobile number, rating and comment. Your name,
          rating and comment are public. <strong>Your mobile number is shown to the shop you
          reviewed</strong> and to the {SITE_NAME} team, and is never shown on the public page. We
          use it to allow one review per number.
        </p>

        <h2 className="pt-2 text-lg font-bold text-slate-900">What we do not do</h2>
        <p>We do not sell your information and we do not take payments on this site.</p>

        <h2 className="pt-2 text-lg font-bold text-slate-900">Changing or deleting your data</h2>
        <p>
          Shopkeepers can edit their details any time from the dashboard. To delete a shop, an
          order or a review, contact us and we will remove it.
        </p>
      </main>
      <SiteFooter />
    </>
  );
}
