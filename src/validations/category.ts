import { PROJECT_COLORS } from "@/constants/project-constant";
import type { CategoryFormState } from "@/types/category";
import type { ProjectColor } from "@/types/project";

export const CATEGORY_NAME_MAX = 24;
export const DUPLICATE_CATEGORY_MESSAGE = "A category with this name already exists.";

// Pure validation shared by the category dialog (live hints) and the server actions. Mirrors the
// CHECK and unique index on categories (004_board.sql): 1-24 characters, unique per project
// without regard to case. `takenNames` are the names of the project's other categories.
export function validateCategory(input: { name: string; color: string; takenNames: string[] }): {
  values: { name: string; color: ProjectColor };
  errors: NonNullable<CategoryFormState["errors"]>;
} {
  const name = input.name.trim();
  const color = PROJECT_COLORS.find((c) => c.value === input.color)?.value;
  const errors: NonNullable<CategoryFormState["errors"]> = {};

  if (!name) errors.name = ["Category name is required"];
  else if (name.length > CATEGORY_NAME_MAX) errors.name = [`Max ${CATEGORY_NAME_MAX} characters`];
  else if (input.takenNames.some((taken) => taken.trim().toLowerCase() === name.toLowerCase())) {
    errors.name = [DUPLICATE_CATEGORY_MESSAGE];
  }
  if (!color) errors.color = ["Pick a color"];

  return { values: { name, color: color ?? "gray" }, errors };
}
