"use client";

import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { useRouter, useParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  ArrowLeft,
  Image as ImageIcon,
  Upload,
  Trash2,
  Star,
  StarOff,
  GripVertical,
  Plus,
  Edit,
  Save,
  XCircle,
  Images,
  Check,
} from "lucide-react";
import Link from "next/link";
import { useCategories } from "@/lib/hooks/use-categories";
import {
  useAdminProduct,
  useUpdateProduct,
  useUploadMedia,
  useAdminMedia,
} from "@/lib/hooks/use-admin";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import RichTextEditor from "@/components/ui/rich-text-editor";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface ProductFormData {
  nameVi: string;
  nameEn: string;
  descriptionVi: string;
  descriptionEn: string;
  slug: string;
  originalPrice: number;
  salePrice?: number;
  stockQuantity: number;
  categoryId?: number;
  featured: boolean;
  status: "active" | "inactive" | "out_of_stock";
}

interface ProductImage {
  id?: number;
  mediaId?: number;
  file?: File; // New file to upload
  previewUrl?: string; // Preview URL for new file
  order: number;
  isPrimary: boolean;
  media?: {
    id: number;
    url: string;
    alt?: string;
  };
}

interface ProductVariant {
  id?: number;
  name: string;
  value: string;
  priceAdjustment: number;
  stockQuantity: number;
}

