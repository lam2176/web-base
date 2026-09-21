export const UPLOAD_CONFIG = {
  MAX_FILE_SIZE: {
    IMAGE: 5 * 1024 * 1024, // 5MB
    DOCUMENT: 10 * 1024 * 1024, // 10MB
    VIDEO: 50 * 1024 * 1024, // 50MB
    AUDIO: 10 * 1024 * 1024, // 10MB
  },

  ALLOWED_MIME_TYPES: {
    IMAGE: [
      'image/jpeg',
      'image/jpg',
      'image/png',
      'image/gif',
      'image/webp',
      'image/svg+xml',
    ],
    DOCUMENT: [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'text/plain',
    ],
    VIDEO: [
      'video/mp4',
      'video/mpeg',
      'video/quicktime',
      'video/x-msvideo',
      'video/webm',
    ],
    AUDIO: ['audio/mpeg', 'audio/wav', 'audio/ogg', 'audio/webm'],
  },

  ALLOWED_EXTENSIONS: {
    IMAGE: ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg'],
    DOCUMENT: ['.pdf', '.doc', '.docx', '.xls', '.xlsx', '.txt'],
    VIDEO: ['.mp4', '.mpeg', '.mov', '.avi', '.webm'],
    AUDIO: ['.mp3', '.wav', '.ogg', '.webm'],
  },

  BUCKET: {
    PUBLIC: 'public-storage',
    PRIVATE: 'private-storage',
  },

  FOLDERS: {
    // Public folders
    PRODUCT_IMAGES: 'products',
    CATEGORY_IMAGES: 'categories',
    BANNER_IMAGES: 'banners',
    PAGE_IMAGES: 'pages',

    // Private folders (future use)
    USER_DOCUMENTS: 'user-documents',
    TEMP: 'temp',
  },

  TEMP_FILE_EXPIRY: 24 * 60 * 60 * 1000, // 24 hours
};

export type FileCategory = 'IMAGE' | 'DOCUMENT' | 'VIDEO' | 'AUDIO';
export type BucketType = 'PUBLIC' | 'PRIVATE';
