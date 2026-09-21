"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { useRouter, useParams } from "next/navigation";
import { useCustomerAuthStore } from "@/lib/store/customerAuthStore";
import { customerProfileApi } from "@/lib/api/customerAuth";
import { useCurrency } from "@/lib/hooks/useCurrency";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Package,
  ArrowLeft,
  Loader2,
  Search,
  Filter,
  Eye,
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
}

export default function OrdersPage() {
  const t = useTranslations();
  const router = useRouter();
  const params = useParams();
  const locale = params.locale as string;
  const { toast } = useToast();
  const { customer, accessToken, isAuthenticated } = useCustomerAuthStore();
  const { formatPrice } = useCurrency();

  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [authChecked, setAuthChecked] = useState(false);

  // Filter states
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");

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

    loadOrders();
  }, [authChecked, isAuthenticated, router, locale, page]);

  const loadOrders = async () => {
    if (!accessToken) return;

    setLoading(true);
    try {
      const response = await customerProfileApi.getOrders(
        accessToken,
        page,
        10
      );
      setOrders(response.data);
      setTotalPages(response.pagination.totalPages);
      setTotal(response.pagination.total);
    } catch (error: any) {
      toast({
        title: t("common.error"),
        description: error.response?.data?.message || t("common.error"),
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const getOrderStatusBadge = (status: Order["status"]) => {
    const statusConfig: Record<Order["status"], { variant: "default" | "secondary" | "destructive" | "outline"; label: string; className?: string }> = {
      pending: {
        variant: "secondary",
        label: locale === "vi" ? "Chờ xử lý" : "Pending",
        className: "bg-yellow-100 text-yellow-800",
      },
      confirmed: {
        variant: "default",
        label: locale === "vi" ? "Đã xác nhận" : "Confirmed",
        className: "bg-blue-100 text-blue-800",
      },
      shipping: {
        variant: "default",
        label: locale === "vi" ? "Đang giao" : "Shipping",
        className: "bg-purple-100 text-purple-800",
      },
      completed: {
        variant: "default",
        label: locale === "vi" ? "Hoàn thành" : "Completed",
        className: "bg-green-100 text-green-800",
      },
      cancelled: {
        variant: "destructive",
        label: locale === "vi" ? "Đã hủy" : "Cancelled",
        className: "bg-red-100 text-red-800",
      },
    };

    const config = statusConfig[status] || {
      variant: "secondary" as const,
      label: status,
    };
    return <Badge variant={config.variant} className={config.className}>{config.label}</Badge>;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString(
      locale === "vi" ? "vi-VN" : "en-US",
      {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
      }
    );
  };

  // Filter orders
  const filteredOrders = orders.filter((order) => {
    const matchesSearch =
      order.orderNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.customerPhone.includes(searchQuery);

    const matchesStatus = statusFilter === "all" || order.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  if (!customer) {
    return null;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center gap-4 mb-6">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.push(`/${locale}/profile`)}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-3xl font-bold">{t("customer.myOrders")}</h1>
          {total > 0 && (
            <Badge variant="secondary">
              {total} {t("customer.ordersCount")}
            </Badge>
          )}
        </div>

        {/* Filter Section */}
        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="flex flex-col md:flex-row gap-4">
              {/* Search Input */}
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder={t("customer.searchOrdersPlaceholder")}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>

              {/* Status Filter */}
              <div className="w-full md:w-48">
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger>
                    <Filter className="h-4 w-4 mr-2" />
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">
                      {t("customer.allStatus")}
                    </SelectItem>
                    <SelectItem value="pending">
                      {t("customer.statusPending")}
                    </SelectItem>
                    <SelectItem value="confirmed">
                      {t("customer.statusConfirmed")}
                    </SelectItem>
                    <SelectItem value="shipping">
                      {t("customer.statusShipping")}
                    </SelectItem>
                    <SelectItem value="completed">
                      {t("customer.statusCompleted")}
                    </SelectItem>
                    <SelectItem value="cancelled">
                      {t("customer.statusCancelled")}
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Active Filters Summary */}
            {(searchQuery || statusFilter !== "all") && (
              <div className="flex items-center gap-2 mt-4 text-sm text-muted-foreground">
                <span>{t("customer.filtering")}</span>
                {searchQuery && (
                  <Badge variant="outline">
                    {locale === "vi" ? "Tìm kiếm" : "Search"}: {searchQuery}
                  </Badge>
                )}
                {statusFilter !== "all" && (
                  <Badge variant="outline">
                    {locale === "vi" ? "Trạng thái" : "Status"}: {getOrderStatusBadge(statusFilter as Order["status"])}
                  </Badge>
                )}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setSearchQuery("");
                    setStatusFilter("all");
                  }}
                >
                  {locale === "vi" ? "Xóa bộ lọc" : "Clear filters"}
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {loading && orders.length === 0 ? (
          <div className="flex justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : orders.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center text-muted-foreground">
              <Package className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>
                {locale === "vi" ? "Chưa có đơn hàng nào" : "No orders yet"}
              </p>
              <p className="text-sm mt-2">
                {locale === "vi"
                  ? "Hãy bắt đầu mua sắm ngay!"
                  : "Start shopping now!"}
              </p>
              <Button
                className="mt-4"
                onClick={() => router.push(`/${locale}/products`)}
              >
                {locale === "vi" ? "Khám phá sản phẩm" : "Browse Products"}
              </Button>
            </CardContent>
          </Card>
        ) : filteredOrders.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center text-muted-foreground">
              <Package className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>
                {locale === "vi" ? "Không tìm thấy đơn hàng nào" : "No orders found"}
              </p>
              <p className="text-sm mt-2">
                {locale === "vi"
                  ? "Thử thay đổi bộ lọc hoặc tìm kiếm"
                  : "Try changing filters or search"}
              </p>
            </CardContent>
          </Card>
        ) : (
          <>
            {/* Orders Table */}
            <Card>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>{locale === "vi" ? "Mã đơn hàng" : "Order Number"}</TableHead>
                        <TableHead>{locale === "vi" ? "Ngày đặt" : "Date"}</TableHead>
                        <TableHead>{locale === "vi" ? "Sản phẩm" : "Products"}</TableHead>
                        <TableHead>{locale === "vi" ? "Tổng tiền" : "Total"}</TableHead>
                        <TableHead>{locale === "vi" ? "Trạng thái" : "Status"}</TableHead>
                        <TableHead className="text-right">{locale === "vi" ? "Thao tác" : "Actions"}</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredOrders.map((order) => (
                        <TableRow key={order.id}>
                          <TableCell className="font-medium">
                            <div>
                              <div className="font-mono text-sm">#{order.orderNumber}</div>
                              <div className="text-xs text-muted-foreground mt-1">
                                {order.customerName}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="text-sm">
                              {formatDate(order.createdAt)}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="text-sm">
                              {order.items && order.items.length > 0 ? (
                                <div>
                                  <div className="font-medium">{order.items[0].productName}</div>
                                  {order.items[0].variantName && (
                                    <div className="text-xs text-muted-foreground">
                                      {order.items[0].variantName}
                                    </div>
                                  )}
                                  {order.items.length > 1 && (
                                    <div className="text-xs text-muted-foreground mt-1">
                                      {locale === "vi" ? `+${order.items.length - 1} sản phẩm khác` : `+${order.items.length - 1} more items`}
                                    </div>
                                  )}
                                </div>
                              ) : (
                                <span className="text-muted-foreground">-</span>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="font-semibold">{formatPrice(order.total)}</div>
                            {parseFloat(order.discountAmount) > 0 && (
                              <div className="text-xs text-green-600">
                                -{formatPrice(order.discountAmount)}
                              </div>
                            )}
                          </TableCell>
                          <TableCell>
                            {getOrderStatusBadge(order.status)}
                          </TableCell>
                          <TableCell className="text-right">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => router.push(`/${locale}/profile/orders/${order.id}`)}
                            >
                              <Eye className="h-4 w-4 mr-2" />
                              {locale === "vi" ? "Chi tiết" : "Details"}
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex justify-center gap-2 mt-6">
                <Button
                  variant="outline"
                  onClick={() => setPage(page - 1)}
                  disabled={page === 1 || loading}
                >
                  {locale === "vi" ? "Trước" : "Previous"}
                </Button>
                <div className="flex items-center gap-2">
                  {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                    let pageNum;
                    if (totalPages <= 5) {
                      pageNum = i + 1;
                    } else if (page <= 3) {
                      pageNum = i + 1;
                    } else if (page >= totalPages - 2) {
                      pageNum = totalPages - 4 + i;
                    } else {
                      pageNum = page - 2 + i;
                    }
                    return (
                      <Button
                        key={pageNum}
                        variant={page === pageNum ? "default" : "outline"}
                        onClick={() => setPage(pageNum)}
                        disabled={loading}
                        size="sm"
                      >
                        {pageNum}
                      </Button>
                    );
                  })}
                </div>
                <Button
                  variant="outline"
                  onClick={() => setPage(page + 1)}
                  disabled={page === totalPages || loading}
                >
                  {locale === "vi" ? "Sau" : "Next"}
                </Button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
