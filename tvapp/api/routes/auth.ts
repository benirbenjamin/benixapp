import { Router, Response } from 'express';
import bcrypt from 'bcryptjs';
import { query } from '../db/pool.js';
import { AuthenticatedRequest, generateToken, requireAuth } from '../middleware/auth.js';

const router = Router();

// POST /api/auth/login
router.post('/login', async (req, res: Response): Promise<void> => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      res.status(400).json({ error: 'Email and password are required.' });
      return;
    }

    const userResult = await query(
      `SELECT id, email, password_hash, full_name, role, is_active FROM users WHERE LOWER(email) = LOWER($1);`,
      [email.trim()]
    );

    if (userResult.rows.length === 0) {
      res.status(401).json({ error: 'Invalid email or password.' });
      return;
    }

    const user = userResult.rows[0];

    if (!user.is_active) {
      res.status(403).json({ error: 'This admin account has been deactivated. Please contact Super Administrator.' });
      return;
    }

    const isMatch = bcrypt.compareSync(password, user.password_hash);
    if (!isMatch) {
      res.status(401).json({ error: 'Invalid email or password.' });
      return;
    }

    const token = generateToken({
      id: user.id,
      email: user.email,
      full_name: user.full_name,
      role: user.role,
    });

    res.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        full_name: user.full_name,
        role: user.role,
      },
    });
  } catch (err: any) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'An unexpected server error occurred during login.' });
  }
});

// GET /api/auth/me
router.get('/me', requireAuth, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const userResult = await query(
      `SELECT id, email, full_name, role, is_active, created_at FROM users WHERE id = $1;`,
      [req.user!.id]
    );

    if (userResult.rows.length === 0 || !userResult.rows[0].is_active) {
      res.status(401).json({ error: 'User not found or deactivated.' });
      return;
    }

    res.json({ user: userResult.rows[0] });
  } catch (err: any) {
    console.error('Auth verification error:', err);
    res.status(500).json({ error: 'Failed to verify user session.' });
  }
});

// PUT /api/auth/profile (update full name)
router.put('/profile', requireAuth, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { full_name } = req.body;
    if (!full_name || full_name.trim().length === 0) {
      res.status(400).json({ error: 'Full name is required.' });
      return;
    }

    const result = await query(
      `UPDATE users SET full_name = $1, updated_at = NOW() WHERE id = $2 RETURNING id, email, full_name, role;`,
      [full_name.trim(), req.user!.id]
    );

    res.json({ message: 'Profile updated successfully.', user: result.rows[0] });
  } catch (err: any) {
    console.error('Update profile error:', err);
    res.status(500).json({ error: 'Failed to update profile.' });
  }
});

// POST /api/auth/change-password
router.post('/change-password', requireAuth, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { current_password, new_password } = req.body;

    if (!current_password || !new_password || new_password.length < 6) {
      res.status(400).json({ error: 'Password must be at least 6 characters.' });
      return;
    }

    const userResult = await query(`SELECT password_hash FROM users WHERE id = $1;`, [req.user!.id]);
    if (userResult.rows.length === 0) {
      res.status(404).json({ error: 'User not found.' });
      return;
    }

    const isMatch = bcrypt.compareSync(current_password, userResult.rows[0].password_hash);
    if (!isMatch) {
      res.status(400).json({ error: 'Current password is incorrect.' });
      return;
    }

    const newHash = bcrypt.hashSync(new_password, 10);
    await query(`UPDATE users SET password_hash = $1, updated_at = NOW() WHERE id = $2;`, [newHash, req.user!.id]);

    res.json({ message: 'Password updated successfully.' });
  } catch (err: any) {
    console.error('Change password error:', err);
    res.status(500).json({ error: 'Failed to change password.' });
  }
});

// POST /api/auth/logout
router.post('/logout', (_req, res: Response) => {
  res.json({ message: 'Logged out successfully.' });
});

export default router;
