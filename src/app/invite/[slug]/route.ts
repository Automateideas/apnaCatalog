import { NextResponse, type NextRequest } from "next/server";
import { INVITE_COOKIE, INVITE_COOKIE_DAYS } from "@/lib/catalog-config";
import { SLUG_PATTERN } from "@/lib/utils";

/**
 * A shop's invite link. Remembers the inviting shop in a cookie and opens the home page.
 * The cookie is read once, when the new seller creates their shop.
 */
export async function GET(request: NextRequest, ctx: RouteContext<"/invite/[slug]">) {
  const { slug } = await ctx.params;

  const url = request.nextUrl.clone();
  url.pathname = "/";
  url.search = "";
  const response = NextResponse.redirect(url);

  if (SLUG_PATTERN.test(slug)) {
    response.cookies.set(INVITE_COOKIE, slug, {
      maxAge: INVITE_COOKIE_DAYS * 24 * 60 * 60,
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
    });
  }
  return response;
}
