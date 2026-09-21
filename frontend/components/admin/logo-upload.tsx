'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { Upload, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Media } from '@/lib/types/api';

interface LogoUploadProps {
  logo?: Media;
  logoFile?: File | null;
  onFileSelect: (file: File | null) => void;
  locale: string;
}

export default function LogoUpload({
  logo,
  logoFile,
  onFileSelect,
  locale,
}: LogoUploadProps) {
  const [dragActive, setDragActive] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  // Create preview URL when file is selected
  useEffect(() => {
    if (logoFile) {
      const url = URL.createObjectURL(logoFile);
      setPreviewUrl(url);
      return () => URL.revokeObjectURL(url);
    } else {
      setPreviewUrl(null);
    }
  }, [logoFile]);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      if (file.type.startsWith('image/')) {
        onFileSelect(file);
      }
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      onFileSelect(e.target.files[0]);
    }
  };

  const handleRemove = () => {
    onFileSelect(null);
  };

  return (
    <div className="space-y-3">
      <div>
        <Label className="text-base font-semibold">
          {locale === 'vi' ? 'Logo cửa hàng' : 'Store Logo'}
        </Label>
      </div>

      {(previewUrl || logo) ? (
        <div className="space-y-3">
          <div className="relative inline-block">
            <div className="relative h-40 w-64 overflow-hidden rounded-lg border-2 border-gray-200 bg-white p-4">
              <Image
                src={previewUrl || logo?.url || ''}
                alt="Store logo"
                fill
                className="object-contain p-2"
              />
            </div>
            <Button
              type="button"
              variant="destructive"
              size="icon"
              className="absolute -right-2 -top-2 h-7 w-7 rounded-full shadow-md"
              onClick={handleRemove}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
          {previewUrl && (
            <div className="rounded-md bg-blue-50 p-3 max-w-md">
              <p className="text-sm text-blue-800">
                <strong>{locale === 'vi' ? '💡 Lưu ý:' : '💡 Note:'}</strong>{' '}
                {locale === 'vi'
                  ? 'Logo mới sẽ được lưu khi bạn nhấn nút "Lưu cài đặt" ở dưới.'
                  : 'New logo will be saved when you click "Save Settings" button below.'}
              </p>
            </div>
          )}
          {!previewUrl && logo && (
            <p className="text-xs text-gray-500 max-w-md">
              {locale === 'vi' ? 'Nhấp vào nút X để xóa logo hiện tại' : 'Click X button to remove current logo'}
            </p>
          )}
        </div>
      ) : (
        <div
          className={`relative flex h-32 w-full cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed transition-colors ${
            dragActive
              ? 'border-blue-500 bg-blue-50'
              : 'border-gray-300 hover:border-gray-400'
          }`}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
        >
          <input
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            className="absolute inset-0 cursor-pointer opacity-0"
          />
          <Upload className="mb-2 h-8 w-8 text-gray-400" />
          <p className="text-sm text-gray-600">
            {locale === 'vi'
              ? 'Nhấp hoặc kéo thả hình ảnh vào đây'
              : 'Click or drag and drop image here'}
          </p>
          <p className="mt-1 text-xs text-gray-500">
            {locale === 'vi' ? 'PNG, JPG, GIF tối đa 10MB' : 'PNG, JPG, GIF up to 10MB'}
          </p>
        </div>
      )}
    </div>
  );
}
