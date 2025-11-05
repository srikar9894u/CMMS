import { Request, Response } from 'express';
import path from 'path';
import db from '../config/database';
import { AuthRequest } from '../middleware/auth';
import { deleteFile, getFileCategory, getUploadPath } from '../utils/file.utils';

/**
 * Upload files
 * POST /api/attachments/upload
 */
export const uploadFiles = async (req: AuthRequest, res: Response) => {
  try {
    const { entity_type, entity_id } = req.body;
    const files = req.files as Express.Multer.File[];

    if (!files || files.length === 0) {
      return res.status(400).json({ error: 'No files uploaded' });
    }

    if (!entity_type || !entity_id) {
      return res.status(400).json({ error: 'entity_type and entity_id are required' });
    }

    // Validate entity type
    if (!['work_order', 'asset', 'inventory'].includes(entity_type)) {
      return res.status(400).json({ error: 'Invalid entity_type. Must be work_order, asset, or inventory' });
    }

    const uploadedAttachments = [];

    // Insert each file into database
    for (const file of files) {
      const fileCategory = getFileCategory(file.mimetype);

      // Determine which foreign key to use
      const foreignKeys: any = {
        work_order_id: entity_type === 'work_order' ? parseInt(entity_id) : null,
        asset_id: entity_type === 'asset' ? parseInt(entity_id) : null,
        inventory_item_id: entity_type === 'inventory' ? parseInt(entity_id) : null
      };

      const result = db.prepare(`
        INSERT INTO attachments (
          work_order_id, asset_id, inventory_item_id, entity_type,
          filename, original_filename, file_path, file_size, file_type, mime_type, uploaded_by
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        foreignKeys.work_order_id,
        foreignKeys.asset_id,
        foreignKeys.inventory_item_id,
        entity_type,
        file.filename,
        file.originalname,
        file.path,
        file.size,
        fileCategory,
        file.mimetype,
        req.user!.id
      );

      uploadedAttachments.push({
        id: result.lastInsertRowid,
        filename: file.filename,
        original_filename: file.originalname,
        file_size: file.size,
        file_type: fileCategory,
        mime_type: file.mimetype
      });
    }

    res.status(201).json({
      success: true,
      message: `${files.length} file(s) uploaded successfully`,
      data: uploadedAttachments
    });
  } catch (error: any) {
    console.error('Upload files error:', error);
    res.status(500).json({ error: 'Failed to upload files', message: error.message });
  }
};

/**
 * Get attachments for an entity
 * GET /api/attachments?entity_type=work_order&entity_id=1
 */
export const getAttachments = async (req: Request, res: Response) => {
  try {
    const { entity_type, entity_id } = req.query;

    if (!entity_type || !entity_id) {
      return res.status(400).json({ error: 'entity_type and entity_id are required' });
    }

    let query = 'SELECT a.*, u.full_name as uploaded_by_name FROM attachments a LEFT JOIN users u ON a.uploaded_by = u.id WHERE';

    const params: any[] = [];

    if (entity_type === 'work_order') {
      query += ' a.work_order_id = ?';
      params.push(parseInt(entity_id as string));
    } else if (entity_type === 'asset') {
      query += ' a.asset_id = ?';
      params.push(parseInt(entity_id as string));
    } else if (entity_type === 'inventory') {
      query += ' a.inventory_item_id = ?';
      params.push(parseInt(entity_id as string));
    } else {
      return res.status(400).json({ error: 'Invalid entity_type' });
    }

    query += ' ORDER BY a.created_at DESC';

    const attachments = db.prepare(query).all(...params);

    res.json({
      success: true,
      data: attachments
    });
  } catch (error: any) {
    console.error('Get attachments error:', error);
    res.status(500).json({ error: 'Failed to get attachments' });
  }
};

/**
 * Get single attachment
 * GET /api/attachments/:id
 */
export const getAttachment = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const attachment = db.prepare(`
      SELECT a.*, u.full_name as uploaded_by_name
      FROM attachments a
      LEFT JOIN users u ON a.uploaded_by = u.id
      WHERE a.id = ?
    `).get(id);

    if (!attachment) {
      return res.status(404).json({ error: 'Attachment not found' });
    }

    res.json({
      success: true,
      data: attachment
    });
  } catch (error: any) {
    console.error('Get attachment error:', error);
    res.status(500).json({ error: 'Failed to get attachment' });
  }
};

/**
 * Download attachment
 * GET /api/attachments/:id/download
 */
export const downloadAttachment = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const attachment = db.prepare('SELECT * FROM attachments WHERE id = ?').get(id) as any;

    if (!attachment) {
      return res.status(404).json({ error: 'Attachment not found' });
    }

    // Send file for download
    res.download(attachment.file_path, attachment.original_filename, (err) => {
      if (err) {
        console.error('Download error:', err);
        if (!res.headersSent) {
          res.status(500).json({ error: 'Failed to download file' });
        }
      }
    });
  } catch (error: any) {
    console.error('Download attachment error:', error);
    res.status(500).json({ error: 'Failed to download attachment' });
  }
};

/**
 * View attachment (stream file)
 * GET /api/attachments/:id/view
 */
export const viewAttachment = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const attachment = db.prepare('SELECT * FROM attachments WHERE id = ?').get(id) as any;

    if (!attachment) {
      return res.status(404).json({ error: 'Attachment not found' });
    }

    // Set content type
    res.contentType(attachment.mime_type);

    // Send file for viewing
    res.sendFile(attachment.file_path, (err) => {
      if (err) {
        console.error('View error:', err);
        if (!res.headersSent) {
          res.status(500).json({ error: 'Failed to view file' });
        }
      }
    });
  } catch (error: any) {
    console.error('View attachment error:', error);
    res.status(500).json({ error: 'Failed to view attachment' });
  }
};

/**
 * Delete attachment
 * DELETE /api/attachments/:id
 */
export const deleteAttachment = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    const attachment = db.prepare('SELECT * FROM attachments WHERE id = ?').get(id) as any;

    if (!attachment) {
      return res.status(404).json({ error: 'Attachment not found' });
    }

    // Check permissions: user can delete their own attachments, or admin/manager can delete any
    const isOwner = attachment.uploaded_by === req.user!.id;
    const isAdminOrManager = req.user!.role === 'admin' || req.user!.role === 'manager';

    if (!isOwner && !isAdminOrManager) {
      return res.status(403).json({ error: 'You do not have permission to delete this attachment' });
    }

    // Delete file from filesystem
    await deleteFile(attachment.file_path);

    // Delete from database
    db.prepare('DELETE FROM attachments WHERE id = ?').run(id);

    res.json({
      success: true,
      message: 'Attachment deleted successfully'
    });
  } catch (error: any) {
    console.error('Delete attachment error:', error);
    res.status(500).json({ error: 'Failed to delete attachment' });
  }
};

/**
 * Get attachment count for an entity
 * GET /api/attachments/count?entity_type=work_order&entity_id=1
 */
export const getAttachmentCount = async (req: Request, res: Response) => {
  try {
    const { entity_type, entity_id } = req.query;

    if (!entity_type || !entity_id) {
      return res.status(400).json({ error: 'entity_type and entity_id are required' });
    }

    let query = 'SELECT COUNT(*) as count FROM attachments WHERE';
    const params: any[] = [];

    if (entity_type === 'work_order') {
      query += ' work_order_id = ?';
      params.push(parseInt(entity_id as string));
    } else if (entity_type === 'asset') {
      query += ' asset_id = ?';
      params.push(parseInt(entity_id as string));
    } else if (entity_type === 'inventory') {
      query += ' inventory_item_id = ?';
      params.push(parseInt(entity_id as string));
    } else {
      return res.status(400).json({ error: 'Invalid entity_type' });
    }

    const result = db.prepare(query).get(...params) as any;

    res.json({
      success: true,
      count: result.count
    });
  } catch (error: any) {
    console.error('Get attachment count error:', error);
    res.status(500).json({ error: 'Failed to get attachment count' });
  }
};
