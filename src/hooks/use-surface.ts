"use client";

import {
  DEFAULT_SURFACE,
  SURFACES,
  SURFACE_STORAGE_KEY,
  type Surface,
} from "@/constants/theme-constant";
import { useLocalSetting } from "@/hooks/use-local-setting";

const apply = (surface: Surface) => {
  if (surface === DEFAULT_SURFACE)
    delete document.documentElement.dataset.surface;
  else document.documentElement.dataset.surface = surface;
};

// Card style (outline or filled), applied as data-surface on <html>.
export function useSurface() {
  const [surface, setSurface] = useLocalSetting(
    SURFACE_STORAGE_KEY,
    SURFACES,
    DEFAULT_SURFACE,
    apply,
  );
  return { surface, setSurface };
}
