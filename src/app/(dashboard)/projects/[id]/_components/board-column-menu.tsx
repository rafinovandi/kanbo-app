"use client";

import { useQueryClient } from "@tanstack/react-query";
import { Edit, More, Trash } from "iconsax-react";
import { useState } from "react";
import { toast } from "sonner";

import { deleteCategoryAction } from "@/actions/category-action";
import ConfirmDeleteDialog from "@/components/common/confirm-delete-dialog";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { DASHBOARD_STATS_KEY } from "@/hooks/use-dashboard-stats";
import { boardKey } from "@/hooks/use-board";
import { PROJECTS_OVERVIEW_KEY } from "@/hooks/use-projects-overview";
import type { BoardCategory } from "@/types/board";

// The ⋯ menu of a column (admins only): edit it, or delete it and move its tasks to the
// next column (the previous one when it is the last). Done and the last remaining column stay.
export default function BoardColumnMenu({
  projectId,
  category,
  categories,
  taskCount,
  onEdit,
}: {
  projectId: string;
  category: BoardCategory;
  categories: BoardCategory[];
  taskCount: number;
  onEdit: () => void;
}) {
  const queryClient = useQueryClient();
  const [confirmOpen, setConfirmOpen] = useState(false);
  const index = categories.findIndex((item) => item.id === category.id);
  const target = categories[index + 1] ?? categories[index - 1];

  const blocked =
    category.key === "done"
      ? "The Done category can't be deleted."
      : !target
        ? "You need at least one category."
        : null;
  const hint =
    blocked ??
    (taskCount === 0
      ? "This column is empty."
      : `${taskCount} ${taskCount === 1 ? "task moves" : "tasks move"} to ${target.name}.`);

  const remove = async () => {
    const result = await deleteCategoryAction(category.id);
    if (result.status === "error") {
      toast.error(result.message);
      return false;
    }
    toast.success("Category deleted");
    queryClient.invalidateQueries({ queryKey: boardKey(projectId) });
    queryClient.invalidateQueries({ queryKey: DASHBOARD_STATS_KEY });
    queryClient.invalidateQueries({ queryKey: PROJECTS_OVERVIEW_KEY });
    return true;
  };

  const consequence =
    taskCount === 0
      ? "It is empty."
      : `Its ${taskCount === 1 ? "task moves" : `${taskCount} tasks move`} to ${target?.name}.`;

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            aria-label={`${category.name} column actions`}
            className="opacity-0 max-md:opacity-100 group-hover/column:opacity-100 focus-visible:opacity-100 data-[state=open]:opacity-100"
          >
            <More size={18} variant="Linear" color="currentColor" aria-hidden />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          <DropdownMenuItem onClick={onEdit} className="gap-2.5">
            <Edit size={18} variant="Linear" color="currentColor" aria-hidden />
            Edit Category
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            variant="destructive"
            disabled={!!blocked}
            onSelect={() => setConfirmOpen(true)}
            className="items-start gap-2.5"
          >
            <Trash
              size={18}
              variant="Linear"
              color="currentColor"
              className="mt-0.5"
              aria-hidden
            />
            <span className="flex flex-col gap-0.5">
              <span>Delete Category</span>
              <span className="text-xs font-normal text-muted-foreground">
                {hint}
              </span>
            </span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      <ConfirmDeleteDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        title="Delete category?"
        description={`"${category.name}" will be deleted. ${consequence} This can't be undone.`}
        confirmLabel="Delete Category"
        onConfirm={remove}
      />
    </>
  );
}
