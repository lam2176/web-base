"use client";

import { useMemo } from "react";
import Link from "next/link";
import { X, Sparkles, TicketPercent } from "lucide-react";
import { Coupon } from "@/lib/types/api";
import { Button } from "@/components/ui/button";
import { useCurrency } from "@/lib/hooks/useCurrency";

interface CouponPromoModalProps {
  coupon: Coupon | null;
  locale: string;
  open: boolean;
  onClose?: () => void;
  autoApplied?: boolean;
  countdownText?: string;
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

export default function CouponPromoModal({
  coupon,
  locale,
  open,
  onClose,
  autoApplied = false,
  countdownText,
}: CouponPromoModalProps) {
  const { formatPrice } = useCurrency();

  const discountDisplay = useMemo(() => {
    if (!coupon) return "";
    if (coupon.discountType === "percentage") {
      return `${parseFloat(coupon.discountValue)}%`;
    }
    return formatPrice(parseFloat(coupon.discountValue));
  }, [coupon, formatPrice]);

  if (!coupon || !open) {
    return null;
  }

  const heading = locale === "vi" ? "Đại tiệc ưu đãi" : "Mega discount event";
  const subheading =
    locale === "vi"
      ? "Chương trình giảm giá đang diễn ra"
      : "Limited-time discount program";
  const ctaText = locale === "vi" ? "Mua hàng ngay" : "Shop now";
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4 py-6">
      <div className="relative w-full max-w-md overflow-hidden rounded-2xl bg-gradient-to-br from-[#ff8640] via-[#ff4d4d] to-[#ff0f7b] shadow-2xl">
        <button
          className="absolute right-4 top-4 z-10 rounded-full bg-white/20 p-1.5 text-white transition hover:bg-white/30"
          onClick={() => onClose?.()}
          aria-label="Close promotion"
        >
          <X className="h-4 w-4" />
        </button>

        <div className="pointer-events-none absolute -right-24 -top-24 h-64 w-64 rounded-full bg-white/10 blur-3xl" />
        <div className="pointer-events-none absolute -left-16 -bottom-16 h-48 w-48 rounded-full bg-white/10 blur-2xl" />

        <div className="relative flex flex-col gap-4 px-6 py-6 text-white">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-white/70">
            <Sparkles className="h-3.5 w-3.5" />
            {locale === "vi" ? "Chương trình giảm giá" : "Discount program"}
          </div>

          {autoApplied && (
            <div className="rounded-xl bg-black/30 px-3 py-1.5 text-xs font-semibold text-white">
              {locale === "vi"
                ? "Mã ưu đãi đã được áp dụng tự động cho đơn hàng của bạn."
                : "This coupon is automatically applied to your order."}
            </div>
          )}

          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-white/70">
              {subheading}
            </p>
            <h2 className="mt-2 text-3xl font-black leading-tight">
              {heading}
            </h2>
          </div>

          <div className="grid gap-3 rounded-xl bg-white/10 p-4 backdrop-blur md:grid-cols-2">
            <div className="rounded-xl border border-white/30 px-3 py-2.5 text-white">
              <p className="text-[10px] uppercase text-white/70">
                {locale === "vi" ? "Tên chương trình" : "Program name"}
              </p>
              <p className="text-base font-semibold mt-0.5">
                {locale === "vi" ? coupon.nameVi : coupon.nameEn}
              </p>
            </div>
            <div className="rounded-xl border border-white/30 bg-white/90 px-3 py-2.5 text-center text-gray-900 shadow-lg">
              <p className="text-[10px] uppercase tracking-wide text-gray-500">
                {locale === "vi" ? "Ưu đãi" : "Discount"}
              </p>
              <div className="flex items-center justify-center gap-2 mt-0.5">
                <TicketPercent className="h-5 w-5 text-[#ff4d4d]" />
                <p className="text-2xl font-black text-[#f31260]">
                  {discountDisplay}
                </p>
              </div>
            </div>

            {countdownText ? (
              <div className="col-span-2 rounded-xl border border-white/20 px-3 py-2.5 text-white text-center">
                <p className="text-[10px] uppercase text-white/70">
                  {locale === "vi" ? "Kết thúc" : "Countdown"}
                </p>
                <p className="text-xl font-black text-[#ffeb3b] tracking-wide mt-0.5">
                  {countdownText}
                </p>
              </div>
            ) : (
              <>
                <div className="rounded-xl border border-white/20 px-3 py-2.5 text-white text-center">
                  <p className="text-[10px] uppercase text-white/70">
                    {locale === "vi" ? "Bắt đầu" : "Start"}
                  </p>
                  <p className="text-sm font-semibold mt-0.5">
                    {formatDate(coupon.startDate, locale)}
                  </p>
                </div>
                <div className="rounded-xl border border-white/20 px-3 py-2.5 text-white text-center">
                  <p className="text-[10px] uppercase text-white/70">
                    {locale === "vi" ? "Kết thúc" : "End date"}
                  </p>
                  <p className="text-sm font-semibold mt-0.5">
                    {formatDate(coupon.endDate, locale)}
                  </p>
                </div>
              </>
            )}

            <div className="col-span-2 rounded-xl bg-black/20 px-3 py-2.5 text-center text-white">
              <p className="text-[10px] uppercase tracking-wide text-white/70">
                {locale === "vi" ? "Mã ưu đãi" : "Coupon code"}
              </p>
              <p className="text-xl font-bold tracking-[0.3em] mt-0.5">
                {coupon.code}
              </p>
            </div>
          </div>

          <div className="flex flex-col gap-2 text-xs text-white/80">
            <p>
              {locale === "vi"
                ? "Áp dụng cho tất cả đơn hàng trong thời gian diễn ra chương trình."
                : "Applies to all orders during the promotion period."}
            </p>
            <p>
              {locale === "vi"
                ? "Số lượng có hạn, nhanh tay để không bỏ lỡ!"
                : "Limited quantity, grab it before it's gone!"}
            </p>
          </div>

          <div className="flex flex-col gap-3">
            <Link href={`/${locale}/products`}>
              <Button
                size="default"
                className="w-full rounded-xl border-0 bg-white text-base font-semibold text-[#ff4d4d] hover:bg-white/90"
              >
                {ctaText}
              </Button>
            </Link>
            {autoApplied && (
              <p className="text-center text-xs font-semibold uppercase tracking-wide text-white/80">
                {locale === "vi"
                  ? "Mã đã được áp dụng tự động cho đơn hàng của bạn"
                  : "Code auto-applied to your order"}
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
