import Link from "next/link";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { getProgressPercent } from "@/constants/dashboard-constant";
import { PROJECT_TILE } from "@/constants/project-constant";
import { cn } from "@/lib/utils";
import type { DashboardStats } from "@/types/project";

export default function DashboardProjects({ projects }: { projects: DashboardStats["projects"] }) {
  return (
    <Card aria-label="Projects">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-[15px] font-semibold">Projects</CardTitle>
        <Link href="/my-tasks" className="text-[13px] font-medium underline underline-offset-[3px]">
          View All
        </Link>
      </CardHeader>
      <CardContent className="flex flex-col gap-1">
        {projects.map((project) => (
          <Link
            key={project.id}
            href={`/projects/${project.id}`}
            className="flex flex-col gap-2.5 rounded-[10px] px-2.5 py-3 outline-none hover:bg-muted focus-visible:ring-3 focus-visible:ring-ring/50"
          >
            <span className="flex items-center gap-2.5">
              <span
                aria-hidden="true"
                className={cn(
                  "flex size-7 flex-none items-center justify-center rounded-lg text-xs font-semibold",
                  PROJECT_TILE[project.color],
                )}
              >
                {project.name[0].toUpperCase()}
              </span>
              <span className="min-w-0 flex-1 truncate text-sm font-medium">{project.name}</span>
              <span className="text-[13px] whitespace-nowrap text-muted-foreground">
                {project.done} of {project.total} done
              </span>
            </span>
            <Progress
              value={getProgressPercent(project.done, project.total)}
              aria-label={`${project.name} progress`}
              className="h-1.5"
            />
          </Link>
        ))}
      </CardContent>
    </Card>
  );
}
