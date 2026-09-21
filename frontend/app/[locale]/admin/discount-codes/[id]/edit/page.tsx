'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAdminDiscountCode, useUpdateDiscountCode } from '@/lib/hooks/use-admin';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { ArrowLeft } from 'lucide-react';
import { UpdateDiscountCodeDto } from '@/lib/types/api';
import { useTranslations } from 'next-intl';

export default function EditDiscountCode({
  params: { locale, id },
}: {
  params: { locale: string; id: string };
}) {
  const t = useTranslations();
  const router = useRouter();
  const codeId = parseInt(id);
  const { data: discountCode, isLoading: loading } = useAdminDiscountCode(codeId);
  const { mutate: updateDiscountCode, isPending: isUpdating } = useUpdateDiscountCode();

  const [formData, setFormData] = useState<UpdateDiscountCodeDto>({
    code: '',
    name: '',
    discountType: 'percentage',
    discountValue: 0,
    maxUsage: 1,
    expiryDate: '',
    status: 'active',
    allowMultiple: false,
  });

  useEffect(() => {
    if (discountCode) {
      // Format expiry date for input field (YYYY-MM-DDTHH:mm)
      const expiryDate = new Date(discountCode.expiryDate || discountCode.endDate || '');
      
      setFormData({
        code: discountCode.code,
        name: discountCode.name || discountCode.nameVi || discountCode.nameEn || '',
        discountType: discountCode.discountType,
        discountValue: parseFloat(discountCode.discountValue),
        maxUsage: discountCode.maxUsage || discountCode.maxUses || 1,
        expiryDate: new Date(expiryDate.getTime() - expiryDate.getTimezoneOffset() * 60000)
          .toISOString()
          .slice(0, 16),
        status: discountCode.status || (discountCode.isActive ? 'active' : 'inactive'),
        allowMultiple: discountCode.allowMultiple || false,
      });
    }
  }, [discountCode]);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value, type } = e.target;
    
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
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Convert expiry date to ISO string
    const dataToSend: UpdateDiscountCodeDto = {
      ...formData,
      discountType: 'percentage',
      expiryDate: new Date(formData.expiryDate!).toISOString(),
    };

    updateDiscountCode(
      { id: codeId, data: dataToSend },
      {
        onSuccess: () => {
          router.push(`/${locale}/admin/discount-codes`);
        },
        onError: (error: any) => {
          console.error('Failed to update discount code:', error);
          const errorMessage =
            error.response?.data?.message ||
            t('admin.discountCodes.errors.updateFailed');
          alert(errorMessage);
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
            {t('admin.loading')}
          </p>
        </div>
      </div>
    );
  }

  if (!discountCode) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="text-center">
          <p className="text-lg text-gray-600">
            {t('admin.discountCodes.notFound')}
          </p>
          <Button
            onClick={() => router.push(`/${locale}/admin/discount-codes`)}
            className="mt-4"
          >
            {t('admin.discountCodes.goBack')}
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
          onClick={() => router.push(`/${locale}/admin/discount-codes`)}
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            {t('admin.discountCodes.editTitle')}
          </h1>
          <p className="text-sm text-gray-600">
            {t('admin.discountCodes.editDescription')}
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
                {t('admin.discountCodes.form.discountCode')} *
              </Label>
              <Input
                id="code"
                name="code"
                value={formData.code}
                onChange={handleInputChange}
                required
                placeholder={t('admin.discountCodes.form.placeholderCode')}
                className="uppercase"
              />
            </div>

            {/* Name */}
            <div>
              <Label htmlFor="name">
                {t('admin.discountCodes.form.discountCodeName')} *
              </Label>
              <Input
                id="name"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                required
                placeholder={t('admin.discountCodes.form.placeholderName')}
              />
            </div>

            {/* Discount Type */}
            <div>
              <Label>
                {t('admin.discountCodes.form.discountType')}
              </Label>
              <div className="w-full rounded-md border border-dashed border-gray-300 px-3 py-2 text-sm bg-gray-50 text-gray-600">
                {t('admin.discountCodes.form.percentage')}
              </div>
              <p className="mt-1 text-xs text-gray-500">
                {t('admin.discountCodes.form.onlyPercentage')}
              </p>
            </div>

            {/* Discount Value */}
            <div>
              <Label htmlFor="discountValue">
                {t('admin.discountCodes.form.discountValue')} *
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
                placeholder={t('admin.discountCodes.form.placeholderValue')}
              />
              <p className="mt-1 text-xs text-gray-500">
                {formData.discountType === 'percentage'
                  ? t('admin.discountCodes.form.enterPercentage')
                  : t('admin.discountCodes.form.enterAmount')}
              </p>
            </div>

            {/* Max Usage */}
            <div>
              <Label htmlFor="maxUsage">
                {t('admin.discountCodes.form.maxUsage')} *
              </Label>
              <Input
                id="maxUsage"
                name="maxUsage"
                type="number"
                min="1"
                value={formData.maxUsage}
                onChange={handleInputChange}
                required
                placeholder={t('admin.discountCodes.form.placeholderMaxUsage')}
              />
              <p className="mt-1 text-xs text-gray-500">
                {t('admin.discountCodes.form.used')}: {discountCode.currentUsage || discountCode.usedCount || 0} {t('admin.discountCodes.form.times')}
              </p>
            </div>

            {/* Status */}
            <div>
              <Label htmlFor="status">
                {t('admin.discountCodes.form.status')} *
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
                  {t('admin.discountCodes.form.active')}
                </option>
                <option value="inactive">
                  {t('admin.discountCodes.form.inactive')}
                </option>
              </select>
            </div>

            {/* Allow Multiple - Reusable per user */}
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
                  {t('admin.discountCodes.form.allowMultiple')}
                </Label>
              </div>
              <p className="mt-1 text-xs text-gray-500 ml-6">
                {t('admin.discountCodes.form.allowMultipleDescription')}
              </p>
            </div>

            {/* Expiry Date */}
            <div className="md:col-span-2">
              <Label htmlFor="expiryDate">
                {t('admin.discountCodes.form.expiryDate')} *
              </Label>
              <Input
                id="expiryDate"
                name="expiryDate"
                type="datetime-local"
                value={formData.expiryDate}
                onChange={handleInputChange}
                required
              />
              <p className="mt-1 text-xs text-gray-500">
                {t('admin.discountCodes.form.expiryDateMustFuture')}
              </p>
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-4 pt-4 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.push(`/${locale}/admin/discount-codes`)}
              disabled={isUpdating}
            >
              {t('admin.discountCodes.actions.cancel')}
            </Button>
            <Button type="submit" disabled={isUpdating}>
              {isUpdating
                ? t('admin.discountCodes.actions.updating')
                : t('admin.discountCodes.actions.update')}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}

