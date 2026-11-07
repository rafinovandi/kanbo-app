import Link from "next/link";

import ErrorPage from "@/components/common/error-page";
import { Button } from "@/components/ui/button";

import NotFoundIllustration from "./not-found-illustration";

const BUTTON_CLASS = "h-12 w-full rounded-xl text-[15px] font-medium";

// 404: the route or resource doesn't exist (spec §13). Full page, no sidebar.
export default function NotFound() {
  return (
    <ErrorPage
      code="404"
      label="Error 404 · Page not found"
      tone="blue"
      illustration={<NotFoundIllustration />}
      stars={["lilac", "orange", "pink"]}
      heading="This page wandered off the board"
      message="The link may be broken, or the page was moved or deleted. Check the address, or head back to your tasks."
      primary={
        <Button asChild className={BUTTON_CLASS}>
          <Link href="/my-tasks">Back to My Tasks</Link>
        </Button>
      }
      secondary={
        <Button asChild variant="outline" className={BUTTON_CLASS}>
          <Link href="/dashboard">Go to Dashboard</Link>
        </Button>
      }
      note="Think this is a mistake? Contact support"
    />
  );
}
