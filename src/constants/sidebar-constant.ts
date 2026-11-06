import { Element3, Kanban, TaskSquare, type Icon } from "iconsax-react";

export type SidebarMenuItemConfig = {
  title: string;
  url: string | null;
  icon: Icon;
  disabled?: boolean;
  badge?: boolean;
};

// Same idea as website_cafe's SIDEBAR_MENU_LIST (Kanbo has no role-based menus).
export const SIDEBAR_MENU_LIST: SidebarMenuItemConfig[] = [
  { title: "Dashboard", url: "/dashboard", icon: Element3 },
  // Board needs a current project; disabled until the user has one (PRD §6.8).
  { title: "Board", url: null, icon: Kanban, disabled: true },
  { title: "My Tasks", url: "/my-tasks", icon: TaskSquare, badge: true },
];
