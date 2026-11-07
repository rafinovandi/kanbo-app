"use client";

import { TextBold, TextItalic } from "iconsax-react";

import StrikethroughIcon from "@/components/common/strikethrough-icon";
import { Button } from "@/components/ui/button";
import type { InlineMarker } from "@/lib/task-description";

// The small bar above selected description text: bold, italic and strikethrough. It never takes focus away from the
// textarea, so the selection stays.
export default function DescriptionFormatToolbar({
  top,
  left,
  active,
  onFormat,
}: {
  top: number;
  left: number;
  active: Record<InlineMarker, boolean>;
  onFormat: (marker: InlineMarker) => void;
}) {
  const item = (marker: InlineMarker, label: string, content: React.ReactNode) => (
    <Button
      type="button"
      variant={active[marker] ? "secondary" : "ghost"}
      size="icon-sm"
      aria-label={label}
      aria-pressed={active[marker]}
      onMouseDown={(event) => event.preventDefault()}
      onClick={() => onFormat(marker)}
    >
      {content}
    </Button>
  );

  return (
    <div
      role="toolbar"
      aria-label="Text formatting"
      style={{ top, left }}
      className="absolute z-10 flex -translate-x-1/2 gap-0.5 rounded-lg border border-border bg-popover p-1 shadow-md"
    >
      {item("**", "Bold", <TextBold size={16} variant="Linear" color="currentColor" aria-hidden />)}
      {item("*", "Italic", <TextItalic size={16} variant="Linear" color="currentColor" aria-hidden />)}
      {item("~~", "Strikethrough", <StrikethroughIcon size={16} />)}
    </div>
  );
}
