import { Skeleton } from "@/components/ui/skeleton";

export default function ShopLoading() {
  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-6">
      {/* Shop header */}
      <div className="flex items-center gap-4">
        <Skeleton className="size-16 rounded-xl" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-7 w-48" />
          <Skeleton className="h-4 w-32" />
        </div>
      </div>

      {/* Categories */}
      <div className="mt-6 flex gap-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-9 w-20 rounded-full" />
        ))}
      </div>

      {/* Items */}
      <div className="mt-4 space-y-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="flex items-center gap-3 rounded-lg border border-slate-200 p-3">
            <Skeleton className="size-16 rounded-lg" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-5 w-40" />
              <Skeleton className="h-4 w-20" />
            </div>
            <Skeleton className="h-9 w-16 rounded-md" />
          </div>
        ))}
      </div>
    </div>
  );
}
