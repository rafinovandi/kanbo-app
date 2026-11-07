import { Suspense, type CSSProperties, type ReactNode } from "react";

import AppSidebarSkeleton from "@/components/common/app-sidebar-skeleton";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";

import AppSidebarLoader from "./_components/app-sidebar-loader";

// App shell: sidebar (248px) + content. The sidebar reads the session, so with
// Cache Components it streams in behind <Suspense>; the page content renders right away.
export default function DashboardLayout({ children }: { children: ReactNode }) {
  return (
    <SidebarProvider style={{ "--sidebar-width": "15.5rem" } as CSSProperties}>
      <Suspense fallback={<AppSidebarSkeleton />}>
        <AppSidebarLoader />
      </Suspense>
      <SidebarInset className="min-w-0">{children}</SidebarInset>
    </SidebarProvider>
  );
}
