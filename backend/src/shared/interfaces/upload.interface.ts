import { BucketType, FileCategory } from '../constants/upload';

export interface UploadOptions {
  bucket: BucketType;
  folder?: string;
  category?: FileCategory;
  isPublic?: boolean;
  fileName?: string;
  maxSize?: number;
}

export interface UploadResult {
  success: boolean;
  fileUrl?: string;
  filePath?: string;
  fileName?: string;
  fileSize?: number;
  mimeType?: string;
  error?: string;
}

export interface UploadedFileInfo {
  originalName: string;
  fileName: string;
  mimeType: string;
  size: number;
  buffer: Buffer;
}

export interface FileValidation {
  isValid: boolean;
  error?: string;
}
