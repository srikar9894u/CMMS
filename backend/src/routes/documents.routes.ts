import { Router, Response } from 'express';
import { authMiddleware, AuthRequest, roleMiddleware } from '../middleware/auth';
import { uploadDocument } from '../middleware/upload';
import db from '../config/database';
import path from 'path';
import fs from 'fs';

const router = Router();

// Get uploads directory based on environment
const getUploadsDir = () => {
  return process.env.NODE_ENV === 'production'
    ? '/data/uploads'
    : path.join(__dirname, '../../uploads');
};

// Apply authentication middleware to all routes
router.use(authMiddleware);

// Get all documents with filtering
router.get('/', (req: AuthRequest, res: Response) => {
  try {
    const { category, asset_id, inventory_id, search } = req.query;

    let query = `
      SELECT d.*, u.username as uploaded_by_name
      FROM documents d
      LEFT JOIN users u ON d.uploaded_by = u.id
      WHERE 1=1
    `;
    const params: any[] = [];

    if (category) {
      query += ' AND d.category = ?';
      params.push(category);
    }

    if (asset_id) {
      query += ' AND d.asset_id = ?';
      params.push(asset_id);
    }

    if (inventory_id) {
      query += ' AND d.inventory_id = ?';
      params.push(inventory_id);
    }

    if (search) {
      query += ' AND (d.title LIKE ? OR d.description LIKE ? OR d.tags LIKE ?)';
      const searchTerm = `%${search}%`;
      params.push(searchTerm, searchTerm, searchTerm);
    }

    query += ' ORDER BY d.created_at DESC';

    const documents = db.prepare(query).all(...params);

    res.json(documents);
  } catch (error: any) {
    console.error('Error fetching documents:', error);
    res.status(500).json({ error: 'Failed to fetch documents' });
  }
});

// Get single document by ID
router.get('/:id', (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    const document = db.prepare(`
      SELECT d.*, u.username as uploaded_by_name
      FROM documents d
      LEFT JOIN users u ON d.uploaded_by = u.id
      WHERE d.id = ?
    `).get(id);

    if (!document) {
      return res.status(404).json({ error: 'Document not found' });
    }

    res.json(document);
  } catch (error: any) {
    console.error('Error fetching document:', error);
    res.status(500).json({ error: 'Failed to fetch document' });
  }
});

// Upload document
router.post('/upload', uploadDocument.single('file'), (req: AuthRequest, res: Response) => {
  try {
    const { title, description, category, asset_id, inventory_id, tags } = req.body;

    if (!title || !category) {
      // Delete uploaded file if validation fails
      if (req.file) {
        const filePath = path.join(getUploadsDir(), req.file.filename);
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
        }
      }
      return res.status(400).json({ error: 'Title and category are required' });
    }

    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const filePath = `/uploads/${req.file.filename}`;
    const fileType = req.file.mimetype;
    const fileSize = req.file.size;

    const result = db.prepare(`
      INSERT INTO documents (
        title, description, category, file_path, file_type, file_size,
        original_filename, asset_id, inventory_id, tags, uploaded_by
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      title,
      description || null,
      category,
      filePath,
      fileType,
      fileSize,
      req.file.originalname,
      asset_id || null,
      inventory_id || null,
      tags || null,
      req.user?.id
    );

    // Log the action
    db.prepare(`
      INSERT INTO application_logs (log_level, source, message, user_id, ip_address)
      VALUES (?, ?, ?, ?, ?)
    `).run(
      'INFO',
      'documents',
      `Document uploaded: ${title} (${req.file.originalname})`,
      req.user?.id,
      req.ip
    );

    res.json({
      id: result.lastInsertRowid,
      message: 'Document uploaded successfully',
      file: {
        path: filePath,
        filename: req.file.filename,
        originalname: req.file.originalname,
        size: fileSize
      }
    });
  } catch (error: any) {
    console.error('Error uploading document:', error);

    // Delete uploaded file if database insert failed
    if (req.file) {
      const filePath = path.join(getUploadsDir(), req.file.filename);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    }

    res.status(500).json({ error: 'Failed to upload document' });
  }
});

// Create web link document
router.post('/link', (req: AuthRequest, res: Response) => {
  try {
    const { title, description, category, url, asset_id, inventory_id, tags } = req.body;

    if (!title || !category || !url) {
      return res.status(400).json({ error: 'Title, category, and URL are required' });
    }

    // Validate URL format
    try {
      new URL(url);
    } catch {
      return res.status(400).json({ error: 'Invalid URL format' });
    }

    const result = db.prepare(`
      INSERT INTO documents (
        title, description, category, external_url, file_type,
        asset_id, inventory_id, tags, uploaded_by
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      title,
      description || null,
      category,
      url,
      'application/url',
      asset_id || null,
      inventory_id || null,
      tags || null,
      req.user?.id
    );

    // Log the action
    db.prepare(`
      INSERT INTO application_logs (log_level, source, message, user_id, ip_address)
      VALUES (?, ?, ?, ?, ?)
    `).run(
      'INFO',
      'documents',
      `Web link added: ${title} (${url})`,
      req.user?.id,
      req.ip
    );

    res.json({
      id: result.lastInsertRowid,
      message: 'Link added successfully'
    });
  } catch (error: any) {
    console.error('Error adding link:', error);
    res.status(500).json({ error: 'Failed to add link' });
  }
});

