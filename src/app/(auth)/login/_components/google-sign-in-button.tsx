"use client";

import Image from "next/image";
import { useSearchParams } from "next/navigation";
import { useActionState, useEffect } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { INITIAL_STATE_ACTION } from "@/constants/general-constant";

import { signInWithGoogle } from "../actions";

// Google's dark sign-in button: #131314 fill, #8E918F stroke, #E3E3E3 label, logo on the fill.
const BUTTON_CLASS =
  "h-12 w-full gap-2.5 rounded-xl border border-[#8E918F] bg-[#131314] text-[15px] font-medium text-[#E3E3E3] hover:bg-[#131314]/90 disabled:opacity-85 aria-busy:cursor-progress";

function Spinner() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true" className="motion-safe:animate-spin">
      <circle cx="12" cy="12" r="9" stroke="#8E918F" strokeOpacity="0.4" strokeWidth="3" />
      <path d="M21 12a9 9 0 0 0-9-9" stroke="#E3E3E3" strokeWidth="3" strokeLinecap="round" />
    </svg>
  );
}

function GoogleBadge({ pending = false }: { pending?: boolean }) {
  return (
    <span className="flex size-5 flex-none items-center justify-center">
      {pending ? <Spinner /> : <Image src="/google-g.svg" alt="" width={20} height={20} />}
    </span>
  );
}

export default function GoogleSignInButton() {
  const searchParams = useSearchParams();
  const next = searchParams.get("next") ?? "";
  const [state, formAction, isPending] = useActionState(signInWithGoogle, INITIAL_STATE_ACTION);

  useEffect(() => {
    if (state?.status === "error") {
      toast.error("Couldn't connect to Google", {
        id: "google-sign-in",
        description: state.errors?._form?.[0],
        duration: Infinity,
      });
    }
  }, [state]);

  return (
    <form action={formAction} className="w-full">
      <input type="hidden" name="next" value={next} />
      <Button type="submit" disabled={isPending} aria-busy={isPending} className={BUTTON_CLASS}>
        <GoogleBadge pending={isPending} />
        {isPending ? "Connecting to Google…" : "Continue with Google"}
      </Button>
    </form>
  );
}

// Same look while the button streams in.
export function GoogleSignInButtonFallback() {
  return (
    <Button type="button" disabled className={BUTTON_CLASS}>
      <GoogleBadge />
      Continue with Google
    </Button>
  );
}
