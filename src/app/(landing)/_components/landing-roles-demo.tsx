"use client";

import { useState } from "react";

import {
  AddRoleButton,
  RoleChip,
  RolePicker,
} from "@/components/common/role-picker";
import UserAvatar from "@/components/common/user-avatar";
import { Badge } from "@/components/ui/badge";

type DemoMember = {
  name: string;
  email: string;
  admin?: boolean;
  roles: string[];
  tone: string;
};

const INITIAL_MEMBERS: DemoMember[] = [
  {
    name: "Alex Morgan (you)",
    email: "alex.morgan@example.com",
    admin: true,
    roles: ["UI/UX"],
    tone: "lilac",
  },
  {
    name: "Jane Doe",
    email: "jane.doe@example.com",
    roles: ["Frontend"],
    tone: "blue",
  },
  {
    name: "John Smith",
    email: "john.smith@example.com",
    roles: ["QA"],
    tone: "orange",
  },
];

// The members list with the real role picker; roles change in local state only.
export default function LandingRolesDemo() {
  const [members, setMembers] = useState(INITIAL_MEMBERS);
  const [editing, setEditing] = useState<string | null>(null);

  const setRoles = (email: string, roles: string[]) =>
    setMembers((list) =>
      list.map((member) =>
        member.email === email ? { ...member, roles } : member,
      ),
    );

  return (
    <div className="flex flex-col gap-1">
      <span className="pb-1 text-xs font-medium text-kb-text-2">
        {members.length} members
      </span>
      <ul aria-label="Project members" className="flex flex-col">
        {members.map((member) => (
          <li
            key={member.email}
            className="flex flex-col gap-3 border-t border-kb-divider py-3"
          >
            <div className="flex items-start gap-3">
              <UserAvatar
                name={member.name.replace(" (you)", "")}
                size="lg"
                avatarBg={`var(--kb-${member.tone}-tint)`}
                avatarFg={`var(--kb-${member.tone}-fg)`}
              />
              <div className="flex min-w-0 flex-1 flex-col gap-1.5">
                <div className="flex flex-wrap items-center gap-1.5">
                  <span className="text-sm font-semibold">{member.name}</span>
                  {member.admin && <Badge variant="secondary">Admin</Badge>}
                </div>
                <span className="truncate text-xs text-muted-foreground">
                  {member.email}
                </span>
                <div className="flex flex-wrap items-center gap-1.5">
                  {member.roles.map((role) => (
                    <RoleChip key={role} role={role} />
                  ))}
                  {member.roles.length === 0 && (
                    <span className="text-xs text-muted-foreground">
                      No role yet
                    </span>
                  )}
                  <AddRoleButton
                    expanded={editing === member.email}
                    onClick={() =>
                      setEditing(editing === member.email ? null : member.email)
                    }
                  />
                </div>
              </div>
            </div>
            {editing === member.email && (
              <RolePicker
                roles={member.roles}
                onChange={(roles) => setRoles(member.email, roles)}
                onDone={() => setEditing(null)}
              />
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
