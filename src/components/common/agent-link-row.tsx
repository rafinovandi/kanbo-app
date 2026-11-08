"use client";

import { formatDistanceToNow } from "date-fns";
import { Warning2 } from "iconsax-react";

import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";
import type { AgentLink, NotifyKey } from "@/types/agent";

function NotifyToggle({
  id,
  label,
  hint,
  on,
  onToggle,
}: {
  id: string;
  label: string;
  hint: string;
  on: boolean;
  onToggle: () => void;
}) {
  return (
    <div className="flex min-h-12 items-center justify-between gap-3 py-2">
      <label htmlFor={id} className="flex min-w-0 flex-col gap-px">
        <span className="text-[13px] font-medium">{label}</span>
        <span className="text-xs text-muted-foreground">{hint}</span>
      </label>
      <Switch id={id} checked={on} onCheckedChange={onToggle} />
    </div>
  );
}

// One connection of a project. A Telegram chat can be tested and has notification switches;
// an MCP client has neither, because there is no chat to post to.
export default function AgentLinkRow({
  link,
  testing,
  onToggle,
  onTest,
  onRevoke,
}: {
  link: AgentLink;
  testing: boolean;
  onToggle: (link: AgentLink, key: NotifyKey) => void;
  onTest: (link: AgentLink) => void;
  onRevoke: (link: AgentLink) => void;
}) {
  const isChat = link.kind === "chat";
  const used = link.last_used_at
    ? `Used ${formatDistanceToNow(new Date(link.last_used_at), { addSuffix: true })}`
    : "Never used";

  return (
    <li className="flex flex-col gap-3 rounded-xl border border-border p-3.5">
      <div className="flex items-start gap-3">
        <span className="flex min-w-0 flex-1 flex-col gap-0.5">
          <span
            className={cn(
              "text-[13px] font-semibold [overflow-wrap:anywhere]",
              isChat && "font-mono",
            )}
          >
            {isChat ? link.chat_id : "MCP client"}
          </span>
          <span className="text-[13px] text-muted-foreground [overflow-wrap:anywhere]">
            {isChat ? `@${link.bot_username} · ${used}` : used}
          </span>
        </span>
        <div className="flex flex-none items-center gap-2">
          {isChat && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={testing}
              onClick={() => onTest(link)}
            >
              {testing ? "Sending…" : "Send Test"}
            </Button>
          )}
          <Button
            type="button"
            variant="destructive"
            size="sm"
            onClick={() => onRevoke(link)}
          >
            Revoke
          </Button>
        </div>
      </div>

      {isChat && link.notify_disabled_reason && (
        <div className="flex items-start gap-2 rounded-[10px] bg-kb-orange-tint px-3 py-2.5 text-[13px] leading-normal text-kb-orange-fg">
          <Warning2
            size={18}
            variant="Linear"
            color="currentColor"
            className="mt-px flex-none"
            aria-hidden
          />
          <span>{link.notify_disabled_reason}</span>
        </div>
      )}

      {isChat && (
        <div className="flex flex-col divide-y divide-border rounded-lg bg-kb-surface px-3">
          <NotifyToggle
            id={`notify-created-${link.id}`}
            label="Task added"
            hint="Post when someone adds a task"
            on={link.notify_task_created}
            onToggle={() => onToggle(link, "notify_task_created")}
          />
          <NotifyToggle
            id={`notify-completed-${link.id}`}
            label="Task completed"
            hint="Post when a task moves to Done"
            on={link.notify_task_completed}
            onToggle={() => onToggle(link, "notify_task_completed")}
          />
        </div>
      )}
    </li>
  );
}
