import { Folder2 } from "iconsax-react";
import Link from "next/link";

import { Card, CardContent } from "@/components/ui/card";
import { PROJECT_TONE } from "@/constants/profile-constant";
import { cn } from "@/lib/utils";
import type { PinnedProject } from "@/types/profile";

import { HiddenNote } from "./profile-identity";

function PinnedCard({ project }: { project: PinnedProject }) {
  const tone = PROJECT_TONE[project.color];
  const body = (
    <>
      <span className="flex items-center gap-2 text-sm font-semibold">
        <Folder2 size={18} variant="Linear" color="currentColor" className="text-muted-foreground" aria-hidden />
        <span className="truncate">{project.name}</span>
      </span>
      {project.can_open && (
        <>
          <span className="line-clamp-2 text-[13px] leading-normal text-muted-foreground">
            {project.description || "No description"}
          </span>
          <span className="flex items-center gap-3 text-xs text-kb-text-2">
            <span className="flex items-center gap-1.5 whitespace-nowrap">
              <span className={cn("size-2 rounded-full", tone.dot)} />
              {project.done} of {project.total} done
            </span>
            <span className="h-1 flex-1 overflow-hidden rounded-full bg-kb-gray-tint">
              <span
                className={cn("block h-full rounded-full", tone.bar)}
                style={{ width: `${project.total ? (project.done / project.total) * 100 : 0}%` }}
              />
            </span>
          </span>
        </>
      )}
    </>
  );
  const card = (
    <Card className="h-full">
      <CardContent className="flex flex-col gap-2.5">{body}</CardContent>
    </Card>
  );

  // Pinned projects you can't open (not a member) stay as plain cards.
  return project.can_open ? (
    <Link href={`/projects/${project.project_id}`} className="min-w-0 rounded-xl outline-none focus-visible:ring-3 focus-visible:ring-ring/50">
      {card}
    </Link>
  ) : (
    <div className="min-w-0">{card}</div>
  );
}

export default function ProfilePinned({
  pinned,
  hidden,
  isSelf = true,
}: {
  pinned: PinnedProject[] | null;
  hidden: boolean;
  isSelf?: boolean;
}) {
  if (!pinned || (!isSelf && pinned.length === 0)) return null;

  return (
    <section aria-label="Pinned projects" className="flex flex-col gap-3">
      <div className="flex items-baseline justify-between gap-2">
        <h2 className="text-base font-semibold">Pinned projects</h2>
        {hidden && <HiddenNote />}
      </div>
      {pinned.length === 0 ? (
        <p className="rounded-xl border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
          No pinned projects yet. Pin up to 3 projects from their menu.
        </p>
      ) : (
        <div className="grid grid-cols-[repeat(auto-fit,minmax(min(15rem,100%),1fr))] gap-3.5">
          {pinned.map((p, i) => (
            <PinnedCard key={p.can_open ? p.project_id : `${p.name}-${i}`} project={p} />
          ))}
        </div>
      )}
    </section>
  );
}
