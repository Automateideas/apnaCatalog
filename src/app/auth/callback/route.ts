import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/env";

/** Finishes Google sign-in and email links, then opens the dashboard. */
export async function GET(request: NextRequest) {
  const url = request.nextUrl.clone();
  const code = url.searchParams.get("code");
  url.search = "";

  if (code && isSupabaseConfigured()) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      url.pathname = "/dashboard";
      return NextResponse.redirect(url);
    }
  }

  url.pathname = "/login";
  url.searchParams.set("error", "1");
  return NextResponse.redirect(url);
}
