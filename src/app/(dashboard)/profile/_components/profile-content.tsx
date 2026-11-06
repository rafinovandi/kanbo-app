import { getProfilePageData } from "@/lib/profile";
import { buildActivity, todayInTimezone } from "@/lib/profile-activity";

import ProfileActivity from "./profile-activity";
import ProfileIdentity from "./profile-identity";
import ProfilePinned from "./profile-pinned";
import ProfileRecent from "./profile-recent";
import ProfileStreaks from "./profile-streaks";

export default async function ProfileContent() {
  const { me, profile, activity, recent } = await getProfilePageData();
  // get_profile only returns null for a missing row; fall back to the session profile.
  const data = profile ?? {
    id: me.id,
    is_self: true,
    name: me.name,
    username: me.username,
    avatar_url: me.avatar_url,
    avatar_bg: me.avatar_bg,
    avatar_fg: me.avatar_fg,
    headline: null,
    bio: null,
    location: null,
    website: null,
    privacy: null,
    stats: null,
    pinned: [],
  };
  const { contributions, summary } = buildActivity(activity, todayInTimezone(new Date(), me.timezone));

  return (
    <div className="flex flex-wrap items-start gap-8 p-4 pb-12 sm:p-7 sm:pb-12">
      <ProfileIdentity profile={data} openTasks={data.stats?.open_tasks} />
      <div className="flex min-w-0 flex-[999_1_35rem] flex-col gap-7">
        <ProfilePinned pinned={data.pinned} hidden={data.privacy?.show_pinned === false} />
        <ProfileActivity
          contributions={contributions}
          summary={summary}
          hidden={data.privacy?.show_activity === false}
        />
        <ProfileStreaks summary={summary} />
        <ProfileRecent
          tasks={recent}
          timeZone={me.timezone}
          hidden={data.privacy?.show_recent_tasks === false}
        />
      </div>
    </div>
  );
}
