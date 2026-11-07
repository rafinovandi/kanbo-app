"use client";

import { Add, TickCircle } from "iconsax-react";
import { useState, type KeyboardEvent } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DEFAULT_ROLES, ROLE_LIMITS } from "@/constants/project-constant";
import { cn, getRoleChipClass } from "@/lib/utils";
import { isValidRole, normalizeRoles } from "@/validations/project";

const CHIP_CLASS = "h-6 px-2 text-xs font-medium";

export function RoleChip({ role }: { role: string }) {
  return <Badge className={cn(CHIP_CLASS, getRoleChipClass(role))}>{role}</Badge>;
}

// Dashed "+ Role" button that opens the role picker under a row.
export function AddRoleButton({ expanded, onClick }: { expanded: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-expanded={expanded}
      className="inline-flex h-6 items-center gap-1 rounded-full border border-dashed border-kb-line px-2 text-xs text-muted-foreground outline-none hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/50"
    >
      <Add size={12} variant="Linear" color="currentColor" aria-hidden />
      Role
    </button>
  );
}

// "Pick roles" panel under a row: default roles as toggles, plus a custom role input.
export function RolePicker({
  roles,
  onChange,
  onDone,
}: {
  roles: string[];
  onChange: (roles: string[]) => void;
  onDone: () => void;
}) {
  const [custom, setCustom] = useState("");
  const [error, setError] = useState<string>();

  const toggle = (role: string) =>
    onChange(roles.includes(role) ? roles.filter((r) => r !== role) : [...roles, role]);

  const addCustom = () => {
    const role = custom.trim();
    if (!role) return;
    if (!isValidRole(role)) return setError(`Max ${ROLE_LIMITS.maxLength} characters`);
    if (roles.length >= ROLE_LIMITS.maxRoles) return setError(`Max ${ROLE_LIMITS.maxRoles} roles`);
    onChange(normalizeRoles([...roles, role]));
    setCustom("");
    setError(undefined);
  };

  const onKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key !== "Enter") return;
    event.preventDefault();
    addCustom();
  };

  // Custom roles added so far, shown next to the defaults so they can be toggled off again.
  const customRoles = roles.filter((role) => !DEFAULT_ROLES.some((d) => d.name === role));

  return (
    <div className="flex flex-col gap-3 rounded-[14px] bg-kb-surface p-3.5">
      <p className="text-[13px] font-medium text-kb-text-2">Pick roles</p>
      <div className="flex flex-wrap gap-2">
        {[...DEFAULT_ROLES.map((r) => r.name), ...customRoles].map((role) => {
          const selected = roles.includes(role);
          return (
            <button
              key={role}
              type="button"
              aria-pressed={selected}
              onClick={() => toggle(role)}
              className={cn(
                "inline-flex h-7 items-center gap-1 rounded-full border px-2.5 text-xs font-medium outline-none focus-visible:ring-3 focus-visible:ring-ring/50",
                selected ? cn("border-transparent", getRoleChipClass(role)) : "border-border bg-background text-muted-foreground",
              )}
            >
              {selected && <TickCircle size={14} variant="Linear" color="currentColor" aria-hidden />}
              {role}
            </button>
          );
        })}
      </div>
      <div className="flex gap-2">
        <Input
          value={custom}
          onChange={(e) => setCustom(e.target.value)}
          onKeyDown={onKeyDown}
          maxLength={ROLE_LIMITS.maxLength}
          placeholder="Add a custom role"
          aria-label="Custom role"
          autoComplete="off"
        />
        <Button type="button" variant="outline" onClick={addCustom}>
          Add
        </Button>
        <Button type="button" onClick={onDone}>
          Done
        </Button>
      </div>
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}
