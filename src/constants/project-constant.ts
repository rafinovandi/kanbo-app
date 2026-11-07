import type { ProjectColor } from "@/types/project";

// Project field limits (match the CHECK constraints in 003_projects_members.sql).
export const PROJECT_LIMITS = {
  name: 40,
  description: 500,
} as const;

// The 6 colors of the project color picker, in picker order. `tile` is the pastel
// square behind a project's initial; the solid swatch/dot comes from PROJECT_TONE (profile-constant).
export const PROJECT_COLORS: { value: ProjectColor; label: string; tile: string }[] = [
  { value: "gray", label: "Gray", tile: "bg-kb-gray-tint text-kb-gray-fg" },
  { value: "blue", label: "Blue", tile: "bg-kb-blue-tint text-kb-blue-fg" },
  { value: "lilac", label: "Lilac", tile: "bg-kb-lilac-tint text-kb-lilac-fg" },
  { value: "pink", label: "Pink", tile: "bg-kb-pink-tint text-kb-pink-fg" },
  { value: "orange", label: "Orange", tile: "bg-kb-orange-tint text-kb-orange-fg" },
  { value: "green", label: "Green", tile: "bg-kb-green-tint text-kb-green-fg" },
];

// How long an invite link stays valid.
export const INVITE_TTL_DAYS = 7;

export const ROLE_LIMITS = { maxRoles: 20, maxLength: 30 } as const;

// Role chip colors. Default roles have fixed colors; custom roles get one by name hash.
export const ROLE_CHIP_CLASS = {
  lilac: "bg-kb-lilac-tint text-kb-lilac-fg",
  blue: "bg-kb-blue-tint text-kb-blue-fg",
  green: "bg-kb-green-tint text-kb-green-fg",
  orange: "bg-kb-orange-tint text-kb-orange-fg",
  yellow: "bg-kb-yellow-tint text-kb-yellow-fg",
  pink: "bg-kb-pink-tint text-kb-pink-fg",
  gray: "bg-kb-gray-tint text-kb-gray-fg",
} as const;

export const DEFAULT_ROLES: { name: string; tone: keyof typeof ROLE_CHIP_CLASS }[] = [
  { name: "UI/UX", tone: "lilac" },
  { name: "Frontend", tone: "blue" },
  { name: "Backend", tone: "green" },
  { name: "Mobile", tone: "orange" },
  { name: "QA", tone: "yellow" },
  { name: "Product Manager", tone: "pink" },
  { name: "Copywriter", tone: "gray" },
];

// Pastel tile classes by color, for the sidebar card and the dialog preview.
export const PROJECT_TILE: Record<ProjectColor, string> = Object.fromEntries(
  PROJECT_COLORS.map((c) => [c.value, c.tile]),
) as Record<ProjectColor, string>;
