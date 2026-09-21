import apiClient from '../client';
import { ApiResponse, CreateOrderDto, Order } from '@/lib/types/api';

export const orderService = {
  /**
   * Create new order (public)
   */
  create: async (data: CreateOrderDto): Promise<Order> => {
    const response = await apiClient.post<ApiResponse<Order>>('/orders', data);
    return response.data.data!;
  },
};
