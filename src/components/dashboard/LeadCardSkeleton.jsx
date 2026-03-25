import { LeadCardSkeleton as Skeleton } from '../ui/Skeleton';

export default function LeadCardSkeletonList({ count = 5 }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: count }).map((_, i) => (
        <Skeleton key={i} />
      ))}
    </div>
  );
}
