import { TickCircle } from "iconsax-react";

import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { PROJECT_TONE } from "@/constants/profile-constant";
import { formatCompletedDate } from "@/lib/profile-activity";
import { cn } from "@/lib/utils";
import type { RecentTask } from "@/types/profile";

import { HiddenNote } from "./profile-identity";

// Up to 6 completed tasks. Opening a task needs the Task modal, which isn't built yet.
export default function ProfileRecent({
  tasks,
  timeZone,
  hidden,
  isSelf = true,
}: {
  tasks: RecentTask[];
  timeZone: string;
  hidden: boolean;
  isSelf?: boolean;
}) {
  return (
    <section aria-label="Recent activity" className="flex flex-col gap-3">
      <div className="flex items-baseline justify-between gap-2">
        <h2 className="text-base font-semibold">Recent activity</h2>
        {hidden && <HiddenNote />}
      </div>
      {tasks.length === 0 ? (
        <p className="rounded-xl border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
          {isSelf ? "Tasks you complete will show up here." : "No completed tasks to show yet."}
        </p>
      ) : (
        <Card className="gap-0 py-0">
        <ul>
          {tasks.map((t) => (
            <li
              key={t.id}
              className="flex min-h-13.5 flex-wrap items-center gap-x-3 gap-y-2 border-b border-kb-divider px-4 py-2.5 last:border-b-0"
            >
              <TickCircle size={20} variant="Linear" color="currentColor" className="shrink-0 text-kb-green" aria-hidden />
              <span className="min-w-0 flex-[1_1_16rem] text-sm text-kb-text-2">
                Completed <strong className="font-semibold text-foreground">{t.title}</strong>
              </span>
              <Badge variant="outline" className="gap-1.5">
                <span className={cn("size-2 rounded-full", PROJECT_TONE[t.projectColor].dot)} />
                {t.projectName}
              </Badge>
              <span className="w-14 text-right text-[13px] text-muted-foreground">
                {formatCompletedDate(t.completedAt, timeZone)}
              </span>
            </li>
          ))}
        </ul>
        </Card>
      )}
    </section>
  );
}
