"use client";

import { DocumentUpload } from "iconsax-react";
import { useRef, useState } from "react";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AVATAR_MAX_BYTES, AVATAR_TYPES } from "@/constants/profile-constant";
import { getInitials } from "@/lib/utils";
import type { AuthProfile } from "@/types/auth";

// The photo card: the current or picked photo and the upload button. The picked file goes out with the form
// (`name="avatar"`); `preview` is its local URL, owned by the form so it can count as an unsaved change.
export default function EditProfilePhoto({
  me,
  name,
  preview,
  onPreviewChange,
  serverError,
}: {
  me: AuthProfile;
  name: string;
  preview: string | null;
  onPreviewChange: (url: string | null) => void;
  serverError?: string;
}) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [photoError, setPhotoError] = useState<string>();

  function onPick(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!AVATAR_TYPES.includes(file.type))
      setPhotoError("Use a PNG or JPG image");
    else if (file.size > AVATAR_MAX_BYTES)
      setPhotoError("Image must be 2 MB or smaller");
    else {
      setPhotoError(undefined);
      onPreviewChange(URL.createObjectURL(file));
      return;
    }
    e.target.value = "";
    onPreviewChange(null);
  }

  const error = photoError ?? serverError;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Photo</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-wrap items-center gap-5">
        {/* Design size: 96px with large initials (UserAvatar only has small sizes). */}
        <Avatar className="size-24 ring-1 ring-border">
          {(preview ?? me.avatar_url) && (
            <AvatarImage
              src={preview ?? me.avatar_url ?? undefined}
              alt={name}
              referrerPolicy="no-referrer"
            />
          )}
          <AvatarFallback
            className="text-3xl font-semibold tracking-tight"
            style={{ backgroundColor: me.avatar_bg, color: me.avatar_fg }}
          >
            {getInitials(name)}
          </AvatarFallback>
        </Avatar>
        <div className="flex flex-col gap-3">
          <div>
            <Button
              type="button"
              variant="outline"
              onClick={() => fileRef.current?.click()}
            >
              <DocumentUpload
                size={18}
                variant="Linear"
                color="currentColor"
                aria-hidden
              />
              Upload Photo
            </Button>
            <input
              ref={fileRef}
              type="file"
              name="avatar"
              accept="image/png,image/jpeg"
              className="sr-only"
              tabIndex={-1}
              onChange={onPick}
            />
          </div>
          <p className="max-w-sm text-xs leading-normal text-muted-foreground">
            Your Google account photo is used by default. Upload a PNG or JPG
            (up to 2 MB) to replace it.
          </p>
          {error && <p className="text-xs text-destructive">{error}</p>}
        </div>
      </CardContent>
    </Card>
  );
}
