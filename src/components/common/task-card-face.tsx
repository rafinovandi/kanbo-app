import type { ReactNode } from "react";

import UserAvatar from "@/components/common/user-avatar";
import { AvatarGroup, AvatarGroupCount } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { TASK_PRIORITY_CHIP } from "@/constants/my-tasks-constant";
import { cn, formatShortDate } from "@/lib/utils";
import type { BoardTask } from "@/types/board";

const MAX_AVATARS = 3;

// What a task card looks like on the Board: priority, title, assignees and due date.
// `menu` is the hover button in the top right corner; `isOverlay` is the copy that follows the pointer.
export default function TaskCardFace({
  task,
  done,
  menu,
  isOverlay,
}: {
  task: BoardTask;
  done: boolean;
  menu?: ReactNode;
  isOverlay?: boolean;
}) {
  const priority = TASK_PRIORITY_CHIP[task.priority];
  const extra = task.assignees.length - MAX_AVATARS;

  return (
    <div
      className={cn(
        "group/card relative flex flex-col gap-2.5 rounded-2xl border border-border bg-card p-4 text-left shadow-xs motion-safe:transition-[box-shadow,border-color] motion-safe:duration-150 hover:border-kb-line hover:shadow-md",
        isOverlay && "rotate-1 shadow-lg ring-2 ring-ring/20",
      )}
    >
      <div className="flex min-h-[26px] items-center pr-9">
        <Badge className={cn("h-6 px-2.5 font-semibold", priority.className)}>{priority.label}</Badge>
      </div>
      <p className={cn("line-clamp-3 text-sm leading-snug font-medium [overflow-wrap:anywhere]", done && "text-muted-foreground line-through")}>
        {task.title}
      </p>
      <div className="h-px bg-kb-divider" />
      <div className="flex min-h-6 items-center gap-2">
        <AvatarGroup>
          {task.assignees.slice(0, MAX_AVATARS).map((member) => (
            <UserAvatar
              key={member.id}
              name={member.name}
              avatarUrl={member.avatar_url}
              avatarBg={member.avatar_bg}
              avatarFg={member.avatar_fg}
              size="sm"
            />
          ))}
          {extra > 0 && <AvatarGroupCount>+{extra}</AvatarGroupCount>}
        </AvatarGroup>
        <span className="ml-auto text-[13px] text-muted-foreground">{task.dueDate ? formatShortDate(task.dueDate) : ""}</span>
      </div>
      {menu}
    </div>
  );
}
