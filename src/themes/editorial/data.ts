import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { categoriesApi, cmsApi, productsApi } from '@/lib/api';
import { storefrontQueryOptions } from '@/lib/storefrontCache';

export interface EdProduct {
  id: string;
  slug: string;
  name: string;
  price: number;
  originalPrice?: number;
  image: string;
  images: string[];
  category: string;
  categoryId?: number;
  isNew?: boolean;
  isSale?: boolean;
  createdAt?: string;
}

export interface EdCategory {
  id: number;
  slug: string;
  name: string;
  image: string;
  parentId?: number | null;
  displayOrder?: number;
  subcategories: any[];
}

export interface EdBanner {
  id: string;
  title: string;
  subtitle: string;
  image: string;
  cta: string;
  link: string;
}

export interface EdBlog {
  id: string;
  title: string;
  image: string;
  publishedAt?: string;
}

export const signedInEmail = (): string | undefined => {
  try {
    const token = localStorage.getItem('authToken');
    if (!token) return undefined;
    const payload = JSON.parse(atob(token.split('.')[1]));
    return payload.sub || payload.email || undefined;
  } catch {
    return undefined;
  }
};

/** The same storefront data the classic pages use (shared react-query keys, so nothing is fetched twice). */
export const useStorefront = () => {
  const { data: cms } = useQuery({ queryKey: ['cmsHomepage'], queryFn: () => cmsApi.getHomepage(), refetchOnWindowFocus: false, retry: 2 });
  const { data: rawBlogs = [] } = useQuery({ queryKey: ['homepage-blogs'], queryFn: () => cmsApi.getHomepageBlogs(), refetchOnWindowFocus: false, retry: 2 });
  const { data: instagramFallback } = useQuery({ queryKey: ['instagramPosts'], queryFn: () => cmsApi.getInstagram(), refetchOnWindowFocus: false, retry: 2 });
  const { data: rawProducts = [], isLoading } = useQuery({
    queryKey: ['products'],
    queryFn: () => productsApi.getAll({ userEmail: signedInEmail() }),
    ...storefrontQueryOptions,
  });
  const { data: rawCategories = [] } = useQuery({
    queryKey: ['categoriesActive'],
    queryFn: () => categoriesApi.getAll(true, signedInEmail()),
    ...storefrontQueryOptions,
  });

  return useMemo(() => {
    const products: EdProduct[] = (rawProducts as any[]).map((p) => ({
      id: String(p.id),
      slug: p.slug || String(p.id),
      name: p.name,
      price: p.price || p.basePrice || 0,
      originalPrice: p.originalPrice,
      image: p.images?.[0] || '',
      images: p.images || [],
      category: p.categoryName || '',
      categoryId: p.categoryId,
      isNew: p.isNew,
      isSale: p.isSale,
      createdAt: p.createdAt,
    }));
    const categories: EdCategory[] = (rawCategories as any[])
      .filter((c) => !c.parentId)
      .sort((a, b) => (a.displayOrder ?? 999) - (b.displayOrder ?? 999))
      .map((c) => ({
        id: c.id, slug: c.slug || '', name: c.name, image: c.image || '',
        parentId: c.parentId, displayOrder: c.displayOrder, subcategories: c.subcategories || [],
      }));
    const pick = (ids?: Array<number | string>) => {
      const set = (ids ?? []).map(String);
      const chosen = set.map((id) => products.find((p) => p.id === id)).filter(Boolean) as EdProduct[];
      return chosen.length ? chosen : null;
    };
    const bestSellers = pick(cms?.bestSellerIds || cms?.bestSellers) ?? products.slice(0, 8);
    const newArrivals = pick(cms?.newArrivalIds || cms?.newArrivals) ?? products.slice(0, 8);
    // Hero slides come straight from the CMS banners, in the order set in the admin panel.
    const banners: EdBanner[] = ((cms?.banners || []) as any[])
      .filter((b) => b && b.image && b.isActive !== false)
      .map((b, i) => ({
        id: String(b.id ?? i),
        title: (b.title || '').trim(),
        subtitle: (b.subtitle || '').trim(),
        image: b.image,
        cta: (b.buttonText || 'Shop now').trim(),
        link: (b.link || '/products').trim(),
      }));
    const rawInsta: any[] = (cms?.instagramPosts?.length ? cms.instagramPosts : (instagramFallback as any)?.posts || instagramFallback || []) as any[];
    const instagram = (Array.isArray(rawInsta) ? rawInsta : [])
      .map((p) => (typeof p === 'string' ? { imageUrl: p, linkUrl: '' } : { imageUrl: p?.imageUrl || '', linkUrl: p?.linkUrl || '' }))
      .filter((p) => p.imageUrl)
      .slice(0, 6);
    const blogs: EdBlog[] = ((rawBlogs as any[]) || []).slice(0, 3).map((b) => ({
      id: String(b.id), title: b.title, image: b.image || '', publishedAt: b.publishedAt,
    }));
    const testimonials = (((cms?.testimonials as any[]) || []) as any[]).filter((t) => t.isActive !== false);
    return { cms, products, categories, bestSellers, newArrivals, banners, instagram, blogs, testimonials, isLoading, rawCategories: rawCategories as any[] };
  }, [cms, rawProducts, rawCategories, rawBlogs, instagramFallback, isLoading]);
};
