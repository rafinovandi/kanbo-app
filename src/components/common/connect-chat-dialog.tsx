"use client";

import { useQueryClient } from "@tanstack/react-query";
import { InfoCircle } from "iconsax-react";
import { MotionConfig, motion } from "motion/react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";

import {
  createLinkCodeAction,
  createMcpLinkAction,
  revokeLinkAction,
  sendTestMessageAction,
  updateLinkNotifyAction,
} from "@/actions/agent-link-action";
import AgentLinkRow from "@/components/common/agent-link-row";
import ConfirmDeleteDialog from "@/components/common/confirm-delete-dialog";
import LinkCodeCard from "@/components/common/link-code-card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { STAGGER_ITEM, STAGGER_LIST } from "@/constants/motion-constant";
import useAgentBots from "@/hooks/use-agent-bots";
import useAgentLinks, { agentLinksKey } from "@/hooks/use-agent-links";
import { displayClientName } from "@/lib/agent/client-name";
import type { AgentLink, AgentLinkKind, NotifyKey } from "@/types/agent";

const POLL_MS = 4000;

const KIND_OPTIONS: { value: AgentLinkKind; label: string }[] = [
  { value: "chat", label: "Telegram Chat" },
  { value: "mcp", label: "MCP Client" },
];

// Link a Telegram chat or an MCP client to this project with a one-time code, and manage what is already linked.
// Members see their own connections; admins see everyone's.
export default function ConnectChatDialog({
  open,
  onOpenChange,
  project,
  isAdmin,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  project: { id: string; name: string };
  isAdmin: boolean;
}) {
  const queryClient = useQueryClient();
  const [kind, setKind] = useState<AgentLinkKind>("chat");
  const [botId, setBotId] = useState("");
  const [code, setCode] = useState<{
    value: string;
    kind: AgentLinkKind;
    botUsername: string;
    expiresAt: number;
  } | null>(null);
  const [now, setNow] = useState(() => Date.now());
  const [generating, setGenerating] = useState(false);
  const [revoking, setRevoking] = useState<AgentLink | null>(null);
  const [testingId, setTestingId] = useState<string | null>(null);
  const linkIdsAtGenerate = useRef<Set<string>>(new Set());
  const [linkedId, setLinkedId] = useState<string | null>(null);

  const needsBot = kind === "chat";
  const remaining = code ? code.expiresAt - now : 0;
  const waiting = code !== null && remaining > 0 && linkedId === null;
  const polling = waiting || linkedId !== null;
  const { data: bots, isLoading: botsLoading } = useAgentBots(open);
  const { data: links, isLoading: linksLoading } = useAgentLinks(
    project.id,
    open,
    polling ? POLL_MS : false,
  );
  const linkedLink =
    linkedId !== null ? links?.find((link) => link.id === linkedId) : undefined;
  const connected = !!linkedLink?.last_used_at;
  const clientLabel =
    displayClientName(linkedLink?.client_name) ?? "MCP client";
  const selectedBot = bots?.find((bot) => bot.id === botId) ?? bots?.[0];
  const appUrl = typeof window === "undefined" ? "" : window.location.origin;

  useEffect(() => {
    if (!waiting) return;
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, [waiting]);

  useEffect(() => {
    if (!waiting || !links) return;
    const created = links.find(
      (link) => link.mine && !linkIdsAtGenerate.current.has(link.id),
    );
    if (!created) return;
    toast.success("Chat connected");
    setCode(null);
  }, [links, waiting]);

  useEffect(() => {
    if (connected) toast.success(`${clientLabel} connected`);
  }, [connected, clientLabel]);

  const handleOpenChange = (next: boolean) => {
    if (!next) {
      setCode(null);
      setLinkedId(null);
    }
    onOpenChange(next);
  };

  const generate = async () => {
    if (needsBot && !selectedBot) return;
    setGenerating(true);
    if (kind === "mcp") {
      const mcp = await createMcpLinkAction(project.id);
      setGenerating(false);
      if (mcp.status === "error") {
        toast.error(mcp.message);
        return;
      }
      setLinkedId(mcp.linkId);
      setCode({ value: mcp.token, kind, botUsername: "", expiresAt: 0 });
      queryClient.invalidateQueries({ queryKey: agentLinksKey(project.id) });
      return;
    }
    const result = await createLinkCodeAction(
      project.id,
      kind,
      needsBot ? selectedBot?.id : undefined,
    );
    setGenerating(false);
    if (result.status === "error") {
      toast.error(result.message);
      return;
    }
    linkIdsAtGenerate.current = new Set(links?.map((link) => link.id));
    setLinkedId(null);
    setNow(Date.now());
    setCode({
      value: result.code,
      kind,
      botUsername: selectedBot?.bot_username ?? "",
      expiresAt: new Date(result.expiresAt).getTime(),
    });
  };

  const toggle = async (link: AgentLink, key: NotifyKey) => {
    const linksKey = agentLinksKey(project.id);
    queryClient.setQueryData<AgentLink[]>(linksKey, (rows) =>
      rows?.map((row) =>
        row.id === link.id
          ? { ...row, [key]: !row[key], notify_disabled_reason: null }
          : row,
      ),
    );
    const result = await updateLinkNotifyAction(project.id, link.id, {
      [key]: !link[key],
    });
    if (result.status === "error") toast.error(result.message);
    queryClient.invalidateQueries({ queryKey: linksKey });
  };

  const sendTest = async (link: AgentLink) => {
    setTestingId(link.id);
    const result = await sendTestMessageAction(project.id, link.id);
    setTestingId(null);
    if (result.status === "error") toast.error(result.message);
    else toast.success("Test message sent");
  };

  const revoke = async () => {
    if (!revoking) return false;
    const result = await revokeLinkAction(project.id, revoking.id);
    if (result.status === "error") {
      toast.error(result.message);
      return false;
    }
    toast.success("Connection revoked");
    queryClient.invalidateQueries({ queryKey: agentLinksKey(project.id) });
    return true;
  };

  return (
    <>
      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogContent
          closeClassName="top-3.5"
          className="h-[min(720px,90vh)] grid-rows-[auto_minmax(0,1fr)_auto] gap-0 overflow-hidden p-0 sm:max-w-[480px]"
        >
          <div className="flex h-[68px] items-center border-b border-kb-divider pr-16 pl-6">
            <DialogTitle className="text-[15px] font-semibold">
              Connect Chat
            </DialogTitle>
          </div>

          <div className="flex flex-col gap-6 overflow-y-auto p-6">
            <DialogDescription>
              Connect a Telegram chat or an MCP client like Claude Code or Codex
              to this project.
            </DialogDescription>

            <section className="flex flex-col gap-3">
              <h3 className="text-sm font-semibold">Link a new connection</h3>

              {(!code || connected) && (
                <div
                  role="group"
                  aria-label="Connection type"
                  className="flex gap-2"
                >
                  {KIND_OPTIONS.map((option) => (
                    <Button
                      key={option.value}
                      type="button"
                      variant={kind === option.value ? "default" : "outline"}
                      aria-pressed={kind === option.value}
                      onClick={() => setKind(option.value)}
                      className="flex-1"
                    >
                      {option.label}
                    </Button>
                  ))}
                </div>
              )}

              <MotionConfig reducedMotion="user">
                <motion.div
                  key={kind}
                  className="flex flex-col gap-3"
                  variants={STAGGER_LIST}
                  initial="hidden"
                  animate="visible"
                >
                  {needsBot && botsLoading ? (
                    <Skeleton className="h-10 w-full rounded-[10px]" />
                  ) : needsBot && !selectedBot ? (
                    <Alert>
                      <InfoCircle
                        size={16}
                        variant="Linear"
                        color="currentColor"
                        aria-hidden
                      />
                      <AlertTitle>You don&apos;t have a bot yet</AlertTitle>
                      <AlertDescription>
                        Add your Telegram bot first: open your profile menu in
                        the sidebar and choose Agent Bots.
                      </AlertDescription>
                    </Alert>
                  ) : code && !connected ? (
                    <LinkCodeCard
                      code={code}
                      waiting={waiting}
                      remaining={remaining}
                      generating={generating}
                      appUrl={appUrl}
                      onGenerate={generate}
                    />
                  ) : (
                    <>
                      {needsBot ? (
                        <>
                          <motion.div
                            variants={STAGGER_ITEM}
                            className="flex flex-col gap-2"
                          >
                            <label
                              htmlFor="connect-chat-bot"
                              className="text-[13px] font-medium text-kb-text-2"
                            >
                              Bot
                            </label>
                            <Select
                              value={selectedBot?.id}
                              onValueChange={setBotId}
                            >
                              <SelectTrigger
                                id="connect-chat-bot"
                                className="h-10 w-full rounded-[10px] px-3 text-sm"
                              >
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
                            <span className="text-xs text-muted-foreground">
                              The bot must already be in your Telegram group.
                            </span>
                          </motion.div>
                          <motion.div
                            variants={STAGGER_ITEM}
                            className="flex flex-col gap-2.5 rounded-xl bg-muted p-3.5"
                          >
                            <span className="text-sm font-semibold">
                              Your agent needs the Kanbo skill
                            </span>
                            <ol className="list-decimal pl-4 text-[13px] leading-normal text-muted-foreground">
                              <li>Download the skill and unzip it.</li>
                              <li>
                                Put the <code>kanbo</code> folder in your
                                agent&apos;s skills folder.
                              </li>
                              <li>
                                Set <code>KANBO_API_URL</code> to{" "}
                                <code>{appUrl}</code> for the skill.
                              </li>
                            </ol>
                            <Button
                              asChild
                              variant="outline"
                              className="h-9 w-full px-4 sm:w-auto sm:self-start"
                            >
                              <a href="/api/agent/skill.zip" download>
                                Download skill
                              </a>
                            </Button>
                          </motion.div>
                        </>
                      ) : (
                        <motion.p
                          variants={STAGGER_ITEM}
                          className="text-[13px] leading-normal text-muted-foreground"
                        >
                          No Telegram bot is needed. You get one command to run
                          in your terminal, and the MCP client is connected.
                        </motion.p>
                      )}
                      <motion.div variants={STAGGER_ITEM}>
                        <Button
                          type="button"
                          onClick={generate}
                          disabled={generating}
                          className="h-10 w-full px-4 sm:w-auto sm:self-start"
                        >
                          {generating
                            ? "Generating…"
                            : needsBot
                              ? "Generate Code"
                              : "Generate Command"}
                        </Button>
                      </motion.div>
                    </>
                  )}
                </motion.div>
              </MotionConfig>
            </section>

            <div className="h-px bg-border" />

            <section className="flex flex-col gap-3">
              <div className="flex items-center justify-between gap-3">
                <h3 className="text-sm font-semibold">
                  {isAdmin ? "Connected" : "Your Connections"}
                </h3>
                <span className="text-xs font-semibold text-muted-foreground">
                  {links?.length === 1
                    ? "1 connection"
                    : `${links?.length ?? 0} connections`}
                </span>
              </div>

              {linksLoading ? (
                <Skeleton className="h-24 w-full rounded-xl" />
              ) : links && links.length > 0 ? (
                <ul className="flex flex-col gap-3">
                  {links.map((link) => (
                    <AgentLinkRow
                      key={link.id}
                      link={link}
                      testing={testingId === link.id}
                      onToggle={toggle}
                      onTest={sendTest}
                      onRevoke={setRevoking}
                    />
                  ))}
                </ul>
              ) : (
                <p className="rounded-xl border border-dashed border-border px-4 py-5 text-center text-[13px] leading-normal text-muted-foreground">
                  Nothing is connected yet. Generate a code above to link a
                  Telegram chat or an MCP client.
                </p>
              )}
              <p className="text-xs leading-normal text-muted-foreground">
                Revoking cancels the token. The agent or client can no longer
                read or change this project.
              </p>
            </section>
          </div>

          <DialogFooter className="mx-0 mb-0 border-t-0 bg-transparent px-6 py-4">
            <DialogClose asChild>
              <Button type="button" variant="outline">
                Close
              </Button>
            </DialogClose>
          </DialogFooter>
          <ConfirmDeleteDialog
            open={revoking !== null}
            onOpenChange={(next) => !next && setRevoking(null)}
            title="Revoke this connection?"
            description={`${revoking?.kind === "mcp" ? (displayClientName(revoking.client_name) ?? "This MCP client") : (revoking?.chat_id ?? "")} is disconnected from ${project.name}. Its token stops working right away.`}
            confirmLabel="Revoke"
            onConfirm={revoke}
          />
        </DialogContent>
      </Dialog>
    </>
  );
}
