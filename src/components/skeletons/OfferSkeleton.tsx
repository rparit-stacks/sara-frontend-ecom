import { Skeleton } from '@/components/ui/skeleton';

export function OfferSkeleton() {
  return (
    <div className="max-w-3xl mx-auto text-center px-3 xs:px-4 sm:px-6 space-y-4">
      <Skeleton className="h-8 w-40 mx-auto rounded-full" />
      <Skeleton className="h-12 w-full max-w-xl mx-auto" />
      <Skeleton className="h-6 w-3/4 mx-auto" />
    </div>
  );
}
