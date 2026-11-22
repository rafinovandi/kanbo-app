"use client";

import { Add, Edit, More, Trash } from "iconsax-react";
import { useRef, useState } from "react";

import CategoryDialog from "@/components/common/category-dialog";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { PROJECT_TONE } from "@/constants/profile-constant";
import type { BoardCategory } from "@/types/board";
import type { ProjectColor } from "@/types/project";

type DemoColumn = BoardCategory & { count: number };

const MAX_COLUMNS = 8;

const INITIAL_COLUMNS: DemoColumn[] = [
  { id: "todo", key: "todo", name: "To Do", color: "gray", count: 3 },
  {
    id: "progress",
    key: "progress",
    name: "In Progress",
    color: "blue",
    count: 2,
  },
  { id: "review", key: "review", name: "Preview", color: "lilac", count: 2 },
  { id: "done", key: "done", name: "Done", color: "green", count: 2 },
  {
    id: "custom-design",
    key: null,
    name: "Design review",
    color: "pink",
    count: 4,
  },
];

// The column headers of a board, played with local state only: add, edit and delete columns, nothing is saved.
export default function LandingColumnsDemo() {
  const [columns, setColumns] = useState(INITIAL_COLUMNS);
  const [dialog, setDialog] = useState<{ open: boolean; editing?: DemoColumn }>(
    { open: false },
  );
  const nextId = useRef(0);

  const save = (name: string, color: ProjectColor) => {
    const editing = dialog.editing;
    if (editing) {
      setColumns((list) =>
        list.map((item) =>
          item.id === editing.id ? { ...item, name, color } : item,
        ),
      );
      return;
    }
    nextId.current += 1;
    setColumns((list) => [
      ...list,
      { id: `custom-${nextId.current}`, key: null, name, color, count: 0 },
    ]);
  };

  return (
    <div className="flex flex-col items-start gap-4">
      <div className="flex w-full flex-wrap gap-x-4 gap-y-1">
        {columns.map((column) => (
          <div
            key={column.id}
            className="group/column flex min-h-8 min-w-0 flex-[1_1_200px] items-center gap-2 pl-1.5"
          >
            <span
              className={`h-4 w-1 rounded-sm ${PROJECT_TONE[column.color].bar}`}
              aria-hidden="true"
            />
            <span className="text-sm font-semibold">{column.name}</span>
            <span className="inline-flex h-5 min-w-5 items-center justify-center rounded-md bg-border px-1.5 text-xs font-semibold text-muted-foreground">
              {column.count}
            </span>
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              aria-label={`Add task to ${column.name}`}
              onClick={() =>
                setColumns((list) =>
                  list.map((item) =>
                    item.id === column.id
                      ? { ...item, count: item.count + 1 }
                      : item,
                  ),
                )
              }
              className="opacity-0 group-hover/column:opacity-100 focus-visible:opacity-100 max-md:opacity-100 pointer-coarse:size-11"
            >
              <Add
                size={18}
                variant="Linear"
                color="currentColor"
                aria-hidden
              />
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  aria-label={`${column.name} column actions`}
                  className="opacity-0 max-md:opacity-100 group-hover/column:opacity-100 focus-visible:opacity-100 data-[state=open]:opacity-100 pointer-coarse:size-11"
                >
                  <More
                    size={18}
                    variant="Linear"
                    color="currentColor"
                    aria-hidden
                  />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuItem
                  onSelect={() => setDialog({ open: true, editing: column })}
                  className="gap-2.5"
                >
                  <Edit
                    size={18}
                    variant="Linear"
                    color="currentColor"
                    aria-hidden
                  />
                  Edit Category
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  variant="destructive"
                  disabled={column.key === "done"}
                  onSelect={() =>
                    setColumns((list) =>
                      list.filter((item) => item.id !== column.id),
                    )
                  }
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
                    {column.key === "done" && (
                      <span className="text-xs font-normal text-muted-foreground">
                        The Done category can&apos;t be deleted.
                      </span>
                    )}
                  </span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        ))}
      </div>
      <Button
        type="button"
        className="w-fit gap-2"
        disabled={columns.length >= MAX_COLUMNS}
        onClick={() => setDialog({ open: true })}
      >
        <Add size={18} variant="Linear" color="currentColor" aria-hidden />
        Add Category
      </Button>
      <CategoryDialog
        key={dialog.editing?.id ?? "new"}
        open={dialog.open}
        onOpenChange={(open) => setDialog((current) => ({ ...current, open }))}
        categories={columns}
        category={dialog.editing}
        taskCount={dialog.editing?.count}
        onSave={save}
      />
    </div>
  );
}
