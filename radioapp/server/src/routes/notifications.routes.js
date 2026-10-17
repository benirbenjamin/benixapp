import express from 'express';
import { query } from '../config/db.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// GET /api/notifications - Get in-app notifications for authenticated user/superadmin
router.get('/', authenticateToken, async (req, res) => {
  try {
    const isSuperAdmin = req.user.role === 'superadmin';

    let result;
    if (isSuperAdmin) {
      // Superadmins see global notifications (user_id IS NULL) plus notifications specific to them
      result = await query(`
        SELECT * FROM in_app_notifications
        WHERE user_id IS NULL OR user_id = $1
        ORDER BY created_at DESC
        LIMIT 30
      `, [req.user.id]);
    } else {
      result = await query(`
        SELECT * FROM in_app_notifications
        WHERE user_id = $1
        ORDER BY created_at DESC
        LIMIT 30
      `, [req.user.id]);
    }

    const unreadCount = result.rows.filter(n => !n.is_read).length;

    res.json({
      notifications: result.rows,
      unreadCount
    });
  } catch (err) {
    console.error('[Notifications] Fetch error:', err);
    res.status(500).json({ error: 'Failed to retrieve notifications.' });
  }
});

// PUT /api/notifications/:id/read - Mark single notification as read
router.put('/:id/read', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    await query(`UPDATE in_app_notifications SET is_read = true WHERE id = $1`, [id]);
    res.json({ success: true });
  } catch (err) {
    console.error('[Notifications] Mark read error:', err);
    res.status(500).json({ error: 'Failed to mark notification as read.' });
  }
});

// PUT /api/notifications/read-all - Mark all notifications as read
router.put('/read-all', authenticateToken, async (req, res) => {
  try {
    const isSuperAdmin = req.user.role === 'superadmin';
    if (isSuperAdmin) {
      await query(`UPDATE in_app_notifications SET is_read = true WHERE user_id IS NULL OR user_id = $1`, [req.user.id]);
    } else {
      await query(`UPDATE in_app_notifications SET is_read = true WHERE user_id = $1`, [req.user.id]);
    }
    res.json({ success: true });
  } catch (err) {
    console.error('[Notifications] Mark all read error:', err);
    res.status(500).json({ error: 'Failed to mark notifications as read.' });
  }
});

export default router;
