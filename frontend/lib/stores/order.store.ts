import { create } from 'zustand';
import { Order, CreateOrderDto } from '@/lib/types/api';
import { orderService } from '@/lib/api/services/order.service';

interface OrderState {
  orders: Order[];
  currentOrder: Order | null;
  isLoading: boolean;
  error: string | null;

  // Actions
  fetchOrders: () => Promise<void>;
  fetchOrderById: (id: number) => Promise<void>;
  createOrder: (data: CreateOrderDto) => Promise<Order>;
  clearCurrentOrder: () => void;
  clearError: () => void;
}

export const useOrderStore = create<OrderState>((set) => ({
  orders: [],
  currentOrder: null,
  isLoading: false,
  error: null,

  fetchOrders: async () => {
    set({ isLoading: true, error: null });
    try {
      // Note: This would need backend API implementation
      // const orders = await orderService.getMyOrders();
      set({
        orders: [],
        isLoading: false,
      });
    } catch (error: unknown) {
      set({
        error: error instanceof Error ? error.message : 'Failed to fetch orders',
        isLoading: false,
      });
      throw error;
    }
  },

  fetchOrderById: async (id: number) => {
    set({ isLoading: true, error: null });
    try {
      // Note: This would need backend API implementation
      // const order = await orderService.getById(id);
      set({
        currentOrder: null,
        isLoading: false,
      });
    } catch (error: unknown) {
      set({
        error: error instanceof Error ? error.message : 'Failed to fetch order',
        isLoading: false,
      });
      throw error;
    }
  },

  createOrder: async (data: CreateOrderDto) => {
    set({ isLoading: true, error: null });
    try {
      const order = await orderService.create(data);
      set((state) => ({
        currentOrder: order,
        orders: [order, ...state.orders],
        isLoading: false,
      }));
      return order;
    } catch (error: unknown) {
      set({
        error: error instanceof Error ? error.message : 'Failed to create order',
        isLoading: false,
      });
      throw error;
    }
  },

  clearCurrentOrder: () => {
    set({ currentOrder: null });
  },

  clearError: () => {
    set({ error: null });
  },
}));
