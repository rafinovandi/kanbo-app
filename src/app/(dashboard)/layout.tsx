import { Suspense, type CSSProperties, type ReactNode } from "react";

import AppSidebarSkeleton from "@/components/common/app-sidebar-skeleton";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";

import AppSidebarLoader from "./_components/app-sidebar-loader";

// App shell: sidebar (248px) + content. The sidebar reads the session, so with
// Cache Components it streams in behind <Suspense>; the page content renders right away.
export default function DashboardLayout({ children }: { children: ReactNode }) {
  return (
    <SidebarProvider style={{ "--sidebar-width": "15.5rem" } as CSSProperties}>
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-50 focus:rounded-md focus:bg-background focus:px-3 focus:py-2 focus:text-sm focus:text-foreground focus:shadow-md"
      >
        Skip to Content
      </a>
      <Suspense fallback={<AppSidebarSkeleton />}>
        <AppSidebarLoader />
      </Suspense>
      <SidebarInset
        id="main-content"
        tabIndex={-1}
        className="min-w-0 outline-none"
      >
        {children}
      </SidebarInset>
    </SidebarProvider>
  );
}
