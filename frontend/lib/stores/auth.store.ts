import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { User, LoginDto } from '@/lib/types/api';
import { authService } from '@/lib/api/services/auth.service';

interface AuthState {
  user: User | null;
  accessToken: string | null;
  // refreshToken is now in HTTP-only cookie (removed from state)
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;

  // Actions
  login: (data: LoginDto) => Promise<void>;
  logout: () => Promise<void>;
  refreshAuth: () => Promise<void>;
  setUser: (user: User | null) => void;
  clearError: () => void;
  checkAuth: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      accessToken: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,

      login: async (data: LoginDto) => {
        set({ isLoading: true, error: null });
        try {
          const response = await authService.login(data);
          set({
            user: response.user,
            accessToken: response.accessToken,
            // refreshToken is in cookie, not stored in state
            isAuthenticated: true,
            isLoading: false,
          });
        } catch (error: any) {
          set({
            error: error.response?.data?.message || 'Login failed',
            isLoading: false,
          });
          throw error;
        }
      },

      logout: async () => {
        set({ isLoading: true, error: null });
        try {
          await authService.logout();
          set({
            user: null,
            accessToken: null,
            isAuthenticated: false,
            isLoading: false,
          });
        } catch (error: any) {
          set({
            error: error.response?.data?.message || 'Logout failed',
            isLoading: false,
          });
          throw error;
        }
      },

      refreshAuth: async () => {
        try {
          // No need to check refreshToken - it's in cookie
          const response = await authService.refreshToken();
          set({
            accessToken: response.accessToken,
            user: response.user,
            isAuthenticated: true,
          });
        } catch (error: unknown) {
          set({
            user: null,
            accessToken: null,
            isAuthenticated: false,
          });
          throw error;
        }
      },

      setUser: (user: User | null) => {
        set({ user });
      },

      clearError: () => {
        set({ error: null });
      },

      checkAuth: () => {
        const isAuthenticated = authService.isAuthenticated();
        if (!isAuthenticated) {
          set({
            user: null,
            accessToken: null,
            isAuthenticated: false,
          });
        } else {
          const user = authService.getCurrentUser();
          const token = authService.getToken();
          set({
            user: user || null,
            accessToken: token,
            isAuthenticated: true,
          });
        }
      },
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        user: state.user,
        accessToken: state.accessToken,
        // Don't persist refreshToken (it's in cookie)
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);
