import Link from "next/link";
import type { ReactNode } from "react";

import KanboLogo from "@/components/common/kanbo-logo";

// Public pages without the sidebar (Privacy Policy, Terms): the logo, a readable column and links to both documents.
export default function LegalLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-svh flex-col bg-background">
      <header className="border-b border-kb-divider px-6 py-4 sm:px-10">
        <Link
          href="/login"
          aria-label="Kanbo, back to sign in"
          className="inline-flex rounded-lg outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
        >
          <KanboLogo />
        </Link>
      </header>
      <main className="mx-auto w-full max-w-[720px] flex-1 px-6 py-12 sm:py-16">{children}</main>
      <footer className="border-t border-kb-divider px-6 py-6 text-[13px] text-muted-foreground sm:px-10">
        <nav aria-label="Legal" className="flex gap-4">
          <Link href="/privacy" className="hover:text-foreground hover:underline">
            Privacy Policy
          </Link>
          <Link href="/terms" className="hover:text-foreground hover:underline">
            Terms of Service
          </Link>
        </nav>
      </footer>
    </div>
  );
}
