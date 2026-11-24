"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useSearchParams } from "next/navigation";
import { CheckCircle2, Loader2, ShieldCheck } from "lucide-react";
import { getOrderByNumber, simulateOrderPayment } from "@/lib/api/endpoints";
import { Order } from "@/lib/types/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useCurrency } from "@/lib/hooks/useCurrency";

// Page opened by scanning the order's payment QR code (demo bank app confirmation)
function PayContent() {
  const params = useParams();
  const searchParams = useSearchParams();
  const locale = params.locale as string;
  const vi = locale === "vi";
  const orderNumber = searchParams.get("orderNumber") || "";
  const { formatPrice } = useCurrency();

  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [paying, setPaying] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!orderNumber) {
      setLoading(false);
      return;
    }
    getOrderByNumber(orderNumber)
      .then((data) => setOrder(data as unknown as Order))
      .catch(() => setOrder(null))
      .finally(() => setLoading(false));
  }, [orderNumber]);

  const confirm = async () => {
    setPaying(true);
    setError("");
    try {
      setOrder((await simulateOrderPayment(orderNumber)) as unknown as Order);
    } catch (err) {
      const message = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      setError(message || (vi ? "Thanh toán thất bại, vui lòng thử lại" : "Payment failed, please try again"));
    } finally {
      setPaying(false);
    }
  };

  if (loading) {
    return <Skeleton className="mx-auto h-80 w-full max-w-sm" />;
  }

  if (!order) {
    return (
      <Card className="mx-auto max-w-sm text-center">
        <CardContent className="space-y-4 py-10">
          <p className="font-semibold">{vi ? "Không tìm thấy đơn hàng" : "Order not found"}</p>
          <Button asChild variant="outline">
            <Link href={`/${locale}`}>{vi ? "Về trang chủ" : "Go to homepage"}</Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  const isPaid = order.paymentStatus === "paid";

  return (
    <Card className="mx-auto max-w-sm">
      <CardContent className="space-y-5 py-8 text-center">
        {isPaid ? (
          <>
            <CheckCircle2 className="mx-auto h-16 w-16 text-green-600" />
            <div>
              <p className="text-xl font-bold text-green-700">
                {vi ? "Thanh toán thành công" : "Payment successful"}
              </p>
              <p className="mt-1 text-sm text-muted-foreground">
                {vi
                  ? "Bạn có thể quay lại trang đặt hàng, trạng thái sẽ tự cập nhật."
                  : "You can go back to the order page; it updates automatically."}
              </p>
            </div>
          </>
        ) : (
          <>
            <ShieldCheck className="mx-auto h-12 w-12 text-blue-600" />
            <p className="text-lg font-bold">{vi ? "Xác nhận thanh toán" : "Confirm payment"}</p>
          </>
        )}

        <div className="space-y-2 rounded-lg bg-gray-50 p-4 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">{vi ? "Đơn hàng" : "Order"}</span>
            <code className="font-mono text-xs font-semibold">{order.orderNumber}</code>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">{vi ? "Số tiền" : "Amount"}</span>
            <span className="text-lg font-bold text-primary">{formatPrice(parseFloat(order.total))}</span>
          </div>
        </div>

        {!isPaid && (
          <>
            {error && <p className="text-sm text-red-600">{error}</p>}
            <Button className="w-full" size="lg" onClick={confirm} disabled={paying}>
              {paying && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {vi ? "Xác nhận thanh toán" : "Confirm payment"}
            </Button>
            <p className="text-[11px] text-muted-foreground">
              {vi ? "Chế độ demo: không có giao dịch tiền thật." : "Demo mode: no real money is transferred."}
            </p>
          </>
        )}
      </CardContent>
    </Card>
  );
}

export default function PayPage() {
  return (
    <div className="container mx-auto px-4 py-12">
      <Suspense fallback={<Skeleton className="mx-auto h-80 w-full max-w-sm" />}>
        <PayContent />
      </Suspense>
    </div>
  );
}
