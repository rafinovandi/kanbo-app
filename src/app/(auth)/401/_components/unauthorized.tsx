import Link from "next/link";
import { Suspense } from "react";

import ErrorPage from "@/components/common/error-page";
import { Button } from "@/components/ui/button";

import GoogleSignInButton, {
  GoogleSignInButtonFallback,
} from "../../login/_components/google-sign-in-button";

import UnauthorizedIllustration from "./unauthorized-illustration";

// 401: not signed in, or the session expired.
export default function Unauthorized() {
  return (
    <ErrorPage
      code="401"
      label="Error 401 · Sign in required"
      tone="lilac"
      illustration={<UnauthorizedIllustration />}
      stars={["orange", "blue", "pink"]}
      heading="Your session has ended"
      message="For your security, you were signed out. Sign in again to pick up right where you left off."
      primary={
        // Reads ?next= (request data), so it streams in behind Suspense, same as the sign-in page.
        <Suspense fallback={<GoogleSignInButtonFallback />}>
          <GoogleSignInButton />
        </Suspense>
      }
      secondary={
        <Button asChild variant="outline" className="h-12 w-full rounded-xl text-[15px] font-medium">
          <Link href="/">Back to Home</Link>
        </Button>
      }
      note={
        <>
          New to Kanbo?{" "}
          <Link href="/login" className="text-foreground underline underline-offset-[3px]">
            Create an account
          </Link>
        </>
      }
    />
  );
}
