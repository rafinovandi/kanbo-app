"use server";

import { revalidatePath } from "next/cache";

import { inviteMember } from "@/lib/invite-member";
import { createClient } from "@/lib/supabase/server";
import type { ProjectFormState } from "@/types/project";
import { parseInvites, validateProject } from "@/validations/project";

const text = (formData: FormData, key: string) => {
  const value = formData.get(key);
  return typeof value === "string" ? value : "";
};

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// The database does most of the work: owner_id defaults to auth.uid(), the on_project_created
// trigger makes the creator an active admin and seeds the four columns, and RLS only lets people
// create projects they own. Invites are best effort: the project exists even if one fails. The
// links are returned once (only their hash is stored), so the creator can share them.
export async function createProjectAction(
  _prev: ProjectFormState,
  formData: FormData,
): Promise<ProjectFormState> {
  const { values, errors } = validateProject({
    name: text(formData, "name"),
    description: text(formData, "description"),
    color: text(formData, "color"),
  });
  const { invites, error: invitesError } = parseInvites(text(formData, "invites"));
  if (invitesError) errors.invites = [invitesError];
  if (Object.keys(errors).length > 0) return { status: "error", errors };

  const supabase = await createClient();
  const { data: claimsData } = await supabase.auth.getClaims();
  const userId = claimsData?.claims?.sub;
  if (!userId) return { status: "error", errors: { _form: ["Your session expired. Sign in again."] } };

  const { data: project, error } = await supabase
    .from("projects")
    .insert({ name: values.name, description: values.description, color: values.color })
    .select("id")
    .single();
  if (error || !project) {
    return { status: "error", errors: { _form: ["Could not create the project. Try again."] } };
  }

  const inviteLinks: { email: string; link: string }[] = [];
  const failedInvites: string[] = [];
  const links = await Promise.all(invites.map((invite) => inviteMember(supabase, invite, project.id)));
  links.forEach((link, index) => {
    if (link) inviteLinks.push({ email: invites[index].email, link });
    else failedInvites.push(invites[index].email);
  });

  revalidatePath("/", "layout");
  return {
    status: "success",
    projectId: project.id,
    inviteLinks,
    failedInvites,
  };
}

// Only the name, description and color are editable (column grants), and RLS limits it to admins,
// so no updated row means the caller isn't one.
export async function updateProjectAction(
  _prev: ProjectFormState,
  formData: FormData,
): Promise<ProjectFormState> {
  const projectId = text(formData, "id");
  const { values, errors } = validateProject({
    name: text(formData, "name"),
    description: text(formData, "description"),
    color: text(formData, "color"),
  });
  if (Object.keys(errors).length > 0) return { status: "error", errors };
  if (!UUID.test(projectId)) return { status: "error", errors: { _form: ["Something went wrong. Try again."] } };

  const supabase = await createClient();
  const { data: claimsData } = await supabase.auth.getClaims();
  if (!claimsData?.claims?.sub) return { status: "error", errors: { _form: ["Your session expired. Sign in again."] } };

  const { data, error } = await supabase.from("projects").update(values).eq("id", projectId).select("id");
  if (error) return { status: "error", errors: { _form: ["Could not update the project. Try again."] } };
  if (data.length === 0) return { status: "error", errors: { _form: ["You don't have permission to do that."] } };

  revalidatePath("/", "layout");
  return { status: "success", projectId };
}

export type DeleteProjectResult = { status: "success" } | { status: "error"; message: string };

// Deletes the project and everything in it (cascade). RLS only lets admins do it, so no deleted
// row means the caller isn't one.
export async function deleteProjectAction(projectId: string): Promise<DeleteProjectResult> {
  if (!UUID.test(projectId)) return { status: "error", message: "Something went wrong. Try again." };

  const supabase = await createClient();
  const { data: claimsData } = await supabase.auth.getClaims();
  if (!claimsData?.claims?.sub) return { status: "error", message: "Your session expired. Sign in again." };

  const { data, error } = await supabase.from("projects").delete().eq("id", projectId).select("id");
  if (error) return { status: "error", message: "Could not delete the project. Try again." };
  if (data.length === 0) return { status: "error", message: "You don't have permission to do that." };

  revalidatePath("/", "layout");
  return { status: "success" };
}
