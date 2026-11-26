import Image from "next/image";
import Link from "next/link";

import KanboLogo from "@/components/common/kanbo-logo";

const SOCIALS = [
  {
    href: "https://www.instagram.com/rafinovandii/",
    label: "Instagram",
    icon: "/instagram-icon.svg",
    size: 18,
  },
  {
    href: "https://www.linkedin.com/in/muhammadrafinovandi",
    label: "LinkedIn",
    icon: "/linkedin-icon.svg",
    size: 16,
  },
  {
    href: "https://github.com/rafinovandi",
    label: "GitHub",
    icon: "/github-icon.webp",
    size: 18,
  },
];

const GROUPS = [
  {
    title: "Product",
    links: [
      { href: "#features", label: "Features" },
      { href: "#how", label: "How it works" },
    ],
  },
  {
    title: "Integrations",
    links: [
      { href: "#integrations-telegram", label: "Telegram bot" },
      { href: "#integrations-mcp", label: "Claude Code (MCP)" },
      { href: "#integrations-mcp", label: "Codex (MCP)" },
    ],
  },
  {
    title: "Account",
    links: [
      { href: "/login", label: "Sign in" },
      { href: "/privacy", label: "Privacy" },
      { href: "/terms", label: "Terms" },
    ],
  },
];

const LINK_CLASS = "hover:text-foreground hover:underline";

export default function LandingFooter() {
  return (
    <footer className="overflow-hidden border-t border-kb-divider">
      <div className="mx-auto flex w-full max-w-[1200px] flex-col px-6 pt-8 sm:px-10">
        <div className="flex flex-wrap justify-between gap-10">
          <div className="flex flex-[0_1_300px] flex-col items-start gap-5">
            <Link href="/" aria-label="Kanbo home">
              <KanboLogo />
            </Link>
            <p className="text-sm leading-relaxed text-muted-foreground">
              A simple board for small teams. Plan in columns, set priorities,
              and let your agent help.
            </p>
            <ul className="-ml-2.5 mt-1 flex items-center gap-1">
              {SOCIALS.map((social) => (
                <li key={social.label}>
                  <a
                    href={social.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={`${social.label} (opens in a new tab)`}
                    className="flex size-9 items-center justify-center rounded-lg transition-colors hover:bg-muted"
                  >
                    <Image
                      src={social.icon}
                      alt=""
                      width={social.size}
                      height={social.size}
                    />
                  </a>
                </li>
              ))}
            </ul>
          </div>
          <div className="flex flex-wrap gap-x-20 gap-y-8">
            {GROUPS.map((group) => (
              <nav
                key={group.title}
                aria-label={group.title}
                className="flex min-w-[120px] flex-col gap-3.5"
              >
                <span className="text-sm font-semibold">{group.title}</span>
                <ul className="flex flex-col gap-3 text-sm text-muted-foreground">
                  {group.links.map((link) => (
                    <li key={link.label}>
                      {link.href.startsWith("#") ? (
                        <a href={link.href} className={LINK_CLASS}>
                          {link.label}
                        </a>
                      ) : (
                        <Link href={link.href} className={LINK_CLASS}>
                          {link.label}
                        </Link>
                      )}
                    </li>
                  ))}
                </ul>
              </nav>
            ))}
          </div>
        </div>
        <p className="mt-14 text-center text-sm text-kb-text-2">
          © 2026 Kanbo.
        </p>
        <div className="mt-6 select-none">
          <Image
            src="/assets/footer-wordmark.png"
            alt=""
            width={2240}
            height={278}
            sizes="(min-width: 1200px) 1120px, 100vw"
            loading="lazy"
            className="h-auto w-full"
          />
        </div>
      </div>
    </footer>
  );
}
