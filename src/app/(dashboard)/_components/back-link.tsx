"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";

// With `previous`, goes back to the page the user came from; `href` is the fallback when there is no history (opened directly).
export default function BackLink({
  href,
  previous = false,
  children,
}: {
  href: string;
  previous?: boolean;
  children: React.ReactNode;
}) {
  const router = useRouter();

  return (
    <Link
      href={href}
      onClick={(event) => {
        if (previous && window.history.length > 1) {
          event.preventDefault();
          router.back();
        }
      }}
    >
      {children}
    </Link>
  );
}
