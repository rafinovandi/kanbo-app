import type { ReactNode } from "react";

import type { ProjectColor } from "./project";

export type GanttAvatar = {
  id: string;
  name: string;
  avatarUrl?: string | null;
  avatarBg?: string;
  avatarFg?: string;
};

// `created` is the bar's start and cannot change; `due` is its end, or null for a one-day block.
export type GanttItem = {
  id: string;
  title: string;
  created: string;
  due: string | null;
  done?: boolean;
  avatars?: GanttAvatar[];
};

// `icon` is shown in front of every item of the group.
export type GanttGroup = {
  id: string;
  name: string;
  color: ProjectColor;
  icon?: ReactNode;
  items: GanttItem[];
};