export default function EditProduct() {
  const t = useTranslations();
  const router = useRouter();
  const params = useParams();
  const productId = parseInt(params.id as string);
  const locale = params.locale as string;
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { data: categories = [], isLoading: categoriesLoading } =
    useCategories();
  const { data: product, isLoading: productLoading } =
    useAdminProduct(productId);
  const { data: allMedia = [] } = useAdminMedia();
  const updateProductMutation = useUpdateProduct();
  const uploadMediaMutation = useUploadMedia();

  // Helper to get category name based on locale
  const getCategoryName = (category: any) => {
    return locale === "vi" ? category.nameVi : category.nameEn;
  };

  const [formData, setFormData] = useState<ProductFormData>({
    nameVi: "",
    nameEn: "",
    descriptionVi: "",
    descriptionEn: "",
    slug: "",
    originalPrice: 0,
    stockQuantity: 0,
    featured: false,
    status: "active",
  });

  const [images, setImages] = useState<ProductImage[]>([]);
  const [variants, setVariants] = useState<ProductVariant[]>([]);
  const [draggedImageIndex, setDraggedImageIndex] = useState<number | null>(
    null
  );
  const [isUploading, setIsUploading] = useState(false);

  // Variant form state
  const [editingVariantIndex, setEditingVariantIndex] = useState<number | null>(
    null
  );
  const [variantForm, setVariantForm] = useState<ProductVariant>({
    name: "",
    value: "",
    priceAdjustment: 0,
    stockQuantity: 0,
  });
  const [showVariantForm, setShowVariantForm] = useState(false);

  // Delete confirmation dialog
  const [deleteImageDialog, setDeleteImageDialog] = useState<{
    open: boolean;
    index: number | null;
  }>({
    open: false,
    index: null,
  });
  const [deleteVariantDialog, setDeleteVariantDialog] = useState<{
    open: boolean;
    index: number | null;
  }>({
    open: false,
    index: null,
  });
  const [mediaLibraryOpen, setMediaLibraryOpen] = useState(false);
  const [selectedMediaIds, setSelectedMediaIds] = useState<number[]>([]);
  const [mediaSearchTerm, setMediaSearchTerm] = useState("");

  const ensurePrimaryImage = useCallback((imageList: ProductImage[]) => {
    if (imageList.length === 0) return imageList;
    if (imageList.some((img) => img.isPrimary)) {
      return imageList;
    }
    return imageList.map((img, index) => ({
      ...img,
      isPrimary: index === 0,
    }));
  }, []);

  const existingMediaIds = useMemo(
    () =>
      new Set(
        images
          .filter((img) => typeof img.mediaId === "number")
          .map((img) => img.mediaId as number)
      ),
    [images]
  );

  const filteredMediaLibrary = useMemo(() => {
    if (!mediaSearchTerm.trim()) {
      return allMedia;
    }
    const keyword = mediaSearchTerm.toLowerCase();
    return allMedia.filter((media) => {
      const metadata = `${media.originalName ?? ""} ${media.filename ?? ""} ${media.alt ?? ""} ${media.altText ?? ""}`.toLowerCase();
      return metadata.includes(keyword);
    });
  }, [allMedia, mediaSearchTerm]);

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

  // Load product data when available
  useEffect(() => {
    if (product) {
      setFormData({
        nameVi: product.nameVi || "",
        nameEn: product.nameEn || "",
        descriptionVi: product.descriptionVi || "",
        descriptionEn: product.descriptionEn || "",
        slug: product.slug || "",
        originalPrice: parseFloat(product.originalPrice || "0"),
        salePrice: product.salePrice
          ? parseFloat(product.salePrice)
          : undefined,
        stockQuantity: product.stockQuantity || 0,
        categoryId: Number(product.categoryId) || undefined,
        featured: product.featured || false,
        status: product.status || "active",
      });

      // Load product images
      if (product.images && product.images.length > 0) {
        const loadedImages: ProductImage[] = product.images.map((img: any) => ({
          id: img.id,
          mediaId: img.mediaId || img.media?.id,
          order: img.order || 0,
          isPrimary: img.isPrimary || false,
          media: img.media,
        }));
        const sortedImages = [...loadedImages].sort((a, b) => a.order - b.order);
        setImages(ensurePrimaryImage(sortedImages));
      }

      // Load product variants
      if (product.variants && product.variants.length > 0) {
        const loadedVariants: ProductVariant[] = product.variants.map(
          (variant: any) => ({
            id: variant.id,
            name: variant.name || "",
            value: variant.value || "",
            priceAdjustment: parseFloat(variant.priceAdjustment || "0"),
            stockQuantity: variant.stockQuantity || 0,
          })
        );
        setVariants(loadedVariants);
      }
    }
  }, [product, ensurePrimaryImage]);

  const handleInputChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, value, type } = e.target;
    const checked = (e.target as HTMLInputElement).checked;

    setFormData((prev) => ({
      ...prev,
      [name]:
        type === "checkbox"
          ? checked
          : type === "number"
          ? Number(value)
          : value,
    }));
  };

  // ========== IMAGE MANAGEMENT ==========

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const hasExistingImages = images.length > 0;
    const newImages: ProductImage[] = Array.from(files).map((file, i) => ({
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
      fileInputRef.current.value = "";
    }
  };

  const handleDeleteImage = (index: number) => {
    setDeleteImageDialog({ open: true, index });
  };

  const confirmDeleteImage = () => {
    if (deleteImageDialog.index === null) return;

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

  const handleMediaDialogOpenChange = (open: boolean) => {
    setMediaLibraryOpen(open);
    if (!open) {
      setSelectedMediaIds([]);
      setMediaSearchTerm("");
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
          .filter((img) => typeof img.mediaId === "number")
          .map((img) => img.mediaId as number)
      );

      const newMediaItems: ProductImage[] = [];

      selectedMediaIds.forEach((id) => {
        if (existingIds.has(id)) return;
        const mediaItem = allMedia.find((media) => media.id === id);
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

  // ========== VARIANT MANAGEMENT ==========

  const handleAddVariant = () => {
    setVariantForm({
      name: "",
      value: "",
      priceAdjustment: 0,
      stockQuantity: 0,
    });
    setEditingVariantIndex(null);
    setShowVariantForm(true);
  };

  const handleEditVariant = (index: number) => {
    setVariantForm({ ...variants[index] });
    setEditingVariantIndex(index);
    setShowVariantForm(true);
  };

  const handleSaveVariant = () => {
    if (!variantForm.name || !variantForm.value) {
      alert(
        locale === "vi"
          ? "Vui lòng nhập tên và giá trị biến thể"
          : "Please enter variant name and value"
      );
      return;
    }

    if (editingVariantIndex !== null) {
      // Update existing variant
      setVariants((prev) =>
        prev.map((variant, i) =>
          i === editingVariantIndex ? variantForm : variant
        )
      );
    } else {
      // Add new variant
      setVariants((prev) => [...prev, variantForm]);
    }

    setShowVariantForm(false);
    setEditingVariantIndex(null);
    setVariantForm({
      name: "",
      value: "",
      priceAdjustment: 0,
      stockQuantity: 0,
    });
  };

  const handleCancelVariantForm = () => {
    setShowVariantForm(false);
    setEditingVariantIndex(null);
    setVariantForm({
      name: "",
      value: "",
      priceAdjustment: 0,
      stockQuantity: 0,
    });
  };

  const handleDeleteVariant = (index: number) => {
    setDeleteVariantDialog({ open: true, index });
  };

  const confirmDeleteVariant = () => {
    if (deleteVariantDialog.index === null) return;
    setVariants((prev) =>
      prev.filter((_, i) => i !== deleteVariantDialog.index)
    );
    setDeleteVariantDialog({ open: false, index: null });
  };

  const handleVariantFormChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type } = e.target;
    setVariantForm((prev) => ({
      ...prev,
      [name]: type === "number" ? Number(value) : value,
    }));
  };

  // ========== FORM SUBMIT ==========

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsUploading(true);

    try {
      // Upload new image files first
      const imagesWithMedia = await Promise.all(
        images.map(async (img, index) => {
          // If image has a file (new upload), upload it first
          if (img.file) {
            const uploadedMedia = await uploadMediaMutation.mutateAsync(
              img.file
            );
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

      // Prepare variants data
      const variantsData = variants.map((variant) => ({
        name: variant.name,
        value: variant.value,
        priceAdjustment: variant.priceAdjustment,
        stockQuantity: variant.stockQuantity,
      }));

      await updateProductMutation.mutateAsync({
        id: productId,
        data: {
          ...formData,
          images: imagesWithMedia,
          variants: variantsData,
        },
      });

      alert(
        locale === "vi"
          ? "Cập nhật sản phẩm thành công!"
          : "Product updated successfully!"
      );
      router.push(`/${locale}/admin/products`);
    } catch (error: any) {
      console.error("Failed to update product:", error);
      alert(
        error.response?.data?.message ||
          (locale === "vi"
            ? "Không thể cập nhật sản phẩm"
            : "Failed to update product")
      );
    } finally {
      setIsUploading(false);
    }
  };

  if (productLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent"></div>
          <p className="mt-2 text-sm text-gray-600">
            {t("admin.products.loading")}
          </p>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="text-center">
          <p className="text-lg font-semibold text-gray-900">
            {t("admin.products.notFound")}
          </p>
          <Link href={`/${locale}/admin/products`}>
            <Button className="mt-4">{t("admin.products.backToList")}</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href={`/${locale}/admin/products`}>
            <Button variant="outline">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              {t("admin.products.editTitle")}
            </h1>
            <p className="text-sm text-gray-600">
              {locale === "vi"
                ? "Cập nhật thông tin sản phẩm"
                : "Update product information"}
            </p>
          </div>
        </div>
        {/* Top Save Button */}
        <Button
          type="submit"
          onClick={handleSubmit}
          disabled={updateProductMutation.isPending || isUploading}
          className="flex items-center gap-2"
        >
          <Save className="h-4 w-4" />
          {isUploading
            ? locale === "vi"
              ? "Đang tải ảnh lên..."
              : "Uploading images..."
            : updateProductMutation.isPending
            ? locale === "vi"
              ? "Đang cập nhật..."
              : "Updating..."
            : locale === "vi"
            ? "Lưu sản phẩm"
            : "Save Product"}
        </Button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Information */}
        <Card className="p-6">
          <h2 className="mb-4 text-lg font-semibold text-gray-900">
            {t("admin.products.basicInfo")}
          </h2>
          <div className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="nameVi">
                {locale === "vi"
                  ? "Tên sản phẩm (Tiếng Việt)"
                  : "Product Name (Vietnamese)"}
              </Label>
              <Input
                id="nameVi"
                name="nameVi"
                value={formData.nameVi}
                onChange={handleInputChange}
                required
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="nameEn">
                {locale === "vi"
                  ? "Tên sản phẩm (Tiếng Anh)"
                  : "Product Name (English)"}
              </Label>
              <Input
                id="nameEn"
                name="nameEn"
                value={formData.nameEn}
                onChange={handleInputChange}
                required
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="descriptionVi">
                {locale === "vi"
                  ? "Mô tả (Tiếng Việt)"
                  : "Description (Vietnamese)"}
              </Label>
              <RichTextEditor
                value={formData.descriptionVi}
                onChange={(value) =>
                  setFormData((prev) => ({ ...prev, descriptionVi: value }))
                }
                placeholder={
                  locale === "vi"
                    ? "Nhập mô tả sản phẩm..."
                    : "Enter product description..."
                }
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="descriptionEn">
                {locale === "vi"
                  ? "Mô tả (Tiếng Anh)"
                  : "Description (English)"}
              </Label>
              <RichTextEditor
                value={formData.descriptionEn}
                onChange={(value) =>
                  setFormData((prev) => ({ ...prev, descriptionEn: value }))
                }
                placeholder={
                  locale === "vi"
                    ? "Nhập mô tả sản phẩm..."
                    : "Enter product description..."
                }
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="slug">{t("admin.products.slug")}</Label>
              <Input
                id="slug"
                name="slug"
                value={formData.slug}
                onChange={handleInputChange}
                required
              />
              <p className="text-xs text-gray-500">
                {locale === "vi"
                  ? "URL thân thiện (VD: iphone-15-pro-max)"
                  : "URL-friendly slug (e.g., iphone-15-pro-max)"}
              </p>
            </div>
          </div>
        </Card>

        {/* Pricing */}
        <Card className="p-6">
          <h2 className="mb-4 text-lg font-semibold text-gray-900">
            {t("admin.products.pricing")}
          </h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="grid gap-2">
              <Label htmlFor="originalPrice">
                {t("admin.products.originalPrice")}
              </Label>
              <Input
                id="originalPrice"
                name="originalPrice"
                type="number"
                step="0.01"
                value={formData.originalPrice}
                onChange={handleInputChange}
                required
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="salePrice">{t("admin.products.salePrice")}</Label>
              <Input
                id="salePrice"
                name="salePrice"
                type="number"
                step="0.01"
                value={formData.salePrice || ""}
                onChange={handleInputChange}
              />
            </div>
          </div>
          <p className="mt-2 text-xs text-gray-500">
            {locale === "vi"
              ? "* Để trống giá khuyến mãi nếu không giảm giá"
              : "* Leave sale price empty if no sale"}
          </p>
        </Card>

        {/* Inventory */}
        <Card className="p-6">
          <h2 className="mb-4 text-lg font-semibold text-gray-900">
            {locale === "vi" ? "Kho hàng" : "Inventory"}
          </h2>
          <div className="grid gap-2">
            <Label htmlFor="stockQuantity">
              {locale === "vi" ? "Số lượng tồn kho" : "Stock Quantity"}
            </Label>
            <Input
              id="stockQuantity"
              name="stockQuantity"
              type="number"
              value={formData.stockQuantity}
              onChange={handleInputChange}
              required
            />
          </div>
        </Card>

        {/* Product Images */}
        <Card className="p-6">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">
              {locale === "vi" ? "Hình ảnh sản phẩm" : "Product Images"}
            </h2>
            <div className="flex flex-wrap items-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => fileInputRef.current?.click()}
              >
                <Upload className="mr-2 h-4 w-4" />
                {locale === "vi" ? "Chọn ảnh" : "Select Images"}
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => handleMediaDialogOpenChange(true)}
              >
                <Images className="mr-2 h-4 w-4" />
                {locale === "vi" ? "Chọn từ thư viện" : "Pick from library"}
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
                    img.isPrimary ? "border-yellow-400" : "border-gray-200"
                  } ${draggedImageIndex === index ? "opacity-50" : ""}`}
                >
                  <img
                    src={img.previewUrl || img.media?.url || (img as any).url || ''}
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
                      {locale === "vi" ? "Chính" : "Primary"}
                    </div>
                  )}

                  {/* New image badge */}
                  {img.file && (
                    <div className="absolute left-2 bottom-2 rounded bg-blue-500 px-2 py-1 text-xs font-semibold text-white">
                      {locale === "vi" ? "Mới" : "New"}
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
                      title={
                        locale === "vi" ? "Đặt làm ảnh chính" : "Set as primary"
                      }
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
                      title={locale === "vi" ? "Xóa ảnh" : "Delete image"}
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
                {locale === "vi" ? "Chưa có hình ảnh" : "No images yet"}
              </p>
              <p className="mt-1 text-xs text-gray-400">
                {locale === "vi"
                  ? 'Nhấn nút "Tải ảnh lên" để thêm ảnh'
                  : 'Click "Upload Images" to add images'}
              </p>
            </div>
          )}

          <div className="mt-4 space-y-2">
            <div className="rounded-md bg-blue-50 p-3">
              <p className="text-xs text-blue-800">
                <strong>{locale === "vi" ? "Mẹo:" : "Tip:"}</strong>{" "}
                {locale === "vi"
                  ? "Kéo thả để sắp xếp lại ảnh. Nhấn biểu tượng ngôi sao để đặt ảnh chính."
                  : "Drag and drop to reorder images. Click star icon to set primary image."}
              </p>
            </div>
            {images.some((img) => img.file) && (
              <div className="rounded-md bg-green-50 p-3">
                <p className="text-xs text-green-800">
                  <strong>{locale === "vi" ? "Lưu ý:" : "Note:"}</strong>{" "}
                  {locale === "vi"
                    ? "Ảnh mới sẽ được tải lên khi bạn nhấn 'Lưu sản phẩm'."
                    : "New images will be uploaded when you click 'Save Product'."}
                </p>
              </div>
            )}
          </div>
        </Card>

        {/* Product Variants */}
        <Card className="p-6">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">
              {locale === "vi" ? "Biến thể sản phẩm" : "Product Variants"}
            </h2>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleAddVariant}
            >
              <Plus className="mr-2 h-4 w-4" />
              {locale === "vi" ? "Thêm biến thể" : "Add Variant"}
            </Button>
          </div>

          {/* Variant Form */}
          {showVariantForm && (
            <Card className="mb-4 border-2 border-blue-200 bg-blue-50 p-4">
              <h3 className="mb-3 text-sm font-semibold text-gray-900">
                {editingVariantIndex !== null
                  ? locale === "vi"
                    ? "Chỉnh sửa biến thể"
                    : "Edit Variant"
                  : locale === "vi"
                  ? "Thêm biến thể mới"
                  : "Add New Variant"}
              </h3>
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="grid gap-2">
                  <Label htmlFor="variantName" className="text-xs">
                    {locale === "vi"
                      ? "Tên (VD: Màu sắc, Kích thước)"
                      : "Name (e.g., Color, Size)"}
                  </Label>
                  <Input
                    id="variantName"
                    name="name"
                    value={variantForm.name}
                    onChange={handleVariantFormChange}
                    placeholder={locale === "vi" ? "Màu sắc" : "Color"}
                  />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="variantValue" className="text-xs">
                    {locale === "vi"
                      ? "Giá trị (VD: Đỏ, XL)"
                      : "Value (e.g., Red, XL)"}
                  </Label>
                  <Input
                    id="variantValue"
                    name="value"
                    value={variantForm.value}
                    onChange={handleVariantFormChange}
                    placeholder={locale === "vi" ? "Đỏ" : "Red"}
                  />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="variantPriceAdjustment" className="text-xs">
                    {locale === "vi"
                      ? "Điều chỉnh giá (+/-)"
                      : "Price Adjustment (+/-)"}
                  </Label>
                  <Input
                    id="variantPriceAdjustment"
                    name="priceAdjustment"
                    type="number"
                    step="0.01"
                    value={variantForm.priceAdjustment}
                    onChange={handleVariantFormChange}
                    placeholder="0"
                  />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="variantStockQuantity" className="text-xs">
                    {locale === "vi" ? "Số lượng tồn kho" : "Stock Quantity"}
                  </Label>
                  <Input
                    id="variantStockQuantity"
                    name="stockQuantity"
                    type="number"
                    value={variantForm.stockQuantity}
                    onChange={handleVariantFormChange}
                    placeholder="0"
                  />
                </div>
              </div>

              <div className="mt-3 flex justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleCancelVariantForm}
                >
                  <XCircle className="mr-1 h-3 w-3" />
                  {locale === "vi" ? "Hủy" : "Cancel"}
                </Button>
                <Button type="button" size="sm" onClick={handleSaveVariant}>
                  <Save className="mr-1 h-3 w-3" />
                  {locale === "vi" ? "Lưu" : "Save"}
                </Button>
              </div>
            </Card>
          )}

          {/* Variants List */}
          {variants.length > 0 ? (
            <div className="space-y-2">
              {variants.map((variant, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between rounded-lg border p-3 hover:bg-gray-50"
                >
                  <div className="flex-1">
                    <p className="font-medium text-gray-900">
                      {variant.name}:{" "}
                      <span className="text-blue-600">{variant.value}</span>
                    </p>
                    <p className="mt-1 text-sm text-gray-500">
                      {locale === "vi"
                        ? "Điều chỉnh giá:"
                        : "Price Adjustment:"}{" "}
                      <span
                        className={
                          variant.priceAdjustment >= 0
                            ? "text-green-600"
                            : "text-red-600"
                        }
                      >
                        {variant.priceAdjustment >= 0 ? "+" : ""}
                        {variant.priceAdjustment}
                      </span>
                      {" | "}
                      {locale === "vi" ? "Tồn kho:" : "Stock:"}{" "}
                      {variant.stockQuantity}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => handleEditVariant(index)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeleteVariant(index)}
                    >
                      <Trash2 className="h-4 w-4 text-red-600" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="rounded-lg border-2 border-dashed border-gray-300 p-6 text-center">
              <p className="text-sm text-gray-500">
                {locale === "vi" ? "Không có biến thể" : "No variants"}
              </p>
              <p className="mt-1 text-xs text-gray-400">
                {locale === "vi"
                  ? 'Nhấn nút "Thêm biến thể" để tạo biến thể mới'
                  : 'Click "Add Variant" to create a new variant'}
              </p>
            </div>
          )}

          <div className="mt-4 rounded-md bg-blue-50 p-3">
            <p className="text-xs text-blue-800">
              <strong>{locale === "vi" ? "Lưu ý:" : "Note:"}</strong>{" "}
              {locale === "vi"
                ? "Biến thể cho phép bạn tạo các phiên bản khác nhau của sản phẩm (VD: màu sắc, kích thước)."
                : "Variants allow you to create different versions of the product (e.g., colors, sizes)."}
            </p>
          </div>
        </Card>

        {/* Category & Settings */}
        <Card className="p-6">
          <h2 className="mb-4 text-lg font-semibold text-gray-900">
            {locale === "vi" ? "Danh mục & Cài đặt" : "Category & Settings"}
          </h2>
          <div className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="categoryId">
                {locale === "vi" ? "Danh mục" : "Category"}
              </Label>
              <select
                id="categoryId"
                name="categoryId"
                value={formData.categoryId || ""}
                onChange={handleInputChange}
                className="w-full rounded-md border border-gray-300 px-3 py-2"
              >
                <option value="">
                  {locale === "vi" ? "Chọn danh mục" : "Select category"}
                </option>
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {getCategoryName(category)}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="status">
                {locale === "vi" ? "Trạng thái" : "Status"}
              </Label>
              <select
                id="status"
                name="status"
                value={formData.status}
                onChange={handleInputChange}
                className="w-full rounded-md border border-gray-300 px-3 py-2"
              >
                <option value="active">
                  {locale === "vi" ? "Đang bán" : "Active"}
                </option>
                <option value="inactive">
                  {locale === "vi" ? "Tạm ngưng" : "Inactive"}
                </option>
                <option value="out_of_stock">
                  {locale === "vi" ? "Hết hàng" : "Out of Stock"}
                </option>
              </select>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="featured"
                name="featured"
                checked={formData.featured}
                onChange={handleInputChange}
                className="h-4 w-4 rounded border-gray-300"
              />
              <Label htmlFor="featured" className="cursor-pointer">
                {locale === "vi" ? "Sản phẩm nổi bật" : "Featured Product"}
              </Label>
            </div>
          </div>
        </Card>

        {/* Actions */}
        <div className="flex justify-end gap-3">
          <Link href={`/${locale}/admin/products`}>
            <Button type="button" variant="outline">
              {locale === "vi" ? "Hủy" : "Cancel"}
            </Button>
          </Link>
          <Button type="submit" disabled={updateProductMutation.isPending}>
            {updateProductMutation.isPending
              ? locale === "vi"
                ? "Đang cập nhật..."
                : "Updating..."
              : locale === "vi"
              ? "Cập nhật sản phẩm"
              : "Update Product"}
          </Button>
        </div>
      </form>

      {/* Delete Image Confirmation */}
      <AlertDialog
        open={deleteImageDialog.open}
        onOpenChange={(open) =>
          setDeleteImageDialog({ ...deleteImageDialog, open })
        }
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {locale === "vi" ? "Xác nhận xóa ảnh" : "Confirm Delete Image"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {locale === "vi"
                ? "Bạn có chắc chắn muốn xóa ảnh này? Hành động này không thể hoàn tác."
                : "Are you sure you want to delete this image? This action cannot be undone."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>
              {locale === "vi" ? "Hủy" : "Cancel"}
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDeleteImage}
              className="bg-red-600 hover:bg-red-700"
            >
              {locale === "vi" ? "Xóa" : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Variant Confirmation */}
      <AlertDialog
        open={deleteVariantDialog.open}
        onOpenChange={(open) =>
          setDeleteVariantDialog({ ...deleteVariantDialog, open })
        }
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {locale === "vi"
                ? "Xác nhận xóa biến thể"
                : "Confirm Delete Variant"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {locale === "vi"
                ? "Bạn có chắc chắn muốn xóa biến thể này? Hành động này không thể hoàn tác."
                : "Are you sure you want to delete this variant? This action cannot be undone."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>
              {locale === "vi" ? "Hủy" : "Cancel"}
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDeleteVariant}
              className="bg-red-600 hover:bg-red-700"
            >
              {locale === "vi" ? "Xóa" : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Media Library Dialog */}
      <Dialog open={mediaLibraryOpen} onOpenChange={handleMediaDialogOpenChange}>
        <DialogContent className="flex max-h-[90vh] max-w-4xl flex-col">
          <DialogHeader>
            <DialogTitle>
              {locale === "vi" ? "Chọn ảnh từ thư viện" : "Select from media library"}
            </DialogTitle>
            <DialogDescription>
              {locale === "vi"
                ? "Chọn một hoặc nhiều ảnh đã tải lên để sử dụng cho sản phẩm."
                : "Pick one or multiple uploaded images to use for this product."}
            </DialogDescription>
          </DialogHeader>

          <div className="flex flex-1 flex-col space-y-4 min-h-0">
            {allMedia.length > 0 && (
              <Input
                placeholder={
                  locale === "vi"
                    ? "Tìm kiếm theo tên hoặc mô tả..."
                    : "Search by name or alt text..."
                }
                value={mediaSearchTerm}
                onChange={(e) => setMediaSearchTerm(e.target.value)}
              />
            )}

            {selectedMediaIds.length > 0 && (
              <div className="text-sm font-medium text-blue-600">
                {locale === "vi"
                  ? `${selectedMediaIds.length} ảnh đã chọn`
                  : `${selectedMediaIds.length} image${selectedMediaIds.length > 1 ? "s" : ""} selected`}
              </div>
            )}

            <div className="flex-1 overflow-y-auto min-h-0">
              {filteredMediaLibrary.length === 0 ? (
                <div className="rounded-lg border border-dashed border-gray-300 p-8 text-center">
                  <ImageIcon className="mx-auto h-12 w-12 text-gray-400" />
                  <p className="mt-3 text-sm text-gray-600">
                    {locale === "vi" ? "Chưa có media phù hợp" : "No matching media found"}
                  </p>
                  <p className="mt-1 text-xs text-gray-400">
                    {locale === "vi"
                      ? "Hãy tải ảnh mới lên trong mục Thư viện media."
                      : "Upload new images from the media library section."}
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
                            ? "cursor-not-allowed border-gray-200 opacity-60"
                            : isSelected
                            ? "border-blue-500 shadow-lg"
                            : "border-gray-200 hover:border-blue-400"
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
                            {locale === "vi" ? "Đã có trong danh sách" : "Already added"}
                          </div>
                        )}
                      </button>
                      <div className="truncate text-center text-xs text-gray-600">
                        {displayName}
                      </div>
                    </div>
                  );
                })}
                </div>
              )}
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => handleMediaDialogOpenChange(false)}
            >
              {locale === "vi" ? "Hủy" : "Cancel"}
            </Button>
            <Button
              type="button"
              onClick={handleAddMediaFromLibrary}
              disabled={selectedMediaIds.length === 0}
            >
              {locale === "vi"
                ? selectedMediaIds.length === 0
                  ? "Thêm ảnh đã chọn"
                  : `Thêm ${selectedMediaIds.length} ảnh`
                : selectedMediaIds.length === 0
                ? "Add selected images"
                : `Add ${selectedMediaIds.length} image${selectedMediaIds.length > 1 ? "s" : ""}`}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
