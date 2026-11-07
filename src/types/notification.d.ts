import type { ProjectColor } from "./project";

// A task assigned to the signed-in user that is overdue or due soon (my_due_notifications()).
export type DueNotification = {
  taskId: string;
  projectId: string;
  projectName: string;
  projectColor: ProjectColor;
  title: string;
  dueDate: string;
};

export type DueNotificationGroups = {
  overdue: DueNotification[];
  today: DueNotification[];
  soon: DueNotification[];
};
