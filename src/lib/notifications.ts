import type { DueNotification, DueNotificationGroups } from "@/types/notification";

// Whole days from `today` to `dueDate` (both "YYYY-MM-DD"): negative when overdue.
export function daysUntil(dueDate: string, today: string): number {
  return Math.round((Date.parse(`${dueDate}T00:00:00Z`) - Date.parse(`${today}T00:00:00Z`)) / 86_400_000);
}

export function getDueLabel(dueDate: string, today: string): string {
  const days = daysUntil(dueDate, today);
  if (days < 0) return `Overdue ${-days} ${days === -1 ? "day" : "days"}`;
  if (days === 0) return "Due today";
  return days === 1 ? "Due tomorrow" : `Due in ${days} days`;
}

export function groupDueNotifications(items: DueNotification[], today: string): DueNotificationGroups {
  const groups: DueNotificationGroups = { overdue: [], today: [], soon: [] };
  for (const item of items) {
    const days = daysUntil(item.dueDate, today);
    groups[days < 0 ? "overdue" : days === 0 ? "today" : "soon"].push(item);
  }
  return groups;
}
