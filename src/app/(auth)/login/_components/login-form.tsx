import { Sms } from "iconsax-react";
import Link from "next/link";
import { Suspense } from "react";

import KanboLogo from "@/components/common/kanbo-logo";

import GoogleSignInButton, { GoogleSignInButtonFallback } from "./google-sign-in-button";
import LoginErrorToast from "./login-error-toast";

export default function LoginForm() {
  return (
    <main className="flex min-w-0 flex-[1_1_420px] flex-col px-6 py-7 sm:px-10">
      <KanboLogo className="self-start" />

      <div className="flex flex-1 items-center justify-center py-12">
        <div className="flex w-full max-w-[380px] flex-col gap-7">
          <div className="flex flex-col gap-2">
            <h1 className="text-[30px] leading-tight font-semibold tracking-[-0.02em]">
              Welcome to Kanbo
            </h1>
            <p className="text-[15px] leading-relaxed text-muted-foreground">
              Sign in to see your boards and pick up where your team left off.
            </p>
          </div>

          <div className="flex flex-col gap-3">
            {/* Reads ?next= and ?error= (request data), so it streams in behind Suspense. */}
            <Suspense fallback={<GoogleSignInButtonFallback />}>
              <GoogleSignInButton />
              <LoginErrorToast />
            </Suspense>
            <p className="text-center text-[13px] leading-normal text-muted-foreground">
              New here? Signing in with Google creates your account.
            </p>
          </div>

          <div role="note" className="flex gap-3 rounded-[14px] bg-kb-surface p-3.5">
            <span
              aria-hidden="true"
              className="flex size-8 flex-none items-center justify-center rounded-[10px] bg-kb-lilac-tint text-kb-lilac-fg"
            >
              <Sms size={18} variant="Linear" color="currentColor" />
            </span>
            <span className="flex flex-col gap-0.5">
              <span className="text-sm font-semibold">Got an invite?</span>
              <span className="text-[13px] leading-normal text-muted-foreground">
                Sign in with the Google account the invite was sent to, and the project shows up
                right away.
              </span>
            </span>
          </div>
        </div>
      </div>

      <p className="text-xs leading-normal text-muted-foreground">
        By continuing you agree to the{" "}
        <Link href="/terms" className="text-foreground underline underline-offset-[3px]">
          Terms
        </Link>{" "}
        and{" "}
        <Link href="/privacy" className="text-foreground underline underline-offset-[3px]">
          Privacy Policy
        </Link>
        .
      </p>
    </main>
  );
}
