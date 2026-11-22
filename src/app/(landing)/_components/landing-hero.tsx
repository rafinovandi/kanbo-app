import Image from "next/image";

import { Button } from "@/components/ui/button";
import { CTA_BUTTON_CLASS } from "@/constants/ui-constant";
import { cn } from "@/lib/utils";

import GoogleCta from "./google-cta";
import Words from "./words";

const AVATAR_CLASS =
  "flex size-12 items-center justify-center rounded-full border-4 border-background text-base font-semibold tracking-normal sm:size-16 sm:border-[5px] sm:text-[21px] not-first:-ml-3.5 sm:not-first:-ml-[18px]";

export default function LandingHero() {
  return (
    <div className="relative isolate flex min-h-[calc(100svh-5rem)] flex-col">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 bottom-0 -z-10 h-[360px] bg-[url(/landing-plus.svg)] bg-[length:440px_440px] bg-bottom opacity-50 blur-[0.7px] [mask-image:linear-gradient(to_top,black_0%,rgb(0_0_0/0.9)_18%,rgb(0_0_0/0.45)_55%,transparent_100%)]"
      />
      <section className="mx-auto flex w-full max-w-[1200px] flex-1 flex-col items-center gap-8 px-6 pt-8 sm:px-10 sm:pt-12">
        <div className="flex flex-1 flex-col items-center justify-center gap-8 pb-8 text-center">
          <h1 className="kb-enter-words [--base:100ms] [--step:60ms] max-w-[920px] text-[40px] leading-[1.12] font-semibold tracking-[-0.04em] text-muted-foreground sm:text-[64px]">
            <Words text="Plan the work," />{" "}
            <span
              aria-hidden="true"
              className="mr-2 mb-2 ml-1 inline-flex align-middle sm:mr-3"
            >
              <span
                className={cn(AVATAR_CLASS, "bg-foreground text-background")}
              >
                R
              </span>
              <span className={cn(AVATAR_CLASS, "bg-kb-blue text-white")}>
                A
              </span>
              <span className={cn(AVATAR_CLASS, "bg-kb-lilac text-white")}>
                B
              </span>
            </span>
            <span className="text-foreground">
              <Words text="share it with your team," start={3} />
            </span>{" "}
            <Words text="and watch every card reach" start={8} />{" "}
            <span
              aria-hidden="true"
              className="mb-2 ml-1 inline-flex h-11 items-center gap-2.5 rounded-2xl bg-kb-green-tint pr-5 pl-4 align-middle text-2xl tracking-[-0.02em] text-kb-green-fg sm:h-14 sm:pr-[22px] sm:pl-[18px] sm:text-[32px]"
            >
              <span className="size-3 rounded-full bg-kb-green" />
              Done
            </span>
            <span className="sr-only">Done</span>
          </h1>
          <p className="kb-enter-words max-w-[560px] text-lg leading-relaxed text-kb-text-2 [--base:450ms] [--step:25ms]">
            <Words text="Kanbo is a simple board for small teams, with columns you choose, a role for everyone, and priorities you can see at a glance." />
          </p>
          <div className="kb-enter kb-enter-3 flex flex-wrap items-center justify-center gap-3">
            <GoogleCta />
            <Button asChild variant="outline" className={CTA_BUTTON_CLASS}>
              <a href="#how">See how it works</a>
            </Button>
          </div>
          <p className="kb-enter-words text-[13px] text-kb-text-2 [--base:900ms] [--step:25ms]">
            <Words text="Sign in with your Google account. No new password to remember." />
          </p>
        </div>

        <div className="kb-enter kb-enter-5 w-full">
          <Image
            src="/assets/kanban-board-landing.png"
            alt="Preview of a Kanbo board named Website Redesign with four columns: To Do, In Progress, Preview and Done"
            width={4800}
            height={1456}
            sizes="(min-width: 1280px) 1200px, 100vw"
            loading="eager"
            fetchPriority="high"
            className="block h-auto w-full"
          />
        </div>
      </section>
    </div>
  );
}
