import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableRow } from "@/components/ui/table";
import { TASK_PRIORITY_CHIP } from "@/constants/my-tasks-constant";
import { PROJECT_TONE } from "@/constants/profile-constant";
import { cn, formatShortDate } from "@/lib/utils";
import type { ProjectTask } from "@/types/project";

// One task per row: status pill, title, priority chip, due date (spec §6). A row opens the task modal.
export default function MyTasksTaskTable({
  tasks,
  onOpenTask,
}: {
  tasks: ProjectTask[];
  onOpenTask: (taskId: string) => void;
}) {
  return (
    <Table>
      <TableBody>
        {tasks.map((task) => {
          const priority = TASK_PRIORITY_CHIP[task.priority];
          const done = task.status.key === "done";

          return (
            <TableRow
              key={task.id}
              role="button"
              tabIndex={0}
              aria-label={`Open task: ${task.title}`}
              onClick={() => onOpenTask(task.id)}
              onKeyDown={(event) => {
                if (event.key !== "Enter" && event.key !== " ") return;
                event.preventDefault();
                onOpenTask(task.id);
              }}
              className="cursor-pointer outline-none focus-visible:bg-muted focus-visible:ring-3 focus-visible:ring-inset focus-visible:ring-ring/50"
            >
              <TableCell className="w-36 px-4 py-3">
                <Badge variant="outline" className="h-6 gap-1.5 px-2.5 font-medium">
                  <span
                    className={cn("size-1.5 rounded-full", PROJECT_TONE[task.status.color].dot)}
                    aria-hidden="true"
                  />
                  {task.status.name}
                </Badge>
              </TableCell>
              <TableCell className={cn("py-3 whitespace-normal", done && "text-muted-foreground line-through")}>
                {task.title}
              </TableCell>
              <TableCell className="w-28 py-3">
                <Badge className={cn("h-6 px-2.5 font-semibold", priority.className)}>{priority.label}</Badge>
              </TableCell>
              <TableCell className="w-24 px-4 py-3 text-right text-muted-foreground">
                {task.dueDate ? formatShortDate(task.dueDate) : "—"}
              </TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
}
