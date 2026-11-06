import { ArrowSwapVertical, Kanban } from "iconsax-react";

export default function SidebarProjectCard() {
  return (
    <div className="flex w-full items-center gap-2.5 rounded-xl border border-border bg-background p-3.5 shadow-xs">
      <span className="flex size-9 flex-none items-center justify-center rounded-[10px] bg-kb-gray-tint text-kb-text-2">
        <Kanban size={20} variant="Linear" color="currentColor" aria-hidden />
      </span>
      <span className="flex min-w-0 flex-1 flex-col gap-px">
        <span className="text-xs text-muted-foreground">Current project</span>
        <span className="truncate text-sm font-semibold">No project yet</span>
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
