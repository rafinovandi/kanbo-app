"use client";

import { useEffect, useState, type ReactNode } from "react";
import Image from "next/image";
import { ArrowLeft2, ArrowRight2, Send2 } from "iconsax-react";
import { MotionConfig, motion } from "motion/react";

import TerminalIcon from "@/components/common/terminal-icon";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";

import LandingMcpTerminal from "./landing-mcp-terminal";
import LandingTelegramChat from "./landing-telegram-chat";
import Words from "./words";

type Slide = {
  value: string;
  tab: string;
  dotClass: string;
  badgeIcon: ReactNode;
  badgeIconClass: string;
  badge: string;
  title: string;
  description: string;
  extra?: ReactNode;
  visual: ReactNode;
};

type SlideState = { index: number; from: number; dir: number };

const WORKS_WITH = [
  { name: "Claude Code", logo: "/claudecode.webp" },
  { name: "Codex", logo: "/codex.webp" },
];

const SLIDES: Slide[] = [
  {
    value: "telegram",
    tab: "Telegram bot",
    dotClass: "bg-[#2AABEE]",
    badgeIcon: <Send2 size={13} variant="Bold" color="currentColor" />,
    badgeIconClass: "bg-[#2AABEE] text-white",
    badge: "Telegram agent bot",
    title: "Add tasks from Telegram",
    description:
      "Connect your Telegram bot to a project, then ask it to add tasks right from the chat. Kanbo posts updates back to the same conversation.",
    visual: <LandingTelegramChat />,
  },
  {
    value: "mcp",
    tab: "Claude Code & Codex",
    dotClass: "bg-kb-lilac",
    badgeIcon: <TerminalIcon size={16} />,
    badgeIconClass: "bg-kb-lilac text-white",
    badge: "MCP server",
    title: "Manage tasks from Claude Code & Codex",
    description:
      "Add the Kanbo MCP server to your coding agent, then ask it to create, update, or move tasks without leaving the terminal.",
    extra: (
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
        <span className="text-[13px] text-muted-foreground">Works with</span>
        {WORKS_WITH.map((tool) => (
          <span
            key={tool.name}
            className="inline-flex items-center gap-2 text-sm font-medium"
          >
            <Image src={tool.logo} alt="" width={20} height={20} />
            {tool.name}
          </span>
        ))}
      </div>
    ),
    visual: <LandingMcpTerminal />,
  },
];

const EASE = [0.22, 1, 0.36, 1] as const;

// The incoming slide slides in from the side it is heading to, the outgoing one leaves the other way.
function slideAnimation(position: number, { index, from, dir }: SlideState) {
  if (position === index)
    return {
      opacity: [0, 1],
      x: [dir * 48, 0],
      transition: { duration: 0.5, ease: EASE },
    };
  if (position === from)
    return {
      opacity: [1, 0],
      x: [0, -dir * 48],
      transition: { duration: 0.3, ease: EASE },
    };
  return { opacity: 0, x: 0 };
}

