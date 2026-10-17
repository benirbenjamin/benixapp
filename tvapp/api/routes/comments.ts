import { Router, Request, Response } from 'express';
import { query } from '../db/pool.js';
import { requireAuth, AuthenticatedRequest } from '../middleware/auth.js';
import {
  checkInappropriateLanguage,
  DEFAULT_KINYARWANDA_BLOCKED,
  DEFAULT_ENGLISH_BLOCKED,
  DEFAULT_FRENCH_BLOCKED,
  ALL_DEFAULT_BLOCKED_WORDS,
} from '../utils/moderation.js';

const router = Router();

// Helper to load custom blocked words from DB
async function getCustomBlockedWords(): Promise<string[]> {
  try {
    const res = await query(`SELECT value FROM site_settings WHERE key = 'moderation_blocked_words' LIMIT 1;`);
    if (res.rows.length > 0 && Array.isArray(res.rows[0].value)) {
      return res.rows[0].value;
    }
  } catch (e) {
    // Ignore
  }
  return [];
}

// 1. GET /api/comments?station_slug=xyz (Public list - only approved, non-hidden comments)
router.get('/', async (req: Request, res: Response): Promise<void> => {
  try {
    const { station_slug, station_id } = req.query;

    if (!station_slug && !station_id) {
      res.status(400).json({ error: 'station_slug or station_id is required' });
      return;
    }

    let sql = `SELECT * FROM comments WHERE (is_hidden = false OR is_hidden IS NULL) AND (status = 'APPROVED' OR status IS NULL) AND `;
    const params: any[] = [];

    if (station_slug && station_id) {
      params.push(station_slug, station_id);
      sql += `(station_slug = $1 OR station_id::text = $2)`;
    } else if (station_slug) {
      params.push(station_slug);
      sql += `station_slug = $1`;
    } else {
      params.push(station_id);
      sql += `station_id::text = $1`;
    }

    sql += ` ORDER BY created_at ASC;`;

    const result = await query(sql, params);
    const allComments = result.rows;

    // Group into threaded hierarchy
    const commentMap = new Map<string, any>();
    const rootComments: any[] = [];

    allComments.forEach((c: any) => {
      commentMap.set(c.id, { ...c, replies: [] });
    });

    allComments.forEach((c: any) => {
      const item = commentMap.get(c.id);
      if (c.parent_id && commentMap.has(c.parent_id)) {
        commentMap.get(c.parent_id).replies.push(item);
      } else {
        rootComments.push(item);
      }
    });

    // Root comments newest first, replies chronological
    rootComments.reverse();

    res.json({
      success: true,
      count: allComments.length,
      comments: rootComments,
    });
  } catch (error: any) {
    console.error('Error fetching station comments:', error);
    res.status(500).json({ error: 'Failed to fetch comments' });
  }
});

// 2. POST /api/comments (Create comment with anti-ban and multilingual moderation check)
router.post('/', async (req: Request, res: Response): Promise<void> => {
  try {
    const { station_slug, station_id, author_name, content, parent_id, author_fingerprint } = req.body;

    if (!author_name || !author_name.trim()) {
      res.status(400).json({ error: 'Author nickname is required' });
      return;
    }

    if (!content || !content.trim()) {
      res.status(400).json({ error: 'Comment content cannot be empty' });
      return;
    }

    if (!station_slug) {
      res.status(400).json({ error: 'Station slug is required' });
      return;
    }

    const cleanAuthor = author_name.trim().slice(0, 80);
    const cleanContent = content.trim().slice(0, 1000);
    const cleanFingerprint = author_fingerprint ? String(author_fingerprint).trim().slice(0, 255) : '';
    const rawIp = (req.headers['x-forwarded-for'] as string)?.split(',')[0].trim() || req.socket.remoteAddress || '';
    const clientIp = rawIp.slice(0, 100);

    // Step A: Check if user or fingerprint is banned
    const banCheckSql = `
      SELECT * FROM banned_commenters 
      WHERE identifier = $1 
         OR identifier = $2 
         OR (identifier_type = 'author_name' AND LOWER(author_name) = LOWER($3))
      LIMIT 1;
    `;
    const banCheckResult = await query(banCheckSql, [cleanFingerprint, clientIp, cleanAuthor]);

    if (banCheckResult.rows.length > 0) {
      const ban = banCheckResult.rows[0];
      res.status(403).json({
        error: 'You have been restricted by an administrator from posting comments.',
        reason: ban.reason || 'Violation of community moderation standards.',
        banned: true,
      });
      return;
    }

    // Step B: Multilingual Content & Name Moderation (Kinyarwanda, English, French + Custom)
    const customWords = await getCustomBlockedWords();

    const nameCheck = checkInappropriateLanguage(cleanAuthor, customWords);
    if (nameCheck.isInappropriate) {
      res.status(400).json({
        error: `Inappropriate nickname detected (${nameCheck.category || 'Moderation'}). Vulgar or offensive names (e.g. in Kinyarwanda, English, French) are prohibited. Please choose a respectful nickname.`,
        flaggedWord: nameCheck.flaggedWord,
      });
      return;
    }

    const contentCheck = checkInappropriateLanguage(cleanContent, customWords);
    if (contentCheck.isInappropriate) {
      res.status(400).json({
        error: `Inappropriate comment language detected (${contentCheck.category || 'Moderation'}). Offensive language and profanity are strictly prohibited.`,
        flaggedWord: contentCheck.flaggedWord,
      });
      return;
    }

    const parentIdVal = parent_id ? parent_id : null;
    const stationIdVal = station_id ? station_id : null;

    const insertSql = `
      INSERT INTO comments (
        station_slug, 
        station_id, 
        author_name, 
        content, 
        parent_id,
        is_hidden,
        status,
        author_fingerprint,
        ip_address
      )
      VALUES ($1, $2, $3, $4, $5, false, 'APPROVED', $6, $7)
      RETURNING *;
    `;

    const result = await query(insertSql, [
      station_slug,
      stationIdVal,
      cleanAuthor,
      cleanContent,
      parentIdVal,
      cleanFingerprint,
      clientIp,
    ]);

    const created = result.rows[0];
    res.status(201).json({
      success: true,
      comment: {
        ...created,
        replies: [],
      },
    });
  } catch (error: any) {
    console.error('Error posting comment:', error);
    res.status(500).json({ error: 'Failed to post comment' });
  }
});

