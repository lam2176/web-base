import axiosInstance from '../axios';
import {
  LoginRequest,
  RegisterRequest,
  AuthResponse,
  TokenResponse,
  User,
} from '@/types';

// Login
export const login = async (credentials: LoginRequest): Promise<AuthResponse> => {
  const response = await axiosInstance.post<AuthResponse>('/auth/login', credentials);
  return response.data;
};

// Register
export const register = async (data: RegisterRequest): Promise<AuthResponse> => {
  const response = await axiosInstance.post<AuthResponse>('/auth/register', data);
  return response.data;
};

// Refresh token
export const refreshToken = async (refreshToken: string): Promise<TokenResponse> => {
  const response = await axiosInstance.post<TokenResponse>('/auth/refresh', {
    refreshToken,
  });
  return response.data;
};

// Logout
export const logout = async (): Promise<void> => {
  await axiosInstance.post('/auth/logout');
};

// Get current user profile
export const getCurrentUser = async (): Promise<User> => {
  const response = await axiosInstance.get<User>('/auth/me');
  return response.data;
};

// Update user profile
export const updateProfile = async (data: Partial<User>): Promise<User> => {
  const response = await axiosInstance.patch<User>('/auth/profile', data);
  return response.data;
};

// Change password
export const changePassword = async (data: {
  currentPassword: string;
  newPassword: string;
}): Promise<void> => {
  await axiosInstance.post('/auth/change-password', data);
};

// Request password reset
export const requestPasswordReset = async (email: string): Promise<void> => {
  await axiosInstance.post('/auth/forgot-password', { email });
};

// Reset password
export const resetPassword = async (data: {
  token: string;
  newPassword: string;
}): Promise<void> => {
  await axiosInstance.post('/auth/reset-password', data);
};
