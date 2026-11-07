import { Edit2, Folder2, Location, TickSquare, Clock, type Icon } from "iconsax-react";
import Link from "next/link";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { getInitials } from "@/lib/utils";
import type { ProfileData } from "@/types/profile";

function StatRow({ icon: StatIcon, value, label }: { icon: Icon; value: number; label: string }) {
  return (
    <li className="flex items-center gap-2.5">
      <StatIcon size={18} variant="Linear" color="currentColor" className="text-kb-text-2" aria-hidden />
      <span>
        <strong className="font-semibold text-foreground">{value}</strong> {label}
      </span>
    </li>
  );
}

// Left column: avatar, name, headline, bio, location, Edit Profile and the three stat rows.
export default function ProfileIdentity({
  profile,
  openTasks,
}: {
  profile: ProfileData;
  openTasks?: number;
}) {
  const stats = profile.stats;

  return (
    <aside aria-label="About" className="flex min-w-0 flex-[1_1_15rem] flex-col gap-4.5">
      {/* Design size: 168px with large initials (UserAvatar only has small sizes). */}
      <Avatar className="size-42 self-center border-4 border-background ring-1 ring-border">
        {profile.avatar_url && (
          <AvatarImage src={profile.avatar_url} alt={profile.name} referrerPolicy="no-referrer" />
        )}
        <AvatarFallback
          className="text-5xl font-semibold tracking-tight"
          style={{ backgroundColor: profile.avatar_bg, color: profile.avatar_fg }}
        >
          {getInitials(profile.name)}
        </AvatarFallback>
      </Avatar>
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl leading-tight font-semibold tracking-[-0.01em]">{profile.name}</h1>
        <p className="text-[15px] text-muted-foreground">{profile.headline || "Add a headline"}</p>
      </div>
      <p className={profile.bio ? "text-sm leading-relaxed text-kb-text-2" : "text-sm leading-relaxed text-muted-foreground"}>
        {profile.bio || "Add a short bio about yourself."}
      </p>
      {profile.location && (
        <p className="flex items-center gap-2 text-sm text-kb-text-2">
          <Location size={18} variant="Linear" color="currentColor" className="shrink-0 text-muted-foreground" aria-hidden />
          {profile.location}
        </p>
      )}
      <Button asChild variant="outline">
        <Link href="/profile/edit">
          <Edit2 size={18} variant="Linear" color="currentColor" aria-hidden />
          Edit Profile
        </Link>
      </Button>
      {stats && (
        <>
          <Separator />
          <ul className="flex flex-col gap-3 text-sm text-kb-text-2">
            <StatRow icon={Folder2} value={stats.projects} label={stats.projects === 1 ? "project" : "projects"} />
            <StatRow icon={TickSquare} value={stats.completed_this_year} label="tasks completed this year" />
            <StatRow icon={Clock} value={openTasks ?? stats.open_tasks} label="open tasks" />
          </ul>
          {profile.privacy?.show_stats === false && <HiddenNote />}
        </>
      )}
    </aside>
  );
}

// Shown on your own profile when a section is hidden from other people.
export function HiddenNote() {
  return <p className="text-xs text-muted-foreground">Hidden from others</p>;
}
