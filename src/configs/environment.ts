// Same pattern as website_cafe. NEXT_PUBLIC_* values are inlined at build time and are safe in the browser.
export const environment = {
  APP_URL: process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
  SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL || "",
  SUPABASE_PUBLISHABLE_KEY: process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || "",
};
