import express from 'express';
import { query } from '../config/db.js';
import { authenticateToken, verifyStationAccess } from '../middleware/auth.js';

const router = express.Router();

// Helper to generate slug from title
function slugify(text) {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^\w\-]+/g, '')
    .replace(/\-\-+/g, '-')
    .replace(/^-+/, '')
    .replace(/-+$/, '');
}

// GET /api/stations/:stationId/news - List news articles
router.get('/:stationId/news', async (req, res) => {
  try {
    const { stationId } = req.params;
    const { category, search, page = 1, limit = 10, status } = req.query;

    const offset = (Math.max(1, parseInt(page)) - 1) * parseInt(limit);
    const filterStatus = status || 'published';

    let sql = `
      SELECT na.*, nc.name as category_name, nc.slug as category_slug
      FROM news_articles na
      LEFT JOIN news_categories nc ON na.category_id = nc.id
      WHERE na.station_id = $1
    `;
    const params = [stationId];

    if (filterStatus !== 'all') {
      params.push(filterStatus);
      sql += ` AND na.status = $${params.length}`;
    }

    if (category) {
      params.push(category);
      sql += ` AND (nc.slug = $${params.length} OR nc.id = $${params.length})`;
    }

    if (search) {
      params.push(`%${search.trim()}%`);
      sql += ` AND (na.title ILIKE $${params.length} OR na.excerpt ILIKE $${params.length})`;
    }

    // Get total count
    const countRes = await query(`SELECT COUNT(*) as count FROM news_articles WHERE station_id = $1 ${filterStatus !== 'all' ? `AND status = '${filterStatus}'` : ''}`, [stationId]);
    const totalArticles = parseInt(countRes.rows[0]?.count || 0);

    sql += ` ORDER BY na.published_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
    params.push(parseInt(limit), offset);

    const result = await query(sql, params);

    res.json({
      articles: result.rows,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: totalArticles,
        totalPages: Math.ceil(totalArticles / parseInt(limit))
      }
    });
  } catch (err) {
    console.error('[News] Error fetching news:', err);
    res.status(500).json({ error: 'Failed to fetch news articles.' });
  }
});

// GET /api/stations/:stationId/news/categories - List categories
router.get('/:stationId/news-categories', async (req, res) => {
  try {
    const { stationId } = req.params;
    const result = await query(`
      SELECT nc.*, COUNT(na.id) as article_count
      FROM news_categories nc
      LEFT JOIN news_articles na ON nc.id = na.category_id AND na.status = 'published'
      WHERE nc.station_id = $1
      GROUP BY nc.id
      ORDER BY nc.name ASC
    `, [stationId]);

    res.json(result.rows);
  } catch (err) {
    console.error('[News] Error fetching categories:', err);
    res.status(500).json({ error: 'Failed to fetch news categories.' });
  }
});

// POST /api/stations/:stationId/news-categories - Create category
router.post('/:stationId/news-categories', authenticateToken, verifyStationAccess, async (req, res) => {
  try {
    const { stationId } = req.params;
    const { name } = req.body;

    if (!name) {
      return res.status(400).json({ error: 'Category name is required.' });
    }

    const catId = `cat-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;
    const slug = slugify(name);

    await query(`
      INSERT INTO news_categories (id, station_id, name, slug)
      VALUES ($1, $2, $3, $4)
    `, [catId, stationId, name.trim(), slug]);

    const created = await query(`SELECT * FROM news_categories WHERE id = $1`, [catId]);
    res.status(201).json(created.rows[0]);
  } catch (err) {
    console.error('[News] Error creating category:', err);
    res.status(500).json({ error: 'Failed to create category.' });
  }
});

