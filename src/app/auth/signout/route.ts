import { NextResponse, type NextRequest } from "next/server";
import { auth } from "@/lib/better-auth";

/** Ends the session (the dashboard's "Log out" form posts here), then opens the home page. */
export async function POST(request: NextRequest) {
  const url = request.nextUrl.clone();
  url.pathname = "/";
  url.search = "";
  const response = NextResponse.redirect(url, { status: 303 });
  try {
    const result = await auth.api.signOut({ headers: request.headers, asResponse: true });
    // Pass on the cookie changes that clear the session.
    for (const cookie of result.headers.getSetCookie()) response.headers.append("set-cookie", cookie);
  } catch {
    // Already signed out.
  }
  return response;
}
