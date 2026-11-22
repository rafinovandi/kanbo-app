import Image from "next/image";
import Link from "next/link";

import KanboLogo from "@/components/common/kanbo-logo";

const LINKS = [
  { href: "#features", label: "Features" },
  { href: "#how", label: "How it works" },
  { href: "/login", label: "Sign in" },
  { href: "/privacy", label: "Privacy" },
  { href: "/terms", label: "Terms" },
];

export default function LandingFooter() {
  return (
    <footer className="overflow-hidden border-t border-kb-divider">
      <div className="mx-auto flex w-full max-w-[1200px] flex-col gap-6 px-6 py-8 sm:flex-row sm:items-center sm:justify-between sm:px-10">
        <span className="flex items-center gap-3 text-sm text-muted-foreground">
          <KanboLogo className="gap-2" />
          <span>© 2026</span>
        </span>
        <nav
          aria-label="Footer"
          className="flex flex-wrap gap-x-5 gap-y-2 text-sm text-muted-foreground"
        >
          {LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="hover:text-foreground hover:underline"
            >
              {link.label}
            </Link>
          ))}
        </nav>
      </div>
      <div className="mx-auto w-full max-w-[1200px] px-6 pt-2 select-none sm:px-10">
        <Image
          src="/assets/footer.png"
          alt=""
          width={4480}
          height={556}
          sizes="(min-width: 1200px) 1120px, 100vw"
          loading="lazy"
          className="h-auto w-full"
        />
      </div>
    </footer>
  );
}
