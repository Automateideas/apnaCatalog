import "server-only";
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { nextCookies } from "better-auth/next-js";
import { and, notExists, sql } from "drizzle-orm";
import { db } from "@/db";
import { account, session, shops, user, verification } from "@/db/schema";
import { siteUrl } from "@/lib/utils";

const GOOGLE_ID = process.env.GOOGLE_CLIENT_ID ?? "";
const GOOGLE_SECRET = process.env.GOOGLE_CLIENT_SECRET ?? "";

/** True when the Google login keys are set, so the login button can work. */
export const isAuthConfigured = () =>
  GOOGLE_ID.length > 0 && GOOGLE_SECRET.length > 0 && (process.env.BETTER_AUTH_SECRET ?? "").length >= 32;

/**
 * Login with Google, stored in our own database (Better Auth). Google is the only way in:
 * shopkeepers have a Google account on their phone, and Google verifies the email, which
 * decides admin access and shop transfers.
 */
export const auth = betterAuth({
  baseURL: siteUrl(),
  secret: process.env.BETTER_AUTH_SECRET,
  trustedOrigins: [
    siteUrl(),
    "http://localhost:3210",
    // Vercel preview and branch links, so the login form can at least start there.
    ...[process.env.VERCEL_PROJECT_PRODUCTION_URL, process.env.VERCEL_URL, process.env.VERCEL_BRANCH_URL].filter(Boolean).map((host) => `https://${host}`),
  ],
  database: drizzleAdapter(db, { provider: "pg", schema: { user, session, account, verification } }),
  advanced: { database: { generateId: "uuid" } },
  socialProviders: {
    google: { clientId: GOOGLE_ID, clientSecret: GOOGLE_SECRET, prompt: "select_account" },
  },
  session: {
    expiresIn: 60 * 60 * 24 * 60, // 60 days: shopkeepers should not have to log in often
    updateAge: 60 * 60 * 24, // refreshed at most once a day
  },
  databaseHooks: {
    user: {
      create: {
        // Shops made before the move to Better Auth belong to a Supabase login id that no
        // longer exists. The first Google login with the same email takes them over.
        after: async (created) => {
          if (!created.emailVerified || !created.email) return;
          try {
            await db
              .update(shops)
              .set({ ownerId: created.id, updatedAt: new Date() })
              .where(
                and(
                  sql`lower(${shops.ownerEmail}) = ${created.email.toLowerCase()}`,
                  notExists(db.select().from(user).where(sql`${user.id} = ${shops.ownerId}`)),
                ),
              );
          } catch (error) {
            console.error("Could not link an older shop to the new login", error);
          }
        },
      },
    },
  },
  plugins: [nextCookies()], // must stay last
});
