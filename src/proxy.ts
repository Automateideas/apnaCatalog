import { getSessionCookie } from "better-auth/cookies";
import { NextResponse, type NextRequest } from "next/server";

/**
 * Sends signed-out visitors of the dashboard and admin pages to the login page early.
 * This only looks for the session cookie; every page still checks the session in the
 * database before showing anything (getUser in src/lib/auth.ts).
 */
export function proxy(request: NextRequest) {
  if (process.env.NODE_ENV === "development" && process.env.DEV_LOGIN_EMAIL) return NextResponse.next();
  if (!getSessionCookie(request)) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.search = "";
    return NextResponse.redirect(url);
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*", "/admin/:path*"],
};
