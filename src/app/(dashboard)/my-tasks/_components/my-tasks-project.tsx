"use client";

import { ArrowDown2, ArrowRight } from "iconsax-react";
import Link from "next/link";
import { useState } from "react";

import MembersDialog from "@/components/common/members-dialog";
import ProjectMenu from "@/components/common/project-menu";
import TaskDialogLoader from "@/components/common/task-dialog-loader";
import UserAvatar from "@/components/common/user-avatar";
import { AvatarGroup, AvatarGroupCount } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { getProgressPercent } from "@/constants/dashboard-constant";
import { MAX_TASK_ROWS } from "@/constants/my-tasks-constant";
import { PROJECT_TILE } from "@/constants/project-constant";
import { cn } from "@/lib/utils";
import type { ProjectOverview } from "@/types/project";

import MyTasksTaskTable from "./my-tasks-task-table";

const MAX_AVATARS = 5;

// One project: its header, then the task table once it has tasks. Only the first rows
// are visible until "See More".
export default function MyTasksProject({ project }: { project: ProjectOverview }) {
  const [expanded, setExpanded] = useState(false);
  const [openTaskId, setOpenTaskId] = useState<string | null>(null);

  const percent = getProgressPercent(project.done, project.total);
  const count = project.members.length;
  const extraAvatars = count - MAX_AVATARS;
  const membersLabel = `${count} ${count === 1 ? "member" : "members"}${project.pending > 0 ? ` · ${project.pending} pending` : ""}`;
  const { tasks } = project;
  const hiddenTasks = tasks.length - MAX_TASK_ROWS;

  return (
    <Card className="gap-0 py-0">
      <div className="flex flex-wrap items-center gap-x-6 gap-y-3 bg-kb-surface/50 p-4">
        <div className="flex min-w-[220px] flex-1 items-center gap-3">
          <span
            aria-hidden="true"
            className={cn(
              "flex size-9 flex-none items-center justify-center rounded-[10px] text-sm font-semibold",
              PROJECT_TILE[project.color],
            )}
          >
            {project.name[0].toUpperCase()}
          </span>
          <div className="min-w-0">
            <h2 className="truncate text-sm font-semibold">{project.name}</h2>
            <p className="line-clamp-1 text-xs text-muted-foreground">{project.description || "No description"}</p>
          </div>
        </div>

        <MembersDialog project={{ id: project.id, name: project.name, color: project.color }}>
          <button
            type="button"
            aria-label={`Members of ${project.name}: ${membersLabel}`}
            className="flex items-center gap-2.5 rounded-full border border-border bg-card py-1 pr-3 pl-1.5 outline-none hover:bg-muted focus-visible:ring-3 focus-visible:ring-ring/50"
          >
            <AvatarGroup>
              {project.members.slice(0, MAX_AVATARS).map((member) => (
                <UserAvatar
                  key={member.id}
                  name={member.name}
                  avatarUrl={member.avatar_url}
                  avatarBg={member.avatar_bg}
                  avatarFg={member.avatar_fg}
                  size="sm"
                />
              ))}
              {extraAvatars > 0 && <AvatarGroupCount>+{extraAvatars}</AvatarGroupCount>}
            </AvatarGroup>
            <span className="text-xs whitespace-nowrap text-muted-foreground">{membersLabel}</span>
          </button>
        </MembersDialog>

        <div className="flex items-center gap-3">
          <Progress value={percent} aria-label={`${project.name} progress`} className="h-1.5 w-24 bg-kb-gray-tint" />
          <span className="w-9 text-right text-xs font-semibold">{percent}%</span>
        </div>

        <Button asChild variant="outline" size="sm">
          <Link href={`/projects/${project.id}`}>
            Open Board
            <ArrowRight size={16} variant="Linear" color="currentColor" aria-hidden />
          </Link>
        </Button>
        <ProjectMenu project={{ id: project.id, name: project.name }} isAdmin={false} />
      </div>

      {tasks.length > 0 && (
        <div className="border-t border-border">
          <MyTasksTaskTable tasks={expanded ? tasks : tasks.slice(0, MAX_TASK_ROWS)} onOpenTask={setOpenTaskId} />
          {hiddenTasks > 0 && (
            <div className="flex justify-center border-t border-border py-1.5">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                aria-expanded={expanded}
                onClick={() => setExpanded(!expanded)}
              >
                {expanded ? "Show Less" : `See More (${hiddenTasks})`}
                <ArrowDown2
                  size={14}
                  variant="Linear"
                  color="currentColor"
                  className={cn("transition-transform", expanded && "rotate-180")}
                  aria-hidden
                />
              </Button>
            </div>
          )}
        </div>
      )}
      <TaskDialogLoader
        projectId={project.id}
        taskId={openTaskId}
        onOpenChange={(open) => !open && setOpenTaskId(null)}
      />
    </Card>
  );
}
