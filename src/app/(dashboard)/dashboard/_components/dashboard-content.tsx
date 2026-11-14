"use client";

import { MotionConfig, motion } from "motion/react";

import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { STAGGER_ITEM, STAGGER_LIST } from "@/constants/motion-constant";
import useDashboardStats from "@/hooks/use-dashboard-stats";

import DashboardEmpty from "./dashboard-empty";
import DashboardActivity from "./dashboard-activity";
import DashboardProgress from "./dashboard-progress";
import DashboardProjects from "./dashboard-projects";
import DashboardStatBoxes from "./dashboard-stats";

// With projects: stat boxes and the two cards. Without: the empty state.
export default function DashboardContent() {
  const { data: stats, isLoading, isError } = useDashboardStats();

  if (isLoading) {
    return (
      <div className="grid grid-cols-[repeat(auto-fit,minmax(min(200px,100%),1fr))] gap-4">
        {Array.from({ length: 5 }, (_, i) => (
          <Skeleton key={i} className="h-[104px] rounded-xl" />
        ))}
      </div>
    );
  }

  if (isError || !stats) {
    return (
      <p className="text-sm text-muted-foreground">
        Could not load your dashboard. Refresh to try again.
      </p>
    );
  }

  if (stats.project_count === 0) return <DashboardEmpty />;

  return (
    <MotionConfig reducedMotion="user">
      <motion.div
        variants={STAGGER_LIST}
        initial="hidden"
        animate="visible"
        className="flex flex-col gap-6"
      >
        <motion.div variants={STAGGER_ITEM}>
          <DashboardStatBoxes stats={stats} />
        </motion.div>
        <motion.div variants={STAGGER_ITEM}>
          <Separator />
        </motion.div>
        <div className="grid grid-cols-[repeat(auto-fit,minmax(min(300px,100%),1fr))] items-start gap-4">
          <motion.div variants={STAGGER_ITEM}>
            <DashboardProjects projects={stats.projects} />
          </motion.div>
          <div className="flex flex-col gap-4">
            <motion.div variants={STAGGER_ITEM}>
              <DashboardProgress stats={stats} />
            </motion.div>
            <motion.div variants={STAGGER_ITEM}>
              <DashboardActivity />
            </motion.div>
          </div>
        </div>
      </motion.div>
    </MotionConfig>
  );
}
