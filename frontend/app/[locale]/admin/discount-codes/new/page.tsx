'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useCreateDiscountCode } from '@/lib/hooks/use-admin';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { ArrowLeft } from 'lucide-react';
import { CreateDiscountCodeDto } from '@/lib/types/api';
import { useTranslations } from 'next-intl';

export default function NewDiscountCode({
  params: { locale },
}: {
  params: { locale: string };
}) {
  const t = useTranslations();
  const router = useRouter();
  const { mutate: createDiscountCode, isPending: isCreating } = useCreateDiscountCode();

  const [formData, setFormData] = useState<CreateDiscountCodeDto>({
    code: '',
    name: '',
    discountType: 'percentage',
    discountValue: 0,
    maxUsage: 1,
    expiryDate: '',
    status: 'active',
    allowMultiple: false,
  });

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
    const dataToSend: CreateDiscountCodeDto = {
      ...formData,
      discountType: 'percentage',
      expiryDate: formData.expiryDate ? new Date(formData.expiryDate).toISOString() : undefined,
    };

    createDiscountCode(dataToSend, {
      onSuccess: () => {
        router.push(`/${locale}/admin/discount-codes`);
      },
      onError: (error: any) => {
        console.error('Failed to create discount code:', error);
        const errorMessage =
          error.response?.data?.message ||
          t('admin.discountCodes.errors.createFailed');
        alert(errorMessage);
      },
    });
  };

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
            {t('admin.discountCodes.newTitle')}
          </h1>
          <p className="text-sm text-gray-600">
            {t('admin.discountCodes.newDescription')}
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
              <p className="mt-1 text-xs text-gray-500">
                {t('admin.discountCodes.form.codeMustUnique')}
              </p>
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
                {t('admin.discountCodes.form.maxUsageDescription')}
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

          {/* Info Box */}
          <div className="rounded-md bg-blue-50 p-4 border border-blue-200">
            <h3 className="text-sm font-semibold text-blue-900 mb-2">
              {t('admin.discountCodes.info.title')}
            </h3>
            <ul className="text-xs text-blue-800 space-y-1 list-disc list-inside">
              <li>{t('admin.discountCodes.info.uniqueCode')}</li>
              <li>{t('admin.discountCodes.info.futureDate')}</li>
              <li>{t('admin.discountCodes.info.maxUsagePositive')}</li>
            </ul>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-4 pt-4 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.push(`/${locale}/admin/discount-codes`)}
              disabled={isCreating}
            >
              {t('admin.discountCodes.actions.cancel')}
            </Button>
            <Button type="submit" disabled={isCreating}>
              {isCreating
                ? t('admin.discountCodes.actions.creating')
                : t('admin.discountCodes.actions.create')}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}

