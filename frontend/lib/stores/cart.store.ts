import { create } from 'zustand';
import { cartService, CartItemDto } from '@/lib/api/services/cart.service';

export interface LocalCartItem {
  id: number; // Backend cart item ID
  productId: number;
  variantId?: number;
  variantName?: string;
  quantity: number;
  name: string;
  nameVi?: string; // Vietnamese name
  nameEn?: string; // English name
  price: number;
  image?: string;
  slug?: string;
  // Stock & availability
  isAvailable?: boolean;
  inStock?: boolean;
  availableQuantity?: number | null;
  // Change tracking
  priceChanged?: boolean;
  productChanged?: boolean;
  oldPrice?: number | null;
}

export interface AddToCartDto {
  productId: number;
  variantId?: number;
  variantName?: string;
  quantity: number;
  name?: string;
  price?: number;
  image?: string;
  slug?: string;
}

interface CartState {
  items: LocalCartItem[];
  isLoading: boolean;

  // Computed values
  totalItems: number;
  subtotal: number;

  // Actions
  loadCart: () => Promise<void>;
  addItem: (data: AddToCartDto) => Promise<void>;
  updateQuantity: (itemId: number, quantity: number) => Promise<void>;
  removeItem: (itemId: number) => Promise<void>;
  clearCart: () => Promise<void>;

  // Auth sync
  syncAfterLogin: () => Promise<void>;
}

const calculateTotals = (items: LocalCartItem[]) => {
  const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);
  const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  return { totalItems, subtotal };
};

const convertBackendItemToLocal = (item: any): LocalCartItem => ({
  id: item.id,
  productId: item.productId,
  variantId: item.variantId,
  variantName: item.variantName,
  quantity: item.quantity,
  name: item.productName,
  nameVi: item.product?.nameVi || item.productName, // Get from product object
  nameEn: item.product?.nameEn || item.productName, // Get from product object
  price: parseFloat(item.price),
  image: item.image, // Backend now returns full public URL from Supabase
  slug: item.slug,
  // Stock & availability
  isAvailable: item.isAvailable,
  inStock: item.inStock,
  availableQuantity: item.availableQuantity,
  // Change tracking
  priceChanged: item.priceChanged,
  productChanged: item.productChanged,
  oldPrice: item.oldPrice,
});

const mergeDuplicateBackendItems = async (
  backendItems: CartItemDto[],
  depth = 0
): Promise<CartItemDto[]> => {
  if (depth > 3) {
    return backendItems;
  }

  const groups = new Map<string, CartItemDto[]>();
  for (const item of backendItems) {
    const key = `${item.productId}-${item.variantId ?? 'none'}`;
    const list = groups.get(key) ?? [];
    list.push(item);
    groups.set(key, list);
  }

  let merged = false;

  for (const group of groups.values()) {
    if (group.length <= 1) continue;

    merged = true;
    const sorted = [...group].sort((a, b) => a.id - b.id);
    const primary = sorted[0];
    const duplicates = sorted.slice(1);
    const totalQuantity = sorted.reduce((sum, current) => sum + current.quantity, 0);

    if (primary.quantity !== totalQuantity) {
      await cartService.updateCartItem(primary.id, { quantity: totalQuantity });
    }

    for (const duplicate of duplicates) {
      await cartService.removeCartItem(duplicate.id);
    }
  }

  if (merged) {
    const refreshedCart = await cartService.getCart();
    return mergeDuplicateBackendItems(refreshedCart.items, depth + 1);
  }

  return backendItems;
};

export const useCartStore = create<CartState>()((set, get) => ({
  items: [],
  isLoading: false,
  totalItems: 0,
  subtotal: 0,

  /**
   * Load cart from backend
   */
  loadCart: async () => {
    set({ isLoading: true });
    try {
      const cart = await cartService.getCart();
      const backendItems = await mergeDuplicateBackendItems(cart.items);
      const items = backendItems.map(convertBackendItemToLocal);
      const { totalItems, subtotal } = calculateTotals(items);
      set({ items, totalItems, subtotal, isLoading: false });
    } catch (error) {
      console.error('Failed to load cart:', error);
      set({ items: [], totalItems: 0, subtotal: 0, isLoading: false });
    }
  },

  /**
   * Add item to cart (save to backend immediately)
   */
  addItem: async (data: AddToCartDto) => {
    set({ isLoading: true });
    try {
      await cartService.addToCart({
        productId: data.productId,
        variantId: data.variantId,
        quantity: data.quantity,
      });

      // Reload cart from backend to get updated state
      await get().loadCart();
    } catch (error) {
      console.error('Failed to add item to cart:', error);
      set({ isLoading: false });
      throw error;
    }
  },

  /**
   * Update cart item quantity (save to backend immediately)
   */
  updateQuantity: async (itemId: number, quantity: number) => {
    set({ isLoading: true });
    try {
      await cartService.updateCartItem(itemId, { quantity });

      // Reload cart from backend to get updated state
      await get().loadCart();
    } catch (error) {
      console.error('Failed to update cart item:', error);
      set({ isLoading: false });
      throw error;
    }
  },

  /**
   * Remove item from cart (save to backend immediately)
   */
  removeItem: async (itemId: number) => {
    set({ isLoading: true });
    try {
      await cartService.removeCartItem(itemId);

      // Reload cart from backend to get updated state
      await get().loadCart();
    } catch (error) {
      console.error('Failed to remove cart item:', error);
      set({ isLoading: false });
      throw error;
    }
  },

  /**
   * Clear cart (save to backend immediately)
   */
  clearCart: async () => {
    set({ isLoading: true });
    try {
      await cartService.clearCart();
      set({ items: [], totalItems: 0, subtotal: 0, isLoading: false });
    } catch (error) {
      console.error('Failed to clear cart:', error);
      set({ isLoading: false });
      throw error;
    }
  },

  /**
   * Sync cart after login (sessionId cart → userId cart)
   * Backend will automatically handle the merge
   */
  syncAfterLogin: async () => {
    // Just reload cart - backend already merged session cart to user cart
    await get().loadCart();

    // Clear session ID since we're now logged in
    cartService.clearSessionId();
  },
}));
