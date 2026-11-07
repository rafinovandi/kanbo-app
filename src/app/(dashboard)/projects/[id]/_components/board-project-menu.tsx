"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Link21, More, Trash } from "iconsax-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

import { deleteProjectAction } from "@/actions/project-action";
import ConfirmDeleteDialog from "@/components/common/confirm-delete-dialog";
import ConnectChatDialog from "@/components/common/connect-chat-dialog";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { DASHBOARD_STATS_KEY } from "@/hooks/use-dashboard-stats";
import { PROJECTS_OVERVIEW_KEY } from "@/hooks/use-projects-overview";
import useProjectMembers from "@/hooks/use-project-members";
import { createClient } from "@/lib/supabase/client";

const plural = (count: number, one: string, many: string) => `${count} ${count === 1 ? one : many}`;

// The ⋯ menu next to Members (admins only): connect a chat to the agent, or delete the whole project after typing its name.
export default function BoardProjectMenu({ project }: { project: { id: string; name: string } }) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [connectOpen, setConnectOpen] = useState(false);
  const { data: members } = useProjectMembers(project.id);

  const { data: taskCount } = useQuery({
    queryKey: ["project-task-count", project.id],
    enabled: confirmOpen,
    queryFn: async () => {
      const { count, error } = await createClient()
        .from("tasks")
        .select("id", { count: "exact", head: true })
        .eq("project_id", project.id);
      if (error) throw error;
      return count ?? 0;
    },
  });

  const active = members?.members.filter((member) => member.status === "active").length ?? 0;
  const pending = members?.members.filter((member) => member.status === "pending").length ?? 0;

  const remove = async () => {
    const result = await deleteProjectAction(project.id);
    if (result.status === "error") {
      toast.error(result.message);
      return false;
    }
    toast.success("Project deleted");
    queryClient.invalidateQueries({ queryKey: DASHBOARD_STATS_KEY });
    queryClient.invalidateQueries({ queryKey: PROJECTS_OVERVIEW_KEY });
    router.push("/dashboard");
    return true;
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button type="button" variant="outline" size="icon" aria-label="Project actions" className="flex-none">
            <More size={18} variant="Linear" color="currentColor" aria-hidden />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-64">
          <DropdownMenuItem onSelect={() => setConnectOpen(true)} className="items-start gap-2.5">
            <Link21 size={18} variant="Linear" color="currentColor" className="mt-0.5" aria-hidden />
            <span className="flex flex-col gap-0.5">
              <span>Connect Chat</span>
              <span className="text-xs font-normal text-muted-foreground">Link a Telegram group to your agent.</span>
            </span>
          </DropdownMenuItem>
          <DropdownMenuItem variant="destructive" onSelect={() => setConfirmOpen(true)} className="items-start gap-2.5">
            <Trash size={18} variant="Linear" color="currentColor" className="mt-0.5" aria-hidden />
            <span className="flex flex-col gap-0.5">
              <span>Delete Project</span>
              <span className="text-xs font-normal text-muted-foreground">Admins only. This can&apos;t be undone.</span>
            </span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      <ConnectChatDialog open={connectOpen} onOpenChange={setConnectOpen} project={project} />
      <ConfirmDeleteDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        title="Delete Project"
        description={`This permanently deletes "${project.name}". This can't be undone.`}
        confirmLabel="Delete Project"
        confirmText={project.name}
        onConfirm={remove}
      >
        <ul className="list-disc space-y-1 pl-5 text-sm text-muted-foreground">
          <li>{taskCount === undefined ? "Its tasks" : plural(taskCount, "task", "tasks")} will be deleted</li>
          <li>
            {plural(active, "member loses", "members lose")} access to this board
          </li>
          {pending > 0 && <li>{plural(pending, "pending invite is", "pending invites are")} canceled</li>}
        </ul>
      </ConfirmDeleteDialog>
    </>
  );
}
