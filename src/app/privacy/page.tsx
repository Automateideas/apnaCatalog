import type { Metadata } from "next";
import { Grievance } from "@/components/Grievance";
import { SiteFooter, SiteHeader } from "@/components/SiteChrome";
import { SITE_NAME } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Privacy policy",
  description: `How ${SITE_NAME} collects and uses information.`,
};

const UPDATED = "17 November 2026";

const h2 = "pt-2 text-lg font-bold text-slate-900";

export default function PrivacyPage() {
  return (
    <>
      <SiteHeader signedIn={false} />
      <main className="mx-auto w-full max-w-2xl flex-1 space-y-4 px-4 py-8 text-slate-700">
        <h1 className="text-2xl font-bold text-slate-900">Privacy policy</h1>
        <p className="text-sm text-slate-500">Last updated: {UPDATED}</p>
        <p>
          {SITE_NAME} lets shops publish a catalog and lets customers find shops, send orders and
          write reviews. This page explains what personal data we collect, why, who can see it, and
          your rights. It follows India&apos;s Digital Personal Data Protection Act, 2023 and the
          Information Technology Act, 2000 and its rules.
        </p>

        <h2 className={h2}>Shopkeepers</h2>
        <p>
          We store your login email, shop name, city, address, phone and WhatsApp numbers, shop
          location, logo, shop photos, your name and photo if you add them, and your items. We use
          them to run your shop page and dashboard. Everything on your shop page is public. Your
          email is never shown publicly. If you open another shop&apos;s invite link, a cookie
          remembers that shop for 30 days, and when you create your shop we store which shop
          invited you. The shop that invited you only sees how many sellers joined through its
          link, not who they are.
        </p>

        <h2 className={h2}>Customers who order</h2>
        <p>
          You do not need an account. Your cart stays in your own browser. When you send an order,
          we save the items, the total, and the name and note you typed, so the shop can open the
          order from the link in your WhatsApp message. Anyone who has that link can open the
          order. To stop spam orders we also keep a scrambled, one-way fingerprint of your network
          address with the order; it cannot be turned back into the address. The WhatsApp message
          itself is sent by you from your own WhatsApp.
        </p>

        <h2 className={h2}>Customers who review</h2>
        <p>
          When you write a review we store your name, mobile number, rating and comment. Your name,
          rating and comment are public. <strong>Your mobile number is shown to the shop you
          reviewed</strong> and to the {SITE_NAME} team, and is never shown on the public page. We
          use it to allow one review per number.
        </p>

        <h2 className={h2}>People who report a shop or item</h2>
        <p>
          A report keeps the reason and the details you write, and is shown to the shop and to the{" "}
          {SITE_NAME} team. Your phone or email, if you give it, is shown only to the {SITE_NAME} team. To
          stop spam reports we keep a scrambled, one-way fingerprint of your network address with it.
        </p>

        <h2 className={h2}>Your location (Shops near me and distance)</h2>
        <p>
          Your phone&apos;s location is used only when you tap &quot;Shops near me&quot; or
          &quot;How far is this shop from me?&quot; and allow it in your browser. You can say no,
          and you can turn it off any time in your browser settings. We use it at that moment to
          find the closest shops and send it to Mapbox to get the road distance and travel time.{" "}
          <strong>We do not save your location</strong> and we do not use it for anything else.
        </p>

        <h2 className={h2}>Cookies and browser storage</h2>
        <p>
          We use cookies only to keep shopkeepers logged in and to remember an invite link. Your
          cart and small settings are kept in your own browser. We do not use advertising or
          tracking cookies. We measure page speed with Vercel Speed Insights, which does not
          identify you.
        </p>

        <h2 className={h2}>Who processes data for us</h2>
        <p>We use these services to run {SITE_NAME}. They handle data only to provide their service:</p>
        <ul className="list-disc space-y-1 pl-5">
          <li>Supabase: database, including login sessions (data kept in Mumbai, India).</li>
          <li>Cloudflare R2: photo storage.</li>
          <li>Vercel: website hosting and page speed measurement.</li>
          <li>Google: &quot;Continue with Google&quot; login for shopkeepers.</li>
          <li>Mapbox: road distance for &quot;Shops near me&quot;.</li>
          <li>WhatsApp: orders and messages are sent by you through your own WhatsApp.</li>
        </ul>
        <p>Some of these services may process data outside India.</p>

        <h2 className={h2}>What we do not do</h2>
        <p>
          We do not sell your personal data, we do not show ads, and we do not take payments on
          this site.
        </p>

        <h2 className={h2}>How long we keep data</h2>
        <p>
          We keep shop data while the shop exists, and orders and reviews while the shop that
          received them exists. When a shop is deleted, or you ask us to delete your data, we erase
          it, except where a law requires us to keep it for longer.
        </p>

        <h2 className={h2}>Your rights</h2>
        <p>Under the DPDP Act you can:</p>
        <ul className="list-disc space-y-1 pl-5">
          <li>ask what personal data we hold about you and who we shared it with,</li>
          <li>ask us to correct, complete or update it,</li>
          <li>withdraw your consent and ask us to erase it,</li>
          <li>name another person to use these rights for you if you die or cannot act,</li>
          <li>complain to our Grievance Officer (below).</li>
        </ul>
        <p>
          Shopkeepers can edit their details any time from the dashboard. For anything else,
          contact the Grievance Officer. If you are not happy with our answer, you can complain to
          the Data Protection Board of India.
        </p>

        <h2 className={h2}>Children</h2>
        <p>
          Shop accounts are for people aged 18 or above. We do not knowingly collect data from
          children without a parent&apos;s consent.
        </p>

        <h2 className={h2}>Security</h2>
        <p>
          Data is sent over encrypted connections (HTTPS), and access to the database is limited.
          If a data breach affects you, we will tell you and the Data Protection Board as the law
          requires.
        </p>

        <h2 className={h2}>Changes</h2>
        <p>If we change this policy, we update this page and the date at the top.</p>

        <Grievance />
      </main>
      <SiteFooter />
    </>
  );
}
