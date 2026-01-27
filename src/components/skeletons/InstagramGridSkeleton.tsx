import { Skeleton } from '@/components/ui/skeleton';

export function InstagramGridSkeleton() {
  return (
    <div className="grid grid-cols-3 lg:grid-cols-6 gap-1.5 xs:gap-2 sm:gap-3 lg:gap-5">
      {Array.from({ length: 6 }).map((_, i) => (
        <Skeleton key={i} className="aspect-square w-full rounded-lg xs:rounded-xl lg:rounded-2xl" />
      ))}
    </div>
  );
}
