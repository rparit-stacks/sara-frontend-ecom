/** Shared React Query timings for storefront catalog (products + categories). */
export const STOREFRONT_STALE_MS = 10 * 60_000;
export const STOREFRONT_GC_MS = 60 * 60_000;

export const storefrontQueryOptions = {
  staleTime: STOREFRONT_STALE_MS,
  gcTime: STOREFRONT_GC_MS,
  refetchOnWindowFocus: false,
  refetchOnReconnect: false,
} as const;