// 3. POST /api/comments/:id/like (Like a comment)
router.post('/:id/like', async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const result = await query(
      `UPDATE comments SET likes_count = likes_count + 1 WHERE id::text = $1 RETURNING id, likes_count;`,
      [id]
    );

    if (result.rows.length === 0) {
      res.status(404).json({ error: 'Comment not found' });
      return;
    }

    res.json({
      success: true,
      id: result.rows[0].id,
      likes_count: result.rows[0].likes_count,
    });
  } catch (error: any) {
    console.error('Error liking comment:', error);
    res.status(500).json({ error: 'Failed to like comment' });
  }
});

// ==========================================
// ADMIN MODERATION ENDPOINTS (Requires Auth)
// ==========================================

// GET /api/comments/admin/all (List comments with search, filter, status)
router.get('/admin/all', requireAuth, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { search = '', station = '', status = 'ALL', limit = 50, offset = 0 } = req.query;

    let whereClause = 'WHERE 1=1';
    const params: any[] = [];
    let pIndex = 1;

    if (station && station !== 'ALL') {
      whereClause += ` AND (c.station_slug = $${pIndex} OR c.station_id::text = $${pIndex})`;
      params.push(station);
      pIndex++;
    }

    if (status === 'HIDDEN') {
      whereClause += ` AND c.is_hidden = true`;
    } else if (status === 'APPROVED') {
      whereClause += ` AND (c.is_hidden = false OR c.is_hidden IS NULL)`;
    }

    if (search) {
      whereClause += ` AND (LOWER(c.author_name) LIKE $${pIndex} OR LOWER(c.content) LIKE $${pIndex})`;
      params.push(`%${String(search).toLowerCase()}%`);
      pIndex++;
    }

    const countSql = `SELECT COUNT(*) as total FROM comments c ${whereClause};`;
    const countRes = await query(countSql, params);
    const total = parseInt(countRes.rows[0]?.total || '0', 10);

    const listSql = `
      SELECT c.*, s.name as station_name 
      FROM comments c
      LEFT JOIN stations s ON s.slug = c.station_slug OR s.id = c.station_id
      ${whereClause}
      ORDER BY c.created_at DESC
      LIMIT $${pIndex} OFFSET $${pIndex + 1};
    `;
    params.push(Number(limit), Number(offset));

    const listRes = await query(listSql, params);

    res.json({
      success: true,
      total,
      comments: listRes.rows,
    });
  } catch (error: any) {
    console.error('Error fetching admin comments:', error);
    res.status(500).json({ error: 'Failed to fetch comments for moderation' });
  }
});

// PATCH /api/comments/admin/:id/status (Toggle hide / unhide / approve)
router.patch('/admin/:id/status', requireAuth, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { status, is_hidden } = req.body;

    const newHidden = typeof is_hidden === 'boolean' ? is_hidden : status === 'HIDDEN';
    const newStatus = status || (newHidden ? 'HIDDEN' : 'APPROVED');

    const updateSql = `
      UPDATE comments 
      SET is_hidden = $1, status = $2 
      WHERE id::text = $3 
      RETURNING *;
    `;
    const result = await query(updateSql, [newHidden, newStatus, id]);

    if (result.rows.length === 0) {
      res.status(404).json({ error: 'Comment not found' });
      return;
    }

    res.json({
      success: true,
      comment: result.rows[0],
    });
  } catch (error: any) {
    console.error('Error updating comment status:', error);
    res.status(500).json({ error: 'Failed to update comment status' });
  }
});