// The dark integrations banner: one slide per way to add tasks from outside Kanbo, switched with the tabs or arrows.
// The inner `dark` scope switches the tokens (and the shadcn Tabs and Button) to their dark values on the banner.
export default function LandingIntegrations() {
  const [state, setState] = useState<SlideState>({
    index: 0,
    from: -1,
    dir: 1,
  });

  function show(next: number, dir?: number) {
    setState((current) =>
      next === current.index
        ? current
        : {
            index: next,
            from: current.index,
            dir: dir ?? (next > current.index ? 1 : -1),
          },
    );
  }

  // Links such as `#integrations-mcp` (in the footer) scroll here and open that slide, also when the page loads with one.
  useEffect(() => {
    function open(hash: string) {
      const next = SLIDES.findIndex(
        (slide) => hash === `#integrations-${slide.value}`,
      );
      if (next === -1) return false;
      show(next);
      document.getElementById("integrations")?.scrollIntoView({ block: "start" });
      return true;
    }

    function onClick(event: MouseEvent) {
      const link = (event.target as Element | null)?.closest?.(
        'a[href^="#integrations-"]',
      );
      if (link && open(link.getAttribute("href") ?? "")) event.preventDefault();
    }

    open(window.location.hash);
    document.addEventListener("click", onClick);
    return () => document.removeEventListener("click", onClick);
  }, []);

  function step(by: number) {
    show((state.index + by + SLIDES.length) % SLIDES.length, by);
  }

  return (
    <section
      id="integrations"
      aria-roledescription="carousel"
      aria-label="Integrations"
      className="kb-reveal min-w-0 scroll-mt-20 overflow-hidden rounded-[28px] bg-foreground p-6 sm:p-10"
    >
      <MotionConfig reducedMotion="user">
        <Tabs
          value={SLIDES[state.index].value}
          onValueChange={(value) =>
            show(SLIDES.findIndex((slide) => slide.value === value))
          }
          className="dark gap-8 text-foreground"
        >
          <div className="grid min-h-[300px] items-center">
            {SLIDES.map((slide, position) => (
              <TabsContent
                key={slide.value}
                value={slide.value}
                forceMount
                aria-roledescription="slide"
                aria-label={`${position + 1} of ${SLIDES.length}`}
                className="col-start-1 row-start-1 min-w-0 text-base transition-[visibility] duration-300 motion-reduce:transition-none data-[state=inactive]:pointer-events-none data-[state=inactive]:invisible"
              >
                <motion.div
                  initial={false}
                  animate={slideAnimation(position, state)}
                  className="flex flex-wrap items-center gap-x-16 gap-y-10"
                >
                  <div className="flex flex-[1_1_320px] flex-col items-start gap-4">
                    <span className="inline-flex h-8 items-center gap-2 rounded-2xl bg-foreground/15 pr-3 pl-1 text-[13px] font-medium">
                      <span
                        aria-hidden="true"
                        className={cn(
                          "flex size-6 items-center justify-center rounded-full",
                          slide.badgeIconClass,
                        )}
                      >
                        {slide.badgeIcon}
                      </span>
                      {slide.badge}
                    </span>
                    <h3 className="kb-words text-[30px] leading-[1.15] font-semibold tracking-[-0.03em]">
                      <Words text={slide.title} />
                    </h3>
                    <p className="kb-words max-w-[420px] leading-relaxed text-foreground/80 [--base:250ms] [--step:25ms]">
                      <Words text={slide.description} />
                    </p>
                    {slide.extra}
                  </div>
                  <div className="min-w-0 flex-[1_1_380px]">{slide.visual}</div>
                </motion.div>
              </TabsContent>
            ))}
          </div>

          <div className="flex flex-wrap items-center justify-between gap-4 border-t border-border pt-6">
            <TabsList
              aria-label="Choose integration"
              className="flex-wrap justify-start gap-2 rounded-none bg-transparent p-0 group-data-horizontal/tabs:h-auto"
            >
              {SLIDES.map((slide, position) => (
                <TabsTrigger
                  key={slide.value}
                  value={slide.value}
                  className="h-10 flex-none gap-2 rounded-full border-border px-3.5 text-foreground/80 dark:text-foreground/80 dark:data-active:border-foreground dark:data-active:bg-foreground dark:data-active:text-background dark:data-active:hover:border-foreground/80 dark:data-active:hover:bg-foreground/80 dark:data-active:hover:text-background group-data-[variant=default]/tabs-list:data-active:shadow-none"
                >
                  <span
                    aria-hidden="true"
                    className={cn(
                      "size-2 rounded-full transition-colors",
                      position === state.index
                        ? slide.dotClass
                        : "bg-muted-foreground",
                    )}
                  />
                  {slide.tab}
                </TabsTrigger>
              ))}
            </TabsList>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="icon-lg"
                aria-label="Previous integration"
                className="size-10 rounded-full"
                onClick={() => step(-1)}
              >
                <ArrowLeft2 variant="Linear" color="currentColor" />
              </Button>
              <Button
                variant="outline"
                size="icon-lg"
                aria-label="Next integration"
                className="size-10 rounded-full"
                onClick={() => step(1)}
              >
                <ArrowRight2 variant="Linear" color="currentColor" />
              </Button>
            </div>
          </div>
        </Tabs>
      </MotionConfig>
    </section>
  );
}
