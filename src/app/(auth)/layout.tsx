import type { ReactNode } from "react";

// Full-page layout without the sidebar (sign in, and later the error pages).
export default function AuthLayout({ children }: { children: ReactNode }) {
  return <div className="min-h-svh bg-background">{children}</div>;
}
