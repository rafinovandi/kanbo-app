import { ArrowSwapVertical, Kanban } from "iconsax-react";

import { PROJECT_TILE } from "@/constants/project-constant";
import { cn } from "@/lib/utils";
import type { ProjectSummary } from "@/types/project";

// "Current project" card at the top of the sidebar. With a project it shows the project's initial
// in its color; without one it keeps the empty look (gray tile, "No project yet").
export default function SidebarProjectCard({ project }: { project: ProjectSummary | null }) {
  return (
    <div className="flex w-full items-center gap-2.5 rounded-xl border border-border bg-background p-3.5 shadow-xs">
      {project ? (
        <span
          aria-hidden="true"
          className={cn(
            "flex size-9 flex-none items-center justify-center rounded-[10px] text-sm font-semibold",
            PROJECT_TILE[project.color],
          )}
        >
          {project.name[0].toUpperCase()}
        </span>
      ) : (
        <span className="flex size-9 flex-none items-center justify-center rounded-[10px] bg-kb-gray-tint text-kb-text-2">
          <Kanban size={20} variant="Linear" color="currentColor" aria-hidden />
        </span>
      )}
      <span className="flex min-w-0 flex-1 flex-col gap-px">
        <span className="text-xs text-muted-foreground">Current project</span>
        <span className="truncate text-sm font-semibold">{project?.name ?? "No project yet"}</span>
      </span>
      <ArrowSwapVertical
        size={18}
        variant="Linear"
        color="currentColor"
        className="flex-none text-muted-foreground"
        aria-hidden
      />
    </div>
  );
}
