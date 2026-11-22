import type { ReactNode } from "react";

import { Card } from "@/components/ui/card";
import { TASK_PRIORITY_CHIP } from "@/constants/my-tasks-constant";
import { cn } from "@/lib/utils";

import LandingCodeDemo from "./landing-code-demo";
import LandingColumnsDemo from "./landing-columns-demo";
import LandingPriorityDemo from "./landing-priority-demo";
import LandingRolesDemo from "./landing-roles-demo";
import LandingTelegram from "./landing-telegram";
import Words from "./words";

// A feature: a grey card with a headline and a sub headline, and the live component in a white card inside it.
function Feature({
  title,
  description,
  className,
  innerClassName,
  children,
}: {
  title: string;
  description: string;
  className?: string;
  innerClassName?: string;
  children: ReactNode;
}) {
  return (
    <div
      className={cn(
        "kb-reveal flex min-w-0 flex-col gap-7 rounded-[28px] bg-kb-surface p-6 sm:p-8",
        className,
      )}
    >
      <div className="flex flex-col gap-2">
        <h3 className="kb-words text-2xl font-semibold tracking-[-0.02em]">
          <Words text={title} />
        </h3>
        <p className="kb-words max-w-[460px] text-[15px] leading-relaxed text-kb-text-2 [--base:250ms] [--step:25ms]">
          <Words text={description} />
        </p>
      </div>
      <Card
        className={cn(
          "gap-0 rounded-2xl p-4 [--card-spacing:0px]",
          innerClassName,
        )}
      >
        {children}
      </Card>
    </div>
  );
}

export default function LandingFeatures() {
  return (
    <section
      id="features"
      className="mx-auto flex w-full max-w-[1200px] scroll-mt-20 flex-col gap-12 px-6 pt-24 sm:px-10"
    >
      <h2 className="kb-words max-w-[820px] text-4xl leading-[1.12] font-semibold tracking-[-0.04em] text-muted-foreground sm:text-[52px]">
          <Words text="Made for teams that want to see" />{" "}
          <span className="text-foreground">
            <Words text="what is next" start={7} />
          </span>{" "}
          <span aria-hidden="true" className="inline-flex gap-1.5 align-middle">
            {(["low", "medium", "high"] as const).map((priority) => (
              <span
                key={priority}
                className={cn(
                  "inline-flex h-8 w-[68px] items-center justify-center rounded-[9px] text-sm font-semibold tracking-normal",
                  TASK_PRIORITY_CHIP[priority].className,
                )}
              >
                {TASK_PRIORITY_CHIP[priority].label}
              </span>
            ))}
          </span>
        </h2>

      <div className="grid gap-5 lg:grid-cols-12">
        <Feature
          title="Columns that match how you work"
          description="Start with To Do, In Progress, Preview, and Done. Admins can add their own columns and choose a color for each."
          className="lg:col-span-7"
        >
          <LandingColumnsDemo />
        </Feature>
        <Feature
          title="A role for every teammate"
          description="Invite people by email and say what each one does."
          className="lg:col-span-5"
          innerClassName="px-4.5 pt-4 pb-1"
        >
          <LandingRolesDemo />
        </Feature>
        <Feature
          title="Priorities you can feel"
          description="Drag the slider from Low to High. The card shows it, and so does the due date."
          className="lg:col-span-5"
          innerClassName="my-auto w-full max-w-80 gap-3.5 self-center px-4.5 pt-4 pb-3.5 shadow-xl"
        >
          <LandingPriorityDemo />
        </Feature>
        <Feature
          title="Write tasks in full"
          description="Add details to any task, including code blocks, so nobody has to ask what you meant."
          className="lg:col-span-7"
        >
          <LandingCodeDemo />
        </Feature>
      </div>

      <LandingTelegram />
    </section>
  );
}
