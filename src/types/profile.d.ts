import type { Enums } from "./database.types";

export type ProjectColor = Enums<"project_color">;

// Hand-written shape of the get_profile(p_username) jsonb (the generated type is just Json).
export type ProfileStats = {
  projects: number;
  open_tasks: number;
  completed_this_year: number;
};

// Only returned for the owner of the profile ("Hidden from others" labels).
export type ProfilePrivacy = {
  show_stats: boolean;
  show_activity: boolean;
  show_pinned: boolean;
  show_recent_tasks: boolean;
};

export type PinnedProject =
  | {
      can_open: true;
      project_id: string;
      name: string;
      color: ProjectColor;
      description: string;
      total: number;
      done: number;
    }
  | { can_open: false; name: string; color: ProjectColor };

export type ProfileData = {
  id: string;
  is_self: boolean;
  name: string;
  username: string;
  avatar_url: string | null;
  avatar_bg: string;
  avatar_fg: string;
  headline: string | null;
  bio: string | null;
  location: string | null;
  website: string | null;
  privacy: ProfilePrivacy | null;
  // null when the owner hides stats from others
  stats: ProfileStats | null;
  // null when the owner hides pinned projects from others
  pinned: PinnedProject[] | null;
};

// One row of activity_graph(): tasks completed on a day (in the user's timezone).
export type ActivityRow = { day: string; completed: number };

export type RecentTask = {
  id: string;
  title: string;
  completedAt: string;
  projectName: string;
  projectColor: ProjectColor;
};

export type ActivitySummary = {
  total: number;
  rangeLabel: string;
  streak: number;
  longest: number;
  bestCount: number;
  bestDateLabel: string;
  thisWeek: number;
};
