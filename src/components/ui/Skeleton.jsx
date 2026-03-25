export function Skeleton({ className = '' }) {
  return <div className={`animate-pulse bg-white/[0.06] rounded ${className}`} />;
}

export function LeadCardSkeleton() {
  return (
    <div className="glass rounded-2xl p-5 border-l-[3px] border-white/10">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 space-y-2.5">
          <Skeleton className="h-5 w-3/4 rounded-lg" />
          <Skeleton className="h-4 w-1/2 rounded-lg" />
        </div>
        <Skeleton className="w-14 h-14 rounded-full shrink-0" />
      </div>
      <div className="mt-4 flex gap-1.5">
        <Skeleton className="h-6 w-20 rounded-full" />
        <Skeleton className="h-6 w-24 rounded-full" />
        <Skeleton className="h-6 w-16 rounded-full" />
      </div>
      <div className="mt-3">
        <Skeleton className="h-3 w-2/5 rounded" />
      </div>
    </div>
  );
}
