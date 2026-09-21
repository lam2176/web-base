'use client';

import { useEffect, useMemo, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import RichTextEditor from '@/components/ui/rich-text-editor';
import MediaPicker from '@/components/admin/media-picker';
import { Switch } from '@/components/ui/switch';
import { CreatePageDto, Page, Media } from '@/lib/types/api';

interface PageFormProps {
  locale: string;
  initialData?: Page;
  isSubmitting?: boolean;
  submitLabel?: string;
  onSubmit: (values: CreatePageDto) => void;
  onCancel: () => void;
}

const defaultData: CreatePageDto = {
  titleVi: '',
  titleEn: '',
  slug: '',
  contentVi: '',
  contentEn: '',
  status: 'active',
};

const normalizeSlug = (value: string) => {
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s-]/g, ' ')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');
};

const PageForm = ({ locale, initialData, isSubmitting, submitLabel, onSubmit, onCancel }: PageFormProps) => {
  const [formData, setFormData] = useState<CreatePageDto>(defaultData);
  const [isSlugManuallyEdited, setIsSlugManuallyEdited] = useState(false);
  const [featuredImage, setFeaturedImage] = useState<Media | null>(null);

  useEffect(() => {
    if (initialData) {
      setFormData({
        titleVi: initialData.titleVi,
        titleEn: initialData.titleEn,
        slug: initialData.slug,
        contentVi: initialData.contentVi || '',
        contentEn: initialData.contentEn || '',
        metaTitle: initialData.metaTitle || '',
        metaDescription: initialData.metaDescription || '',
        keywords: initialData.keywords || '',
        featuredImageId: initialData.featuredImageId,
        featuredImageAlt: initialData.featuredImageAlt || '',
        status: initialData.status ?? 'active',
        showInMenu: initialData.showInMenu ?? true,
      });
      setFeaturedImage(initialData.featuredImage || null);
      setIsSlugManuallyEdited(true);
    }
  }, [initialData]);

  const titleViLabel = useMemo(
    () => (locale === 'vi' ? 'Tiêu đề Tiếng Việt' : 'Vietnamese Title'),
    [locale],
  );
  const titleEnLabel = useMemo(
    () => (locale === 'vi' ? 'Tiêu đề Tiếng Anh' : 'English Title'),
    [locale],
  );

  const handleInputChange = (field: keyof CreatePageDto, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleTitleChange = (field: 'titleVi' | 'titleEn', value: string) => {
    setFormData((prev) => {
      const updated: CreatePageDto = {
        ...prev,
        [field]: value,
      };

      if (!isSlugManuallyEdited || !prev.slug) {
        updated.slug = normalizeSlug(value);
      }

      return updated;
    });
  };

  const handleSlugChange = (value: string) => {
    setIsSlugManuallyEdited(true);
    setFormData((prev) => ({
      ...prev,
      slug: normalizeSlug(value),
    }));
  };

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    onSubmit({
      ...formData,
      slug: normalizeSlug(formData.slug),
      featuredImageId: featuredImage?.id,
    });
  };

  return (
    <Card className="p-6">
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <div>
            <Label htmlFor="titleVi">
              {titleViLabel} *
            </Label>
            <Input
              id="titleVi"
              value={formData.titleVi}
              onChange={(event) => handleTitleChange('titleVi', event.target.value)}
              placeholder={locale === 'vi' ? 'Giới thiệu' : 'About us'}
              required
            />
          </div>
          <div>
            <Label htmlFor="titleEn">
              {titleEnLabel} *
            </Label>
            <Input
              id="titleEn"
              value={formData.titleEn}
              onChange={(event) => handleTitleChange('titleEn', event.target.value)}
              placeholder={locale === 'vi' ? 'About us' : 'English title'}
              required
            />
          </div>
          <div>
            <Label htmlFor="slug">Slug *</Label>
            <Input
              id="slug"
              value={formData.slug}
              onChange={(event) => handleSlugChange(event.target.value)}
              placeholder="about-us"
              required
            />
            <p className="mt-1 text-xs text-gray-500">
              {locale === 'vi'
                ? 'Slug sẽ được dùng cho đường dẫn, ví dụ: /about-us'
                : 'Slug will be used for the URL, e.g. /about-us'}
            </p>
          </div>
          <div>
            <Label htmlFor="status">
              {locale === 'vi' ? 'Trạng thái' : 'Status'}
            </Label>
            <select
              id="status"
              value={formData.status ?? 'active'}
              onChange={(event) => handleInputChange('status', event.target.value)}
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

        {/* Menu Display Toggle */}
        <div className="space-y-4 border-t pt-6">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="showInMenu" className="text-base">
                {locale === 'vi' ? 'Hiển thị trong menu' : 'Show in menu'}
              </Label>
              <p className="text-sm text-muted-foreground">
                {locale === 'vi'
                  ? 'Bật/tắt việc hiển thị menu trên website'
                  : 'Toggle menu display on website'}
              </p>
            </div>
            <Switch
              id="showInMenu"
              checked={formData.showInMenu ?? true}
              onCheckedChange={(checked) => {
                setFormData((prev) => ({
                  ...prev,
                  showInMenu: checked,
                }));
              }}
            />
          </div>
        </div>

        {/* SEO Fields */}
        <div className="space-y-4 border-t pt-6">
          <h3 className="text-lg font-semibold text-gray-900">
            {locale === 'vi' ? 'Tối ưu tìm kiếm' : 'Search Optimization'}
          </h3>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <div>
              <Label htmlFor="metaTitle">
                {locale === 'vi' ? 'Tiêu đề tìm kiếm' : 'Search Title'}
              </Label>
              <Input
                id="metaTitle"
                value={formData.metaTitle || ''}
                onChange={(event) => handleInputChange('metaTitle', event.target.value)}
                placeholder={locale === 'vi' ? 'Tiêu đề hiển thị trên Google' : 'Title shown on Google'}
              />
            </div>
            <div>
              <Label htmlFor="keywords">
                {locale === 'vi' ? 'Từ khóa' : 'Keywords'}
              </Label>
              <Input
                id="keywords"
                value={formData.keywords || ''}
                onChange={(event) => handleInputChange('keywords', event.target.value)}
                placeholder={locale === 'vi' ? 'từ khóa, phân cách, bằng dấu phẩy' : 'keywords, separated, by, commas'}
              />
            </div>
          </div>
          <div>
            <Label htmlFor="metaDescription">
              {locale === 'vi' ? 'Mô tả tìm kiếm' : 'Search Description'}
            </Label>
            <Textarea
              id="metaDescription"
              value={formData.metaDescription || ''}
              onChange={(event) => handleInputChange('metaDescription', event.target.value)}
              placeholder={locale === 'vi' ? 'Mô tả ngắn gọn hiển thị trên Google' : 'Brief description shown on Google'}
              rows={3}
            />
          </div>
        </div>

        {/* Media Upload */}
        <div className="space-y-4 border-t pt-6">
          <h3 className="text-lg font-semibold text-gray-900">
            {locale === 'vi' ? 'Hình ảnh' : 'Images'}
          </h3>
          <div className="space-y-4">
            <div>
              <MediaPicker
                locale={locale}
                value={featuredImage}
                onChange={setFeaturedImage}
                accept="image"
              />
              {featuredImage && (
                <div className="mt-2">
                  <Label htmlFor="featuredImageAlt">
                    {locale === 'vi' ? 'Mô tả ảnh' : 'Image Description'}
                  </Label>
                  <Input
                    id="featuredImageAlt"
                    value={formData.featuredImageAlt || ''}
                    onChange={(event) => handleInputChange('featuredImageAlt', event.target.value)}
                    placeholder={locale === 'vi' ? 'Mô tả nội dung ảnh' : 'Describe the image content'}
                  />
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="space-y-4 border-t pt-6">
          <h3 className="text-lg font-semibold text-gray-900">
            {locale === 'vi' ? 'Nội dung' : 'Content'}
          </h3>
          <div>
            <Label>
              {locale === 'vi' ? 'Nội dung Tiếng Việt' : 'Vietnamese Content'}
            </Label>
            <RichTextEditor
              value={formData.contentVi || ''}
              onChange={(value) => handleInputChange('contentVi', value)}
              placeholder={
                locale === 'vi'
                  ? 'Nhập nội dung tiếng Việt...'
                  : 'Enter Vietnamese content...'
              }
              className="mt-2"
            />
          </div>
          <div>
            <Label>
              {locale === 'vi' ? 'Nội dung Tiếng Anh' : 'English Content'}
            </Label>
            <RichTextEditor
              value={formData.contentEn || ''}
              onChange={(value) => handleInputChange('contentEn', value)}
              placeholder={
                locale === 'vi'
                  ? 'Nhập nội dung tiếng Anh...'
                  : 'Enter English content...'
              }
              className="mt-2"
            />
          </div>
        </div>

        <div className="flex items-center justify-end gap-4 border-t pt-4">
          <Button type="button" variant="outline" onClick={onCancel} disabled={isSubmitting}>
            {locale === 'vi' ? 'Hủy' : 'Cancel'}
          </Button>
          <Button type="submit" disabled={isSubmitting || !formData.slug}>
            {isSubmitting
              ? locale === 'vi'
                ? 'Đang lưu...'
                : 'Saving...'
              : submitLabel ?? (locale === 'vi' ? 'Lưu trang' : 'Save page')}
          </Button>
        </div>
      </form>
    </Card>
  );
};

export default PageForm;

