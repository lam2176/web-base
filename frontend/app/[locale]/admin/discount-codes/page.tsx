'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Plus, Search, Edit, Trash2, Copy } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useAdminDiscountCodes, useDeleteDiscountCode } from '@/lib/hooks/use-admin';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { DiscountCode } from '@/lib/types/api';
import { useCurrency } from '@/lib/hooks/useCurrency';

export default function AdminDiscountCodesPage({ params: { locale } }: { params: { locale: string } }) {
  const t = useTranslations();
  const [search, setSearch] = useState('');
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [codeToDelete, setCodeToDelete] = useState<DiscountCode | null>(null);

  const { data: codes = [], isLoading: loading } = useAdminDiscountCodes();
  const { mutate: deleteCode } = useDeleteDiscountCode();
  const { formatPrice } = useCurrency();

  const handleDelete = () => {
    if (!codeToDelete) return;

    deleteCode(codeToDelete.id, {
      onSuccess: () => {
        setDeleteDialogOpen(false);
        setCodeToDelete(null);
      },
      onError: (error) => {
        console.error('Failed to delete discount code:', error);
        alert(t('admin.discountCodes.deleteError'));
      },
    });
  };

  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    alert(t('admin.discountCodes.codeCopied'));
  };

  const getDiscountDisplay = (code: DiscountCode) => {
    if (code.discountType === 'percentage') {
      return `${code.discountValue}%`;
    }
    return formatPrice(parseFloat(code.discountValue));
  };

  const getUsageDisplay = (code: DiscountCode) => {
    const used = code.currentUsage ?? code.usedCount ?? 0;
    const max =
      code.maxUsage ?? code.maxUses ?? t('admin.discountCodes.unlimited');
    return `${used} / ${typeof max === 'number' ? max : max}`;
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return t('admin.discountCodes.unlimited');
    const date = new Date(dateString);
    return new Intl.DateTimeFormat(locale === 'vi' ? 'vi-VN' : 'en-US', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).format(date);
  };

  const getStatusLabel = (status: string) => {
    if (status === 'active') return t('admin.discountCodes.statusActive');
    if (status === 'expired') return t('admin.discountCodes.statusExpired');
    return t('admin.discountCodes.statusInactive');
  };

  const getDiscountCodeStatus = (code: DiscountCode): 'active' | 'expired' | 'inactive' => {
    const now = new Date();
    const expiryDate = code.expiryDate || code.endDate;
    const startDate = code.startDate;
    
    // Kiểm tra hết hạn
    if (expiryDate && new Date(expiryDate) < now) {
      return 'expired';
    }
    
    // Kiểm tra chưa bắt đầu
    if (startDate && new Date(startDate) > now) {
      return 'inactive';
    }
    
    // Đang trong thời gian: kiểm tra trạng thái
    const isActive = code.status === 'active' || code.isActive === true;
    if (isActive) {
      return 'active';
    }
    
    return 'inactive';
  };

  const filteredCodes = codes.filter((code) =>
    code.code.toLowerCase().includes(search.toLowerCase()) ||
    code.nameVi?.toLowerCase().includes(search.toLowerCase()) ||
    code.nameEn?.toLowerCase().includes(search.toLowerCase())
  );

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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            {t('admin.discountCodes.title')}
          </h1>
          <p className="text-sm text-gray-600">
            {t('admin.discountCodes.description')}
          </p>
        </div>
        <Link href={`/${locale}/admin/discount-codes/new`}>
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            {t('admin.discountCodes.addCode')}
          </Button>
        </Link>
      </div>

      {/* Search */}
      <Card className="p-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <Input
            placeholder={t('admin.discountCodes.searchPlaceholder')}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
      </Card>

      {/* Codes Table */}
      <Card>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="border-b bg-gray-50">
              <tr>
                <th className="p-4 text-left text-sm font-medium text-gray-600">
                  {t('admin.discountCodes.code')}
                </th>
                <th className="p-4 text-left text-sm font-medium text-gray-600">
                  {t('admin.discountCodes.name')}
                </th>
                <th className="p-4 text-left text-sm font-medium text-gray-600">
                  {t('admin.discountCodes.discount')}
                </th>
                <th className="p-4 text-left text-sm font-medium text-gray-600">
                  {t('admin.discountCodes.usage')}
                </th>
                <th className="p-4 text-left text-sm font-medium text-gray-600">
                  {t('admin.discountCodes.expires')}
                </th>
                <th className="p-4 text-left text-sm font-medium text-gray-600">
                  {t('admin.discountCodes.status')}
                </th>
                <th className="p-4 text-right text-sm font-medium text-gray-600">
                  {t('admin.discountCodes.actionsColumn')}
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredCodes.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-gray-500">
                    {t('admin.discountCodes.noCodesFound')}
                  </td>
                </tr>
              ) : (
                filteredCodes.map((code) => (
                  <tr key={code.id} className="border-b last:border-0 hover:bg-gray-50">
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-blue-600">{code.code}</span>
                        <button
                          onClick={() => handleCopyCode(code.code)}
                          className="text-gray-400 hover:text-gray-600"
                        >
                          <Copy className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                    <td className="p-4 text-sm text-gray-900">
                      {code.name || (locale === 'vi' ? code.nameVi : code.nameEn)}
                      {code.allowMultiple ? (
                        <span className="ml-2 inline-flex items-center rounded-full bg-blue-100 px-2 py-0.5 text-[10px] font-semibold text-blue-800 uppercase tracking-wide">
                          {t('admin.discountCodes.stackable')}
                        </span>
                      ) : null}
                    </td>
                    <td className="p-4">
                      <span className="font-semibold text-green-600">
                        {getDiscountDisplay(code)}
                      </span>
                    </td>
                    <td className="p-4 text-sm text-gray-600">
                      {getUsageDisplay(code)}
                    </td>
                    <td className="p-4 text-sm text-gray-600">
                      {formatDate(code.expiryDate || code.endDate || null)}
                    </td>
                    <td className="p-4">
                      {(() => {
                        const status = getDiscountCodeStatus(code);
                        return (
                          <span
                            className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold ${
                              status === 'active'
                                ? 'bg-green-100 text-green-800'
                                : status === 'expired'
                                ? 'bg-red-100 text-red-800'
                                : 'bg-gray-100 text-gray-800'
                            }`}
                          >
                            {getStatusLabel(status)}
                          </span>
                        );
                      })()}
                    </td>
                    <td className="p-4">
                      <div className="flex items-center justify-end gap-2">
                        <Link href={`/${locale}/admin/discount-codes/${code.id}/edit`}>
                          <Button variant="ghost" size="sm">
                            <Edit className="h-4 w-4" />
                          </Button>
                        </Link>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setCodeToDelete(code);
                            setDeleteDialogOpen(true);
                          }}
                        >
                          <Trash2 className="h-4 w-4 text-red-600" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {t('admin.discountCodes.confirmDelete')}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {t('admin.discountCodes.deleteConfirmMessage', { code: codeToDelete?.code })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('admin.discountCodes.actions.cancel')}</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-red-600 hover:bg-red-700">
              {t('common.delete')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
