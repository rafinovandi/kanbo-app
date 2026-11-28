import { NextResponse, type NextRequest } from "next/server";

import { updateSession } from "@/lib/supabase/proxy";

const PAGE_METHODS = new Set(["GET", "HEAD", "OPTIONS"]);

// Route handlers answer their own methods (and return JSON to agents), so only page URLs get the 405 page.
const ROUTE_HANDLER_PREFIXES = ["/api/", "/auth/"];

// Next answers any other method on a page with a bare-text 405. Send it to the 405 page instead;
// 303 turns the request into a GET. Server Actions also POST to page URLs: with JS they carry a
// Next-Action header, and a form submitted before hydration is multipart, so both pass through.
function isRejectedPageRequest(request: NextRequest) {
  if (PAGE_METHODS.has(request.method)) return false;
  if (ROUTE_HANDLER_PREFIXES.some((prefix) => request.nextUrl.pathname.startsWith(prefix))) return false;
  if (request.headers.has("next-action")) return false;
  return !request.headers.get("content-type")?.startsWith("multipart/form-data");
}

// Next.js 16: Proxy replaces Middleware (lives in src/ because the app uses the src folder).
export async function proxy(request: NextRequest) {
  if (isRejectedPageRequest(request)) {
    return NextResponse.redirect(new URL("/405", request.url), 303);
  }
  return updateSession(request);
}

export const config = {
  matcher: [
    // Everything except Next internals and static images.
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
};
