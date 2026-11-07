import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  experimental: {
    agentFeedback: true,
    // forbidden() and app/forbidden.tsx: the 403 page for a signed-in user who is not a member of a project.
    authInterrupts: true,
    // Server Actions accept 1 MB by default; avatar uploads go up to 2 MB (AVATAR_MAX_BYTES)
    // plus multipart overhead and the other form fields.
    serverActions: { bodySizeLimit: "3mb" },
  },
  // Baseline security headers. A Content-Security-Policy is intentionally not set yet: with
  // cacheComponents it needs per-request nonces, so it should be introduced (Report-Only first) separately.
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
        ],
      },
    ];
  },
  cacheComponents: true,
  partialPrefetching: true,
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
