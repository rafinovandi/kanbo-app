import Image from "next/image";
import Link from "next/link";
import { Suspense } from "react";

import KanboLogo from "@/components/common/kanbo-logo";
import { Button } from "@/components/ui/button";
import { CTA_BUTTON_CLASS } from "@/constants/ui-constant";

import LandingAccount from "./landing-account";

export const GITHUB_URL = "https://github.com/rafinovandi/kanbo-app";

export default function LandingHeader() {
  return (
    <header className="kb-enter mx-auto flex h-20 w-full max-w-[1200px] items-center justify-between gap-4 px-6 sm:px-10">
      <Link
        href="/"
        aria-label="Kanbo, home"
        className="inline-flex rounded-lg outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
      >
        <KanboLogo />
      </Link>
      <div className="flex items-center gap-2">
        <Button asChild variant="outline" className={CTA_BUTTON_CLASS}>
          <a
            href={GITHUB_URL}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Kanbo on GitHub (opens in a new tab)"
          >
            <Image src="/github-icon.webp" alt="" width={20} height={20} />
            GitHub
          </a>
        </Button>
        <Suspense
          fallback={<span aria-hidden="true" className="block h-11 w-[88px]" />}
        >
          <LandingAccount />
        </Suspense>
      </div>
    </header>
  );
}
