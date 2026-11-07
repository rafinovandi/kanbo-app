"use client";

import ProgressRing from "@/components/common/progress-ring";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getProgressPercent } from "@/constants/dashboard-constant";
import { PROJECT_TONE } from "@/constants/profile-constant";
import useBoard from "@/hooks/use-board";
import { cn } from "@/lib/utils";

// The column after the categories: the project's progress ring and tasks per status.
// It reads the whole board, not the searched one.
export default function BoardOverview({ projectId }: { projectId: string }) {
  const { data } = useBoard(projectId);
  if (!data) return null;

  const total = data.tasks.length;
  const doneIds = new Set(data.categories.filter((category) => category.key === "done").map((category) => category.id));
  const done = data.tasks.filter((task) => doneIds.has(task.categoryId)).length;

  return (
    <section aria-label="Overview" className="flex w-[300px] flex-none snap-start flex-col gap-2.5 rounded-[20px] bg-kb-surface p-2.5">
      <h2 className="flex min-h-8 items-center pl-1.5 text-sm font-semibold">Overview</h2>

      <Card>
        <CardContent className="flex flex-col gap-3">
          <ProgressRing percent={getProgressPercent(done, total)} />
          <p className="text-center text-[13px] text-muted-foreground">
            {done} of {total} tasks done
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-[15px] font-semibold">Tasks by status</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          {data.categories.map((category) => {
            const count = data.tasks.filter((task) => task.categoryId === category.id).length;
            return (
              <div key={category.id} className="flex flex-col gap-1.5">
                <div className="flex items-center justify-between text-[13px]">
                  <span className="flex items-center gap-2 text-kb-text-2">
                    <span className={cn("size-2 rounded-full", PROJECT_TONE[category.color].dot)} aria-hidden="true" />
                    {category.name}
                  </span>
                  <span className="font-semibold">{count}</span>
                </div>
                <div className="h-1.5 overflow-hidden rounded-full bg-kb-gray-tint">
                  <div
                    className={cn("h-full rounded-full", PROJECT_TONE[category.color].bar)}
                    style={{ width: `${getProgressPercent(count, total)}%` }}
                  />
                </div>
              </div>
            );
          })}
        </CardContent>
      </Card>
    </section>
  );
}
