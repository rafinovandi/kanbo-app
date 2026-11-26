// The Telegram slide's chat: the request and the bot's reply, each tilted a little.
export default function LandingTelegramChat() {
  return (
    <div aria-hidden="true" className="flex flex-col gap-3 py-3">
      <p className="max-w-[420px] origin-bottom-right rotate-2 self-end transition-transform duration-300 ease-[cubic-bezier(0.34,1.56,0.64,1)] hover:-translate-y-1 hover:rotate-[2.5deg] motion-reduce:transition-none rounded-[14px] rounded-br-sm bg-foreground/15 px-3.5 py-3 text-sm leading-normal">
        <span className="underline">@your_bot</span> add task: fix broken avatar
        upload, low priority, due Nov 12, project Website Redesign
      </p>
      <div className="flex max-w-[420px] origin-top-left -rotate-[2.5deg] flex-col transition-transform duration-300 ease-[cubic-bezier(0.34,1.56,0.64,1)] hover:-translate-y-1 hover:-rotate-[3deg] motion-reduce:transition-none gap-1 self-start rounded-[14px] rounded-bl-sm bg-[#2B5278] px-3.5 py-3 text-sm leading-normal text-white">
        <span className="text-[13px] font-semibold text-[#8EC6FF]">
          your_bot
        </span>
        <span>
          Got it! I added{" "}
          <span className="font-semibold">“Fix broken avatar upload”</span> to
          Website Redesign, due Nov 12.
        </span>
      </div>
    </div>
  );
}
