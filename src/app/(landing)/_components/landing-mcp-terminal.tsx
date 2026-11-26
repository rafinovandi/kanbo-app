// The MCP slide's terminal: the `claude mcp add` command, a request, and Kanbo's tool call answering it.
export default function LandingMcpTerminal() {
  return (
    <div
      aria-hidden="true"
      className="ml-auto w-full max-w-[540px] -rotate-[1.5deg] overflow-hidden transition-transform duration-300 ease-[cubic-bezier(0.34,1.56,0.64,1)] hover:-translate-y-1 hover:-rotate-1 motion-reduce:transition-none rounded-[14px] border border-border bg-card"
    >
      <div className="flex h-[34px] items-center gap-1.5 border-b border-border px-3">
        <span className="size-[9px] rounded-full bg-kb-red" />
        <span className="size-[9px] rounded-full bg-kb-yellow" />
        <span className="size-[9px] rounded-full bg-kb-green" />
        <span className="ml-2 text-xs text-muted-foreground">
          ~/website-redesign
        </span>
      </div>
      <div className="flex flex-col gap-2.5 px-4 pt-3.5 pb-4 font-mono text-[13px] leading-[1.55]">
        <div className="flex gap-2.5 text-muted-foreground">
          <span>$</span>
          <span className="min-w-0 break-all">
            claude mcp add --transport http kanbo
            https://kanbo-app.my.id/api/agent/mcp --header &quot;Authorization:
            Bearer &lt;token&gt;&quot;
          </span>
        </div>
        <div className="flex gap-2.5">
          <span className="text-kb-lilac">&gt;</span>
          <span className="min-w-0">
            add task &quot;Fix checkout bug&quot; to Website Redesign, high
            priority
          </span>
        </div>
        <div className="flex flex-col gap-1 rounded-[10px] bg-muted px-3 py-2.5">
          <span className="text-kb-blue-fg">kanbo · create_task</span>
          <span>
            <span className="text-kb-green">✓</span> Added “Fix checkout bug” ·
            To Do · High
          </span>
        </div>
      </div>
    </div>
  );
}
