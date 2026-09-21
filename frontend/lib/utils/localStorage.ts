/**
 * Utility for managing guest checkout information in localStorage
 */

export interface GuestCheckoutInfo {
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  address: string;
  ward?: string;
  district?: string;
  province?: string;
  notes?: string;
}

const GUEST_INFO_KEY = 'guest_checkout_info';

export const guestCheckoutStorage = {
  /**
   * Save guest checkout information
   */
  save: (info: GuestCheckoutInfo): void => {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem(GUEST_INFO_KEY, JSON.stringify(info));
    } catch (error) {
      console.error('Error saving guest checkout info:', error);
    }
  },

  /**
   * Get saved guest checkout information
   */
  get: (): GuestCheckoutInfo | null => {
    if (typeof window === 'undefined') return null;
    try {
      const data = localStorage.getItem(GUEST_INFO_KEY);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      console.error('Error reading guest checkout info:', error);
      return null;
    }
  },

  /**
   * Clear guest checkout information
   */
  clear: (): void => {
    if (typeof window === 'undefined') return;
    try {
      localStorage.removeItem(GUEST_INFO_KEY);
    } catch (error) {
      console.error('Error clearing guest checkout info:', error);
    }
  },

  /**
   * Check if guest has saved information
   */
  hasSavedInfo: (): boolean => {
    return guestCheckoutStorage.get() !== null;
  },
};
