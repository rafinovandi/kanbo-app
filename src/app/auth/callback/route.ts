import { NextResponse, type NextRequest } from "next/server";

import { environment } from "@/configs/environment";
import { createClient } from "@/lib/supabase/server";
import { getSafeRedirectPath } from "@/lib/utils";

// Google → Supabase → here with ?code=…  Exchange it for a session cookie, then go to `next`.
// The profile row is created by the database trigger on_auth_user_created.
export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  // Redirect to the configured app URL, never to a host taken from request headers
  // (x-forwarded-host can be spoofed on hosts that don't strip it). In development use the
  // request origin so any local port works.
  const baseUrl = process.env.NODE_ENV === "development" ? origin : environment.APP_URL;
  const code = searchParams.get("code");
  const next = getSafeRedirectPath(searchParams.get("next"));
  // On a provider failure Supabase comes back without `code`, with ?error_description=…
  let reason = searchParams.get("error_description");

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) return NextResponse.redirect(new URL(next, baseUrl));
    reason = error.message;
  }

  // Cancelled at Google, expired code, or exchange failed.
  const failure = new URL("/login", baseUrl);
  failure.searchParams.set("error", "auth");
  // Only in development: show the real reason so config problems are visible. In production no
  // text from the URL is passed on (a crafted link could otherwise put its own words in the toast).
  if (reason && process.env.NODE_ENV === "development") {
    failure.searchParams.set("error_description", reason.slice(0, 200));
  }
  return NextResponse.redirect(failure);
}
