import { Router, Request, Response } from 'express';
import { query } from '../db/pool.js';
import { requireAdmin } from '../middleware/auth.js';

const router = Router();

function slugify(text: string): string {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^\w\-]+/g, '')
    .replace(/\-\-+/g, '-');
}

export function extractYouTubeData(url: string) {
  let videoId = '';
  let embedUrl = url;
  let thumbnail = '';

  const ytRegex = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?|live|shorts)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/i;
  const match = url.match(ytRegex);

  if (match && match[1]) {
    videoId = match[1];
    embedUrl = `https://www.youtube.com/embed/${videoId}`;
    thumbnail = `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;
    return { platform: 'youtube', videoId, embedUrl, defaultThumbnail: thumbnail };
  }

  // Fallback for direct mp4 / HLS / embeddable url
  return { platform: 'external', videoId: '', embedUrl: url, defaultThumbnail: '' };
}

// GET /api/videos (public)
router.get('/', async (req: Request, res: Response): Promise<void> => {
  try {
    const { category, featured, q, limit = 20, page = 1, include_unpublished } = req.query;

    const limitNum = Math.min(Math.max(parseInt(limit as string, 10) || 20, 1), 100);
    const offsetNum = (Math.max(parseInt(page as string, 10) || 1, 1) - 1) * limitNum;

    let sql = `
      SELECT 
        v.*, 
        c.name as category_name, 
        c.slug as category_slug
      FROM videos v
      LEFT JOIN categories c ON v.category_id = c.id
      WHERE 1=1
    `;
    const params: any[] = [];

    if (include_unpublished !== 'true') {
      sql += ` AND v.is_published = true`;
    }

    if (featured === 'true') {
      sql += ` AND v.is_featured = true`;
    }

    if (category && typeof category === 'string') {
      params.push(category);
      sql += ` AND (c.slug = $${params.length} OR v.category_id::text = $${params.length})`;
    }

    if (q && typeof q === 'string') {
      params.push(`%${q.trim()}%`);
      sql += ` AND (v.title ILIKE $${params.length} OR v.description ILIKE $${params.length})`;
    }

    sql += ` ORDER BY v.publication_date DESC, v.created_at DESC LIMIT ${limitNum} OFFSET ${offsetNum};`;

    const result = await query(sql, params);

    // Total count for pagination
    let countSql = `SELECT COUNT(*) FROM videos v LEFT JOIN categories c ON v.category_id = c.id WHERE 1=1`;
    const countParams: any[] = [];
    if (include_unpublished !== 'true') countSql += ` AND v.is_published = true`;
    if (featured === 'true') countSql += ` AND v.is_featured = true`;
    if (category && typeof category === 'string') {
      countParams.push(category);
      countSql += ` AND (c.slug = $${countParams.length} OR v.category_id::text = $${countParams.length})`;
    }
    if (q && typeof q === 'string') {
      countParams.push(`%${q.trim()}%`);
      countSql += ` AND (v.title ILIKE $${countParams.length} OR v.description ILIKE $${countParams.length})`;
    }

    const countResult = await query(countSql, countParams);
    const total = parseInt(countResult.rows[0].count, 10);

    res.json({
      data: result.rows,
      pagination: {
        page: Math.max(parseInt(page as string, 10) || 1, 1),
        limit: limitNum,
        total,
        totalPages: Math.ceil(total / limitNum),
      },
    });
  } catch (err: any) {
    console.error('Error fetching videos:', err);
    res.status(500).json({ error: 'Failed to fetch videos from database.' });
  }
});

// GET /api/videos/:idOrSlug (public)
router.get('/:idOrSlug', async (req: Request, res: Response): Promise<void> => {
  try {
    const { idOrSlug } = req.params;

    const result = await query(
      `SELECT 
        v.*, 
        c.name as category_name, 
        c.slug as category_slug
      FROM videos v
      LEFT JOIN categories c ON v.category_id = c.id
      WHERE v.slug = $1 OR v.id::text = $1
      LIMIT 1;`,
      [idOrSlug]
    );

    if (result.rows.length === 0) {
      res.status(404).json({ error: 'Video not found.' });
      return;
    }

    const video = result.rows[0];

    // Increment views count asynchronously
    query(`UPDATE videos SET views_count = views_count + 1 WHERE id = $1;`, [video.id]).catch(() => {});

    // Fetch related videos in same category
    const relatedResult = await query(
      `SELECT v.id, v.title, v.slug, v.thumbnail_url, v.publication_date, v.views_count, c.name as category_name
       FROM videos v
       LEFT JOIN categories c ON v.category_id = c.id
       WHERE v.id != $1 AND v.is_published = true AND (v.category_id = $2 OR $2 IS NULL)
       ORDER BY v.publication_date DESC LIMIT 6;`,
      [video.id, video.category_id]
    );

    res.json({
      video,
      relatedVideos: relatedResult.rows,
    });
  } catch (err: any) {
    console.error('Error fetching video details:', err);
    res.status(500).json({ error: 'Failed to fetch video details.' });
  }
});

// POST /api/videos (admin only)
router.post('/', requireAdmin, async (req: Request, res: Response): Promise<void> => {
  try {
    const {
      title,
      slug,
      description,
      original_url,
      thumbnail_url,
      category_id,
      publication_date,
      is_featured,
      is_published,
    } = req.body;

    if (!title || !original_url) {
      res.status(400).json({ error: 'Video title and URL are required.' });
      return;
    }

    const { platform, videoId, embedUrl, defaultThumbnail } = extractYouTubeData(original_url);
    const finalThumbnail = thumbnail_url || defaultThumbnail;
    const finalSlug = slug ? slugify(slug) : `${slugify(title)}-${Date.now().toString().slice(-4)}`;

    const result = await query(
      `INSERT INTO videos (
        title, slug, description, original_url, embed_url, platform, video_id,
        thumbnail_url, category_id, publication_date, is_featured, is_published
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
      RETURNING *;`,
      [
        title,
        finalSlug,
        description || '',
        original_url,
        embedUrl,
        platform,
        videoId,
        finalThumbnail,
        category_id || null,
        publication_date || new Date().toISOString().split('T')[0],
        is_featured !== undefined ? is_featured : false,
        is_published !== undefined ? is_published : true,
      ]
    );

    res.status(201).json(result.rows[0]);
  } catch (err: any) {
    console.error('Error creating video:', err);
    res.status(500).json({ error: 'Failed to save video to database.' });
  }
});

// PUT /api/videos/:id (admin only)
router.put('/:id', requireAdmin, async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const {
      title,
      slug,
      description,
      original_url,
      thumbnail_url,
      category_id,
      publication_date,
      is_featured,
      is_published,
    } = req.body;

    let embedUrl: string | undefined;
    let platform: string | undefined;
    let videoId: string | undefined;

    if (original_url) {
      const parsed = extractYouTubeData(original_url);
      embedUrl = parsed.embedUrl;
      platform = parsed.platform;
      videoId = parsed.videoId;
    }

    const result = await query(
      `UPDATE videos SET
        title = COALESCE($1, title),
        slug = COALESCE($2, slug),
        description = COALESCE($3, description),
        original_url = COALESCE($4, original_url),
        embed_url = COALESCE($5, embed_url),
        platform = COALESCE($6, platform),
        video_id = COALESCE($7, video_id),
        thumbnail_url = COALESCE($8, thumbnail_url),
        category_id = COALESCE($9, category_id),
        publication_date = COALESCE($10, publication_date),
        is_featured = COALESCE($11, is_featured),
        is_published = COALESCE($12, is_published),
        updated_at = NOW()
      WHERE id = $13
      RETURNING *;`,
      [
        title,
        slug ? slugify(slug) : undefined,
        description,
        original_url,
        embedUrl,
        platform,
        videoId,
        thumbnail_url,
        category_id,
        publication_date,
        is_featured,
        is_published,
        id,
      ]
    );

    if (result.rows.length === 0) {
      res.status(404).json({ error: 'Video not found.' });
      return;
    }

    res.json(result.rows[0]);
  } catch (err: any) {
    console.error('Error updating video:', err);
    res.status(500).json({ error: 'Failed to update video.' });
  }
});

// DELETE /api/videos/:id (admin only)
router.delete('/:id', requireAdmin, async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const result = await query(`DELETE FROM videos WHERE id = $1 RETURNING id;`, [id]);
    if (result.rows.length === 0) {
      res.status(404).json({ error: 'Video not found.' });
      return;
    }
    res.json({ message: 'Video deleted successfully.', id });
  } catch (err: any) {
    console.error('Error deleting video:', err);
    res.status(500).json({ error: 'Failed to delete video.' });
  }
});

export default router;
