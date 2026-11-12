"use client";

import {
  GitHubActivity,
  type ContributionData,
} from "@/components/spaceui/github-activity";
import { useActivityColor } from "@/hooks/use-activity-color";

// The heatmap in the color chosen on the Theme page (only on your own profile; others see the default).
export default function ProfileActivityGraph({
  contributions,
  helperText,
  useOwnColor,
}: {
  contributions: ContributionData;
  helperText: string;
  useOwnColor: boolean;
}) {
  const { activityColor } = useActivityColor();
  return (
    <GitHubActivity
      contributions={contributions}
      color={useOwnColor ? activityColor : undefined}
      helperText={helperText}
    />
  );
}
