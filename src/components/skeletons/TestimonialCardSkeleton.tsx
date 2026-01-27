import { Skeleton } from '@/components/ui/skeleton';

export function TestimonialCardSkeleton({ className }: { className?: string }) {
  return (
    <div className={`flex-shrink-0 w-[240px] xs:w-[280px] sm:w-[320px] md:w-[380px] lg:w-[420px] p-4 xs:p-6 sm:p-8 lg:p-10 rounded-xl xs:rounded-2xl border border-border ${className ?? ''}`}>
      <div className="flex gap-1 mb-4">
        {[1, 2, 3, 4, 5].map((i) => (
          <Skeleton key={i} className="h-4 w-4 rounded" />
        ))}
      </div>
      <Skeleton className="h-4 w-full mb-2" />
      <Skeleton className="h-4 w-full mb-2" />
      <Skeleton className="h-4 w-[80%] mb-6" />
      <Skeleton className="h-5 w-1/3 mb-1" />
      <Skeleton className="h-4 w-1/4" />
    </div>
  );
}
