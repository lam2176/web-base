'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Plus,
  PlusCircle,
  MinusCircle,
  Edit,
  Trash2,
  X,
  FolderTree,
  Upload,
  Image as ImageIcon,
  Images,
  GripVertical,
  Star,
  StarOff,
  ChevronRight,
  ChevronDown,
  Check,
} from 'lucide-react';
import { useAuthStore } from '@/lib/stores/auth.store';
import { Category } from '@/lib/types/api';
import { useAdminCategories, useCreateCategory, useUpdateCategory, useDeleteCategory, useUploadMedia, useAdminMedia } from '@/lib/hooks/use-admin';
import { useQueryClient } from '@tanstack/react-query';
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

interface CategoryImage {
  id?: number;
  mediaId?: number;
  file?: File;
  previewUrl?: string;
  order: number;
  isPrimary: boolean;
  media?: {
    id: number;
    url: string;
    alt?: string;
  };
}

export default function CategoriesManagement({ params: { locale } }: { params: { locale: string } }) {
  const router = useRouter();
  const { user, isAuthenticated } = useAuthStore();
  const queryClient = useQueryClient();

  // Use TanStack Query hooks
  const { data: categories = [], isLoading: loading } = useAdminCategories();
  const { mutate: createCategory } = useCreateCategory();
  const { mutate: updateCategory } = useUpdateCategory();
  const { mutate: deleteCategory } = useDeleteCategory();
  const uploadMediaMutation = useUploadMedia();
  const { data: mediaLibrary = [], isLoading: mediaLoading } = useAdminMedia();

  const [showModal, setShowModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [categoryToDelete, setCategoryToDelete] = useState<Category | null>(null);
  const [formData, setFormData] = useState({
    nameVi: '',
    nameEn: '',
    slug: '',
    descriptionVi: '',
    descriptionEn: '',
    image: '',
    parentId: null as number | null,
  });

  const [images, setImages] = useState<CategoryImage[]>([]);
  const [draggedImageIndex, setDraggedImageIndex] = useState<number | null>(null);
  const [draggedCategoryIndex, setDraggedCategoryIndex] = useState<number | null>(null);
  const [reorderedParentCategories, setReorderedParentCategories] = useState<Category[] | null>(null);
  const [expandedParents, setExpandedParents] = useState<number[]>([]);
  const [addChildRowsOpen, setAddChildRowsOpen] = useState<number[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const [deleteImageDialog, setDeleteImageDialog] = useState<{
    open: boolean;
    index: number | null;
  }>({
    open: false,
    index: null,
  });
  const [mediaLibraryOpen, setMediaLibraryOpen] = useState(false);
  const [selectedMediaIds, setSelectedMediaIds] = useState<number[]>([]);
  const [mediaSearchTerm, setMediaSearchTerm] = useState('');

  const parentCategories = useMemo(
    () => categories.filter((category) => !category.parentId),
    [categories]
  );

  const childCategoriesMap = useMemo(() => {
    const map = new Map<number, Category[]>();
    categories.forEach((category) => {
      if (!category.parentId) return;
      const list = map.get(category.parentId) || [];
      list.push(category);
      map.set(category.parentId, list);
    });
    return map;
  }, [categories]);

  const sortedParentCategories = useMemo(
    () => [...parentCategories].sort((a, b) => (a.order || 0) - (b.order || 0)),
    [parentCategories]
  );

  const categoriesToRender = reorderedParentCategories || sortedParentCategories;
  const existingMediaIds = useMemo(
    () =>
      new Set(
        images
          .filter((img) => typeof img.mediaId === 'number')
          .map((img) => img.mediaId as number)
      ),
    [images]
  );
  const filteredMediaLibrary = useMemo(() => {
    if (!mediaSearchTerm.trim()) {
      return mediaLibrary;
    }
    const keyword = mediaSearchTerm.toLowerCase();
    return mediaLibrary.filter((media) => {
      const metadata = `${media.originalName ?? ''} ${media.filename ?? ''} ${media.alt ?? ''} ${media.altText ?? ''}`.toLowerCase();
      return metadata.includes(keyword);
    });
  }, [mediaLibrary, mediaSearchTerm]);
  const ensurePrimaryImage = React.useCallback((imageList: CategoryImage[]) => {
    if (imageList.length === 0) return imageList;
    if (imageList.some((img) => img.isPrimary)) {
      return imageList;
    }
    return imageList.map((img, index) => ({
      ...img,
      isPrimary: index === 0,
    }));
  }, []);
  const handleMediaDialogOpenChange = (open: boolean) => {
    setMediaLibraryOpen(open);
    if (!open) {
      setSelectedMediaIds([]);
      setMediaSearchTerm('');
    }
  };
  const toggleMediaSelection = (mediaId: number) => {
    setSelectedMediaIds((prev) => {
      if (prev.includes(mediaId)) {
        return prev.filter((id) => id !== mediaId);
      }
      return [...prev, mediaId];
    });
  };
  const handleAddMediaFromLibrary = () => {
    if (selectedMediaIds.length === 0) {
      handleMediaDialogOpenChange(false);
      return;
    }

    setImages((prev) => {
      const existingIds = new Set(
        prev
          .filter((img) => typeof img.mediaId === 'number')
          .map((img) => img.mediaId as number)
      );

      const newMediaItems: CategoryImage[] = [];

      selectedMediaIds.forEach((id) => {
        if (existingIds.has(id)) return;
        const mediaItem = mediaLibrary.find((media) => media.id === id);
        if (!mediaItem) return;
        newMediaItems.push({
          mediaId: mediaItem.id,
          order: 0,
          isPrimary: false,
          media: {
            id: mediaItem.id,
            url: mediaItem.url,
            alt: mediaItem.alt || mediaItem.altText || mediaItem.originalName || mediaItem.filename,
          },
        });
      });

      if (newMediaItems.length === 0) {
        return prev;
      }

      const combined = [...prev, ...newMediaItems].map((img, index) => ({
        ...img,
        order: index,
      }));

      return ensurePrimaryImage(combined);
    });

    handleMediaDialogOpenChange(false);
  };

  // Cleanup preview URLs on unmount
  useEffect(() => {
    return () => {
      images.forEach((img) => {
        if (img.previewUrl) {
          URL.revokeObjectURL(img.previewUrl);
        }
      });
    };
  }, [images]);

  const openModal = (category?: Category, parentIdForNew?: number) => {
    if (category) {
      setEditingCategory(category);
      setFormData({
        nameVi: category.nameVi,
        nameEn: category.nameEn,
        slug: category.slug,
        descriptionVi: category.descriptionVi || '',
        descriptionEn: category.descriptionEn || '',
        image: category.image || '',
        parentId: category.parentId || null,
      });
      
      // Load category images
      if ((category as any).images && Array.isArray((category as any).images) && (category as any).images.length > 0) {
        const loadedImages: CategoryImage[] = (category as any).images.map((img: any) => ({
          id: img.id,
          mediaId: img.mediaId || img.media?.id,
          order: img.order || 0,
          isPrimary: img.isPrimary || false,
          media: img.media ? {
            id: img.media.id,
            url: img.media.url || img.media.filepath,
            alt: img.media.alt || img.media.filename,
          } : undefined,
        }));
        const sortedImages = [...loadedImages].sort((a, b) => a.order - b.order);
        setImages(ensurePrimaryImage(sortedImages));
      } else {
        setImages([]);
      }
    } else {
      setEditingCategory(null);
      setFormData({
        nameVi: '',
        nameEn: '',
        slug: '',
        descriptionVi: '',
        descriptionEn: '',
        image: '',
        parentId: parentIdForNew ?? null,
      });
      setImages([]);
    }
    setShowModal(true);
  };

  const closeModal = () => {
    // Cleanup preview URLs before clearing state
    images.forEach((img) => {
      if (img.previewUrl) {
        URL.revokeObjectURL(img.previewUrl);
      }
    });
    setShowModal(false);
    setEditingCategory(null);
    setImages([]);
    setDeleteImageDialog({ open: false, index: null });
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value, type } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: name === 'parentId' ? (value ? Number(value) : null) :
              type === 'number' ? Number(value) : value,
    }));
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const hasExistingImages = images.length > 0;
    const newImages: CategoryImage[] = Array.from(files).map((file, i) => ({
      file,
      previewUrl: URL.createObjectURL(file),
      order: images.length + i,
      isPrimary: !hasExistingImages && i === 0,
    }));

    setImages((prev) => {
      const combined = [...prev, ...newImages].map((img, index) => ({
        ...img,
        order: index,
      }));
      return ensurePrimaryImage(combined);
    });

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleDeleteImage = (index: number) => {
    setDeleteImageDialog({ open: true, index });
  };

  const confirmDeleteImage = () => {
    if (deleteImageDialog.index === null) return;

    const imageToDelete = images[deleteImageDialog.index];
    if (imageToDelete.previewUrl) {
      URL.revokeObjectURL(imageToDelete.previewUrl);
    }

    const newImages = images.filter((_, i) => i !== deleteImageDialog.index);

    // Re-order images and ensure at least one is primary
    const reorderedImages = newImages.map((img, index) => ({
      ...img,
      order: index,
    }));

    setImages(ensurePrimaryImage(reorderedImages));
    setDeleteImageDialog({ open: false, index: null });
  };

  const handleSetPrimaryImage = (index: number) => {
    setImages((prev) =>
      prev.map((img, i) => ({
        ...img,
        isPrimary: i === index,
      }))
    );
  };

  const handleDragStart = (index: number) => {
    setDraggedImageIndex(index);
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();

    if (draggedImageIndex === null || draggedImageIndex === index) return;

    const newImages = [...images];
    const draggedImage = newImages[draggedImageIndex];
    newImages.splice(draggedImageIndex, 1);
    newImages.splice(index, 0, draggedImage);

    // Update order
    const reorderedImages = newImages.map((img, i) => ({
      ...img,
      order: i,
    }));

    setImages(reorderedImages);
    setDraggedImageIndex(index);
  };

  const handleDragEnd = () => {
    setDraggedImageIndex(null);
  };

  // Category drag and drop handlers
  const handleCategoryDragStart = (index: number) => {
    setDraggedCategoryIndex(index);
  };

  const handleCategoryDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();

    if (draggedCategoryIndex === null || draggedCategoryIndex === index) return;

    // Only reorder parent categories
    const sortedCategories = reorderedParentCategories
      ? [...reorderedParentCategories]
      : [...sortedParentCategories];

    const draggedCategory = sortedCategories[draggedCategoryIndex];
    sortedCategories.splice(draggedCategoryIndex, 1);
    sortedCategories.splice(index, 0, draggedCategory);

    // Update order for all categories
    const updatedCategories = sortedCategories.map((cat, i) => ({
      ...cat,
      order: i,
    }));

    // Update local state for optimistic UI update
    setReorderedParentCategories(updatedCategories);
    setDraggedCategoryIndex(index);
  };

  const handleCategoryDragEnd = () => {
    if (reorderedParentCategories) {
      // Check if order actually changed
      const sortedOriginal = [...sortedParentCategories];
      const hasChanged = reorderedParentCategories.some((cat, i) => {
        const original = sortedOriginal[i];
        return !original || original.id !== cat.id;
      });

      if (hasChanged) {
        // Update order in database for all categories
        const updatePromises = reorderedParentCategories.map((cat, i) => {
          if (!cat.id) return Promise.resolve();
          return new Promise<void>((resolve) => {
            updateCategory(
              { id: cat.id, data: { order: i } },
              {
                onSuccess: () => {
                  resolve();
                },
                onError: (error) => {
                  console.error(`Failed to update category ${cat.id} order:`, error);
                  resolve();
                },
              }
            );
          });
        });

        // Wait for all updates to complete, then reset
        Promise.all(updatePromises).finally(() => {
          setReorderedParentCategories(null);
          queryClient.invalidateQueries({ queryKey: ['admin', 'categories'] });
        });
      } else {
        // No change, just reset
        setReorderedParentCategories(null);
      }
    }

    setDraggedCategoryIndex(null);
  };

  const toggleExpandParent = (categoryId: number) => {
    setExpandedParents((prev) => {
      if (prev.includes(categoryId)) {
        setAddChildRowsOpen((prevAdd) => prevAdd.filter((id) => id !== categoryId));
        return prev.filter((id) => id !== categoryId);
      }
      return [...prev, categoryId];
    });
  };

  const toggleAddSubCategoryRow = (categoryId: number, hasChildren: boolean) => {
    setAddChildRowsOpen((prev) => {
      const isOpen = prev.includes(categoryId);
      if (isOpen) {
        if (!hasChildren) {
          setExpandedParents((prevExpanded) => prevExpanded.filter((id) => id !== categoryId));
        }
        return prev.filter((id) => id !== categoryId);
      }

      setExpandedParents((prevExpanded) => {
        if (prevExpanded.includes(categoryId)) return prevExpanded;
        return [...prevExpanded, categoryId];
      });

      return [...prev, categoryId];
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsUploading(true);

    try {
      // Upload new image files first
      const imagesWithMedia = await Promise.all(
        images.map(async (img, index) => {
          // If image has a file (new upload), upload it first
          if (img.file) {
            const uploadedMedia = await uploadMediaMutation.mutateAsync(img.file);
            return {
              mediaId: uploadedMedia.id,
              order: index,
              isPrimary: img.isPrimary,
            };
          }
          // Otherwise use existing mediaId
          return {
            mediaId: img.mediaId!,
            order: index,
            isPrimary: img.isPrimary,
          };
        })
      );

      const parentIdValue = formData.parentId ?? null;

      const dataToSend: any = {
        nameVi: formData.nameVi,
        nameEn: formData.nameEn,
        slug: formData.slug,
        descriptionVi: formData.descriptionVi || undefined,
        descriptionEn: formData.descriptionEn || undefined,
        images: imagesWithMedia,
      };

      if (editingCategory) {
        dataToSend.parentId = parentIdValue;
      } else if (formData.parentId !== null) {
        dataToSend.parentId = formData.parentId;
      }

      if (editingCategory) {
        updateCategory(
          { id: editingCategory.id, data: dataToSend },
          {
            onSuccess: () => {
              closeModal();
            },
            onError: (error) => {
              console.error('Failed to update category:', error);
              alert(locale === 'vi' ? 'Không thể cập nhật danh mục' : 'Failed to update category');
            },
          }
        );
      } else {
        createCategory(dataToSend, {
          onSuccess: () => {
            closeModal();
          },
          onError: (error) => {
            console.error('Failed to create category:', error);
            alert(locale === 'vi' ? 'Không thể tạo danh mục' : 'Failed to create category');
          },
        });
      }
    } catch (error: any) {
      console.error('Failed to upload images:', error);
      alert(
        error.response?.data?.message ||
        (locale === 'vi' ? 'Không thể tải ảnh lên' : 'Failed to upload images')
      );
    } finally {
      setIsUploading(false);
    }
  };

  const handleDelete = () => {
    if (!categoryToDelete) return;

    deleteCategory(categoryToDelete.id, {
      onSuccess: () => {
        setDeleteDialogOpen(false);
        setCategoryToDelete(null);
      },
      onError: (error) => {
        console.error('Failed to delete category:', error);
        alert(locale === 'vi' ? 'Không thể xóa danh mục' : 'Failed to delete category');
      },
    });
  };

  if (loading && categories.length === 0) {
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
            {locale === 'vi' ? 'Quản lý danh mục' : 'Categories Management'}
          </h1>
          <p className="text-sm text-gray-600">
            {locale === 'vi' ? 'Tổ chức sản phẩm theo danh mục' : 'Organize your products into categories'}
          </p>
        </div>
        <Button onClick={() => openModal()} className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          {locale === 'vi' ? 'Thêm danh mục' : 'Add Category'}
        </Button>
      </div>

      {/* Categories table */}
      <Card className="p-6">
        {loading ? (
          <div className="flex h-64 items-center justify-center">
            <div className="text-center">
              <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent"></div>
              <p className="mt-2 text-sm text-gray-600">
                {locale === 'vi' ? 'Đang tải danh mục...' : 'Loading categories...'}
              </p>
            </div>
          </div>
        ) : categories.length === 0 ? (
          <div className="py-12 text-center">
            <FolderTree className="mx-auto h-12 w-12 text-gray-400" />
            <p className="mt-2 text-gray-500">
              {locale === 'vi' ? 'Chưa có danh mục nào' : 'No categories found'}
            </p>
            <Button onClick={() => openModal()} className="mt-4">
              {locale === 'vi' ? 'Thêm danh mục đầu tiên' : 'Add your first category'}
            </Button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="pb-3 text-left text-sm font-medium text-gray-600 w-10">
                    {/* Drag handle column */}
                  </th>
                  <th className="pb-3 text-left text-sm font-medium text-gray-600">
                    {locale === 'vi' ? 'Hình ảnh' : 'Image'}
                  </th>
                  <th className="pb-3 text-left text-sm font-medium text-gray-600">
                    {locale === 'vi' ? 'Tên' : 'Name'}
                  </th>
                  <th className="pb-3 text-left text-sm font-medium text-gray-600">
                    Slug
                  </th>
                  <th className="pb-3 text-left text-sm font-medium text-gray-600">
                    {locale === 'vi' ? 'Mô tả' : 'Description'}
                  </th>
                  <th className="pb-3 text-left text-sm font-medium text-gray-600">
                    {locale === 'vi' ? 'Thứ tự' : 'Order'}
                  </th>
                  <th className="pb-3 text-right text-sm font-medium text-gray-600">
                    {locale === 'vi' ? 'Thao tác' : 'Actions'}
                  </th>
                </tr>
              </thead>
              <tbody>
                {categoriesToRender.map((category, index) => {
                  const childCategories = (childCategoriesMap.get(category.id) || []).sort(
                    (a, b) => (a.order || 0) - (b.order || 0)
                  );
                  const isExpanded = expandedParents.includes(category.id);
                  const isAddRowOpen = addChildRowsOpen.includes(category.id);

                  return (
                    <React.Fragment key={category.id}>
                      <tr
                        draggable
                        onDragStart={() => handleCategoryDragStart(index)}
                        onDragOver={(e) => handleCategoryDragOver(e, index)}
                        onDragEnd={handleCategoryDragEnd}
                        className={`border-b last:border-0 hover:bg-gray-50 cursor-move ${
                          draggedCategoryIndex === index ? 'opacity-50 bg-blue-50' : ''
                        }`}
                      >
                        <td className="py-3">
                          <GripVertical className="h-5 w-5 text-gray-400" />
                        </td>
                        <td className="py-3">
                          {(() => {
                            const categoryImages = (category as any).images || [];
                            const primaryImage =
                              categoryImages.find((img: any) => img.isPrimary) || categoryImages[0];
                            const imageUrl = primaryImage?.media?.url || category.image;

                            return imageUrl ? (
                              <img
                                src={imageUrl}
                                alt={locale === 'vi' ? category.nameVi : category.nameEn}
                                className="h-12 w-12 rounded object-cover"
                              />
                            ) : (
                              <div className="flex h-12 w-12 items-center justify-center rounded bg-gray-100">
                                <FolderTree className="h-6 w-6 text-gray-400" />
                              </div>
                            );
                          })()}
                        </td>
                        <td className="py-3">
                          <div className="flex items-start gap-2">
                            <button
                              type="button"
                              onClick={() => toggleExpandParent(category.id)}
                              className="mt-1 rounded p-1 hover:bg-gray-200"
                              aria-label={
                                isExpanded
                                  ? locale === 'vi'
                                    ? 'Thu gọn danh mục con'
                                    : 'Collapse sub-categories'
                                  : locale === 'vi'
                                  ? 'Mở danh mục con'
                                  : 'Expand sub-categories'
                              }
                            >
                              {isExpanded ? (
                                <ChevronDown className="h-4 w-4" />
                              ) : (
                                <ChevronRight className="h-4 w-4" />
                              )}
                            </button>
                            <div>
                              <p className="font-medium text-gray-900">
                                {locale === 'vi' ? category.nameVi : category.nameEn}
                              </p>
                              {childCategories.length === 0 && (
                                <p className="text-xs text-gray-400">
                                  {locale === 'vi'
                                    ? 'Chưa có danh mục con'
                                    : 'No sub-categories yet'}
                                </p>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="py-3 text-sm text-gray-600">{category.slug}</td>
                        <td className="py-3 text-sm text-gray-600">
                          {(locale === 'vi' ? category.descriptionVi : category.descriptionEn) ? (
                            <span className="line-clamp-2">
                              {locale === 'vi' ? category.descriptionVi : category.descriptionEn}
                            </span>
                          ) : (
                            <span className="text-gray-400">-</span>
                          )}
                        </td>
                        <td className="py-3 text-sm text-gray-600">{category.order ?? 0}</td>
                        <td className="py-3">
                          <div className="flex justify-end gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => toggleAddSubCategoryRow(category.id, childCategories.length > 0)}
                              title={
                                isAddRowOpen
                                  ? locale === 'vi'
                                    ? 'Ẩn thêm danh mục con'
                                    : 'Hide sub-category form'
                                  : locale === 'vi'
                                  ? 'Hiển thị thêm danh mục con'
                                  : 'Show sub-category form'
                              }
                            >
                              {isAddRowOpen ? (
                                <MinusCircle className="h-4 w-4" />
                              ) : (
                                <PlusCircle className="h-4 w-4" />
                              )}
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => openModal(category)}
                              title={locale === 'vi' ? 'Chỉnh sửa' : 'Edit'}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setCategoryToDelete(category);
                                setDeleteDialogOpen(true);
                              }}
                              title={locale === 'vi' ? 'Xóa' : 'Delete'}
                            >
                              <Trash2 className="h-4 w-4 text-red-600" />
                            </Button>
                          </div>
                        </td>
                      </tr>

                      {isExpanded && (
                        <>
                          {/* Add sub-category row - Only visible when isAddRowOpen is true */}
                          {isAddRowOpen && (
                            <tr className="border-b bg-blue-50/50 hover:bg-blue-50">
                              <td className="py-3" />
                              <td className="py-3">
                                <div className="flex h-10 w-10 items-center justify-center rounded bg-blue-100">
                                  <Plus className="h-5 w-5 text-blue-600" />
                                </div>
                              </td>
                              <td className="py-3">
                                <div className="flex items-start gap-2 pl-8">
                                  <span className="mt-2 h-3 w-3 rounded-full bg-blue-400" />
                                  <div>
                                    <button
                                      type="button"
                                      onClick={() => openModal(undefined, category.id)}
                                      className="text-left font-medium text-blue-600 hover:text-blue-700 hover:underline"
                                    >
                                      {locale === 'vi' ? '+ Thêm danh mục con' : '+ Add sub-category'}
                                    </button>
                                    <p className="text-xs text-gray-500">
                                      {locale === 'vi'
                                        ? 'Tạo danh mục con mới cho danh mục này'
                                        : 'Create a new sub-category for this category'}
                                    </p>
                                  </div>
                                </div>
                              </td>
                              <td className="py-3 text-sm text-gray-400">-</td>
                              <td className="py-3 text-sm text-gray-400">-</td>
                              <td className="py-3 text-sm text-gray-400">-</td>
                              <td className="py-3">
                                <div className="flex justify-end pr-4">
                                  <Button
                                    size="sm"
                                    onClick={() => openModal(undefined, category.id)}
                                    className="flex items-center gap-2 bg-blue-600 text-white hover:bg-blue-700"
                                  >
                                    <Plus className="h-4 w-4" />
                                    {locale === 'vi' ? 'Tạo danh mục con' : 'Create sub-category'}
                                  </Button>
                                </div>
                              </td>
                            </tr>
                          )}
                          {/* Existing child categories */}
                          {childCategories.map((child) => {
                            const childImages = (child as any).images || [];
                            const childPrimaryImage =
                              childImages.find((img: any) => img.isPrimary) || childImages[0];
                            const childImageUrl = childPrimaryImage?.media?.url || child.image;

                            return (
                              <tr
                                key={child.id}
                                className="border-b last:border-0 bg-gray-50/60 hover:bg-gray-100"
                              >
                                <td className="py-3" />
                                <td className="py-3">
                                  {childImageUrl ? (
                                    <img
                                      src={childImageUrl}
                                      alt={locale === 'vi' ? child.nameVi : child.nameEn}
                                      className="h-10 w-10 rounded object-cover"
                                    />
                                  ) : (
                                    <div className="flex h-10 w-10 items-center justify-center rounded bg-gray-100">
                                      <FolderTree className="h-5 w-5 text-gray-400" />
                                    </div>
                                  )}
                                </td>
                                <td className="py-3">
                                  <div className="flex items-start gap-2 pl-8">
                                    <span className="mt-2 h-3 w-3 rounded-full bg-gray-400" />
                                    <div>
                                      <p className="font-medium text-gray-900">
                                        {locale === 'vi' ? child.nameVi : child.nameEn}
                                      </p>
                                      <p className="text-xs text-gray-500">
                                        {locale === 'vi' ? 'Danh mục con' : 'Sub-category'}
                                      </p>
                                    </div>
                                  </div>
                                </td>
                                <td className="py-3 text-sm text-gray-600">{child.slug}</td>
                                <td className="py-3 text-sm text-gray-600">
                                  {(locale === 'vi' ? child.descriptionVi : child.descriptionEn) ? (
                                    <span className="line-clamp-2">
                                      {locale === 'vi' ? child.descriptionVi : child.descriptionEn}
                                    </span>
                                  ) : (
                                    <span className="text-gray-400">-</span>
                                  )}
                                </td>
                                <td className="py-3 text-sm text-gray-600">{child.order ?? 0}</td>
                                <td className="py-3">
                                  <div className="flex justify-end gap-2">
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => openModal(child)}
                                      title={locale === 'vi' ? 'Chỉnh sửa' : 'Edit'}
                                    >
                                      <Edit className="h-4 w-4" />
                                    </Button>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => {
                                        setCategoryToDelete(child);
                                        setDeleteDialogOpen(true);
                                      }}
                                      title={locale === 'vi' ? 'Xóa' : 'Delete'}
                                    >
                                      <Trash2 className="h-4 w-4 text-red-600" />
                                    </Button>
                                  </div>
                                </td>
                              </tr>
                            );
                          })}
                        </>
                      )}
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Category Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
          <Card className="max-h-[90vh] w-full max-w-2xl overflow-y-auto p-6">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-900">
                {editingCategory
                  ? (locale === 'vi' ? 'Chỉnh sửa danh mục' : 'Edit Category')
                  : (locale === 'vi' ? 'Thêm danh mục mới' : 'Add Category')}
              </h2>
              <button
                onClick={closeModal}
                className="rounded-full p-1 hover:bg-gray-100"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
              </div>

              <div>
                <Label htmlFor="slug">Slug *</Label>
                <Input
                  id="slug"
                  name="slug"
                  value={formData.slug}
                  onChange={handleInputChange}
                  placeholder="category-slug"
                  required
                />
              </div>

              <div>
                <Label htmlFor="descriptionVi">
                  {locale === 'vi' ? 'Mô tả (Tiếng Việt)' : 'Description (Vietnamese)'}
                </Label>
                <textarea
                  id="descriptionVi"
                  name="descriptionVi"
                  value={formData.descriptionVi}
                  onChange={handleInputChange}
                  rows={3}
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>

              <div>
                <Label htmlFor="descriptionEn">
                  {locale === 'vi' ? 'Mô tả (Tiếng Anh)' : 'Description (English)'}
                </Label>
                <textarea
                  id="descriptionEn"
                  name="descriptionEn"
                  value={formData.descriptionEn}
                  onChange={handleInputChange}
                  rows={3}
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>

              {/* Category Images */}
              <div>
                <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <Label>
                    {locale === 'vi' ? 'Hình ảnh danh mục' : 'Category Images'}
                  </Label>
                  <div className="flex flex-wrap items-center gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => fileInputRef.current?.click()}
                    >
                      <Upload className="mr-2 h-4 w-4" />
                      {locale === 'vi' ? 'Chọn ảnh' : 'Select Images'}
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => handleMediaDialogOpenChange(true)}
                    >
                      <Images className="mr-2 h-4 w-4" />
                      {locale === 'vi' ? 'Chọn từ thư viện' : 'Pick from library'}
                    </Button>
                  </div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handleFileSelect}
                    className="hidden"
                  />
                </div>

                {images.length > 0 ? (
                  <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                    {images.map((img, index) => (
                      <div
                        key={index}
                        draggable
                        onDragStart={() => handleDragStart(index)}
                        onDragOver={(e) => handleDragOver(e, index)}
                        onDragEnd={handleDragEnd}
                        className={`group relative cursor-move rounded-lg border-2 ${
                          img.isPrimary ? 'border-yellow-400' : 'border-gray-200'
                        } ${draggedImageIndex === index ? 'opacity-50' : ''}`}
                      >
                        <img
                          src={img.previewUrl || img.media?.url || ''}
                          alt={img.media?.alt || `Image ${index + 1}`}
                          className="h-32 w-full rounded-lg object-cover"
                        />

                        {/* Order badge */}
                        <div className="absolute left-2 top-2 flex items-center gap-1 rounded bg-black/50 px-2 py-1 text-xs text-white">
                          <GripVertical className="h-3 w-3" />#{index + 1}
                        </div>

                        {/* Primary badge */}
                        {img.isPrimary && (
                          <div className="absolute right-2 top-2 rounded bg-yellow-400 px-2 py-1 text-xs font-semibold text-yellow-900">
                            {locale === 'vi' ? 'Chính' : 'Primary'}
                          </div>
                        )}

                        {/* New image badge */}
                        {img.file && (
                          <div className="absolute left-2 bottom-2 rounded bg-blue-500 px-2 py-1 text-xs font-semibold text-white">
                            {locale === 'vi' ? 'Mới' : 'New'}
                          </div>
                        )}

                        {/* Actions overlay */}
                        <div className="absolute inset-0 flex items-center justify-center gap-2 rounded-lg bg-black/50 opacity-0 transition-opacity group-hover:opacity-100">
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0 text-white hover:text-yellow-400"
                            onClick={() => handleSetPrimaryImage(index)}
                            title={locale === 'vi' ? 'Đặt làm ảnh chính' : 'Set as primary'}
                          >
                            {img.isPrimary ? (
                              <Star className="h-4 w-4 fill-current" />
                            ) : (
                              <StarOff className="h-4 w-4" />
                            )}
                          </Button>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0 text-white hover:text-red-400"
                            onClick={() => handleDeleteImage(index)}
                            title={locale === 'vi' ? 'Xóa ảnh' : 'Delete image'}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-gray-300 p-8">
                    <ImageIcon className="h-12 w-12 text-gray-400" />
                    <p className="mt-2 text-sm text-gray-500">
                      {locale === 'vi' ? 'Chưa có hình ảnh' : 'No images yet'}
                    </p>
                    <p className="mt-1 text-xs text-gray-400">
                      {locale === 'vi'
                        ? 'Nhấn nút "Chọn ảnh" để thêm ảnh'
                        : 'Click "Select Images" to add images'}
                    </p>
                  </div>
                )}

                <div className="mt-4 space-y-2">
                  <div className="rounded-md bg-blue-50 p-3">
                    <p className="text-xs text-blue-800">
                      <strong>{locale === 'vi' ? 'Mẹo:' : 'Tip:'}</strong>{' '}
                      {locale === 'vi'
                        ? 'Kéo thả để sắp xếp lại ảnh. Nhấn biểu tượng ngôi sao để đặt ảnh chính.'
                        : 'Drag and drop to reorder images. Click star icon to set primary image.'}
                    </p>
                  </div>
                  {images.some((img) => img.file) && (
                    <div className="rounded-md bg-green-50 p-3">
                      <p className="text-xs text-green-800">
                        <strong>{locale === 'vi' ? 'Lưu ý:' : 'Note:'}</strong>{' '}
                        {locale === 'vi'
                          ? "Ảnh mới sẽ được tải lên khi bạn nhấn 'Tạo mới' hoặc 'Cập nhật'."
                          : "New images will be uploaded when you click 'Create' or 'Update'."}
                      </p>
                    </div>
                  )}
                </div>
              </div>

              <div>
                <Label htmlFor="parentId">
                  {locale === 'vi' ? 'Danh mục cha' : 'Parent Category'}
                </Label>
                <select
                  id="parentId"
                  name="parentId"
                  value={formData.parentId || ''}
                  onChange={handleInputChange}
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                >
                  <option value="">
                    {locale === 'vi' ? 'Không có (Cấp cao nhất)' : 'None (Top Level)'}
                  </option>
                  {categories
                    .filter((cat) => cat.id !== editingCategory?.id)
                    .map((category) => (
                      <option key={category.id} value={category.id}>
                        {locale === 'vi' ? category.nameVi : category.nameEn}
                      </option>
                    ))}
                </select>
              </div>

              <div className="flex justify-end gap-4 pt-4">
                <Button type="button" variant="outline" onClick={closeModal} disabled={isUploading}>
                  {locale === 'vi' ? 'Hủy' : 'Cancel'}
                </Button>
                <Button type="submit" disabled={isUploading}>
                  {isUploading
                    ? (locale === 'vi' ? 'Đang tải ảnh lên...' : 'Uploading images...')
                    : editingCategory
                    ? (locale === 'vi' ? 'Cập nhật' : 'Update')
                    : (locale === 'vi' ? 'Tạo mới' : 'Create')}
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}

      {/* Delete Image Confirmation Dialog */}
      <AlertDialog
        open={deleteImageDialog.open}
        onOpenChange={(open) =>
          setDeleteImageDialog({ ...deleteImageDialog, open })
        }
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {locale === 'vi' ? 'Xác nhận xóa ảnh' : 'Confirm Delete Image'}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {locale === 'vi'
                ? 'Bạn có chắc chắn muốn xóa ảnh này? Hành động này không thể hoàn tác.'
                : 'Are you sure you want to delete this image? This action cannot be undone.'}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>
              {locale === 'vi' ? 'Hủy' : 'Cancel'}
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDeleteImage}
              className="bg-red-600 hover:bg-red-700"
            >
              {locale === 'vi' ? 'Xóa' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Category Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {locale === 'vi' ? 'Xác nhận xóa' : 'Confirm Delete'}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {locale === 'vi'
                ? `Bạn có chắc chắn muốn xóa danh mục "${categoryToDelete ? (categoryToDelete.nameVi || categoryToDelete.nameEn) : ''}"? Hành động này không thể hoàn tác.`
                : `Are you sure you want to delete category "${categoryToDelete ? (categoryToDelete.nameEn || categoryToDelete.nameVi) : ''}"? This action cannot be undone.`}
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

      {/* Media Library Dialog */}
      <Dialog open={mediaLibraryOpen} onOpenChange={handleMediaDialogOpenChange}>
        <DialogContent className="flex max-h-[90vh] max-w-4xl flex-col">
          <DialogHeader>
            <DialogTitle>
              {locale === 'vi' ? 'Chọn ảnh từ thư viện' : 'Select from media library'}
            </DialogTitle>
            <DialogDescription>
              {locale === 'vi'
                ? 'Chọn một hoặc nhiều ảnh đã tải lên để sử dụng cho danh mục.'
                : 'Pick one or multiple uploaded images to use for this category.'}
            </DialogDescription>
          </DialogHeader>

          <div className="flex flex-1 flex-col space-y-4 min-h-0">
            {mediaLibrary.length > 0 && (
              <Input
                placeholder={locale === 'vi' ? 'Tìm kiếm theo tên hoặc mô tả...' : 'Search by name or alt text...'}
                value={mediaSearchTerm}
                onChange={(e) => setMediaSearchTerm(e.target.value)}
              />
            )}

            {selectedMediaIds.length > 0 && (
              <div className="text-sm font-medium text-blue-600">
                {locale === 'vi'
                  ? `${selectedMediaIds.length} ảnh đã chọn`
                  : `${selectedMediaIds.length} image${selectedMediaIds.length > 1 ? 's' : ''} selected`}
              </div>
            )}

            <div className="flex-1 overflow-y-auto min-h-0">
              {mediaLoading ? (
                <div className="flex h-40 items-center justify-center">
                  <div className="text-center">
                    <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent" />
                    <p className="mt-2 text-sm text-gray-600">
                      {locale === 'vi' ? 'Đang tải thư viện ảnh...' : 'Loading media library...'}
                    </p>
                  </div>
                </div>
              ) : filteredMediaLibrary.length === 0 ? (
                <div className="rounded-lg border border-dashed border-gray-300 p-8 text-center">
                  <ImageIcon className="mx-auto h-12 w-12 text-gray-400" />
                  <p className="mt-3 text-sm text-gray-600">
                    {locale === 'vi' ? 'Chưa có media phù hợp' : 'No matching media found'}
                  </p>
                  <p className="mt-1 text-xs text-gray-400">
                    {locale === 'vi'
                      ? 'Hãy tải ảnh mới lên trong mục Thư viện media.'
                      : 'Upload new images from the media library section.'}
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-4 pb-4 sm:grid-cols-4 md:grid-cols-6">
                {filteredMediaLibrary.map((media) => {
                  const isSelected = selectedMediaIds.includes(media.id);
                  const isAlreadyAdded = existingMediaIds.has(media.id);
                  const displayName = media.originalName || media.filename;

                  return (
                    <div key={media.id} className="space-y-2">
                      <button
                        type="button"
                        onClick={() => {
                          if (isAlreadyAdded) return;
                          toggleMediaSelection(media.id);
                        }}
                        disabled={isAlreadyAdded}
                        className={`relative aspect-square overflow-hidden rounded-lg border-2 transition focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                          isAlreadyAdded
                            ? 'cursor-not-allowed border-gray-200 opacity-60'
                            : isSelected
                            ? 'border-blue-500 shadow-lg'
                            : 'border-gray-200 hover:border-blue-400'
                        }`}
                      >
                        <img
                          src={media.url}
                          alt={media.alt || media.altText || displayName || `Media ${media.id}`}
                          className="h-full w-full object-cover"
                        />
                        {isSelected && (
                          <div className="absolute inset-0 flex items-center justify-center bg-blue-500/40">
                            <Check className="h-10 w-10 text-white" />
                          </div>
                        )}
                        {isAlreadyAdded && (
                          <div className="absolute inset-0 flex items-center justify-center bg-black/50 px-2 text-center text-xs font-medium text-white">
                            {locale === 'vi' ? 'Đã có trong danh sách' : 'Already added'}
                          </div>
                        )}
                      </button>
                      <div className="truncate text-center text-xs text-gray-600">{displayName}</div>
                    </div>
                  );
                })}
                </div>
              )}
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => handleMediaDialogOpenChange(false)}>
              {locale === 'vi' ? 'Hủy' : 'Cancel'}
            </Button>
            <Button
              type="button"
              onClick={handleAddMediaFromLibrary}
              disabled={selectedMediaIds.length === 0}
            >
              {locale === 'vi'
                ? selectedMediaIds.length === 0
                  ? 'Thêm ảnh đã chọn'
                  : `Thêm ${selectedMediaIds.length} ảnh`
                : selectedMediaIds.length === 0
                  ? 'Add selected images'
                  : `Add ${selectedMediaIds.length} image${selectedMediaIds.length > 1 ? 's' : ''}`}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
