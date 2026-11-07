import Link from "next/link";
import type { ReactNode } from "react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

// The Save/Cancel card of Edit Profile and the task dialog: a status message on the left, Cancel (a button or a link)
// and the main button on the right. The caller decides where it sits (`className`, or a wrapper around it).
// `visible={false}` hides it without moving anything.
export default function ActionBar({
  message,
  visible = true,
  onCancel,
  cancelHref,
  cancelDisabled,
  submitLabel,
  submitType = "button",
  onSubmit,
  submitDisabled,
  className,
}: {
  message?: ReactNode;
  visible?: boolean;
  onCancel?: () => void;
  cancelHref?: string;
  cancelDisabled?: boolean;
  submitLabel: string;
  submitType?: "button" | "submit";
  onSubmit?: () => void;
  submitDisabled?: boolean;
  className?: string;
}) {
  return (
    <div
      role="region"
      aria-label="Save changes"
      aria-hidden={!visible}
      className={cn(
        "pointer-events-auto flex w-full flex-wrap items-center gap-2 rounded-2xl border border-border bg-card px-4 py-3 shadow-lg transition-opacity",
        !visible && "pointer-events-none opacity-0",
        className,
      )}
    >
      <span className="mr-auto text-sm text-muted-foreground" aria-live="polite">
        {message}
      </span>
      {cancelHref ? (
        <Button asChild variant="outline">
          <Link href={cancelHref}>Cancel</Link>
        </Button>
      ) : (
        <Button type="button" variant="outline" disabled={cancelDisabled} onClick={onCancel}>
          Cancel
        </Button>
      )}
      <Button type={submitType} disabled={submitDisabled} onClick={onSubmit}>
        {submitLabel}
      </Button>
    </div>
  );
}
