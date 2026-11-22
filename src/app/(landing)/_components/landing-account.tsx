import Link from "next/link";

import UserAvatar from "@/components/common/user-avatar";
import { Button } from "@/components/ui/button";
import { CTA_BUTTON_CLASS } from "@/constants/ui-constant";
import { getOptionalProfile } from "@/lib/profile";

// The right end of the header: a Sign in button for visitors, the profile picture (a link to the dashboard) for
// someone who is signed in. It reads the session, so it streams in behind <Suspense>.
export default async function LandingAccount() {
  const profile = await getOptionalProfile();

  if (!profile) {
    return (
      <Button asChild variant="outline" className={CTA_BUTTON_CLASS}>
        <Link href="/login">Sign in</Link>
      </Button>
    );
  }

  return (
    <Link
      href="/dashboard"
      aria-label={`Open dashboard, signed in as ${profile.name}`}
      title={profile.name}
      className="inline-flex rounded-full outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
    >
      <UserAvatar
        name={profile.name}
        avatarUrl={profile.avatar_url}
        avatarBg={profile.avatar_bg}
        avatarFg={profile.avatar_fg}
        size="lg"
      />
    </Link>
  );
}
