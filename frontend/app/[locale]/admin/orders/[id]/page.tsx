'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  ArrowLeft,
  Package,
  User,
  Phone,
  Mail,
  MapPin,
  Calendar,
  History,
  Save,
  Loader2,
  Plus,
  Trash2,
} from 'lucide-react';
import { adminOrderService, adminProductService } from '@/lib/api/services/admin.service';
import { useAuthStore } from '@/lib/stores/auth.store';
import { useCurrency } from '@/lib/hooks/useCurrency';
import { format } from 'date-fns';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { UpdateOrderDto, Product, ProductVariant } from '@/lib/types/api';
import { useAdminProducts, useAdminProduct } from '@/lib/hooks/use-admin';

const statusConfig = {
  pending: { label: { vi: 'Chờ xử lý', en: 'Pending' }, color: 'bg-yellow-100 text-yellow-800' },
  confirmed: { label: { vi: 'Đã xác nhận', en: 'Confirmed' }, color: 'bg-blue-100 text-blue-800' },
  shipping: { label: { vi: 'Đang giao', en: 'Shipping' }, color: 'bg-purple-100 text-purple-800' },
  completed: { label: { vi: 'Hoàn thành', en: 'Completed' }, color: 'bg-green-100 text-green-800' },
  cancelled: { label: { vi: 'Đã hủy', en: 'Cancelled' }, color: 'bg-red-100 text-red-800' },
};

const paymentStatusConfig = {
  unpaid: { label: { vi: 'Chưa thanh toán', en: 'Unpaid' }, color: 'bg-red-100 text-red-800' },
  paid: { label: { vi: 'Đã thanh toán', en: 'Paid' }, color: 'bg-green-100 text-green-800' },
  refunded: { label: { vi: 'Đã hoàn tiền', en: 'Refunded' }, color: 'bg-orange-100 text-orange-800' },
};

