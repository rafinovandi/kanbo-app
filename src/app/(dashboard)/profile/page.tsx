import { redirect } from "next/navigation";
import { Suspense } from "react";

import { getCurrentProfile } from "@/lib/profile";

import ProfileSkeleton from "./_components/profile-skeleton";

export const metadata = {
  title: "Profile | Kanbo",
};

async function ToOwnProfile() {
  const me = await getCurrentProfile();
  redirect(`/u/${me.username}`);
  return null;
}

// /profile is a shortcut: every profile, yours included, lives at /u/[username].
export default function ProfilePage() {
  return (
    <Suspense fallback={<ProfileSkeleton />}>
      <ToOwnProfile />
    </Suspense>
  );
}
