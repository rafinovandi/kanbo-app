"use client";

import { useQueryClient } from "@tanstack/react-query";
import { formatDistanceToNow } from "date-fns";
import { Copy, TickCircle, Warning2 } from "iconsax-react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";

import { createLinkCodeAction, revokeLinkAction, updateLinkNotifyAction } from "@/actions/agent-link-action";
import ConfirmDeleteDialog from "@/components/common/confirm-delete-dialog";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import useAgentBots from "@/hooks/use-agent-bots";
import useAgentLinks, { agentLinksKey } from "@/hooks/use-agent-links";
import { cn } from "@/lib/utils";
import type { AgentLink } from "@/types/agent";

const POLL_MS = 4000;

type NotifyKey = "notify_task_created" | "notify_task_completed";

function NotifyToggle({ label, on, onToggle }: { label: string; on: boolean; onToggle: () => void }) {
  return (
    <Button
      type="button"
      variant="outline"
      role="switch"
      aria-checked={on}
      onClick={onToggle}
      className="h-11 min-w-44 flex-1 justify-between px-3 text-[13px] font-medium"
    >
      {label}
      <span
        aria-hidden="true"
        className={cn("relative h-5 w-9 flex-none rounded-full transition-colors", on ? "bg-primary" : "bg-border")}
      >
        <span
          className={cn(
            "absolute top-0.5 size-4 rounded-full bg-background transition-[left]",
            on ? "left-[18px]" : "left-0.5",
          )}
        />
      </span>
    </Button>
  );
}

function LinkRow({
  link,
  onToggle,
  onRevoke,
}: {
  link: AgentLink;
  onToggle: (link: AgentLink, key: NotifyKey) => void;
  onRevoke: (link: AgentLink) => void;
}) {
  const used = link.last_used_at
    ? `Used ${formatDistanceToNow(new Date(link.last_used_at), { addSuffix: true })}`
    : "Never used";

  return (
    <li className="flex flex-col gap-3 rounded-xl border border-border p-3.5">
      <div className="flex items-start gap-3">
        <span className="flex min-w-0 flex-1 flex-col gap-0.5">
          <span className="font-mono text-[13px] font-semibold [overflow-wrap:anywhere]">{link.chat_id}</span>
          <span className="text-[13px] text-muted-foreground [overflow-wrap:anywhere]">
            @{link.bot_username} · {used}
          </span>
        </span>
        <Button type="button" variant="destructive" size="sm" onClick={() => onRevoke(link)}>
          Revoke
        </Button>
      </div>

      {link.notify_disabled_reason && (
        <div className="flex items-start gap-2 rounded-[10px] bg-kb-orange-tint px-3 py-2.5 text-[13px] leading-normal text-kb-orange-fg">
          <Warning2 size={18} variant="Linear" color="currentColor" className="mt-px flex-none" aria-hidden />
          <span>{link.notify_disabled_reason}</span>
        </div>
      )}

      <div className="flex flex-wrap gap-2">
        <NotifyToggle
          label="Task added"
          on={link.notify_task_created}
          onToggle={() => onToggle(link, "notify_task_created")}
        />
        <NotifyToggle
          label="Task completed"
          on={link.notify_task_completed}
          onToggle={() => onToggle(link, "notify_task_completed")}
        />
      </div>
    </li>
  );
}

