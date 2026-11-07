"use client";

import { useState, type ReactNode } from "react";

import { Button } from "@/components/ui/button";
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";

// "Are you sure?" step before something is deleted. `onConfirm` returns true when it worked; the
// dialog closes then, and stays open (so the user can retry or cancel) when it did not. With
// `confirmText` the user must type it before the button works; `children` lists what is lost.
export default function ConfirmDeleteDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel = "Delete",
  confirmText,
  children,
  onConfirm,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  confirmLabel?: string;
  confirmText?: string;
  children?: ReactNode;
  onConfirm: () => Promise<boolean>;
}) {
  const [pending, setPending] = useState(false);
  const [typed, setTyped] = useState("");
  const matches = confirmText === undefined || typed.trim() === confirmText;

  const confirm = async () => {
    setPending(true);
    const done = await onConfirm();
    setPending(false);
    if (done) {
      onOpenChange(false);
      setTyped("");
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (pending) return;
        if (!next) setTyped("");
        onOpenChange(next);
      }}
    >
      <DialogContent
        className="gap-5 p-6 sm:max-w-[420px]"
        onPointerDown={(event) => event.stopPropagation()}
      >
        <DialogHeader className="pr-10">
          <DialogTitle className="text-lg font-semibold">{title}</DialogTitle>
          <DialogDescription className="[overflow-wrap:anywhere]">{description}</DialogDescription>
        </DialogHeader>
        {children}
        {confirmText !== undefined && (
          <div className="flex flex-col gap-2">
            <label htmlFor="confirm-delete-text" className="text-sm font-medium">
              Type <span className="font-semibold">{confirmText}</span> to confirm
            </label>
            <Input
              id="confirm-delete-text"
              value={typed}
              onChange={(event) => setTyped(event.target.value)}
              placeholder={confirmText}
              autoComplete="off"
              disabled={pending}
            />
          </div>
        )}
        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <DialogClose asChild>
            <Button type="button" variant="outline" disabled={pending}>
              Cancel
            </Button>
          </DialogClose>
          <Button type="button" variant="destructive" onClick={confirm} disabled={pending || !matches}>
            {pending ? "Deleting…" : confirmLabel}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
