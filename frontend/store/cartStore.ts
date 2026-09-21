import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { CartItem, Product, ProductVariant } from '@/types';

interface CartState {
  items: CartItem[];
  isLoading: boolean;
  error: string | null;
}

interface CartActions {
  addItem: (
    product: Product,
    quantity?: number,
    variant?: ProductVariant
  ) => void;
  removeItem: (productId: string, variantId?: string) => void;
  updateQuantity: (productId: string, quantity: number, variantId?: string) => void;
  clearCart: () => void;
  getTotalItems: () => number;
  getSubtotal: () => number;
  getItemCount: (productId: string, variantId?: string) => number;
  isInCart: (productId: string, variantId?: string) => boolean;
  setError: (error: string | null) => void;
}

type CartStore = CartState & CartActions;

export const useCartStore = create<CartStore>()(
  persist(
    (set, get) => ({
      // Initial state
      items: [],
      isLoading: false,
      error: null,

      // Actions
      addItem: (product, quantity = 1, variant) => {
        const { items } = get();
        const existingItemIndex = items.findIndex(
          (item) =>
            item.productId === product.id &&
            item.variantId === variant?.id
        );

        if (existingItemIndex > -1) {
          // Item already in cart, update quantity
          const newItems = [...items];
          newItems[existingItemIndex].quantity += quantity;
          set({ items: newItems });
        } else {
          // Add new item
          const newItem: CartItem = {
            productId: product.id,
            variantId: variant?.id,
            quantity,
            product,
            variant,
          };
          set({ items: [...items, newItem] });
        }
      },

      removeItem: (productId, variantId) => {
        const { items } = get();
        const newItems = items.filter(
          (item) =>
            !(item.productId === productId && item.variantId === variantId)
        );
        set({ items: newItems });
      },

      updateQuantity: (productId, quantity, variantId) => {
        const { items } = get();

        if (quantity <= 0) {
          // Remove item if quantity is 0 or negative
          get().removeItem(productId, variantId);
          return;
        }

        const newItems = items.map((item) =>
          item.productId === productId && item.variantId === variantId
            ? { ...item, quantity }
            : item
        );
        set({ items: newItems });
      },

      clearCart: () => {
        set({ items: [], error: null });
      },

      getTotalItems: () => {
        const { items } = get();
        return items.reduce((total, item) => total + item.quantity, 0);
      },

      getSubtotal: () => {
        const { items } = get();
        return items.reduce((total, item) => {
          const price = item.variant?.price || item.product?.price || 0;
          return total + price * item.quantity;
        }, 0);
      },

      getItemCount: (productId, variantId) => {
        const { items } = get();
        const item = items.find(
          (item) =>
            item.productId === productId && item.variantId === variantId
        );
        return item?.quantity || 0;
      },

      isInCart: (productId, variantId) => {
        const { items } = get();
        return items.some(
          (item) =>
            item.productId === productId && item.variantId === variantId
        );
      },

      setError: (error) => {
        set({ error });
      },
    }),
    {
      name: 'cart-storage',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        items: state.items,
      }),
    }
  )
);
