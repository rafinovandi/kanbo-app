"use client";

import { useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";

import { addAgentBotAction, removeAgentBotAction } from "@/actions/agent-bot-action";
import ConfirmDeleteDialog from "@/components/common/confirm-delete-dialog";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import useAgentBots, { AGENT_BOTS_KEY } from "@/hooks/use-agent-bots";
import type { AgentBot } from "@/types/agent";

function AddBotForm() {
  const queryClient = useQueryClient();
  const [token, setToken] = useState("");
  const [name, setName] = useState("");
  const [pending, setPending] = useState(false);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setPending(true);
    const result = await addAgentBotAction(token, name);
    setPending(false);
    if (result.status === "error") {
      toast.error(result.message);
      return;
    }
    setToken("");
    setName("");
    toast.success("Bot added");
    queryClient.invalidateQueries({ queryKey: AGENT_BOTS_KEY });
  };

  return (
    <form onSubmit={submit} className="flex flex-col gap-3">
      <div className="flex flex-col gap-2">
        <label htmlFor="bot-token" className="text-[13px] font-medium text-kb-text-2">
          Bot token
        </label>
        <Input
          id="bot-token"
          type="password"
          value={token}
          onChange={(event) => setToken(event.target.value)}
          placeholder="Paste the token from BotFather"
          autoComplete="off"
          spellCheck={false}
          disabled={pending}
          required
        />
      </div>
      <div className="flex flex-col gap-2">
        <label htmlFor="bot-name" className="text-[13px] font-medium text-kb-text-2">
          Name<span className="font-normal text-muted-foreground"> (optional)</span>
        </label>
        <Input
          id="bot-name"
          value={name}
          onChange={(event) => setName(event.target.value)}
          maxLength={40}
          placeholder="Defaults to the bot's username"
          autoComplete="off"
          disabled={pending}
        />
      </div>
      <Button type="submit" disabled={pending || token.trim() === ""} className="self-end">
        {pending ? "Checking…" : "Add Bot"}
      </Button>
    </form>
  );
}

function BotRow({ bot, onRemove }: { bot: AgentBot; onRemove: (bot: AgentBot) => void }) {
  return (
    <li className="flex items-center gap-3 rounded-[10px] bg-kb-surface p-3 dark:bg-background">
      <span className="flex min-w-0 flex-1 flex-col gap-px">
        <span className="truncate text-sm font-semibold">{bot.name}</span>
        <span className="truncate text-[13px] text-muted-foreground">
          @{bot.bot_username}
          {bot.token_hint && ` · ${bot.token_hint}`}
        </span>
      </span>
      <Button type="button" variant="outline" size="sm" onClick={() => onRemove(bot)}>
        Revoke
      </Button>
    </li>
  );
}

// Add and revoke the user's Telegram bots; admins pick one of these in a project's Connect Chat.
export default function AgentBotsDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const queryClient = useQueryClient();
  const { data: bots, isLoading } = useAgentBots(open);
  const [removing, setRemoving] = useState<AgentBot | null>(null);

  const remove = async () => {
    if (!removing) return false;
    const result = await removeAgentBotAction(removing.id);
    if (result.status === "error") {
      toast.error(result.message);
      return false;
    }
    toast.success("Bot revoked");
    queryClient.invalidateQueries({ queryKey: AGENT_BOTS_KEY });
    return true;
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="gap-5 p-6 sm:max-w-[480px]">
          <DialogHeader className="pr-10">
            <DialogTitle className="text-lg font-semibold">Agent Bots</DialogTitle>
            <DialogDescription>
              Add your own Telegram bot. Kanbo keeps its token encrypted and uses it to talk to the chats you connect.
            </DialogDescription>
          </DialogHeader>

          {isLoading ? (
            <Skeleton className="h-14 w-full rounded-[10px]" />
          ) : (
            bots &&
            bots.length > 0 && (
              <ul className="flex flex-col gap-2">
                {bots.map((bot) => (
                  <BotRow key={bot.id} bot={bot} onRemove={setRemoving} />
                ))}
              </ul>
            )
          )}

          <AddBotForm />
        </DialogContent>
      </Dialog>

      <ConfirmDeleteDialog
        open={removing !== null}
        onOpenChange={(next) => !next && setRemoving(null)}
        title="Revoke this bot?"
        description={`@${removing?.bot_username ?? ""} is removed from Kanbo and every chat connected through it is disconnected.`}
        confirmLabel="Revoke"
        onConfirm={remove}
      />
    </>
  );
}
