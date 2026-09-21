'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Plus, Search, Edit, Trash2, Eye } from 'lucide-react';
import { PageRow } from './page-row';
import { useAdminPages, useDeletePage, useReorderPages } from '@/lib/hooks/use-admin';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
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
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Page } from '@/lib/types/api';

export default function AdminPagesPage({ params: { locale } }: { params: { locale: string } }) {
  const [search, setSearch] = useState('');
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [pageToDelete, setPageToDelete] = useState<Page | null>(null);
  const [menuDisplay, setMenuDisplay] = useState<'off' | 'header' | 'footer' | 'both'>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('menuDisplay');
      return (saved as 'off' | 'header' | 'footer' | 'both') || 'both';
    }
    return 'both';
  });

  const handleMenuDisplayChange = (value: 'off' | 'header' | 'footer' | 'both') => {
    setMenuDisplay(value);
    if (typeof window !== 'undefined') {
      localStorage.setItem('menuDisplay', value);
      // Dispatch custom event to notify other components
      window.dispatchEvent(new CustomEvent('menuDisplayChanged', { detail: value }));
    }
  };

  const { data: pages = [], isLoading: loading } = useAdminPages(search);
  const { mutate: deletePage } = useDeletePage();
  const { mutate: reorderPages } = useReorderPages();
  const [localPages, setLocalPages] = useState<Page[]>([]);

  // Update local pages when pages data changes
  useEffect(() => {
    setLocalPages(pages);
  }, [pages]);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = localPages.findIndex((page) => page.id === active.id);
      const newIndex = localPages.findIndex((page) => page.id === over.id);

      const newPages = arrayMove(localPages, oldIndex, newIndex);
      setLocalPages(newPages);

      // Update order values and send to API
      const reorderedData = newPages.map((page, index) => ({
        id: page.id,
        order: index,
      }));

      reorderPages(reorderedData, {
        onError: () => {
          // Revert on error
          setLocalPages(pages);
        },
      });
    }
  };

  const handleDelete = () => {
    if (!pageToDelete) return;

    deletePage(pageToDelete.id, {
      onSuccess: () => {
        setDeleteDialogOpen(false);
        setPageToDelete(null);
      },
      onError: (error) => {
        console.error('Failed to delete page:', error);
        alert(locale === 'vi' ? 'Không thể xóa trang' : 'Failed to delete page');
      },
    });
  };

  const getTitle = (page: Page) => {
    return locale === 'vi' ? page.titleVi : page.titleEn;
  };

  const getStatusLabel = (status: string) => {
    if (locale === 'vi') {
      return status === 'active' ? 'Hiển thị' : 'Ẩn';
    }
    return status === 'active' ? 'Active' : 'Inactive';
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            {locale === 'vi' ? 'Quản lý trang' : 'Pages Management'}
          </h1>
          <p className="text-sm text-gray-600">
            {locale === 'vi' ? 'Quản lý các trang CMS như About, Policy, v.v.' : 'Manage CMS pages like About, Policy, etc.'}
          </p>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Label htmlFor="menu-display" className="text-sm">
              {locale === 'vi' ? 'Hiển thị menu' : 'Menu display'}
            </Label>
            <Select value={menuDisplay} onValueChange={handleMenuDisplayChange}>
              <SelectTrigger id="menu-display" className="w-[140px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="off">
                  {locale === 'vi' ? 'Tắt' : 'Off'}
                </SelectItem>
                <SelectItem value="header">
                  {locale === 'vi' ? 'Header' : 'Header'}
                </SelectItem>
                <SelectItem value="footer">
                  {locale === 'vi' ? 'Footer' : 'Footer'}
                </SelectItem>
                <SelectItem value="both">
                  {locale === 'vi' ? 'Cả hai' : 'Both'}
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Link href={`/${locale}/admin/pages/new`}>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              {locale === 'vi' ? 'Thêm trang' : 'Add Page'}
            </Button>
          </Link>
        </div>
      </div>

      {/* Search */}
      <Card className="p-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <Input
            placeholder={locale === 'vi' ? 'Tìm kiếm trang...' : 'Search pages...'}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
      </Card>

      {/* Pages Table */}
      <Card>
        <div className="overflow-x-auto">
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <table className="w-full">
              <thead className="border-b bg-gray-50">
                <tr>
                  <th className="p-4 text-left text-sm font-medium text-gray-600">
                    {locale === 'vi' ? 'Tiêu đề' : 'Title'}
                  </th>
                  <th className="p-4 text-left text-sm font-medium text-gray-600">
                    {locale === 'vi' ? 'Trạng thái' : 'Status'}
                  </th>
                  <th className="p-4 text-right text-sm font-medium text-gray-600">
                    {locale === 'vi' ? 'Thao tác' : 'Actions'}
                  </th>
                </tr>
              </thead>
              <tbody>
                {localPages.length === 0 ? (
                  <tr>
                    <td colSpan={3} className="p-8 text-center text-gray-500">
                      {locale === 'vi' ? 'Không có trang nào' : 'No pages found'}
                    </td>
                  </tr>
                ) : (
                  <SortableContext
                    items={localPages.map((page) => page.id)}
                    strategy={verticalListSortingStrategy}
                  >
                    {localPages.map((page) => (
                      <PageRow
                        key={page.id}
                        page={page}
                        locale={locale}
                        getTitle={getTitle}
                        getStatusLabel={getStatusLabel}
                        onDelete={() => {
                          setPageToDelete(page);
                          setDeleteDialogOpen(true);
                        }}
                      />
                    ))}
                  </SortableContext>
                )}
              </tbody>
            </table>
          </DndContext>
        </div>
      </Card>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {locale === 'vi' ? 'Xác nhận xóa' : 'Confirm Delete'}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {locale === 'vi'
                ? `Bạn có chắc chắn muốn xóa trang "${pageToDelete ? getTitle(pageToDelete) : ''}"? Hành động này không thể hoàn tác.`
                : `Are you sure you want to delete "${pageToDelete ? getTitle(pageToDelete) : ''}"? This action cannot be undone.`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{locale === 'vi' ? 'Hủy' : 'Cancel'}</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-red-600 hover:bg-red-700">
              {locale === 'vi' ? 'Xóa' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
