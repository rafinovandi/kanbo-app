"use client";

import { Notification, TickCircle } from "iconsax-react";
import { useState } from "react";

import TaskDialogLoader from "@/components/common/task-dialog-loader";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { MAX_BADGE } from "@/constants/notification-constant";
import { PROJECT_TILE } from "@/constants/project-constant";
import useDueNotifications from "@/hooks/use-due-notifications";
import { getDueLabel, groupDueNotifications } from "@/lib/notifications";
import { cn } from "@/lib/utils";
import type { DueNotification } from "@/types/notification";

const GROUPS = [
  { key: "overdue", title: "Overdue", className: "text-kb-red-fg" },
  { key: "today", title: "Due today", className: "text-kb-orange-fg" },
  { key: "soon", title: "Due soon", className: "text-muted-foreground" },
] as const;

// The bell in the top bar: tasks assigned to me that are overdue, due today or due within a few days. Clicking one
// opens the task modal.
export default function NotificationsMenu() {
  const { data } = useDueNotifications();
  const items = data?.items ?? [];
  const today = data?.today ?? "";
  const [open, setOpen] = useState(false);
  const [openTask, setOpenTask] = useState<{ projectId: string; taskId: string } | null>(null);

  const groups = groupDueNotifications(items, today);
  const count = items.length;

  const openItem = (item: DueNotification) => {
    setOpen(false);
    setOpenTask({ projectId: item.projectId, taskId: item.taskId });
  };

  return (
    <>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            size="icon"
            className="relative size-10 rounded-[10px]"
            aria-label={count > 0 ? `Notifications, ${count}` : "Notifications"}
          >
            <Notification size={20} variant="Linear" color="currentColor" aria-hidden />
            {count > 0 && (
              <span
                aria-hidden="true"
                className="absolute -top-1.5 -right-1.5 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-kb-red px-1 text-[11px] leading-none font-semibold text-primary-foreground"
              >
                {count > MAX_BADGE ? `${MAX_BADGE}+` : count}
              </span>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent align="end" className="w-[360px] gap-0 rounded-2xl p-0">
          <div className="border-b border-border px-4 py-3 text-sm font-semibold">Notifications</div>
          {count === 0 ? (
            <div className="flex flex-col items-center gap-2 px-6 py-10 text-center">
              <TickCircle
                size={28}
                variant="Linear"
                color="currentColor"
                className="text-muted-foreground"
                aria-hidden
              />
              <p className="text-sm font-medium">You&apos;re all caught up.</p>
              <p className="text-[13px] text-muted-foreground">Tasks assigned to you show up here when they are due.</p>
            </div>
          ) : (
            <div className="flex max-h-[420px] flex-col gap-1 overflow-y-auto p-2">
              {GROUPS.map(({ key, title, className }) =>
                groups[key].length > 0 ? (
                  <section key={key} aria-label={title} className="flex flex-col">
                    <h3 className={cn("px-2 pt-2 pb-1 text-xs font-semibold", className)}>{title}</h3>
                    {groups[key].map((item) => (
                      <button
                        key={item.taskId}
                        type="button"
                        onClick={() => openItem(item)}
                        className="flex items-start gap-2.5 rounded-lg px-2 py-2 text-left outline-none hover:bg-muted focus-visible:ring-3 focus-visible:ring-ring/50"
                      >
                        <span
                          aria-hidden="true"
                          className={cn(
                            "mt-0.5 flex size-6 flex-none items-center justify-center rounded-md text-[11px] font-semibold",
                            PROJECT_TILE[item.projectColor],
                          )}
                        >
                          {item.projectName[0].toUpperCase()}
                        </span>
                        <span className="flex min-w-0 flex-col gap-0.5">
                          <span className="line-clamp-2 text-sm font-medium [overflow-wrap:anywhere]">
                            {item.title}
                          </span>
                          <span className="truncate text-xs text-muted-foreground">
                            {item.projectName} · {getDueLabel(item.dueDate, today)}
                          </span>
                        </span>
                      </button>
                    ))}
                  </section>
                ) : null,
              )}
            </div>
          )}
        </PopoverContent>
      </Popover>
      <TaskDialogLoader
        projectId={openTask?.projectId ?? ""}
        taskId={openTask?.taskId ?? null}
        onOpenChange={(next) => !next && setOpenTask(null)}
      />
    </>
  );
}
