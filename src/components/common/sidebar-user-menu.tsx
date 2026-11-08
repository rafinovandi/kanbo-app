"use client";

import { ArrowRight2, Logout, Profile, Cpu } from "iconsax-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useTransition } from "react";

import { signOut } from "@/actions/auth-action";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import { isPathActive } from "@/lib/utils";
import type { AuthProfile } from "@/types/auth";

import AgentBotsDialog from "./agent-bots-dialog";
import UserAvatar from "./user-avatar";

export default function SidebarUserMenu({ profile }: { profile: AuthProfile }) {
  const { isMobile } = useSidebar();
  const pathname = usePathname();
  const [isSigningOut, startSignOut] = useTransition();
  const [botsOpen, setBotsOpen] = useState(false);
  const onProfile = isPathActive(pathname, "/profile") || pathname === `/u/${profile.username}`;

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              size="lg"
              isActive={onProfile}
              className="h-auto gap-3 rounded-[10px] px-2 py-2.5"
            >
              <UserAvatar
                name={profile.name}
                avatarUrl={profile.avatar_url}
                avatarBg={profile.avatar_bg}
                avatarFg={profile.avatar_fg}
              />
              <span className="flex min-w-0 flex-1 flex-col gap-px">
                <span className="truncate text-sm font-semibold text-foreground">{profile.name}</span>
                <span className="text-xs text-muted-foreground">View profile</span>
              </span>
              <ArrowRight2 size={14} variant="Linear" color="currentColor" className="text-muted-foreground" aria-hidden />
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="min-w-56"
            side={isMobile ? "bottom" : "right"}
            align="end"
            sideOffset={8}
          >
            <DropdownMenuLabel className="p-0 font-normal">
              <div className="flex items-center gap-2.5 px-1.5 py-1.5">
                <UserAvatar
                  name={profile.name}
                  avatarUrl={profile.avatar_url}
                  avatarBg={profile.avatar_bg}
                  avatarFg={profile.avatar_fg}
                  size="sm"
                />
                <div className="min-w-0 leading-tight">
                  <p className="truncate text-sm font-medium">{profile.name}</p>
                  <p className="truncate text-xs text-muted-foreground">{profile.email}</p>
                </div>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              <DropdownMenuItem asChild>
                <Link href="/profile">
                  <Profile size={16} variant="Linear" color="currentColor" aria-hidden />
                  View Profile
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem onSelect={() => setBotsOpen(true)}>
                <Cpu size={16} variant="Linear" color="currentColor" aria-hidden />
                Agent Bots
              </DropdownMenuItem>
              <DropdownMenuItem
                variant="destructive"
                disabled={isSigningOut}
                onSelect={() => startSignOut(() => signOut())}
              >
                <Logout size={16} variant="Linear" color="currentColor" aria-hidden />
                {isSigningOut ? "Signing out…" : "Sign Out"}
              </DropdownMenuItem>
            </DropdownMenuGroup>
          </DropdownMenuContent>
        </DropdownMenu>
        <AgentBotsDialog open={botsOpen} onOpenChange={setBotsOpen} />
      </SidebarMenuItem>
    </SidebarMenu>
  );
}
