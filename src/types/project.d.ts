import type { Enums, Tables } from "./database.types";

export type Project = Tables<"projects">;
export type ProjectMember = Tables<"project_members">;
export type ProjectColor = Enums<"project_color">;
export type MemberStatus = Enums<"member_status">;

export type ProjectFormState = {
  status?: string;
  errors?: {
    name?: string[];
    description?: string[];
    color?: string[];
    invites?: string[];
    _form?: string[];
  };
};

export type InviteFormState = {
  status?: string;
  errors?: {
    email?: string[];
    roles?: string[];
    _form?: string[];
  };
};