// GET /api/stations/:stationId/news/:slugOrId - Single article
router.get('/:stationId/news/:slugOrId', async (req, res) => {
  try {
    const { stationId, slugOrId } = req.params;

    const result = await query(`
      SELECT na.*, nc.name as category_name, nc.slug as category_slug
      FROM news_articles na
      LEFT JOIN news_categories nc ON na.category_id = nc.id
      WHERE na.station_id = $1 AND (na.slug = $2 OR na.id = $2)
    `, [stationId, slugOrId]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Article not found.' });
    }

    const article = result.rows[0];

    // Increment views count asynchronously
    query(`UPDATE news_articles SET views_count = views_count + 1 WHERE id = $1`, [article.id]).catch(() => {});

    // Fetch related articles from same station
    const relatedRes = await query(`
      SELECT id, title, slug, excerpt, image_url, published_at
      FROM news_articles
      WHERE station_id = $1 AND id != $2 AND status = 'published'
      ORDER BY published_at DESC
      LIMIT 3
    `, [stationId, article.id]);

    res.json({ article, related: relatedRes.rows });
  } catch (err) {
    console.error('[News] Error fetching article:', err);
    res.status(500).json({ error: 'Failed to retrieve article.' });
  }
});

// POST /api/stations/:stationId/news - Create article
router.post('/:stationId/news', authenticateToken, verifyStationAccess, async (req, res) => {
  try {
    const { stationId } = req.params;
    const {
      title,
      category_id,
      excerpt,
      content_html,
      image_url,
      youtube_url,
      status
    } = req.body;

    if (!title || !content_html) {
      return res.status(400).json({ error: 'Title and article content are required.' });
    }

    const articleId = `art-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;
    let slug = slugify(title);

    // Check slug uniqueness within station
    const existingSlug = await query(`SELECT id FROM news_articles WHERE station_id = $1 AND slug = $2`, [stationId, slug]);
    if (existingSlug.rows.length > 0) {
      slug = `${slug}-${Math.random().toString(36).substr(2, 4)}`;
    }

    await query(`
      INSERT INTO news_articles (
        id, station_id, category_id, title, slug, excerpt,
        content_html, image_url, youtube_url, status
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
    `, [
      articleId,
      stationId,
      category_id || null,
      title.trim(),
      slug,
      excerpt ? excerpt.trim() : null,
      content_html,
      image_url ? image_url.trim() : null,
      youtube_url ? youtube_url.trim() : null,
      status || 'published'
    ]);

    const created = await query(`SELECT * FROM news_articles WHERE id = $1`, [articleId]);
    res.status(201).json(created.rows[0]);
  } catch (err) {
    console.error('[News] Error creating article:', err);
    res.status(500).json({ error: 'Failed to create news article.' });
  }
});

// PUT /api/stations/:stationId/news/:articleId - Update article
router.put('/:stationId/news/:articleId', authenticateToken, verifyStationAccess, async (req, res) => {
  try {
    const { stationId, articleId } = req.params;
    const {
      title,
      category_id,
      excerpt,
      content_html,
      image_url,
      youtube_url,
      status
    } = req.body;

    if (!title || !content_html) {
      return res.status(400).json({ error: 'Title and article content are required.' });
    }

    await query(`
      UPDATE news_articles
      SET title = $1, category_id = $2, excerpt = $3,
          content_html = $4, image_url = $5, youtube_url = $6, status = $7
      WHERE id = $8 AND station_id = $9
    `, [
      title.trim(),
      category_id || null,
      excerpt ? excerpt.trim() : null,
      content_html,
      image_url ? image_url.trim() : null,
      youtube_url ? youtube_url.trim() : null,
      status || 'published',
      articleId,
      stationId
    ]);

    const updated = await query(`SELECT * FROM news_articles WHERE id = $1`, [articleId]);
    res.json(updated.rows[0]);
  } catch (err) {
    console.error('[News] Error updating article:', err);
    res.status(500).json({ error: 'Failed to update news article.' });
  }
});

// DELETE /api/stations/:stationId/news/:articleId - Delete article
router.delete('/:stationId/news/:articleId', authenticateToken, verifyStationAccess, async (req, res) => {
  try {
    const { stationId, articleId } = req.params;
    await query(`DELETE FROM news_articles WHERE id = $1 AND station_id = $2`, [articleId, stationId]);
    res.json({ message: 'Article deleted successfully.' });
  } catch (err) {
    console.error('[News] Error deleting article:', err);
    res.status(500).json({ error: 'Failed to delete news article.' });
  }
});

export default router;
