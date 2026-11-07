"use client";

import { useState } from "react";

import { Skeleton } from "@/components/ui/skeleton";
import useBoard from "@/hooks/use-board";
import useBoardView from "@/hooks/use-board-view";
import useBoardRealtime from "@/hooks/use-board-realtime";
import useDebounce from "@/hooks/use-debounce";
import useProjectMembers from "@/hooks/use-project-members";
import { getTodayInTimeZone } from "@/lib/utils";
import { useAuthStore } from "@/stores/auth-store";

import BoardColumns from "./board-columns";
import BoardHeader from "./board-header";
import BoardToolbar from "./board-toolbar";

// The Board of one project: header, toolbar and the columns. Dragging cards is off while a search is
// active or the cards are sorted, because the order on screen is then not the saved one.
export default function Board({ projectId }: { projectId: string }) {
  const me = useAuthStore((state) => state.profile);
  const debounce = useDebounce();
  const [search, setSearch] = useState("");
  const { data, isLoading, isError } = useBoard(projectId, search);
  const { data: members } = useProjectMembers(projectId);
  const boardView = useBoardView();
  useBoardRealtime(projectId);

  const isAdmin = !!members?.members.some((member) => member.userId === me.id && member.isAdmin);

  const activeMembers = members?.members.filter((member) => member.status === "active" && member.userId) ?? [];

  if (isLoading) return <Skeleton className="h-96 rounded-xl" />;
  if (isError) return <p className="text-sm text-muted-foreground">Could not load this board. Refresh to try again.</p>;
  if (!data) return <p className="text-sm text-muted-foreground">This project is no longer available.</p>;

  return (
    <>
      <BoardHeader project={data.project} isAdmin={isAdmin} />
      <BoardToolbar
        projectId={projectId}
        categories={data.categories}
        isAdmin={isAdmin}
        members={activeMembers}
        boardView={boardView}
        onSearch={(value) => debounce(() => setSearch(value.trim()), 500)}
      />
      <BoardColumns
        project={data.project}
        categories={data.categories}
        tasks={data.tasks}
        canDrag={!search && boardView.view.sort === "manual"}
        isAdmin={isAdmin}
        view={boardView.view}
        meId={me.id}
        today={getTodayInTimeZone(me.timezone)}
      />
    </>
  );
}
