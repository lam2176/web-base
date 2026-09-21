"use client";

import { Coupon } from "@/lib/types/api";
import { usePromoStore } from "@/lib/stores/promo.store";
import { useEffect } from "react";

interface AnnouncementBarProps {
  coupon: Coupon | null;
  locale: string;
}

export default function AnnouncementBar({ coupon, locale }: AnnouncementBarProps) {
  const setAutoCoupon = usePromoStore((state) => state.setAutoCoupon);

  // Set coupon to store when component mounts
  useEffect(() => {
    if (coupon) {
      const now = Date.now();
      const start = new Date(coupon.startDate).getTime();
      const end = new Date(coupon.endDate).getTime();
      if (now >= start && now <= end) {
        setAutoCoupon(coupon);
      }
    }
  }, [coupon, setAutoCoupon]);

  if (!coupon) {
    return null;
  }

  // Check if coupon is currently active
  const now = Date.now();
  const start = new Date(coupon.startDate).getTime();
  const end = new Date(coupon.endDate).getTime();
  const isActive = now >= start && now <= end;

  if (!isActive) {
    return null;
  }

  // Format discount text
  const discountText = coupon.discountType === "percentage"
    ? `${coupon.discountValue}%`
    : `${Number(coupon.discountValue).toLocaleString(locale === "vi" ? "vi-VN" : "en-US")}`;

  const promoName = locale === "vi" ? coupon.nameVi : coupon.nameEn;

  return (
    <div className="w-full bg-[#9a8b7c] py-2 text-center">
      <p className="text-sm font-medium text-white">
        {promoName || (locale === "vi"
          ? `Giảm ${discountText} cho đơn hàng`
          : `${discountText} OFF`)}
      </p>
    </div>
  );
}
