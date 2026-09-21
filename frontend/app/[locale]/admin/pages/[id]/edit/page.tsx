'use client';

import { ArrowLeft } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import PageForm from '../../_components/page-form';
import { useAdminPage, useUpdatePage } from '@/lib/hooks/use-admin';
import { CreatePageDto, UpdatePageDto } from '@/lib/types/api';

export default function AdminEditPage({ params: { locale, id } }: { params: { locale: string; id: string } }) {
  const router = useRouter();
  const pageId = Number(id);
  const { data: page, isLoading } = useAdminPage(pageId);
  const { mutate: updatePage, isPending } = useUpdatePage();

  const handleSubmit = (values: CreatePageDto) => {
    const payload: UpdatePageDto = { ...values };
    updatePage(
      { id: pageId, data: payload },
      {
        onSuccess: () => router.push(`/${locale}/admin/pages`),
        onError: (error: any) => {
          console.error('Failed to update page:', error);
          const message =
            error?.response?.data?.message || (locale === 'vi' ? 'Không thể cập nhật trang' : 'Failed to update page');
          alert(message);
        },
      },
    );
  };

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent" />
          <p className="mt-2 text-sm text-gray-600">{locale === 'vi' ? 'Đang tải...' : 'Loading...'}</p>
        </div>
      </div>
    );
  }

  if (!page) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="text-center">
          <p className="text-lg text-gray-600">
            {locale === 'vi' ? 'Không tìm thấy trang' : 'Page not found'}
          </p>
          <Button onClick={() => router.push(`/${locale}/admin/pages`)} className="mt-4">
            {locale === 'vi' ? 'Quay lại' : 'Go back'}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="outline" onClick={() => router.push(`/${locale}/admin/pages`)}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            {locale === 'vi' ? 'Chỉnh Sửa Trang' : 'Edit Page'}
          </h1>
          <p className="text-sm text-gray-600">
            {locale === 'vi' ? 'Cập nhật nội dung trang' : 'Update your CMS page content'}
          </p>
        </div>
      </div>

      <PageForm
        locale={locale}
        initialData={page}
        isSubmitting={isPending}
        submitLabel={locale === 'vi' ? 'Cập nhật trang' : 'Update page'}
        onSubmit={handleSubmit}
        onCancel={() => router.push(`/${locale}/admin/pages`)}
      />
    </div>
  );
}

