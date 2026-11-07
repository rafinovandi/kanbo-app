"use client";

import { useEffect, type ReactNode } from "react";

import { useAuthStore } from "@/stores/auth-store";
import type { AuthProfile } from "@/types/auth";

// The profile comes from the server (Supabase), not a cookie,
// so name/avatar changes show up right away (spec §12).
export default function AuthStoreProvider({
  children,
  profile,
}: {
  children: ReactNode;
  profile: AuthProfile;
}) {
  useEffect(() => {
    useAuthStore.getState().setProfile(profile);
  }, [profile]);

  return <>{children}</>;
}
