import { Element3 } from "iconsax-react";
import { Suspense } from "react";

import PageTransition from "@/components/common/page-transition";
import PageHeader from "../../_components/page-header";
import DashboardEmpty from "./dashboard-empty";
import DashboardGreeting, { DashboardGreetingSkeleton } from "./dashboard-greeting";

export default function Dashboard() {
  return (
    <PageTransition>
      <PageHeader title="Dashboard" icon={Element3} />
      <div className="flex flex-col gap-6 p-4 sm:p-7">
        <Suspense fallback={<DashboardGreetingSkeleton />}>
          <DashboardGreeting subtitle="You don't have any projects yet." />
        </Suspense>
        <DashboardEmpty />
      </div>
    </PageTransition>
  );
}
