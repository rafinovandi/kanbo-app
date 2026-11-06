import { ViewTransition, type ReactNode } from "react";

export default function PageTransition({ children }: { children: ReactNode }) {
  return (
    <ViewTransition default="none" enter="page-enter" exit="page-exit">
      <div className="flex min-w-0 flex-1 flex-col">{children}</div>
    </ViewTransition>
  );
}
