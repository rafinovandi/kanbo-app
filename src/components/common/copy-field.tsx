"use client";

import { Copy, TickCircle } from "iconsax-react";
import { useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";

// A line of text (a message or a command) with its own Copy button.
export default function CopyField({
  label,
  value,
}: {
  label?: string;
  value: string;
}) {
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Could not copy the text");
    }
  };

  return (
    <div className="flex flex-col gap-2">
      {label && (
        <span className="text-[13px] font-medium text-kb-text-2">{label}</span>
      )}
      <div className="kb-panel flex items-stretch overflow-hidden rounded-[10px] border border-border bg-background">
        <span className="min-w-0 flex-1 px-3.5 py-3 font-mono text-[13px] leading-normal font-medium [overflow-wrap:anywhere]">
          {value}
        </span>
        <Button
          type="button"
          variant="ghost"
          onClick={copy}
          aria-label={copied ? "Copied" : label ? `Copy: ${label}` : "Copy"}
          className="h-auto flex-none rounded-none border-l border-border px-3.5"
        >
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
          {copied ? "Copied" : "Copy"}
        </Button>
      </div>
    </div>
  );
}
