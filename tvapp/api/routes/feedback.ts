import { Router, Response } from 'express';
import { query } from '../db/pool.js';
import { requireAdmin, AuthenticatedRequest } from '../middleware/auth.js';

const router = Router();

// POST /api/feedback (Public endpoint to submit user feedback or contact inquiry)
router.post('/', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { name, email, subject, message } = req.body;

    if (!name || typeof name !== 'string' || !name.trim()) {
      res.status(400).json({ error: 'Name is required' });
      return;
    }
    if (!email || typeof email !== 'string' || !email.includes('@')) {
      res.status(400).json({ error: 'Valid email address is required' });
      return;
    }
    if (!subject || typeof subject !== 'string' || !subject.trim()) {
      res.status(400).json({ error: 'Subject is required' });
      return;
    }
    if (!message || typeof message !== 'string' || !message.trim()) {
      res.status(400).json({ error: 'Message content is required' });
      return;
    }

    const clientIp = (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress || '';

    const result = await query(
      `INSERT INTO feedback_messages (name, email, subject, message, status, ip_address)
       VALUES ($1, $2, $3, $4, 'UNREAD', $5)
       RETURNING id, name, email, subject, message, status, created_at`,
      [name.trim(), email.trim().toLowerCase(), subject.trim(), message.trim(), clientIp]
    );

    const savedMessage = result.rows[0];

    res.status(201).json({
      success: true,
      message: 'Feedback submitted successfully',
      data: savedMessage,
    });
  } catch (error: any) {
    console.error('Error submitting feedback:', error);
    res.status(500).json({ error: 'Failed to submit message. Please try again.' });
  }
});

// GET /api/feedback/admin (Admin list feedback messages with filter & stats)
router.get('/admin', requireAdmin, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { status, q } = req.query;

    let filterClause = '';
    const params: any[] = [];

    if (status && status !== 'ALL' && ['UNREAD', 'READ', 'ARCHIVED'].includes(status as string)) {
      params.push(status);
      filterClause += ` WHERE status = $${params.length}`;
    }

    if (q && typeof q === 'string' && q.trim()) {
      const searchTerm = `%${q.trim()}%`;
      params.push(searchTerm);
      filterClause += filterClause ? ` AND (name ILIKE $${params.length} OR email ILIKE $${params.length} OR subject ILIKE $${params.length} OR message ILIKE $${params.length})` : ` WHERE (name ILIKE $${params.length} OR email ILIKE $${params.length} OR subject ILIKE $${params.length} OR message ILIKE $${params.length})`;
    }

    const messagesResult = await query(
      `SELECT id, name, email, subject, message, status, ip_address, created_at
       FROM feedback_messages
       ${filterClause}
       ORDER BY created_at DESC
       LIMIT 200`,
      params
    );

    const statsResult = await query(`
      SELECT 
        COUNT(*) as total,
        COUNT(*) FILTER (WHERE status = 'UNREAD') as unread,
        COUNT(*) FILTER (WHERE status = 'READ') as read,
        COUNT(*) FILTER (WHERE status = 'ARCHIVED') as archived
      FROM feedback_messages
    `);

    const statsRow = statsResult.rows[0] || { total: 0, unread: 0, read: 0, archived: 0 };

    res.json({
      messages: messagesResult.rows,
      stats: {
        total: parseInt(statsRow.total || '0', 10),
        unread: parseInt(statsRow.unread || '0', 10),
        read: parseInt(statsRow.read || '0', 10),
        archived: parseInt(statsRow.archived || '0', 10),
      },
    });
  } catch (error: any) {
    console.error('Error loading admin feedback:', error);
    res.status(500).json({ error: 'Failed to retrieve feedback messages' });
  }
});

// PUT /api/feedback/admin/:id/status (Update status: UNREAD, READ, ARCHIVED)
router.put('/admin/:id/status', requireAdmin, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!['UNREAD', 'READ', 'ARCHIVED'].includes(status)) {
      res.status(400).json({ error: 'Invalid status. Allowed values: UNREAD, READ, ARCHIVED' });
      return;
    }

    const result = await query(
      `UPDATE feedback_messages
       SET status = $1
       WHERE id = $2
       RETURNING id, name, email, subject, message, status, created_at`,
      [status, id]
    );

    if (result.rows.length === 0) {
      res.status(404).json({ error: 'Feedback message not found' });
      return;
    }

    res.json({ success: true, message: result.rows[0] });
  } catch (error: any) {
    console.error('Error updating feedback status:', error);
    res.status(500).json({ error: 'Failed to update feedback status' });
  }
});

// DELETE /api/feedback/admin/:id (Delete feedback message)
router.delete('/admin/:id', requireAdmin, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const result = await query(`DELETE FROM feedback_messages WHERE id = $1 RETURNING id`, [id]);

    if (result.rows.length === 0) {
      res.status(404).json({ error: 'Feedback message not found' });
      return;
    }

    res.json({ success: true, message: 'Feedback message deleted' });
  } catch (error: any) {
    console.error('Error deleting feedback message:', error);
    res.status(500).json({ error: 'Failed to delete feedback message' });
  }
});

export default router;
