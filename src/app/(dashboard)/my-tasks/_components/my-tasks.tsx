import { TaskSquare } from "iconsax-react";

import PageTransition from "@/components/common/page-transition";
import PageHeader from "../../_components/page-header";
import MyTasksContent from "./my-tasks-content";

export default function MyTasks() {
  return (
    <PageTransition>
      <PageHeader title="My Tasks" icon={TaskSquare} />
      <div className="flex flex-col gap-6 p-4 sm:p-7">
        <MyTasksContent />
      </div>
    </PageTransition>
  );
}