// Update document metadata
router.put('/:id', (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { title, description, category, tags, asset_id, inventory_id } = req.body;

    const document = db.prepare('SELECT * FROM documents WHERE id = ?').get(id);

    if (!document) {
      return res.status(404).json({ error: 'Document not found' });
    }

    // Only admin or uploader can update
    if (req.user?.role !== 'admin' && req.user?.id !== (document as any).uploaded_by) {
      return res.status(403).json({ error: 'Permission denied' });
    }

    db.prepare(`
      UPDATE documents
      SET title = ?, description = ?, category = ?, tags = ?,
          asset_id = ?, inventory_id = ?, updated_at = datetime('now')
      WHERE id = ?
    `).run(title, description, category, tags, asset_id || null, inventory_id || null, id);

    // Log the action
    db.prepare(`
      INSERT INTO application_logs (log_level, source, message, user_id, ip_address)
      VALUES (?, ?, ?, ?, ?)
    `).run(
      'INFO',
      'documents',
      `Document updated: ${title}`,
      req.user?.id,
      req.ip
    );

    res.json({ message: 'Document updated successfully' });
  } catch (error: any) {
    console.error('Error updating document:', error);
    res.status(500).json({ error: 'Failed to update document' });
  }
});

// Download document
router.get('/:id/download', (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    const document = db.prepare('SELECT * FROM documents WHERE id = ?').get(id) as any;

    if (!document) {
      return res.status(404).json({ error: 'Document not found' });
    }

    // If it's a web link, return the URL
    if (document.external_url) {
      return res.json({ url: document.external_url, type: 'external' });
    }

    // For file uploads, send the file
    if (!document.file_path) {
      return res.status(404).json({ error: 'File not found' });
    }

    const filename = path.basename(document.file_path);
    const filePath = path.join(getUploadsDir(), filename);

    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ error: 'File not found on server' });
    }

    // Increment download count
    db.prepare('UPDATE documents SET download_count = download_count + 1 WHERE id = ?').run(id);

    // Send file
    res.download(filePath, document.original_filename || 'download');
  } catch (error: any) {
    console.error('Error downloading document:', error);
    res.status(500).json({ error: 'Failed to download document' });
  }
});

// Delete document
router.delete('/:id', (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    const document = db.prepare('SELECT * FROM documents WHERE id = ?').get(id) as any;

    if (!document) {
      return res.status(404).json({ error: 'Document not found' });
    }

    // Only admin or uploader can delete
    if (req.user?.role !== 'admin' && req.user?.id !== document.uploaded_by) {
      return res.status(403).json({ error: 'Permission denied' });
    }

    // Delete physical file if it exists
    if (document.file_path) {
      const filename = path.basename(document.file_path);
      const filePath = path.join(getUploadsDir(), filename);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    }

    // Delete from database
    db.prepare('DELETE FROM documents WHERE id = ?').run(id);

    // Log the action
    db.prepare(`
      INSERT INTO application_logs (log_level, source, message, user_id, ip_address)
      VALUES (?, ?, ?, ?, ?)
    `).run(
      'INFO',
      'documents',
      `Document deleted: ${document.title}`,
      req.user?.id,
      req.ip
    );

    res.json({ message: 'Document deleted successfully' });
  } catch (error: any) {
    console.error('Error deleting document:', error);
    res.status(500).json({ error: 'Failed to delete document' });
  }
});

// Get document categories
router.get('/meta/categories', (req: AuthRequest, res: Response) => {
  try {
    const categories = [
      { value: 'manual', label: 'Manual' },
      { value: 'drawing', label: 'Drawing' },
      { value: 'specification', label: 'Specification' },
      { value: 'report', label: 'Report' },
      { value: 'procedure', label: 'Procedure' },
      { value: 'link', label: 'External Link' },
      { value: 'other', label: 'Other' }
    ];

    res.json(categories);
  } catch (error: any) {
    console.error('Error fetching categories:', error);
    res.status(500).json({ error: 'Failed to fetch categories' });
  }
});

// Get document statistics
router.get('/meta/stats', (req: AuthRequest, res: Response) => {
  try {
    const stats = {
      total: db.prepare('SELECT COUNT(*) as count FROM documents').get() as any,
      by_category: db.prepare(`
        SELECT category, COUNT(*) as count
        FROM documents
        GROUP BY category
      `).all(),
      total_size: db.prepare('SELECT SUM(file_size) as size FROM documents').get() as any,
      recent: db.prepare(`
        SELECT * FROM documents
        ORDER BY created_at DESC
        LIMIT 5
      `).all()
    };

    res.json(stats);
  } catch (error: any) {
    console.error('Error fetching document stats:', error);
    res.status(500).json({ error: 'Failed to fetch document statistics' });
  }
});

export default router;
