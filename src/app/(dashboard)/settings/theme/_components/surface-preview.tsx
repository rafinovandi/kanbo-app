import type { Surface } from "@/constants/theme-constant";
import { cn } from "@/lib/utils";

const SURFACE_CLASS: Record<Surface, { card: string; panel: string }> = {
  outline: {
    card: "bg-card ring-1 ring-foreground/10",
    panel: "border border-border bg-background shadow-xs",
  },
  filled: {
    card: "bg-kb-fill",
    panel: "bg-kb-fill",
  },
};

function Bar({ className }: { className?: string }) {
  return (
    <span className={cn("block h-1.5 rounded-full bg-border", className)} />
  );
}

function StatSkeleton({
  dotClass,
  className,
}: {
  dotClass: string;
  className: string;
}) {
  return (
    <div
      className={cn(
        "flex min-w-0 flex-1 flex-col gap-2 rounded-lg p-2.5",
        className,
      )}
    >
      <div className="flex items-center gap-1.5">
        <span className={cn("block size-1.5 rounded-full", dotClass)} />
        <Bar className="w-10" />
      </div>
      <span className="block h-3 w-6 rounded bg-border" />
    </div>
  );
}

// Plain divs styled from the prop, so the global filled-card CSS never changes this example.
export default function SurfacePreview({ surface }: { surface: Surface }) {
  const classes = SURFACE_CLASS[surface];

  return (
    <div
      aria-hidden="true"
      className="flex h-36 overflow-hidden rounded-lg border border-border bg-background"
    >
      <div className="flex w-[38%] flex-none flex-col gap-2.5 border-r border-kb-divider p-2.5">
        <div className="flex items-center gap-1.5">
          <span className="block size-5 flex-none rounded-md bg-kb-blue" />
          <div className="flex flex-col gap-1">
            <Bar className="w-8 bg-kb-text-2/30" />
            <Bar className="w-12" />
          </div>
        </div>
        <div
          className={cn(
            "flex items-center gap-1.5 rounded-lg p-2",
            classes.panel,
          )}
        >
          <span className="block size-4 flex-none rounded bg-kb-blue-tint" />
          <div className="flex flex-col gap-1">
            <Bar className="w-8" />
            <Bar className="w-10 bg-kb-text-2/30" />
          </div>
        </div>
        <div className="flex items-center gap-1.5 rounded-md bg-sidebar-primary px-1.5 py-1.5">
          <span className="block size-2 flex-none rounded-sm bg-sidebar-primary-foreground" />
          <Bar className="w-10 bg-sidebar-primary-foreground/60" />
        </div>
      </div>

      <div className="flex min-w-0 flex-1 flex-col">
        <div className="flex items-center gap-1.5 border-b border-kb-divider px-2.5 py-2">
          <span className="block size-2.5 flex-none rounded-sm bg-border" />
          <Bar className="w-12 bg-kb-text-2/30" />
        </div>
        <div className="flex flex-col gap-2 p-2.5">
          <span className="block h-3 w-20 rounded bg-kb-text-2/30" />
          <Bar className="w-28" />
          <div className="mt-1 flex gap-2">
            <StatSkeleton dotClass="bg-foreground" className={classes.card} />
            <StatSkeleton
              dotClass="bg-muted-foreground"
              className={classes.card}
            />
            <StatSkeleton dotClass="bg-kb-blue" className={classes.card} />
          </div>
        </div>
      </div>
    </div>
  );
}
