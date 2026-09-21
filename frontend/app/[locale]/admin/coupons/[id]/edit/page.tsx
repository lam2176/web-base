'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAdminCoupon, useUpdateCoupon, useAdminCategories } from '@/lib/hooks/use-admin';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { ArrowLeft } from 'lucide-react';
import { UpdateCouponDto } from '@/lib/types/api';

export default function EditCoupon({
  params: { locale, id },
}: {
  params: { locale: string; id: string };
}) {
  const router = useRouter();
  const couponId = parseInt(id);
  const { data: coupon, isLoading: loading } = useAdminCoupon(couponId);
  const { data: categories = [] } = useAdminCategories();
  const { mutate: updateCoupon, isPending: isUpdating } = useUpdateCoupon();

  const [formData, setFormData] = useState<UpdateCouponDto>({
    code: '',
    nameVi: '',
    nameEn: '',
    discountType: 'percentage',
    discountValue: 0,
    startDate: '',
    endDate: '',
    applyTo: 'all',
    categoryIds: [],
    status: 'active',
  });

  useEffect(() => {
    if (coupon) {
      // Format dates for input fields (YYYY-MM-DDTHH:mm)
      const startDate = new Date(coupon.startDate);
      const endDate = new Date(coupon.endDate);
      
      setFormData({
        code: coupon.code,
        nameVi: coupon.nameVi,
        nameEn: coupon.nameEn,
        discountType: coupon.discountType,
        discountValue: parseFloat(coupon.discountValue),
        startDate: new Date(startDate.getTime() - startDate.getTimezoneOffset() * 60000)
          .toISOString()
          .slice(0, 16),
        endDate: new Date(endDate.getTime() - endDate.getTimezoneOffset() * 60000)
          .toISOString()
          .slice(0, 16),
        applyTo: (coupon as any).applyTo || 'all',
        categoryIds: (coupon as any).categoryIds || [],
        status: coupon.status || (coupon.isActive ? 'active' : 'inactive'),
        allowMultiple: (coupon as any).allowMultiple || false,
      });
    }
  }, [coupon]);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value, type } = e.target;
    
    if (name === 'categoryIds') {
      const select = e.target as HTMLSelectElement;
      const selectedIds = Array.from(select.selectedOptions, (option) =>
        parseInt(option.value)
      );
      setFormData((prev) => ({
        ...prev,
        categoryIds: selectedIds,
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        [name]:
          type === 'number'
            ? value === ''
              ? 0
              : parseFloat(value)
            : type === 'checkbox'
            ? (e.target as HTMLInputElement).checked
            : value,
      }));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Convert dates to ISO string
    const dataToSend: UpdateCouponDto = {
      ...formData,
      startDate: new Date(formData.startDate!).toISOString(),
      endDate: new Date(formData.endDate!).toISOString(),
    };

    updateCoupon(
      { id: couponId, data: dataToSend },
      {
        onSuccess: () => {
          router.push(`/${locale}/admin/coupons`);
        },
        onError: (error: any) => {
          console.error('Failed to update coupon:', error);
          alert(
            error.response?.data?.message ||
              (locale === 'vi' ? 'Không thể cập nhật coupon' : 'Failed to update coupon')
          );
        },
      }
    );
  };

  if (loading) {
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

  if (!coupon) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="text-center">
          <p className="text-lg text-gray-600">
            {locale === 'vi' ? 'Không tìm thấy coupon' : 'Coupon not found'}
          </p>
          <Button
            onClick={() => router.push(`/${locale}/admin/coupons`)}
            className="mt-4"
          >
            {locale === 'vi' ? 'Quay lại' : 'Go back'}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button
          variant="outline"
          onClick={() => router.push(`/${locale}/admin/coupons`)}
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            {locale === 'vi' ? 'Chỉnh sửa Coupon' : 'Edit Coupon'}
          </h1>
          <p className="text-sm text-gray-600">
            {locale === 'vi' ? 'Cập nhật thông tin coupon' : 'Update coupon information'}
          </p>
        </div>
      </div>

      {/* Form */}
      <Card className="p-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Code */}
            <div>
              <Label htmlFor="code">
                {locale === 'vi' ? 'Mã coupon' : 'Coupon Code'} *
              </Label>
              <Input
                id="code"
                name="code"
                value={formData.code}
                onChange={handleInputChange}
                required
                placeholder="SUMMER2024"
              />
            </div>

            {/* Discount Type */}
            <div>
              <Label htmlFor="discountType">
                {locale === 'vi' ? 'Loại giảm giá' : 'Discount Type'} *
              </Label>
              <select
                id="discountType"
                name="discountType"
                value={formData.discountType}
                onChange={handleInputChange}
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                required
              >
                <option value="percentage">
                  {locale === 'vi' ? 'Phần trăm (%)' : 'Percentage (%)'}
                </option>
                <option value="fixed">
                  {locale === 'vi' ? 'Số tiền cố định' : 'Fixed Amount'}
                </option>
              </select>
            </div>

            {/* Name Vi */}
            <div>
              <Label htmlFor="nameVi">
                {locale === 'vi' ? 'Tên (Tiếng Việt)' : 'Name (Vietnamese)'} *
              </Label>
              <Input
                id="nameVi"
                name="nameVi"
                value={formData.nameVi}
                onChange={handleInputChange}
                required
              />
            </div>

            {/* Name En */}
            <div>
              <Label htmlFor="nameEn">
                {locale === 'vi' ? 'Tên (Tiếng Anh)' : 'Name (English)'} *
              </Label>
              <Input
                id="nameEn"
                name="nameEn"
                value={formData.nameEn}
                onChange={handleInputChange}
                required
              />
            </div>

            {/* Discount Value */}
            <div>
              <Label htmlFor="discountValue">
                {locale === 'vi' ? 'Giá trị giảm giá' : 'Discount Value'} *
              </Label>
              <Input
                id="discountValue"
                name="discountValue"
                type="number"
                step="0.01"
                min="0"
                value={formData.discountValue}
                onChange={handleInputChange}
                required
                placeholder={formData.discountType === 'percentage' ? '10' : '100000'}
              />
              <p className="mt-1 text-xs text-gray-500">
                {formData.discountType === 'percentage'
                  ? locale === 'vi'
                    ? 'Nhập số phần trăm (ví dụ: 10 = 10%)'
                    : 'Enter percentage (e.g., 10 = 10%)'
                  : locale === 'vi'
                  ? 'Nhập số tiền giảm giá'
                  : 'Enter discount amount'}
              </p>
            </div>

            {/* Status */}
            <div>
              <Label htmlFor="status">
                {locale === 'vi' ? 'Trạng thái' : 'Status'} *
              </Label>
              <select
                id="status"
                name="status"
                value={formData.status}
                onChange={handleInputChange}
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                required
              >
                <option value="active">
                  {locale === 'vi' ? 'Đang hoạt động' : 'Active'}
                </option>
                <option value="inactive">
                  {locale === 'vi' ? 'Không hoạt động' : 'Inactive'}
                </option>
              </select>
            </div>

            {/* Allow Multiple */}
            <div className="md:col-span-2">
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="allowMultiple"
                  name="allowMultiple"
                  checked={formData.allowMultiple || false}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      allowMultiple: e.target.checked,
                    }))
                  }
                  className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <Label htmlFor="allowMultiple" className="font-normal cursor-pointer">
                  {locale === 'vi'
                    ? 'Cho phép sử dụng cùng với mã giảm giá khác'
                    : 'Allow using with other discount codes'}
                </Label>
              </div>
              <p className="mt-1 text-xs text-gray-500 ml-6">
                {locale === 'vi'
                  ? 'Nếu bật, người dùng có thể sử dụng mã giảm giá này cùng với các mã giảm giá khác trong cùng một đơn hàng'
                  : 'If enabled, users can use this coupon together with other discount codes in the same order'}
              </p>
            </div>

            {/* Start Date */}
            <div>
              <Label htmlFor="startDate">
                {locale === 'vi' ? 'Ngày bắt đầu' : 'Start Date'} *
              </Label>
              <Input
                id="startDate"
                name="startDate"
                type="datetime-local"
                value={formData.startDate}
                onChange={handleInputChange}
                required
              />
            </div>

            {/* End Date */}
            <div>
              <Label htmlFor="endDate">
                {locale === 'vi' ? 'Ngày kết thúc' : 'End Date'} *
              </Label>
              <Input
                id="endDate"
                name="endDate"
                type="datetime-local"
                value={formData.endDate}
                onChange={handleInputChange}
                required
              />
            </div>

            {/* Apply To */}
            <div>
              <Label htmlFor="applyTo">
                {locale === 'vi' ? 'Áp dụng cho' : 'Apply To'} *
              </Label>
              <select
                id="applyTo"
                name="applyTo"
                value={formData.applyTo}
                onChange={handleInputChange}
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                required
              >
                <option value="all">
                  {locale === 'vi' ? 'Tất cả sản phẩm' : 'All Products'}
                </option>
                <option value="category">
                  {locale === 'vi' ? 'Danh mục cụ thể' : 'Specific Categories'}
                </option>
              </select>
            </div>

            {/* Category IDs */}
            {formData.applyTo === 'category' && (
              <div>
                <Label htmlFor="categoryIds">
                  {locale === 'vi' ? 'Danh mục' : 'Categories'} *
                </Label>
                <select
                  id="categoryIds"
                  name="categoryIds"
                  multiple
                  value={formData.categoryIds?.map(String) || []}
                  onChange={handleInputChange}
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 min-h-[100px]"
                  required={formData.applyTo === 'category'}
                >
                  {categories.map((category) => (
                    <option key={category.id} value={category.id}>
                      {locale === 'vi' ? category.nameVi : category.nameEn}
                    </option>
                  ))}
                </select>
                <p className="mt-1 text-xs text-gray-500">
                  {locale === 'vi'
                    ? 'Giữ Ctrl (hoặc Cmd trên Mac) để chọn nhiều danh mục'
                    : 'Hold Ctrl (or Cmd on Mac) to select multiple categories'}
                </p>
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-4 pt-4 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.push(`/${locale}/admin/coupons`)}
              disabled={isUpdating}
            >
              {locale === 'vi' ? 'Hủy' : 'Cancel'}
            </Button>
            <Button type="submit" disabled={isUpdating}>
              {isUpdating
                ? locale === 'vi'
                  ? 'Đang cập nhật...'
                  : 'Updating...'
                : locale === 'vi'
                ? 'Cập nhật'
                : 'Update'}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}

