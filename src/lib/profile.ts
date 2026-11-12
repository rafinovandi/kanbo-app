import { cache } from "react";
import { redirect } from "next/navigation";
import { connection } from "next/server";

import {
  AUTH_PROFILE_COLUMNS,
  INITIAL_STATE_PROFILE,
} from "@/constants/auth-constant";
import {
  ACTIVITY_DAYS,
  RECENT_TASKS_LIMIT,
} from "@/constants/profile-constant";
import { createClient } from "@/lib/supabase/server";
import type { AuthProfile } from "@/types/auth";
import type { ActivityRow, ProfileData, RecentTask } from "@/types/profile";

// The signed-in user's profile for Server Components. Verifies the session (getClaims), loads the
// profile row and redirects to /login when there is no session. `cache` makes it one query per
// request, so the sidebar and the page can both call it.
export const getCurrentProfile = cache(async (): Promise<AuthProfile> => {
  // getClaims() compares the token's expiry with Date.now(). With Cache Components that must not
  // run during prerender/prefetch, so wait for a real request first (callers sit behind <Suspense>).
  await connection();
  const supabase = await createClient();
  const { data: claimsData } = await supabase.auth.getClaims();
  const claims = claimsData?.claims;
  if (!claims?.sub) redirect("/login");

  const { data } = await supabase
    .from("profiles")
    .select(AUTH_PROFILE_COLUMNS)
    .eq("id", claims.sub)
    .single();

  // The profile is created by a trigger on first sign in; fall back to the token if it isn't readable.
  const email = typeof claims.email === "string" ? claims.email : "";
  return (
    data ?? {
      ...INITIAL_STATE_PROFILE,
      id: claims.sub,
      email,
      name: email.split("@")[0] || "User",
    }
  );
});

// Everything a profile page shows: the get_profile() payload, the activity graph rows and the
// last completed tasks of that user. RLS + the RPCs' own privacy checks decide what comes back;
// null means the profile does not exist or is not visible to the viewer (404).
export const getProfilePageData = cache(async (username?: string) => {
  const me = await getCurrentProfile();
  const supabase = await createClient();
  const target = username ?? me.username;

  const { data: raw } = await supabase.rpc("get_profile", {
    p_username: target,
  });
  const profile = (raw as ProfileData | null) ?? null;
  if (!profile && username) return null;

  const userId = profile?.id ?? me.id;
  const isSelf = userId === me.id;

  let showActivity = true;
  let showRecent = true;
  let timezone = me.timezone;
  if (!isSelf) {
    const { data: row } = await supabase
      .from("profiles")
      .select("show_activity, show_recent_tasks, timezone")
      .eq("id", userId)
      .single();
    showActivity = row?.show_activity ?? false;
    showRecent = row?.show_recent_tasks ?? false;
    timezone = row?.timezone ?? timezone;
  }

  const [activityRes, recentRes] = await Promise.all([
    showActivity
      ? supabase.rpc("activity_graph", {
          p_user_id: userId,
          p_days: ACTIVITY_DAYS,
        })
      : null,
    showRecent
      ? supabase
          .from("tasks")
          .select(
            "id, title, completed_at, projects(name, color), task_assignees!inner(user_id)",
          )
          .eq("task_assignees.user_id", userId)
          .not("completed_at", "is", null)
          .order("completed_at", { ascending: false })
          .limit(RECENT_TASKS_LIMIT)
      : null,
  ]);

  const activity = (activityRes?.data ?? []) as ActivityRow[];
  const recent: RecentTask[] = (recentRes?.data ?? []).flatMap((t) =>
    t.completed_at && t.projects
      ? [
          {
            id: t.id,
            title: t.title,
            completedAt: t.completed_at,
            projectName: t.projects.name,
            projectColor: t.projects.color,
          },
        ]
      : [],
  );

  return {
    me,
    profile,
    activity,
    recent,
    isSelf,
    timezone,
    showActivity,
    showRecent,
  };
});

// The editable text fields of the signed-in user's profile (Edit Profile form).
export const getEditableProfile = cache(async () => {
  const me = await getCurrentProfile();
  const supabase = await createClient();
  const [{ data }, { data: owned }] = await Promise.all([
    supabase
      .from("profiles")
      .select(
        "headline, bio, location, website, username, telegram_username, show_stats, show_activity, show_pinned, show_recent_tasks",
      )
      .eq("id", me.id)
      .single(),
    supabase
      .from("projects")
      .select("name")
      .eq("owner_id", me.id)
      .order("name"),
  ]);
  return {
    me,
    ownedProjects: (owned ?? []).map((project) => project.name),
    fields: {
      name: me.name,
      headline: data?.headline ?? "",
      bio: data?.bio ?? "",
      location: data?.location ?? "",
      website: data?.website ?? "",
      username: data?.username ?? "",
      telegram_username: data?.telegram_username ?? "",
      show_stats: data?.show_stats ?? true,
      show_activity: data?.show_activity ?? true,
      show_pinned: data?.show_pinned ?? true,
      show_recent_tasks: data?.show_recent_tasks ?? false,
    },
  };
});
