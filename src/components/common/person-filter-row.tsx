"use client";

import { TickCircle } from "iconsax-react";
import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

// One option of PersonFilter: an icon or avatar, a name with an optional subtitle, a count and a check when chosen.
export default function PersonFilterRow({
  selected,
  onPick,
  icon,
  title,
  subtitle,
  count,
}: {
  selected: boolean;
  onPick: () => void;
  icon: ReactNode;
  title: string;
  subtitle?: string;
  count: number;
}) {
  return (
    <button
      type="button"
      role="option"
      aria-selected={selected}
      onClick={onPick}
      className={cn(
        "flex min-h-11 w-full items-center gap-2.5 rounded-lg px-2 py-1.5 text-left text-sm outline-none hover:bg-accent focus-visible:bg-accent",
        selected && "bg-muted",
      )}
    >
      <span className="flex size-6 shrink-0 items-center justify-center text-muted-foreground">
        {icon}
      </span>
      <span className="flex min-w-0 flex-1 flex-col">
        <span className="truncate font-medium">{title}</span>
        {subtitle && (
          <span className="truncate text-xs text-muted-foreground">
            {subtitle}
          </span>
        )}
      </span>
      <span className="text-xs text-muted-foreground">{count}</span>
      {selected && (
        <TickCircle size={16} variant="Bold" color="currentColor" aria-hidden />
      )}
    </button>
  );
}
