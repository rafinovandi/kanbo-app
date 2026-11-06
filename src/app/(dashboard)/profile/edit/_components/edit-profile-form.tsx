"use client";

import { DocumentUpload } from "iconsax-react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useActionState, useEffect, useRef, useState } from "react";
import { toast } from "sonner";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { INITIAL_STATE_ACTION } from "@/constants/general-constant";
import { AVATAR_MAX_BYTES, AVATAR_TYPES, PROFILE_LIMITS } from "@/constants/profile-constant";
import { getInitials } from "@/lib/utils";
import type { AuthProfile, ProfileFormState } from "@/types/auth";
import { validateProfile, type ProfileFields } from "@/validations/profile";

import { updateProfileAction } from "../actions";

function Field({
  id,
  label,
  error,
  children,
}: {
  id: string;
  label: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-2">
      <label htmlFor={id} className="text-[13px] font-medium text-kb-text-2">
        {label}
      </label>
      {children}
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}

export default function EditProfileForm({
  me,
  initial,
}: {
  me: AuthProfile;
  initial: ProfileFields;
}) {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);
  const [fields, setFields] = useState<ProfileFields>(initial);
  const [preview, setPreview] = useState<string | null>(null);
  const [photoError, setPhotoError] = useState<string>();
  const [state, formAction, pending] = useActionState<ProfileFormState, FormData>(
    updateProfileAction,
    INITIAL_STATE_ACTION,
  );

  const set = (key: keyof ProfileFields) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setFields((f) => ({ ...f, [key]: e.target.value }));

  const { errors: liveErrors } = validateProfile(fields);
  const dirty = (Object.keys(initial) as (keyof ProfileFields)[]).some((k) => fields[k] !== initial[k]) || !!preview;
  const valid = !liveErrors.name;
  const serverErrors = state.errors ?? {};

  useEffect(() => {
    if (state.status === "success") {
      toast.success("Profile updated");
      router.push("/profile");
    } else if (state.status === "error" && state.errors?._form?.[0]) {
      toast.error(state.errors._form[0]);
    }
  }, [state, router]);

  useEffect(() => () => { if (preview) URL.revokeObjectURL(preview); }, [preview]);

  function onPickPhoto(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!AVATAR_TYPES.includes(file.type)) setPhotoError("Use a PNG or JPG image");
    else if (file.size > AVATAR_MAX_BYTES) setPhotoError("Image must be 2 MB or smaller");
    else {
      setPhotoError(undefined);
      setPreview(URL.createObjectURL(file));
      return;
    }
    e.target.value = "";
    setPreview(null);
  }

  const status = !dirty ? "No changes yet" : valid ? "Unsaved changes" : "Full name is required";

  return (
    <form action={formAction} className="mx-auto flex w-full max-w-180 flex-col gap-5 p-4 sm:p-7">
      <div className="flex flex-col gap-1.5">
        <h1 className="text-[28px] leading-tight font-semibold tracking-[-0.02em]">Edit Profile</h1>
        <p className="text-sm text-muted-foreground">This is how you appear to people in your projects.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Photo</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap items-center gap-5">
          {/* Design size: 96px with large initials (UserAvatar only has small sizes). */}
          <Avatar className="size-24 ring-1 ring-border">
            {(preview ?? me.avatar_url) && (
              <AvatarImage src={preview ?? me.avatar_url ?? undefined} alt={fields.name} referrerPolicy="no-referrer" />
            )}
            <AvatarFallback
              className="text-3xl font-semibold tracking-tight"
              style={{ backgroundColor: me.avatar_bg, color: me.avatar_fg }}
            >
              {getInitials(fields.name)}
            </AvatarFallback>
          </Avatar>
          <div className="flex flex-col gap-3">
            <div>
              <Button type="button" variant="outline" onClick={() => fileRef.current?.click()}>
                <DocumentUpload size={18} variant="Linear" color="currentColor" aria-hidden />
                Upload Photo
              </Button>
              <input
                ref={fileRef}
                type="file"
                name="avatar"
                accept="image/png,image/jpeg"
                className="sr-only"
                tabIndex={-1}
                onChange={onPickPhoto}
              />
            </div>
            <p className="max-w-sm text-xs leading-normal text-muted-foreground">
              Your Google account photo is used by default. Upload a PNG or JPG (up to 2 MB) to replace it.
            </p>
            {(photoError || serverErrors.avatar_url?.[0]) && (
              <p className="text-xs text-destructive">{photoError ?? serverErrors.avatar_url?.[0]}</p>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Profile</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <div className="grid grid-cols-[repeat(auto-fit,minmax(min(16rem,100%),1fr))] gap-4">
            <Field id="ep-name" label="Full name" error={serverErrors.name?.[0]}>
              <Input id="ep-name" name="name" placeholder="Your name" value={fields.name} onChange={set("name")} maxLength={PROFILE_LIMITS.name} autoComplete="name" />
            </Field>
            <Field id="ep-headline" label="Headline" error={serverErrors.headline?.[0]}>
              <Input id="ep-headline" name="headline" placeholder="e.g. Product designer" value={fields.headline} onChange={set("headline")} maxLength={PROFILE_LIMITS.headline} />
            </Field>
          </div>
          <Field id="ep-bio" label="Bio" error={serverErrors.bio?.[0]}>
            <Textarea id="ep-bio" name="bio" rows={3} placeholder="Add a short bio about yourself." value={fields.bio} onChange={set("bio")} maxLength={PROFILE_LIMITS.bio} className="resize-none" />
            <span className="self-end text-xs text-muted-foreground">
              {fields.bio.length} / {PROFILE_LIMITS.bio}
            </span>
          </Field>
          <div className="grid grid-cols-[repeat(auto-fit,minmax(min(16rem,100%),1fr))] gap-4">
            <Field id="ep-location" label="Location" error={serverErrors.location?.[0]}>
              <Input id="ep-location" name="location" placeholder="City, Country" value={fields.location} onChange={set("location")} maxLength={PROFILE_LIMITS.location} autoComplete="address-level2" />
            </Field>
            <Field id="ep-website" label="Website" error={serverErrors.website?.[0]}>
              <Input id="ep-website" name="website" type="url" placeholder="https://" value={fields.website} onChange={set("website")} maxLength={PROFILE_LIMITS.website} autoComplete="url" />
            </Field>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Account</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <span className="flex size-10 shrink-0 items-center justify-center rounded-lg border border-border">
              <Image src="/Google_Symbol.webp" alt="" width={20} height={20} />
            </span>
            <div className="flex flex-col gap-0.5">
              <span className="text-sm font-medium">Signed in with Google</span>
              <span className="text-[13px] text-muted-foreground">{me.email}</span>
            </div>
          </div>
          <Badge variant="secondary" className="bg-kb-green-tint text-kb-green-fg">
            Connected
          </Badge>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex max-w-md flex-col gap-0.5">
            <h2 className="text-sm font-semibold text-destructive">Delete Account</h2>
            <p className="text-[13px] leading-normal text-muted-foreground">
              Permanently remove your account and leave all projects. Projects you own must be handed over first.
            </p>
          </div>
          {/* No behavior yet (not in the spec's scope), so the action stays disabled. */}
          <Button type="button" variant="destructive" disabled>
            Delete Account
          </Button>
        </CardContent>
      </Card>

      <Card role="region" aria-label="Save changes" className="sticky bottom-4 z-10 shadow-lg">
        <CardContent className="flex flex-wrap items-center justify-end gap-2">
          <span className="mr-auto text-[13px] text-muted-foreground" aria-live="polite">{status}</span>
          <Button asChild variant="outline">
            <Link href="/profile">Cancel</Link>
          </Button>
          <Button type="submit" disabled={!dirty || !valid || pending}>
            {pending ? "Saving…" : "Save Changes"}
          </Button>
        </CardContent>
      </Card>
    </form>
  );
}
