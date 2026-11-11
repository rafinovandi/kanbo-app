import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
  InputGroupText,
} from "@/components/ui/input-group";
import { Textarea } from "@/components/ui/textarea";
import { PROFILE_LIMITS } from "@/constants/profile-constant";
import type { ProfileFormState } from "@/types/auth";
import type { ProfileFields, ProfileTextKey } from "@/validations/profile";

import EditProfileField from "./edit-profile-field";

type FieldErrors = NonNullable<ProfileFormState["errors"]>;

const GRID =
  "grid grid-cols-[repeat(auto-fit,minmax(min(16rem,100%),1fr))] gap-4";

// The profile card: name, headline, bio, usernames, location and website. Errors are the live ones from the
// shared validation plus the ones the server sent back.
export default function EditProfileInfo({
  fields,
  set,
  liveErrors,
  serverErrors,
}: {
  fields: ProfileFields;
  set: (
    key: ProfileTextKey,
  ) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
  liveErrors: FieldErrors;
  serverErrors: FieldErrors;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Profile</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <div className={GRID}>
          <EditProfileField
            id="ep-name"
            label="Full name"
            error={serverErrors.name?.[0]}
          >
            <Input
              id="ep-name"
              name="name"
              placeholder="Your name"
              value={fields.name}
              onChange={set("name")}
              maxLength={PROFILE_LIMITS.name}
              autoComplete="name"
            />
          </EditProfileField>
          <EditProfileField
            id="ep-headline"
            label="Headline"
            error={serverErrors.headline?.[0]}
          >
            <Input
              id="ep-headline"
              name="headline"
              placeholder="e.g. Product designer"
              value={fields.headline}
              onChange={set("headline")}
              maxLength={PROFILE_LIMITS.headline}
            />
          </EditProfileField>
        </div>
        <EditProfileField id="ep-bio" label="Bio" error={serverErrors.bio?.[0]}>
          <Textarea
            id="ep-bio"
            name="bio"
            rows={3}
            placeholder="Add a short bio about yourself."
            value={fields.bio}
            onChange={set("bio")}
            maxLength={PROFILE_LIMITS.bio}
            className="resize-none"
          />
          <span className="self-end text-xs text-muted-foreground">
            {fields.bio.length} / {PROFILE_LIMITS.bio}
          </span>
        </EditProfileField>
        <div className={GRID}>
          <EditProfileField
            id="ep-username"
            label="Username"
            error={serverErrors.username?.[0] ?? liveErrors.username?.[0]}
          >
            <InputGroup>
              <InputGroupAddon>
                <InputGroupText>@</InputGroupText>
              </InputGroupAddon>
              <InputGroupInput
                id="ep-username"
                name="username"
                value={fields.username}
                onChange={set("username")}
                maxLength={PROFILE_LIMITS.username}
                autoComplete="username"
                autoCapitalize="none"
                spellCheck={false}
              />
            </InputGroup>
            <p className="text-xs text-muted-foreground">
              Lowercase letters, numbers, - and _.
            </p>
          </EditProfileField>
          <EditProfileField
            id="ep-telegram"
            label="Telegram username (optional)"
            error={
              serverErrors.telegram_username?.[0] ??
              liveErrors.telegram_username?.[0]
            }
          >
            <InputGroup>
              <InputGroupAddon>
                <InputGroupText>@</InputGroupText>
              </InputGroupAddon>
              <InputGroupInput
                id="ep-telegram"
                name="telegram_username"
                value={fields.telegram_username}
                onChange={set("telegram_username")}
                maxLength={PROFILE_LIMITS.telegram + 1}
                autoCapitalize="none"
                spellCheck={false}
              />
            </InputGroup>
            <p className="text-xs text-muted-foreground">
              Used to mention you in group notifications.
            </p>
          </EditProfileField>
        </div>
        <div className={GRID}>
          <EditProfileField
            id="ep-location"
            label="Location"
            error={serverErrors.location?.[0]}
          >
            <Input
              id="ep-location"
              name="location"
              placeholder="City, Country"
              value={fields.location}
              onChange={set("location")}
              maxLength={PROFILE_LIMITS.location}
              autoComplete="address-level2"
            />
          </EditProfileField>
          <EditProfileField
            id="ep-website"
            label="Website"
            error={serverErrors.website?.[0]}
          >
            <Input
              id="ep-website"
              name="website"
              type="url"
              placeholder="https://"
              value={fields.website}
              onChange={set("website")}
              maxLength={PROFILE_LIMITS.website}
              autoComplete="url"
            />
          </EditProfileField>
        </div>
      </CardContent>
    </Card>
  );
}
