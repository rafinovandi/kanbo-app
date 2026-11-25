import type { ProjectColor } from "@/types/project";

export const GANTT_DAY_WIDTH = 44;
export const GANTT_ROW_HEIGHT = 52;
// Width of the name column: a CSS variable the chart sets per screen size (narrow on phones).
export const GANTT_LIST_WIDTH = "var(--gantt-list)";
// Bars this many days long or longer carry the title and avatars inside them.
export const GANTT_INSIDE_MIN_DAYS = 3;

// Bar colors by category color: tint fill, solid border, readable text.
export const GANTT_BAR_TONE: Record<ProjectColor, string> = {
  gray: "border-kb-gray bg-kb-gray-tint text-kb-gray-fg",
  blue: "border-kb-blue bg-kb-blue-tint text-kb-blue-fg",
  lilac: "border-kb-lilac bg-kb-lilac-tint text-kb-lilac-fg",
  pink: "border-kb-pink bg-kb-pink-tint text-kb-pink-fg",
  orange: "border-kb-orange bg-kb-orange-tint text-kb-orange-fg",
  green: "border-kb-green bg-kb-green-tint text-kb-green-fg",
};
