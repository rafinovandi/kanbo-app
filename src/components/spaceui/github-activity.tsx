"use client";

import * as React from "react";

import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  ACTIVITY_PALETTE,
  DEFAULT_ACTIVITY_COLOR,
  type ActivityColor,
} from "@/constants/profile-constant";
import { cn } from "@/lib/utils";

// Heatmap board adapted from @spaceui/github-activity: only the 52-week matrix + legend.
// The GitHub fetching, header and KPI cards are dropped; data comes in through `contributions`.
// Colors come from ACTIVITY_PALETTE (project tokens), picked with the `color` prop.

export type ContributionLevel =
  | "NONE"
  | "FIRST_QUARTILE"
  | "SECOND_QUARTILE"
  | "THIRD_QUARTILE"
  | "FOURTH_QUARTILE";

export interface ContributionDay {
  /** ISO date (yyyy-mm-dd). Empty string marks a padding cell outside the range. */
  date: string;
  contributionCount: number;
  contributionLevel: ContributionLevel;
}

export interface ContributionWeek {
  /** 7 days, Sunday first. */
  contributionDays: ContributionDay[];
}

export interface ContributionData {
  totalContributions: number;
  weeks: ContributionWeek[];
}

export type GitHubActivityShape = "square" | "rounded" | "circle";

const LEVELS: ContributionLevel[] = [
  "NONE",
  "FIRST_QUARTILE",
  "SECOND_QUARTILE",
  "THIRD_QUARTILE",
  "FOURTH_QUARTILE",
];

function levelColors(color: ActivityColor): Record<ContributionLevel, string> {
  const [first, second, third, fourth] = ACTIVITY_PALETTE[color].levels;
  return {
    NONE: "bg-kb-gray-tint",
    FIRST_QUARTILE: first,
    SECOND_QUARTILE: second,
    THIRD_QUARTILE: third,
    FOURTH_QUARTILE: fourth,
  };
}

// More tasks on a day, a bigger square. The grid slot stays 11px; only the square scales inside it.
const LEVEL_SCALE: Record<ContributionLevel, string> = {
  NONE: "scale-[0.9]",
  FIRST_QUARTILE: "scale-[0.95]",
  SECOND_QUARTILE: "scale-100",
  THIRD_QUARTILE: "scale-[1.1]",
  FOURTH_QUARTILE: "scale-[1.2]",
};

const SHAPE_CLASSES: Record<GitHubActivityShape, string> = {
  square: "rounded-none",
  rounded: "rounded-[3px]",
  circle: "rounded-full",
};

const MONTHS = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

function parseDate(iso: string) {
  const [y, m, d] = iso.split("-").map(Number);
  return { y: y!, m: m! - 1, d: d! };
}

function formatDate(iso: string) {
  const { y, m, d } = parseDate(iso);
  return `${MONTHS[m]} ${d}, ${y}`;
}

export function GitHubActivity({
  contributions,
  shape = "rounded",
  color = DEFAULT_ACTIVITY_COLOR,
  showLegend = true,
  unit = ["task", "tasks"],
  helperText,
  className,
}: {
  contributions: ContributionData;
  shape?: GitHubActivityShape;
  color?: ActivityColor;
  showLegend?: boolean;
  /** Singular and plural noun used in tooltips, e.g. ["task", "tasks"]. */
  unit?: [string, string];
  /** Text on the left of the legend row. */
  helperText?: string;
  className?: string;
}) {
  const scrollRef = React.useRef<HTMLDivElement>(null);
  const slot = "flex size-[11px] shrink-0 items-center justify-center";
  const square = (level: ContributionLevel) =>
    cn(
      "block size-full",
      SHAPE_CLASSES[shape],
      LEVEL_SCALE[level],
      levelClasses[level],
    );
  const levelClasses = levelColors(color);

  // Newest weeks are on the right: start scrolled to the end on narrow screens.
  React.useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollLeft = el.scrollWidth;
  }, [contributions]);

  // A month label sits on the first week whose first in-range day starts a new month.
  const monthLabels = React.useMemo(() => {
    const firsts = contributions.weeks.map((week) => {
      const first = week.contributionDays.find((day) => day.date);
      return first ? parseDate(first.date) : null;
    });
    return firsts.map((cur, i) => {
      if (!cur) return "";
      const prev = firsts[i - 1];
      if (prev && prev.m === cur.m) return "";
      return i > 0 || cur.d <= 7 ? MONTHS[cur.m]! : "";
    });
  }, [contributions.weeks]);

  return (
    <div className={cn("flex flex-col gap-3", className)}>
      <div
        ref={scrollRef}
        role="img"
        aria-label={`Activity graph: ${contributions.totalContributions} ${unit[1]} completed in the last year`}
        className="overflow-x-auto py-px"
      >
        <div className="inline-flex min-w-max flex-col gap-1.5">
          <div aria-hidden className="flex h-3.5 gap-[3px] pl-8">
            {monthLabels.map((label, i) => (
              <span
                key={i}
                className="w-[11px] shrink-0 text-[11px] leading-[14px] whitespace-nowrap text-kb-text-2"
              >
                {label}
              </span>
            ))}
          </div>
          <div className="flex gap-[3px]">
            <div
              aria-hidden
              className="flex w-[29px] shrink-0 flex-col gap-[3px] text-[10px] leading-[11px] text-kb-text-2"
            >
              <span className="h-[11px]" />
              <span className="h-[11px]">Mon</span>
              <span className="h-[11px]" />
              <span className="h-[11px]">Wed</span>
              <span className="h-[11px]" />
              <span className="h-[11px]">Fri</span>
              <span className="h-[11px]" />
            </div>
            {contributions.weeks.map((week, w) => (
              <div key={w} className="flex flex-col gap-[3px]">
                {week.contributionDays.map((day, d) =>
                  day.date ? (
                    <Tooltip key={d}>
                      <TooltipTrigger asChild>
                        <span className={slot}>
                          <span className={square(day.contributionLevel)} />
                        </span>
                      </TooltipTrigger>
                      <TooltipContent>
                        {day.contributionCount === 0
                          ? `No ${unit[1]}`
                          : `${day.contributionCount} ${day.contributionCount === 1 ? unit[0] : unit[1]}`}{" "}
                        completed on {formatDate(day.date)}
                      </TooltipContent>
                    </Tooltip>
                  ) : (
                    <span key={d} className={slot} />
                  ),
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {showLegend && (
        <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-kb-text-2">
          <span>{helperText}</span>
          <span className="flex items-center gap-1">
            Less
            {LEVELS.map((level) => (
              <span key={level} aria-hidden className={slot}>
                <span className={square(level)} />
              </span>
            ))}
            More
          </span>
        </div>
      )}
    </div>
  );
}
