const PLACEHOLDER_ORIGIN = "http://internal.invalid";

// Only same-site relative paths ("/dashboard", not "//evil.com", "/\evil.com" or "https://…") are allowed
// as a post-login destination; anything else falls back. The value is resolved the same way the redirect
// resolves it, so what passes here cannot leave the app's origin.
export function getSafeRedirectPath(value: unknown, fallback = "/dashboard"): string {
  if (typeof value !== "string" || !value.startsWith("/") || /[\\\u0000-\u001f]/.test(value)) {
    return fallback;
  }
  const url = new URL(value, PLACEHOLDER_ORIGIN);
  const path = `${url.pathname}${url.search}${url.hash}`;
  return url.origin === PLACEHOLDER_ORIGIN && !path.startsWith("//") ? path : fallback;
}
