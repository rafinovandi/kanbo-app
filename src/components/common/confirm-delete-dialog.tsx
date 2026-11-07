"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";

// "Are you sure?" step before something is deleted. `onConfirm` returns true when it worked; the
// dialog closes then, and stays open (so the user can retry or cancel) when it did not.
export default function ConfirmDeleteDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel = "Delete",
  onConfirm,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  confirmLabel?: string;
  onConfirm: () => Promise<boolean>;
}) {
  const [pending, setPending] = useState(false);

  const confirm = async () => {
    setPending(true);
    const done = await onConfirm();
    setPending(false);
    if (done) onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={(next) => !pending && onOpenChange(next)}>
      <DialogContent
        className="gap-5 p-6 sm:max-w-[420px]"
        onPointerDown={(event) => event.stopPropagation()}
      >
        <DialogHeader className="pr-10">
          <DialogTitle className="text-lg font-semibold">{title}</DialogTitle>
          <DialogDescription className="[overflow-wrap:anywhere]">{description}</DialogDescription>
        </DialogHeader>
        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <DialogClose asChild>
            <Button type="button" variant="outline" disabled={pending}>
              Cancel
            </Button>
          </DialogClose>
          <Button type="button" variant="destructive" onClick={confirm} disabled={pending}>
            {pending ? "Deleting…" : confirmLabel}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
