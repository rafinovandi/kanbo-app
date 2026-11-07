"use client";

import { Filter } from "iconsax-react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { DUE_FILTERS, UNASSIGNED } from "@/constants/board-constant";
import { TASK_PRIORITY_CHIP } from "@/constants/my-tasks-constant";
import type useBoardView from "@/hooks/use-board-view";
import type { MemberRow } from "@/types/project";
import type { TaskPriority } from "@/types/task";

const PRIORITIES = Object.keys(TASK_PRIORITY_CHIP) as TaskPriority[];

// Filter button: tasks assigned to me, by priority, assignee and due date.
export default function BoardFilterMenu({
  boardView,
  members,
}: {
  boardView: ReturnType<typeof useBoardView>;
  members: MemberRow[];
}) {
  const { view, activeFilterCount } = boardView;
  const keepOpen = (event: Event) => event.preventDefault();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button type="button" variant={activeFilterCount ? "default" : "outline"} className="gap-2">
          <Filter size={18} variant="Linear" color="currentColor" aria-hidden />
          Filter{activeFilterCount > 0 && ` (${activeFilterCount})`}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="max-h-[70vh] w-56">
        <DropdownMenuCheckboxItem checked={view.mine} onCheckedChange={boardView.handleToggleMine} onSelect={keepOpen}>
          My tasks
        </DropdownMenuCheckboxItem>

        <DropdownMenuSeparator />
        <DropdownMenuLabel>Priority</DropdownMenuLabel>
        {PRIORITIES.map((priority) => (
          <DropdownMenuCheckboxItem
            key={priority}
            checked={view.priorities.includes(priority)}
            onCheckedChange={() => boardView.handleTogglePriority(priority)}
            onSelect={keepOpen}
          >
            {TASK_PRIORITY_CHIP[priority].label}
          </DropdownMenuCheckboxItem>
        ))}

        <DropdownMenuSeparator />
        <DropdownMenuLabel>Assignee</DropdownMenuLabel>
        <DropdownMenuCheckboxItem
          checked={view.assigneeIds.includes(UNASSIGNED)}
          onCheckedChange={() => boardView.handleToggleAssignee(UNASSIGNED)}
          onSelect={keepOpen}
        >
          Unassigned
        </DropdownMenuCheckboxItem>
        {members.map((member) => (
          <DropdownMenuCheckboxItem
            key={member.id}
            checked={view.assigneeIds.includes(member.userId as string)}
            onCheckedChange={() => boardView.handleToggleAssignee(member.userId as string)}
            onSelect={keepOpen}
          >
            <span className="truncate">{member.profile?.name ?? member.email}</span>
          </DropdownMenuCheckboxItem>
        ))}

        <DropdownMenuSeparator />
        <DropdownMenuLabel>Due date</DropdownMenuLabel>
        {DUE_FILTERS.map((due) => (
          <DropdownMenuCheckboxItem
            key={due.value}
            checked={view.due.includes(due.value)}
            onCheckedChange={() => boardView.handleToggleDue(due.value)}
            onSelect={keepOpen}
          >
            {due.label}
          </DropdownMenuCheckboxItem>
        ))}

        {activeFilterCount > 0 && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem onSelect={boardView.handleClearFilters}>Clear filters</DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
