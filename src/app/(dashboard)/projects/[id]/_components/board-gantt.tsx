"use client";

import { useMemo, useState } from "react";

import { updateTaskAction } from "@/actions/task-action";
import CategoryIcon from "@/components/common/category-icon";
import GanttChart from "@/components/common/gantt-chart";
import PersonFilter, { type PersonOption } from "@/components/common/person-filter";
import TaskDialog from "@/components/common/task-dialog";
import useBoardMutation from "@/hooks/use-board-mutation";
import useMoveTask from "@/hooks/use-move-task";
import { applyBoardView, countActiveFilters } from "@/lib/board";
import { toLocalDay } from "@/lib/gantt";
import type { BoardCategory, BoardData, BoardTask, BoardView } from "@/types/board";
import type { GanttGroup } from "@/types/gantt";
import type { MemberRow } from "@/types/project";

import GanttLegend from "./gantt-legend";

// The Gantt tab of the Board: the same tasks as Kanban (search and filters apply), as bars from the created day to
// the due day. Opening a task, moving it to another category and changing its due date all go through the Board's
// own save paths, so Kanban shows the result right away.
export default function BoardGantt({
  project,
  categories,
  tasks,
  members,
  view,
  isSearching,
  meId,
  today,
  timeZone,
}: {
  project: BoardData["project"];
  categories: BoardCategory[];
  tasks: BoardTask[];
  members: MemberRow[];
  view: BoardView;
  isSearching: boolean;
  meId: string;
  today: string;
  timeZone: string;
}) {
  const mutateBoard = useBoardMutation(project.id);
  const moveTask = useMoveTask(project.id);
  const [assigneeId, setAssigneeId] = useState<string | null>(null);
  const [openId, setOpenId] = useState<string | null>(null);

  const filtered = useMemo(() => {
    const doneIds = new Set(categories.filter((category) => category.key === "done").map((category) => category.id));
    return applyBoardView(tasks, view, { meId, today, doneIds });
  }, [categories, tasks, view, meId, today]);

  const people = useMemo<PersonOption[]>(
    () =>
      members.flatMap((member) =>
        member.userId && member.profile
          ? [
              {
                id: member.userId,
                name: member.profile.name,
                subtitle: member.roles.length ? member.roles.join(" · ") : "No role yet",
                count: filtered.filter((task) => task.assignees.some((assignee) => assignee.id === member.userId)).length,
                avatarUrl: member.profile.avatar_url,
                avatarBg: member.profile.avatar_bg,
                avatarFg: member.profile.avatar_fg,
              },
            ]
          : [],
      ),
    [members, filtered],
  );
  const selected = people.find((person) => person.id === assigneeId) ?? null;

  const groups = useMemo<GanttGroup[]>(() => {
    const visible = assigneeId
      ? filtered.filter((task) => task.assignees.some((assignee) => assignee.id === assigneeId))
      : filtered;
    return categories.map((category) => ({
      id: category.id,
      name: category.name,
      color: category.color,
      icon: <CategoryIcon categoryKey={category.key} color={category.color} />,
      items: visible
        .filter((task) => task.categoryId === category.id)
        .map((task) => ({
          id: task.id,
          title: task.title,
          created: toLocalDay(task.createdAt, timeZone),
          due: task.dueDate,
          done: category.key === "done",
          avatars: task.assignees.map((assignee) => ({
            id: assignee.id,
            name: assignee.name,
            avatarUrl: assignee.avatar_url,
            avatarBg: assignee.avatar_bg,
            avatarFg: assignee.avatar_fg,
          })),
        }))
        .sort((a, b) => a.created.localeCompare(b.created)),
    }));
  }, [assigneeId, categories, filtered, timeZone]);

  const handleChangeDue = (taskId: string, dueDate: string | null) =>
    mutateBoard(
      (data) => ({ ...data, tasks: data.tasks.map((task) => (task.id === taskId ? { ...task, dueDate } : task)) }),
      () => updateTaskAction(taskId, { dueDate }),
    );

  const openTask = tasks.find((task) => task.id === openId);
  const emptyMessage = selected
    ? `No tasks assigned to ${selected.id === meId ? "you" : selected.name} yet.`
    : isSearching || countActiveFilters(view) > 0
      ? "No tasks match your search or filters."
      : "No tasks yet. Add one from the Kanban tab.";

  return (
    <>
      <GanttChart
        groups={groups}
        today={today}
        toolbar={
          <>
            <PersonFilter
              people={people}
              totalCount={filtered.length}
              value={assigneeId}
              selfId={meId}
              onChange={setAssigneeId}
            />
            <GanttLegend />
          </>
        }
        emptyMessage={emptyMessage}
        onOpen={setOpenId}
        onMoveItem={(taskId, categoryId) => {
          if (tasks.find((task) => task.id === taskId)?.categoryId !== categoryId) moveTask(taskId, categoryId);
        }}
        onChangeDue={handleChangeDue}
      />
      {openTask && (
        <TaskDialog
          key={openTask.id}
          project={project}
          categories={categories}
          task={openTask}
          open
          onOpenChange={(open) => !open && setOpenId(null)}
        />
      )}
    </>
  );
}
