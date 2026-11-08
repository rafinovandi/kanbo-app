"use server";

import { revalidatePath } from "next/cache";

import { AVATAR_MAX_BYTES, AVATAR_TYPES } from "@/constants/profile-constant";
import { createClient } from "@/lib/supabase/server";
import type { ProfileFormState } from "@/types/auth";
import { detectAvatarType, validateProfile } from "@/validations/profile";

// Part of a public avatar URL that comes before the object path inside the bucket.
const AVATAR_PUBLIC_PATH = "/storage/v1/object/public/avatars/";

const text = (formData: FormData, key: string) => {
  const value = formData.get(key);
  return typeof value === "string" ? value : "";
};

// Saves the text fields and, when a file was picked, uploads it to the avatars bucket
// (avatars/<user_id>/<random>.<ext>) and points profiles.avatar_url at it.
export async function updateProfileAction(
  _prev: ProfileFormState,
  formData: FormData,
): Promise<ProfileFormState> {
  const { values, errors } = validateProfile({
    name: text(formData, "name"),
    headline: text(formData, "headline"),
    bio: text(formData, "bio"),
    location: text(formData, "location"),
    website: text(formData, "website"),
    username: text(formData, "username"),
    telegram_username: text(formData, "telegram_username"),
    show_stats: formData.get("show_stats") === "on",
    show_activity: formData.get("show_activity") === "on",
    show_pinned: formData.get("show_pinned") === "on",
    show_recent_tasks: formData.get("show_recent_tasks") === "on",
  });

  const avatar = formData.get("avatar");
  const file = avatar instanceof File && avatar.size > 0 ? avatar : null;
  // Server-side checks (the browser checks are only a convenience): size first, then the real
  // type from the file's bytes, not the client-reported file.type.
  let avatarType: ReturnType<typeof detectAvatarType> = null;
  if (file) {
    if (file.size > AVATAR_MAX_BYTES) {
      errors.avatar_url = ["Image must be 2 MB or smaller"];
    } else {
      avatarType = detectAvatarType(new Uint8Array(await file.slice(0, 8).arrayBuffer()));
      if (!avatarType || !AVATAR_TYPES.includes(avatarType)) errors.avatar_url = ["Use a PNG or JPG image"];
    }
  }

  if (Object.keys(errors).length > 0) return { status: "error", errors };

  const supabase = await createClient();
  const { data: claimsData } = await supabase.auth.getClaims();
  const userId = claimsData?.claims?.sub;
  if (!userId) return { status: "error", errors: { _form: ["Your session expired. Sign in again."] } };

  // The previous avatar, so its file can be removed once the new one is saved.
  let previousAvatarUrl: string | null = null;
  if (file && avatarType) {
    const { data: current } = await supabase.from("profiles").select("avatar_url").eq("id", userId).single();
    previousAvatarUrl = current?.avatar_url ?? null;
  }

  let avatarUrl: string | undefined;
  let avatarPath: string | undefined;
  if (file && avatarType) {
    const path = `${userId}/${crypto.randomUUID()}.${avatarType === "image/png" ? "png" : "jpg"}`;
    const { error } = await supabase.storage.from("avatars").upload(path, file, { contentType: avatarType });
    if (error) return { status: "error", errors: { avatar_url: ["Could not upload the photo. Try again."] } };
    avatarPath = path;
    avatarUrl = supabase.storage.from("avatars").getPublicUrl(path).data.publicUrl;
  }

  const { error } = await supabase
    .from("profiles")
    .update({
      name: values.name,
      headline: values.headline || null,
      bio: values.bio || null,
      location: values.location || null,
      website: values.website || null,
      username: values.username,
      telegram_username: values.telegram_username || null,
      show_stats: values.show_stats,
      show_activity: values.show_activity,
      show_pinned: values.show_pinned,
      show_recent_tasks: values.show_recent_tasks,
      ...(avatarUrl ? { avatar_url: avatarUrl } : {}),
    })
    .eq("id", userId);

  if (error) {
    if (avatarPath) await supabase.storage.from("avatars").remove([avatarPath]);
    if (error.code === "23505") return { status: "error", errors: { username: ["That username is taken"] } };
    return { status: "error", errors: { _form: ["Could not save your profile. Try again."] } };
  }

  // Best effort: drop the old file, only when it is one of this user's own uploads
  // (a Google profile picture or a foreign URL is left alone). A failure must not fail the save.
  const oldPath = previousAvatarUrl?.split(AVATAR_PUBLIC_PATH)[1];
  if (avatarUrl && oldPath && oldPath.startsWith(`${userId}/`)) {
    const { error: removeError } = await supabase.storage.from("avatars").remove([oldPath]);
    if (removeError) console.error("Could not remove the old avatar:", removeError.message);
  }

  revalidatePath("/", "layout");
  return { status: "success" };
}
