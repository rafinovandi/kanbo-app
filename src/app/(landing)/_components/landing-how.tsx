import Image from "next/image";

import Words from "./words";

const STEPS = [
  {
    image: "/assets/login.png",
    title: "1. Sign in with Google",
    text: "There is no new account to create and no password to remember.",
  },
  {
    image: "/assets/create-project.png",
    title: "2. Create a project",
    text: "Name it, pick a color, and invite your team with a role for each person.",
  },
  {
    image: "/assets/move-task.png",
    title: "3. Move work to Done",
    text: "Add tasks, assign people, and move cards across the board as work progresses.",
  },
];

export default function LandingHow() {
  return (
    <section
      id="how"
      className="mx-auto flex w-full max-w-[1200px] scroll-mt-20 flex-col gap-10 px-6 pt-24 sm:px-10"
    >
      <h2 className="kb-words text-center text-3xl leading-tight font-semibold tracking-[-0.02em] sm:text-4xl">
          <Words text="Up and running in three steps" />
        </h2>
      <ol className="grid gap-6 md:grid-cols-3">
        {STEPS.map((step) => (
          <li key={step.title}>
            <div className="kb-reveal flex flex-col gap-4">
              <div className="relative aspect-[1428/600] overflow-hidden rounded-2xl bg-kb-surface ring-1 ring-foreground/10">
                <Image
                  src={step.image}
                  alt=""
                  fill
                  sizes="(min-width: 1200px) 384px, (min-width: 768px) 33vw, 100vw"
                  loading="lazy"
                  className="object-cover object-top"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <h3 className="kb-words text-lg font-semibold">
                  <Words text={step.title} />
                </h3>
                <p className="kb-words text-sm text-muted-foreground [--base:250ms] [--step:25ms]">
                  <Words text={step.text} />
                </p>
              </div>
            </div>
          </li>
        ))}
      </ol>
    </section>
  );
}
