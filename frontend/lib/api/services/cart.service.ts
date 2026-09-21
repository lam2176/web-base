import apiClient from '../client';
import { ApiResponse, CalculateCartDto, CartCalculation } from '@/lib/types/api';

export interface CartItemDto {
  id: number;
  cartId: number;
  productId: number;
  variantId?: number;
  quantity: number;
  productName: string;
  variantName?: string;
  price: string;
  image?: string;
  slug?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CartDto {
  id: number;
  userId?: number;
  sessionId?: string;
  items: CartItemDto[];
  createdAt: string;
  updatedAt: string;
}

export interface AddToCartDto {
  productId: number;
  variantId?: number;
  quantity: number;
}

export interface UpdateCartItemDto {
  quantity: number;
}

// Generate a unique session ID for guest users
const getOrCreateSessionId = (): string => {
  if (typeof window === 'undefined') return '';

  let sessionId = localStorage.getItem('cart-session-id');
  if (!sessionId) {
    sessionId = `session_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
    localStorage.setItem('cart-session-id', sessionId);
  }
  return sessionId;
};

export const cartService = {
  /**
   * Calculate cart totals
   */
  calculate: async (data: CalculateCartDto): Promise<CartCalculation> => {
    const response = await apiClient.post<ApiResponse<CartCalculation>>('/cart/calculate', data);
    return response.data.data!;
  },

  /**
   * Get cart from backend
   */
  getCart: async (): Promise<CartDto> => {
    const sessionId = getOrCreateSessionId();
    const response = await apiClient.get<ApiResponse<CartDto>>('/cart', {
      headers: {
        'X-Session-Id': sessionId,
      },
    });
    return response.data.data!;
  },

  /**
   * Add item to cart on backend
   */
  addToCart: async (data: AddToCartDto): Promise<CartItemDto> => {
    const sessionId = getOrCreateSessionId();
    const response = await apiClient.post<ApiResponse<CartItemDto>>('/cart/items', data, {
      headers: {
        'X-Session-Id': sessionId,
      },
    });
    return response.data.data!;
  },

  /**
   * Update cart item quantity on backend
   */
  updateCartItem: async (itemId: number, data: UpdateCartItemDto): Promise<CartItemDto> => {
    const sessionId = getOrCreateSessionId();
    const response = await apiClient.put<ApiResponse<CartItemDto>>(
      `/cart/items/${itemId}`,
      data,
      {
        headers: {
          'X-Session-Id': sessionId,
        },
      }
    );
    return response.data.data!;
  },

  /**
   * Remove item from cart on backend
   */
  removeCartItem: async (itemId: number): Promise<void> => {
    const sessionId = getOrCreateSessionId();
    await apiClient.delete(`/cart/items/${itemId}`, {
      headers: {
        'X-Session-Id': sessionId,
      },
    });
  },

  /**
   * Clear cart on backend
   */
  clearCart: async (): Promise<void> => {
    const sessionId = getOrCreateSessionId();
    await apiClient.delete('/cart', {
      headers: {
        'X-Session-Id': sessionId,
      },
    });
  },

  /**
   * Sync local cart to backend (called after login/register)
   */
  syncLocalCartToBackend: async (localItems: Array<{
    productId: number;
    variantId?: number;
    quantity: number;
  }>): Promise<CartDto> => {
    // Add each local item to backend cart
    for (const item of localItems) {
      await cartService.addToCart(item);
    }

    // Get updated cart
    return await cartService.getCart();
  },

  /**
   * Get session ID
   */
  getSessionId: (): string => {
    return getOrCreateSessionId();
  },

  /**
   * Clear session ID (called after successful sync)
   */
  clearSessionId: (): void => {
    if (typeof window === 'undefined') return;
    localStorage.removeItem('cart-session-id');
  },
};
