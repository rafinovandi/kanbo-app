import { PROJECT_COLORS, PROJECT_LIMITS, ROLE_LIMITS } from "@/constants/project-constant";
import type { ProjectColor, ProjectFormState } from "@/types/project";

export type InviteDraft = { email: string; roles: string[] };

export const MAX_INVITES = 20;

// Same rule as invite_member() in 007_rpc.sql.
const EMAIL_PATTERN = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;

export const isValidEmail = (email: string) => email.length <= 254 && EMAIL_PATTERN.test(email);

export function normalizeRoles(roles: string[]) {
  return [...new Set(roles.map((role) => role.trim()).filter(Boolean))];
}

export const isValidRole = (role: string) => role.length > 0 && role.length <= ROLE_LIMITS.maxLength;

// Reads the invites sent by the dialog (a JSON string). Returns an error message instead of
// throwing, so a tampered request just gets an inline error.
export function parseInvites(raw: string): { invites: InviteDraft[]; error?: string } {
  if (!raw) return { invites: [] };

  let data: unknown;
  try {
    data = JSON.parse(raw);
  } catch {
    return { invites: [], error: "Invalid invite list" };
  }
  if (!Array.isArray(data) || data.length > MAX_INVITES) {
    return { invites: [], error: `You can invite up to ${MAX_INVITES} people at once` };
  }

  const invites: InviteDraft[] = [];
  const seen = new Set<string>();
  for (const item of data) {
    const email = typeof item?.email === "string" ? item.email.trim().toLowerCase() : "";
    const roles = Array.isArray(item?.roles)
      ? normalizeRoles(item.roles.filter((r: unknown): r is string => typeof r === "string"))
      : [];
    if (!isValidEmail(email)) return { invites: [], error: `${email || "An email"} is not a valid email address` };
    if (roles.length > ROLE_LIMITS.maxRoles || !roles.every(isValidRole)) {
      return { invites: [], error: `Roles must be 1-${ROLE_LIMITS.maxLength} characters (max ${ROLE_LIMITS.maxRoles} roles)` };
    }
    if (!seen.has(email)) invites.push({ email, roles });
    seen.add(email);
  }
  return { invites };
}

export type ProjectFields = {
  name: string;
  description: string;
  color: ProjectColor;
};

// Pure validation shared by the dialog (live "Create Project" state) and the server action.
// Mirrors the CHECK constraints in 003_projects_members.sql. (No zod in the project yet.)
export function validateProject(input: { name: string; description: string; color: string }): {
  values: ProjectFields;
  errors: NonNullable<ProjectFormState["errors"]>;
} {
  const color = PROJECT_COLORS.find((c) => c.value === input.color)?.value;
  const values: ProjectFields = {
    name: input.name.trim(),
    description: input.description.trim(),
    color: color ?? "gray",
  };
  const errors: NonNullable<ProjectFormState["errors"]> = {};

  if (!values.name) errors.name = ["Project name is required"];
  else if (values.name.length > PROJECT_LIMITS.name) errors.name = [`Max ${PROJECT_LIMITS.name} characters`];
  if (values.description.length > PROJECT_LIMITS.description) {
    errors.description = [`Max ${PROJECT_LIMITS.description} characters`];
  }
  if (!color) errors.color = ["Pick a color"];

  return { values, errors };
}
