import axiosInstance from '../axios';
import {
  CreateOrderRequest,
  Order,
  PaginatedResponse,
  ShippingMethod,
  PaymentMethod,
} from '@/types';

// Create new order
export const createOrder = async (data: CreateOrderRequest): Promise<Order> => {
  const response = await axiosInstance.post<Order>('/orders', data);
  return response.data;
};

// Get user's orders
export const getUserOrders = async (params?: {
  page?: number;
  limit?: number;
  status?: string;
}): Promise<PaginatedResponse<Order>> => {
  const response = await axiosInstance.get<PaginatedResponse<Order>>('/orders/my-orders', {
    params,
  });
  return response.data;
};

// Get order by ID
export const getOrderById = async (orderId: string): Promise<Order> => {
  const response = await axiosInstance.get<Order>(`/orders/${orderId}`);
  return response.data;
};

// Get order by order number
export const getOrderByNumber = async (orderNumber: string): Promise<Order> => {
  const response = await axiosInstance.get<{ data: Order }>(`/orders/number/${orderNumber}`);
  return response.data.data;
};

// Cancel order
export const cancelOrder = async (orderId: string, reason?: string): Promise<Order> => {
  const response = await axiosInstance.post<Order>(`/orders/${orderId}/cancel`, {
    reason,
  });
  return response.data;
};

// Track order
export const trackOrder = async (
  orderNumber: string
): Promise<{
  order: Order;
  tracking: Array<{
    status: string;
    message: string;
    timestamp: string;
  }>;
}> => {
  const response = await axiosInstance.get(`/orders/track/${orderNumber}`);
  return response.data;
};

// Get available shipping methods
export const getShippingMethods = async (): Promise<ShippingMethod[]> => {
  const response = await axiosInstance.get<ShippingMethod[]>('/orders/shipping-methods');
  return response.data;
};

// Get available payment methods
export const getPaymentMethods = async (): Promise<PaymentMethod[]> => {
  const response = await axiosInstance.get<PaymentMethod[]>('/orders/payment-methods');
  return response.data;
};

// Calculate shipping fee
export const calculateShippingFee = async (data: {
  shippingMethodId: string;
  province: string;
  district: string;
  ward: string;
  weight?: number;
}): Promise<{ fee: number }> => {
  const response = await axiosInstance.post<{ fee: number }>(
    '/orders/calculate-shipping',
    data
  );
  return response.data;
};
