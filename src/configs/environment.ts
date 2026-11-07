// NEXT_PUBLIC_* values are inlined at build time and are safe in the browser.
export const environment = {
  APP_URL: process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
  SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL || "",
  SUPABASE_PUBLISHABLE_KEY: process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || "",
  // Who runs this deployment, named in the Privacy Policy and Terms (each self-hosted copy has its own operator).
  OPERATOR_NAME: process.env.NEXT_PUBLIC_OPERATOR_NAME || "the Kanbo operator",
  CONTACT_EMAIL: process.env.NEXT_PUBLIC_CONTACT_EMAIL || "",
};
