"use client";

import { create } from 'zustand';
import { Coupon } from '@/lib/types/api';

interface PromoState {
  autoCouponCode: string | null;
  autoCouponExpiresAt: string | null;
  autoCoupon: Coupon | null;
  setAutoCoupon: (coupon: Coupon | null) => void;
  clearAutoCoupon: () => void;
}

export const usePromoStore = create<PromoState>((set) => ({
  autoCouponCode: null,
  autoCouponExpiresAt: null,
  autoCoupon: null,
  setAutoCoupon: (coupon) =>
    set({
      autoCouponCode: coupon?.code ?? null,
      autoCouponExpiresAt: coupon?.endDate ?? null,
      autoCoupon: coupon,
    }),
  clearAutoCoupon: () => set({ autoCouponCode: null, autoCouponExpiresAt: null, autoCoupon: null }),
}));

