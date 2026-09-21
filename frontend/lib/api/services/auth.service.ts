import apiClient from '../client';
import { ApiResponse, LoginDto, AuthResponse } from '@/lib/types/api';

export const authService = {
  /**
   * Login
   */
  login: async (data: LoginDto): Promise<AuthResponse> => {
    const response = await apiClient.post<ApiResponse<AuthResponse>>('/auth/login', data);
    const authData = response.data.data!;

    // Save access token and user to localStorage with admin prefix
    // Refresh token is now in HTTP-only cookie (managed by backend)
    localStorage.setItem('admin_accessToken', authData.accessToken);
    localStorage.setItem('admin_user', JSON.stringify(authData.user));

    return authData;
  },

  /**
   * Refresh token (no need to send refreshToken - it's in cookie)
   */
  refreshToken: async (): Promise<AuthResponse> => {
    const response = await apiClient.post<ApiResponse<AuthResponse>>('/auth/refresh');
    const authData = response.data.data!;

    // Update access token
    localStorage.setItem('admin_accessToken', authData.accessToken);

    return authData;
  },

  /**
   * Logout
   */
  logout: async (): Promise<void> => {
    try {
      await apiClient.post('/auth/logout'); // BE will clear cookie
    } finally {
      // Clear access token and user from localStorage
      localStorage.removeItem('admin_accessToken');
      localStorage.removeItem('admin_user');
      localStorage.removeItem('auth-storage'); // Clear zustand persisted state
    }
  },

  /**
   * Get current user from localStorage
   */
  getCurrentUser: () => {
    if (typeof window === 'undefined') return null;
    const userStr = localStorage.getItem('admin_user');
    return userStr ? JSON.parse(userStr) : null;
  },

  /**
   * Check if user is authenticated
   */
  isAuthenticated: (): boolean => {
    if (typeof window === 'undefined') return false;
    return !!localStorage.getItem('admin_accessToken');
  },

  /**
   * Check if user is admin
   */
  isAdmin: (): boolean => {
    const user = authService.getCurrentUser();
    return user?.role === 'admin';
  },

  /**
   * Get access token from localStorage
   */
  getToken: () => {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem('admin_accessToken');
  },
};
