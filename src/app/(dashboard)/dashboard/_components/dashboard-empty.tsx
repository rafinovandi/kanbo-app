import { Add } from "iconsax-react";

import NewProjectDialog from "@/components/common/new-project-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ACCENT_BADGE_CLASS, CTA_BUTTON_CLASS } from "@/constants/ui-constant";

import DashboardEmptyPreview from "./dashboard-empty-preview";

// Empty state for a user with no projects: "Dashboard empty · Variant D" (text left, preview right).
export default function DashboardEmpty() {
  return (
    <section
      aria-labelledby="dashboard-empty-title"
      className="flex flex-wrap items-center gap-10 pt-14"
    >
      <div className="flex min-w-0 max-w-[460px] flex-[1_1_320px] flex-col items-start gap-4">
        <Badge className={ACCENT_BADGE_CLASS}>Getting started</Badge>
        <h2
          id="dashboard-empty-title"
          className="text-2xl leading-tight font-semibold tracking-[-0.02em]"
        >
          Create your first project to start tracking tasks
        </h2>
        <p className="text-sm leading-relaxed text-muted-foreground">
          Your dashboard fills up as you work: task counts, project progress and how much you
          finish, all in one place.
        </p>
        <NewProjectDialog>
          <Button type="button" className={CTA_BUTTON_CLASS}>
            <Add size={20} variant="Linear" color="currentColor" className="size-5" aria-hidden />
            New Project
          </Button>
        </NewProjectDialog>
      </div>

      <DashboardEmptyPreview />
    </section>
  );
}
