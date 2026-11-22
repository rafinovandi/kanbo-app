"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import type { ComponentProps } from "react";

// True when the page before this one in the history is a page of this site. The Navigation API only lists same-origin
// entries, so a tab that started somewhere else (new tab page, another site) does not count; without it, the referrer is the guess.
function hasPreviousPageHere() {
  const navigation = (window as { navigation?: { canGoBack: boolean } }).navigation;
  return navigation ? navigation.canGoBack : document.referrer.startsWith(window.location.origin);
}

// With `previous`, goes back to the page the user came from; `href` is the fallback when there is none (opened directly).
// Other props (className, aria-label, ...) are passed on, so it can sit inside <Button asChild>.
export default function BackLink({
  href,
  previous = false,
  onClick,
  ...props
}: Omit<ComponentProps<typeof Link>, "href"> & {
  href: string;
  previous?: boolean;
}) {
  const router = useRouter();

  return (
    <Link
      href={href}
      onClick={(event) => {
        onClick?.(event);
        if (previous && hasPreviousPageHere()) {
          event.preventDefault();
          router.back();
        }
      }}
      {...props}
    />
  );
}
