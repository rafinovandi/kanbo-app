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
