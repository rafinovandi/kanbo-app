import { Card, CardContent } from "@/components/ui/card";
import type { ContributionData } from "@/components/spaceui/github-activity";
import type { ActivitySummary } from "@/types/profile";

import ProfileActivityGraph from "./profile-activity-graph";
import { HiddenNote } from "./profile-identity";

// "N tasks completed in the last year" + the heatmap board (spaceui GitHub activity).
export default function ProfileActivity({
  contributions,
  summary,
  hidden,
  isSelf = true,
}: {
  contributions: ContributionData;
  summary: ActivitySummary;
  hidden: boolean;
  isSelf?: boolean;
}) {
  return (
    <section aria-label="Activity" className="flex flex-col gap-3">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 className="text-base font-semibold">
          {summary.total} {summary.total === 1 ? "task" : "tasks"} completed in
          the last year
        </h2>
        <span className="text-[13px] text-muted-foreground">
          {hidden && (
            <>
              <HiddenNote />
              {" · "}
            </>
          )}
          {summary.rangeLabel}
        </span>
      </div>
      <Card>
        <CardContent>
          <ProfileActivityGraph
            contributions={contributions}
            useOwnColor={isSelf}
            helperText={
              isSelf
                ? "Every task you mark as done adds to a day."
                : "Every task marked as done adds to a day."
            }
          />
        </CardContent>
      </Card>
    </section>
  );
}
