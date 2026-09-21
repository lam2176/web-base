import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';
import { ApiError } from '@/types';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api';

// Helper function to clear all auth data
const clearAuthData = () => {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');
    // Clear zustand persisted state
    localStorage.removeItem('auth-storage');
  }
};

// Create axios instance
const axiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor - Add auth token
axiosInstance.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    // Get token from localStorage (only on client side)
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('accessToken');
      if (token && config.headers) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Helper function to determine login page based on current path
const getLoginPath = (): string => {
  if (typeof window !== 'undefined') {
    const currentPath = window.location.pathname;
    // If currently in admin area, redirect to admin login
    if (currentPath.startsWith('/admin')) {
      return '/admin/login';
    }
    // Otherwise redirect to customer login (if you have one) or home
    return '/';
  }
  return '/';
};

// Response interceptor - Handle token refresh
axiosInstance.interceptors.response.use(
  (response) => {
    return response;
  },
  async (error: AxiosError<ApiError>) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

    // Handle 440 - Refresh token expired (session expired)
    if (error.response?.status === 440) {
      // Clear all auth data and redirect to login
      clearAuthData();
      if (typeof window !== 'undefined') {
        const pathname = window.location.pathname;
        const isAdmin = pathname.includes('/admin');

        if (isAdmin) {
          // Extract locale from pathname (e.g., /vi/admin -> vi)
          const localeMatch = pathname.match(/^\/(vi|en)\//);
          const locale = localeMatch ? localeMatch[1] : 'vi';
          const loginUrl = `/${locale}/admin/login`;
          window.location.href = loginUrl;
        } else {
          window.location.href = '/';
        }
      }
      return Promise.reject(error);
    }

    // Handle 401 Unauthorized - Token expired
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        // Get refresh token from localStorage
        const refreshToken = typeof window !== 'undefined'
          ? localStorage.getItem('refreshToken')
          : null;

        if (!refreshToken) {
          // No refresh token, clear all auth data and redirect to appropriate login page
          clearAuthData();
          if (typeof window !== 'undefined') {
            const loginPath = getLoginPath();
            window.location.href = loginPath;
          }
          return Promise.reject(error);
        }

        // Call refresh token endpoint
        const response = await axios.post(`${API_BASE_URL}/auth/refresh`, {
          refreshToken,
        });

        const { accessToken, refreshToken: newRefreshToken } = response.data;

        // Save new tokens
        if (typeof window !== 'undefined') {
          localStorage.setItem('accessToken', accessToken);
          localStorage.setItem('refreshToken', newRefreshToken);
        }

        // Retry original request with new token
        if (originalRequest.headers) {
          originalRequest.headers.Authorization = `Bearer ${accessToken}`;
        }

        return axiosInstance(originalRequest);
      } catch (refreshError) {
        // Refresh token failed, clear all auth data and redirect to appropriate login page
        clearAuthData();
        if (typeof window !== 'undefined') {
          const loginPath = getLoginPath();
          window.location.href = loginPath;
        }
        return Promise.reject(refreshError);
      }
    }

    // Handle other errors
    const apiError: ApiError = {
      message: error.response?.data?.message || error.message || 'An error occurred',
      statusCode: error.response?.status || 500,
      errors: error.response?.data?.errors,
    };

    return Promise.reject(apiError);
  }
);

export default axiosInstance;

// Helper function to handle API errors
export const handleApiError = (error: unknown): string => {
  if (axios.isAxiosError(error)) {
    const apiError = error as AxiosError<ApiError>;
    return apiError.response?.data?.message || error.message || 'An error occurred';
  }
  if (error instanceof Error) {
    return error.message;
  }
  return 'An unknown error occurred';
};

// Helper function to get error details
export const getErrorDetails = (error: unknown): ApiError => {
  if (axios.isAxiosError(error)) {
    const apiError = error as AxiosError<ApiError>;
    return {
      message: apiError.response?.data?.message || error.message || 'An error occurred',
      statusCode: apiError.response?.status || 500,
      errors: apiError.response?.data?.errors,
    };
  }
  if (error instanceof Error) {
    return {
      message: error.message,
      statusCode: 500,
    };
  }
  return {
    message: 'An unknown error occurred',
    statusCode: 500,
  };
};
