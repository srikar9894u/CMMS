import path from 'path';
import fs from 'fs/promises';
import { v4 as uuidv4 } from 'uuid';

/**
 * File Upload Utilities
 *
 * Provides helper functions for file validation, naming, and management
 */

// Allowed file types
export const ALLOWED_IMAGE_TYPES = [
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/gif',
  'image/webp',
  'image/svg+xml'
];

export const ALLOWED_DOCUMENT_TYPES = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'text/plain',
  'text/csv'
];

export const ALLOWED_MIME_TYPES = [
  ...ALLOWED_IMAGE_TYPES,
  ...ALLOWED_DOCUMENT_TYPES
];

// File extension mapping
export const MIME_TO_EXTENSION: Record<string, string> = {
  'image/jpeg': '.jpg',
  'image/jpg': '.jpg',
  'image/png': '.png',
  'image/gif': '.gif',
  'image/webp': '.webp',
  'image/svg+xml': '.svg',
  'application/pdf': '.pdf',
  'application/msword': '.doc',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': '.docx',
  'application/vnd.ms-excel': '.xls',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': '.xlsx',
  'text/plain': '.txt',
  'text/csv': '.csv'
};

// Maximum file size (10MB)
export const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB in bytes

/**
 * Validate file type
 */
export const isValidFileType = (mimeType: string): boolean => {
  return ALLOWED_MIME_TYPES.includes(mimeType);
};

/**
 * Validate file size
 */
export const isValidFileSize = (fileSize: number): boolean => {
  return fileSize > 0 && fileSize <= MAX_FILE_SIZE;
};

/**
 * Get file category based on mime type
 */
export const getFileCategory = (mimeType: string): 'image' | 'document' => {
  if (ALLOWED_IMAGE_TYPES.includes(mimeType)) {
    return 'image';
  }
  return 'document';
};

/**
 * Generate unique filename
 * Format: uuid-timestamp.ext
 */
export const generateUniqueFilename = (originalFilename: string, mimeType: string): string => {
  const extension = MIME_TO_EXTENSION[mimeType] || path.extname(originalFilename);
  const uuid = uuidv4();
  const timestamp = Date.now();
  return `${uuid}-${timestamp}${extension}`;
};

/**
 * Sanitize filename by removing special characters
 */
export const sanitizeFilename = (filename: string): string => {
  // Remove path separators and special characters
  return filename
    .replace(/[/\\]/g, '')
    .replace(/[^a-zA-Z0-9._-]/g, '_')
    .substring(0, 255); // Limit length
};

/**
 * Get file extension from mime type
 */
export const getExtensionFromMimeType = (mimeType: string): string => {
  return MIME_TO_EXTENSION[mimeType] || '';
};

/**
 * Format file size for display
 */
export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
};

/**
 * Delete file from filesystem
 */
export const deleteFile = async (filePath: string): Promise<void> => {
  try {
    await fs.unlink(filePath);
  } catch (error: any) {
    if (error.code !== 'ENOENT') {
      // Only throw if error is not "file not found"
      throw error;
    }
  }
};

/**
 * Check if file exists
 */
export const fileExists = async (filePath: string): Promise<boolean> => {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
};

/**
 * Ensure upload directory exists
 */
export const ensureUploadDir = async (uploadPath: string): Promise<void> => {
  try {
    await fs.access(uploadPath);
  } catch {
    await fs.mkdir(uploadPath, { recursive: true });
  }
};

/**
 * Validate file upload
 * Returns validation error or null if valid
 */
export interface FileValidationResult {
  valid: boolean;
  error?: string;
}

export const validateFile = (file: Express.Multer.File): FileValidationResult => {
  // Check if file exists
  if (!file) {
    return { valid: false, error: 'No file uploaded' };
  }

  // Check file type
  if (!isValidFileType(file.mimetype)) {
    return {
      valid: false,
      error: `Invalid file type: ${file.mimetype}. Allowed types: images (JPG, PNG, GIF, WebP, SVG) and documents (PDF, DOC, DOCX, XLS, XLSX, TXT, CSV)`
    };
  }

  // Check file size
  if (!isValidFileSize(file.size)) {
    return {
      valid: false,
      error: `File size ${formatFileSize(file.size)} exceeds maximum allowed size of ${formatFileSize(MAX_FILE_SIZE)}`
    };
  }

  return { valid: true };
};

/**
 * Get upload directory path
 */
export const getUploadPath = (entityType: 'work_order' | 'asset' | 'inventory'): string => {
  const baseUploadPath = process.env.NODE_ENV === 'production'
    ? '/data/uploads'
    : path.join(__dirname, '../../uploads');

  return path.join(baseUploadPath, entityType);
};
