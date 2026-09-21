'use client';

import { useState, useRef } from 'react';
import { Upload, X, Image as ImageIcon, Video, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useAdminMedia, useUploadMedia } from '@/lib/hooks/use-admin';
import { Media } from '@/lib/types/api';
import { Input } from '@/components/ui/input';
import { Search } from 'lucide-react';

interface MediaPickerProps {
  locale: string;
  value?: Media | null;
  onChange: (media: Media | null) => void;
  accept?: 'image' | 'video' | 'all';
  label?: string;
}

export default function MediaPicker({ locale, value, onChange, accept = 'all', label }: MediaPickerProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { data: mediaFiles = [], isLoading } = useAdminMedia();
  const uploadMediaMutation = useUploadMedia();

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const uploadedMedia = await uploadMediaMutation.mutateAsync(file);
      onChange(uploadedMedia);
      setOpen(false);
    } catch (error) {
      console.error('Upload error:', error);
      alert(locale === 'vi' ? 'Không thể tải lên file' : 'Failed to upload file');
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleSelectMedia = (media: Media) => {
    onChange(media);
    setOpen(false);
  };

  const handleRemove = () => {
    onChange(null);
  };

  const filteredMedia = mediaFiles.filter((media) => {
    const mimeType = media.mimeType || (media as any).mimetype || '';
    const matchesType =
      accept === 'all' ||
      (accept === 'image' && mimeType.startsWith('image/')) ||
      (accept === 'video' && mimeType.startsWith('video/'));

    const searchLower = search.toLowerCase();
    const matchesSearch =
      !search ||
      (media.name || '').toLowerCase().includes(searchLower) ||
      media.filename.toLowerCase().includes(searchLower) ||
      (media.alt || '').toLowerCase().includes(searchLower);

    return matchesType && matchesSearch;
  });

  const acceptAttribute = accept === 'image' ? 'image/*' : accept === 'video' ? 'video/*' : '*/*';

  return (
    <div className="space-y-2">
      {label && <Label>{label}</Label>}
      
      {value ? (
        <div className="relative inline-block">
          <div className="group relative h-32 w-32 overflow-hidden rounded-lg border-2 border-gray-200">
            {value.url && (value.mimeType || (value as any).mimetype || '').startsWith('image/') ? (
              <img
                src={value.url}
                alt={value.alt || value.filename}
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center bg-gray-100">
                <Video className="h-12 w-12 text-gray-400" />
              </div>
            )}
            <div className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 transition-opacity group-hover:opacity-100">
              <Button
                size="sm"
                variant="destructive"
                onClick={handleRemove}
                type="button"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
          <p className="mt-1 text-xs text-gray-600">{value.name || value.filename}</p>
        </div>
      ) : (
        <Button
          type="button"
          variant="outline"
          onClick={() => setOpen(true)}
          className="h-32 w-32"
        >
          <div className="flex flex-col items-center gap-2">
            <ImageIcon className="h-8 w-8 text-gray-400" />
            <span className="text-xs">
              {locale === 'vi' ? 'Chọn file' : 'Select file'}
            </span>
          </div>
        </Button>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>
              {locale === 'vi' ? 'Chọn hoặc tải lên file' : 'Select or Upload File'}
            </DialogTitle>
            <DialogDescription>
              {locale === 'vi'
                ? 'Chọn file từ thư viện hoặc tải lên file mới'
                : 'Choose from library or upload a new file'}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* Upload Button */}
            <div className="flex items-center gap-4">
              <input
                ref={fileInputRef}
                type="file"
                accept={acceptAttribute}
                onChange={handleFileSelect}
                className="hidden"
              />
              <Button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
              >
                {uploading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {locale === 'vi' ? 'Đang tải lên...' : 'Uploading...'}
                  </>
                ) : (
                  <>
                    <Upload className="mr-2 h-4 w-4" />
                    {locale === 'vi' ? 'Tải lên file mới' : 'Upload New File'}
                  </>
                )}
              </Button>

              {/* Search */}
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                <Input
                  placeholder={locale === 'vi' ? 'Tìm kiếm...' : 'Search...'}
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>

            {/* Media Grid */}
            <div className="max-h-96 overflow-y-auto">
              {isLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
                </div>
              ) : filteredMedia.length === 0 ? (
                <div className="py-8 text-center text-gray-500">
                  {locale === 'vi' ? 'Không có file nào' : 'No files found'}
                </div>
              ) : (
                <div className="grid grid-cols-4 gap-4">
                  {filteredMedia.map((media) => {
                    const mimeType = media.mimeType || (media as any).mimetype || '';
                    const isImage = mimeType.startsWith('image/');
                    const isVideo = mimeType.startsWith('video/');

                    return (
                      <button
                        key={media.id}
                        type="button"
                        onClick={() => handleSelectMedia(media)}
                        className="group relative aspect-square overflow-hidden rounded-lg border-2 border-gray-200 transition-all hover:border-blue-500"
                      >
                        <div className="h-full w-full bg-gray-100">
                          {isImage && media.url ? (
                            <img
                              src={media.url}
                              alt={media.alt || media.filename}
                              className="h-full w-full object-cover"
                            />
                          ) : isVideo ? (
                            <div className="flex h-full items-center justify-center">
                              <Video className="h-12 w-12 text-gray-400" />
                            </div>
                          ) : (
                            <div className="flex h-full items-center justify-center">
                              <ImageIcon className="h-12 w-12 text-gray-400" />
                            </div>
                          )}
                        </div>
                        <div className="absolute bottom-0 left-0 right-0 bg-black/50 p-1 text-xs text-white opacity-0 transition-opacity group-hover:opacity-100">
                          <p className="truncate">{media.name || media.filename}</p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

