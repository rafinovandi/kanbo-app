"use client";

import CopyField from "@/components/common/copy-field";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import type { AgentLinkKind } from "@/types/agent";

const formatRemaining = (ms: number) => {
  const seconds = Math.max(0, Math.ceil(ms / 1000));
  return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, "0")}`;
};

// The one-time link code with its countdown for a Telegram group, or the single `claude mcp add` command for an MCP client.
export default function LinkCodeCard({
  code,
  waiting,
  remaining,
  generating,
  appUrl,
  onGenerate,
}: {
  code: { value: string; kind: AgentLinkKind; botUsername: string };
  waiting: boolean;
  remaining: number;
  generating: boolean;
  appUrl: string;
  onGenerate: () => void;
}) {
  if (code.kind === "mcp") {
    const endpoint = `${appUrl}/api/agent/mcp`;
    const tabs = [
      {
        value: "claude",
        name: "Claude Code",
        command: `claude mcp add --transport http kanbo ${endpoint} --header "Authorization: Bearer ${code.value}"`,
      },
      {
        value: "codex",
        name: "Codex",
        command: `export KANBO_TOKEN=${code.value} && codex mcp add kanbo --url ${endpoint} --bearer-token-env-var KANBO_TOKEN`,
      },
    ];
    return (
      <div className="flex flex-col gap-3">
        <Tabs defaultValue={tabs[0].value}>
          <TabsList className="dark:bg-background">
            {tabs.map((tab) => (
              <TabsTrigger
                key={tab.value}
                value={tab.value}
                className="data-active:border-primary data-active:bg-primary data-active:text-primary-foreground data-active:hover:text-primary-foreground! dark:data-active:border-foreground/25 dark:data-active:bg-input/30 dark:data-active:text-foreground dark:data-active:hover:text-foreground!"
              >
                <code className="text-[13px]">{tab.name}</code>
              </TabsTrigger>
            ))}
          </TabsList>
          {tabs.map((tab) => (
            <TabsContent key={tab.value} value={tab.value}>
              <CopyField value={tab.command} />
              {tab.value === "codex" && (
                <span className="mt-2 block text-xs leading-normal text-muted-foreground">
                  Codex reads the token from the KANBO_TOKEN variable, so also
                  add the export line to your shell profile (for example
                  ~/.zshrc).
                </span>
              )}
            </TabsContent>
          ))}
        </Tabs>
        <span className="text-xs leading-normal text-muted-foreground">
          The token in this command is shown only once. Generating a new command
          cancels this one if it has not been used.
        </span>
        <span className="flex items-center gap-2 text-[13px] text-muted-foreground">
          <span
            aria-hidden="true"
            className="size-2 flex-none rounded-full bg-kb-green"
          />
          Waiting for your MCP client to connect…
        </span>
        <Button
          type="button"
          variant="ghost"
          onClick={onGenerate}
          disabled={generating}
          className="h-10 self-start px-3.5 text-kb-blue-fg"
        >
          New command
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-3.5 rounded-xl bg-muted p-5">
        <div className="flex items-center justify-between gap-3">
          <span className="text-[13px] font-medium text-kb-text-2">
            Link code
          </span>
          <span
            className={cn(
              "rounded-full px-2.5 py-1 text-xs font-semibold",
              waiting
                ? "bg-kb-blue-tint text-kb-blue-fg"
                : "bg-kb-orange-tint text-kb-orange-fg",
            )}
          >
            {waiting
              ? `Expires in ${formatRemaining(remaining)}`
              : "Code expired"}
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
          <CopyField
            label="Send this message in your Telegram group"
            value={`@${code.botUsername} link kanbo ${code.value}`}
          />
          <span className="flex items-center gap-2 text-[13px] text-muted-foreground">
            <span
              aria-hidden="true"
              className="size-2 flex-none rounded-full bg-kb-green"
            />
            Waiting for the group to connect…
          </span>
        </div>
      )}
    </div>
  );
}
