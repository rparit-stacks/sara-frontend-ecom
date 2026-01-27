import { Skeleton } from '@/components/ui/skeleton';

export function BlogCardSkeleton({ className }: { className?: string }) {
  return (
    <div className={`flex-shrink-0 w-[180px] xs:w-[220px] sm:w-[280px] md:w-[320px] lg:w-[360px] ${className ?? ''}`}>
      <Skeleton className="aspect-[3/4] w-full rounded-xl xs:rounded-2xl" />
      <Skeleton className="mt-3 h-3 w-1/4" />
      <Skeleton className="mt-2 h-5 w-full" />
      <Skeleton className="mt-2 h-4 w-1/3" />
    </div>
  );
}
