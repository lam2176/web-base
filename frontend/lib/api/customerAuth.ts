import { apiClient } from './client';
import type { Customer } from '../store/customerAuthStore';

export interface RegisterData {
  email: string;
  password: string;
  fullName: string;
  phoneNumber?: string;
}

export interface LoginData {
  email: string;
  password: string;
}

export interface VerifyOtpData {
  email: string;
  otp: string;
}

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  customer: Customer;
  message?: string;
}

export interface MessageResponse {
  message: string;
  email?: string;
}

export const customerAuthApi = {
  /**
   * Register new customer account
   */
  register: async (data: RegisterData): Promise<MessageResponse> => {
    const response = await apiClient.post('/customer-auth/register', data);
    return response.data.data || response.data;
  },

  /**
   * Verify OTP and activate account
   */
  verifyOtp: async (data: VerifyOtpData): Promise<AuthResponse> => {
    const response = await apiClient.post('/customer-auth/verify-otp', data);
    return response.data.data || response.data;
  },

  /**
   * Resend OTP
   */
  resendOtp: async (email: string): Promise<MessageResponse> => {
    const response = await apiClient.post('/customer-auth/resend-otp', { email });
    return response.data.data || response.data;
  },

  /**
   * Customer login
   */
  login: async (data: LoginData): Promise<AuthResponse> => {
    const response = await apiClient.post('/customer-auth/login', data);
    return response.data.data || response.data;
  },

  /**
   * Request password reset OTP
   */
  forgotPassword: async (email: string): Promise<MessageResponse> => {
    const response = await apiClient.post('/customer-auth/forgot-password', { email });
    return response.data.data || response.data;
  },

  /**
   * Reset password with OTP
   */
  resetPassword: async (data: {
    email: string;
    otp: string;
    newPassword: string;
  }): Promise<MessageResponse> => {
    const response = await apiClient.post('/customer-auth/reset-password', data);
    return response.data.data || response.data;
  },
};

export const customerProfileApi = {
  /**
   * Get customer profile
   */
  getProfile: async (token: string): Promise<Customer> => {
    const response = await apiClient.get('/customer/profile', {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data.data || response.data;
  },

  /**
   * Update customer profile
   */
  updateProfile: async (
    token: string,
    data: { fullName?: string; phoneNumber?: string }
  ): Promise<Customer> => {
    const response = await apiClient.patch('/customer/profile', data, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data.data || response.data;
  },

  /**
   * Change password
   */
  changePassword: async (
    token: string,
    data: { currentPassword: string; newPassword: string }
  ): Promise<MessageResponse> => {
    const response = await apiClient.post('/customer/profile/change-password', data, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data.data || response.data;
  },

  /**
   * Deactivate account
   */
  deactivateAccount: async (token: string): Promise<MessageResponse> => {
    const response = await apiClient.delete('/customer/profile/deactivate', {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data.data || response.data;
  },

  /**
   * Get customer orders
   */
  getOrders: async (
    token: string,
    page = 1,
    limit = 10
  ): Promise<{
    data: any[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
  }> => {
    const response = await apiClient.get('/customer/profile/orders', {
      params: { page, limit },
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data.data || response.data;
  },

  /**
   * Get order by ID
   */
  getOrderById: async (token: string, orderId: number): Promise<{ data: any }> => {
    const response = await apiClient.get(`/customer/profile/orders/${orderId}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data;
  },
};

export interface Address {
  id: number;
  addressName?: string;
  fullName: string;
  phoneNumber: string;
  address: string;
  ward?: string;
  district?: string;
  province?: string;
  isDefault: boolean;
}

export interface CreateAddressData {
  addressName?: string;
  fullName: string;
  phoneNumber: string;
  address: string;
  ward?: string;
  district?: string;
  province?: string;
  isDefault?: boolean;
}

export const customerAddressApi = {
  /**
   * Get all addresses
   */
  getAll: async (token: string): Promise<Address[]> => {
    const response = await apiClient.get('/customer/addresses', {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data.data || response.data;
  },

  /**
   * Get default address
   */
  getDefault: async (token: string): Promise<Address | null> => {
    const response = await apiClient.get('/customer/addresses/default', {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data.data || response.data;
  },

  /**
   * Get address by ID
   */
  getById: async (token: string, id: number): Promise<Address> => {
    const response = await apiClient.get(`/customer/addresses/${id}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data.data || response.data;
  },

  /**
   * Create new address
   */
  create: async (token: string, data: CreateAddressData): Promise<Address> => {
    const response = await apiClient.post('/customer/addresses', data, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data.data || response.data;
  },

  /**
   * Update address
   */
  update: async (
    token: string,
    id: number,
    data: Partial<CreateAddressData>
  ): Promise<Address> => {
    const response = await apiClient.patch(`/customer/addresses/${id}`, data, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data.data || response.data;
  },

  /**
   * Set address as default
   */
  setDefault: async (token: string, id: number): Promise<Address> => {
    const response = await apiClient.patch(
      `/customer/addresses/${id}/set-default`,
      {},
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );
    return response.data.data || response.data;
  },

  /**
   * Delete address
   */
  delete: async (token: string, id: number): Promise<MessageResponse> => {
    const response = await apiClient.delete(`/customer/addresses/${id}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data.data || response.data;
  },
};
