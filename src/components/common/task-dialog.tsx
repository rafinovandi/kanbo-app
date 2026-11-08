"use client";

import { useQueryClient } from "@tanstack/react-query";
import { useActionState, useEffect, useState, type FormEvent, type ReactNode } from "react";
import { toast } from "sonner";

import {
  createTaskAction,
  moveTaskAction,
  setTaskAssigneesAction,
  updateTaskAction,
  type TaskPatch,
} from "@/actions/task-action";
import ActionBar from "@/components/common/action-bar";
import DatePicker from "@/components/common/date-picker";
import PriorityPicker from "@/components/common/priority-picker";
import TaskDescription from "@/components/common/task-description";
import MemberSelector from "@/components/spaceui/member-selector";
import { Dialog, DialogContent, DialogDescription, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { INITIAL_STATE_ACTION } from "@/constants/general-constant";
import { PROJECT_TONE } from "@/constants/profile-constant";
import { PROJECT_TILE } from "@/constants/project-constant";
import { PAGE_TITLE_INPUT_CLASS } from "@/constants/ui-constant";
import { boardKey } from "@/hooks/use-board";
import useBoardMutation from "@/hooks/use-board-mutation";
import { DASHBOARD_STATS_KEY } from "@/hooks/use-dashboard-stats";
import { DUE_NOTIFICATIONS_KEY } from "@/hooks/use-due-notifications";
import useProjectMembers from "@/hooks/use-project-members";
import { PROJECTS_OVERVIEW_KEY } from "@/hooks/use-projects-overview";
import useTask, { taskKey } from "@/hooks/use-task";
import { getTaskCreator } from "@/lib/task-creator";
import { cn, formatDisplayDate } from "@/lib/utils";
import type { BoardCategory, BoardData, BoardTask } from "@/types/board";
import type { TaskFormState, TaskPriority } from "@/types/task";
import { TASK_LIMITS } from "@/validations/task";

const LABEL_CLASS = "text-muted-foreground";

type Fields = {
  title: string;
  categoryId: string;
  priority: TaskPriority;
  assigneeIds: string[];
  dueDate: string;
  description: string;
};

const sameField = (a: Fields[keyof Fields], b: Fields[keyof Fields]) =>
  Array.isArray(a) && Array.isArray(b) ? [...a].sort().join() === [...b].sort().join() : a === b;

// The form of the task dialog. Without `task` it adds a task to `category` (submit button). With `task` it is the
// task modal: changes are kept as edits, and the bar at the bottom (Cancel, Save) appears to save them together.
function TaskForm({
  project,
  category,
  categories,
  task,
  container,
  setOpen,
}: {
  project: BoardData["project"];
  category: BoardCategory;
  categories: BoardCategory[];
  task?: BoardTask;
  container: HTMLElement | null;
  setOpen: (open: boolean) => void;
}) {
  const queryClient = useQueryClient();
  const mutateBoard = useBoardMutation(project.id);
  const { data: membersData } = useProjectMembers(project.id);
  const { data: detail, isLoading: detailLoading } = useTask(task?.id ?? "", !!task);
  const [edits, setEdits] = useState<Partial<Fields>>({});
  const [editingDescription, setEditingDescription] = useState(false);
  const [viewKey, setViewKey] = useState(0);
  const [saving, setSaving] = useState(false);
  const [today] = useState(() => {
    const date = new Date();
    date.setHours(0, 0, 0, 0);
    return date;
  });
  const [state, formAction, pending] = useActionState<TaskFormState, FormData>(createTaskAction, INITIAL_STATE_ACTION);
  const errors = state.errors ?? {};

  const saved: Fields = task
    ? {
        title: task.title,
        categoryId: task.categoryId,
        priority: task.priority,
        assigneeIds: task.assignees.map((assignee) => assignee.id),
        dueDate: task.dueDate ?? "",
        description: detail?.description ?? "",
      }
    : { title: "", categoryId: category.id, priority: "medium", assigneeIds: [], dueDate: "", description: "" };
  const values: Fields = { ...saved, ...edits };
  const changed = (Object.keys(edits) as (keyof Fields)[]).filter(
    (key) => !sameField(edits[key] as Fields[typeof key], saved[key]),
  );
  const dirty = changed.length > 0;
  const setField = <K extends keyof Fields>(key: K, value: Fields[K]) =>
    setEdits((current) => ({ ...current, [key]: value }));

  const members = (membersData?.members ?? []).flatMap((member) =>
    member.status === "active" && member.userId && member.profile
      ? [{ ...member, userId: member.userId, profile: member.profile }]
      : [],
  );
  const people = members.map((member) => ({
    id: member.userId,
    name: member.profile.name,
    email: member.email,
    avatar: member.profile.avatar_url ?? undefined,
  }));

  useEffect(() => {
    if (state.status === "success") {
      queryClient.invalidateQueries({ queryKey: boardKey(project.id) });
      queryClient.invalidateQueries({ queryKey: DASHBOARD_STATS_KEY });
      queryClient.invalidateQueries({ queryKey: PROJECTS_OVERVIEW_KEY });
      queryClient.invalidateQueries({ queryKey: DUE_NOTIFICATIONS_KEY });
      if (state.assigneesFailed) toast.warning("Task added, but the assignees could not be saved");
      else toast.success("Task added");
      setOpen(false);
    } else if (state.status === "error" && state.errors?._form?.[0]) {
      toast.error(state.errors._form[0]);
    }
  }, [state, setOpen, queryClient, project.id]);

  const resetEdits = () => {
    setEdits({});
    setEditingDescription(false);
    setViewKey((key) => key + 1);
  };

  const save = async () => {
    if (!task || !dirty || saving) return;
    const patch: TaskPatch = {};
    if (changed.includes("title")) patch.title = values.title;
    if (changed.includes("priority")) patch.priority = values.priority;
    if (changed.includes("dueDate")) patch.dueDate = values.dueDate || null;
    if (changed.includes("description")) patch.description = values.description;
    const assignees = members
      .filter((member) => values.assigneeIds.includes(member.userId))
      .map((member) => member.profile);

    setSaving(true);
    const ok = await mutateBoard(
      (data) => {
        const bottom = Math.max(
          0,
          ...data.tasks.filter((item) => item.categoryId === values.categoryId).map((item) => item.position),
        );
        return {
          ...data,
          tasks: data.tasks.map((item) =>
            item.id !== task.id
              ? item
              : {
                  ...item,
                  title: values.title.trim(),
                  priority: values.priority,
                  dueDate: values.dueDate || null,
                  assignees: changed.includes("assigneeIds") ? assignees : item.assignees,
                  ...(changed.includes("categoryId") && { categoryId: values.categoryId, position: bottom + 1 }),
                },
          ),
        };
      },
      async () => {
        const results = [];
        if (Object.keys(patch).length > 0) results.push(await updateTaskAction(task.id, patch));
        if (changed.includes("categoryId")) results.push(await moveTaskAction(task.id, values.categoryId));
        if (changed.includes("assigneeIds")) results.push(await setTaskAssigneesAction(task.id, values.assigneeIds));
        return results.find((result) => result.status === "error") ?? { status: "success" as const };
      },
    );
    setSaving(false);

    if (!ok) {
      queryClient.invalidateQueries({ queryKey: boardKey(project.id) });
      queryClient.invalidateQueries({ queryKey: taskKey(task.id) });
      return;
    }
    if (changed.includes("description")) {
      queryClient.setQueryData(taskKey(task.id), (old: typeof detail) =>
        old ? { ...old, description: values.description.trim() } : old,
      );
    }
    if (changed.includes("categoryId")) queryClient.invalidateQueries({ queryKey: boardKey(project.id) });
    resetEdits();
  };

  const onSubmit = (event: FormEvent) => {
    if (!task) return;
    event.preventDefault();
    save();
  };

  return (
    <form action={task ? undefined : formAction} onSubmit={onSubmit} className="flex min-h-0 flex-1 flex-col">
      {!task && (
        <>
          <input type="hidden" name="project_id" value={project.id} />
          <input type="hidden" name="category_id" value={values.categoryId} />
          <input type="hidden" name="assignee_ids" value={JSON.stringify(values.assigneeIds)} />
          <input type="hidden" name="due_date" value={values.dueDate} />
        </>
      )}

      <div className="flex h-[68px] shrink-0 items-center gap-2.5 border-b border-kb-divider pr-16 pl-6">
        <span
          aria-hidden="true"
          className={cn(
            "flex size-7 flex-none items-center justify-center rounded-lg text-xs font-semibold",
            PROJECT_TILE[project.color],
          )}
        >
          {project.name[0].toUpperCase()}
        </span>
        <span className="truncate text-[13px] text-muted-foreground">{project.name}</span>
        <DialogTitle className="sr-only">{task ? "Task details" : "Add Task"}</DialogTitle>
        <DialogDescription className="sr-only">
          {task ? `Details of a task in ${project.name}.` : `Add a task to ${project.name}.`}
        </DialogDescription>
      </div>

      <div
        className={cn(
          "flex min-h-0 flex-1 flex-col gap-6 overflow-y-auto px-6 pt-8 sm:px-[max(5rem,calc((100%-680px)/2))] [&>*]:shrink-0",
          "pb-28",
        )}
      >
        <div className="flex flex-col gap-1.5">
          <Input
            name={task ? undefined : "title"}
            value={values.title}
            onChange={(e) => setField("title", e.target.value)}
            maxLength={TASK_LIMITS.title}
            placeholder="Task title (required)"
            aria-label="Task title"
            autoComplete="off"
            autoFocus={!task}
            required={!task}
            aria-invalid={!!errors.title}
            className={cn(
              "h-auto rounded-none border-0 bg-transparent px-0 py-1 shadow-none focus-visible:ring-0 aria-invalid:ring-0 dark:bg-transparent",
              PAGE_TITLE_INPUT_CLASS,
            )}
          />
          {errors.title?.[0] && <p className="text-xs text-destructive">{errors.title[0]}</p>}
        </div>

        <div className="grid grid-cols-[110px_minmax(0,1fr)] items-center gap-x-3 gap-y-3.5 text-[13px]">
          <span className={LABEL_CLASS}>Status</span>
          <div>
            <Select value={values.categoryId} onValueChange={(next) => setField("categoryId", next)}>
              <SelectTrigger aria-label="Status" className="w-fit gap-2 rounded-full pr-3 [&>svg]:hidden">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {categories.map((item) => (
                  <SelectItem key={item.id} value={item.id}>
                    <span className={cn("size-2 rounded-full", PROJECT_TONE[item.color].dot)} aria-hidden="true" />
                    {item.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <span className={LABEL_CLASS}>Priority</span>
          <PriorityPicker
            name={task ? undefined : "priority"}
            value={values.priority}
            onValueChange={(next) => setField("priority", next)}
          />

          <span className={cn(LABEL_CLASS, "self-start pt-3")}>Assignees</span>
          <div className="flex flex-col gap-1.5">
            {people.length > 0 ? (
              <MemberSelector
                size="sm"
                footer={`Only people added to ${project.name} can be assigned.`}
                members={people}
                selected={values.assigneeIds}
                onChange={(ids) => setField("assigneeIds", ids)}
                portalContainer={container}
              />
            ) : (
              <span className="text-muted-foreground">No members yet</span>
            )}
          </div>

          {task && (
            <>
              <span className={cn(LABEL_CLASS, "self-start pt-3")}>Created by</span>
              {detail ? (
                <MemberSelector
                  readOnly
                  size="sm"
                  members={[getTaskCreator(detail)]}
                  selected={[getTaskCreator(detail).id]}
                />
              ) : (
                <span>—</span>
              )}
            </>
          )}

          <span className={LABEL_CLASS}>Due date</span>
          <div className="flex flex-col gap-1.5">
            <DatePicker
              value={values.dueDate}
              onChange={(next) => setField("dueDate", next)}
              minDate={today}
              invalid={!!errors.due_date}
            />
            {errors.due_date?.[0] && <p className="text-xs text-destructive">{errors.due_date[0]}</p>}
          </div>

          {task && (
            <>
              <span className={LABEL_CLASS}>Created on</span>
              <span>{detail ? formatDisplayDate(new Date(detail.created_at)) : "—"}</span>
            </>
          )}
        </div>

        <div className="h-px bg-border" />

        {task ? (
          detailLoading || !detail ? (
            <Skeleton className="h-36 rounded-xl" />
          ) : (
            <TaskDescription
              key={viewKey}
              value={values.description}
              onChange={(next) => setField("description", next)}
              onEditStart={() => setEditingDescription(true)}
            />
          )
        ) : (
          <div className="flex flex-col gap-1.5">
            <TaskDescription
              name="description"
              alwaysEditing
              value={values.description}
              onChange={(next) => setField("description", next)}
              invalid={!!errors.description}
            />
            {errors.description?.[0] && <p className="text-xs text-destructive">{errors.description[0]}</p>}
          </div>
        )}
      </div>

      <div className="pointer-events-none absolute inset-x-0 bottom-0 px-6 pb-6 sm:px-[max(5rem,calc((100%-680px)/2))]">
        {task ? (
          <ActionBar
            visible={dirty || editingDescription}
            message={dirty ? "Unsaved changes" : "No changes yet"}
            onCancel={resetEdits}
            cancelDisabled={saving}
            submitLabel={saving ? "Saving…" : "Save"}
            onSubmit={save}
            submitDisabled={!dirty || saving}
            singleRow
          />
        ) : (
          <ActionBar
            onCancel={() => setOpen(false)}
            cancelDisabled={pending}
            submitLabel={pending ? "Adding…" : "Add Task"}
            submitType="submit"
            submitDisabled={pending}
          />
        )}
      </div>
    </form>
  );
}

type TaskDialogProps = {
  project: BoardData["project"];
  categories: BoardCategory[];
} & (
  | { task?: undefined; category: BoardCategory; children: ReactNode; open?: undefined; onOpenChange?: undefined }
  | {
      task: BoardTask;
      category?: undefined;
      children?: undefined;
      open: boolean;
      onOpenChange: (open: boolean) => void;
    }
);

// One dialog for adding a task and for opening one (task modal). Adding: wraps any element (a column's +
// button or its "Add New" card) and opens an empty form for that column. Opening: controlled, for a card.
export default function TaskDialog({
  project,
  categories,
  category,
  task,
  children,
  open,
  onOpenChange,
}: TaskDialogProps) {
  const [ownOpen, setOwnOpen] = useState(false);
  const [container, setContainer] = useState<HTMLDivElement | null>(null);
  const isOpen = task ? open : ownOpen;
  const setOpen = task ? onOpenChange : setOwnOpen;
  const initialCategory = category ?? categories.find((item) => item.id === task?.categoryId) ?? categories[0];

  return (
    <Dialog open={isOpen} onOpenChange={setOpen}>
      {!task && <DialogTrigger asChild>{children}</DialogTrigger>}
      <DialogContent
        ref={setContainer}
        closeClassName="top-3.5"
        onOpenAutoFocus={task ? (event) => event.preventDefault() : undefined}
        className="flex h-[min(800px,calc(100svh-2rem))] flex-col gap-0 overflow-hidden p-0 sm:max-w-[1000px]"
      >
        <TaskForm
          project={project}
          category={initialCategory}
          categories={categories}
          task={task}
          container={container}
          setOpen={setOpen}
        />
      </DialogContent>
    </Dialog>
  );
}
