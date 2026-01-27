import { Skeleton } from '@/components/ui/skeleton';

export function CategoryCardSkeleton({ className }: { className?: string }) {
  return (
    <div className={`flex-shrink-0 ${className ?? ''}`}>
      <Skeleton className="aspect-[3/4] w-full rounded-xl xs:rounded-2xl" />
      <Skeleton className="mt-3 h-6 w-2/3 mx-auto" />
      <Skeleton className="mt-2 h-4 w-1/2 mx-auto" />
    </div>
  );
}
