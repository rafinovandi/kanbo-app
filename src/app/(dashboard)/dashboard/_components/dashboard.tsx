import { Element3 } from "iconsax-react";
import { Suspense } from "react";

import PageTransition from "@/components/common/page-transition";
import PendingInviteBanner from "@/components/common/pending-invite-banner";
import PageHeader from "../../_components/page-header";
import DashboardContent from "./dashboard-content";
import DashboardGreeting, { DashboardGreetingSkeleton } from "./dashboard-greeting";
import DashboardSubtitle from "./dashboard-subtitle";

export default function Dashboard() {
  return (
    <PageTransition>
      <PageHeader title="Dashboard" icon={Element3} />
      <div className="flex flex-col gap-6 p-4 sm:p-7">
        <Suspense fallback={<DashboardGreetingSkeleton />}>
          <DashboardGreeting>
            <DashboardSubtitle />
          </DashboardGreeting>
        </Suspense>
        <PendingInviteBanner />
        <DashboardContent />
      </div>
    </PageTransition>
  );
}
