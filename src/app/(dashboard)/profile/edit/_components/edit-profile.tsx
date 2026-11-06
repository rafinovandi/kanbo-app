import { Suspense } from "react";

import PageTransition from "@/components/common/page-transition";
import { getEditableProfile } from "@/lib/profile";

import PageHeader from "../../../_components/page-header";
import EditProfileForm from "./edit-profile-form";
import EditProfileSkeleton from "./edit-profile-skeleton";

async function EditProfileLoader() {
  const { me, fields } = await getEditableProfile();
  return <EditProfileForm me={me} initial={fields} />;
}

// Edit Profile (spec §12): photo, profile fields, account and a sticky save bar.
export default function EditProfile() {
  return (
    <PageTransition>
      <PageHeader title="Edit Profile" backHref="/profile" />
      <Suspense fallback={<EditProfileSkeleton />}>
        <EditProfileLoader />
      </Suspense>
    </PageTransition>
  );
}
