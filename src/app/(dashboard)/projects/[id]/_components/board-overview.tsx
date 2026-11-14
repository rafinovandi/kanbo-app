"use client";

import ProgressRing from "@/components/common/progress-ring";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
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
  const doneIds = new Set(
    data.categories
      .filter((category) => category.key === "done")
      .map((category) => category.id),
  );
  const done = data.tasks.filter((task) => doneIds.has(task.categoryId)).length;

  const counts = data.categories.map((category) => ({
    category,
    count: data.tasks.filter((task) => task.categoryId === category.id).length,
  }));

  return (
    <section
      aria-label="Overview"
      className="kb-column flex w-[300px] flex-none snap-start flex-col gap-2.5 rounded-[20px] bg-kb-surface p-2.5"
    >
      <h2 className="flex min-h-8 items-center pl-1.5 text-sm font-semibold">
        Overview
      </h2>

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
          <CardTitle className="text-[15px] font-semibold">
            Tasks by status
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          <Progress
            aria-label="Tasks by status"
            className="h-4 bg-kb-gray-tint"
            segments={counts.map(({ category, count }) => ({
              id: category.id,
              value: count,
              className: cn(PROJECT_TONE[category.color].bar, "rounded-[3.5px]"),
            }))}
          />
          {counts.map(({ category, count }) => (
            <div
              key={category.id}
              className="flex items-center justify-between text-[13px]"
            >
              <span className="flex items-center gap-2 text-kb-text-2">
                <span
                  className={cn(
                    "size-2 rounded-full",
                    PROJECT_TONE[category.color].dot,
                  )}
                  aria-hidden="true"
                />
                {category.name}
              </span>
              <span className="font-semibold">{count}</span>
            </div>
          ))}
        </CardContent>
      </Card>
    </section>
  );
}
