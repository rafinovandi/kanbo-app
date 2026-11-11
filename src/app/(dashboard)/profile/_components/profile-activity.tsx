import { Card, CardContent } from "@/components/ui/card";
import {
  GitHubActivity,
  type ContributionData,
} from "@/components/spaceui/github-activity";
import type { ActivityColor } from "@/constants/profile-constant";
import type { ActivitySummary } from "@/types/profile";

import { HiddenNote } from "./profile-identity";

// "N tasks completed in the last year" + the heatmap board (spaceui GitHub activity).
export default function ProfileActivity({
  contributions,
  summary,
  hidden,
  isSelf = true,
  color,
}: {
  contributions: ContributionData;
  summary: ActivitySummary;
  hidden: boolean;
  isSelf?: boolean;
  color?: ActivityColor;
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
          <GitHubActivity
            contributions={contributions}
            color={color}
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
