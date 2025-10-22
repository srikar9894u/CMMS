import { Router, Response } from 'express';
import bcrypt from 'bcryptjs';
import { body, validationResult } from 'express-validator';
import db from '../config/database';
import { authMiddleware, roleMiddleware, AuthRequest } from '../middleware/auth';

const router = Router();

// All user routes require authentication
router.use(authMiddleware);

// Get all users (admin/manager only)
router.get('/', roleMiddleware('admin', 'manager'), (req: AuthRequest, res: Response) => {
  try {
    const users = db.prepare('SELECT id, username, email, role, full_name, created_at FROM users').all();
    res.json(users);
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get user by ID
router.get('/:id', (req: AuthRequest, res: Response) => {
  try {
    const user = db.prepare('SELECT id, username, email, role, full_name, created_at FROM users WHERE id = ?').get(req.params.id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.json(user);
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Create user (admin only)
router.post(
  '/',
  roleMiddleware('admin'),
  [
    body('username').notEmpty().withMessage('Username is required'),
    body('email').isEmail().withMessage('Valid email is required'),
    body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
    body('role').isIn(['admin', 'manager', 'technician', 'viewer']).withMessage('Invalid role'),
  ],
  (req: AuthRequest, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { username, email, password, role, full_name } = req.body;

    try {
      const hashedPassword = bcrypt.hashSync(password, 10);
      const result = db.prepare(`
        INSERT INTO users (username, email, password, role, full_name)
        VALUES (?, ?, ?, ?, ?)
      `).run(username, email, hashedPassword, role, full_name || null);

      res.status(201).json({ id: result.lastInsertRowid, message: 'User created successfully' });
    } catch (error: any) {
      if (error.message.includes('UNIQUE constraint failed')) {
        return res.status(400).json({ error: 'Username or email already exists' });
      }
      console.error('Create user error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
);

// Update user (admin or own profile)
router.put('/:id', (req: AuthRequest, res: Response) => {
  const userId = parseInt(req.params.id);

  // Check if user can update this profile
  if (req.user!.role !== 'admin' && req.user!.id !== userId) {
    return res.status(403).json({ error: 'Insufficient permissions' });
  }

  const { email, full_name, password } = req.body;

  try {
    const updates: string[] = [];
    const values: any[] = [];

    if (email) {
      updates.push('email = ?');
      values.push(email);
    }
    if (full_name) {
      updates.push('full_name = ?');
      values.push(full_name);
    }
    if (password) {
      updates.push('password = ?');
      values.push(bcrypt.hashSync(password, 10));
    }

    if (updates.length === 0) {
      return res.status(400).json({ error: 'No fields to update' });
    }

    updates.push('updated_at = CURRENT_TIMESTAMP');
    values.push(userId);

    db.prepare(`UPDATE users SET ${updates.join(', ')} WHERE id = ?`).run(...values);
    res.json({ message: 'User updated successfully' });
  } catch (error) {
    console.error('Update user error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Delete user (admin only)
router.delete('/:id', roleMiddleware('admin'), (req: AuthRequest, res: Response) => {
  try {
    db.prepare('DELETE FROM users WHERE id = ?').run(req.params.id);
    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
