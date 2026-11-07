import Link from "next/link";

import { signOut } from "@/actions/auth-action";
import KanboLogo from "@/components/common/kanbo-logo";
import { Button } from "@/components/ui/button";

// The invite belongs to another email than the one signed in (status email_mismatch).
export default function InviteMismatch({ invitedEmail, signedInEmail }: { invitedEmail: string; signedInEmail: string }) {
  return (
    <main className="flex min-h-svh flex-col px-6 py-7 sm:px-10">
      <KanboLogo className="self-start" />

      <div className="flex flex-1 items-center justify-center py-12">
        <div className="flex w-full max-w-[420px] flex-col gap-6">
          <div className="flex flex-col gap-2">
            <h1 className="text-[28px] leading-tight font-semibold tracking-[-0.02em]">
              This invite is for a different account
            </h1>
            <p className="text-[15px] leading-relaxed text-muted-foreground">
              It was sent to <strong className="font-semibold text-foreground">{invitedEmail}</strong>, but you are
              signed in as <strong className="font-semibold text-foreground">{signedInEmail}</strong>. Sign out, sign in
              with the invited Google account, then open the invite link again.
            </p>
          </div>

          <div className="flex flex-col gap-3">
            <form action={signOut}>
              <Button type="submit" className="h-12 w-full rounded-xl text-[15px] font-medium">
                Switch Account
              </Button>
            </form>
            <Button asChild variant="outline" className="h-12 w-full rounded-xl text-[15px] font-medium">
              <Link href="/dashboard">Go to Dashboard</Link>
            </Button>
          </div>
        </div>
      </div>
    </main>
  );
}
