import GoogleCta from "./google-cta";
import Words from "./words";

export default function LandingClosing() {
  return (
    <section className="mx-auto w-full max-w-[1200px] px-6 py-24 sm:px-10">
      <div className="kb-reveal flex flex-col items-start justify-between gap-6 rounded-3xl bg-kb-surface p-8 sm:flex-row sm:items-center sm:p-12">
        <div className="flex flex-col gap-2">
          <h2 className="kb-words text-2xl font-semibold tracking-[-0.02em] sm:text-3xl">
            <Words text="Ready to clear your board?" />
          </h2>
          <p className="kb-words text-muted-foreground [--base:250ms] [--step:25ms]">
            <Words text="Sign in with Google and start your first project." />
          </p>
        </div>
        <GoogleCta />
      </div>
    </section>
  );
}
