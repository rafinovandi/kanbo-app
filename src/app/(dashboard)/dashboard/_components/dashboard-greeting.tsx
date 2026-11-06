import { Skeleton } from "@/components/ui/skeleton";
import { getCurrentProfile } from "@/lib/profile";
import { formatLongDate, getFirstName } from "@/lib/utils";

// Reads the session and the current date, so it streams in behind <Suspense>.
export default async function DashboardGreeting({ subtitle }: { subtitle: string }) {
  const profile = await getCurrentProfile();
  const today = formatLongDate(new Date(), profile.timezone);

  return (
    <div className="flex flex-col gap-1.5">
      <h1 className="text-[28px] leading-tight font-semibold tracking-[-0.02em]">
        Hello, {getFirstName(profile.name)}
      </h1>
      <p className="text-sm text-muted-foreground">
        {today} · {subtitle}
      </p>
    </div>
  );
}

export function DashboardGreetingSkeleton() {
  return (
    <div className="flex flex-col gap-2">
      <Skeleton className="h-8 w-48" />
      <Skeleton className="h-4 w-72 max-w-full" />
    </div>
  );
}
