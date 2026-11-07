import { ArrowSwapVertical, Kanban } from "iconsax-react";
import { CheckIcon } from "lucide-react";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { PROJECT_TILE } from "@/constants/project-constant";
import { cn } from "@/lib/utils";
import type { ProjectSummary } from "@/types/project";

function ProjectTile({ project, className }: { project: ProjectSummary; className?: string }) {
  return (
    <span
      aria-hidden="true"
      className={cn(
        "flex flex-none items-center justify-center font-semibold",
        PROJECT_TILE[project.color],
        className,
      )}
    >
      {project.name[0].toUpperCase()}
    </span>
  );
}

const CARD_CLASS =
  "flex w-full items-center gap-2.5 rounded-xl border border-border bg-background p-3.5 text-left shadow-xs";

// "Current project" card at the top of the sidebar. Click it to pick which project the Board menu
// opens. Without projects it keeps the empty look (gray tile, "No project yet") and isn't clickable.
export default function SidebarProjectCard({
  project,
  projects,
  onSelect,
}: {
  project: ProjectSummary | null;
  projects: ProjectSummary[];
  onSelect: (id: string) => void;
}) {
  const body = (
    <>
      {project ? (
        <ProjectTile project={project} className="size-9 rounded-[10px] text-sm" />
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
    </>
  );

  if (!project) return <div className={CARD_CLASS}>{body}</div>;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        aria-label="Switch project"
        className={cn(
          CARD_CLASS,
          "cursor-pointer outline-none transition-colors hover:bg-muted/50 focus-visible:ring-2 focus-visible:ring-ring data-[state=open]:bg-muted/50",
        )}
      >
        {body}
      </DropdownMenuTrigger>
      <DropdownMenuContent className="max-h-47">
        {projects.map((item) => (
          <DropdownMenuItem
            key={item.id}
            onSelect={() => onSelect(item.id)}
            className="gap-2.5"
          >
            <ProjectTile project={item} className="size-7 rounded-md text-xs" />
            <span className="min-w-0 flex-1 truncate text-sm font-medium">{item.name}</span>
            {item.id === project.id && <CheckIcon className="size-4 flex-none" aria-hidden />}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
