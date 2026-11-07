import type { CategoryKey } from "./category";
import type { Enums, Tables } from "./database.types";
import type { TaskPriority } from "./task";

export type Project = Tables<"projects">;
export type ProjectMember = Tables<"project_members">;
export type ProjectColor = Enums<"project_color">;
export type MemberStatus = Enums<"member_status">;

export type ProjectFormState = {
  status?: string;
  // Set on success: the id of the project that was just created.
  projectId?: string;
  // Set on success: the accept link of each invite (shown once), and the emails that could not be invited.
  inviteLinks?: { email: string; link: string }[];
  failedInvites?: string[];
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

export type ProjectSummary = { id: string; name: string; color: ProjectColor };

// The dashboard_stats() RPC payload.
export type DashboardStats = {
  project_count: number;
  total: number;
  todo: number;
  progress: number;
  review: number;
  done: number;
  other: number;
  projects: { id: string; name: string; color: ProjectColor; total: number; done: number }[];
};

export type MemberPreview = {
  id: string;
  name: string;
  avatar_url: string | null;
  avatar_bg: string;
  avatar_fg: string;
};

export type ProjectTask = {
  id: string;
  title: string;
  priority: TaskPriority;
  dueDate: string | null;
  status: { key: CategoryKey | null; name: string; color: ProjectColor };
};

// One project section of My Tasks: the project, its members, progress and tasks.
export type ProjectOverview = ProjectSummary & {
  description: string;
  members: MemberPreview[];
  pending: number;
  total: number;
  done: number;
  tasks: ProjectTask[];
};

// One row of the Members dialog: an active member, or a pending invite (no profile yet).
export type MemberRow = {
  id: string;
  userId: string | null;
  email: string;
  status: MemberStatus;
  isAdmin: boolean;
  roles: string[];
  profile: MemberPreview | null;
};

export type ProjectMembers = { ownerId: string; members: MemberRow[] };

// One invite waiting for the signed-in user (my_pending_invites()).
export type PendingInvite = {
  member_id: string;
  project_id: string;
  project_name: string;
  project_color: ProjectColor;
  invited_by_name: string | null;
  invited_at: string;
};
