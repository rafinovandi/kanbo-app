"use client";

import { CloseCircle } from "iconsax-react";
import {
  useEffect,
  useEffectEvent,
  useId,
  useRef,
  useState,
  type PointerEvent,
  type ReactNode,
} from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

// "Are you sure?" step before something is deleted (or another action that cannot be undone, like signing out). `onConfirm` returns true when it worked; the
// dialog closes then, and stays open (so the user can retry or cancel) when it did not. With
// `confirmText` the user must type it before the button works; `children` lists what is lost.
// Built on a native <dialog> (modal): the browser handles focus, Esc and the inert page.
export default function ConfirmDeleteDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel = "Delete",
  pendingLabel = "Deleting…",
  confirmText,
  children,
  onConfirm,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  confirmLabel?: string;
  pendingLabel?: string;
  confirmText?: string;
  children?: ReactNode;
  onConfirm: () => Promise<boolean>;
}) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const textId = useId();
  const titleId = useId();
  const descriptionId = useId();
  const [pending, setPending] = useState(false);
  const [typed, setTyped] = useState("");
  const [rendered, setRendered] = useState(open);
  const matches = confirmText === undefined || typed.trim() === confirmText;

  if (open && !rendered) setRendered(true);

  const handleOpenChange = (next: boolean) => {
    if (pending) return;
    if (!next) setTyped("");
    onOpenChange(next);
  };

  const closeOnEscape = useEffectEvent((event: KeyboardEvent) => {
    if (event.key !== "Escape" || event.isComposing) return;
    event.preventDefault();
    event.stopPropagation();
    handleOpenChange(false);
  });

  // Focus goes back to whatever opened the dialog. A menu item is already gone by then, so its menu's trigger is used.
  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog || !open) return;
    const active = document.activeElement;
    const menuId = active
      ?.closest('[role="menu"]')
      ?.getAttribute("aria-labelledby");
    const opener = menuId ? document.getElementById(menuId) : active;
    if (!dialog.open) dialog.showModal();
    // Radix (a parent dialog) cancels Esc before the native dialog sees it, so Esc is caught first, on window.
    const onKeyDown = (event: KeyboardEvent) => closeOnEscape(event);
    window.addEventListener("keydown", onKeyDown, true);
    return () => {
      window.removeEventListener("keydown", onKeyDown, true);
      if (dialog.open) dialog.close();
      requestAnimationFrame(() => {
        if (opener instanceof HTMLElement && opener.isConnected) opener.focus();
      });
    };
  }, [open]);

  const confirm = async () => {
    setPending(true);
    const done = await onConfirm();
    setPending(false);
    if (done) {
      onOpenChange(false);
      setTyped("");
    }
  };

  // Safari has no closedby="any", so a press and release outside the box closes the dialog there.
  const pressedOutside = useRef(false);
  const isOutside = (event: PointerEvent<HTMLDialogElement>) => {
    const box = event.currentTarget.getBoundingClientRect();
    return (
      event.clientX < box.left ||
      event.clientX > box.right ||
      event.clientY < box.top ||
      event.clientY > box.bottom
    );
  };
  const supportsClosedBy =
    typeof HTMLDialogElement !== "undefined" &&
    "closedBy" in HTMLDialogElement.prototype;

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby={titleId}
      aria-describedby={descriptionId}
      {...({ closedby: "any" } as object)}
      onCancel={(event) => {
        if (pending) event.preventDefault();
      }}
      onClose={() => {
        if (open) handleOpenChange(false);
      }}
      onTransitionEnd={(event) => {
        if (event.target === event.currentTarget && !open) setRendered(false);
      }}
      onPointerDown={(event) => {
        event.stopPropagation();
        if (!supportsClosedBy) pressedOutside.current = isOutside(event);
      }}
      onPointerUp={(event) => {
        if (!supportsClosedBy && pressedOutside.current && isOutside(event)) {
          handleOpenChange(false);
        }
        pressedOutside.current = false;
      }}
      className="pointer-events-auto relative m-auto w-full max-w-[calc(100%-2rem)] scale-100 gap-5 rounded-xl bg-popover p-6 text-sm text-popover-foreground ring-1 ring-foreground/10 outline-none transition-[opacity,scale,display,overlay] transition-discrete duration-100 open:grid dark:bg-kb-surface sm:max-w-[420px] not-open:opacity-0 open:opacity-100 starting:open:opacity-0 motion-safe:not-open:scale-95 motion-safe:starting:open:scale-95 backdrop:bg-black/0 backdrop:backdrop-blur-xs backdrop:transition-[background-color,display,overlay] backdrop:transition-discrete backdrop:duration-100 open:backdrop:bg-black/10 starting:open:backdrop:bg-black/0"
    >
      {rendered && (
        <>
          <div className="flex flex-col gap-3 pr-10">
            <h2
              id={titleId}
              className="font-heading text-lg leading-none font-semibold"
            >
              {title}
            </h2>
            <p
              id={descriptionId}
              className="text-sm text-muted-foreground [overflow-wrap:anywhere]"
            >
              {description}
            </p>
          </div>
          {children}
          {confirmText !== undefined && (
            <div className="flex flex-col gap-2">
              <label htmlFor={textId} className="text-sm font-medium">
                Type <span className="font-semibold">{confirmText}</span> to
                confirm
              </label>
              <Input
                id={textId}
                value={typed}
                onChange={(event) => setTyped(event.target.value)}
                placeholder={confirmText}
                autoComplete="off"
                disabled={pending}
              />
            </div>
          )}
          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <Button
              type="button"
              variant="outline"
              disabled={pending}
              onClick={() => handleOpenChange(false)}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={confirm}
              disabled={pending || !matches}
            >
              {pending ? pendingLabel : confirmLabel}
            </Button>
          </div>
          <Button
            type="button"
            variant="outline"
            size="icon"
            className="absolute top-[18px] right-4 size-10 rounded-[10px]"
            onClick={() => handleOpenChange(false)}
          >
            <CloseCircle
              size={20}
              variant="Linear"
              color="currentColor"
              aria-hidden
            />
            <span className="sr-only">Close</span>
          </Button>
        </>
      )}
    </dialog>
  );
}
