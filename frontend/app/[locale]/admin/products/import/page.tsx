'use client';

import ProductImport from '@/components/admin/product-import';

export default function AdminProductImportPage({ params: { locale } }: { params: { locale: string } }) {
  return <ProductImport locale={locale} />;
}

