"use client";

import { Copy, TickCircle } from "iconsax-react";
import { useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { INVITE_TTL_DAYS } from "@/constants/project-constant";

// One invite: the email and a button that copies its accept link.
export function InviteLinkRow({
  email,
  link,
}: {
  email: string;
  link: string;
}) {
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(link);
      setCopied(true);
      toast.success("Link copied");
    } catch {
      toast.error("Could not copy the link");
    }
  };

  return (
    <li className="kb-panel flex items-center gap-3 rounded-xl border border-border p-2.5">
      <span className="min-w-0 flex-1 truncate text-sm">{email}</span>
      <Button type="button" variant="outline" size="sm" onClick={copy}>
        {copied ? (
          <TickCircle
            size={16}
            variant="Linear"
            color="currentColor"
            aria-hidden
          />
        ) : (
          <Copy size={16} variant="Linear" color="currentColor" aria-hidden />
        )}
        {copied ? "Copied" : "Copy Link"}
      </Button>
    </li>
  );
}

// Shown once after a project is created with invites: the links only exist now (the database keeps
// just their hash), so the creator copies each one and sends it to its person.
export default function InviteLinks({
  links,
  failed,
  onDone,
}: {
  links: { email: string; link: string }[];
  failed: string[];
  onDone: () => void;
}) {
  return (
    <div className="flex flex-col gap-5">
      <DialogHeader>
        <DialogTitle className="text-lg font-semibold">
          Share your invite links
        </DialogTitle>
        <DialogDescription>
          Send each link to the person it is for. A link works once, expires in{" "}
          {INVITE_TTL_DAYS} days, and only opens for the invited Google account.
        </DialogDescription>
      </DialogHeader>

      <ul className="flex flex-col gap-2">
        {links.map((item) => (
          <InviteLinkRow key={item.email} {...item} />
        ))}
      </ul>

      {failed.length > 0 && (
        <p className="text-xs text-destructive">
          Could not invite: {failed.join(", ")}
        </p>
      )}

      <div className="flex sm:justify-end">
        <Button type="button" onClick={onDone} className="w-full sm:w-auto">
          Done
        </Button>
      </div>
    </div>
  );
}
