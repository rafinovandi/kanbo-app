"use client";

import { useQueryClient } from "@tanstack/react-query";
import { useEffect, useRef, type ReactNode } from "react";

import { INITIAL_STATE_PROFILE } from "@/constants/auth-constant";
import { useAuthStore } from "@/stores/auth-store";
import type { AuthProfile } from "@/types/auth";

// The profile comes from the server (Supabase), not a cookie,
// so name/avatar changes show up right away.
export default function AuthStoreProvider({
  children,
  profile,
}: {
  children: ReactNode;
  profile: AuthProfile;
}) {
  const queryClient = useQueryClient();
  const clearTimer = useRef<ReturnType<typeof setTimeout>>(undefined);

  useEffect(() => {
    useAuthStore.getState().setProfile(profile);
  }, [profile]);

  // Leaving the dashboard (sign out) must not leave this session's data in the cache for the next one.
  // The timer keeps React's dev-only remount (effects run, clean up, run again) from clearing it too.
  useEffect(() => {
    clearTimeout(clearTimer.current);
    return () => {
      clearTimer.current = setTimeout(() => {
        queryClient.clear();
        useAuthStore.getState().setProfile(INITIAL_STATE_PROFILE);
      }, 0);
    };
  }, [queryClient]);

  return <>{children}</>;
}
