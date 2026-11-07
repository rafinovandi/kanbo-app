"use client";

import { useSyncExternalStore, ViewTransition, type ReactNode } from "react";

const subscribe = (onChange: () => void) => {
  document.addEventListener("visibilitychange", onChange);
  return () => document.removeEventListener("visibilitychange", onChange);
};
const isVisible = () => document.visibilityState === "visible";

// A view transition cannot start while the tab is hidden (the browser aborts it with "Document
// hidden"). The leaving page's props decide its exit animation, so they must already be "none"
// when the tab goes hidden, hence the visibilitychange subscription.
export default function PageTransition({ children }: { children: ReactNode }) {
  const animate = useSyncExternalStore(subscribe, isVisible, () => true);

  return (
    <ViewTransition default="none" enter={animate ? "page-enter" : "none"} exit={animate ? "page-exit" : "none"}>
      <div className="flex min-w-0 flex-1 flex-col">{children}</div>
    </ViewTransition>
  );
}
