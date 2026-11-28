"use client";

import { ArrowLeft } from "iconsax-react";
import { useRouter } from "next/navigation";
import type { ComponentProps } from "react";

import { Button } from "@/components/ui/button";

// Goes one step back in history; opened in a fresh tab (nothing to go back to) it goes to `fallback`.
export default function GoBackButton({
  fallback = "/my-tasks",
  children = "Go back",
  ...props
}: { fallback?: string } & ComponentProps<typeof Button>) {
  const router = useRouter();

  return (
    <Button
      type="button"
      onClick={() => (window.history.length > 1 ? router.back() : router.push(fallback))}
      {...props}
    >
      <ArrowLeft size={18} variant="Linear" color="currentColor" aria-hidden />
      {children}
    </Button>
  );
}
