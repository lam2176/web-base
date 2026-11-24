"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { QRCodeSVG } from "qrcode.react";
import { CheckCircle2, Loader2, QrCode, Smartphone } from "lucide-react";
import { getOrderByNumber, simulateOrderPayment } from "@/lib/api/endpoints";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useCurrency } from "@/lib/hooks/useCurrency";

// Demo: seconds before the "bank" confirms the transfer automatically
const AUTO_PAY_SECONDS = 15;
// How often to re-check the order, so a payment confirmed from a phone shows up here
const POLL_INTERVAL_MS = 4000;

interface QrPaymentOrder {
  orderNumber?: string;
  total: string | number;
  paymentStatus?: string;
}

interface QrPaymentCardProps<T extends QrPaymentOrder> {
  order: T;
  locale: string;
  onPaid: (order: T) => void;
}

export function QrPaymentCard<T extends QrPaymentOrder>({ order, locale, onPaid }: QrPaymentCardProps<T>) {
  const orderNumber = order.orderNumber ?? "";
  const vi = locale === "vi";
  const { formatPrice } = useCurrency();
  const [secondsLeft, setSecondsLeft] = useState(AUTO_PAY_SECONDS);
  const [paying, setPaying] = useState(false);
  const [error, setError] = useState("");
  const [payUrl, setPayUrl] = useState("");
  const payingRef = useRef(false);
  const isPaid = order.paymentStatus === "paid";

  useEffect(() => {
    setPayUrl(
      `${window.location.origin}/${locale}/checkout/pay?orderNumber=${encodeURIComponent(orderNumber)}`
    );
  }, [locale, orderNumber]);

  const pay = useCallback(async () => {
    if (payingRef.current) return;
    payingRef.current = true;
    setPaying(true);
    setError("");
    try {
      const updated = await simulateOrderPayment(orderNumber);
      onPaid(updated as unknown as T);
    } catch (err) {
      const message = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      setError(message || (vi ? "Thanh toán thất bại, vui lòng thử lại" : "Payment failed, please try again"));
    } finally {
      payingRef.current = false;
      setPaying(false);
    }
  }, [onPaid, orderNumber, vi]);

  // Countdown, then the simulated bank callback pays the order
  useEffect(() => {
    if (isPaid || error || !orderNumber) return;
    if (secondsLeft <= 0) {
      pay();
      return;
    }
    const timer = setTimeout(() => setSecondsLeft((s) => s - 1), 1000);
    return () => clearTimeout(timer);
  }, [error, isPaid, orderNumber, pay, secondsLeft]);

  // Pick up a payment confirmed from another device (the scanned QR page)
  useEffect(() => {
    if (isPaid || !orderNumber) return;
    const interval = setInterval(async () => {
      try {
        const latest = await getOrderByNumber(orderNumber);
        if (latest.paymentStatus === "paid") onPaid(latest as unknown as T);
      } catch {
        // Ignore transient errors; the next poll retries
      }
    }, POLL_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [isPaid, onPaid, orderNumber]);

  if (!orderNumber) return null;

  if (isPaid) {
    return (
      <Card className="mx-auto mt-6 max-w-md border-green-200 bg-green-50">
        <CardContent className="flex items-center gap-3 py-4 text-left">
          <CheckCircle2 className="h-8 w-8 shrink-0 text-green-600" />
          <div>
            <p className="font-bold text-green-800">{vi ? "Đã thanh toán" : "Payment received"}</p>
            <p className="text-sm text-green-700">
              {vi
                ? `Cửa hàng đã nhận ${formatPrice(Number(order.total))} cho đơn ${orderNumber}.`
                : `The store received ${formatPrice(Number(order.total))} for order ${orderNumber}.`}
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="mx-auto mt-6 max-w-md border-blue-200 bg-blue-50">
      <CardContent className="space-y-4 py-5">
        <div className="flex items-center justify-center gap-2 font-bold text-blue-900">
          <QrCode className="h-5 w-5" />
          {vi ? "Thanh toán bằng mã QR" : "Pay with QR code"}
        </div>

        <div className="mx-auto w-fit rounded-xl border-2 border-blue-200 bg-white p-3">
          {payUrl ? (
            <QRCodeSVG value={payUrl} size={192} level="M" />
          ) : (
            <div className="h-48 w-48" />
          )}
        </div>

        <div className="space-y-1 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">{vi ? "Số tiền" : "Amount"}</span>
            <span className="text-lg font-bold text-primary">{formatPrice(Number(order.total))}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">{vi ? "Nội dung" : "Reference"}</span>
            <code className="font-mono text-xs font-semibold">{orderNumber}</code>
          </div>
        </div>

        <p className="flex items-start gap-2 text-left text-xs text-blue-800">
          <Smartphone className="mt-0.5 h-4 w-4 shrink-0" />
          {vi
            ? "Quét mã bằng camera điện thoại để mở trang xác nhận thanh toán."
            : "Scan with your phone camera to open the payment confirmation page."}
        </p>

        {error ? (
          <p className="text-sm text-red-600">{error}</p>
        ) : (
          <div>
            <div className="mb-1 flex justify-between text-xs text-blue-800">
              <span>{vi ? "Đang chờ ngân hàng xác nhận..." : "Waiting for the bank..."}</span>
              <span>{vi ? `Tự động sau ${secondsLeft}s` : `Auto in ${secondsLeft}s`}</span>
            </div>
            <div className="h-1.5 overflow-hidden rounded-full bg-blue-100">
              <div
                className="h-full bg-blue-600 transition-all duration-1000 ease-linear"
                style={{ width: `${((AUTO_PAY_SECONDS - secondsLeft) / AUTO_PAY_SECONDS) * 100}%` }}
              />
            </div>
          </div>
        )}

        <Button className="w-full" onClick={pay} disabled={paying}>
          {paying && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {vi ? "Thanh toán ngay" : "Pay now"}
        </Button>

        <p className="text-center text-[11px] text-muted-foreground">
          {vi
            ? "Chế độ demo: không có giao dịch tiền thật."
            : "Demo mode: no real money is transferred."}
        </p>
      </CardContent>
    </Card>
  );
}
