import type { Member } from "@/components/spaceui/member-selector";

type CreatorInput = {
  created_by: string | null;
  source: "web" | "agent";
  source_sender: string | null;
  creator: { name: string; avatar_url: string | null } | null;
};

// Who created a task, shaped for the read-only MemberSelector. A task made by an agent shows the agent's full
// name (the client or bot, kept in source_sender) with initials; a task made on the web shows the person's photo
// and first name, like the assignees.
export function getTaskCreator(task: CreatorInput): Member {
  if (task.source === "agent") {
    const name = task.source_sender?.trim() || "Agent";
    return { id: "agent", name, label: name };
  }
  if (!task.creator) return { id: task.created_by ?? "former-member", name: "Former member", label: "Former member" };
  return { id: task.created_by ?? "former-member", name: task.creator.name, avatar: task.creator.avatar_url ?? undefined };
}
