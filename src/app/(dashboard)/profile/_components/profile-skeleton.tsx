import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";

function SectionHeading({ width }: { width: string }) {
  return (
    <div className="flex items-baseline justify-between gap-2">
      <Skeleton className={`h-6 ${width}`} />
    </div>
  );
}

// Same layout as the profile (identity column, then pinned / activity / streaks / recent), so nothing jumps when it loads.
export default function ProfileSkeleton() {
  return (
    <div className="flex flex-wrap items-start gap-8 p-4 pb-12 sm:p-7 sm:pb-12">
      <div className="flex min-w-0 flex-[1_1_15rem] flex-col gap-4.5">
        <Skeleton className="size-42 self-center rounded-full" />
        <div className="flex flex-col gap-1">
          <Skeleton className="h-8 w-44" />
          <Skeleton className="h-5 w-32" />
        </div>
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-5 w-36" />
        <Skeleton className="h-9 w-full rounded-lg" />
        <Separator />
        <div className="flex flex-col gap-3">
          {["w-40", "w-52", "w-32"].map((width) => (
            <div key={width} className="flex items-center gap-2.5">
              <Skeleton className="size-[18px] rounded-md" />
              <Skeleton className={`h-4 ${width}`} />
            </div>
          ))}
        </div>
      </div>

      <div className="flex min-w-0 flex-[999_1_35rem] flex-col gap-7">
        <div className="flex flex-col gap-3">
          <SectionHeading width="w-36" />
          <div className="grid grid-cols-[repeat(auto-fit,minmax(min(15rem,100%),1fr))] gap-3.5">
            {[0, 1, 2].map((i) => (
              <Skeleton key={i} className="h-32 rounded-xl" />
            ))}
          </div>
        </div>

        <div className="flex flex-col gap-3">
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <Skeleton className="h-6 w-64 max-w-full" />
            <Skeleton className="h-4 w-36" />
          </div>
          <Skeleton className="h-52 rounded-xl" />
        </div>

        <div className="grid grid-cols-[repeat(auto-fit,minmax(min(10.5rem,100%),1fr))] gap-3.5">
          {[0, 1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-26 rounded-xl" />
          ))}
        </div>

        <div className="flex flex-col gap-3">
          <SectionHeading width="w-40" />
          <Skeleton className="h-80 rounded-xl" />
        </div>
      </div>
    </div>
  );
}
