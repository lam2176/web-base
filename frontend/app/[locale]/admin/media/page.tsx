'use client';

import { useState, useRef } from 'react';
import { Upload, Search, Trash2, Download, Copy, Image as ImageIcon, X, Loader2, Pencil } from 'lucide-react';
import { useAdminMedia, useDeleteMedia, useUploadMedia, useUpdateMedia } from '@/lib/hooks/use-admin';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
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
import { Media } from '@/lib/types/api';
import { useQueryClient } from '@tanstack/react-query';

interface SelectedFile {
  file: File;
  previewUrl: string;
}

export default function AdminMediaPage({ params: { locale } }: { params: { locale: string } }) {
  const [search, setSearch] = useState('');
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [mediaToDelete, setMediaToDelete] = useState<Media | null>(null);
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<SelectedFile[]>([]);
  const [uploading, setUploading] = useState(false);
  const [renameDialogOpen, setRenameDialogOpen] = useState(false);
  const [mediaToRename, setMediaToRename] = useState<Media | null>(null);
  const [newName, setNewName] = useState('');
  const [renaming, setRenaming] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const queryClient = useQueryClient();

  const { data: mediaFiles = [], isLoading: loading } = useAdminMedia();
  const { mutate: deleteMedia } = useDeleteMedia();
  const { mutateAsync: updateMedia } = useUpdateMedia();
  const uploadMediaMutation = useUploadMedia();

  const handleDelete = () => {
    if (!mediaToDelete) return;

    deleteMedia(mediaToDelete.id, {
      onSuccess: () => {
        setDeleteDialogOpen(false);
        setMediaToDelete(null);
      },
      onError: (error) => {
        console.error('Failed to delete media:', error);
        alert(locale === 'vi' ? 'Không thể xóa file' : 'Failed to delete media');
      },
    });
  };

  const handleCopyUrl = (url: string) => {
    navigator.clipboard.writeText(url);
    alert(locale === 'vi' ? 'Đã copy URL!' : 'URL copied!');
  };

  const handleOpenRenameDialog = (media: Media) => {
    setMediaToRename(media);
    setNewName(media.name || media.filename || '');
    setRenameDialogOpen(true);
  };

  const handleRename = async () => {
    if (!mediaToRename || !newName.trim()) return;

    setRenaming(true);
    try {
      await updateMedia({ id: mediaToRename.id, data: { name: newName.trim() } });
      setRenameDialogOpen(false);
      setMediaToRename(null);
      setNewName('');
    } catch (error) {
      console.error('Failed to rename media:', error);
      alert(locale === 'vi' ? 'Không thể đổi tên file' : 'Failed to rename media');
    } finally {
      setRenaming(false);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const newFiles: SelectedFile[] = Array.from(files).map((file) => ({
      file,
      previewUrl: URL.createObjectURL(file),
    }));

    setSelectedFiles((prev) => [...prev, ...newFiles]);

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleRemoveFile = (index: number) => {
    const fileToRemove = selectedFiles[index];
    if (fileToRemove.previewUrl) {
      URL.revokeObjectURL(fileToRemove.previewUrl);
    }
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleUpload = async () => {
    if (selectedFiles.length === 0) return;

    setUploading(true);
    try {
      await Promise.all(
        selectedFiles.map((selectedFile) =>
          uploadMediaMutation.mutateAsync(selectedFile.file)
        )
      );

      // Refresh media list
      queryClient.invalidateQueries({ queryKey: ['admin', 'media'] });

      // Clear selected files
      selectedFiles.forEach((file) => {
        if (file.previewUrl) {
          URL.revokeObjectURL(file.previewUrl);
        }
      });
      setSelectedFiles([]);
      setUploadDialogOpen(false);

      alert(locale === 'vi' ? 'Tải lên thành công!' : 'Upload successful!');
    } catch (error) {
      console.error('Upload error:', error);
      alert(locale === 'vi' ? 'Không thể tải lên file' : 'Failed to upload files');
    } finally {
      setUploading(false);
    }
  };

  const handleCloseUploadDialog = () => {
    // Clean up preview URLs
    selectedFiles.forEach((file) => {
      if (file.previewUrl) {
        URL.revokeObjectURL(file.previewUrl);
      }
    });
    setSelectedFiles([]);
    setUploadDialogOpen(false);
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat(locale === 'vi' ? 'vi-VN' : 'en-US', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  };

  const filteredMedia = (mediaFiles || []).filter((media) => {
    const name = media.name || '';
    const filename = media.filename || '';
    const alt = media.alt || '';
    const searchLower = search.toLowerCase();
    return (
      name.toLowerCase().includes(searchLower) ||
      filename.toLowerCase().includes(searchLower) ||
      alt.toLowerCase().includes(searchLower)
    );
  });

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
            {locale === 'vi' ? 'Quản lý Media' : 'Media Management'}
          </h1>
          <p className="text-sm text-gray-600">
            {locale === 'vi' ? 'Quản lý ảnh và file trong hệ thống' : 'Manage images and files in the system'}
          </p>
        </div>
        <Button onClick={() => setUploadDialogOpen(true)}>
          <Upload className="mr-2 h-4 w-4" />
          {locale === 'vi' ? 'Tải lên' : 'Upload'}
        </Button>
      </div>

      {/* Search */}
      <Card className="p-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <Input
            placeholder={locale === 'vi' ? 'Tìm kiếm file...' : 'Search files...'}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
      </Card>

      {/* Media Grid */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
        {filteredMedia.length === 0 ? (
          <div className="col-span-full p-8 text-center text-gray-500">
            {locale === 'vi' ? 'Không có file nào' : 'No files found'}
          </div>
        ) : (
          filteredMedia.map((media) => {
            const mimeType = media.mimeType || (media as any).mimetype || '';
            const imageUrl = media.url || (media as any).filepath || '';
            const isImage = mimeType.startsWith('image/');
            
            return (
            <Card key={media.id} className="group relative overflow-hidden">
              {/* Image Preview */}
              <div className="aspect-square bg-gray-100">
                {isImage && imageUrl ? (
                  <img
                    src={imageUrl}
                    alt={media.alt || media.filename}
                    className="h-full w-full object-cover"
                    onError={(e) => {
                      console.error('Image load error:', { media, url: imageUrl, mimeType });
                      (e.target as HTMLImageElement).style.display = 'none';
                    }}
                  />
                ) : (
                  <div className="flex h-full items-center justify-center">
                    <ImageIcon className="h-12 w-12 text-gray-400" />
                  </div>
                )}
              </div>

              {/* Overlay Actions */}
              <div className="absolute inset-0 flex items-center justify-center gap-2 bg-black/50 opacity-0 transition-opacity group-hover:opacity-100">
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => handleOpenRenameDialog(media)}
                  title={locale === 'vi' ? 'Đổi tên' : 'Rename'}
                >
                  <Pencil className="h-4 w-4" />
                </Button>
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => handleCopyUrl(media.url)}
                  title={locale === 'vi' ? 'Copy URL' : 'Copy URL'}
                >
                  <Copy className="h-4 w-4" />
                </Button>
                <a href={media.url} download target="_blank" rel="noopener noreferrer">
                  <Button
                    size="sm"
                    variant="secondary"
                    title={locale === 'vi' ? 'Tải xuống' : 'Download'}
                  >
                    <Download className="h-4 w-4" />
                  </Button>
                </a>
                <Button
                  size="sm"
                  variant="destructive"
                  onClick={() => {
                    setMediaToDelete(media);
                    setDeleteDialogOpen(true);
                  }}
                  title={locale === 'vi' ? 'Xóa' : 'Delete'}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>

              {/* File Info */}
              <div className="p-3">
                <p className="truncate text-sm font-medium text-gray-900">
                  {media.name || media.filename}
                </p>
                {media.name && media.name !== media.filename && (
                  <p className="truncate text-xs text-gray-500">{media.filename}</p>
                )}
                <div className="mt-1 flex items-center justify-between text-xs text-gray-500">
                  <span>{formatFileSize(media.size)}</span>
                  <span>{(media.mimeType || (media as any).mimetype)?.split('/')[1]?.toUpperCase() || 'FILE'}</span>
                </div>
                <p className="mt-1 text-xs text-gray-400">{formatDate(media.createdAt)}</p>
              </div>
            </Card>
            );
          })
        )}
      </div>

      {/* Upload Dialog */}
      <AlertDialog open={uploadDialogOpen} onOpenChange={handleCloseUploadDialog}>
        <AlertDialogContent className="max-w-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle>
              {locale === 'vi' ? 'Tải lên file' : 'Upload File'}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {locale === 'vi'
                ? 'Chọn một hoặc nhiều file để tải lên. Hỗ trợ ảnh và các file khác.'
                : 'Select one or more files to upload. Supports images and other files.'}
            </AlertDialogDescription>
          </AlertDialogHeader>

          <div className="space-y-4 py-4">
            <div>
              <Label htmlFor="file-upload">
                {locale === 'vi' ? 'Chọn file' : 'Select Files'}
              </Label>
              <div className="mt-2">
                <div
                  className="flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-gray-300 bg-gray-50 p-8 transition-colors hover:border-gray-400 hover:bg-gray-100"
                  onDragOver={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                  }}
                  onDragLeave={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                  }}
                  onDrop={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    const files = Array.from(e.dataTransfer.files);
                    if (files.length > 0) {
                      const newFiles: SelectedFile[] = files.map((file) => ({
                        file,
                        previewUrl: URL.createObjectURL(file),
                      }));
                      setSelectedFiles((prev) => [...prev, ...newFiles]);
                    }
                  }}
                  onClick={() => fileInputRef.current?.click()}
                >
                  <Upload className="mb-2 h-12 w-12 text-gray-400" />
                  <p className="mb-1 text-sm font-medium text-gray-700">
                    {locale === 'vi' ? 'Kéo thả file vào đây' : 'Drag and drop files here'}
                  </p>
                  <p className="text-xs text-gray-500">
                    {locale === 'vi' ? 'hoặc' : 'or'}
                  </p>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="mt-2"
                    onClick={(e) => {
                      e.stopPropagation();
                      fileInputRef.current?.click();
                    }}
                    disabled={uploading}
                  >
                    <Upload className="mr-2 h-4 w-4" />
                    {locale === 'vi' ? 'Chọn file' : 'Select Files'}
                  </Button>
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  onChange={handleFileSelect}
                  className="hidden"
                />
              </div>
            </div>

            {selectedFiles.length > 0 && (
              <div className="space-y-2">
                <Label>{locale === 'vi' ? 'File đã chọn' : 'Selected Files'}</Label>
                <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
                  {selectedFiles.map((selectedFile, index) => {
                    const isImage = selectedFile.file.type.startsWith('image/');
                    return (
                      <div
                        key={index}
                        className="group relative rounded-lg border-2 border-gray-200 overflow-hidden"
                      >
                        <div className="aspect-square bg-gray-100">
                          {isImage ? (
                            <img
                              src={selectedFile.previewUrl}
                              alt={selectedFile.file.name}
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            <div className="flex h-full items-center justify-center">
                              <ImageIcon className="h-12 w-12 text-gray-400" />
                            </div>
                          )}
                        </div>
                        <Button
                          type="button"
                          variant="destructive"
                          size="icon"
                          className="absolute right-2 top-2 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                          onClick={() => handleRemoveFile(index)}
                          disabled={uploading}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                        <div className="p-2">
                          <p className="truncate text-xs text-gray-600">{selectedFile.file.name}</p>
                          <p className="text-xs text-gray-400">
                            {formatFileSize(selectedFile.file.size)}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          <AlertDialogFooter>
            <AlertDialogCancel onClick={handleCloseUploadDialog} disabled={uploading}>
              {locale === 'vi' ? 'Hủy' : 'Cancel'}
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleUpload}
              disabled={selectedFiles.length === 0 || uploading}
            >
              {uploading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {locale === 'vi' ? 'Đang tải lên...' : 'Uploading...'}
                </>
              ) : (
                <>
                  <Upload className="mr-2 h-4 w-4" />
                  {locale === 'vi' ? 'Tải lên' : 'Upload'}
                </>
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {locale === 'vi' ? 'Xác nhận xóa' : 'Confirm Delete'}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {locale === 'vi'
                ? `Bạn có chắc chắn muốn xóa file "${mediaToDelete?.filename}"? Hành động này không thể hoàn tác và có thể ảnh hưởng đến các sản phẩm đang sử dụng file này.`
                : `Are you sure you want to delete "${mediaToDelete?.filename}"? This action cannot be undone and may affect products using this file.`}
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

      {/* Rename Dialog */}
      <Dialog open={renameDialogOpen} onOpenChange={setRenameDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {locale === 'vi' ? 'Đổi tên Media' : 'Rename Media'}
            </DialogTitle>
            <DialogDescription>
              {locale === 'vi'
                ? 'Nhập tên mới cho file. Tên này sẽ giúp bạn dễ dàng tìm kiếm file hơn.'
                : 'Enter a new name for this file. This will help you search for files more easily.'}
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Label htmlFor="media-name">
              {locale === 'vi' ? 'Tên hiển thị' : 'Display Name'}
            </Label>
            <Input
              id="media-name"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder={locale === 'vi' ? 'Nhập tên...' : 'Enter name...'}
              className="mt-2"
              disabled={renaming}
            />
            {mediaToRename && (
              <p className="mt-2 text-xs text-gray-500">
                {locale === 'vi' ? 'Tên file gốc:' : 'Original filename:'} {mediaToRename.filename}
              </p>
            )}
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setRenameDialogOpen(false)}
              disabled={renaming}
            >
              {locale === 'vi' ? 'Hủy' : 'Cancel'}
            </Button>
            <Button onClick={handleRename} disabled={!newName.trim() || renaming}>
              {renaming ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {locale === 'vi' ? 'Đang lưu...' : 'Saving...'}
                </>
              ) : (
                locale === 'vi' ? 'Lưu' : 'Save'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
