"use client";

import { CloseCircle } from "iconsax-react";
import { useState, type KeyboardEvent } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  isValidEmail,
  MAX_INVITES,
  type InviteDraft,
} from "@/validations/project";

import { AddRoleButton, RoleChip, RolePicker } from "./role-picker";

// "Invite members (optional)" in the New Project dialog. The list is sent with the form
// as JSON; the server validates it again.
export default function InviteMembersField({
  invites,
  onChange,
  error,
}: {
  invites: InviteDraft[];
  onChange: (invites: InviteDraft[]) => void;
  error?: string;
}) {
  const [email, setEmail] = useState("");
  const [emailError, setEmailError] = useState<string>();
  const [openEmail, setOpenEmail] = useState<string | null>(null);

  const add = () => {
    const value = email.trim().toLowerCase();
    if (!value) return;
    if (!isValidEmail(value))
      return setEmailError("Enter a valid email address");
    if (invites.some((invite) => invite.email === value))
      return setEmailError("This email is already added");
    if (invites.length >= MAX_INVITES)
      return setEmailError(
        `You can invite up to ${MAX_INVITES} people at once`,
      );
    onChange([...invites, { email: value, roles: [] }]);
    setEmail("");
    setEmailError(undefined);
    setOpenEmail(value);
  };

  const onKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key !== "Enter") return;
    event.preventDefault();
    add();
  };

  const update = (target: string, patch: Partial<InviteDraft>) =>
    onChange(
      invites.map((invite) =>
        invite.email === target ? { ...invite, ...patch } : invite,
      ),
    );

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-col gap-2">
        <label
          htmlFor="np-invite-email"
          className="text-[13px] font-medium text-kb-text-2"
        >
          Invite members{" "}
          <span className="font-normal text-muted-foreground">(optional)</span>
        </label>
        <div className="flex gap-2">
          <Input
            id="np-invite-email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            onKeyDown={onKeyDown}
            placeholder="name@email.com"
            autoComplete="off"
            aria-invalid={!!emailError}
          />
          <Button type="button" variant="outline" onClick={add}>
            Add
          </Button>
        </div>
        {(emailError || error) && (
          <p className="text-xs text-destructive">{emailError ?? error}</p>
        )}
        <p className="text-xs text-muted-foreground">
          You get an invite link for each person to share. They join the project
          once they accept.
        </p>
      </div>

      {invites.length > 0 && (
        <ul className="flex flex-col gap-2">
          {invites.map((invite) => (
            <li key={invite.email} className="flex flex-col gap-2">
              <div className="kb-panel flex items-center gap-2.5 rounded-xl border border-border p-2.5">
                <span
                  aria-hidden="true"
                  className="flex size-8 flex-none items-center justify-center rounded-full bg-kb-gray-tint text-xs font-semibold text-kb-gray-fg"
                >
                  {invite.email[0].toUpperCase()}
                </span>
                <div className="flex min-w-0 flex-1 flex-col gap-1.5">
                  <span className="truncate text-sm">{invite.email}</span>
                  <div className="flex flex-wrap items-center gap-1.5">
                    {invite.roles.map((role) => (
                      <RoleChip key={role} role={role} />
                    ))}
                    <AddRoleButton
                      expanded={openEmail === invite.email}
                      onClick={() =>
                        setOpenEmail(
                          openEmail === invite.email ? null : invite.email,
                        )
                      }
                    />
                  </div>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  aria-label={`Remove ${invite.email}`}
                  onClick={() =>
                    onChange(invites.filter((i) => i.email !== invite.email))
                  }
                >
                  <CloseCircle
                    size={18}
                    variant="Linear"
                    color="currentColor"
                    aria-hidden
                  />
                </Button>
              </div>
              {openEmail === invite.email && (
                <RolePicker
                  roles={invite.roles}
                  onChange={(roles) => update(invite.email, { roles })}
                  onDone={() => setOpenEmail(null)}
                />
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
