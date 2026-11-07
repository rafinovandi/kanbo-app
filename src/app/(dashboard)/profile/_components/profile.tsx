import { User } from "iconsax-react";
import { Suspense } from "react";

import PageTransition from "@/components/common/page-transition";
import PageHeader from "../../_components/page-header";
import ProfileContent from "./profile-content";
import ProfileSkeleton from "./profile-skeleton";

// Your own profile: identity on the left; pinned projects, activity graph, streaks
// and recent activity on the right. Data streams in behind <Suspense> (it reads the session).
export default function Profile() {
  return (
    <PageTransition>
      <PageHeader title="Profile" icon={User} />
      <Suspense fallback={<ProfileSkeleton />}>
        <ProfileContent />
      </Suspense>
    </PageTransition>
  );
}
