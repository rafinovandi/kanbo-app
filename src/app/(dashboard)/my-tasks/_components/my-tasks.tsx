import { TaskSquare } from "iconsax-react";

import PageTransition from "@/components/common/page-transition";
import PageHeader from "../../_components/page-header";
import MyTasksEmpty from "./my-tasks-empty";

// My Tasks. No project data yet, so it always shows the empty state (search and the header
// New Project button stay hidden, as in the design); project sections come with the project features.
export default function MyTasks() {
  return (
    <PageTransition>
      <PageHeader title="My Tasks" icon={TaskSquare} />
      <div className="flex flex-col gap-6 p-4 sm:p-7">
        <div className="flex flex-col gap-1.5">
          <h1 className="text-[28px] leading-tight font-semibold tracking-[-0.02em]">My Tasks</h1>
          <p className="text-sm text-muted-foreground">
            Every task, grouped by project. Open a project to see its board.
          </p>
        </div>
        <MyTasksEmpty />
      </div>
    </PageTransition>
  );
}
