"use client";

import { DocumentUpload } from "iconsax-react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useActionState, useEffect, useRef, useState } from "react";
import { toast } from "sonner";

import { deleteAccountAction } from "@/actions/account-action";
import ActionBar from "@/components/common/action-bar";
import ConfirmDeleteDialog from "@/components/common/confirm-delete-dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { InputGroup, InputGroupAddon, InputGroupInput, InputGroupText } from "@/components/ui/input-group";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { INITIAL_STATE_ACTION } from "@/constants/general-constant";
import { AVATAR_MAX_BYTES, AVATAR_TYPES, PRIVACY_KEYS, PROFILE_LIMITS } from "@/constants/profile-constant";
import { getInitials } from "@/lib/utils";
import type { AuthProfile, ProfileFormState } from "@/types/auth";
import { validateProfile, type ProfileFields, type ProfileTextKey } from "@/validations/profile";

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

const PRIVACY_ROWS: { key: (typeof PRIVACY_KEYS)[number]; label: string; hint: string }[] = [
  { key: "show_stats", label: "Stats", hint: "Completed and open task counts" },
  { key: "show_activity", label: "Activity graph", hint: "Tasks completed per day over the last year" },
  { key: "show_pinned", label: "Pinned projects", hint: "Projects you pinned to your profile" },
  { key: "show_recent_tasks", label: "Recent tasks", hint: "Tasks you completed lately" },
];

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
  const fileRef = useRef<HTMLInputElement>(null);
  const [fields, setFields] = useState<ProfileFields>(initial);
  const [saved, setSaved] = useState<ProfileFields>(initial);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const [photoError, setPhotoError] = useState<string>();
  const [state, formAction, pending] = useActionState<ProfileFormState, FormData>(async (prev, formData) => {
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

  const set = (key: ProfileTextKey) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setFields((f) => ({ ...f, [key]: e.target.value }));

  const { errors: liveErrors } = validateProfile(fields);
  const dirty = (Object.keys(saved) as (keyof ProfileFields)[]).some((k) => fields[k] !== saved[k]) || !!preview;
  const valid = Object.keys(liveErrors).length === 0;
  const serverErrors = state.errors ?? {};

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

  const deleteAccount = async () => {
    const result = await deleteAccountAction(saved.username);
    if (result.status === "error") {
      toast.error(result.message);
      return false;
    }
    toast.success("Account deleted");
    router.replace("/login");
    return true;
  };

  const status = !dirty ? "No changes yet" : valid ? "Unsaved changes" : (Object.values(liveErrors)[0]?.[0] ?? "Check the highlighted fields");

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
            <Field id="ep-username" label="Username" error={serverErrors.username?.[0] ?? liveErrors.username?.[0]}>
              <InputGroup>
                <InputGroupAddon>
                  <InputGroupText>@</InputGroupText>
                </InputGroupAddon>
                <InputGroupInput id="ep-username" name="username" value={fields.username} onChange={set("username")} maxLength={PROFILE_LIMITS.username} autoComplete="username" autoCapitalize="none" spellCheck={false} />
              </InputGroup>
              <p className="text-xs text-muted-foreground">Lowercase letters, numbers, - and _.</p>
            </Field>
            <Field id="ep-telegram" label="Telegram username (optional)" error={serverErrors.telegram_username?.[0] ?? liveErrors.telegram_username?.[0]}>
              <InputGroup>
                <InputGroupAddon>
                  <InputGroupText>@</InputGroupText>
                </InputGroupAddon>
                <InputGroupInput id="ep-telegram" name="telegram_username" value={fields.telegram_username} onChange={set("telegram_username")} maxLength={PROFILE_LIMITS.telegram + 1} autoCapitalize="none" spellCheck={false} />
              </InputGroup>
              <p className="text-xs text-muted-foreground">Used to mention you in group notifications.</p>
            </Field>
          </div>
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
          <CardTitle>Privacy</CardTitle>
          <p className="text-[13px] text-muted-foreground">Visible to people in your projects</p>
        </CardHeader>
        <CardContent className="flex flex-col divide-y divide-border">
          {PRIVACY_ROWS.map((row) => (
            <div key={row.key} className="flex min-h-12 items-center justify-between gap-3 py-2 first:pt-0 last:pb-0">
              <label htmlFor={`ep-${row.key}`} className="flex min-w-0 flex-col gap-px">
                <span className="text-[13px] font-medium">{row.label}</span>
                <span className="text-xs text-muted-foreground">{row.hint}</span>
              </label>
              <Switch
                id={`ep-${row.key}`}
                name={row.key}
                checked={fields[row.key]}
                onCheckedChange={(on) => setFields((f) => ({ ...f, [row.key]: on }))}
              />
            </div>
          ))}
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
              Permanently remove your account and leave all projects.{" "}
              {ownedProjects.length > 0
                ? `Delete the projects you own first: ${ownedProjects.join(", ")}.`
                : "This can't be undone."}
            </p>
          </div>
          <Button type="button" variant="destructive" disabled={ownedProjects.length > 0} onClick={() => setDeleteOpen(true)}>
            Delete Account
          </Button>
        </CardContent>
      </Card>

      <ConfirmDeleteDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        title="Delete Account"
        description="This permanently deletes your account. This can't be undone."
        confirmLabel="Delete Account"
        confirmText={saved.username}
        onConfirm={deleteAccount}
      >
        <ul className="list-disc space-y-1 pl-5 text-sm text-muted-foreground">
          <li>You leave every project and are removed from all tasks</li>
          <li>Your agent bots and connected chats are removed</li>
          <li>Tasks you created in other projects stay</li>
        </ul>
      </ConfirmDeleteDialog>

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
