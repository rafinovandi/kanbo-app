import Link from "next/link";
import { Suspense } from "react";

import { signOut } from "@/actions/auth-action";
import ErrorPage from "@/components/common/error-page";
import { Button } from "@/components/ui/button";

import ForbiddenIllustration from "./forbidden-illustration";
import SignedInAs from "./signed-in-as";

const BUTTON_CLASS = "h-12 w-full rounded-xl text-[15px] font-medium";

// 403: signed in, but not a member of the project (spec §13). Full page, no sidebar.
export default function Forbidden() {
  return (
    <ErrorPage
      code="403"
      label="Error 403 · Access denied"
      tone="orange"
      illustration={<ForbiddenIllustration />}
      stars={["blue", "lilac", "pink"]}
      heading="You don't have access to this project"
      message="This board is private to its members. Ask the project owner to invite you, or switch to an account that is already a member."
      primary={
        // Requesting access has no flow designed yet (spec §13, §16), so the button stays disabled.
        <Button type="button" disabled className={BUTTON_CLASS}>
          Request Access
        </Button>
      }
      secondary={
        <Button asChild variant="outline" className={BUTTON_CLASS}>
          <Link href="/my-tasks">Back to My Tasks</Link>
        </Button>
      }
      note={
        <>
          <Suspense fallback={null}>
            <SignedInAs />
          </Suspense>
          <form action={signOut} className="inline">
            <button type="submit" className="text-foreground underline underline-offset-[3px]">
              Switch account
            </button>
          </form>
        </>
      }
    />
  );
}
