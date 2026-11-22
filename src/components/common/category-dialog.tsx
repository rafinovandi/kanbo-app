"use client";

import { useQueryClient } from "@tanstack/react-query";
import { Add } from "iconsax-react";
import { useState, type FormEvent } from "react";
import { toast } from "sonner";

import {
  createCategoryAction,
  updateCategoryAction,
} from "@/actions/category-action";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { PROJECT_TONE } from "@/constants/profile-constant";
import { PROJECT_COLORS } from "@/constants/project-constant";
import { DASHBOARD_STATS_KEY } from "@/hooks/use-dashboard-stats";
import { boardKey } from "@/hooks/use-board";
import { PROJECTS_OVERVIEW_KEY } from "@/hooks/use-projects-overview";
import { cn } from "@/lib/utils";
import type { BoardCategory } from "@/types/board";
import type { ProjectColor } from "@/types/project";
import { CATEGORY_NAME_MAX, validateCategory } from "@/validations/category";

type CategoryDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projectId?: string;
  categories: BoardCategory[];
  // Set to edit that category; leave out to add a new one at the end of the board.
  category?: BoardCategory;
  taskCount?: number;
  // Hands the result to the caller instead of saving it (the landing page demo has no project).
  onSave?: (name: string, color: ProjectColor) => void;
};

function CategoryForm({
  projectId = "",
  categories,
  category,
  taskCount = 0,
  onSave,
  onClose,
}: Omit<CategoryDialogProps, "open" | "onOpenChange"> & {
  onClose: () => void;
}) {
  const queryClient = useQueryClient();
  const [name, setName] = useState(category?.name ?? "");
  const [color, setColor] = useState<ProjectColor>(category?.color ?? "gray");
  const [pending, setPending] = useState(false);

  const takenNames = categories
    .filter((item) => item.id !== category?.id)
    .map((item) => item.name);
  const { errors } = validateCategory({ name, color, takenNames });
  const duplicate = !!name.trim() && !!errors.name;

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (errors.name || pending) return;

    if (onSave) {
      onSave(name.trim(), color);
      return onClose();
    }

    setPending(true);
    const result = category
      ? await updateCategoryAction(category.id, name, color)
      : await createCategoryAction(projectId, name, color);
    setPending(false);

    if (result.status === "error") return void toast.error(result.message);
    queryClient.invalidateQueries({ queryKey: boardKey(projectId) });
    queryClient.invalidateQueries({ queryKey: DASHBOARD_STATS_KEY });
    queryClient.invalidateQueries({ queryKey: PROJECTS_OVERVIEW_KEY });
    toast.success(category ? "Category updated" : "Category added");
    onClose();
  };

  return (
    <form onSubmit={submit} className="flex flex-col">
      <div className="flex h-[68px] items-center border-b border-kb-divider pr-16 pl-6">
        <DialogTitle className="text-[15px] font-semibold">
          {category ? "Edit Category" : "Add Category"}
        </DialogTitle>
        <DialogDescription className="sr-only">
          Name and color of a board column.
        </DialogDescription>
      </div>

      <div className="flex flex-col gap-5 p-6">
        <div
          aria-hidden="true"
          className="flex flex-col gap-2.5 rounded-2xl bg-kb-surface dark:bg-background p-2.5"
        >
          <div className="flex min-h-8 items-center gap-2 pl-1.5">
            <span
              className={cn("h-4 w-1 rounded-sm", PROJECT_TONE[color].bar)}
            />
            <span
              className={cn(
                "truncate text-sm font-semibold",
                !name.trim() && "text-muted-foreground",
              )}
            >
              {name.trim() || "Category name"}
            </span>
            <span className="inline-flex h-5 min-w-5 items-center justify-center rounded-md bg-border px-1.5 text-xs font-semibold text-muted-foreground">
              {taskCount}
            </span>
          </div>
          <div className="flex min-h-10 items-center justify-center rounded-xl border-[1.5px] border-dashed border-kb-line text-[13px] text-muted-foreground">
            No tasks here yet
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <label
            htmlFor="cat-name"
            className="text-[13px] font-medium text-kb-text-2"
          >
            Category name
          </label>
          <Input
            id="cat-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            maxLength={CATEGORY_NAME_MAX}
            placeholder="e.g. Blocked, Testing, Backlog"
            autoComplete="off"
            autoFocus
            required
            aria-invalid={duplicate}
            aria-describedby="cat-name-hint"
          />
          <span
            id="cat-name-hint"
            className={cn(
              "min-h-4 text-xs",
              duplicate ? "text-destructive" : "text-muted-foreground",
            )}
          >
            {duplicate ? errors.name?.[0] : ""}
          </span>
        </div>

        <fieldset className="flex flex-col gap-2">
          <legend className="mb-2 text-[13px] font-medium text-kb-text-2">
            Color
          </legend>
          <div className="flex flex-wrap gap-3">
            {PROJECT_COLORS.map((item) => (
              <label key={item.value} className="cursor-pointer">
                <input
                  type="radio"
                  name="color"
                  value={item.value}
                  checked={color === item.value}
                  onChange={() => setColor(item.value)}
                  className="peer sr-only"
                />
                <span
                  className={cn(
                    "block size-8 rounded-full ring-offset-2 ring-offset-popover transition-shadow peer-checked:ring-2 peer-checked:ring-foreground peer-focus-visible:ring-2 peer-focus-visible:ring-ring",
                    PROJECT_TONE[item.value].dot,
                  )}
                />
                <span className="sr-only">{item.label}</span>
              </label>
            ))}
          </div>
        </fieldset>
      </div>

      <div className="flex justify-end gap-2 px-6 pb-6">
        <DialogClose asChild>
          <Button type="button" variant="outline" disabled={pending}>
            Cancel
          </Button>
        </DialogClose>
        <Button type="submit" disabled={pending || duplicate} className="gap-2">
          {!category && (
            <Add size={20} variant="Linear" color="currentColor" aria-hidden />
          )}
          {pending ? "Saving…" : category ? "Save Changes" : "Add Category"}
        </Button>
      </div>
    </form>
  );
}

// Add or edit a category. The form lives inside the dialog content, so it starts fresh
// every time the dialog opens.
export default function CategoryDialog({
  open,
  onOpenChange,
  ...form
}: CategoryDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        closeClassName="top-3.5"
        className="gap-0 p-0 sm:max-w-[480px]"
      >
        <CategoryForm {...form} onClose={() => onOpenChange(false)} />
      </DialogContent>
    </Dialog>
  );
}
