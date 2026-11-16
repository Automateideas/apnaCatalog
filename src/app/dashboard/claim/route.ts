import { NextResponse, type NextRequest } from "next/server";
import { revalidatePath } from "next/cache";
import { getUser } from "@/lib/auth";
import { claimPendingShop } from "@/lib/owner-change";

/**
 * Finishes a login-email change: the shop waiting for this Google account
 * becomes this user's. Only ever acts on the signed-in user's own email.
 */
export async function GET(request: NextRequest) {
  const url = request.nextUrl.clone();
  url.search = "";

  const user = await getUser();
  if (!user) {
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  const moved = await claimPendingShop(user);
  if (moved) revalidatePath("/dashboard", "layout");
  // If nothing moved, ?fresh=1 stops /dashboard/new from sending the user back here.
  url.pathname = moved ? "/dashboard" : "/dashboard/new";
  if (!moved) url.searchParams.set("fresh", "1");
  return NextResponse.redirect(url);
}
