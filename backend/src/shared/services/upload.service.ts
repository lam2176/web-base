import { Injectable } from '@nestjs/common';
import { SupabaseService } from './supabase.service';
import { LoggerService } from './logger.service';
import {
  UploadOptions,
  UploadResult,
  UploadedFileInfo,
  FileValidation,
} from '../interfaces/upload.interface';
import {
  UPLOAD_CONFIG,
  FileCategory,
  BucketType,
} from '../constants/upload';
import {
  generateFileName,
  getFileExtension,
  formatFileSize,
  getFileCategoryFromMimeType,
} from '../helpers/upload.helper';

@Injectable()
export class UploadService {
  constructor(
    private supabaseService: SupabaseService,
    private logger: LoggerService,
  ) {}

  /**
   * Validate file before upload
   */
  validateFile(
    file: UploadedFileInfo,
    category?: FileCategory,
    maxSize?: number,
  ): FileValidation {
    if (!file || !file.buffer) {
      return {
        isValid: false,
        error: 'No file provided',
      };
    }

    // Detect category from mime type if not provided
    const fileCategory = category || getFileCategoryFromMimeType(file.mimeType);

    if (!fileCategory) {
      return {
        isValid: false,
        error: `File type ${file.mimeType} is not supported`,
      };
    }

    // Check mime type
    const allowedMimeTypes = UPLOAD_CONFIG.ALLOWED_MIME_TYPES[fileCategory];
    if (!allowedMimeTypes.includes(file.mimeType)) {
      return {
        isValid: false,
        error: `File type ${file.mimeType} is not allowed for ${fileCategory}`,
      };
    }

    // Check file size
    const maxFileSize = maxSize || UPLOAD_CONFIG.MAX_FILE_SIZE[fileCategory];
    if (file.size > maxFileSize) {
      return {
        isValid: false,
        error: `File size exceeds maximum allowed size of ${formatFileSize(maxFileSize)}`,
      };
    }

    // Check extension
    const extension = getFileExtension(file.originalName);
    const allowedExtensions = UPLOAD_CONFIG.ALLOWED_EXTENSIONS[fileCategory];
    if (!allowedExtensions.includes(extension)) {
      return {
        isValid: false,
        error: `File extension ${extension} is not allowed`,
      };
    }

    return { isValid: true };
  }

  /**
   * Upload single file to Supabase storage
   */
  async uploadFile(
    file: UploadedFileInfo,
    options: UploadOptions,
  ): Promise<UploadResult> {
    try {
      // Validate file
      const validation = this.validateFile(
        file,
        options.category,
        options.maxSize,
      );

      if (!validation.isValid) {
        return {
          success: false,
          error: validation.error,
        };
      }

      // Generate file name
      const extension = getFileExtension(file.originalName);
      const fileName =
        options.fileName ||
        generateFileName(
          options.folder || 'file',
          extension,
        );

      // Build file path
      const filePath = options.folder
        ? `${options.folder}/${fileName}`
        : fileName;

      // Get bucket name
      const bucketName = UPLOAD_CONFIG.BUCKET[options.bucket];

      // Upload to Supabase
      const { data, error } = await this.supabaseService.storage
        .from(bucketName)
        .upload(filePath, file.buffer, {
          contentType: file.mimeType,
          upsert: false,
        });

      if (error) {
        this.logger.error(
          `Failed to upload file: ${error.message}`,
          error.stack,
          'UploadService',
        );
        return {
          success: false,
          error: `Upload failed: ${error.message}`,
        };
      }

      // Get public URL
      const fileUrl = this.getPublicUrl(data.path, options.bucket);

      this.logger.log(
        `File uploaded successfully: ${data.path}`,
        'UploadService',
      );

      return {
        success: true,
        fileUrl,
        filePath: data.path,
        fileName,
        fileSize: file.size,
        mimeType: file.mimeType,
      };
    } catch (error) {
      this.logger.error(
        `Error uploading file: ${error.message}`,
        error.stack,
        'UploadService',
      );
      return {
        success: false,
        error: `Upload error: ${error.message}`,
      };
    }
  }

  /**
   * Upload multiple files
   */
  async uploadMultipleFiles(
    files: UploadedFileInfo[],
    options: UploadOptions,
  ): Promise<UploadResult[]> {
    const uploadPromises = files.map((file) => this.uploadFile(file, options));
    return Promise.all(uploadPromises);
  }

  /**
   * Delete file from Supabase storage
   */
  async deleteFile(
    filePath: string,
    bucket: BucketType,
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const bucketName = UPLOAD_CONFIG.BUCKET[bucket];

      const { error } = await this.supabaseService.storage
        .from(bucketName)
        .remove([filePath]);

      if (error) {
        this.logger.error(
          `Failed to delete file: ${error.message}`,
          error.stack,
          'UploadService',
        );
        return {
          success: false,
          error: `Delete failed: ${error.message}`,
        };
      }

      this.logger.log(`File deleted successfully: ${filePath}`, 'UploadService');

      return { success: true };
    } catch (error) {
      this.logger.error(
        `Error deleting file: ${error.message}`,
        error.stack,
        'UploadService',
      );
      return {
        success: false,
        error: `Delete error: ${error.message}`,
      };
    }
  }

  /**
   * Delete multiple files
   */
  async deleteMultipleFiles(
    filePaths: string[],
    bucket: BucketType,
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const bucketName = UPLOAD_CONFIG.BUCKET[bucket];

      const { error } = await this.supabaseService.storage
        .from(bucketName)
        .remove(filePaths);

      if (error) {
        return {
          success: false,
          error: `Delete failed: ${error.message}`,
        };
      }

      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: `Delete error: ${error.message}`,
      };
    }
  }

  /**
   * Get public URL for file
   */
  getPublicUrl(filePath: string, bucket: BucketType): string {
    const bucketName = UPLOAD_CONFIG.BUCKET[bucket];
    const { data } = this.supabaseService.storage
      .from(bucketName)
      .getPublicUrl(filePath);

    return data.publicUrl;
  }

  /**
   * Get signed URL for private file
   */
  async getSignedUrl(
    filePath: string,
    bucket: BucketType,
    expiresIn: number = 3600,
  ): Promise<string> {
    const bucketName = UPLOAD_CONFIG.BUCKET[bucket];
    const { data, error } = await this.supabaseService.storage
      .from(bucketName)
      .createSignedUrl(filePath, expiresIn);

    if (error) {
      throw new Error(`Failed to create signed URL: ${error.message}`);
    }

    return data.signedUrl;
  }
}
