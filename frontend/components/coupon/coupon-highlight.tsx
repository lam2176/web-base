"use client";

import { useEffect, useMemo, useState } from "react";
import { Gift, ArrowRight, Clock } from "lucide-react";
import { Coupon } from "@/lib/types/api";
import CouponPromoModal from "./coupon-promo-modal";
import { usePromoStore } from "@/lib/stores/promo.store";

interface CouponHighlightProps {
  coupon: Coupon | null;
  locale: string;
}

const formatDate = (value: string, locale: string) => {
  if (!value) return "";
  try {
    const date = new Date(value);
    return new Intl.DateTimeFormat(locale === "vi" ? "vi-VN" : "en-US", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    }).format(date);
  } catch {
    return value;
  }
};

export default function CouponHighlight({ coupon, locale }: CouponHighlightProps) {
  const [showModal, setShowModal] = useState(false);
  const [hasShown, setHasShown] = useState(false);
  const [countdown, setCountdown] = useState("");
  const setAutoCoupon = usePromoStore((state) => state.setAutoCoupon);
  const clearAutoCoupon = usePromoStore((state) => state.clearAutoCoupon);
  const autoCouponCode = usePromoStore((state) => state.autoCouponCode);

  const { isActiveNow, showCountdown } = useMemo(() => {
    if (!coupon) {
      return { isActiveNow: false, showCountdown: false };
    }
    const now = Date.now();
    const start = new Date(coupon.startDate).getTime();
    const end = new Date(coupon.endDate).getTime();
    const active = now >= start && now <= end;
    const withinTwoDays = active && end - now <= 2 * 24 * 60 * 60 * 1000;
    return { isActiveNow: active, showCountdown: withinTwoDays };
  }, [coupon]);

  useEffect(() => {
    if (!coupon) {
      clearAutoCoupon();
      return;
    }

    if (isActiveNow) {
      setAutoCoupon(coupon);
    } else if (autoCouponCode === coupon.code) {
      clearAutoCoupon();
    }

    if (!showCountdown) {
      setCountdown("");
      return;
    }

    const endTime = new Date(coupon.endDate).getTime();

    const updateCountdown = () => {
      const diff = Math.max(0, endTime - Date.now());
      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);
      setCountdown(`${hours.toString().padStart(2, "0")}h:${minutes
        .toString()
        .padStart(2, "0")}m:${seconds.toString().padStart(2, "0")}s`);
      if (diff <= 0) {
        clearAutoCoupon();
      }
    };

    updateCountdown();
    const timer = setInterval(updateCountdown, 1000);
    return () => clearInterval(timer);
  }, [coupon, isActiveNow, showCountdown, setAutoCoupon, clearAutoCoupon, autoCouponCode]);

  useEffect(() => {
    if (!coupon) return;

    // Kiểm tra localStorage xem đã xem popup chưa
    const hasSeenPopup = localStorage.getItem(`coupon-popup-${coupon.id}`);
    
    if (!hasSeenPopup && !hasShown) {
      setShowModal(true);
      setHasShown(true);
    }
  }, [coupon, hasShown]);

  const handleCloseModal = () => {
    setShowModal(false);
    // Lưu vào localStorage để không hiển thị lại khi load lại trang
    if (coupon) {
      localStorage.setItem(`coupon-popup-${coupon.id}`, 'true');
    }
  };

  if (!coupon) {
    return null;
  }

  return (
    <>
      <section className="absolute inset-x-0 top-0 z-30">
        <div className="flex w-full flex-col gap-2 bg-white/95 px-4 py-2 text-gray-900 shadow md:flex-row md:items-center md:justify-between md:px-10 md:py-3">
          <div className="space-y-1 text-gray-900">
            <p className="inline-flex items-center gap-2 rounded-full bg-[#ff4d4d]/10 px-3 py-0.5 text-[11px] font-semibold uppercase tracking-[0.2em] text-[#ff4d4d]">
              <Gift className="h-3.5 w-3.5" />
              {locale === "vi" ? "Ưu đãi hot" : "Hot promotion"}
            </p>
            <div className="text-sm font-semibold md:text-base">
              {locale === "vi" ? coupon.nameVi : coupon.nameEn}
            </div>
            <p className="text-xs text-gray-600">
              {locale === "vi"
                ? "Nhấn để xem chi tiết và nhận mã ưu đãi."
                : "Tap to view details and grab the code."}
            </p>
          </div>
          <div className="flex flex-col gap-2 text-xs text-gray-600 md:text-sm">
            <button
              onClick={() => setShowModal(true)}
              className="group inline-flex items-center justify-center rounded-xl bg-[#ff4d4d] px-4 py-2 text-xs font-semibold text-white transition hover:scale-[1.02]"
            >
              {locale === "vi" ? "Xem khuyến mãi" : "View promotion"}
              <ArrowRight className="ml-2 h-4 w-4 transition group-hover:translate-x-1" />
            </button>
          </div>
        </div>
      </section>

      <CouponPromoModal
        coupon={coupon}
        locale={locale}
        open={showModal}
        onClose={handleCloseModal}
        autoApplied={isActiveNow}
        countdownText={showCountdown ? countdown : undefined}
      />
    </>
  );
}
