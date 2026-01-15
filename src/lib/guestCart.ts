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
  customFormData?: Record<string, any>;
}

const GUEST_CART_KEY = 'guestCart';

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

  // Remove item from cart
  removeItem: (itemId: string): void => {
    const items = guestCart.getItems().filter(i => i.id !== itemId);
    localStorage.setItem(GUEST_CART_KEY, JSON.stringify(items));
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
      // Add each item to backend cart
      for (const item of items) {
        await cartApi.addItem({
          productType: item.productType,
          productId: item.productId,
          productName: item.productName,
          productImage: item.productImage,
          designId: item.designId,
          fabricId: item.fabricId,
          fabricPrice: item.fabricPrice,
          designPrice: item.designPrice,
          uploadedDesignUrl: item.uploadedDesignUrl,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          variants: item.variants,
          customFormData: item.customFormData,
        });
      }
      // Clear guest cart after migration
      guestCart.clear();
    } catch (error) {
      console.error('Failed to migrate guest cart:', error);
      // Don't clear cart if migration fails
    }
  },
};
