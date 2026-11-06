import { Skeleton } from "@/components/ui/skeleton";

export default function EditProfileSkeleton() {
  return (
    <div className="mx-auto flex w-full max-w-180 flex-col gap-5 p-4 sm:p-7">
      <Skeleton className="h-8 w-48" />
      <Skeleton className="h-36 w-full rounded-xl" />
      <Skeleton className="h-96 w-full rounded-xl" />
      <Skeleton className="h-48 w-full rounded-xl" />
    </div>
  );
}
