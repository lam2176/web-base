import axios, { AxiosError, AxiosInstance, InternalAxiosRequestConfig } from 'axios';
import http from 'http';
import https from 'https';

// Use 127.0.0.1 instead of localhost to avoid IPv6 issues
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:3027/api';

// Create axios instance
export const apiClient: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
  // Enable credentials to send cookies with requests
  withCredentials: true,
  // Force IPv4 to avoid ECONNREFUSED on ::1
  httpAgent: new http.Agent({ family: 4 }),
  httpsAgent: new https.Agent({ family: 4 }),
});

// Request interceptor
apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    // Get token from localStorage (support both admin and customer)
    if (typeof window !== 'undefined') {
      // Determine if admin or customer based on URL
      const isAdminRequest = config.url?.startsWith('/auth') ||
                            config.url?.startsWith('/admin');

      const tokenKey = isAdminRequest ? 'admin_accessToken' : 'customer_accessToken';
      let token = localStorage.getItem(tokenKey);

      // Fallback to customer auth storage if customer token not found
      if (!isAdminRequest && !token) {
        try {
          const authStorage = localStorage.getItem('customer-auth-storage');
          if (authStorage) {
            const { state } = JSON.parse(authStorage);
            token = state?.accessToken;
          }
        } catch {
          // Silent fail - auth storage parsing failed
        }
      }

      // Set Authorization header if token exists
      if (token && config.headers) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
    return config;
  },
  (error: AxiosError) => {
    return Promise.reject(error);
  }
);

// Helper function to determine login path based on current location
const getLoginPath = (): string => {
  if (typeof window !== 'undefined') {
    const currentPath = window.location.pathname;
    if (currentPath.startsWith('/admin')) {
      return '/admin/login';
    }
    return '/';
  }
  return '/';
};

// Response interceptor
apiClient.interceptors.response.use(
  (response) => {
    return response;
  },
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

    // Handle 440 - Refresh token expired
    if (error.response?.status === 440) {
      // Clear all auth data and redirect to login
      if (typeof window !== 'undefined') {
        const pathname = window.location.pathname;
        const isAdmin = pathname.includes('/admin');

        if (isAdmin) {
          localStorage.removeItem('admin_accessToken');
          localStorage.removeItem('admin_user');
          localStorage.removeItem('auth-storage');

          // Extract locale from pathname (e.g., /vi/admin -> vi)
          const localeMatch = pathname.match(/^\/(vi|en)\//);
          const locale = localeMatch ? localeMatch[1] : 'vi';
          const loginUrl = `/${locale}/admin/login`;
          window.location.href = loginUrl;
        } else {
          localStorage.removeItem('customer_accessToken');
          localStorage.removeItem('customer_user');
          localStorage.removeItem('customer-auth-storage');
          window.location.href = '/';
        }
      }
      return Promise.reject(error);
    }

    // Handle 401 - Try to refresh token
    if (error.response?.status === 401 && !originalRequest._retry) {
      // Don't retry if the original request was login, register, or refresh
      const skipRefreshUrls = ['/auth/login', '/auth/refresh', '/customer-auth/login', '/customer-auth/register', '/customer-auth/refresh'];
      if (skipRefreshUrls.some(url => originalRequest.url?.includes(url))) {
        return Promise.reject(error);
      }

      originalRequest._retry = true;

      try {
        const isAdminRequest = originalRequest.url?.startsWith('/auth') ||
                              originalRequest.url?.startsWith('/admin');

        // Call appropriate refresh endpoint (cookie is sent automatically)
        const refreshEndpoint = isAdminRequest ? '/auth/refresh' : '/customer-auth/refresh';
        const response = await axios.post(`${API_BASE_URL}${refreshEndpoint}`, {}, {
          withCredentials: true, // Important: send cookies with the request
        });

        const { accessToken } = response.data.data || response.data;
        const tokenKey = isAdminRequest ? 'admin_accessToken' : 'customer_accessToken';

        // Save new access token
        localStorage.setItem(tokenKey, accessToken);

        // Update customer auth storage if customer
        if (!isAdminRequest) {
          const authStorage = localStorage.getItem('customer-auth-storage');
          if (authStorage) {
            const { state } = JSON.parse(authStorage);
            const updatedState = {
              ...state,
              accessToken,
            };
            localStorage.setItem('customer-auth-storage', JSON.stringify({
              state: updatedState,
              version: 0,
            }));
          }
        }

        // Retry original request with new token
        if (originalRequest.headers) {
          originalRequest.headers.Authorization = `Bearer ${accessToken}`;
        }
        return apiClient(originalRequest);
      } catch (refreshError: any) {
        // If refresh fails with 440, handle it immediately
        if (refreshError.response?.status === 440) {
          // Clear all auth data and redirect to login
          if (typeof window !== 'undefined') {
            const pathname = window.location.pathname;
            const isAdmin = pathname.includes('/admin');

            if (isAdmin) {
              localStorage.removeItem('admin_accessToken');
              localStorage.removeItem('admin_user');
              localStorage.removeItem('auth-storage');

              // Extract locale from pathname (e.g., /vi/admin -> vi)
              const localeMatch = pathname.match(/^\/(vi|en)\//);
              const locale = localeMatch ? localeMatch[1] : 'vi';
              const loginUrl = `/${locale}/admin/login`;
              window.location.href = loginUrl;
            } else {
              localStorage.removeItem('customer_accessToken');
              localStorage.removeItem('customer_user');
              localStorage.removeItem('customer-auth-storage');
              window.location.href = '/';
            }
          }
        }

        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

export default apiClient;
