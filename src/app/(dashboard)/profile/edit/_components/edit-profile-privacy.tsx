import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import type { PRIVACY_KEYS } from "@/constants/profile-constant";
import type { ProfileFields } from "@/validations/profile";

type PrivacyKey = (typeof PRIVACY_KEYS)[number];

const PRIVACY_ROWS: { key: PrivacyKey; label: string; hint: string }[] = [
  { key: "show_stats", label: "Stats", hint: "Completed and open task counts" },
  {
    key: "show_activity",
    label: "Activity graph",
    hint: "Tasks completed per day over the last year",
  },
  {
    key: "show_pinned",
    label: "Pinned projects",
    hint: "Projects you pinned to your profile",
  },
  {
    key: "show_recent_tasks",
    label: "Recent tasks",
    hint: "Tasks you completed lately",
  },
];

// What other people in your projects can see on your profile.
export default function EditProfilePrivacy({
  fields,
  onChange,
}: {
  fields: ProfileFields;
  onChange: (key: PrivacyKey, on: boolean) => void;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Privacy</CardTitle>
        <p className="text-[13px] text-muted-foreground">
          Visible to people in your projects
        </p>
      </CardHeader>
      <CardContent className="flex flex-col divide-y divide-border">
        {PRIVACY_ROWS.map((row) => (
          <div
            key={row.key}
            className="flex min-h-12 items-center justify-between gap-3 py-2 first:pt-0 last:pb-0"
          >
            <label
              htmlFor={`ep-${row.key}`}
              className="flex min-w-0 flex-col gap-px"
            >
              <span className="text-[13px] font-medium">{row.label}</span>
              <span className="text-xs text-muted-foreground">{row.hint}</span>
            </label>
            <Switch
              id={`ep-${row.key}`}
              name={row.key}
              checked={fields[row.key]}
              onCheckedChange={(on) => onChange(row.key, on)}
            />
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
