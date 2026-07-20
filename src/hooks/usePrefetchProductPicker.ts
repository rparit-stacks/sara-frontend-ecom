import { useQuery } from '@tanstack/react-query';
import { productsApi } from '@/lib/api';
import { PRODUCT_PICKER_QUERY_KEY } from '@/components/portal/ProductPickerModal';

/** Prefetch product picker data when entering a project workspace so the modal opens instantly. */
export function usePrefetchProductPicker() {
  useQuery({
    queryKey: PRODUCT_PICKER_QUERY_KEY,
    queryFn: () => productsApi.getPicker(),
    staleTime: 15 * 60_000,
    gcTime: 60 * 60_000,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
  });
}
