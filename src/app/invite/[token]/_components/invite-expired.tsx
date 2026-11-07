import Link from "next/link";

import ErrorPage from "@/components/common/error-page";
import { Button } from "@/components/ui/button";

import InviteExpiredIllustration from "./invite-expired-illustration";

const BUTTON_CLASS = "h-12 w-full rounded-xl text-[15px] font-medium";

// 410: the invite link is expired, already used or cancelled (spec §13).
export default function InviteExpired() {
  return (
    <ErrorPage
      code="410"
      label="Error 410 · Link expired"
      tone="yellow"
      illustration={<InviteExpiredIllustration />}
      stars={["lilac", "orange", "pink"]}
      heading="This link has expired"
      message="Links like invites and sign-in codes only work once and for a limited time. Ask whoever sent it for a fresh link."
      primary={
        <Button asChild className={BUTTON_CLASS}>
          <Link href="/my-tasks">Back to My Tasks</Link>
        </Button>
      }
      secondary={
        <Button asChild variant="outline" className={BUTTON_CLASS}>
          <Link href="/dashboard">Go to Dashboard</Link>
        </Button>
      }
      note="Already accepted the invite? Your projects are on the dashboard."
    />
  );
}
