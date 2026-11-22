import { Send2 } from "iconsax-react";

import Words from "./words";

// The Telegram agent card: dark, with the two chat messages tilted a little.
export default function LandingTelegram() {
  return (
    <div className="kb-reveal flex min-w-0 flex-wrap items-center gap-x-16 gap-y-10 rounded-[28px] bg-foreground p-6 text-background sm:p-10">
      <div className="flex flex-[1_1_320px] flex-col items-start gap-4">
        <span className="inline-flex h-8 items-center gap-2 rounded-2xl bg-background/15 pr-3 pl-1 text-[13px] font-medium">
          <span
            aria-hidden="true"
            className="flex size-6 items-center justify-center rounded-full bg-[#2AABEE] text-white"
          >
            <Send2 size={13} variant="Bold" color="currentColor" />
          </span>
          Telegram agent bot
        </span>
        <h3 className="kb-words text-[30px] leading-[1.15] font-semibold tracking-[-0.03em]">
          <Words text="Add tasks from Telegram" />
        </h3>
        <p className="kb-words max-w-[420px] text-base leading-relaxed text-background/80 [--base:250ms] [--step:25ms]">
          <Words text="Connect your Telegram bot to a project, then ask it to add tasks right from the chat. Kanbo posts updates back to the same conversation." />
        </p>
      </div>
      <div
        aria-hidden="true"
        className="flex min-w-0 flex-[1_1_380px] flex-col gap-3 py-3"
      >
        <p className="max-w-[420px] origin-bottom-right rotate-2 self-end rounded-[14px] rounded-br-sm bg-background/15 px-3.5 py-3 text-sm leading-normal">
          <span className="underline">@your_bot</span> add task: fix broken
          avatar upload, low priority, due Nov 12, project Website Redesign
        </p>
        <div className="flex max-w-[420px] origin-top-left -rotate-[2.5deg] flex-col gap-1 self-start rounded-[14px] rounded-bl-sm bg-[#2B5278] px-3.5 py-3 text-sm leading-normal text-white">
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
    </div>
  );
}
