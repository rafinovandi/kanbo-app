import { create } from "zustand";

import { INITIAL_STATE_PROFILE } from "@/constants/auth-constant";
import type { AuthProfile } from "@/types/auth";

// Same as website_cafe: signed-in user's profile for client components.
type AuthState = {
  profile: AuthProfile;
  setProfile: (profile: AuthProfile) => void;
};

export const useAuthStore = create<AuthState>((set) => ({
  profile: INITIAL_STATE_PROFILE,
  setProfile: (profile) => set({ profile }),
}));
