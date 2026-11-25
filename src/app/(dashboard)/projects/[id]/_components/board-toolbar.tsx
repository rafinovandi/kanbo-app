"use client";

import { Add, Kanban } from "iconsax-react";
import { useState } from "react";

import GanttIcon from "@/components/common/gantt-icon";
import TaskSearch from "@/components/common/task-search";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { BoardTab } from "@/hooks/use-board-tab";
import type useBoardView from "@/hooks/use-board-view";
import type { BoardCategory } from "@/types/board";
import type { MemberRow } from "@/types/project";

import BoardFilterMenu from "./board-filter-menu";
import CategoryDialog from "@/components/common/category-dialog";

// View switch, Search, Filter and Add Category; Add Category is for admins only.
export default function BoardToolbar({
  projectId,
  categories,
  isAdmin,
  members,
  boardView,
  tab,
  onTabChange,
  onSearch,
}: {
  projectId: string;
  categories: BoardCategory[];
  isAdmin: boolean;
  members: MemberRow[];
  boardView: ReturnType<typeof useBoardView>;
  tab: BoardTab;
  onTabChange: (tab: BoardTab) => void;
  onSearch: (value: string) => void;
}) {
  const [addOpen, setAddOpen] = useState(false);

  return (
    <div className="flex flex-wrap items-center justify-between gap-3">
      <Tabs
        value={tab}
        onValueChange={(value) => onTabChange(value as BoardTab)}
      >
        <TabsList aria-label="Board view">
          <TabsTrigger value="kanban">
            <Kanban
              size={16}
              variant="Linear"
              color="currentColor"
              aria-hidden
            />
            Kanban
          </TabsTrigger>
          <TabsTrigger value="gantt">
            <GanttIcon />
            Gantt
          </TabsTrigger>
        </TabsList>
      </Tabs>
      <div className="flex w-full flex-wrap items-center gap-2 sm:w-auto">
        <TaskSearch onChange={onSearch} className="w-full sm:w-[260px]" />
        <BoardFilterMenu boardView={boardView} members={members} />
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
