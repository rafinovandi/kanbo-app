"use client";

import { Add } from "iconsax-react";
import { useState } from "react";

import TaskSearch from "@/components/common/task-search";
import { Button } from "@/components/ui/button";
import type useBoardView from "@/hooks/use-board-view";
import type { BoardCategory } from "@/types/board";
import type { MemberRow } from "@/types/project";

import BoardFilterMenu from "./board-filter-menu";
import BoardSortMenu from "./board-sort-menu";
import CategoryDialog from "@/components/common/category-dialog";

// Search, Filter, Sort and Add Category; Add Category is for admins only.
export default function BoardToolbar({
  projectId,
  categories,
  isAdmin,
  members,
  boardView,
  onSearch,
}: {
  projectId: string;
  categories: BoardCategory[];
  isAdmin: boolean;
  members: MemberRow[];
  boardView: ReturnType<typeof useBoardView>;
  onSearch: (value: string) => void;
}) {
  const [addOpen, setAddOpen] = useState(false);

  return (
    <div className="flex flex-wrap items-center justify-between gap-3">
      <TaskSearch onChange={onSearch} />
      <div className="flex flex-wrap gap-2">
        <BoardFilterMenu boardView={boardView} members={members} />
        <BoardSortMenu boardView={boardView} />
        {isAdmin && (
          <>
            <Button
              type="button"
              className="gap-2"
              onClick={() => setAddOpen(true)}
            >
              <Add
                size={20}
                variant="Linear"
                color="currentColor"
                aria-hidden
              />
              Add Category
            </Button>
            <CategoryDialog
              open={addOpen}
              onOpenChange={setAddOpen}
              projectId={projectId}
              categories={categories}
            />
          </>
        )}
      </div>
    </div>
  );
}
