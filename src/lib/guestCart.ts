// Guest Cart Utility - Manages cart in localStorage for non-logged-in users

export interface GuestCartItem {
  id: string;
  productType: string;
  productId: number;
  productName: string;
  productImage: string;
  designId?: number;
  fabricId?: number;
  fabricPrice?: number;
  designPrice?: number;
  uploadedDesignUrl?: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  variants?: Record<string, string>;
  variantSelections?: Record<string, any>;
  customFormData?: Record<string, any>;
  /** Server PriceBreakdownDto snapshot when last synced from pricing-preview. */
  breakdown?: Record<string, any> | null;
  /**
   * fabricPrice/unitPrice as first added to cart, before any server-priced sync.
   * previewPricing requests must always send these, never the synced (possibly
   * already-discounted) fabricPrice/unitPrice above — otherwise a bulk-slab
   * discount already baked in by a previous sync gets discounted again.
   */
  rawFabricPrice?: number;
  rawUnitPrice?: number;
}

const GUEST_CART_KEY = 'guestCart';

const MONEY_EPS = 0.02;
function moneyChanged(a: number | undefined | null, b: number | undefined | null): boolean {
  return Math.abs(Number(a ?? 0) - Number(b ?? 0)) > MONEY_EPS;
}

export const guestCart = {
  // Get all cart items
  getItems: (): GuestCartItem[] => {
    if (typeof window === 'undefined') return [];
    try {
      const cart = localStorage.getItem(GUEST_CART_KEY);
      return cart ? JSON.parse(cart) : [];
    } catch {
      return [];
    }
  },

  // Add item to cart
  addItem: (item: Omit<GuestCartItem, 'id'>): GuestCartItem => {
    const items = guestCart.getItems();
    const newItem: GuestCartItem = {
      ...item,
      id: `guest-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      rawFabricPrice: item.fabricPrice,
      rawUnitPrice: item.unitPrice,
    };
    items.push(newItem);
    localStorage.setItem(GUEST_CART_KEY, JSON.stringify(items));
    return newItem;
  },

  // Update item quantity
  updateItem: (itemId: string, quantity: number): void => {
    const items = guestCart.getItems();
    const item = items.find(i => i.id === itemId);
    if (item) {
      item.quantity = quantity;
      item.totalPrice = item.unitPrice * quantity;
      localStorage.setItem(GUEST_CART_KEY, JSON.stringify(items));
    }
  },

  /** Full replace of a cart item (for CUSTOM edit-from-cart). Dispatches guestCartUpdated. */
  updateItemFull: (itemId: string, item: Omit<GuestCartItem, 'id'>): void => {
    const items = guestCart.getItems();
    const idx = items.findIndex(i => i.id === itemId);
    if (idx === -1) return;
    const totalPrice = (item.unitPrice ?? 0) * (item.quantity ?? 1);
    items[idx] = {
      ...item,
      id: itemId,
      totalPrice,
      rawFabricPrice: item.fabricPrice,
      rawUnitPrice: item.unitPrice,
    };
    localStorage.setItem(GUEST_CART_KEY, JSON.stringify(items));
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new Event('guestCartUpdated'));
    }
  },

  /**
   * Persist server-priced unit/total/fabric (+ breakdown) onto matching local lines.
   * Stops the ₹314 → ₹299 flash on next cart/checkout load.
   * Returns true when localStorage changed.
   */
  syncServerPrices: (
    pricedItems: Array<{
      unitPrice?: number | null;
      totalPrice?: number | null;
      fabricPrice?: number | null;
      designPrice?: number | null;
      breakdown?: Record<string, any> | null;
    }>
  ): boolean => {
    if (typeof window === 'undefined') return false;
    const items = guestCart.getItems();
    if (!items.length || !pricedItems?.length) return false;
    let changed = false;
    const next = items.map((raw, idx) => {
      const match = pricedItems[idx];
      if (!match) return raw;
      const unitPrice = match.unitPrice != null ? Number(match.unitPrice) : raw.unitPrice;
      const totalPrice = match.totalPrice != null ? Number(match.totalPrice) : raw.totalPrice;
      const fabricPrice =
        match.fabricPrice != null ? Number(match.fabricPrice) : raw.fabricPrice;
      const designPrice =
        match.designPrice != null ? Number(match.designPrice) : raw.designPrice;
      const breakdown = match.breakdown ?? raw.breakdown;
      const needBreakdown = !raw.breakdown && !!match.breakdown;
      if (
        moneyChanged(unitPrice, raw.unitPrice) ||
        moneyChanged(totalPrice, raw.totalPrice) ||
        moneyChanged(fabricPrice, raw.fabricPrice) ||
        moneyChanged(designPrice, raw.designPrice) ||
        needBreakdown
      ) {
        changed = true;
        return { ...raw, unitPrice, totalPrice, fabricPrice, designPrice, breakdown };
      }
      return raw;
    });
    if (!changed) return false;
    localStorage.setItem(GUEST_CART_KEY, JSON.stringify(next));
    window.dispatchEvent(new Event('guestCartUpdated'));
    return true;
  },

  // Remove item from cart
  removeItem: (itemId: string): void => {
    const items = guestCart.getItems().filter(i => i.id !== itemId);
    localStorage.setItem(GUEST_CART_KEY, JSON.stringify(items));
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new Event('guestCartUpdated'));
    }
  },

  // Clear cart
  clear: (): void => {
    localStorage.removeItem(GUEST_CART_KEY);
  },

  // Get cart count
  getCount: (): number => {
    return guestCart.getItems().length;
  },

  // Get cart total
  getTotal: (): number => {
    return guestCart.getItems().reduce((sum, item) => sum + item.totalPrice, 0);
  },

  // Migrate guest cart to backend (when user logs in)
  migrateToBackend: async (cartApi: any): Promise<void> => {
    const items = guestCart.getItems();
    if (items.length === 0) return;

    try {
      for (const item of items) {
        await cartApi.addItem({
          productType: item.productType,
          productId: item.productId,
          productName: item.productName,
          productImage: item.productImage,
          designId: item.designId,
          fabricId: item.fabricId,
          // Raw (pre-discount) price — the backend treats whatever is sent here as the
          // permanent baseline for this cart row, so a synced/already-discounted price
          // would get discounted again on every future reprice.
          fabricPrice: item.rawFabricPrice ?? item.fabricPrice,
          designPrice: item.designPrice,
          uploadedDesignUrl: item.uploadedDesignUrl,
          quantity: item.quantity,
          unitPrice: item.rawUnitPrice ?? item.unitPrice,
          variants: item.variants,
          variantSelections: item.variantSelections,
          customFormData: item.customFormData,
        });
      }
      guestCart.clear();
    } catch (error) {
      console.error('Failed to migrate guest cart:', error);
    }
  },
};
