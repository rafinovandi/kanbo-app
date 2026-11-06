import { Card, CardContent } from "@/components/ui/card";
import { EMPTY_PROJECT_ROWS, EMPTY_STAT_TILES } from "@/constants/dashboard-constant";
import { kbAnimation } from "@/lib/utils";

// Decorative illustration of an empty dashboard (aria-hidden): three "0" tiles, a Projects tile
// whose bars fill and reset, and an "Overall progress" ring at 0%. The animation (6s loop) uses the
// kb-* keyframes in globals.css and is a static frame under prefers-reduced-motion.

// Dashed placeholder tile.
const TILE_CLASS =
  "gap-2.5 rounded-xl border-[1.5px] border-dashed border-kb-line bg-background ring-0 [--card-spacing:--spacing(3.5)]";

export default function DashboardEmptyPreview() {
  return (
    <div
      aria-hidden="true"
      className="flex min-w-0 flex-[1_1_420px] flex-col gap-3 rounded-[20px] bg-kb-surface p-5"
    >
      <div className="grid grid-cols-3 gap-2.5">
        {EMPTY_STAT_TILES.map((tile) => (
          <Card key={tile.label} className={TILE_CLASS}>
            <CardContent className="flex flex-col gap-2.5">
              <span className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                <span className={`size-2 rounded-full ${tile.dotClass}`} />
                {tile.label}
              </span>
              <span className="text-2xl leading-none font-semibold text-kb-faint">0</span>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)] gap-2.5">
        <Card className={TILE_CLASS}>
          <CardContent className="flex flex-col gap-3">
            <span className="text-xs font-semibold text-kb-text-2">Projects</span>
            <svg width="100%" height="96" viewBox="0 0 220 96" preserveAspectRatio="none" fill="none">
              {EMPTY_PROJECT_ROWS.map((row) => (
                <g key={row.y}>
                  <rect x="0" y={row.y + 4} width="18" height="18" rx="5" className="fill-kb-gray-tint" />
                  <rect x="26" y={row.y + 9} width={row.nameWidth} height="8" rx="4" className="fill-kb-gray-tint" />
                  <rect x="0" y={row.y + 28} width="220" height="5" rx="2.5" className="fill-kb-gray-tint" />
                  <rect
                    x="0"
                    y={row.y + 28}
                    width="220"
                    height="5"
                    rx="2.5"
                    className={`kb-anim origin-left [transform-box:fill-box] [transform:scaleX(var(--kb-bar-to))] ${row.fillClass}`}
                    style={kbAnimation("kb-bar-fill", 6, row.delay, { ["--kb-bar-to" as string]: row.bar })}
                  />
                </g>
              ))}
            </svg>
          </CardContent>
        </Card>

        <Card className={TILE_CLASS}>
          <CardContent className="flex flex-1 flex-col items-center justify-center gap-2">
            <svg width="88" height="88" viewBox="0 0 88 88" fill="none">
              <circle cx="44" cy="44" r="34" strokeWidth="9" className="stroke-kb-gray-tint" />
              <circle
                cx="44"
                cy="44"
                r="34"
                strokeWidth="9"
                strokeLinecap="round"
                pathLength="100"
                strokeDasharray="100"
                strokeDashoffset="45"
                transform="rotate(-90 44 44)"
                className="kb-anim stroke-kb-blue"
                style={kbAnimation("kb-ring-fill", 6, 0, { ["--kb-ring-to" as string]: 45 })}
              />
              <text x="44" y="49" textAnchor="middle" fontSize="15" fontWeight="600" className="fill-kb-faint">
                0%
              </text>
            </svg>
            <span className="text-xs text-muted-foreground">Overall progress</span>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
