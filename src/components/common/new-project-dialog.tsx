"use client";

import { useQueryClient } from "@tanstack/react-query";
import { useActionState, useEffect, useState, type ReactNode } from "react";
import { toast } from "sonner";

import { createProjectAction } from "@/actions/project-action";
import InviteLinks from "@/components/common/invite-links";
import InviteMembersField from "@/components/common/invite-members-field";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { INITIAL_STATE_ACTION } from "@/constants/general-constant";
import { DASHBOARD_STATS_KEY } from "@/hooks/use-dashboard-stats";
import { PROJECTS_OVERVIEW_KEY } from "@/hooks/use-projects-overview";
import { PROJECT_TONE } from "@/constants/profile-constant";
import { PROJECT_COLORS, PROJECT_LIMITS, PROJECT_TILE } from "@/constants/project-constant";
import { cn } from "@/lib/utils";
import type { ProjectFormState } from "@/types/project";
import { validateProject, type InviteDraft, type ProjectFields } from "@/validations/project";

function Field({
  id,
  label,
  optional,
  error,
  children,
}: {
  id: string;
  label: string;
  optional?: boolean;
  error?: string;
  children: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-2">
      <label htmlFor={id} className="text-[13px] font-medium text-kb-text-2">
        {label}
        {optional && <span className="font-normal text-muted-foreground"> (optional)</span>}
      </label>
      {children}
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}

// Live preview (spec §7): the project's initial, name and description as the user types.
function ProjectPreview({ fields }: { fields: ProjectFields }) {
  const name = fields.name.trim();
  return (
    <div className="flex items-center gap-3 rounded-[14px] bg-kb-surface dark:bg-background p-3.5" aria-hidden="true">
      <span
        className={cn(
          "flex size-10 flex-none items-center justify-center rounded-[10px] text-base font-semibold",
          PROJECT_TILE[fields.color],
        )}
      >
        {name ? name[0].toUpperCase() : "?"}
      </span>
      <span className="flex min-w-0 flex-col gap-px">
        <span className={cn("truncate text-sm font-semibold", !name && "text-muted-foreground")}>
          {name || "Project name"}
        </span>
        <span className="truncate text-[13px] text-muted-foreground">
          {fields.description.trim() || "No description"}
        </span>
      </span>
    </div>
  );
}

function NewProjectForm({ setOpen }: { setOpen: (open: boolean) => void }) {
  const [fields, setFields] = useState<ProjectFields>({ name: "", description: "", color: "gray" });
  const queryClient = useQueryClient();
  const [invites, setInvites] = useState<InviteDraft[]>([]);
  const [state, formAction, pending] = useActionState<ProjectFormState, FormData>(
    createProjectAction,
    INITIAL_STATE_ACTION,
  );

  const { errors: liveErrors } = validateProject(fields);
  const serverErrors = state.errors ?? {};

  useEffect(() => {
    if (state.status === "success") {
      queryClient.invalidateQueries({ queryKey: DASHBOARD_STATS_KEY });
      queryClient.invalidateQueries({ queryKey: PROJECTS_OVERVIEW_KEY });
      toast.success("Project created");
      if (state.inviteLinks?.length) return;
      if (state.failedInvites?.length) {
        toast.warning("Some invites could not be created", { description: state.failedInvites.join(", ") });
      }
      setOpen(false);
    } else if (state.status === "error" && state.errors?._form?.[0]) {
      toast.error(state.errors._form[0]);
    }
  }, [state, setOpen, queryClient]);

  if (state.status === "success" && state.inviteLinks?.length) {
    return (
      <InviteLinks links={state.inviteLinks} failed={state.failedInvites ?? []} onDone={() => setOpen(false)} />
    );
  }

  return (
    <form action={formAction} className="flex flex-col gap-5">
      <DialogHeader>
        <DialogTitle className="text-lg font-semibold">New Project</DialogTitle>
        <DialogDescription>A project holds your board, tasks and team.</DialogDescription>
      </DialogHeader>

      <ProjectPreview fields={fields} />

      <Field id="np-name" label="Project name" error={serverErrors.name?.[0]}>
        <Input
          id="np-name"
          name="name"
          value={fields.name}
          onChange={(e) => setFields((f) => ({ ...f, name: e.target.value }))}
          maxLength={PROJECT_LIMITS.name}
          placeholder="e.g. Website Redesign"
          autoComplete="off"
          autoFocus
          required
          aria-invalid={!!serverErrors.name}
        />
      </Field>

      <Field id="np-description" label="Description" optional error={serverErrors.description?.[0]}>
        <Textarea
          id="np-description"
          name="description"
          value={fields.description}
          onChange={(e) => setFields((f) => ({ ...f, description: e.target.value }))}
          maxLength={PROJECT_LIMITS.description}
          placeholder="What is this project about?"
          rows={3}
          aria-invalid={!!serverErrors.description}
        />
      </Field>

      <fieldset className="flex flex-col gap-2">
        <legend className="mb-2 text-[13px] font-medium text-kb-text-2">Color</legend>
        <div className="flex flex-wrap gap-3">
          {PROJECT_COLORS.map((color) => (
            <label key={color.value} className="cursor-pointer">
              <input
                type="radio"
                name="color"
                value={color.value}
                checked={fields.color === color.value}
                onChange={() => setFields((f) => ({ ...f, color: color.value }))}
                className="peer sr-only"
              />
              <span
                className={cn(
                  "block size-8 rounded-full ring-offset-2 ring-offset-popover transition-shadow peer-checked:ring-2 peer-checked:ring-foreground peer-focus-visible:ring-2 peer-focus-visible:ring-ring",
                  PROJECT_TONE[color.value].dot,
                )}
              />
              <span className="sr-only">{color.label}</span>
            </label>
          ))}
        </div>
        {serverErrors.color?.[0] && <p className="text-xs text-destructive">{serverErrors.color[0]}</p>}
      </fieldset>

      <InviteMembersField invites={invites} onChange={setInvites} error={serverErrors.invites?.[0]} />
      <input type="hidden" name="invites" value={JSON.stringify(invites)} />

      <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
        <DialogClose asChild>
          <Button type="button" variant="outline" disabled={pending}>
            Cancel
          </Button>
        </DialogClose>
        <Button type="submit" disabled={pending || !!liveErrors.name}>
          {pending ? "Creating…" : "Create Project"}
        </Button>
      </div>
    </form>
  );
}

// Wraps any element (usually a "New Project" button) and opens the New Project dialog from it.
// The form lives inside the dialog content, so it starts empty every time the dialog opens.
export default function NewProjectDialog({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="max-h-[calc(100svh-2rem)] gap-0 overflow-y-auto p-6 sm:max-w-[520px]">
        <NewProjectForm setOpen={setOpen} />
      </DialogContent>
    </Dialog>
  );
}
