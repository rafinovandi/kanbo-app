"use server";

import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

export type AccountActionResult = { status: "success" } | { status: "error"; message: string };

const fail = (message: string): AccountActionResult => ({ status: "error", message });

// Deletes the signed-in user. Everything that belongs to them goes through the database cascades
// (profile, memberships, pins, assignees, bots, links); tasks they created elsewhere stay.
// Refused while they still own a project, because that would silently delete it for its members.
export async function deleteAccountAction(confirmUsername: string): Promise<AccountActionResult> {
  const supabase = await createClient();
  const { data: claimsData } = await supabase.auth.getClaims();
  const userId = claimsData?.claims?.sub;
  if (!userId) return fail("Your session expired. Sign in again.");

  const { data: profile } = await supabase.from("profiles").select("username").eq("id", userId).single();
  if (!profile || profile.username !== confirmUsername.trim()) return fail("Type your username to confirm.");

  const { data: owned, error: ownedError } = await supabase.from("projects").select("name").eq("owner_id", userId);
  if (ownedError) return fail("Something went wrong. Try again.");
  if (owned.length > 0) {
    return fail(`Delete the projects you own first: ${owned.map((project) => project.name).join(", ")}.`);
  }

  const admin = createAdminClient();

  const { error } = await admin.auth.admin.deleteUser(userId);
  if (error) return fail("Could not delete your account. Try again.");

  await removeAvatarFiles(admin, userId);
  await supabase.auth.signOut();
  return { status: "success" };
}

async function removeAvatarFiles(admin: ReturnType<typeof createAdminClient>, userId: string) {
  for (let page = 0; page < 20; page++) {
    const { data: files, error } = await admin.storage.from("avatars").list(userId, { limit: 100 });
    if (error || !files || files.length === 0) break;
    const { error: removeError } = await admin.storage.from("avatars").remove(files.map((file) => `${userId}/${file.name}`));
    if (removeError) {
      console.error("Could not remove the avatar files:", removeError.message);
      break;
    }
  }
}
