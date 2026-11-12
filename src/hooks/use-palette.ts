"use client";

import {
  DEFAULT_PALETTE,
  PALETTES,
  PALETTE_STORAGE_KEY,
  type Palette,
} from "@/constants/theme-constant";
import { useLocalSetting } from "@/hooks/use-local-setting";

const apply = (palette: Palette) => {
  document.documentElement.dataset.palette = palette;
};

// Color palette next to next-themes' light/dark. The inline script in layout.tsx applies it before first paint.
export function usePalette() {
  const [palette, setPalette] = useLocalSetting(
    PALETTE_STORAGE_KEY,
    PALETTES,
    DEFAULT_PALETTE,
    apply,
  );
  return { palette, setPalette };
}
