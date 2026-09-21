"use client"

import { useState, useEffect } from 'react'
import { Upload, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Media } from '@/lib/types/api'
import Image from 'next/image'

interface BankQrUploadProps {
  bankQr?: Media | null
  bankQrFile: File | null
  onFileSelect: (file: File | null) => void
  locale: string
}

export default function BankQrUpload({
  bankQr,
  bankQrFile,
  onFileSelect,
  locale,
}: BankQrUploadProps) {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)

  // Create preview URL when file is selected
  useEffect(() => {
    if (bankQrFile) {
      const url = URL.createObjectURL(bankQrFile)
      setPreviewUrl(url)
      return () => URL.revokeObjectURL(url)
    } else {
      setPreviewUrl(null)
    }
  }, [bankQrFile])

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      onFileSelect(e.target.files[0])
    }
  }

  const handleRemove = () => {
    onFileSelect(null)
    setPreviewUrl(null)
  }

  const displayUrl = previewUrl || bankQr?.url

  return (
    <div className="space-y-3">
      <label className="text-sm font-semibold text-gray-700">
        {locale === 'vi' ? 'Ảnh QR Ngân hàng' : 'Bank QR Code Image'}
      </label>
      <p className="text-xs text-gray-500">
        {locale === 'vi'
          ? 'Tải lên ảnh mã QR ngân hàng để khách hàng dễ dàng chuyển khoản'
          : 'Upload bank QR code image for easy customer transfers'}
      </p>

      <div className="flex items-start gap-4">
        {displayUrl ? (
          <div className="flex-shrink-0">
            <div className="relative h-48 w-48 rounded-lg overflow-hidden border-2 border-gray-200 bg-white">
              <Image
                src={displayUrl}
                alt={locale === 'vi' ? 'Ảnh QR Ngân hàng' : 'Bank QR Code'}
                fill
                className="object-contain p-2"
              />
            </div>
            <div className="flex gap-2 mt-3">
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="flex-1"
                onClick={() => document.getElementById('bank-qr-upload')?.click()}
              >
                <Upload className="h-4 w-4 mr-2" />
                {locale === 'vi' ? 'Đổi ảnh' : 'Change'}
              </Button>
              <Button
                type="button"
                variant="destructive"
                size="sm"
                onClick={handleRemove}
              >
                <X className="h-4 w-4 mr-2" />
                {locale === 'vi' ? 'Xóa' : 'Remove'}
              </Button>
            </div>
            <input
              id="bank-qr-upload"
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleFileChange}
            />
          </div>
        ) : (
          <div className="flex-shrink-0">
            <label
              htmlFor="bank-qr-upload"
              className="flex flex-col items-center justify-center w-48 h-48 border-2 border-dashed border-gray-300 rounded-lg hover:border-primary transition-colors cursor-pointer bg-gray-50 hover:bg-gray-100"
            >
              <Upload className="h-10 w-10 text-gray-400 mb-3" />
              <span className="text-sm font-medium text-gray-700 mb-1">
                {locale === 'vi' ? 'Tải ảnh lên' : 'Upload Image'}
              </span>
              <span className="text-xs text-gray-500 px-4 text-center">
                {locale === 'vi' ? 'PNG, JPG, GIF tối đa 10MB' : 'PNG, JPG, GIF up to 10MB'}
              </span>
              <input
                id="bank-qr-upload"
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleFileChange}
              />
            </label>
          </div>
        )}

        {displayUrl && bankQrFile && (
          <div className="flex-1 bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                <Upload className="h-4 w-4 text-blue-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-blue-900 mb-1">
                  {locale === 'vi' ? 'Ảnh mới đã được chọn' : 'New image selected'}
                </p>
                <p className="text-xs text-blue-700">
                  {locale === 'vi'
                    ? 'Nhấn "Lưu cài đặt" bên dưới để lưu ảnh QR mới'
                    : 'Click "Save Settings" below to save the new QR image'}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
