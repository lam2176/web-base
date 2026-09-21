'use client';

import { ArrowLeft } from 'lucide-react';
import { useRouter } from 'next/navigation';
import PageForm from '../_components/page-form';
import { Button } from '@/components/ui/button';
import { useCreatePage } from '@/lib/hooks/use-admin';
import { CreatePageDto } from '@/lib/types/api';

export default function AdminCreatePage({ params: { locale } }: { params: { locale: string } }) {
  const router = useRouter();
  const { mutate: createPage, isPending } = useCreatePage();

  const handleSubmit = (values: CreatePageDto) => {
    createPage(values, {
      onSuccess: () => {
        router.push(`/${locale}/admin/pages`);
      },
      onError: (error: any) => {
        console.error('Failed to create page:', error);
        const message =
          error?.response?.data?.message || (locale === 'vi' ? 'Không thể tạo trang' : 'Failed to create page');
        alert(message);
      },
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="outline" onClick={() => router.push(`/${locale}/admin/pages`)}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            {locale === 'vi' ? 'Thêm Trang Mới' : 'Create New Page'}
          </h1>
          <p className="text-sm text-gray-600">
            {locale === 'vi' ? 'Tạo trang nội dung cho website' : 'Create a new CMS page for your store'}
          </p>
        </div>
      </div>

      <PageForm
        locale={locale}
        isSubmitting={isPending}
        submitLabel={locale === 'vi' ? 'Tạo trang' : 'Create page'}
        onSubmit={handleSubmit}
        onCancel={() => router.push(`/${locale}/admin/pages`)}
      />
    </div>
  );
}

