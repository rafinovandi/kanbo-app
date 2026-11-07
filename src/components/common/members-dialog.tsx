"use client";

import { useState, type ReactNode } from "react";

import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import type { ProjectSummary } from "@/types/project";

import MembersDialogContent from "./members-dialog-content";

// Wraps any element (the members pill of a project) and opens the Members dialog from it.
export default function MembersDialog({ project, children }: { project: ProjectSummary; children: ReactNode }) {
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent closeClassName="top-3" className="max-h-[calc(100svh-2rem)] gap-0 overflow-y-auto p-0 sm:max-w-[600px]">
        <MembersDialogContent project={project} onLeft={() => setOpen(false)} />
      </DialogContent>
    </Dialog>
  );
}
