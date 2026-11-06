import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
  SidebarSeparator,
} from "@/components/ui/sidebar";
import { Skeleton } from "@/components/ui/skeleton";

import KanboLogo from "./kanbo-logo";

export default function AppSidebarSkeleton() {
  return (
    <Sidebar className="border-r border-kb-divider">
      <SidebarHeader className="gap-5 px-4 pt-5 pb-0">
        <KanboLogo subtitle="Personal workspace" className="px-1.5 py-1" />
        <Skeleton className="h-[66px] w-full rounded-xl" />
      </SidebarHeader>
      <SidebarSeparator className="mx-4 my-5 bg-kb-divider data-horizontal:w-auto" />
      <SidebarContent className="px-4">
        <SidebarMenu className="gap-1">
          {["w-24", "w-16", "w-20"].map((width) => (
            <SidebarMenuItem key={width} className="flex h-11 items-center gap-3 px-3">
              <Skeleton className="size-5 rounded-md" />
              <Skeleton className={`h-3.5 ${width}`} />
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarContent>
      <SidebarFooter className="mx-4 border-t border-kb-divider px-0 pt-3 pb-5">
        <div className="flex items-center gap-3 px-2 py-2.5">
          <Skeleton className="size-8 rounded-full" />
          <div className="flex flex-1 flex-col gap-1.5">
            <Skeleton className="h-3.5 w-24" />
            <Skeleton className="h-3 w-16" />
          </div>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
