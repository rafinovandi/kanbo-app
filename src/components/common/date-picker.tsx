"use client";

import { useState } from "react";

import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn, formatDisplayDate, fromDateValue, toDateValue } from "@/lib/utils";

// A date shown as plain text that opens the shadcn calendar in a popover when clicked. `value` is "YYYY-MM-DD" or "" for none;
// days before `minDate` cannot be picked.
export default function DatePicker({
  value,
  onChange,
  minDate,
  placeholder = "Pick a date",
  invalid,
  id,
}: {
  value: string;
  onChange: (value: string) => void;
  minDate?: Date;
  placeholder?: string;
  invalid?: boolean;
  id?: string;
}) {
  const [open, setOpen] = useState(false);
  const selected = value ? fromDateValue(value) : undefined;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          id={id}
          type="button"
          data-invalid={invalid || undefined}
          className={cn(
            "w-fit rounded-md text-left text-[13px] outline-none hover:underline focus-visible:ring-3 focus-visible:ring-ring/50 data-invalid:text-destructive",
            !value && "text-muted-foreground",
          )}
        >
          {selected ? formatDisplayDate(selected) : placeholder}
        </button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-auto p-0">
        <Calendar
          mode="single"
          selected={selected}
          onSelect={(date) => {
            onChange(date ? toDateValue(date) : "");
            setOpen(false);
          }}
          defaultMonth={selected ?? minDate}
          disabled={minDate ? { before: minDate } : undefined}
          autoFocus
        />
      </PopoverContent>
    </Popover>
  );
}
