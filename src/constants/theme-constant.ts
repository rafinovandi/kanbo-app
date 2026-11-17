export const PALETTE_STORAGE_KEY = "palette";

export const PALETTES = ["ocean", "amethyst", "vivid", "classic"] as const;
export type Palette = (typeof PALETTES)[number];
export const DEFAULT_PALETTE: Palette = "ocean";

export const SURFACES = ["outline", "filled"] as const;
export type Surface = (typeof SURFACES)[number];
export const DEFAULT_SURFACE: Surface = "outline";
export const SURFACE_STORAGE_KEY = "surface";

export const SURFACE_OPTIONS: {
  id: Surface;
  label: string;
  description: string;
}[] = [
  { id: "outline", label: "Outline", description: "Cards with a thin border." },
  {
    id: "filled",
    label: "Filled",
    description: "Borderless cards with a solid fill.",
  },
];

export const ACTIVITY_STORAGE_KEY = "activity-color";

// Swatches use the --kb-* tokens, so they follow the active palette; each preview forces its own via data-palette.
export const PALETTE_OPTIONS: {
  id: Palette;
  label: string;
  description: string;
}[] = [
  {
    id: "ocean",
    label: "Ocean",
    description: "Bright blue with vivid accents.",
  },
  {
    id: "amethyst",
    label: "Amethyst",
    description: "Soft purple with vivid accents.",
  },
  {
    id: "vivid",
    label: "Vivid",
    description: "Saturated, high-contrast colors.",
  },
  {
    id: "classic",
    label: "Classic",
    description: "Soft pastel colors on a neutral base.",
  },
];

export const PALETTE_SWATCHES = [
  "bg-kb-blue",
  "bg-kb-green",
  "bg-kb-yellow",
  "bg-kb-orange",
  "bg-kb-red",
  "bg-kb-pink",
  "bg-kb-lilac",
] as const;