// DELETE /api/comments/admin/:id (Permanently delete comment & replies)
router.delete('/admin/:id', requireAuth, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    await query(`DELETE FROM comments WHERE id::text = $1 OR parent_id::text = $1;`, [id]);

    res.json({ success: true, message: 'Comment deleted successfully' });
  } catch (error: any) {
    console.error('Error deleting comment:', error);
    res.status(500).json({ error: 'Failed to delete comment' });
  }
});

// POST /api/comments/admin/ban (Ban user by fingerprint, IP, or author name)
router.post('/admin/ban', requireAuth, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { identifier, identifier_type = 'fingerprint', author_name, reason, hide_all_comments = true } = req.body;

    if (!identifier && !author_name) {
      res.status(400).json({ error: 'Identifier (fingerprint, IP) or author_name is required to ban' });
      return;
    }

    const targetIdentifier = identifier || author_name;
    const adminId = req.user?.id || null;

    const banSql = `
      INSERT INTO banned_commenters (identifier, identifier_type, author_name, reason, banned_by)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *;
    `;
    const banRes = await query(banSql, [
      targetIdentifier,
      identifier_type,
      author_name || null,
      reason || 'Inappropriate language or behavior violation',
      adminId,
    ]);

    // Optionally hide all existing comments posted by this user
    if (hide_all_comments) {
      if (identifier) {
        await query(
          `UPDATE comments SET is_hidden = true, status = 'HIDDEN' WHERE author_fingerprint = $1 OR ip_address = $1;`,
          [identifier]
        );
      }
      if (author_name) {
        await query(
          `UPDATE comments SET is_hidden = true, status = 'HIDDEN' WHERE LOWER(author_name) = LOWER($1);`,
          [author_name]
        );
      }
    }

    res.json({
      success: true,
      banned: banRes.rows[0],
      message: `User ${author_name || targetIdentifier} has been successfully banned.`,
    });
  } catch (error: any) {
    console.error('Error banning commenter:', error);
    res.status(500).json({ error: 'Failed to ban commenter' });
  }
});

// GET /api/comments/admin/banned (List all banned commenters)
router.get('/admin/banned', requireAuth, async (_req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const result = await query(`
      SELECT b.*, u.full_name as banned_by_name 
      FROM banned_commenters b
      LEFT JOIN users u ON u.id = b.banned_by
      ORDER BY b.created_at DESC;
    `);

    res.json({
      success: true,
      banned: result.rows,
    });
  } catch (error: any) {
    console.error('Error fetching banned commenters:', error);
    res.status(500).json({ error: 'Failed to fetch banned commenters' });
  }
});

// DELETE /api/comments/admin/banned/:id (Unban commenter)
router.delete('/admin/banned/:id', requireAuth, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    await query(`DELETE FROM banned_commenters WHERE id::text = $1;`, [id]);

    res.json({ success: true, message: 'User has been unbanned successfully.' });
  } catch (error: any) {
    console.error('Error unbanning user:', error);
    res.status(500).json({ error: 'Failed to unban user' });
  }
});

// GET /api/comments/admin/words (Fetch blocked moderation words)
router.get('/admin/words', requireAuth, async (_req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const customWords = await getCustomBlockedWords();

    res.json({
      success: true,
      kinyarwanda: DEFAULT_KINYARWANDA_BLOCKED,
      english: DEFAULT_ENGLISH_BLOCKED,
      french: DEFAULT_FRENCH_BLOCKED,
      custom: customWords,
      totalCount: ALL_DEFAULT_BLOCKED_WORDS.length + customWords.length,
    });
  } catch (error: any) {
    console.error('Error fetching moderation words:', error);
    res.status(500).json({ error: 'Failed to fetch moderation words' });
  }
});

// POST /api/comments/admin/words (Save custom blocked words)
router.post('/admin/words', requireAuth, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { words } = req.body;

    if (!Array.isArray(words)) {
      res.status(400).json({ error: 'Words must be an array of strings' });
      return;
    }

    const cleanWords = Array.from(
      new Set(
        words
          .map((w) => String(w).trim().toLowerCase())
          .filter((w) => w.length > 1 && !ALL_DEFAULT_BLOCKED_WORDS.includes(w))
      )
    );

    const upsertSql = `
      INSERT INTO site_settings (key, value, updated_at)
      VALUES ('moderation_blocked_words', $1::jsonb, NOW())
      ON CONFLICT (key)
      DO UPDATE SET value = $1::jsonb, updated_at = NOW()
      RETURNING *;
    `;

    await query(upsertSql, [JSON.stringify(cleanWords)]);

    res.json({
      success: true,
      message: 'Custom moderation word list updated successfully',
      custom: cleanWords,
    });
  } catch (error: any) {
    console.error('Error saving custom moderation words:', error);
    res.status(500).json({ error: 'Failed to save moderation words' });
  }
});

export default router;
