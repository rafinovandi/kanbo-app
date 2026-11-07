"use client";

import { useState } from "react";

import PrioritySlider from "@/components/common/priority-slider";
import { Badge } from "@/components/ui/badge";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { TASK_PRIORITY_CHIP } from "@/constants/my-tasks-constant";
import { cn } from "@/lib/utils";
import type { TaskPriority } from "@/types/task";

// The priority chip; clicking it opens a card with the priority slider (Add Task, and later the task modal).
// `name` adds a hidden input so the value is sent with a form.
export default function PriorityPicker({
  value,
  onValueChange,
  name,
  disabled,
}: {
  value: TaskPriority;
  onValueChange: (value: TaskPriority) => void;
  name?: string;
  disabled?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const chip = TASK_PRIORITY_CHIP[value];

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          disabled={disabled}
          aria-label={`Priority: ${chip.label}`}
          className="w-fit rounded-lg outline-none focus-visible:ring-3 focus-visible:ring-ring/50 disabled:opacity-50"
        >
          <Badge className={cn("h-6 cursor-pointer px-2.5 font-semibold", chip.className)}>{chip.label}</Badge>
        </button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-80 rounded-2xl p-4">
        <PrioritySlider value={value} onValueChange={onValueChange} onEnter={() => setOpen(false)} />
      </PopoverContent>
      {name && <input type="hidden" name={name} value={value} />}
    </Popover>
  );
}
