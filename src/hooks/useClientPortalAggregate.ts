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
    // Short-poll so a new invoice/quote/payment from the admin shows up on the
    // dashboard within ~30s without the user needing to refocus or reload.
    staleTime: 20_000,
    gcTime: 5 * 60_000,
    refetchInterval: 30_000,
    refetchIntervalInBackground: false,
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
