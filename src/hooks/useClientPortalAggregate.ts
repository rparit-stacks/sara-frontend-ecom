import { useQuery } from '@tanstack/react-query';
import { clientProjectApi } from '@/lib/api';
import { loadClientPortalAggregate } from '@/lib/clientPortalAggregate';

export function useClientPortalProjects() {
  return useQuery({
    queryKey: ['client-projects'],
    queryFn: () => clientProjectApi.list(),
    staleTime: 60_000,
  });
}

export function useClientPortalAggregate() {
  const aggregateQuery = useQuery({
    queryKey: ['client-portal-aggregate'],
    queryFn: loadClientPortalAggregate,
    staleTime: 60_000,
    gcTime: 5 * 60_000,
  });

  const data = aggregateQuery.data;

  return {
    projects: data?.projects ?? [],
    threads: data?.threads ?? [],
    files: data?.files ?? [],
    invoices: data?.invoices ?? [],
    quotes: data?.quotes ?? [],
    activities: data?.activities ?? [],
    isLoading: aggregateQuery.isLoading,
    isAggregateLoading: aggregateQuery.isFetching,
    isError: aggregateQuery.isError,
    refetch: () => aggregateQuery.refetch(),
  };
}
