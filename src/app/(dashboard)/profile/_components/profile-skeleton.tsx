import { Skeleton } from "@/components/ui/skeleton";

export default function ProfileSkeleton() {
  return (
    <div className="flex flex-wrap items-start gap-8 p-4 sm:p-7">
      <div className="flex min-w-0 flex-[1_1_15rem] flex-col gap-4">
        <Skeleton className="size-42 rounded-full" />
        <Skeleton className="h-7 w-44" />
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-16 w-full" />
        <Skeleton className="h-10 w-full" />
      </div>
      <div className="flex min-w-0 flex-[999_1_35rem] flex-col gap-7">
        <Skeleton className="h-28 w-full rounded-xl" />
        <Skeleton className="h-52 w-full rounded-xl" />
        <Skeleton className="h-24 w-full rounded-xl" />
        <Skeleton className="h-64 w-full rounded-xl" />
      </div>
    </div>
  );
}
