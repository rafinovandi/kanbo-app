"use client";

import { MotionConfig, motion } from "motion/react";
import Link from "next/link";
import { usePathname } from "next/navigation";

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuBadge,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarSeparator,
} from "@/components/ui/sidebar";
import { SIDEBAR_MENU_LIST } from "@/constants/sidebar-constant";
import useDashboardStats from "@/hooks/use-dashboard-stats";
import { isPathActive } from "@/lib/utils";
import type { AuthProfile } from "@/types/auth";
import type { ProjectSummary } from "@/types/project";

import KanboLogo from "./kanbo-logo";
import SidebarProjectCard from "./sidebar-project-card";
import SidebarUserMenu from "./sidebar-user-menu";

// Active nav item: black fill + white text (spec §4). Items are at least 44px tall.
// The fill is a separate <motion.span> (shared layoutId) so it glides between items; the button
// itself stays transparent when active.
const NAV_BUTTON_CLASS =
  "relative isolate h-11 gap-3 rounded-[10px] px-3 text-sm font-medium text-kb-text-2 [&_svg]:size-5 data-active:bg-transparent data-active:font-semibold data-active:text-sidebar-primary-foreground data-active:hover:bg-transparent data-active:hover:text-sidebar-primary-foreground";

function ActivePill() {
  return (
    <motion.span
      layoutId="sidebar-active-pill"
      aria-hidden
      className="absolute inset-0 -z-10 rounded-[10px] bg-sidebar-primary"
      transition={{ type: "spring", stiffness: 500, damping: 40 }}
    />
  );
}

export default function AppSidebar({
  profile,
  projects,
}: {
  profile: AuthProfile;
  projects: ProjectSummary[];
}) {
  const pathname = usePathname();
  // No project switcher yet: the current project is the board being viewed, otherwise the newest one.
  const viewedId = pathname.match(/^\/projects\/([^/]+)/)?.[1];
  const project = projects.find((item) => item.id === viewedId) ?? projects[0] ?? null;
  const { data: stats } = useDashboardStats();
  const openTasks = stats ? stats.total - stats.done : 0;

  return (
    <Sidebar className="border-r border-kb-divider">
      <SidebarHeader className="gap-5 px-4 pt-5 pb-0">
        <KanboLogo subtitle="Personal workspace" className="px-1.5 py-1" />
        <SidebarProjectCard project={project} />
      </SidebarHeader>

      <SidebarSeparator className="mx-4 my-5 bg-kb-divider data-horizontal:w-auto" />

      <SidebarContent className="px-4">
        <SidebarGroup className="p-0">
          <SidebarGroupContent>
            <MotionConfig reducedMotion="user">
            <SidebarMenu className="gap-1" aria-label="Main">
              {SIDEBAR_MENU_LIST.map((item) => {
                const url = item.needsProject ? (project ? `/projects/${project.id}` : null) : item.url;
                const activePath = item.activePath ?? url;
                const isActive = !!activePath && isPathActive(pathname, activePath);
                const content = (
                  <>
                    {isActive && <ActivePill />}
                    <item.icon variant="Linear" color="currentColor" aria-hidden />
                    <span>{item.title}</span>
                  </>
                );

                return (
                  <SidebarMenuItem key={item.title}>
                    {url && !item.disabled ? (
                      <SidebarMenuButton asChild isActive={isActive} className={NAV_BUTTON_CLASS}>
                        <Link href={url} aria-current={isActive ? "page" : undefined}>
                          {content}
                        </Link>
                      </SidebarMenuButton>
                    ) : (
                      <SidebarMenuButton
                        disabled
                        className={NAV_BUTTON_CLASS}
                        title="Create a project first"
                      >
                        {content}
                      </SidebarMenuButton>
                    )}
                    {item.badge && (
                      <SidebarMenuBadge className="right-3 h-5 min-w-[22px] rounded-md bg-kb-gray-tint font-semibold text-kb-text-2 peer-data-[size=default]/menu-button:top-3">
                        {openTasks}
                      </SidebarMenuBadge>
                    )}
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
            </MotionConfig>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="mx-4 border-t border-kb-divider px-0 pt-3 pb-5">
        <SidebarUserMenu profile={profile} />
      </SidebarFooter>
    </Sidebar>
  );
}
