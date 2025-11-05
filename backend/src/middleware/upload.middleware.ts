import multer from 'multer';
import path from 'path';
import { Request } from 'express';
import { generateUniqueFilename, getUploadPath, ensureUploadDir } from '../utils/file.utils';

/**
 * Multer Upload Middleware
 *
 * Handles file uploads with validation and storage configuration
 */

// Configure storage
const storage = multer.diskStorage({
  destination: async (req: Request, file: Express.Multer.File, cb) => {
    try {
      // Get entity type from request body
      const entityType = req.body.entity_type as 'work_order' | 'asset' | 'inventory';

      if (!entityType) {
        return cb(new Error('entity_type is required'), '');
      }

      // Get upload path for this entity type
      const uploadPath = getUploadPath(entityType);

      // Ensure directory exists
      await ensureUploadDir(uploadPath);

      cb(null, uploadPath);
    } catch (error: any) {
      cb(error, '');
    }
  },
  filename: (req: Request, file: Express.Multer.File, cb) => {
    // Generate unique filename
    const uniqueFilename = generateUniqueFilename(file.originalname, file.mimetype);
    cb(null, uniqueFilename);
  }
});

// File filter for validation
const fileFilter = (req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  // Allowed MIME types
  const allowedMimeTypes = [
    // Images
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/gif',
    'image/webp',
    'image/svg+xml',
    // Documents
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'text/plain',
    'text/csv'
  ];

  if (allowedMimeTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error(`Invalid file type: ${file.mimetype}. Allowed types: images (JPG, PNG, GIF, WebP, SVG) and documents (PDF, DOC, DOCX, XLS, XLSX, TXT, CSV)`));
  }
};

// Multer configuration
const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB max file size
    files: 10 // Max 10 files at once
  }
});

// Export middleware for single file upload
export const uploadSingle = upload.single('file');

// Export middleware for multiple files upload
export const uploadMultiple = upload.array('files', 10);

// Export upload instance for custom configurations
export default upload;
