"use client";

import { useState, type FormEvent } from "react";
import { toast } from "sonner";

import { inviteMemberAction } from "@/actions/member-action";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { isValidEmail } from "@/validations/project";

import { InviteLinkRow } from "./invite-links";

// "Invite people" (admins only, spec §8). The link of each invite made in this session stays here to
// be copied, since the database keeps only its hash.
export default function MembersInviteForm({
  projectId,
  onInvited,
}: {
  projectId: string;
  onInvited: (email: string) => void;
}) {
  const [email, setEmail] = useState("");
  const [pending, setPending] = useState(false);
  const [links, setLinks] = useState<{ email: string; link: string }[]>([]);

  const address = email.trim().toLowerCase();

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (!isValidEmail(address) || pending) return;

    setPending(true);
    const result = await inviteMemberAction(projectId, address);
    setPending(false);

    if (result.status === "error") return void toast.error(result.message);
    setLinks((current) => [...current.filter((item) => item.email !== address), { email: address, link: result.link ?? "" }]);
    setEmail("");
    onInvited(address);
  };

  return (
    <form onSubmit={submit} className="flex flex-col gap-2">
      <label htmlFor="mm-invite" className="text-[13px] font-medium text-kb-text-2">
        Invite people
      </label>
      <div className="flex gap-2">
        <Input
          id="mm-invite"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="name@example.com"
          autoComplete="off"
          aria-describedby="mm-invite-hint"
        />
        <Button type="submit" disabled={!isValidEmail(address) || pending}>
          {pending ? "Inviting…" : "Invite"}
        </Button>
      </div>
      <p id="mm-invite-hint" className="text-xs text-muted-foreground">
        You get an invite link to share. Add their roles below while the invite is pending.
      </p>
      {links.length > 0 && (
        <ul className="mt-1 flex flex-col gap-2">
          {links.map((item) => (
            <InviteLinkRow key={item.email} {...item} />
          ))}
        </ul>
      )}
    </form>
  );
}
