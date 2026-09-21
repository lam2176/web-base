import axiosInstance from '../axios';
import { CartCalculateRequest, CartCalculateResponse } from '@/types';

// Calculate cart totals
export const calculateCart = async (
  data: CartCalculateRequest
): Promise<CartCalculateResponse> => {
  const response = await axiosInstance.post<CartCalculateResponse>('/cart/calculate', data);
  return response.data;
};

// Validate cart items (check stock availability)
export const validateCartItems = async (
  items: Array<{
    productId: string;
    variantId?: string;
    quantity: number;
  }>
): Promise<{
  valid: boolean;
  errors: Array<{
    productId: string;
    variantId?: string;
    message: string;
  }>;
}> => {
  const response = await axiosInstance.post('/cart/validate', { items });
  return response.data;
};

// Apply voucher code
export const applyVoucher = async (
  code: string,
  cartTotal: number
): Promise<{
  valid: boolean;
  discountAmount: number;
  message?: string;
}> => {
  const response = await axiosInstance.post('/cart/apply-voucher', {
    code,
    cartTotal,
  });
  return response.data;
};
