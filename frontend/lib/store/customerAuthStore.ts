import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface Customer {
  id: number;
  email: string;
  fullName: string;
  phoneNumber?: string;
}

interface CustomerAuthState {
  customer: Customer | null;
  accessToken: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;

  // Actions
  setAuth: (customer: Customer, accessToken: string, refreshToken: string) => void;
  clearAuth: () => void;
  updateCustomer: (customer: Partial<Customer>) => void;
}

export const useCustomerAuthStore = create<CustomerAuthState>()(
  persist(
    (set, get) => ({
      customer: null,
      accessToken: null,
      refreshToken: null,
      isAuthenticated: false,

      setAuth: (customer, accessToken, refreshToken) =>
        set({
          customer,
          accessToken,
          refreshToken,
          isAuthenticated: true,
        }),

      clearAuth: () =>
        set({
          customer: null,
          accessToken: null,
          refreshToken: null,
          isAuthenticated: false,
        }),

      updateCustomer: (updatedCustomer) =>
        set((state) => ({
          customer: state.customer
            ? { ...state.customer, ...updatedCustomer }
            : null,
        })),
    }),
    {
      name: 'customer-auth-storage',
      onRehydrateStorage: () => (state) => {
        // After rehydration, set isAuthenticated based on whether we have customer and token
        if (state && state.customer && state.accessToken) {
          state.isAuthenticated = true;
        }
      },
    }
  )
);
