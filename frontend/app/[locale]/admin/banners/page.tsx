'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Plus,
  Edit,
  Trash2,
  X,
  Image as ImageIcon,
  Upload,
  Images,
  Check,
  GripVertical,
} from 'lucide-react';
import { adminBannerService } from '@/lib/api/services/admin.service';
import { useAdminMedia, useUploadMedia, useAdminCategories, useAdminProducts } from '@/lib/hooks/use-admin';
import { useAuthStore } from '@/lib/stores/auth.store';
import { Banner, CreateBannerDto } from '@/lib/types/api';
import { useTranslations } from 'next-intl';
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

export default function BannersManagement({ params: { locale } }: { params: { locale: string } }) {
  const t = useTranslations();
  const router = useRouter();
  const { user, isAuthenticated } = useAuthStore();

  const [banners, setBanners] = useState<Banner[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingBanner, setEditingBanner] = useState<Banner | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [bannerToDelete, setBannerToDelete] = useState<Banner | null>(null);
  const [draggedBannerIndex, setDraggedBannerIndex] = useState<number | null>(null);
  const [reorderedBanners, setReorderedBanners] = useState<Banner[] | null>(null);
  const [formData, setFormData] = useState({
    titleVi: '',
    titleEn: '',
    image: '',
    imageId: null as number | null,
    link: '',
    order: 0,
    status: 'active' as 'active' | 'inactive',
  });
  const fileInputRef = useRef<HTMLInputElement>(null);
  const uploadMediaMutation = useUploadMedia();
  const { data: mediaLibrary = [], isLoading: mediaLoading } = useAdminMedia();
  const { data: categories = [] } = useAdminCategories();
  const { data: productsData } = useAdminProducts({ limit: 1000 });
  const products = productsData?.data || [];
  const [mediaLibraryOpen, setMediaLibraryOpen] = useState(false);
  const [mediaSearchTerm, setMediaSearchTerm] = useState('');
  const [tempSelectedMediaId, setTempSelectedMediaId] = useState<number | null>(null);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [linkType, setLinkType] = useState<'custom' | 'category' | 'product'>('custom');

  const filteredMedia = useMemo(() => {
    const term = mediaSearchTerm.trim().toLowerCase();
    if (!term) return mediaLibrary;
    return mediaLibrary.filter((media) => {
      const name = media.originalName || media.filename || '';
      return name.toLowerCase().includes(term);
    });
  }, [mediaLibrary, mediaSearchTerm]);

  const selectedMedia = useMemo(() => {
    if (!formData.imageId) return undefined;
    return mediaLibrary.find((media) => media.id === formData.imageId) || undefined;
  }, [formData.imageId, mediaLibrary]);

  useEffect(() => {
    // Check authentication and admin role
    if (!isAuthenticated || (user?.role !== 'admin' && user?.role !== 'staff')) {
      router.push(`/${locale}/admin/login`);
      return;
    }

    fetchBanners();
  }, [isAuthenticated, user]);

  const fetchBanners = async () => {
    try {
      setLoading(true);
      const response = await adminBannerService.getAll();
      // Sort banners by order
      const sortedBanners = [...response].sort((a, b) => (a.order || 0) - (b.order || 0));
      setBanners(sortedBanners);
      // Reset reordered state when fetching fresh data
      setReorderedBanners(null);
    } catch (error) {
      console.error('Failed to fetch banners:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!showModal) return;
    if (!formData.imageId) return;
    if (formData.image) return;

    const media = mediaLibrary.find((item) => item.id === formData.imageId);
    if (media) {
      setFormData((prev) => ({
        ...prev,
        image: media.url,
      }));
    }
  }, [showModal, formData.imageId, formData.image, mediaLibrary]);

  const openModal = (banner?: Banner) => {
    if (banner) {
      setEditingBanner(banner);
      const existingImageId =
        (banner as any).imageId ?? (banner as any).mediaId ?? (banner as any).media?.id ?? null;
      const fallbackMedia = existingImageId
        ? mediaLibrary.find((media) => media.id === existingImageId)
        : undefined;
      const imageUrl =
        banner.image ||
        (banner as any).imageUrl ||
        (banner as any).media?.url ||
        fallbackMedia?.url ||
        '';
      
      const link = banner.link || '';
      let detectedLinkType: 'custom' | 'category' | 'product' = 'custom';
      if (link.startsWith('/categories/')) {
        detectedLinkType = 'category';
      } else if (link.startsWith('/products/')) {
        detectedLinkType = 'product';
      }
      
      setFormData({
        titleVi: banner.titleVi || '',
        titleEn: banner.titleEn || '',
        image: imageUrl,
        imageId: existingImageId,
        link: link,
        order: banner.order,
        status: banner.status,
      });
      setLinkType(detectedLinkType);
      setTempSelectedMediaId(existingImageId);
    } else {
      setEditingBanner(null);
      // Calculate next order based on existing banners
      const maxOrder = banners.length > 0 
        ? Math.max(...banners.map(b => b.order || 0))
        : -1;
      const nextOrder = maxOrder + 1;
      
      setFormData({
        titleVi: '',
        titleEn: '',
        image: '',
        imageId: null,
        link: '',
        order: nextOrder,
        status: 'active',
      });
      setLinkType('custom');
      setTempSelectedMediaId(null);
    }
    setMediaSearchTerm('');
    setIsUploadingImage(false);
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingBanner(null);
    setTempSelectedMediaId(null);
    setMediaLibraryOpen(false);
    setLinkType('custom');
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value, type } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: type === 'number' ? (value === '' ? 0 : Number(value)) : value,
    }));
  };

  const handleClearImage = () => {
    setFormData((prev) => ({
      ...prev,
      image: '',
      imageId: null,
    }));
    setTempSelectedMediaId(null);
  };

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    try {
      setIsUploadingImage(true);
      
      // Nếu chỉ chọn 1 file, upload như bình thường
      if (files.length === 1) {
        const uploadedMedia = await uploadMediaMutation.mutateAsync(files[0]);
        setFormData((prev) => ({
          ...prev,
          image: uploadedMedia.url,
          imageId: uploadedMedia.id,
        }));
        setTempSelectedMediaId(uploadedMedia.id);
      } else {
        // Nếu chọn nhiều file, upload tất cả và tạo nhiều banner
        const uploadPromises = Array.from(files).map(file => 
          uploadMediaMutation.mutateAsync(file)
        );
        const uploadedMedias = await Promise.all(uploadPromises);
        
        // Tạo banner cho mỗi ảnh đã upload
        const createPromises = uploadedMedias.map((media, index) => {
          const payload: CreateBannerDto = {
            titleVi: formData.titleVi ? `${formData.titleVi} ${index + 1}` : undefined,
            titleEn: formData.titleEn ? `${formData.titleEn} ${index + 1}` : undefined,
            imageId: media.id,
            link: formData.link || undefined,
            order: formData.order + index,
            status: formData.status,
          };
          return adminBannerService.create(payload);
        });
        
        await Promise.all(createPromises);
        fetchBanners();
        closeModal();
        alert(locale === 'vi' 
          ? `Đã tạo ${uploadedMedias.length} banner thành công!` 
          : `Successfully created ${uploadedMedias.length} banners!`);
      }
    } catch (error) {
      console.error('Failed to upload image:', error);
      alert(locale === 'vi' ? 'Không thể tải ảnh lên' : 'Failed to upload image');
    } finally {
      setIsUploadingImage(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleMediaDialogOpenChange = (open: boolean) => {
    setMediaLibraryOpen(open);
    if (open) {
      setMediaSearchTerm('');
      setTempSelectedMediaId(formData.imageId ?? null);
    }
  };

  const handleAddMediaFromLibrary = () => {
    if (!tempSelectedMediaId) {
      setMediaLibraryOpen(false);
      return;
    }

    const selectedMedia = mediaLibrary.find((media) => media.id === tempSelectedMediaId);
    if (selectedMedia) {
      setFormData((prev) => ({
        ...prev,
        image: selectedMedia.url,
        imageId: selectedMedia.id,
      }));
    }
    setMediaLibraryOpen(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.image) {
      alert(locale === 'vi' ? 'Vui lòng chọn hình ảnh cho banner' : 'Please select an image for the banner');
      return;
    }

    try {
      const payload: CreateBannerDto = {
        titleVi: formData.titleVi || undefined,
        titleEn: formData.titleEn || undefined,
        imageId: formData.imageId ?? undefined,
        link: formData.link || undefined,
        order: formData.order ?? 0,
        status: formData.status,
      };

      if (editingBanner) {
        await adminBannerService.update(editingBanner.id, payload);
      } else {
        await adminBannerService.create(payload);
      }
      fetchBanners();
      closeModal();
    } catch (error) {
      console.error('Failed to save banner:', error);
      alert(locale === 'vi' ? 'Không thể lưu banner' : 'Failed to save banner');
    }
  };

  const handleDelete = async () => {
    if (!bannerToDelete) return;

    try {
      await adminBannerService.delete(bannerToDelete.id);
      setDeleteDialogOpen(false);
      setBannerToDelete(null);
      fetchBanners();
    } catch (error) {
      console.error('Failed to delete banner:', error);
      alert(locale === 'vi' ? 'Không thể xóa banner' : 'Failed to delete banner');
    }
  };

  const toggleStatus = async (bannerId: number, currentStatus: string) => {
    try {
      const newStatus = currentStatus === 'active' ? 'inactive' : 'active';
      await adminBannerService.update(bannerId, { status: newStatus });
      fetchBanners();
    } catch (error) {
      console.error('Failed to update banner status:', error);
    }
  };

  // Banner drag and drop handlers
  const handleBannerDragStart = (index: number) => {
    setDraggedBannerIndex(index);
  };

  const handleBannerDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();

    if (draggedBannerIndex === null || draggedBannerIndex === index) return;

    const sortedBanners = reorderedBanners ? [...reorderedBanners] : [...banners];

    const draggedBanner = sortedBanners[draggedBannerIndex];
    sortedBanners.splice(draggedBannerIndex, 1);
    sortedBanners.splice(index, 0, draggedBanner);

    // Update order for all banners
    const updatedBanners = sortedBanners.map((banner, i) => ({
      ...banner,
      order: i,
    }));

    // Update local state for optimistic UI update
    setReorderedBanners(updatedBanners);
    setDraggedBannerIndex(index);
  };

  const handleBannerDragEnd = async () => {
    if (reorderedBanners) {
      // Check if order actually changed
      const hasChanged = reorderedBanners.some((banner, i) => {
        const original = banners[i];
        return !original || original.id !== banner.id;
      });

      if (hasChanged) {
        // Update order in database for all banners
        const updatePromises = reorderedBanners.map((banner, i) => {
          if (!banner.id) return Promise.resolve();
          return adminBannerService.update(banner.id, { order: i });
        });

        try {
          await Promise.all(updatePromises);
          // Refresh banners to get latest data
          fetchBanners();
        } catch (error) {
          console.error('Failed to update banner order:', error);
          alert(locale === 'vi' ? 'Không thể cập nhật thứ tự banner' : 'Failed to update banner order');
          // Revert on error
          fetchBanners();
        }
      }
    }

    setReorderedBanners(null);
    setDraggedBannerIndex(null);
  };

  if (loading && banners.length === 0) {
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
            {t('admin.banners.title')}
          </h1>
          <p className="text-sm text-gray-600">
            {t('admin.banners.description')}
          </p>
        </div>
        <Button onClick={() => openModal()} className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          {t('admin.banners.addBanner')}
        </Button>
      </div>

      {/* Banners table */}
      <Card className="p-6">
        {loading ? (
          <div className="flex h-64 items-center justify-center">
            <div className="text-center">
              <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent"></div>
              <p className="mt-2 text-sm text-gray-600">
                {t('admin.loading')}
              </p>
            </div>
          </div>
        ) : banners.length === 0 ? (
          <div className="py-12 text-center">
            <ImageIcon className="mx-auto h-12 w-12 text-gray-400" />
            <p className="mt-2 text-gray-500">
              {t('admin.banners.noBanners')}
            </p>
            <Button onClick={() => openModal()} className="mt-4">
              {t('admin.banners.addBanner')}
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
                    {locale === 'vi' ? 'Tiêu đề' : 'Title'}
                  </th>
                  <th className="pb-3 text-left text-sm font-medium text-gray-600">
                    {locale === 'vi' ? 'Liên kết' : 'Link'}
                  </th>
                  <th className="pb-3 text-left text-sm font-medium text-gray-600">
                    {locale === 'vi' ? 'Thứ tự' : 'Order'}
                  </th>
                  <th className="pb-3 text-left text-sm font-medium text-gray-600">
                    {locale === 'vi' ? 'Trạng thái' : 'Status'}
                  </th>
                  <th className="pb-3 text-right text-sm font-medium text-gray-600">
                    {locale === 'vi' ? 'Thao tác' : 'Actions'}
                  </th>
                </tr>
              </thead>
              <tbody>
                {(reorderedBanners || banners).map((banner, index) => (
                  <tr
                    key={banner.id}
                    draggable
                    onDragStart={() => handleBannerDragStart(index)}
                    onDragOver={(e) => handleBannerDragOver(e, index)}
                    onDragEnd={handleBannerDragEnd}
                    className={`border-b last:border-0 hover:bg-gray-50 cursor-move ${
                      draggedBannerIndex === index ? 'opacity-50 bg-blue-50' : ''
                    }`}
                  >
                    <td className="py-3">
                      <GripVertical className="h-5 w-5 text-gray-400" />
                    </td>
                    <td className="py-3">
                      {banner.image ? (
                        <img
                          src={banner.image}
                          alt={locale === 'vi' ? banner.titleVi : banner.titleEn}
                          className="h-16 w-32 rounded object-cover"
                        />
                      ) : (
                        <div className="flex h-16 w-32 items-center justify-center rounded bg-gray-100">
                          <ImageIcon className="h-8 w-8 text-gray-400" />
                        </div>
                      )}
                    </td>
                    <td className="py-3">
                      <p className="font-medium text-gray-900">
                        {locale === 'vi' ? (banner.titleVi || banner.titleEn) : (banner.titleEn || banner.titleVi)}
                      </p>
                      {banner.titleVi && banner.titleEn && (
                        <p className="text-xs text-gray-500">
                          {locale === 'vi' ? banner.titleEn : banner.titleVi}
                        </p>
                      )}
                    </td>
                    <td className="py-3 text-sm text-gray-600">
                      {banner.link ? (
                        <a
                          href={banner.link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:underline"
                        >
                          {banner.link.length > 30 ? banner.link.substring(0, 30) + '...' : banner.link}
                        </a>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </td>
                    <td className="py-3 text-sm text-gray-600">
                      {banner.order}
                    </td>
                    <td className="py-3">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => toggleStatus(banner.id, banner.status)}
                        className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold ${
                          banner.status === 'active'
                            ? 'bg-green-100 text-green-800 hover:bg-green-200'
                            : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
                        }`}
                      >
                        {banner.status === 'active'
                          ? (locale === 'vi' ? 'Hiển thị' : 'Active')
                          : (locale === 'vi' ? 'Ẩn' : 'Inactive')}
                      </Button>
                    </td>
                    <td className="py-3">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => openModal(banner)}
                          title={locale === 'vi' ? 'Chỉnh sửa' : 'Edit'}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setBannerToDelete(banner);
                            setDeleteDialogOpen(true);
                          }}
                          title={locale === 'vi' ? 'Xóa' : 'Delete'}
                        >
                          <Trash2 className="h-4 w-4 text-red-600" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
          <Card className="max-h-[90vh] w-full max-w-2xl overflow-y-auto p-6">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-900">
                {editingBanner
                  ? (locale === 'vi' ? 'Chỉnh sửa Banner' : 'Edit Banner')
                  : (locale === 'vi' ? 'Thêm Banner mới' : 'Add Banner')}
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
                  <Label htmlFor="titleVi">
                    {locale === 'vi' ? 'Tiêu đề (Tiếng Việt)' : 'Title (Vietnamese)'}
                  </Label>
                  <Input
                    id="titleVi"
                    name="titleVi"
                    value={formData.titleVi}
                    onChange={handleInputChange}
                  />
                </div>

                <div>
                  <Label htmlFor="titleEn">
                    {locale === 'vi' ? 'Tiêu đề (Tiếng Anh)' : 'Title (English)'}
                  </Label>
                  <Input
                    id="titleEn"
                    name="titleEn"
                    value={formData.titleEn}
                    onChange={handleInputChange}
                  />
                </div>
              </div>

              {/* Banner Image */}
              <div>
                <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <Label>
                    {locale === 'vi' ? 'Hình ảnh banner' : 'Banner Image'} *
                  </Label>
                  <div className="flex flex-wrap items-center gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      disabled={isUploadingImage}
                      onClick={() => fileInputRef.current?.click()}
                    >
                      <Upload className="mr-2 h-4 w-4" />
                      {isUploadingImage 
                        ? (locale === 'vi' ? 'Đang tải lên...' : 'Uploading...')
                        : (locale === 'vi' ? 'Chọn ảnh (có thể chọn nhiều)' : 'Select Images (multiple)')}
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => handleMediaDialogOpenChange(true)}
                      disabled={mediaLoading}
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
                    className="hidden"
                    onChange={handleFileSelect}
                  />
                </div>

                {formData.image ? (
                  <div className="group relative rounded-lg border-2 border-gray-200">
                    <img
                      src={formData.image}
                      alt={selectedMedia?.originalName || selectedMedia?.filename || 'Banner preview'}
                      className="h-48 w-full rounded-lg object-cover"
                    />
                    <div className="absolute inset-0 flex items-center justify-center gap-2 rounded-lg bg-black/50 opacity-0 transition-opacity group-hover:opacity-100">
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0 text-white hover:text-red-400"
                        onClick={handleClearImage}
                        title={locale === 'vi' ? 'Xóa ảnh' : 'Delete image'}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                    {selectedMedia && (
                      <div className="absolute left-2 top-2 rounded bg-blue-500 px-2 py-1 text-xs font-semibold text-white">
                        {locale === 'vi' ? 'Từ thư viện' : 'From library'}
                      </div>
                    )}
                    {isUploadingImage && (
                      <div className="absolute inset-0 flex items-center justify-center rounded-lg bg-black/50">
                        <p className="text-sm font-medium text-white">
                          {locale === 'vi' ? 'Đang tải ảnh lên...' : 'Uploading image...'}
                        </p>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-gray-300 p-8">
                    <ImageIcon className="h-12 w-12 text-gray-400" />
                    <p className="mt-2 text-sm text-gray-500">
                      {locale === 'vi' ? 'Chưa có hình ảnh' : 'No image yet'}
                    </p>
                    <p className="mt-1 text-xs text-gray-400">
                      {locale === 'vi'
                        ? 'Nhấn nút "Chọn ảnh" hoặc "Chọn từ thư viện" để thêm ảnh'
                        : 'Click "Select Image" or "Pick from library" to add image'}
                    </p>
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <Label>
                  {locale === 'vi' ? 'Liên kết' : 'Link'}
                </Label>
                <div className="flex gap-2">
                  <select
                    value={linkType}
                    onChange={(e) => {
                      const newType = e.target.value as 'custom' | 'category' | 'product';
                      setLinkType(newType);
                      if (newType === 'custom') {
                        setFormData((prev) => ({ ...prev, link: '' }));
                      } else {
                        setFormData((prev) => ({ ...prev, link: '' }));
                      }
                    }}
                    className="w-32 rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  >
                    <option value="custom">{locale === 'vi' ? 'Tùy chỉnh' : 'Custom'}</option>
                    <option value="category">{locale === 'vi' ? 'Danh mục' : 'Category'}</option>
                    <option value="product">{locale === 'vi' ? 'Sản phẩm' : 'Product'}</option>
                  </select>
                  {linkType === 'custom' ? (
                    <Input
                      id="link"
                      name="link"
                      type="text"
                      value={formData.link}
                      onChange={handleInputChange}
                      placeholder="/products hoặc https://..."
                      className="flex-1"
                    />
                  ) : linkType === 'category' ? (
                    <select
                      id="link"
                      name="link"
                      value={formData.link}
                      onChange={handleInputChange}
                      className="flex-1 rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    >
                      <option value="">{locale === 'vi' ? 'Chọn danh mục...' : 'Select category...'}</option>
                      {categories.map((category) => (
                        <option key={category.id} value={`/categories/${category.slug}`}>
                          {locale === 'vi' ? category.nameVi : category.nameEn}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <select
                      id="link"
                      name="link"
                      value={formData.link}
                      onChange={handleInputChange}
                      className="flex-1 rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    >
                      <option value="">{locale === 'vi' ? 'Chọn sản phẩm...' : 'Select product...'}</option>
                      {products.map((product) => (
                        <option key={product.id} value={`/products/${product.slug}`}>
                          {locale === 'vi' ? product.nameVi : product.nameEn}
                        </option>
                      ))}
                    </select>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="order">
                    {locale === 'vi' ? 'Thứ tự' : 'Order'}
                  </Label>
                  <Input
                    id="order"
                    name="order"
                    type="number"
                    value={formData.order}
                    onChange={handleInputChange}
                  />
                </div>

                <div>
                  <Label htmlFor="status">
                    {locale === 'vi' ? 'Trạng thái' : 'Status'}
                  </Label>
                  <select
                    id="status"
                    name="status"
                    value={formData.status}
                    onChange={handleInputChange}
                    className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  >
                    <option value="active">
                      {locale === 'vi' ? 'Hiển thị' : 'Active'}
                    </option>
                    <option value="inactive">
                      {locale === 'vi' ? 'Ẩn' : 'Inactive'}
                    </option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-4 pt-4">
                <Button type="button" variant="outline" onClick={closeModal} disabled={isUploadingImage}>
                  {locale === 'vi' ? 'Hủy' : 'Cancel'}
                </Button>
                <Button type="submit" disabled={isUploadingImage}>
                  {editingBanner
                    ? (locale === 'vi' ? 'Cập nhật' : 'Update')
                    : (locale === 'vi' ? 'Tạo mới' : 'Create')}
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}

      <Dialog open={mediaLibraryOpen} onOpenChange={handleMediaDialogOpenChange}>
        <DialogContent className="flex max-h-[90vh] max-w-4xl flex-col">
          <DialogHeader>
            <DialogTitle>{locale === 'vi' ? 'Chọn ảnh từ thư viện' : 'Select image from media library'}</DialogTitle>
            <DialogDescription>
              {locale === 'vi'
                ? 'Chọn một ảnh có sẵn để sử dụng cho banner.'
                : 'Pick an existing image to use for this banner.'}
            </DialogDescription>
          </DialogHeader>

          <div className="flex flex-1 flex-col space-y-4 min-h-0">
            <Input
              placeholder={locale === 'vi' ? 'Tìm kiếm theo tên ảnh...' : 'Search by filename...'}
              value={mediaSearchTerm}
              onChange={(event) => setMediaSearchTerm(event.target.value)}
            />

            <div className="flex-1 overflow-y-auto min-h-0">
              {mediaLoading ? (
                <div className="grid grid-cols-2 gap-4 md:grid-cols-4 pb-4">
                  {Array.from({ length: 8 }).map((_, index) => (
                    <div key={index} className="h-32 animate-pulse rounded-md bg-gray-200" />
                  ))}
                </div>
              ) : filteredMedia.length === 0 ? (
                <div className="rounded-md border border-dashed border-gray-300 p-8 text-center text-sm text-gray-500">
                  {locale === 'vi'
                    ? 'Không tìm thấy ảnh nào. Thử từ khóa khác hoặc tải ảnh mới lên.'
                    : 'No media found. Try a different keyword or upload a new image.'}
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-4 md:grid-cols-4 pb-4">
                  {filteredMedia.map((media) => {
                    const isSelected = tempSelectedMediaId === media.id;
                    return (
                      <button
                        key={media.id}
                        type="button"
                        onClick={() =>
                          setTempSelectedMediaId((prev) => (prev === media.id ? null : media.id))
                        }
                        className={`group relative overflow-hidden rounded-md border p-0 transition focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                          isSelected ? 'border-blue-500 ring-2 ring-blue-500' : 'border-transparent'
                        }`}
                      >
                        <img src={media.url} alt={media.originalName || media.filename} className="h-32 w-full object-cover" />
                        <div className="absolute inset-0 bg-black/30 opacity-0 transition group-hover:opacity-100" />
                        {isSelected && (
                          <div className="absolute right-2 top-2 flex h-6 w-6 items-center justify-center rounded-full bg-blue-500 text-white">
                            <Check className="h-4 w-4" />
                          </div>
                        )}
                        <div className="absolute inset-x-0 bottom-0 bg-black/60 px-2 py-1 text-left text-xs text-white">
                          {media.originalName || media.filename}
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          <DialogFooter className="flex items-center justify-between">
            <Button type="button" variant="outline" onClick={() => handleMediaDialogOpenChange(false)}>
              {locale === 'vi' ? 'Đóng' : 'Close'}
            </Button>
            <Button type="button" onClick={handleAddMediaFromLibrary} disabled={!tempSelectedMediaId}>
              {locale === 'vi' ? 'Sử dụng hình này' : 'Use this image'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {locale === 'vi' ? 'Xác nhận xóa' : 'Confirm Delete'}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {locale === 'vi'
                ? `Bạn có chắc chắn muốn xóa banner "${bannerToDelete ? (bannerToDelete.titleVi || bannerToDelete.titleEn) : ''}"? Hành động này không thể hoàn tác.`
                : `Are you sure you want to delete banner "${bannerToDelete ? (bannerToDelete.titleEn || bannerToDelete.titleVi) : ''}"? This action cannot be undone.`}
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
