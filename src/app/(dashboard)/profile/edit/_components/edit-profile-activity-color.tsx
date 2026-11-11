import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ACTIVITY_COLORS,
  ACTIVITY_PALETTE,
  type ActivityColor,
} from "@/constants/profile-constant";
import { cn } from "@/lib/utils";

function ActivitySwatch({ color }: { color: ActivityColor }) {
  return (
    <span className="flex gap-0.5" aria-hidden="true">
      {ACTIVITY_PALETTE[color].levels.map((level) => (
        <span key={level} className={cn("block size-3 rounded-[3px]", level)} />
      ))}
    </span>
  );
}

// The colour of your activity graph (primary, green or black and white).
export default function EditProfileActivityColor({
  value,
  onChange,
}: {
  value: ActivityColor;
  onChange: (color: ActivityColor) => void;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Activity Graph</CardTitle>
        <p className="text-[13px] text-muted-foreground">
          Only you see this color; others see the default.
        </p>
      </CardHeader>
      <CardContent className="flex flex-wrap items-center justify-between gap-3">
        <label htmlFor="ep-activity-color" className="text-[13px] font-medium">
          Color
        </label>
        <Select
          name="activity_color"
          value={value}
          onValueChange={(next) => onChange(next as ActivityColor)}
        >
          <SelectTrigger id="ep-activity-color" className="w-48">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {ACTIVITY_COLORS.map((color) => (
              <SelectItem key={color} value={color}>
                <span className="flex items-center gap-2">
                  <ActivitySwatch color={color} />
                  {ACTIVITY_PALETTE[color].label}
                </span>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </CardContent>
    </Card>
  );
}
