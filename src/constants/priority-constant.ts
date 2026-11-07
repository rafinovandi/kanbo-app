import type { TaskPriority } from "@/types/task";

// Priority slider: one entry per stop, left to right. Classes are theme tokens.
export const PRIORITY_LEVELS: {
  value: TaskPriority;
  caption: string;
  fill: string;
  thumb: string;
  dot: string;
}[] = [
  {
    value: "low",
    caption: "Can wait",
    fill: "from-kb-lilac-tint to-kb-lilac/35",
    thumb:
      "border-kb-lilac bg-kb-lilac-tint text-kb-lilac-fg shadow-[0_0_0_4px_color-mix(in_oklab,var(--kb-lilac)_13%,transparent),0_0_18px_color-mix(in_oklab,var(--kb-lilac)_40%,transparent)]",
    dot: "bg-kb-lilac",
  },
  {
    value: "medium",
    caption: "This week",
    fill: "from-kb-yellow-tint to-kb-yellow/35",
    thumb:
      "border-kb-yellow bg-kb-yellow-tint text-kb-yellow-fg shadow-[0_0_0_4px_color-mix(in_oklab,var(--kb-yellow)_13%,transparent),0_0_18px_color-mix(in_oklab,var(--kb-yellow)_40%,transparent)]",
    dot: "bg-kb-yellow",
  },
  {
    value: "high",
    caption: "Do it first",
    fill: "from-kb-red-tint to-kb-red/35",
    thumb:
      "border-kb-red bg-kb-red-tint text-kb-red-fg shadow-[0_0_0_4px_color-mix(in_oklab,var(--kb-red)_13%,transparent),0_0_18px_color-mix(in_oklab,var(--kb-red)_40%,transparent)]",
    dot: "bg-kb-red",
  },
];
