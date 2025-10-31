import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { body, validationResult } from 'express-validator';
import db from '../config/database';
import { authMiddleware, AuthRequest } from '../middleware/auth';
import { logError, logWarning, logInfo } from '../utils/logger';

const router = Router();

// Login
router.post(
  '/login',
  [
    body('username').notEmpty().withMessage('Username is required'),
    body('password').notEmpty().withMessage('Password is required'),
  ],
  (req: Request, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { username, password } = req.body;

    try {
      const user = db.prepare('SELECT * FROM users WHERE username = ?').get(username) as any;

      if (!user || !bcrypt.compareSync(password, user.password)) {
        logWarning('auth.routes', `Failed login attempt for username: ${username}`, { username }, undefined, req.ip);
        return res.status(401).json({ error: 'Invalid credentials' });
      }

      const token = jwt.sign(
        { id: user.id, username: user.username, email: user.email, role: user.role },
        process.env.JWT_SECRET || 'secret',
        { expiresIn: '24h' }
      );

      logInfo('auth.routes', `User logged in successfully`, { username: user.username, role: user.role }, user.id, req.ip);

      res.json({
        token,
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          role: user.role,
          full_name: user.full_name,
          theme: user.theme || 'light',
        },
      });
    } catch (error) {
      logError('auth.routes', 'Login error', error, undefined, req.ip);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
);

// Get current user
router.get('/me', authMiddleware, (req: AuthRequest, res: Response) => {
  try {
    const user = db.prepare('SELECT id, username, email, role, theme, full_name FROM users WHERE id = ?').get(req.user!.id);
    res.json(user);
  } catch (error) {
    logError('auth.routes', 'Get user error', error, req.user?.id, req.ip);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
