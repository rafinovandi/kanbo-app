"use client";

import PageTransition from "@/components/common/page-transition";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  PALETTE_OPTIONS,
  PALETTE_SWATCHES,
  SURFACE_OPTIONS,
} from "@/constants/theme-constant";
import {
  ACTIVITY_COLORS,
  ACTIVITY_PALETTE,
} from "@/constants/profile-constant";
import { useActivityColor } from "@/hooks/use-activity-color";
import { useHydrated } from "@/hooks/use-hydrated";
import { cn } from "@/lib/utils";
import { usePalette } from "@/hooks/use-palette";
import { useSurface } from "@/hooks/use-surface";

import PageHeader from "../../../_components/page-header";
import SurfacePreview from "./surface-preview";

function OptionButton({
  selected,
  onClick,
  className,
  children,
}: {
  selected: boolean;
  onClick: () => void;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={selected}
      onClick={onClick}
      className={cn(
        "rounded-[10px] border p-3 text-left text-sm transition-colors outline-none focus-visible:ring-2 focus-visible:ring-ring",
        selected
          ? "border-kb-blue bg-kb-blue-tint/40 ring-1 ring-kb-blue"
          : "border-border hover:bg-accent/60",
        className,
      )}
    >
      {children}
    </button>
  );
}

// Theme page: the color palette, stored in this browser only. Light/dark stays on the header toggle.
export default function ThemeSettings() {
  const { palette, setPalette } = usePalette();
  const { surface, setSurface } = useSurface();
  const { activityColor, setActivityColor } = useActivityColor();
  const hydrated = useHydrated();

  return (
    <PageTransition>
      <PageHeader title="Theme" backHref="/profile" backToPrevious />
      <div className="mx-auto flex w-full max-w-180 flex-col gap-5 p-4 sm:p-7">
        <div className="flex flex-col gap-1">
          <h1 className="text-[28px] leading-tight font-semibold tracking-[-0.02em]">
            Theme
          </h1>
          <p className="text-sm text-muted-foreground">
            Choose a color palette. Saved on this device.
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Color Palette</CardTitle>
          </CardHeader>
          <CardContent
            role="radiogroup"
            aria-label="Color palette"
            className="grid gap-3 sm:grid-cols-3"
          >
            {PALETTE_OPTIONS.map((option) => (
              <OptionButton
                key={option.id}
                selected={hydrated && palette === option.id}
                onClick={() => setPalette(option.id)}
              >
                <span
                  data-palette={option.id}
                  className="flex gap-1"
                  aria-hidden="true"
                >
                  {PALETTE_SWATCHES.map((swatch) => (
                    <span
                      key={swatch}
                      className={cn("block size-5 rounded-full", swatch)}
                    />
                  ))}
                </span>
                <span className="mt-2.5 block font-medium">{option.label}</span>
                <span className="block text-[13px] text-muted-foreground">
                  {option.description}
                </span>
              </OptionButton>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Card Style</CardTitle>
          </CardHeader>
          <CardContent
            role="radiogroup"
            aria-label="Card style"
            className="grid grid-cols-1 gap-3 sm:grid-cols-2"
          >
            {SURFACE_OPTIONS.map((option) => (
              <OptionButton
                key={option.id}
                selected={hydrated && surface === option.id}
                onClick={() => setSurface(option.id)}
              >
                <SurfacePreview surface={option.id} />
                <span className="mt-2.5 block font-medium">{option.label}</span>
                <span className="block text-[13px] text-muted-foreground">
                  {option.description}
                </span>
              </OptionButton>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Activity Graph</CardTitle>
            <p className="text-[13px] text-muted-foreground">
              The color of your activity graph on your profile. Only you see
              this color; others see the default.
            </p>
          </CardHeader>
          <CardContent
            role="radiogroup"
            aria-label="Activity graph color"
            className="grid gap-3 sm:grid-cols-3"
          >
            {ACTIVITY_COLORS.map((color) => (
              <OptionButton
                key={color}
                selected={hydrated && activityColor === color}
                onClick={() => setActivityColor(color)}
              >
                <span className="flex gap-0.5" aria-hidden="true">
                  {ACTIVITY_PALETTE[color].levels.map((level) => (
                    <span
                      key={level}
                      className={cn("block size-4 rounded-[3px]", level)}
                    />
                  ))}
                </span>
                <span className="mt-2.5 block font-medium">
                  {ACTIVITY_PALETTE[color].label}
                </span>
              </OptionButton>
            ))}
          </CardContent>
        </Card>
      </div>
    </PageTransition>
  );
}
