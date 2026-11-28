"use client";

import { Refresh } from "iconsax-react";
import Link from "next/link";

import ErrorPage from "@/components/common/error-page";
import { Button } from "@/components/ui/button";

import ServerErrorIllustration from "./server-error-illustration";

const BUTTON_CLASS = "h-12 w-full rounded-xl text-[15px] font-medium";

// 500 / 503 and any other uncaught error, shown by app/error.tsx and app/global-error.tsx.
// Server errors carry a digest that matches the server log line; client errors have none, so no ref chip.
export default function ServerError({ error, retry }: { error: unknown; retry: () => void }) {
  const digest = error instanceof Error && "digest" in error ? String(error.digest) : null;

  return (
    <ErrorPage
      label="Something went wrong"
      tone="red"
      illustration={<ServerErrorIllustration />}
      stars={["lilac", "orange", "pink"]}
      heading="We couldn't load this page"
      message="It's usually temporary. Try again in a moment, and if it keeps happening, send us the error code below."
      primary={
        <Button type="button" onClick={retry} className={BUTTON_CLASS}>
          <Refresh size={18} variant="Linear" color="currentColor" aria-hidden />
          Try again
        </Button>
      }
      secondary={
        <Button asChild variant="outline" className={BUTTON_CLASS}>
          <Link href="/dashboard">Go to Dashboard</Link>
        </Button>
      }
      note={
        <span className="flex flex-wrap items-center justify-center gap-2">
          {digest && (
            <span className="rounded-md bg-muted px-2 py-0.5 font-mono text-xs text-foreground">Error 500 · Ref {digest}</span>
          )}
          Keeps happening? Contact support
        </span>
      }
    />
  );
}
