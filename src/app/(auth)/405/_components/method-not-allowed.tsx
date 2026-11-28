import Link from "next/link";

import ErrorPage from "@/components/common/error-page";
import GoBackButton from "@/components/common/go-back-button";
import { Button } from "@/components/ui/button";

import MethodNotAllowedIllustration from "./method-not-allowed-illustration";

const BUTTON_CLASS = "h-12 w-full rounded-xl text-[15px] font-medium";

// 405: a page got a request method it doesn't accept (a POST/PUT/DELETE to a page URL).
// The proxy sends those here with a 303, so "Go back" returns to the page the user came from.
export default function MethodNotAllowed() {
  return (
    <ErrorPage
      code="405"
      label="Error 405 · Action not allowed"
      tone="lilac"
      illustration={<MethodNotAllowedIllustration />}
      stars={["lilac", "orange", "pink"]}
      heading="That action isn't allowed here"
      message="This page doesn't support what you just tried to do. Go back and try again from the page itself, or return to your tasks."
      primary={<GoBackButton className={BUTTON_CLASS} />}
      secondary={
        <Button asChild variant="outline" className={BUTTON_CLASS}>
          <Link href="/dashboard">Go to Dashboard</Link>
        </Button>
      }
      note="Keeps happening? Contact support"
    />
  );
}
