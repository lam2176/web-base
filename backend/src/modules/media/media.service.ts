import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { eq, desc } from 'drizzle-orm';
import * as sharp from 'sharp';
import { db } from '@/db';
import { media } from '@/db/schema';
import { MediaResponseDto } from './dto/media-response.dto';
import { UpdateMediaDto } from './dto/update-media.dto';
import {
  UploadService,
  LoggerService,
  I18nService,
  UploadedFileInfo,
} from '@shared';

@Injectable()
export class MediaService {
  constructor(
    private readonly uploadService: UploadService,
    private readonly logger: LoggerService,
    private readonly i18n: I18nService,
  ) {}

  async uploadFile(file: Express.Multer.File): Promise<MediaResponseDto> {
    this.logger.log('Upload file attempt', 'MediaService');

    // Validate file
    if (!file) {
      this.logger.warn('Upload failed: No file provided', 'MediaService');
      throw new BadRequestException(this.i18n.t('upload.noFile'));
    }

    try {
      // Optimize image using sharp before upload
      let processedBuffer = file.buffer;

      if (file.mimetype.startsWith('image/')) {
        this.logger.log('Optimizing image...', 'MediaService');

        processedBuffer = await sharp(file.buffer)
          .resize(1920, 1920, {
            fit: 'inside',
            withoutEnlargement: true,
          })
          .jpeg({ quality: 85 })
          .png({ quality: 85 })
          .webp({ quality: 85 })
          .toBuffer();
      }

      // Prepare file info for upload service
      const fileInfo: UploadedFileInfo = {
        originalName: file.originalname,
        fileName: file.filename || file.originalname,
        mimeType: file.mimetype,
        size: processedBuffer.length,
        buffer: processedBuffer,
      };

      // Upload to Supabase
      const uploadResult = await this.uploadService.uploadFile(fileInfo, {
        bucket: 'PUBLIC',
        folder: 'media',
        category: 'IMAGE',
      });

      if (!uploadResult.success) {
        this.logger.error(
          `Upload failed: ${uploadResult.error}`,
          null,
          'MediaService',
        );
        throw new BadRequestException(
          uploadResult.error || this.i18n.t('upload.uploadFailed'),
        );
      }

      // Save to database
      const [newMedia] = await db
        .insert(media)
        .values({
          filename: file.originalname,
          filepath: uploadResult.filePath,
          mimetype: uploadResult.mimeType,
          size: uploadResult.fileSize,
        })
        .returning();

      this.logger.log(
        `File uploaded successfully: ${uploadResult.filePath}`,
        'MediaService',
      );

      return this.toResponseDto(newMedia, uploadResult.fileUrl);
    } catch (error) {
      this.logger.error(
        `Failed to upload file: ${error.message}`,
        error.stack,
        'MediaService',
      );
      throw error;
    }
  }

  async findAll(): Promise<MediaResponseDto[]> {
    this.logger.log('Fetching all media', 'MediaService');

    const allMedia = await db
      .select()
      .from(media)
      .orderBy(desc(media.updatedAt));

    return allMedia.map((m) => {
      const url = this.uploadService.getPublicUrl(m.filepath, 'PUBLIC');
      return this.toResponseDto(m, url);
    });
  }

  async findById(id: number): Promise<MediaResponseDto> {
    this.logger.log(`Fetching media by id: ${id}`, 'MediaService');

    const mediaItem = await db.query.media.findFirst({
      where: eq(media.id, id),
    });

    if (!mediaItem) {
      this.logger.warn(`Media not found: ${id}`, 'MediaService');
      throw new NotFoundException('Media not found');
    }

    const url = this.uploadService.getPublicUrl(mediaItem.filepath, 'PUBLIC');
    return this.toResponseDto(mediaItem, url);
  }

  async update(id: number, updateDto: UpdateMediaDto): Promise<MediaResponseDto> {
    this.logger.log(`Updating media: ${id}`, 'MediaService');

    const mediaItem = await db.query.media.findFirst({
      where: eq(media.id, id),
    });

    if (!mediaItem) {
      this.logger.warn(`Update failed: Media not found - ${id}`, 'MediaService');
      throw new NotFoundException('Media not found');
    }

    try {
      const [updatedMedia] = await db
        .update(media)
        .set({
          name: updateDto.name,
          updatedAt: new Date(),
        })
        .where(eq(media.id, id))
        .returning();

      const url = this.uploadService.getPublicUrl(updatedMedia.filepath, 'PUBLIC');
      this.logger.log(`Media updated successfully: ${id}`, 'MediaService');

      return this.toResponseDto(updatedMedia, url);
    } catch (error) {
      this.logger.error(
        `Failed to update media: ${error.message}`,
        error.stack,
        'MediaService',
      );
      throw error;
    }
  }

  async delete(id: number): Promise<void> {
    this.logger.log(`Deleting media: ${id}`, 'MediaService');

    const mediaItem = await db.query.media.findFirst({
      where: eq(media.id, id),
    });

    if (!mediaItem) {
      this.logger.warn(`Delete failed: Media not found - ${id}`, 'MediaService');
      throw new NotFoundException('Media not found');
    }

    try {
      // Delete file from Supabase storage
      const deleteResult = await this.uploadService.deleteFile(
        mediaItem.filepath,
        'PUBLIC',
      );

      if (!deleteResult.success) {
        this.logger.warn(
          `Failed to delete file from storage: ${deleteResult.error}`,
          'MediaService',
        );
        // Continue to delete from database even if file deletion fails
      }

      // Delete from database
      await db.delete(media).where(eq(media.id, id));

      this.logger.log(`Media deleted successfully: ${id}`, 'MediaService');
    } catch (error) {
      this.logger.error(
        `Failed to delete media: ${error.message}`,
        error.stack,
        'MediaService',
      );
      throw error;
    }
  }

  private toResponseDto(mediaItem: any, url?: string): MediaResponseDto {
    return {
      id: mediaItem.id,
      name: mediaItem.name || null,
      filename: mediaItem.filename,
      filepath: mediaItem.filepath,
      mimetype: mediaItem.mimetype,
      size: mediaItem.size,
      url: url || `/${mediaItem.filepath}`,
      createdAt: mediaItem.createdAt,
      updatedAt: mediaItem.updatedAt,
    };
  }
}
