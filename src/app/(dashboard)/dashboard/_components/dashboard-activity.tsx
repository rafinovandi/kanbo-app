"use client";

import { Warning2 } from "iconsax-react";
import { TrendingUp } from "lucide-react";

import PeakLineChart from "@/components/common/peak-line-chart";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import useDashboardActivity, {
  DASHBOARD_ACTIVITY_DAYS,
} from "@/hooks/use-dashboard-activity";

export default function DashboardActivity() {
  const { data, isLoading, isError } = useDashboardActivity();

  const best = data?.reduce(
    (top, point) => (point.value > top.value ? point : top),
    { key: "", label: "", value: 0 },
  );
  const headline =
    best && best.value > 0
      ? `Best day: ${best.label}, ${best.value} ${best.value === 1 ? "task" : "tasks"}`
      : "No tasks completed yet";

  return (
    <Card aria-label="Completed tasks">
      <CardHeader>
        <CardTitle className="text-[15px] font-semibold">
          Completed tasks
        </CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <Skeleton className="h-40 w-full" />
        ) : isError || !data ? (
          <Alert variant="destructive">
            <Warning2
              size={16}
              variant="Linear"
              color="currentColor"
              aria-hidden
            />
            <AlertDescription>Could not load your activity.</AlertDescription>
          </Alert>
        ) : (
          <PeakLineChart data={data} label="Completed" />
        )}
      </CardContent>
      <CardFooter className="flex-col items-start gap-2 text-sm">
        <div className="flex items-center gap-2 leading-none font-medium">
          {headline}
          {best && best.value > 0 && (
            <TrendingUp className="size-4" aria-hidden />
          )}
        </div>
        <div className="leading-none text-muted-foreground">
          Showing tasks you completed in the last {DASHBOARD_ACTIVITY_DAYS} days
        </div>
      </CardFooter>
    </Card>
  );
}
