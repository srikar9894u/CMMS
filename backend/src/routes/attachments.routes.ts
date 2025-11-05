import { Router } from 'express';
import { authMiddleware } from '../middleware/auth';
import { uploadMultiple } from '../middleware/upload.middleware';
import {
  uploadFiles,
  getAttachments,
  getAttachment,
  downloadAttachment,
  viewAttachment,
  deleteAttachment,
  getAttachmentCount
} from '../controllers/attachments.controller';

const router = Router();

// All routes require authentication
router.use(authMiddleware);

// Upload files (supports multiple files)
router.post('/upload', uploadMultiple, uploadFiles);

// Get attachments for an entity
router.get('/', getAttachments);

// Get attachment count
router.get('/count', getAttachmentCount);

// Get single attachment details
router.get('/:id', getAttachment);

// Download attachment
router.get('/:id/download', downloadAttachment);

// View attachment (stream)
router.get('/:id/view', viewAttachment);

// Delete attachment
router.delete('/:id', deleteAttachment);

export default router;
