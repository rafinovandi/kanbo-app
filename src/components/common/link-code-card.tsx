"use client";

import { TickCircle } from "iconsax-react";

import CopyField from "@/components/common/copy-field";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { AgentLinkKind } from "@/types/agent";

const formatRemaining = (ms: number) => {
  const seconds = Math.max(0, Math.ceil(ms / 1000));
  return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, "0")}`;
};

// The one-time link code with its countdown, and what to do with it: a message for the Telegram group,
// or the two commands for an MCP client.
export default function LinkCodeCard({
  code,
  waiting,
  linked,
  remaining,
  generating,
  appUrl,
  onGenerate,
}: {
  code: { value: string; kind: AgentLinkKind; botUsername: string };
  waiting: boolean;
  linked: boolean;
  remaining: number;
  generating: boolean;
  appUrl: string;
  onGenerate: () => void;
}) {
  const linkCommand = `curl -s -X POST ${appUrl}/api/agent/v1/link -H "Content-Type: application/json" -d '{"code":"${code.value}"}'`;
  const addCommand = `claude mcp add --transport http kanbo ${appUrl}/api/agent/mcp --header "Authorization: Bearer <token from step 1>"`;

  if (linked) {
    return (
      <div className="flex flex-col gap-3">
        <span className="flex items-center gap-2 text-[13px] font-medium text-kb-green-fg">
          <TickCircle size={16} variant="Bold" color="currentColor" aria-hidden />
          1. Code used, token issued
        </span>
        <CopyField label="2. Now add the server to Claude Code" value={addCommand} />
        <span className="text-xs leading-normal text-muted-foreground">
          Paste the token from the reply of step 1 into this command.
        </span>
        <span className="flex items-center gap-2 text-[13px] text-muted-foreground">
          <span aria-hidden="true" className="size-2 flex-none rounded-full bg-kb-green" />
          Waiting for the MCP client to connect…
        </span>
      </div>
    );
  }

  return (
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
        <div className="flex items-center justify-center gap-2">
          <Button
            type="button"
            variant="ghost"
            onClick={onGenerate}
            disabled={generating}
            className="h-10 px-3.5 text-kb-blue-fg"
          >
            {waiting ? "New code" : "Generate new code"}
          </Button>
        </div>
      </div>

      {waiting && (
        <div className="flex flex-col gap-3">
          {code.kind === "chat" ? (
            <CopyField
              label="Send this message in your Telegram group"
              value={`@${code.botUsername} link kanbo ${code.value}`}
            />
          ) : (
            <>
              <CopyField label="1. Run this in your terminal" value={linkCommand} />
              <CopyField label="2. Then add the server to Claude Code" value={addCommand} />
              <span className="text-xs leading-normal text-muted-foreground">
                The reply of step 1 contains a token that is shown only once. Paste it in step 2.
              </span>
            </>
          )}
          <span className="flex items-center gap-2 text-[13px] text-muted-foreground">
            <span aria-hidden="true" className="size-2 flex-none rounded-full bg-kb-green" />
            {code.kind === "chat" ? "Waiting for the group to connect…" : "Waiting for the MCP client to connect…"}
          </span>
        </div>
      )}
    </div>
  );
}
