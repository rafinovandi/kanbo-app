import { Add } from "iconsax-react";

import NewProjectDialog from "@/components/common/new-project-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MY_TASKS_STEPS } from "@/constants/my-tasks-constant";
import { ACCENT_BADGE_CLASS, CTA_BUTTON_CLASS } from "@/constants/ui-constant";

import MyTasksEmptyIllustration from "./my-tasks-empty-illustration";

// Empty state for a user with no projects ("My Tasks (empty, new user)"): no card or outline,
// content centered on the page.
export default function MyTasksEmpty() {
  return (
    <section
      aria-labelledby="my-tasks-empty-title"
      className="flex flex-col items-center gap-7 px-6 pt-8 pb-10 text-center"
    >
      <MyTasksEmptyIllustration />

      <div className="flex max-w-[460px] flex-col items-center gap-2.5">
        <Badge className={ACCENT_BADGE_CLASS}>Welcome to Kanbo</Badge>
        <h2
          id="my-tasks-empty-title"
          className="text-2xl leading-tight font-semibold tracking-[-0.02em]"
        >
          Start your first project
        </h2>
        <p className="text-sm leading-relaxed text-muted-foreground">
          A project holds your board, tasks and team. Create one, add a few tasks, and invite
          people whenever you are ready.
        </p>
      </div>

      <NewProjectDialog>
        <Button type="button" className={CTA_BUTTON_CLASS}>
          <Add size={20} variant="Linear" color="currentColor" className="size-5" aria-hidden />
          New Project
        </Button>
      </NewProjectDialog>

      <ol
        aria-label="How it works"
        className="mt-2 grid w-full max-w-[720px] grid-cols-[repeat(auto-fit,minmax(min(200px,100%),1fr))] gap-3 text-left"
      >
        {MY_TASKS_STEPS.map((step) => (
          <li key={step.title} className="flex items-start gap-3 rounded-[14px] bg-kb-surface p-3.5">
            <span
              aria-hidden="true"
              className={`flex size-9 flex-none items-center justify-center rounded-[10px] ${step.toneClass}`}
            >
              <step.icon size={20} variant="Linear" color="currentColor" />
            </span>
            <span className="flex flex-col gap-0.5">
              <span className="text-sm font-semibold">{step.title}</span>
              <span className="text-[13px] text-muted-foreground">{step.description}</span>
            </span>
          </li>
        ))}
      </ol>
    </section>
  );
}
