import { Router, Response } from 'express';
import { authMiddleware, AuthRequest, roleMiddleware } from '../middleware/auth';
import { uploadImage } from '../middleware/upload';
import db from '../config/database';
import path from 'path';
import fs from 'fs';

const router = Router();

// Apply authentication middleware to all routes
router.use(authMiddleware);

// Upload company logo (admin only)
router.post('/logo', roleMiddleware('admin'), uploadImage.single('logo'), (req: AuthRequest, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const logoPath = `/uploads/${req.file.filename}`;

    // Get old logo path to delete it
    const oldSetting = db.prepare('SELECT setting_value FROM system_settings WHERE setting_key = ?').get('company_logo') as any;

    // Update system settings
    db.prepare(`
      UPDATE system_settings
      SET setting_value = ?, updated_at = datetime('now'), updated_by = ?
      WHERE setting_key = ?
    `).run(logoPath, req.user?.id, 'company_logo');

    // Delete old logo file if exists
    if (oldSetting?.setting_value) {
      const oldFilePath = path.join(__dirname, '../../', oldSetting.setting_value);
      if (fs.existsSync(oldFilePath)) {
        fs.unlinkSync(oldFilePath);
      }
    }

    // Log the action
    db.prepare(`
      INSERT INTO application_logs (log_level, source, message, user_id, ip_address)
      VALUES (?, ?, ?, ?, ?)
    `).run('INFO', 'uploads', `Company logo updated: ${logoPath}`, req.user?.id, req.ip);

    res.json({
      success: true,
      path: logoPath,
      filename: req.file.filename,
      message: 'Logo uploaded successfully'
    });
  } catch (error: any) {
    console.error('Error uploading logo:', error);

    // Delete uploaded file if database update failed
    if (req.file) {
      const filePath = path.join(__dirname, '../../uploads', req.file.filename);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    }

    res.status(500).json({ error: 'Failed to upload logo' });
  }
});

// Delete company logo (admin only)
router.delete('/logo', roleMiddleware('admin'), (req: AuthRequest, res: Response) => {
  try {
    // Get current logo path
    const setting = db.prepare('SELECT setting_value FROM system_settings WHERE setting_key = ?').get('company_logo') as any;

    if (!setting?.setting_value) {
      return res.status(404).json({ error: 'No logo to delete' });
    }

    // Delete file
    const filePath = path.join(__dirname, '../../', setting.setting_value);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }

    // Update database
    db.prepare(`
      UPDATE system_settings
      SET setting_value = NULL, updated_at = datetime('now'), updated_by = ?
      WHERE setting_key = ?
    `).run(req.user?.id, 'company_logo');

    // Log the action
    db.prepare(`
      INSERT INTO application_logs (log_level, source, message, user_id, ip_address)
      VALUES (?, ?, ?, ?, ?)
    `).run('INFO', 'uploads', 'Company logo deleted', req.user?.id, req.ip);

    res.json({ success: true, message: 'Logo deleted successfully' });
  } catch (error: any) {
    console.error('Error deleting logo:', error);
    res.status(500).json({ error: 'Failed to delete logo' });
  }
});

export default router;
