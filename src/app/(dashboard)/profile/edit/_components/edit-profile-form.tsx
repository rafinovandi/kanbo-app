"use client";

import { useRouter } from "next/navigation";
import { useActionState, useEffect, useState } from "react";
import { toast } from "sonner";

import ActionBar from "@/components/common/action-bar";
import { INITIAL_STATE_ACTION } from "@/constants/general-constant";
import type { AuthProfile, ProfileFormState } from "@/types/auth";
import {
  validateProfile,
  type ProfileFields,
  type ProfileTextKey,
} from "@/validations/profile";

import { updateProfileAction } from "../actions";
import EditProfileAccount from "./edit-profile-account";
import EditProfileDelete from "./edit-profile-delete";
import EditProfileInfo from "./edit-profile-info";
import EditProfilePhoto from "./edit-profile-photo";
import EditProfilePrivacy from "./edit-profile-privacy";

// The Edit Profile form: holds the fields and the save state, and puts the cards together (each card is its own file).
export default function EditProfileForm({
  me,
  initial,
  ownedProjects,
}: {
  me: AuthProfile;
  initial: ProfileFields;
  ownedProjects: string[];
}) {
  const router = useRouter();
  const [fields, setFields] = useState<ProfileFields>(initial);
  const [saved, setSaved] = useState<ProfileFields>(initial);
  const [preview, setPreview] = useState<string | null>(null);
  const [state, formAction, pending] = useActionState<
    ProfileFormState,
    FormData
  >(async (prev, formData) => {
    const result = await updateProfileAction(prev, formData);
    if (result.status === "success") {
      toast.success("Profile updated");
      const normalized = validateProfile(fields).values;
      setSaved(normalized);
      setFields(normalized);
      setPreview(null);
      router.push(`/u/${normalized.username}`);
    } else if (result.errors?._form?.[0]) {
      toast.error(result.errors._form[0]);
    }
    return result;
  }, INITIAL_STATE_ACTION);

  const set =
    (key: ProfileTextKey) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      setFields((f) => ({ ...f, [key]: e.target.value }));

  const { errors: liveErrors } = validateProfile(fields);
  const dirty =
    (Object.keys(saved) as (keyof ProfileFields)[]).some(
      (k) => fields[k] !== saved[k],
    ) || !!preview;
  const valid = Object.keys(liveErrors).length === 0;
  const serverErrors = state.errors ?? {};

  useEffect(
    () => () => {
      if (preview) URL.revokeObjectURL(preview);
    },
    [preview],
  );

  const status = !dirty
    ? "No changes yet"
    : valid
      ? "Unsaved changes"
      : (Object.values(liveErrors)[0]?.[0] ?? "Check the highlighted fields");

  return (
    <form
      action={formAction}
      className="mx-auto flex w-full max-w-180 flex-col gap-5 p-4 sm:p-7"
    >
      <div className="flex flex-col gap-1.5">
        <h1 className="text-[28px] leading-tight font-semibold tracking-[-0.02em]">
          Edit Profile
        </h1>
        <p className="text-sm text-muted-foreground">
          This is how you appear to people in your projects.
        </p>
      </div>

      <EditProfilePhoto
        me={me}
        name={fields.name}
        preview={preview}
        onPreviewChange={setPreview}
        serverError={serverErrors.avatar_url?.[0]}
      />
      <EditProfileInfo
        fields={fields}
        set={set}
        liveErrors={liveErrors}
        serverErrors={serverErrors}
      />
      <EditProfilePrivacy
        fields={fields}
        onChange={(key, on) => setFields((f) => ({ ...f, [key]: on }))}
      />
      <EditProfileAccount email={me.email} />
      <EditProfileDelete
        ownedProjects={ownedProjects}
        username={saved.username}
      />

      <ActionBar
        className="sticky bottom-4 z-10"
        message={status}
        cancelHref="/profile"
        submitLabel={pending ? "Saving…" : "Save Changes"}
        submitType="submit"
        submitDisabled={!dirty || !valid || pending}
      />
    </form>
  );
}
