"use client";

import { Warning2 } from "iconsax-react";
import { useState } from "react";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import useBoard from "@/hooks/use-board";
import useBoardTab from "@/hooks/use-board-tab";
import useBoardView from "@/hooks/use-board-view";
import useBoardRealtime from "@/hooks/use-board-realtime";
import useDebounce from "@/hooks/use-debounce";
import useProjectMembers from "@/hooks/use-project-members";
import { getTodayInTimeZone } from "@/lib/utils";
import { useAuthStore } from "@/stores/auth-store";

import BoardColumns from "./board-columns";
import BoardGantt from "./board-gantt";
import BoardHeader from "./board-header";
import BoardToolbar from "./board-toolbar";

// The Board of one project: header, toolbar and the Kanban columns or the Gantt timeline. Dragging cards is off while a search is
// active, because the cards on screen are then only part of each column.
export default function Board({ projectId }: { projectId: string }) {
  const me = useAuthStore((state) => state.profile);
  const debounce = useDebounce();
  const [search, setSearch] = useState("");
  const { data, isLoading, isError } = useBoard(projectId, search);
  const { data: members } = useProjectMembers(projectId);
  const boardView = useBoardView();
  const { tab, setTab } = useBoardTab();
  useBoardRealtime(projectId);

  const isAdmin = !!members?.members.some(
    (member) => member.userId === me.id && member.isAdmin,
  );

  const activeMembers =
    members?.members.filter(
      (member) => member.status === "active" && member.userId,
    ) ?? [];

  if (isLoading) return <Skeleton className="h-96 rounded-xl" />;
  if (isError) {
    return (
      <Alert variant="destructive">
        <Warning2 size={16} variant="Linear" color="currentColor" aria-hidden />
        <AlertDescription>
          Could not load this board. Refresh to try again.
        </AlertDescription>
      </Alert>
    );
  }
  if (!data)
    return (
      <p className="text-sm text-muted-foreground">
        This project is no longer available.
      </p>
    );

  return (
    <>
      <BoardHeader project={data.project} isAdmin={isAdmin} />
      <BoardToolbar
        projectId={projectId}
        categories={data.categories}
        isAdmin={isAdmin}
        members={activeMembers}
        boardView={boardView}
        tab={tab}
        onTabChange={setTab}
        onSearch={(value) => debounce(() => setSearch(value.trim()), 500)}
      />
      {tab === "gantt" ? (
        <BoardGantt
          project={data.project}
          categories={data.categories}
          tasks={data.tasks}
          members={activeMembers}
          view={boardView.view}
          isSearching={!!search}
          meId={me.id}
          today={getTodayInTimeZone(me.timezone)}
          timeZone={me.timezone}
        />
      ) : (
        <BoardColumns
          project={data.project}
          categories={data.categories}
          tasks={data.tasks}
          canDrag={!search}
          isAdmin={isAdmin}
          view={boardView.view}
          meId={me.id}
          today={getTodayInTimeZone(me.timezone)}
        />
      )}
    </>
  );
}
