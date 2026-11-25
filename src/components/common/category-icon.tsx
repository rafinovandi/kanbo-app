import { Eye, TickCircle, Timer1 } from "iconsax-react";

import { PROJECT_TONE } from "@/constants/profile-constant";
import { PROJECT_TILE } from "@/constants/project-constant";
import { cn } from "@/lib/utils";
import type { CategoryKey } from "@/types/category";
import type { ProjectColor } from "@/types/project";

const ICON_SIZE = 16;

// A category's status icon on a tinted tile: an open circle for To Do, a timer for In Progress, an eye for Review,
// a check for Done, and a dot in the category's color for custom categories.
export default function CategoryIcon({
  categoryKey,
  color,
  className,
}: {
  categoryKey: CategoryKey | null;
  color: ProjectColor;
  className?: string;
}) {
  const icon = {
    size: ICON_SIZE,
    variant: "Linear" as const,
    color: "currentColor",
    "aria-hidden": true,
  };

  return (
    <span
      className={cn(
        "flex size-7 shrink-0 items-center justify-center rounded-lg",
        PROJECT_TILE[color],
        className,
      )}
    >
      {categoryKey === "todo" && (
        <svg
          width={ICON_SIZE}
          height={ICON_SIZE}
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          aria-hidden="true"
        >
          <circle cx="12" cy="12" r="9" />
        </svg>
      )}
      {categoryKey === "progress" && <Timer1 {...icon} />}
      {categoryKey === "review" && <Eye {...icon} />}
      {categoryKey === "done" && <TickCircle {...icon} />}
      {categoryKey === null && (
        <span className={cn("size-2 rounded-full", PROJECT_TONE[color].dot)} />
      )}
    </span>
  );
}
