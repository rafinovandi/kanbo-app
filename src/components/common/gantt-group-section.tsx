"use client";

import { useDroppable } from "@dnd-kit/core";
import type { ReactNode } from "react";

import { Badge } from "@/components/ui/badge";
import { GANTT_LIST_WIDTH } from "@/constants/gantt-constant";
import { PROJECT_TONE } from "@/constants/profile-constant";
import { cn } from "@/lib/utils";
import type { GanttGroup } from "@/types/gantt";

// One group of the Gantt timeline (its header and rows), and the drop target for rows dragged into it.
export default function GanttGroupSection({
  group,
  children,
}: {
  group: GanttGroup;
  children: ReactNode;
}) {
  const { setNodeRef } = useDroppable({ id: group.id });
  return (
    <div ref={setNodeRef} className="relative">
      <div className="flex h-11">
        <div
          className="sticky left-0 z-20 flex h-full shrink-0 items-end gap-2 border-r bg-card px-2 pb-1.5 sm:px-4"
          style={{ width: GANTT_LIST_WIDTH }}
        >
          <span
            aria-hidden
            className={cn(
              "mb-0.5 h-4 w-1 rounded-full",
              PROJECT_TONE[group.color].bar,
            )}
          />
          <span className="truncate text-sm font-semibold">{group.name}</span>
          <Badge variant="secondary">{group.items.length}</Badge>
        </div>
      </div>
      {children}
    </div>
  );
}
