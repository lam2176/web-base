"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { useRouter, useParams } from "next/navigation";
import { useCustomerAuthStore } from "@/lib/store/customerAuthStore";
import { customerProfileApi } from "@/lib/api/customerAuth";
import { useCurrency } from "@/lib/hooks/useCurrency";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import {
  Package,
  ArrowLeft,
  Loader2,
  Calendar,
  MapPin,
  User,
  Phone,
  Mail,
  FileText,
  History,
} from "lucide-react";

interface OrderItem {
  id: number;
  orderId: number;
  productId?: number;
  productName: string;
  variantName?: string;
  quantity: number;
  price: string;
  total: string;
  createdAt: string;
}

interface OrderStatusHistory {
  id: number;
  orderId: number;
  status: string;
  note?: string;
  createdAt: string;
  createdBy?: string;
}

interface Order {
  id: number;
  orderNumber: string;
  customerId?: number;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  customerAddress: string;
  subtotal: string;
  shippingFee: string;
  discountAmount: string;
  total: string;
  status: "pending" | "confirmed" | "shipping" | "completed" | "cancelled";
  discountCodeId?: number;
  notes?: string;
  createdAt: string;
  updatedAt: string;
  items?: OrderItem[];
  discountCode?: any;
  statusHistory?: OrderStatusHistory[];
}

