import type { ReactNode } from "react";

import KanboLogo from "@/components/common/kanbo-logo";
import { Badge } from "@/components/ui/badge";
import { kbAnimation } from "@/lib/utils";

// Badge and disc colors per error page: 404 blue, 403 orange, 401 lilac, 410 yellow.
const TONE_CLASS = {
  blue: { badge: "bg-kb-blue-tint text-kb-blue-fg", disc: "fill-kb-blue-tint" },
  orange: { badge: "bg-kb-orange-tint text-kb-orange-fg", disc: "fill-kb-orange-tint" },
  lilac: { badge: "bg-kb-lilac-tint text-kb-lilac-fg", disc: "fill-kb-lilac-tint" },
  yellow: { badge: "bg-kb-yellow-tint text-kb-yellow-fg", disc: "fill-kb-yellow-tint" },
} as const;

const STAR_CLASS = {
  blue: "fill-kb-blue",
  orange: "fill-kb-orange",
  lilac: "fill-kb-lilac",
  pink: "fill-kb-pink",
} as const;

export type ErrorTone = keyof typeof TONE_CLASS;
export type StarColor = keyof typeof STAR_CLASS;

// Four-point sparkles in the corners of the 360×200 hero. Each blinks
// (kb-sparkle, 2.4s) a third of a cycle after the previous one.
const STAR_PATHS = [
  "M30 32l2 5.6 5.6 2.4-5.6 2.4-2 5.6-2-5.6-5.6-2.4 5.6-2.4Z",
  "M340 22l2 5.6 5.6 2.4-5.6 2.4-2 5.6-2-5.6-5.6-2.4 5.6-2.4Z",
  "M352 172l2 5.6 5.6 2.4-5.6 2.4-2 5.6-2-5.6-5.6-2.4 5.6-2.4Z",
];

type ErrorPageProps = {
  // Three digits; the middle one (always 0) is replaced by the disc and `illustration`.
  code: string;
  // Text inside the badge, e.g. "Error 401 · Sign in required".
  label: string;
  tone: ErrorTone;
  // SVG elements drawn on the disc, in the hero's 360×200 coordinates (disc center is 180,108).
  illustration: ReactNode;
  // Colors of the three sparkles (top left, top right, bottom right).
  stars: [StarColor, StarColor, StarColor];
  heading: string;
  message: string;
  primary: ReactNode;
  secondary?: ReactNode;
  note?: ReactNode;
};

// Shared full-page layout for the 401 / 403 / 404 / 410 pages, no sidebar.
// The dot grid is one static image (public/error-grid.svg) used as a CSS background.
// Everything animated stops under prefers-reduced-motion (kb-anim).
export default function ErrorPage({
  code,
  label,
  tone,
  illustration,
  stars,
  heading,
  message,
  primary,
  secondary,
  note,
}: ErrorPageProps) {
  return (
    <main className="flex min-h-svh flex-col bg-background bg-[url(/error-grid.svg)] bg-cover bg-center px-6 py-7 sm:px-10">
      <KanboLogo className="self-start" />

      <div className="flex flex-1 items-center justify-center py-12">
        <div className="flex w-full max-w-[460px] flex-col items-center gap-7 text-center">
          <svg
            viewBox="0 0 360 200"
            fill="none"
            role="img"
            aria-label={`Error ${code}`}
            className="block h-auto w-[360px] max-w-full overflow-visible"
          >
            <text x="70" y="160" textAnchor="middle" fontSize="150" fontWeight="700" letterSpacing="-6" className="fill-foreground">
              {code[0]}
            </text>
            <text x="292" y="160" textAnchor="middle" fontSize="150" fontWeight="700" letterSpacing="-6" className="fill-foreground">
              {code[2]}
            </text>

            <circle cx="180" cy="108" r="58" className={TONE_CLASS[tone].disc} />
            <circle
              cx="180"
              cy="108"
              r="72"
              strokeWidth="1.2"
              strokeDasharray="3 7"
              className="kb-anim stroke-kb-line"
              style={kbAnimation("kb-orbit", 24, 0, { transformOrigin: "180px 108px" }, "linear")}
            />

            {illustration}

            {STAR_PATHS.map((path, index) => (
              <path
                key={path}
                d={path}
                className={`kb-anim ${STAR_CLASS[stars[index]]}`}
                style={kbAnimation("kb-sparkle", 2.4, index * 0.8)}
              />
            ))}
          </svg>

          <div className="flex flex-col items-center gap-3">
            <Badge className={`h-[26px] px-2.5 text-xs font-semibold ${TONE_CLASS[tone].badge}`}>{label}</Badge>
            <h1 className="text-[28px] leading-tight font-semibold tracking-[-0.02em]">{heading}</h1>
            <p className="text-[15px] leading-relaxed text-muted-foreground">{message}</p>
          </div>

          <div className="flex w-full flex-col gap-3 sm:max-w-[380px]">
            {primary}
            {secondary}
          </div>

          {note && <div className="text-[13px] leading-normal text-muted-foreground">{note}</div>}
        </div>
      </div>
    </main>
  );
}
