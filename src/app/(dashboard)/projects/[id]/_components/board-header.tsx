"use client";

import Link from "next/link";

import MembersDialog from "@/components/common/members-dialog";
import UserAvatar from "@/components/common/user-avatar";
import { AvatarGroup } from "@/components/ui/avatar";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { PROJECT_TILE } from "@/constants/project-constant";
import useProjectMembers from "@/hooks/use-project-members";
import { cn } from "@/lib/utils";
import type { BoardData } from "@/types/board";

const MAX_AVATARS = 4;

// Breadcrumb, project tile and name, and the Members button (spec §9).
export default function BoardHeader({ project }: { project: BoardData["project"] }) {
  const { data } = useProjectMembers(project.id);
  const people = data?.members.filter((member) => member.status === "active" && member.profile) ?? [];

  return (
    <div className="flex flex-col gap-2">
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink asChild>
              <Link href="/my-tasks">My Tasks</Link>
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>{project.name}</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <div className="flex items-center gap-3">
        <span
          aria-hidden="true"
          className={cn("flex size-9 flex-none items-center justify-center rounded-[10px] text-sm font-semibold", PROJECT_TILE[project.color])}
        >
          {project.name[0].toUpperCase()}
        </span>
        <h1 className="min-w-0 truncate text-[28px] leading-tight font-semibold tracking-[-0.02em]">{project.name}</h1>
        <MembersDialog project={{ id: project.id, name: project.name, color: project.color }}>
          <button
            type="button"
            className="ml-auto flex flex-none items-center gap-2 rounded-full border border-border bg-card py-1 pr-3.5 pl-1.5 outline-none hover:bg-muted focus-visible:ring-3 focus-visible:ring-ring/50"
          >
            <AvatarGroup>
              {people.slice(0, MAX_AVATARS).map((member) => (
                <UserAvatar
                  key={member.id}
                  name={member.profile?.name ?? member.email}
                  avatarUrl={member.profile?.avatar_url}
                  avatarBg={member.profile?.avatar_bg}
                  avatarFg={member.profile?.avatar_fg}
                  size="sm"
                />
              ))}
            </AvatarGroup>
            <span className="text-[13px] font-medium">Members</span>
          </button>
        </MembersDialog>
      </div>
    </div>
  );
}
