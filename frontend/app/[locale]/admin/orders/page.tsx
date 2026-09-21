'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Search,
  Filter,
  ChevronLeft,
  ChevronRight,
  Eye,
  Package,
  X,
} from 'lucide-react';
import { adminOrderService } from '@/lib/api/services/admin.service';
import { useAuthStore } from '@/lib/stores/auth.store';
import { Order } from '@/lib/types/api';
import { useCurrency } from '@/lib/hooks/useCurrency';
import { format } from 'date-fns';

const statusOptions = [
  { value: '', label: 'All Status' },
  { value: 'pending', label: 'Pending' },
  { value: 'confirmed', label: 'Confirmed' },
  { value: 'processing', label: 'Processing' },
  { value: 'shipped', label: 'Shipped' },
  { value: 'delivered', label: 'Delivered' },
  { value: 'cancelled', label: 'Cancelled' },
];

const paymentStatusOptions = [
  { value: '', label: 'All Payment Status' },
  { value: 'unpaid', label: 'Unpaid' },
  { value: 'paid', label: 'Paid' },
  { value: 'refunded', label: 'Refunded' },
];

export default function OrdersManagement({ params: { locale } }: { params: { locale: string } }) {
  const router = useRouter();
  const { user, isAuthenticated } = useAuthStore();
  const { formatPrice } = useCurrency();

  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  const [selectedPaymentStatus, setSelectedPaymentStatus] = useState('');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const limit = 10;

  useEffect(() => {
    // Check authentication and admin role
    if (!isAuthenticated || (user?.role !== 'admin' && user?.role !== 'staff')) {
      router.push(`/${locale}/admin/login`);
      return;
    }

    fetchOrders();
  }, [isAuthenticated, user, page, selectedStatus, selectedPaymentStatus]);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const params: any = {
        page,
        limit,
      };

      if (searchQuery) params.search = searchQuery;
      if (selectedStatus) params.status = selectedStatus;
      if (selectedPaymentStatus) params.paymentStatus = selectedPaymentStatus;

      const response = await adminOrderService.getAll(params);

      setOrders(response.data);
      setTotalPages(response.pagination.totalPages);
    } catch (error) {
      console.error('Failed to fetch orders:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchOrders();
  };



  const viewOrderDetails = (orderId: number) => {
    router.push(`/${locale}/admin/orders/${orderId}`);
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      pending: 'bg-yellow-100 text-yellow-800',
      confirmed: 'bg-blue-100 text-blue-800',
      processing: 'bg-indigo-100 text-indigo-800',
      shipped: 'bg-purple-100 text-purple-800',
      delivered: 'bg-green-100 text-green-800',
      cancelled: 'bg-red-100 text-red-800',
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const getPaymentStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      unpaid: 'bg-red-100 text-red-800',
      paid: 'bg-green-100 text-green-800',
      refunded: 'bg-orange-100 text-orange-800',
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const getStatusLabel = (status: string) => {
    if (locale !== 'vi') return status.charAt(0).toUpperCase() + status.slice(1);

    const labels: Record<string, string> = {
      pending: 'Chờ xử lý',
      confirmed: 'Đã xác nhận',
      processing: 'Đang xử lý',
      shipped: 'Đang giao',
      delivered: 'Đã giao',
      cancelled: 'Đã hủy',
    };
    return labels[status] || status;
  };

  const getPaymentStatusLabel = (status: string) => {
    if (locale !== 'vi') return status.charAt(0).toUpperCase() + status.slice(1);

    const labels: Record<string, string> = {
      unpaid: 'Chưa thanh toán',
      paid: 'Đã thanh toán',
      refunded: 'Đã hoàn tiền',
    };
    return labels[status] || status;
  };

  const getItemsCountLabel = (order: Order) => {
    const count =
      order.itemsCount ??
      (order.items ? order.items.reduce((sum, item) => sum + (item.quantity || 0), 0) : 0);
    return `${count} ${locale === 'vi' ? 'sản phẩm' : 'items'}`;
  };

  if (loading && orders.length === 0) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent"></div>
          <p className="mt-2 text-sm text-gray-600">
            {locale === 'vi' ? 'Đang tải...' : 'Loading...'}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">
          {locale === 'vi' ? 'Quản lý đơn hàng' : 'Orders Management'}
        </h1>
        <p className="text-sm text-gray-600">
          {locale === 'vi' ? 'Quản lý đơn hàng và vận chuyển' : 'Manage customer orders and fulfillment'}
        </p>
      </div>

      {/* Filters */}
      <Card className="p-6">
        <form onSubmit={handleSearch} className="flex flex-col gap-4 lg:flex-row">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <Input
                type="text"
                placeholder={locale === 'vi' ? 'Tìm kiếm theo mã đơn, tên khách hàng...' : 'Search by order number, customer name...'}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
          <select
            value={selectedStatus}
            onChange={(e) => {
              setSelectedStatus(e.target.value);
              setPage(1);
            }}
            className="rounded-md border border-gray-300 px-4 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          >
            <option value="">{locale === 'vi' ? 'Tất cả trạng thái' : 'All Status'}</option>
            {statusOptions.slice(1).map((option) => (
              <option key={option.value} value={option.value}>
                {getStatusLabel(option.value)}
              </option>
            ))}
          </select>
          <select
            value={selectedPaymentStatus}
            onChange={(e) => {
              setSelectedPaymentStatus(e.target.value);
              setPage(1);
            }}
            className="rounded-md border border-gray-300 px-4 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          >
            <option value="">{locale === 'vi' ? 'Tất cả thanh toán' : 'All Payment Status'}</option>
            {paymentStatusOptions.slice(1).map((option) => (
              <option key={option.value} value={option.value}>
                {getPaymentStatusLabel(option.value)}
              </option>
            ))}
          </select>
          <Button type="submit" className="flex items-center gap-2">
            <Filter className="h-4 w-4" />
            {locale === 'vi' ? 'Lọc' : 'Filter'}
          </Button>
        </form>
      </Card>

      {/* Orders table */}
      <Card className="p-6">
        {loading ? (
          <div className="flex h-64 items-center justify-center">
            <div className="text-center">
              <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent"></div>
              <p className="mt-2 text-sm text-gray-600">
                {locale === 'vi' ? 'Đang tải đơn hàng...' : 'Loading orders...'}
              </p>
            </div>
          </div>
        ) : orders.length === 0 ? (
          <div className="py-12 text-center">
            <Package className="mx-auto h-12 w-12 text-gray-400" />
            <p className="mt-2 text-gray-500">
              {locale === 'vi' ? 'Không có đơn hàng nào' : 'No orders found'}
            </p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="pb-3 text-left text-sm font-medium text-gray-600">
                      {locale === 'vi' ? 'Mã đơn' : 'Order #'}
                    </th>
                    <th className="pb-3 text-left text-sm font-medium text-gray-600">
                      {locale === 'vi' ? 'Khách hàng' : 'Customer'}
                    </th>
                    <th className="pb-3 text-left text-sm font-medium text-gray-600">
                      {locale === 'vi' ? 'Sản phẩm' : 'Items'}
                    </th>
                    <th className="pb-3 text-left text-sm font-medium text-gray-600">
                      {locale === 'vi' ? 'Tổng tiền' : 'Total'}
                    </th>
                    <th className="pb-3 text-left text-sm font-medium text-gray-600">
                      {locale === 'vi' ? 'Trạng thái' : 'Status'}
                    </th>
                    <th className="pb-3 text-left text-sm font-medium text-gray-600">
                      {locale === 'vi' ? 'Thanh toán' : 'Payment'}
                    </th>
                    <th className="pb-3 text-left text-sm font-medium text-gray-600">
                      {locale === 'vi' ? 'Ngày' : 'Date'}
                    </th>
                    <th className="pb-3 text-right text-sm font-medium text-gray-600">
                      {locale === 'vi' ? 'Thao tác' : 'Actions'}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {orders.map((order) => (
                    <tr key={order.id} className="border-b last:border-0">
                      <td className="py-3 text-sm font-medium text-gray-900">
                        {order.orderNumber}
                      </td>
                      <td className="py-3">
                        <div>
                          <p className="text-sm font-medium text-gray-900">
                            {order.customerInfo?.fullName || order.customerInfo?.name || order.customerName}
                          </p>
                          <p className="text-xs text-gray-500">{order.customerInfo?.email || order.customerEmail}</p>
                        </div>
                      </td>
                      <td className="py-3 text-sm text-gray-600">
                        {getItemsCountLabel(order)}
                      </td>
                      <td className="py-3 text-sm font-medium text-gray-900">
                        {formatPrice(order.totalAmount || order.total)}
                      </td>
                      <td className="py-3">
                        <span
                          className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold ${getStatusColor(
                            order.status
                          )}`}
                        >
                          {getStatusLabel(order.status)}
                        </span>
                      </td>
                      <td className="py-3">
                        <span
                          className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold ${getPaymentStatusColor(
                            order.paymentStatus || 'unpaid'
                          )}`}
                        >
                          {getPaymentStatusLabel(order.paymentStatus || 'unpaid')}
                        </span>
                      </td>
                      <td className="py-3 text-sm text-gray-600">
                        {format(new Date(order.createdAt), 'dd/MM/yyyy HH:mm')}
                      </td>
                      <td className="py-3">
                        <div className="flex justify-end">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => viewOrderDetails(order.id)}
                            title={locale === 'vi' ? 'Xem chi tiết' : 'View Details'}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="mt-6 flex items-center justify-between">
                <p className="text-sm text-gray-600">
                  {locale === 'vi' ? 'Trang' : 'Page'} {page} {locale === 'vi' ? 'của' : 'of'}{' '}
                  {totalPages}
                </p>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page === 1}
                  >
                    <ChevronLeft className="h-4 w-4" />
                    {locale === 'vi' ? 'Trước' : 'Previous'}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    disabled={page === totalPages}
                  >
                    {locale === 'vi' ? 'Sau' : 'Next'}
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </Card>

      {/* Order Details Modal */}
      {showModal && selectedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
          <Card className="max-h-[90vh] w-full max-w-2xl overflow-y-auto p-6">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-900">
                {locale === 'vi' ? 'Chi tiết đơn hàng' : 'Order Details'} - {selectedOrder.orderNumber}
              </h2>
              <button
                onClick={() => setShowModal(false)}
                className="rounded-full p-1 hover:bg-gray-100"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-6">
              {/* Customer Info */}
              <div>
                <h3 className="mb-2 font-semibold text-gray-900">
                  {locale === 'vi' ? 'Thông tin khách hàng' : 'Customer Information'}
                </h3>
                <div className="rounded-lg bg-gray-50 p-4 text-sm">
                  <p>
                    <span className="font-medium">{locale === 'vi' ? 'Họ tên:' : 'Name:'}</span>{' '}
                    {selectedOrder.customerInfo?.fullName || selectedOrder.customerInfo?.name || selectedOrder.customerName}
                  </p>
                  <p>
                    <span className="font-medium">Email:</span> {selectedOrder.customerInfo?.email || selectedOrder.customerEmail}
                  </p>
                  <p>
                    <span className="font-medium">{locale === 'vi' ? 'Điện thoại:' : 'Phone:'}</span>{' '}
                    {selectedOrder.customerInfo?.phoneNumber || selectedOrder.customerInfo?.phone || selectedOrder.customerPhone}
                  </p>
                </div>
              </div>

              {/* Shipping Address */}
              <div>
                <h3 className="mb-2 font-semibold text-gray-900">
                  {locale === 'vi' ? 'Địa chỉ giao hàng' : 'Shipping Address'}
                </h3>
                <div className="rounded-lg bg-gray-50 p-4 text-sm">
                  {typeof selectedOrder.shippingAddress === 'string' ? (
                    <p>{selectedOrder.shippingAddress}</p>
                  ) : selectedOrder.shippingAddress ? (
                    <>
                      <p>{selectedOrder.shippingAddress.address}</p>
                      <p>
                        {selectedOrder.shippingAddress.ward}, {selectedOrder.shippingAddress.district}
                      </p>
                      <p>{selectedOrder.shippingAddress.province}</p>
                    </>
                  ) : (
                    <p className="text-gray-500">Không có địa chỉ</p>
                  )}
                </div>
              </div>

              {/* Order Items */}
              <div>
                <h3 className="mb-2 font-semibold text-gray-900">
                  {locale === 'vi' ? 'Sản phẩm đã đặt' : 'Order Items'}
                </h3>
                <div className="space-y-2">
                  {selectedOrder.items && selectedOrder.items.length > 0 ? (
                    selectedOrder.items.map((item) => (
                      <div
                        key={item.id}
                        className="flex items-center justify-between rounded-lg border p-3"
                      >
                        <div className="flex items-center gap-3">
                          {item.product?.images?.[0] && (
                            <img
                              src={item.product.images[0].url}
                              alt={item.product.name}
                              className="h-12 w-12 rounded object-cover"
                            />
                          )}
                          <div>
                            <p className="font-medium text-gray-900">{item.product?.name || 'Product'}</p>
                            <p className="text-xs text-gray-500">
                              {locale === 'vi' ? 'Số lượng:' : 'Qty:'} {item.quantity}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-medium text-gray-900">
                            {formatPrice(item.totalPrice || item.price)}
                          </p>
                          <p className="text-xs text-gray-500">
                            {formatPrice(item.unitPrice || item.price)} {locale === 'vi' ? 'mỗi sp' : 'each'}
                          </p>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-gray-500">
                      {locale === 'vi' ? 'Không có sản phẩm' : 'No items'}
                    </p>
                  )}
                </div>
              </div>

              {/* Order Summary */}
              <div>
                <h3 className="mb-2 font-semibold text-gray-900">
                  {locale === 'vi' ? 'Tổng kết đơn hàng' : 'Order Summary'}
                </h3>
                <div className="space-y-2 rounded-lg bg-gray-50 p-4 text-sm">
                  <div className="flex justify-between">
                    <span>{locale === 'vi' ? 'Tạm tính:' : 'Subtotal:'}</span>
                    <span>{formatPrice(selectedOrder.subtotalAmount || selectedOrder.subtotal)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>{locale === 'vi' ? 'Phí vận chuyển:' : 'Shipping:'}</span>
                    <span>{formatPrice(selectedOrder.shippingFee)}</span>
                  </div>
                  {(Number(selectedOrder.discountAmount) || 0) > 0 && (
                    <div className="flex justify-between text-green-600">
                      <span>{locale === 'vi' ? 'Giảm giá:' : 'Discount:'}</span>
                      <span>-{formatPrice(selectedOrder.discountAmount)}</span>
                    </div>
                  )}
                  <div className="flex justify-between border-t pt-2 font-bold">
                    <span>{locale === 'vi' ? 'Tổng cộng:' : 'Total:'}</span>
                    <span>{formatPrice(selectedOrder.totalAmount || selectedOrder.total)}</span>
                  </div>
                </div>
              </div>

              {selectedOrder.note && (
                <div>
                  <h3 className="mb-2 font-semibold text-gray-900">
                    {locale === 'vi' ? 'Ghi chú' : 'Note'}
                  </h3>
                  <p className="rounded-lg bg-gray-50 p-4 text-sm">{selectedOrder.note}</p>
                </div>
              )}
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
