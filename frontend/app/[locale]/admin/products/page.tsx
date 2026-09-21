'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import Link from 'next/link';
import { Plus, Search, Edit, Trash2, Eye, Upload } from 'lucide-react';
import { useAuthStore } from '@/lib/stores/auth.store';
import { Product } from '@/lib/types/api';
import { useCurrency } from '@/lib/hooks/useCurrency';
import { useAdminProducts, useDeleteProduct } from '@/lib/hooks/use-admin';
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

export default function AdminProductsPage({ params: { locale } }: { params: { locale: string } }) {
  const t = useTranslations('admin.products');
  const router = useRouter();
  const { user, isAuthenticated } = useAuthStore();
  const { formatPrice } = useCurrency();

  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [productToDelete, setProductToDelete] = useState<Product | null>(null);
  const limit = 10;

  // Use TanStack Query hooks
  const { data: productsData, isLoading: loading } = useAdminProducts({
    page,
    limit,
    search: search || undefined,
  });
  const { mutate: deleteProduct } = useDeleteProduct();

  const products = productsData?.data || [];
  const totalPages = productsData?.pagination.totalPages || 1;

  const handleDelete = () => {
    if (!productToDelete) return;

    deleteProduct(productToDelete.id, {
      onSuccess: () => {
        setDeleteDialogOpen(false);
        setProductToDelete(null);
      },
      onError: (error) => {
        console.error('Failed to delete product:', error);
        alert(t('delete.error'));
      },
    });
  };

  if (loading && products.length === 0) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent"></div>
          <p className="mt-2 text-sm text-gray-600">
            {t('loading')}
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
            {t('title')}
          </h1>
          <p className="text-sm text-gray-600">
            {t('description')}
          </p>
        </div>
        <div className="flex gap-2">
          <Link href={`/${locale}/admin/products/import`}>
            <Button variant="outline">
              <Upload className="mr-2 h-4 w-4" />
              {t('importCSV')}
            </Button>
          </Link>
          <Link href={`/${locale}/admin/products/new`}>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              {t('addProduct')}
            </Button>
          </Link>
        </div>
      </div>

      {/* Search */}
      <Card className="p-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <Input
            placeholder={t('searchPlaceholder')}
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className="pl-9"
          />
        </div>
      </Card>

      {/* Products Table */}
      <Card>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="border-b bg-gray-50">
              <tr>
                <th className="p-4 text-left text-sm font-medium text-gray-600">
                  {t('table.product')}
                </th>
                <th className="p-4 text-left text-sm font-medium text-gray-600">
                  {t('table.category')}
                </th>
                <th className="p-4 text-left text-sm font-medium text-gray-600">
                  {t('table.price')}
                </th>
                <th className="p-4 text-left text-sm font-medium text-gray-600">
                  {t('table.stock')}
                </th>
                <th className="p-4 text-left text-sm font-medium text-gray-600">
                  {t('table.status')}
                </th>
                <th className="p-4 text-right text-sm font-medium text-gray-600">
                  {t('table.actions')}
                </th>
              </tr>
            </thead>
            <tbody>
              {products.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-gray-500">
                    {t('noProducts')}
                  </td>
                </tr>
              ) : (
                products.map((product) => (
                  <tr key={product.id} className="border-b last:border-0 hover:bg-gray-50">
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        {product.images && product.images[0] ? (
                          <img
                            src={product.images[0].url || product.images[0].media?.url || ''}
                            alt={locale === 'vi' ? (product.nameVi || product.name) : (product.nameEn || product.name)}
                            className="h-12 w-12 rounded-lg object-cover"
                          />
                        ) : (
                          <div className="h-12 w-12 rounded-lg bg-gray-200" />
                        )}
                        <div>
                          <p className="font-medium text-gray-900">
                            {locale === 'vi' ? (product.nameVi || product.name) : (product.nameEn || product.name)}
                          </p>
                          <p className="text-sm text-gray-500">{product.sku}</p>
                        </div>
                      </div>
                    </td>
                    <td className="p-4 text-sm text-gray-600">
                      {product.category 
                        ? (locale === 'vi' 
                            ? (product.category.nameVi || product.category.name) 
                            : (product.category.nameEn || product.category.name))
                        : '-'}
                    </td>
                    <td className="p-4">
                      <div className="text-sm">
                        <p className="font-medium text-gray-900">{formatPrice(product.price || 0)}</p>
                        {product.compareAtPrice && product.price && product.compareAtPrice > product.price && (
                          <p className="text-xs text-gray-500 line-through">
                            {formatPrice(product.compareAtPrice)}
                          </p>
                        )}
                      </div>
                    </td>
                    <td className="p-4">
                      {product.trackInventory ? (
                        <span
                          className={`text-sm font-medium ${
                            (product.inventoryQuantity || 0) > 10
                              ? 'text-green-600'
                              : (product.inventoryQuantity || 0) > 0
                              ? 'text-yellow-600'
                              : 'text-red-600'
                          }`}
                        >
                          {product.inventoryQuantity}
                        </span>
                      ) : (
                        <span className="text-sm text-gray-500">
                          {t('table.unlimited')}
                        </span>
                      )}
                    </td>
                    <td className="p-4">
                      <span
                        className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold ${
                          product.isActive
                            ? 'bg-green-100 text-green-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}
                      >
                        {product.isActive ? t('status.active') : t('status.inactive')}
                      </span>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center justify-end gap-2">
                        <Link href={`/${locale}/products/${product.slug}`} target="_blank">
                          <Button variant="ghost" size="sm">
                            <Eye className="h-4 w-4" />
                          </Button>
                        </Link>
                        <Link href={`/${locale}/admin/products/${product.id}/edit`}>
                          <Button variant="ghost" size="sm">
                            <Edit className="h-4 w-4" />
                          </Button>
                        </Link>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setProductToDelete(product);
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

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between border-t p-4">
            <p className="text-sm text-gray-600">
              {t('pagination.page')} {page} {t('pagination.of')} {totalPages}
            </p>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
              >
                {t('pagination.previous')}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
              >
                {t('pagination.next')}
              </Button>
            </div>
          </div>
        )}
      </Card>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {t('delete.title')}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {t('delete.description', { 
                name: productToDelete 
                  ? (locale === 'vi' 
                      ? (productToDelete.nameVi || productToDelete.name) 
                      : (productToDelete.nameEn || productToDelete.name))
                  : ''
              })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('delete.cancel')}</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-red-600 hover:bg-red-700">
              {t('delete.confirm')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
