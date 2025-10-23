import { Skeleton } from "@/components/ui/skeleton";

export function SkeletonGrid() {
  return (
    <div className="grid w-full max-w-5xl grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {[...Array(6)].map((_, i) => (
        <Skeleton key={i} className="h-48 w-full rounded-2xl" />
      ))}
    </div>
  );
}
