import { Element3, Kanban, TaskSquare, type Icon } from "iconsax-react";

export type SidebarMenuItemConfig = {
  title: string;
  url: string | null;
  icon: Icon;
  disabled?: boolean;
  badge?: boolean;
  // The link is the current project's board; disabled until the user has a project.
  needsProject?: boolean;
  // The item stays selected on every page under this path, not just on its own link.
  activePath?: string;
};

// Kanbo has no role-based menus: every signed-in user sees the same list.
export const SIDEBAR_MENU_LIST: SidebarMenuItemConfig[] = [
  { title: "Dashboard", url: "/dashboard", icon: Element3 },
  // Board needs a current project; disabled until the user has one (PRD §6.8).
  { title: "Board", url: null, icon: Kanban, needsProject: true, activePath: "/projects" },
  { title: "My Tasks", url: "/my-tasks", icon: TaskSquare, badge: true },
];
