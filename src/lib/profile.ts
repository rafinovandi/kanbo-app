import { cache } from "react";
import { redirect } from "next/navigation";
import { connection } from "next/server";

import { AUTH_PROFILE_COLUMNS, INITIAL_STATE_PROFILE } from "@/constants/auth-constant";
import { ACTIVITY_DAYS, RECENT_TASKS_LIMIT } from "@/constants/profile-constant";
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

// Everything the /profile page shows: the get_profile() payload, the activity graph rows and the
// last completed tasks. RLS + the RPCs' own privacy checks decide what comes back.
export const getProfilePageData = cache(async () => {
  const me = await getCurrentProfile();
  const supabase = await createClient();

  const [profileRes, activityRes, recentRes] = await Promise.all([
    supabase.rpc("get_profile", { p_username: me.username }),
    supabase.rpc("activity_graph", { p_user_id: me.id, p_days: ACTIVITY_DAYS }),
    supabase
      .from("tasks")
      .select("id, title, completed_at, projects(name, color), task_assignees!inner(user_id)")
      .eq("task_assignees.user_id", me.id)
      .not("completed_at", "is", null)
      .order("completed_at", { ascending: false })
      .limit(RECENT_TASKS_LIMIT),
  ]);

  const profile = (profileRes.data as ProfileData | null) ?? null;
  const activity = (activityRes.data ?? []) as ActivityRow[];
  const recent: RecentTask[] = (recentRes.data ?? []).flatMap((t) =>
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

  return { me, profile, activity, recent };
});

// The editable text fields of the signed-in user's profile (Edit Profile form).
export const getEditableProfile = cache(async () => {
  const me = await getCurrentProfile();
  const supabase = await createClient();
  const { data } = await supabase
    .from("profiles")
    .select("headline, bio, location, website")
    .eq("id", me.id)
    .single();
  return {
    me,
    fields: {
      name: me.name,
      headline: data?.headline ?? "",
      bio: data?.bio ?? "",
      location: data?.location ?? "",
      website: data?.website ?? "",
    },
  };
});
