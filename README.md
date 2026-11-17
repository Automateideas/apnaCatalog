# Apnacatalog

Online catalog for local shops. A shopkeeper signs up, adds items, and gets a link like
`apnacatalog.in/hemkund-gift-store`. Customers open it, add items to a cart, and send the order
to the shop on WhatsApp. The home page lists shops by city and type.

## What is in it

- **Shop page** (`/<shop-link>`): items with prices, category and subcategory, three layouts,
  colour themes, WhatsApp / Call / Directions buttons, owner name and photo, reviews.
- **Cart and WhatsApp order**: quantities, a prefilled WhatsApp message, and an order page
  (`/o/<code>`) that prints or saves as PDF. Prices are always taken from the database.
- **Reviews**: only from the link the shopkeeper shares. Name, mobile number and stars. One
  review per number per shop, editable from the same phone. The number is shown only to the shop.
- **Dashboard** (`/dashboard`): items, categories, orders, reviews, shop details, logo, map
  location, theme, plan, QR code.
- **Plans**: free (20 items, 1 layout, 2 colours, last 10 orders) and paid. The first 100 shops
  get paid features free for 90 days. There is no payment gateway yet: shopkeepers message you on
  WhatsApp and you switch the plan in `/admin`.
- **Invite a seller**: every shop has an invite link (`/invite/<shop-link>`), shown on the
  dashboard and the Plan page. When a seller who joined through it gets a paid plan for the first
  time (the first time you add paid time to that shop in `/admin`), the inviting shop gets one
  month of the paid plan free. The launch offer does not count as a first paid plan.
- **Admin** (`/admin`): hide shops, set plans, hide reported reviews, change a shop's login email.
- **Changing login email**: only the admin can do this. In `/admin` enter the shop's new Google email.
  The shop moves when that account logs in; until then the admin can cancel it.
- **PWA**: installable. Each shop has its own manifest and icon, so a customer can add one shop
  to their home screen.

All plan limits, shop types, layouts and colours are in `src/lib/catalog-config.ts`.

## Tech

Next.js 16 (App Router), TypeScript, Tailwind CSS v4, shadcn/ui components (in
`src/components/ui`, add more with `npx shadcn@latest add <name>`), Drizzle ORM on Postgres. Supabase is used
only for login (Google only) and photo storage; all table access goes through Drizzle on
the server. Row level security is enabled on every table with no policies, so the public Supabase
key cannot read or write them.

## Setup

1. Create your own Supabase project (free plan is enough to start).
2. Copy `.env.example` to `.env.local` and fill it in:
   - `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`: Project Settings, API Keys,
     "Publishable key" (starts with `sb_publishable_`). Never use the "Secret key" here.
   - `DATABASE_URL`: Connect, "Transaction pooler" connection string.
   - `ADMIN_EMAILS`: your login email.
   - `NEXT_PUBLIC_SUPPORT_WHATSAPP`: the number shopkeepers contact to upgrade.
3. Create the tables and the photo bucket:

   ```bash
   npm run db:migrate
   ```

4. In Supabase, Authentication:
   - **URL Configuration**: set Site URL to your site, and add `<site>/auth/callback` to
     Redirect URLs (also `http://localhost:3000/auth/callback` for local work).
   - **Providers, Google**: switch on and add your Google OAuth client ID and secret (from
     Google Cloud Console; its redirect URI is `https://<project-ref>.supabase.co/auth/v1/callback`).
     Google is the only login. A new user lands on the shop form right after signing in.
5. Run it:

   ```bash
   npm run dev
   ```

Optional demo shops: `npm run db:seed`.

### Trying the dashboard without Supabase

For local development only, add `DEV_LOGIN_EMAIL=you@example.com` to `.env.local`. You are then
treated as logged in with that email. This is ignored in production builds. Photo upload still
needs Supabase.

## Commands

| Command | What it does |
| --- | --- |
| `npm run dev` | Start the local site |
| `npm run build` | Production build |
| `npm run typecheck` | TypeScript check |
| `npm run lint` | ESLint |
| `npm run db:generate` | Create a migration after changing `src/db/schema.ts` |
| `npm run db:migrate` | Apply migrations |
| `npm run db:seed` | Add demo shops |

## Deploying

Deploy to Vercel, add the same environment variables there (with the real
`NEXT_PUBLIC_SITE_URL`), and point the domain at it. Run `npm run db:migrate` once against the
production database.

## Known limits

- Reviews have no OTP, so a shopkeeper could type reviews for their own shop with made-up
  numbers. Admin can hide reviews.
- The 25-item limit and the 100-shop launch offer are checked just before saving; two requests
  at the exact same moment can slip one past.
- Uploaded photos that are later replaced stay in storage.
- The interface is in English only.