const formatRemaining = (ms: number) => {
  const seconds = Math.max(0, Math.ceil(ms / 1000));
  return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, "0")}`;
};

// Admin-only: link a Telegram group to this project with a one-time code, and manage the chats already linked.
export default function ConnectChatDialog({
  open,
  onOpenChange,
  project,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  project: { id: string; name: string };
}) {
  const queryClient = useQueryClient();
  const [botId, setBotId] = useState("");
  const [code, setCode] = useState<{ value: string; botUsername: string; expiresAt: number } | null>(null);
  const [now, setNow] = useState(() => Date.now());
  const [generating, setGenerating] = useState(false);
  const [copied, setCopied] = useState(false);
  const [revoking, setRevoking] = useState<AgentLink | null>(null);
  const linksAtGenerate = useRef(0);

  const remaining = code ? code.expiresAt - now : 0;
  const waiting = code !== null && remaining > 0;
  const { data: bots, isLoading: botsLoading } = useAgentBots(open);
  const { data: links, isLoading: linksLoading } = useAgentLinks(project.id, open, waiting ? POLL_MS : false);
  const selectedBot = bots?.find((bot) => bot.id === botId) ?? bots?.[0];

  useEffect(() => {
    if (!waiting) return;
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, [waiting]);

  useEffect(() => {
    if (waiting && links && links.length > linksAtGenerate.current) {
      toast.success("Chat connected");
      setCode(null);
    }
  }, [links, waiting]);

  const handleOpenChange = (next: boolean) => {
    if (!next) setCode(null);
    onOpenChange(next);
  };

  const generate = async () => {
    if (!selectedBot) return;
    setGenerating(true);
    const result = await createLinkCodeAction(project.id, selectedBot.id);
    setGenerating(false);
    if (result.status === "error") {
      toast.error(result.message);
      return;
    }
    linksAtGenerate.current = links?.length ?? 0;
    setCopied(false);
    setNow(Date.now());
    setCode({ value: result.code, botUsername: selectedBot.bot_username, expiresAt: new Date(result.expiresAt).getTime() });
  };

  const message = code ? `@${code.botUsername} link kanbo ${code.value}` : "";

  const copyMessage = async () => {
    try {
      await navigator.clipboard.writeText(message);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Could not copy the message");
    }
  };

  const toggle = async (link: AgentLink, key: NotifyKey) => {
    const linksKey = agentLinksKey(project.id);
    queryClient.setQueryData<AgentLink[]>(linksKey, (rows) =>
      rows?.map((row) => (row.id === link.id ? { ...row, [key]: !row[key], notify_disabled_reason: null } : row)),
    );
    const result = await updateLinkNotifyAction(project.id, link.id, { [key]: !link[key] });
    if (result.status === "error") toast.error(result.message);
    queryClient.invalidateQueries({ queryKey: linksKey });
  };

  const revoke = async () => {
    if (!revoking) return false;
    const result = await revokeLinkAction(project.id, revoking.id);
    if (result.status === "error") {
      toast.error(result.message);
      return false;
    }
    toast.success("Chat revoked");
    queryClient.invalidateQueries({ queryKey: agentLinksKey(project.id) });
    return true;
  };

  return (
    <>
      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogContent className="max-h-[90vh] gap-6 overflow-y-auto p-6 sm:max-w-[480px]">
          <DialogHeader className="pr-10">
            <DialogTitle className="text-lg font-semibold">Connect Chat</DialogTitle>
            <DialogDescription>
              Link a Telegram group to this project. Your agent can then add tasks from that chat, and Kanbo posts
              updates there.
            </DialogDescription>
          </DialogHeader>

          <section className="flex flex-col gap-3">
            <h3 className="text-sm font-semibold">Link a new chat</h3>

            {botsLoading ? (
              <Skeleton className="h-10 w-full rounded-[10px]" />
            ) : !selectedBot ? (
              <div className="flex flex-col gap-1 rounded-xl bg-muted p-3.5">
                <span className="text-sm font-semibold">You don&apos;t have a bot yet</span>
                <span className="text-[13px] leading-normal text-muted-foreground">
                  Add your Telegram bot first: open your profile menu in the sidebar and choose Agent Bots.
                </span>
              </div>
            ) : code ? (
              <div className="flex flex-col gap-4">
                <div className="flex flex-col gap-3.5 rounded-xl bg-muted p-5">
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-[13px] font-medium text-kb-text-2">Link code</span>
                    <span
                      className={cn(
                        "rounded-full px-2.5 py-1 text-xs font-semibold",
                        waiting ? "bg-kb-blue-tint text-kb-blue-fg" : "bg-kb-orange-tint text-kb-orange-fg",
                      )}
                    >
                      {waiting ? `Expires in ${formatRemaining(remaining)}` : "Code expired"}
                    </span>
                  </div>
                  <div
                    className={cn(
                      "font-mono text-[32px] leading-tight font-semibold tracking-[0.14em]",
                      !waiting && "text-muted-foreground line-through",
                    )}
                  >
                    {code.value.slice(0, 4)} {code.value.slice(4)}
                  </div>
                  <div className="flex items-center gap-2">
                    {waiting && (
                      <Button type="button" variant="outline" onClick={copyMessage} className="h-10 px-3.5">
                        {copied ? (
                          <TickCircle size={18} variant="Linear" color="currentColor" aria-hidden />
                        ) : (
                          <Copy size={18} variant="Linear" color="currentColor" aria-hidden />
                        )}
                        {copied ? "Copied" : "Copy message"}
                      </Button>
                    )}
                    <Button type="button" variant="ghost" onClick={generate} disabled={generating} className="h-10 px-3.5 text-kb-blue-fg">
                      {waiting ? "New code" : "Generate new code"}
                    </Button>
                  </div>
                </div>

                {waiting && (
                  <div className="flex flex-col gap-2">
                    <span className="text-[13px] font-medium text-kb-text-2">Send this message in your Telegram group</span>
                    <div className="rounded-[10px] border border-border bg-background px-3.5 py-3 font-mono text-[13px] leading-normal font-medium [overflow-wrap:anywhere]">
                      {message}
                    </div>
                    <span className="flex items-center gap-2 text-[13px] text-muted-foreground">
                      <span aria-hidden="true" className="size-2 flex-none rounded-full bg-kb-green" />
                      Waiting for the group to connect…
                    </span>
                  </div>
                )}
              </div>
            ) : (
              <>
                <div className="flex flex-col gap-2">
                  <label htmlFor="connect-chat-bot" className="text-[13px] font-medium text-kb-text-2">
                    Bot
                  </label>
                  <Select value={selectedBot.id} onValueChange={setBotId}>
                    <SelectTrigger id="connect-chat-bot" className="h-10 w-full rounded-[10px] px-3 text-sm">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {bots?.map((bot) => (
                        <SelectItem key={bot.id} value={bot.id}>
                          {bot.name} · @{bot.bot_username}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <span className="text-xs text-muted-foreground">The bot must already be in your Telegram group.</span>
                </div>
                <Button type="button" onClick={generate} disabled={generating} className="h-10 self-start px-4">
                  {generating ? "Generating…" : "Generate Code"}
                </Button>
              </>
            )}
          </section>

          <div className="h-px bg-border" />

          <section className="flex flex-col gap-3">
            <div className="flex items-center justify-between gap-3">
              <h3 className="text-sm font-semibold">Connected chats</h3>
              <span className="text-xs font-semibold text-muted-foreground">
                {links?.length === 1 ? "1 chat" : `${links?.length ?? 0} chats`}
              </span>
            </div>

            {linksLoading ? (
              <Skeleton className="h-24 w-full rounded-xl" />
            ) : links && links.length > 0 ? (
              <ul className="flex flex-col gap-3">
                {links.map((link) => (
                  <LinkRow key={link.id} link={link} onToggle={toggle} onRevoke={setRevoking} />
                ))}
              </ul>
            ) : (
              <p className="rounded-xl border border-dashed border-border px-4 py-5 text-center text-[13px] leading-normal text-muted-foreground">
                No chats connected yet. Generate a code above and send it in your group.
              </p>
            )}
            <p className="text-xs leading-normal text-muted-foreground">
              Revoking a chat cancels its token. The agent can no longer read or change this project from that group.
            </p>
          </section>
        </DialogContent>
      </Dialog>

      <ConfirmDeleteDialog
        open={revoking !== null}
        onOpenChange={(next) => !next && setRevoking(null)}
        title="Revoke this chat?"
        description={`${revoking?.chat_id ?? ""} is disconnected from ${project.name}. Its token stops working right away.`}
        confirmLabel="Revoke"
        onConfirm={revoke}
      />
    </>
  );
}
