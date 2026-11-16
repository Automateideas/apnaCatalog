import "server-only";
import { and, eq, ne, or, sql } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/db";
import { shops } from "@/db/schema";
import type { SessionUser } from "@/lib/auth";
import type { ActionResult } from "@/lib/utils";

/**
 * Changing the login email.
 *
 * Login is Google only, so "changing the email" means moving the shop to a
 * different Google account. We store the new email on the shop; the next time
 * that account logs in, the shop becomes theirs. Until then nothing changes
 * and the request can be cancelled, so a typing mistake cannot lock anyone out.
 */

const emailSchema = z.email().max(200);

/** Sets (or, with an empty email, clears) the account a shop will move to. */
export async function setPendingOwner(
  shop: { id: string; ownerEmail: string | null },
  rawEmail: string,
): Promise<ActionResult> {
  const email = rawEmail.trim().toLowerCase();

  if (!email) {
    await db.update(shops).set({ pendingOwnerEmail: null }).where(eq(shops.id, shop.id));
    return { ok: true };
  }
  if (!emailSchema.safeParse(email).success) {
    return { ok: false, error: "Enter a valid email address." };
  }
  if (email === shop.ownerEmail?.toLowerCase()) {
    return { ok: false, error: "This shop already uses this email." };
  }

  // One account can hold one shop, so the new email must be free.
  const [clash] = await db
    .select({ id: shops.id })
    .from(shops)
    .where(
      and(
        ne(shops.id, shop.id),
        or(sql`lower(${shops.ownerEmail}) = ${email}`, eq(shops.pendingOwnerEmail, email)),
      ),
    )
    .limit(1);
  if (clash) {
    return { ok: false, error: "Another shop already uses this email. Choose a different one." };
  }

  await db.update(shops).set({ pendingOwnerEmail: email }).where(eq(shops.id, shop.id));
  return { ok: true };
}

export async function hasPendingShop(email: string | null): Promise<boolean> {
  if (!email) return false;
  const [row] = await db
    .select({ id: shops.id })
    .from(shops)
    .where(eq(shops.pendingOwnerEmail, email.toLowerCase()))
    .limit(1);
  return Boolean(row);
}

/**
 * Moves the shop waiting for this user's email to this user. Returns true if a
 * shop was moved. `user.email` is only set for Google sign-ins (see getUser),
 * so the email has been verified by Google.
 */
export async function claimPendingShop(user: SessionUser): Promise<boolean> {
  if (!user.email) return false;
  try {
    const moved = await db
      .update(shops)
      .set({
        ownerId: user.id,
        ownerEmail: user.email,
        pendingOwnerEmail: null,
        updatedAt: new Date(),
      })
      .where(eq(shops.pendingOwnerEmail, user.email.toLowerCase()))
      .returning({ id: shops.id });
    return moved.length > 0;
  } catch {
    // This account already owns a shop (one shop per account).
    return false;
  }
}
