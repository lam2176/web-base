import { UPLOAD_CONFIG } from '../constants/upload';

export class MediaUrlUtil {
  /**
   * Generate public URL for a media file
   * @param filepath - The file path stored in database
   * @param bucketType - Storage bucket type ('PUBLIC' or 'PRIVATE', default: 'PUBLIC')
   * @returns Full public URL
   */
  static getPublicUrl(filepath: string, bucketType: 'PUBLIC' | 'PRIVATE' = 'PUBLIC'): string {
    if (!filepath) return '';

    const supabaseUrl = process.env.SUPABASE_URL || '';

    if (!supabaseUrl) {
      // Fallback for development
      return `/${filepath}`;
    }

    // Map bucket type to actual bucket name
    const bucketName = UPLOAD_CONFIG.BUCKET[bucketType];

    return `${supabaseUrl}/storage/v1/object/public/${bucketName}/${filepath}`;
  }

  /**
   * Add URL field to media object
   * @param media - Media object with filepath
   * @param bucket - Storage bucket type ('PUBLIC' or 'PRIVATE')
   * @returns Media object with url field added
   */
  static addUrl(media: any, bucket: 'PUBLIC' | 'PRIVATE' = 'PUBLIC'): any {
    if (!media) return media;

    return {
      ...media,
      url: this.getPublicUrl(media.filepath, bucket),
    };
  }

  /**
   * Add URL field to array of media objects
   * @param mediaArray - Array of media objects
   * @param bucket - Storage bucket type ('PUBLIC' or 'PRIVATE')
   * @returns Array with url field added to each object
   */
  static addUrlsToArray(mediaArray: any[], bucket: 'PUBLIC' | 'PRIVATE' = 'PUBLIC'): any[] {
    if (!Array.isArray(mediaArray)) return mediaArray;

    return mediaArray.map(media => this.addUrl(media, bucket));
  }
}