export default function AdminOrderDetail({ params: { locale } }: { params: { locale: string } }) {
  const router = useRouter();
  const urlParams = useParams();
  const orderId = urlParams.id as string;
  const { user, isAuthenticated } = useAuthStore();
  const { formatPrice } = useCurrency();

  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editMode, setEditMode] = useState(false);

  // Get products for selection
  const { data: productsData } = useAdminProducts({ limit: 1000 });
  const products = productsData?.data || [];

  // State to store product details (with variants) for each item
  const [productDetails, setProductDetails] = useState<Record<number, Product | null>>({});

  const getProductDisplayName = (product: Product) => {
    return (
      product.nameVi ||
      product.nameEn ||
      product.name ||
      `#${product.id}`
    );
  };

  // Edit form state
  const [editData, setEditData] = useState<{
    status: string;
    paymentStatus: string;
    statusNote: string;
    customerName: string;
    customerEmail: string;
    customerPhone: string;
    customerAddress: string;
    notes: string;
    subtotal: string;
    shippingFee: string;
    discountAmount: string;
    total: string;
    items: Array<{
      id?: number;
      productId?: number;
      productName: string;
      variantName: string;
      variantId?: number;
      quantity: number;
      price: number;
    }>;
  }>({
    status: '',
    paymentStatus: '',
    statusNote: '',
    customerName: '',
    customerEmail: '',
    customerPhone: '',
    customerAddress: '',
    notes: '',
    subtotal: '0',
    shippingFee: '0',
    discountAmount: '0',
    total: '0',
    items: [],
  });


  useEffect(() => {
    if (!isAuthenticated) {
      router.push(`/${locale}/admin/login`);
      return;
    }
    fetchOrderDetail();
  }, [isAuthenticated, router, locale, orderId]);

  const fetchOrderDetail = async () => {
    setLoading(true);
    try {
      const response = await adminOrderService.getById(parseInt(orderId));
      setOrder(response);
      
      // Initialize edit data
      const shippingAddress = typeof response.shippingAddress === 'string'
        ? response.shippingAddress
        : response.shippingAddress
        ? [
            response.shippingAddress.address,
            response.shippingAddress.ward,
            response.shippingAddress.district,
            response.shippingAddress.province,
          ].filter(Boolean).join(', ')
        : (response as any).customerAddress || '';

      setEditData({
        status: response.status || 'pending',
        paymentStatus: response.paymentStatus || 'unpaid',
        statusNote: '',
        customerName: response.customerName || '',
        customerEmail: response.customerEmail || '',
        customerPhone: response.customerPhone || '',
        customerAddress: shippingAddress,
        notes: (response as any).notes || (response as any).note || '',
        subtotal: response.subtotalAmount || response.subtotal || '0',
        shippingFee: response.shippingFee || '0',
        discountAmount: response.discountAmount || '0',
        total: response.totalAmount || response.total || '0',
      items: (response.items || []).map((item: any, index: number) => {
        const itemData = {
          id: item.id,
          productId: item.productId,
          productName: item.productName || (item.product?.name || ''),
          variantName: item.variantName || '',
          variantId: item.variantId,
          quantity: item.quantity || 1,
          price: parseFloat(item.price || item.unitPrice || '0'),
        };
        
        // Fetch product details if productId exists
        if (item.productId) {
          (async () => {
            try {
              const productDetail = await adminProductService.getById(item.productId);
              setProductDetails(prev => ({ ...prev, [index]: productDetail }));
            } catch (error) {
              console.error('Failed to fetch product details:', error);
            }
          })();
        }
        
        return itemData;
      }),
      });
    } catch (error) {
      console.error('Failed to fetch order:', error);
      alert(locale === 'vi' ? 'Không thể tải đơn hàng' : 'Failed to load order');
      router.push(`/${locale}/admin/orders`);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveOrder = async () => {
    setSaving(true);
    try {
      const statusChanged = editData.status !== order.status;
      const paymentStatusChanged = editData.paymentStatus !== (order.paymentStatus || 'unpaid');

      // Update status with note if status changed
      if (statusChanged) {
        await adminOrderService.updateStatus(parseInt(orderId), {
          status: editData.status as any,
          note: editData.statusNote || undefined,
        });
      }

      // Update order details (this will handle payment status history if changed)
      const payload: UpdateOrderDto = {
        customerName: editData.customerName.trim(),
        customerEmail: editData.customerEmail.trim(),
        customerPhone: editData.customerPhone.trim(),
        customerAddress: editData.customerAddress.trim(),
        status: editData.status as any,
        paymentStatus: editData.paymentStatus as any,
        notes: editData.notes.trim() || undefined,
        subtotal: parseFloat(editData.subtotal) || undefined,
        shippingFee: parseFloat(editData.shippingFee) || undefined,
        discountAmount: parseFloat(editData.discountAmount) || undefined,
        total: parseFloat(editData.total) || undefined,
        items: editData.items.map((item) => ({
          id: item.id,
          productId: item.productId,
          productName: item.productName,
          variantName: item.variantName || undefined,
          variantId: item.variantId,
          quantity: item.quantity,
          price: item.price,
        })),
      };

      await adminOrderService.update(parseInt(orderId), payload);
      alert(locale === 'vi' ? 'Cập nhật đơn hàng thành công' : 'Order updated successfully');
      setEditMode(false);
      fetchOrderDetail();
    } catch (error) {
      console.error('Failed to update order:', error);
      alert(locale === 'vi' ? 'Không thể cập nhật đơn hàng' : 'Failed to update order');
    } finally {
      setSaving(false);
    }
  };

  const handleAddItem = () => {
    const newIndex = editData.items.length;
    setEditData({
      ...editData,
      items: [
        ...editData.items,
        {
          productName: '',
          variantName: '',
          variantId: undefined,
          quantity: 1,
          price: 0,
        },
      ],
    });
    // Clear product details for new item
    setProductDetails(prev => {
      const newDetails = { ...prev };
      delete newDetails[newIndex];
      return newDetails;
    });
  };

  const handleRemoveItem = (index: number) => {
    const newItems = editData.items.filter((_, i) => i !== index);
    const subtotal = newItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const shipping = parseFloat(editData.shippingFee) || 0;
    const discount = parseFloat(editData.discountAmount) || 0;
    const total = subtotal + shipping - discount;

    // Remove product details for deleted item and reindex
    setProductDetails(prev => {
      const newDetails: Record<number, Product | null> = {};
      Object.keys(prev).forEach(key => {
        const oldIndex = parseInt(key);
        if (oldIndex < index) {
          newDetails[oldIndex] = prev[oldIndex];
        } else if (oldIndex > index) {
          newDetails[oldIndex - 1] = prev[oldIndex];
        }
      });
      return newDetails;
    });

    setEditData({
      ...editData,
      items: newItems,
      subtotal: subtotal.toFixed(2),
      total: total.toFixed(2),
    });
  };

  const handleItemChange = async (index: number, field: string, value: any) => {
    const newItems = [...editData.items];
    newItems[index] = { ...newItems[index], [field]: value };
    
    // If product changed, fetch product details with variants
    if (field === 'productId' && value) {
      const productId = parseInt(value);
      const product = products.find((p: Product) => p.id === productId);
      if (product) {
        newItems[index].productName = product.nameVi || product.nameEn || '';
        newItems[index].price = parseFloat(product.salePrice || product.originalPrice || '0');
        // Reset variant when product changes
        newItems[index].variantName = '';
        
        // Fetch full product details to get variants
        try {
          const productDetail = await adminProductService.getById(productId);
          setProductDetails(prev => ({ ...prev, [index]: productDetail }));
          
          // If product has variants, set first variant as default
          if (productDetail.variants && productDetail.variants.length > 0) {
            const firstVariant = productDetail.variants[0];
            const basePrice = parseFloat(productDetail.salePrice || productDetail.originalPrice || '0');
            const priceAdjustment = Number(firstVariant.priceAdjustment || 0);
            const variantPrice = basePrice + priceAdjustment;
            const variantName = firstVariant.name || firstVariant.nameVi || firstVariant.nameEn || '';
            const variantValue = firstVariant.value || '';
            newItems[index].variantName = variantName && variantValue ? `${variantName}: ${variantValue}` : variantValue || variantName;
            newItems[index].variantId = firstVariant.id;
            newItems[index].price = variantPrice;
          }
        } catch (error) {
          console.error('Failed to fetch product details:', error);
        }
      } else {
        // Clear product details if product not found
        setProductDetails(prev => {
          const newDetails = { ...prev };
          delete newDetails[index];
          return newDetails;
        });
      }
    }

    // If variant changed, update price
    if (field === 'variantId' && value) {
      const productDetail = productDetails[index];
      if (productDetail && productDetail.variants) {
        const variant = productDetail.variants.find((v: ProductVariant) => v.id === parseInt(value));
        if (variant) {
          const basePrice = parseFloat(productDetail.salePrice || productDetail.originalPrice || '0');
          const priceAdjustment = Number(variant.priceAdjustment || 0);
          const variantPrice = basePrice + priceAdjustment;
          const variantName = variant.name || variant.nameVi || variant.nameEn || '';
          const variantValue = variant.value || '';
          newItems[index].variantName = variantName && variantValue ? `${variantName}: ${variantValue}` : variantValue || variantName;
          newItems[index].price = variantPrice;
        }
      }
    }

    // Recalculate totals
    const subtotal = newItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const shipping = parseFloat(editData.shippingFee) || 0;
    const discount = parseFloat(editData.discountAmount) || 0;
    const total = subtotal + shipping - discount;

    setEditData({
      ...editData,
      items: newItems,
      subtotal: subtotal.toFixed(2),
      total: total.toFixed(2),
    });
  };

  const recalculateTotals = () => {
    const subtotal = editData.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const shipping = parseFloat(editData.shippingFee) || 0;
    const discount = parseFloat(editData.discountAmount) || 0;
    const total = subtotal + shipping - discount;

    setEditData((prev) => ({
      ...prev,
      subtotal: subtotal.toFixed(2),
      total: total.toFixed(2),
    }));
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-center items-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </div>
    );
  }

  if (!order) {
    return null;
  }

  const getStatusBadge = (status: string) => {
    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.pending;
    return (
      <Badge className={config.color}>
        {locale === 'vi' ? config.label.vi : config.label.en}
      </Badge>
    );
  };

  const getPaymentStatusBadge = (paymentStatus: string) => {
    const config = paymentStatusConfig[paymentStatus as keyof typeof paymentStatusConfig] || paymentStatusConfig.unpaid;
    return (
      <Badge className={config.color}>
        {locale === 'vi' ? config.label.vi : config.label.en}
      </Badge>
    );
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <Button
              variant="outline"
              onClick={() => router.push(`/${locale}/admin/orders`)}
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div>
              <h1 className="text-3xl font-bold">
                {locale === 'vi' ? 'Chi tiết đơn hàng' : 'Order Details'}
              </h1>
              <p className="text-muted-foreground">
                {locale === 'vi' ? 'Đơn hàng' : 'Order'} #{order.orderNumber}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {editMode ? (
              <>
                <Button onClick={handleSaveOrder} disabled={saving}>
                  {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  <Save className="mr-2 h-4 w-4" />
                  {locale === 'vi' ? 'Lưu thay đổi' : 'Save Changes'}
                </Button>
                <Button variant="outline" onClick={() => setEditMode(false)} disabled={saving}>
                  {locale === 'vi' ? 'Hủy' : 'Cancel'}
                </Button>
              </>
            ) : (
              <Button onClick={() => setEditMode(true)}>
                {locale === 'vi' ? 'Chỉnh sửa' : 'Edit'}
              </Button>
            )}
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          {/* Left Column - Order Info */}
          <div className="md:col-span-2 space-y-6">
            {/* Status Update Card */}
            {editMode && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Package className="h-5 w-5" />
                    {locale === 'vi' ? 'Cập nhật trạng thái' : 'Update Status'}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label>{locale === 'vi' ? 'Trạng thái đơn hàng' : 'Order Status'}</Label>
                    <Select
                      value={editData.status}
                      onValueChange={(value) => setEditData({ ...editData, status: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="pending">
                          {locale === 'vi' ? 'Chờ xử lý' : 'Pending'}
                        </SelectItem>
                        <SelectItem value="confirmed">
                          {locale === 'vi' ? 'Đã xác nhận' : 'Confirmed'}
                        </SelectItem>
                        <SelectItem value="shipping">
                          {locale === 'vi' ? 'Đang giao' : 'Shipping'}
                        </SelectItem>
                        <SelectItem value="completed">
                          {locale === 'vi' ? 'Hoàn thành' : 'Completed'}
                        </SelectItem>
                        <SelectItem value="cancelled">
                          {locale === 'vi' ? 'Đã hủy' : 'Cancelled'}
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label>{locale === 'vi' ? 'Trạng thái thanh toán' : 'Payment Status'}</Label>
                    <Select
                      value={editData.paymentStatus}
                      onValueChange={(value) => setEditData({ ...editData, paymentStatus: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="unpaid">
                          {locale === 'vi' ? 'Chưa thanh toán' : 'Unpaid'}
                        </SelectItem>
                        <SelectItem value="paid">
                          {locale === 'vi' ? 'Đã thanh toán' : 'Paid'}
                        </SelectItem>
                        <SelectItem value="refunded">
                          {locale === 'vi' ? 'Đã hoàn tiền' : 'Refunded'}
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label>{locale === 'vi' ? 'Ghi chú (tùy chọn)' : 'Note (optional)'}</Label>
                    <Textarea
                      value={editData.statusNote}
                      onChange={(e) => setEditData({ ...editData, statusNote: e.target.value })}
                      placeholder={
                        locale === 'vi'
                          ? 'Thêm ghi chú về thay đổi trạng thái...'
                          : 'Add a note about this status change...'
                      }
                      rows={3}
                    />
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Order Items */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <Package className="h-5 w-5" />
                    {locale === 'vi' ? 'Sản phẩm' : 'Items'}
                  </CardTitle>
                  {editMode && (
                    <Button type="button" variant="outline" size="sm" onClick={handleAddItem}>
                      <Plus className="h-4 w-4 mr-2" />
                      {locale === 'vi' ? 'Thêm sản phẩm' : 'Add Item'}
                    </Button>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                {editMode ? (
                  <div className="space-y-4">
                    {editData.items.map((item, index) => (
                      <div key={index} className="p-4 border rounded-lg space-y-3">
                        <div className="grid gap-4 md:grid-cols-2">
                          <div>
                            <Label>{locale === 'vi' ? 'Tên sản phẩm' : 'Product Name'}</Label>
                            <Select
                              value={item.productId ? String(item.productId) : ''}
                              onValueChange={(value) => handleItemChange(index, 'productId', value)}
                            >
                              <SelectTrigger>
                                <SelectValue
                                  placeholder={
                                    locale === 'vi'
                                      ? 'Chọn sản phẩm'
                                      : 'Select product'
                                  }
                                />
                              </SelectTrigger>
                              <SelectContent>
                                {products.length === 0 ? (
                                  <div className="px-3 py-2 text-sm text-muted-foreground">
                                    {locale === 'vi'
                                      ? 'Không có sản phẩm'
                                      : 'No products'}
                                  </div>
                                ) : (
                                  products.map((product: Product) => (
                                    <SelectItem
                                      key={product.id}
                                      value={String(product.id)}
                                    >
                                      {getProductDisplayName(product)}
                                    </SelectItem>
                                  ))
                                )}
                              </SelectContent>
                            </Select>
                            {item.productName && (
                              <p className="mt-1 text-xs text-muted-foreground">
                                {item.productName}
                              </p>
                            )}
                          </div>
                          <div>
                            <Label>{locale === 'vi' ? 'Biến thể' : 'Variant'}</Label>
                            <Select
                              value={item.variantId ? String(item.variantId) : ''}
                              onValueChange={(value) => handleItemChange(index, 'variantId', value)}
                              disabled={!item.productId || !productDetails[index]?.variants || productDetails[index]!.variants!.length === 0}
                            >
                              <SelectTrigger>
                                <SelectValue
                                  placeholder={
                                    !item.productId
                                      ? (locale === 'vi' ? 'Chọn sản phẩm trước' : 'Select product first')
                                      : !productDetails[index]?.variants || productDetails[index]!.variants!.length === 0
                                      ? (locale === 'vi' ? 'Không có biến thể' : 'No variants')
                                      : (locale === 'vi' ? 'Chọn biến thể' : 'Select variant')
                                  }
                                />
                              </SelectTrigger>
                              <SelectContent>
                                {!item.productId || !productDetails[index]?.variants || productDetails[index]!.variants!.length === 0 ? (
                                  <div className="px-3 py-2 text-sm text-muted-foreground">
                                    {!item.productId
                                      ? (locale === 'vi' ? 'Vui lòng chọn sản phẩm trước' : 'Please select a product first')
                                      : (locale === 'vi' ? 'Sản phẩm này không có biến thể' : 'This product has no variants')}
                                  </div>
                                ) : (
                                  productDetails[index]!.variants!.map((variant: ProductVariant) => {
                                    const variantName = variant.name || variant.nameVi || variant.nameEn || '';
                                    const variantValue = variant.value || '';
                                    const displayText = variantName && variantValue ? `${variantName}: ${variantValue}` : variantValue || variantName || `Variant #${variant.id}`;
                                    return (
                                      <SelectItem
                                        key={variant.id}
                                        value={String(variant.id)}
                                      >
                                        {displayText}
                                      </SelectItem>
                                    );
                                  })
                                )}
                              </SelectContent>
                            </Select>
                            {item.variantName && !item.variantId && (
                              <p className="mt-1 text-xs text-muted-foreground">
                                {item.variantName}
                              </p>
                            )}
                          </div>
                          <div>
                            <Label>{locale === 'vi' ? 'Số lượng' : 'Quantity'}</Label>
                            <Input
                              type="number"
                              min="1"
                              value={item.quantity}
                              onChange={(e) => handleItemChange(index, 'quantity', parseInt(e.target.value) || 1)}
                            />
                          </div>
                          <div>
                            <Label>{locale === 'vi' ? 'Giá' : 'Price'}</Label>
                            <Input
                              type="number"
                              min="0"
                              step="0.01"
                              value={item.price}
                              onChange={(e) => handleItemChange(index, 'price', parseFloat(e.target.value) || 0)}
                            />
                          </div>
                          <div className="flex items-end">
                            <Button
                              type="button"
                              variant="destructive"
                              size="sm"
                              onClick={() => handleRemoveItem(index)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                        <div className="text-right text-sm font-medium">
                          {locale === 'vi' ? 'Tổng:' : 'Total:'} {formatPrice(item.price * item.quantity)}
                        </div>
                      </div>
                    ))}
                    {editData.items.length === 0 && (
                      <p className="text-center text-muted-foreground py-4">
                        {locale === 'vi' ? 'Chưa có sản phẩm nào' : 'No items yet'}
                      </p>
                    )}
                  </div>
                ) : (
                  <div className="space-y-4">
                    {order.items?.map((item: any) => (
                      <div key={item.id} className="flex justify-between items-start p-4 bg-muted/30 rounded-lg">
                        <div className="flex-1">
                          <p className="font-medium">{item.productName}</p>
                          {item.variantName && (
                            <p className="text-sm text-muted-foreground">{item.variantName}</p>
                          )}
                          <p className="text-sm text-muted-foreground mt-1">
                            {formatPrice(parseFloat(item.price))} x {item.quantity}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-bold">{formatPrice(parseFloat(item.total))}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                <Separator className="my-6" />

                {/* Order Summary */}
                {editMode ? (
                  <div className="space-y-4">
                    <div className="grid gap-4 md:grid-cols-2">
                      <div>
                        <Label>{locale === 'vi' ? 'Tạm tính' : 'Subtotal'}</Label>
                        <Input
                          type="number"
                          step="0.01"
                          value={editData.subtotal}
                          onChange={(e) => {
                            setEditData({ ...editData, subtotal: e.target.value });
                            recalculateTotals();
                          }}
                        />
                      </div>
                      <div>
                        <Label>{locale === 'vi' ? 'Phí vận chuyển' : 'Shipping Fee'}</Label>
                        <Input
                          type="number"
                          step="0.01"
                          value={editData.shippingFee}
                          onChange={(e) => {
                            setEditData({ ...editData, shippingFee: e.target.value });
                            recalculateTotals();
                          }}
                        />
                      </div>
                      <div>
                        <Label>{locale === 'vi' ? 'Giảm giá' : 'Discount'}</Label>
                        <Input
                          type="number"
                          step="0.01"
                          value={editData.discountAmount}
                          onChange={(e) => {
                            setEditData({ ...editData, discountAmount: e.target.value });
                            recalculateTotals();
                          }}
                        />
                      </div>
                      <div>
                        <Label>{locale === 'vi' ? 'Tổng cộng' : 'Total'}</Label>
                        <Input
                          type="number"
                          step="0.01"
                          value={editData.total}
                          onChange={(e) => setEditData({ ...editData, total: e.target.value })}
                        />
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="flex justify-between text-sm">
                      <span>{locale === 'vi' ? 'Tổng tiền hàng' : 'Subtotal'}</span>
                      <span>{formatPrice(parseFloat(order.subtotal))}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>{locale === 'vi' ? 'Phí vận chuyển' : 'Shipping'}</span>
                      <span>{formatPrice(parseFloat(order.shippingFee))}</span>
                    </div>
                    {parseFloat(order.discountAmount) > 0 && (
                      <div className="flex justify-between text-sm text-green-600">
                        <span>{locale === 'vi' ? 'Giảm giá' : 'Discount'}</span>
                        <span>-{formatPrice(parseFloat(order.discountAmount))}</span>
                      </div>
                    )}
                    <Separator />
                    <div className="flex justify-between font-bold text-lg">
                      <span>{locale === 'vi' ? 'Tổng cộng' : 'Total'}</span>
                      <span className="text-primary">{formatPrice(parseFloat(order.total))}</span>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Order Status History */}
            {order.statusHistory && order.statusHistory.filter((h: any) => h.type !== 'payment_status').length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <History className="h-5 w-5" />
                    {locale === 'vi' ? 'Lịch sử trạng thái đơn hàng' : 'Order Status History'}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {order.statusHistory
                      .filter((h: any) => h.type !== 'payment_status')
                      .map((history: any, index: number, filteredArray: any[]) => (
                        <div key={history.id} className="flex gap-4">
                          <div className="flex flex-col items-center">
                            <div className="h-3 w-3 rounded-full bg-primary" />
                            {index < filteredArray.length - 1 && (
                              <div className="w-0.5 h-full bg-border mt-2" />
                            )}
                          </div>
                          <div className="flex-1 pb-4">
                            <div className="flex items-center gap-2 mb-1">
                              {getStatusBadge(history.status)}
                              <span className="text-sm text-muted-foreground">
                                {format(new Date(history.createdAt), 'dd/MM/yyyy HH:mm')}
                              </span>
                            </div>
                            {history.note && (
                              <p className="text-sm text-muted-foreground mt-1">{history.note}</p>
                            )}
                            {history.changedBy && (
                              <p className="text-xs text-muted-foreground mt-1">
                                {locale === 'vi' ? 'Bởi:' : 'By:'} {history.changedBy}
                              </p>
                            )}
                          </div>
                        </div>
                      ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Payment Status History */}
            {order.statusHistory && order.statusHistory.filter((h: any) => h.type === 'payment_status').length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <History className="h-5 w-5" />
                    {locale === 'vi' ? 'Lịch sử trạng thái thanh toán' : 'Payment Status History'}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {order.statusHistory
                      .filter((h: any) => h.type === 'payment_status')
                      .map((history: any, index: number, filteredArray: any[]) => (
                        <div key={history.id} className="flex gap-4">
                          <div className="flex flex-col items-center">
                            <div className="h-3 w-3 rounded-full bg-primary" />
                            {index < filteredArray.length - 1 && (
                              <div className="w-0.5 h-full bg-border mt-2" />
                            )}
                          </div>
                          <div className="flex-1 pb-4">
                            <div className="flex items-center gap-2 mb-1">
                              {getPaymentStatusBadge(history.status)}
                              <span className="text-sm text-muted-foreground">
                                {format(new Date(history.createdAt), 'dd/MM/yyyy HH:mm')}
                              </span>
                            </div>
                            {history.note && (
                              <p className="text-sm text-muted-foreground mt-1">{history.note}</p>
                            )}
                            {history.changedBy && (
                              <p className="text-xs text-muted-foreground mt-1">
                                {locale === 'vi' ? 'Bởi:' : 'By:'} {history.changedBy}
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

          {/* Right Column - Customer Info & Order Info */}
          <div className="space-y-6">
            {/* Customer Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  {locale === 'vi' ? 'Thông tin khách hàng' : 'Customer Info'}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {editMode ? (
                  <div className="space-y-4">
                    <div>
                      <Label>{locale === 'vi' ? 'Họ tên' : 'Name'}</Label>
                      <Input
                        value={editData.customerName}
                        onChange={(e) => setEditData({ ...editData, customerName: e.target.value })}
                        required
                      />
                    </div>
                    <div>
                      <Label>Email</Label>
                      <Input
                        type="email"
                        value={editData.customerEmail}
                        onChange={(e) => setEditData({ ...editData, customerEmail: e.target.value })}
                        required
                      />
                    </div>
                    <div>
                      <Label>{locale === 'vi' ? 'Số điện thoại' : 'Phone'}</Label>
                      <Input
                        value={editData.customerPhone}
                        onChange={(e) => setEditData({ ...editData, customerPhone: e.target.value })}
                        required
                      />
                    </div>
                    <div>
                      <Label>{locale === 'vi' ? 'Địa chỉ giao hàng' : 'Shipping Address'}</Label>
                      <Textarea
                        value={editData.customerAddress}
                        onChange={(e) => setEditData({ ...editData, customerAddress: e.target.value })}
                        rows={3}
                        required
                      />
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="flex items-start gap-2">
                      <User className="h-4 w-4 text-muted-foreground mt-0.5" />
                      <div>
                        <p className="text-sm text-muted-foreground">
                          {locale === 'vi' ? 'Họ tên' : 'Name'}
                        </p>
                        <p className="font-medium">{order.customerName}</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-2">
                      <Phone className="h-4 w-4 text-muted-foreground mt-0.5" />
                      <div>
                        <p className="text-sm text-muted-foreground">
                          {locale === 'vi' ? 'Số điện thoại' : 'Phone'}
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
                          {locale === 'vi' ? 'Địa chỉ giao hàng' : 'Shipping Address'}
                        </p>
                        <p className="font-medium">
                          {typeof order.shippingAddress === 'string'
                            ? order.shippingAddress
                            : order.shippingAddress
                            ? [
                                order.shippingAddress.address,
                                order.shippingAddress.ward,
                                order.shippingAddress.district,
                                order.shippingAddress.province,
                              ].filter(Boolean).join(', ')
                            : (order as any).customerAddress || '-'}
                        </p>
                      </div>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>

            {/* Order Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Package className="h-5 w-5" />
                  {locale === 'vi' ? 'Thông tin đơn hàng' : 'Order Info'}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <p className="text-sm text-muted-foreground">
                    {locale === 'vi' ? 'Mã đơn hàng' : 'Order Number'}
                  </p>
                  <p className="font-medium">#{order.orderNumber}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">
                    {locale === 'vi' ? 'Trạng thái' : 'Status'}
                  </p>
                  <div className="mt-1">{getStatusBadge(order.status)}</div>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">
                    {locale === 'vi' ? 'Trạng thái thanh toán' : 'Payment Status'}
                  </p>
                  <div className="mt-1">
                    {getStatusBadge(order.paymentStatus || 'unpaid')}
                  </div>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">
                    {locale === 'vi' ? 'Ngày đặt hàng' : 'Order Date'}
                  </p>
                  <p className="font-medium">
                    {format(new Date(order.createdAt), 'dd/MM/yyyy HH:mm')}
                  </p>
                </div>
                {((order as any).notes || (order as any).note) && (
                  <div>
                    <p className="text-sm text-muted-foreground">
                      {locale === 'vi' ? 'Ghi chú' : 'Notes'}
                    </p>
                    <p className="font-medium text-sm italic">{(order as any).notes || (order as any).note}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
