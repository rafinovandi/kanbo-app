"use client";

import { Add, Warning2 } from "iconsax-react";
import { useState } from "react";

import NewProjectDialog from "@/components/common/new-project-dialog";
import TaskSearch from "@/components/common/task-search";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import useDebounce from "@/hooks/use-debounce";
import useProjectsOverview from "@/hooks/use-projects-overview";

import MyTasksEmpty from "./my-tasks-empty";
import MyTasksProject from "./my-tasks-project";

function NoResults({ search }: { search: string }) {
  return (
    <p className="py-10 text-center text-sm text-muted-foreground">
      No tasks match “{search}”.
    </p>
  );
}

// With projects: search, the header New Project button and one section per project. Without: the
// empty state, where search and the button stay hidden.
export default function MyTasksContent() {
  const debounce = useDebounce();
  const [search, setSearch] = useState("");
  const {
    data: projects,
    isLoading,
    isError,
    isPlaceholderData,
  } = useProjectsOverview(search);

  const handleChangeSearch = (value: string) =>
    debounce(() => setSearch(value.trim()), 500);
  const hasProjects = !!projects && projects.length > 0;

  return (
    <>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="flex flex-col gap-1.5">
          <h1 className="text-[28px] leading-tight font-semibold tracking-[-0.02em]">
            My Tasks
          </h1>
          <p className="text-sm text-muted-foreground">
            Every task, grouped by project. Open a project to see its board.
          </p>
        </div>
        {(hasProjects || search || isPlaceholderData) && (
          <div className="flex w-full gap-2 sm:w-auto">
            <div className="min-w-0 flex-1 sm:flex-none">
              <TaskSearch onChange={handleChangeSearch} />
            </div>
            <NewProjectDialog>
              <Button type="button" className="shrink-0 gap-2">
                <Add
                  size={20}
                  variant="Linear"
                  color="currentColor"
                  aria-hidden
                />
                New Project
              </Button>
            </NewProjectDialog>
          </div>
        )}
      </div>

      {isLoading && <Skeleton className="h-48 rounded-xl" />}
      {isError && (
        <Alert variant="destructive">
          <Warning2
            size={16}
            variant="Linear"
            color="currentColor"
            aria-hidden
          />
          <AlertDescription>
            Could not load your projects. Refresh to try again.
          </AlertDescription>
        </Alert>
      )}
      {projects &&
        !hasProjects &&
        !isPlaceholderData &&
        (search ? <NoResults search={search} /> : <MyTasksEmpty />)}
      {projects?.map((project) => (
        <MyTasksProject key={project.id} project={project} />
      ))}
    </>
  );
}
