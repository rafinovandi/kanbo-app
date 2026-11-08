import { User } from "iconsax-react";
import { notFound } from "next/navigation";
import { Suspense } from "react";

import PageTransition from "@/components/common/page-transition";

import PageHeader from "../../_components/page-header";
import ProfileContent from "../../profile/_components/profile-content";
import ProfileSkeleton from "../../profile/_components/profile-skeleton";

export const metadata = {
  title: "Profile | Kanbo",
};

async function OtherProfile({ params }: { params: Promise<{ username: string }> }) {
  const { username } = await params;
  let decoded: string;
  try {
    decoded = decodeURIComponent(username);
  } catch {
    notFound();
  }
  return <ProfileContent username={decoded} />;
}

// Someone else's profile. Only people who share a project can open it; everyone else gets a 404.
export default function UserProfilePage({ params }: { params: Promise<{ username: string }> }) {
  return (
    <PageTransition>
      <PageHeader title="Profile" icon={User} />
      <Suspense fallback={<ProfileSkeleton />}>
        <OtherProfile params={params} />
      </Suspense>
    </PageTransition>
  );
}
