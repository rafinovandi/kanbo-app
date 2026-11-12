"use client";

import {
  ACTIVITY_COLORS,
  DEFAULT_ACTIVITY_COLOR,
} from "@/constants/profile-constant";
import { ACTIVITY_STORAGE_KEY } from "@/constants/theme-constant";
import { useLocalSetting } from "@/hooks/use-local-setting";

export function useActivityColor() {
  const [activityColor, setActivityColor] = useLocalSetting(
    ACTIVITY_STORAGE_KEY,
    ACTIVITY_COLORS,
    DEFAULT_ACTIVITY_COLOR,
  );
  return { activityColor, setActivityColor };
}
