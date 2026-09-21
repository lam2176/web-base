import { UPLOAD_CONFIG, FileCategory } from '../constants/upload';
import { randomUUID } from 'crypto';
import * as path from 'path';

/**
 * Generate unique file name
 */
export function generateFileName(prefix: string, extension: string): string {
  const timestamp = Date.now();
  const uuid = randomUUID().split('-')[0];
  return `${prefix}_${timestamp}_${uuid}${extension}`;
}

/**
 * Generate temp file name
 */
export function generateTempFileName(prefix: string = 'temp'): string {
  return generateFileName(prefix, '');
}

/**
 * Format file size to human readable format
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
}

/**
 * Get file category from mime type
 */
export function getFileCategoryFromMimeType(mimeType: string): FileCategory | null {
  for (const [category, mimeTypes] of Object.entries(UPLOAD_CONFIG.ALLOWED_MIME_TYPES)) {
    if (mimeTypes.includes(mimeType)) {
      return category as FileCategory;
    }
  }
  return null;
}

/**
 * Check if file is image
 */
export function isImageFile(mimeType: string): boolean {
  return UPLOAD_CONFIG.ALLOWED_MIME_TYPES.IMAGE.includes(mimeType);
}

/**
 * Check if file is document
 */
export function isDocumentFile(mimeType: string): boolean {
  return UPLOAD_CONFIG.ALLOWED_MIME_TYPES.DOCUMENT.includes(mimeType);
}

/**
 * Get product image folder
 */
export function getProductImageFolder(productId: number | string): string {
  return `${UPLOAD_CONFIG.FOLDERS.PRODUCT_IMAGES}/${productId}`;
}

/**
 * Get category image folder
 */
export function getCategoryImageFolder(categoryId: number | string): string {
  return `${UPLOAD_CONFIG.FOLDERS.CATEGORY_IMAGES}/${categoryId}`;
}

/**
 * Get banner image folder
 */
export function getBannerImageFolder(): string {
  return UPLOAD_CONFIG.FOLDERS.BANNER_IMAGES;
}

/**
 * Get page image folder
 */
export function getPageImageFolder(pageId: number | string): string {
  return `${UPLOAD_CONFIG.FOLDERS.PAGE_IMAGES}/${pageId}`;
}

/**
 * Get temp file folder
 */
export function getTempFileFolder(userId?: number | string): string {
  if (userId) {
    return `${UPLOAD_CONFIG.FOLDERS.TEMP}/${userId}`;
  }
  return UPLOAD_CONFIG.FOLDERS.TEMP;
}

/**
 * Extract file extension from filename
 */
export function getFileExtension(filename: string): string {
  return path.extname(filename).toLowerCase();
}

/**
 * Get file name without extension
 */
export function getFileNameWithoutExtension(filename: string): string {
  return path.basename(filename, path.extname(filename));
}