export default function OrderDetailPage() {
  const t = useTranslations();
  const router = useRouter();
  const params = useParams();
  const locale = params.locale as string;
  const orderId = params.id as string;
  const { toast } = useToast();
  const { customer, accessToken, isAuthenticated } = useCustomerAuthStore();
  const { formatPrice } = useCurrency();

  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [authChecked, setAuthChecked] = useState(false);

  // Wait for auth store to initialize
  useEffect(() => {
    const timer = setTimeout(() => {
      setAuthChecked(true);
    }, 100);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!authChecked) return;
    
    if (!isAuthenticated) {
      router.push(`/${locale}`);
      return;
    }

    loadOrderDetail();
  }, [authChecked, isAuthenticated, router, locale, orderId]);

  const loadOrderDetail = async () => {
    if (!accessToken) return;

    setLoading(true);
    try {
      const response = await customerProfileApi.getOrderById(
        accessToken,
        parseInt(orderId)
      );
      // Backend returns { data: { data: {...} } }, need to access nested data
      setOrder(response.data.data || response.data);
    } catch (error: any) {
      toast({
        title: t("common.error"),
        description: error.response?.data?.message || t("common.error"),
        variant: "destructive",
      });
      // Redirect back to orders list if order not found
      router.push(`/${locale}/profile/orders`);
    } finally {
      setLoading(false);
    }
  };

  const getOrderStatusBadge = (status: Order["status"]) => {
    const statusConfig: Record<
      Order["status"],
      { variant: "default" | "secondary" | "destructive"; label: string }
    > = {
      pending: {
        variant: "secondary",
        label: locale === "vi" ? "Chờ xử lý" : "Pending",
      },
      confirmed: {
        variant: "default",
        label: locale === "vi" ? "Đã xác nhận" : "Confirmed",
      },
      shipping: {
        variant: "default",
        label: locale === "vi" ? "Đang giao" : "Shipping",
      },
      completed: {
        variant: "default",
        label: locale === "vi" ? "Hoàn thành" : "Completed",
      },
      cancelled: {
        variant: "destructive",
        label: locale === "vi" ? "Đã hủy" : "Cancelled",
      },
    };

    const config = statusConfig[status] || {
      variant: "secondary" as const,
      label: status,
    };
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString(
      locale === "vi" ? "vi-VN" : "en-US",
      {
        year: "numeric",
        month: "long",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      }
    );
  };

  if (!customer) {
    return null;
  }

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-center py-8">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </div>
    );
  }

  if (!order) {
    return null;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.push(`/${locale}/profile/orders`)}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex-1">
            <h1 className="text-3xl font-bold">
              {locale === "vi" ? "Chi tiết đơn hàng" : "Order Details"}
            </h1>
            <p className="text-muted-foreground">
              {locale === "vi" ? "Đơn hàng" : "Order"} #{order.orderNumber}
            </p>
          </div>
          {getOrderStatusBadge(order.status)}
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          {/* Customer Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                {locale === "vi"
                  ? "Thông tin khách hàng"
                  : "Customer Information"}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-start gap-2">
                <User className="h-4 w-4 text-muted-foreground mt-0.5" />
                <div>
                  <p className="text-sm text-muted-foreground">
                    {locale === "vi" ? "Họ tên" : "Full Name"}
                  </p>
                  <p className="font-medium">{order.customerName}</p>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <Phone className="h-4 w-4 text-muted-foreground mt-0.5" />
                <div>
                  <p className="text-sm text-muted-foreground">
                    {locale === "vi" ? "Số điện thoại" : "Phone Number"}
                  </p>
                  <p className="font-medium">{order.customerPhone}</p>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <Mail className="h-4 w-4 text-muted-foreground mt-0.5" />
                <div>
                  <p className="text-sm text-muted-foreground">Email</p>
                  <p className="font-medium">{order.customerEmail}</p>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
                <div>
                  <p className="text-sm text-muted-foreground">
                    {locale === "vi" ? "Địa chỉ giao hàng" : "Shipping Address"}
                  </p>
                  <p className="font-medium">{order.customerAddress}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Order Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="h-5 w-5" />
                {locale === "vi" ? "Thông tin đơn hàng" : "Order Information"}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <p className="text-sm text-muted-foreground">
                  {locale === "vi" ? "Mã đơn hàng" : "Order Number"}
                </p>
                <p className="font-medium">#{order.orderNumber}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">
                  {locale === "vi" ? "Ngày đặt hàng" : "Order Date"}
                </p>
                <p className="font-medium">{formatDate(order.createdAt)}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">
                  {locale === "vi" ? "Trạng thái" : "Status"}
                </p>
                <div className="mt-1">{getOrderStatusBadge(order.status)}</div>
              </div>
              {order.notes && (
                <div>
                  <p className="text-sm text-muted-foreground">
                    {locale === "vi" ? "Ghi chú" : "Notes"}
                  </p>
                  <p className="font-medium italic text-sm">{order.notes}</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Order Items */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="h-5 w-5" />
              {locale === "vi" ? "Sản phẩm đã đặt" : "Order Items"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {order.items && order.items.length > 0 ? (
                order.items.map((item) => (
                  <div
                    key={item.id}
                    className="flex justify-between items-start p-4 bg-muted/30 rounded-lg"
                  >
                    <div className="flex-1">
                      <p className="font-medium">{item.productName}</p>
                      {item.variantName && (
                        <p className="text-sm text-muted-foreground">
                          {item.variantName}
                        </p>
                      )}
                      <p className="text-sm text-muted-foreground mt-1">
                        {formatPrice(item.price)} x {item.quantity}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold">{formatPrice(item.total)}</p>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-center text-muted-foreground py-4">
                  {locale === "vi" ? "Không có sản phẩm" : "No items"}
                </p>
              )}
            </div>

            <Separator className="my-6" />

            {/* Order Summary */}
            <div className="space-y-3">
              <div className="flex justify-between text-sm">
                <span>{locale === "vi" ? "Tổng tiền hàng" : "Subtotal"}</span>
                <span>{formatPrice(order.subtotal)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>
                  {locale === "vi" ? "Phí vận chuyển" : "Shipping Fee"}
                </span>
                <span>{formatPrice(order.shippingFee)}</span>
              </div>
              {parseFloat(order.discountAmount) > 0 && (
                <div className="flex justify-between text-sm text-green-600">
                  <span>{locale === "vi" ? "Giảm giá" : "Discount"}</span>
                  <span>-{formatPrice(order.discountAmount)}</span>
                </div>
              )}
              <Separator />
              <div className="flex justify-between font-bold text-lg">
                <span>{locale === "vi" ? "Tổng cộng" : "Total"}</span>
                <span className="text-primary">
                  {formatPrice(order.total)}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Order Status History */}
        {order.statusHistory && order.statusHistory.length > 0 && (
          <Card className="mt-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <History className="h-5 w-5" />
                {locale === "vi" ? "Lịch sử đơn hàng" : "Order History"}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {order.statusHistory.map((history, index) => (
                  <div key={history.id} className="flex gap-4">
                    <div className="flex flex-col items-center">
                      <div className="h-3 w-3 rounded-full bg-primary" />
                      {index < order.statusHistory!.length - 1 && (
                        <div className="w-0.5 h-full bg-border flex-1 mt-2" />
                      )}
                    </div>
                    <div className="flex-1 pb-4">
                      <div className="flex items-center gap-2 mb-1">
                        {getOrderStatusBadge(
                          history.status as Order["status"]
                        )}
                        <span className="text-sm text-muted-foreground">
                          {formatDate(history.createdAt)}
                        </span>
                      </div>
                      {history.note && (
                        <p className="text-sm text-muted-foreground mt-1">
                          {history.note}
                        </p>
                      )}
                      {history.createdBy && (
                        <p className="text-xs text-muted-foreground mt-1">
                          {locale === "vi" ? "Bởi:" : "By:"} {history.createdBy}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
