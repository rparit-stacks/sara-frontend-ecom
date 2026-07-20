import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { productsApi } from '@/lib/api';
import { Sym } from './Sym';

export type ProductPickerItem = {
  id: number | string;
  name: string;
  price?: string;
  image?: string;
  slug?: string;
};

export const PRODUCT_PICKER_QUERY_KEY = ['chat-product-picker'] as const;

export default function ProductPickerModal({
  open,
  onClose,
  onSelect,
}: {
  open: boolean;
  onClose: () => void;
  onSelect: (item: ProductPickerItem) => void;
}) {
  const [q, setQ] = useState('');

  const { data: products = [], isLoading, isFetching } = useQuery({
    queryKey: PRODUCT_PICKER_QUERY_KEY,
    queryFn: () => productsApi.getPicker(),
    enabled: open,
    staleTime: 15 * 60_000,
    gcTime: 60 * 60_000,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
  });

  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase();
    if (!term) return products.slice(0, 60);
    return products.filter((p) =>
      String(p.name || '').toLowerCase().includes(term)
      || String(p.slug || '').toLowerCase().includes(term),
    ).slice(0, 60);
  }, [products, q]);

  if (!open) return null;

  const pick = (p: { id: number; name?: string; slug?: string; price?: number; imageUrl?: string }) => {
    const price = p.price != null ? `₹${Number(p.price).toLocaleString('en-IN')}` : undefined;
    onSelect({
      id: p.id,
      name: p.name || 'Product',
      price,
      image: p.imageUrl,
      slug: p.slug,
    });
    onClose();
    setQ('');
  };

  const showLoading = isLoading && products.length === 0;

  return (
    <>
      <div className="fixed inset-0 z-50 bg-black/40" onClick={onClose} />
      <div
        className="fixed left-1/2 top-1/2 z-50 w-[min(960px,calc(100vw-2rem))] max-w-none -translate-x-1/2 -translate-y-1/2 border rounded-2xl shadow-2xl flex flex-col max-h-[88vh]"
        style={{ background: 'var(--p-surface-container-lowest)', borderColor: 'var(--p-outline-variant)' }}
      >
        <div className="px-5 py-4 border-b flex items-center justify-between gap-3" style={{ borderColor: 'var(--p-outline-variant)' }}>
          <div>
            <h3 className="font-display text-[18px]">Attach product</h3>
            <p className="text-[12px] mt-0.5" style={{ color: 'var(--p-on-surface-variant)' }}>
              Search and pick a product to share in this chat
            </p>
          </div>
          <button type="button" onClick={onClose} className="p-1.5 rounded hover:bg-black/5 shrink-0"><Sym name="close" /></button>
        </div>
        <div className="px-5 py-3 border-b" style={{ borderColor: 'var(--p-outline-variant)' }}>
          <input
            autoFocus
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search by name or slug…"
            className="w-full h-11 px-4 rounded-xl border text-[15px] outline-none focus:ring-2 focus:ring-[#00676a]/20"
            style={{ borderColor: 'var(--p-outline-variant)' }}
          />
        </div>
        <div className="flex-1 overflow-y-auto p-4">
          {showLoading ? (
            <p className="text-center text-sm py-12" style={{ color: 'var(--p-on-surface-variant)' }}>Loading products…</p>
          ) : filtered.length === 0 ? (
            <p className="text-center text-sm py-12" style={{ color: 'var(--p-on-surface-variant)' }}>No products found</p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {filtered.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => pick(p)}
                  className="w-full flex items-center gap-3 p-3 rounded-xl border hover:bg-black/[0.03] text-left transition-colors"
                  style={{ borderColor: 'var(--p-outline-variant)' }}
                >
                  <div className="w-16 h-16 rounded-xl overflow-hidden shrink-0 border" style={{ borderColor: 'var(--p-outline-variant)' }}>
                    {p.imageUrl ? (
                      <img src={p.imageUrl} alt="" className="w-full h-full object-cover" loading="lazy" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center" style={{ background: 'var(--p-surface-container-high)' }}>
                        <Sym name="shopping_bag" className="text-[24px]" />
                      </div>
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-[15px] font-semibold line-clamp-2">{p.name}</p>
                    {p.price != null ? (
                      <p className="text-[13px] font-bold mt-1" style={{ color: 'var(--p-primary)' }}>₹{Number(p.price).toLocaleString('en-IN')}</p>
                    ) : null}
                    {p.slug ? (
                      <p className="text-[11px] truncate mt-0.5" style={{ color: 'var(--p-on-surface-variant)' }}>{p.slug}</p>
                    ) : null}
                  </div>
                </button>
              ))}
            </div>
          )}
          {isFetching && !showLoading ? (
            <p className="text-center text-[11px] pt-3" style={{ color: 'var(--p-on-surface-variant)' }}>Refreshing…</p>
          ) : null}
        </div>
      </div>
    </>
  );
}
