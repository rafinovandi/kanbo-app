import { Suspense } from "react";

import InviteAccept from "./_components/invite-accept";

export const metadata = {
  title: "Invite | Kanbo",
  robots: { index: false },
};

export default function InvitePage({ params }: PageProps<"/invite/[token]">) {
  return (
    <Suspense fallback={null}>
      <InviteAccept params={params} />
    </Suspense>
  );
}
