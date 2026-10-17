import { Router, Response } from 'express';
import bcrypt from 'bcryptjs';
import { query } from '../db/pool.js';
import { AuthenticatedRequest, requireSuperAdmin } from '../middleware/auth.js';

const router = Router();

// GET /api/admin/users (Super Admin only)
router.get('/', requireSuperAdmin, async (_req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const result = await query(
      `SELECT id, email, full_name, role, is_active, created_at, updated_at 
       FROM users 
       ORDER BY created_at ASC;`
    );
    res.json(result.rows);
  } catch (err: any) {
    console.error('Fetch users error:', err);
    res.status(500).json({ error: 'Failed to fetch users.' });
  }
});

// POST /api/admin/users (Super Admin only)
router.post('/', requireSuperAdmin, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { email, password, full_name, role } = req.body;

    if (!email || !password || !full_name) {
      res.status(400).json({ error: 'Email, password, and full name are required.' });
      return;
    }

    if (password.length < 6) {
      res.status(400).json({ error: 'Password must be at least 6 characters.' });
      return;
    }

    const passwordHash = bcrypt.hashSync(password, 10);
    const assignedRole = role === 'SUPER_ADMIN' ? 'SUPER_ADMIN' : 'ADMIN';

    const result = await query(
      `INSERT INTO users (email, password_hash, full_name, role, is_active)
       VALUES ($1, $2, $3, $4, true)
       RETURNING id, email, full_name, role, is_active, created_at;`,
      [email.toLowerCase().trim(), passwordHash, full_name.trim(), assignedRole]
    );

    res.status(201).json(result.rows[0]);
  } catch (err: any) {
    console.error('Create user error:', err);
    if (err.code === '23505') {
      res.status(400).json({ error: 'A user with this email address already exists.' });
      return;
    }
    res.status(500).json({ error: 'Failed to create user.' });
  }
});

// PUT /api/admin/users/:id (Super Admin only)
router.put('/:id', requireSuperAdmin, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { full_name, role, is_active, password } = req.body;

    // Prevent deactivating own account
    if (req.user?.id === id && is_active === false) {
      res.status(400).json({ error: 'You cannot deactivate your own super admin account.' });
      return;
    }

    let passwordHash: string | undefined;
    if (password && password.trim().length >= 6) {
      passwordHash = bcrypt.hashSync(password.trim(), 10);
    }

    const result = await query(
      `UPDATE users SET
        full_name = COALESCE($1, full_name),
        role = COALESCE($2, role),
        is_active = COALESCE($3, is_active),
        password_hash = COALESCE($4, password_hash),
        updated_at = NOW()
       WHERE id = $5
       RETURNING id, email, full_name, role, is_active, created_at, updated_at;`,
      [full_name, role, is_active, passwordHash, id]
    );

    if (result.rows.length === 0) {
      res.status(404).json({ error: 'User not found.' });
      return;
    }

    res.json(result.rows[0]);
  } catch (err: any) {
    console.error('Update user error:', err);
    res.status(500).json({ error: 'Failed to update user.' });
  }
});

// DELETE /api/admin/users/:id (Super Admin only)
router.delete('/:id', requireSuperAdmin, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    if (req.user?.id === id) {
      res.status(400).json({ error: 'You cannot delete your own account.' });
      return;
    }

    const result = await query(`DELETE FROM users WHERE id = $1 RETURNING id;`, [id]);
    if (result.rows.length === 0) {
      res.status(404).json({ error: 'User not found.' });
      return;
    }

    res.json({ message: 'User deleted successfully.', id });
  } catch (err: any) {
    console.error('Delete user error:', err);
    res.status(500).json({ error: 'Failed to delete user.' });
  }
});

export default router;
