import { Router, Request, Response } from 'express';
import { query } from '../db/pool.js';
import { requireAdmin } from '../middleware/auth.js';

const router = Router();

// Helper to create slug from string
function slugify(text: string): string {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^\w\-]+/g, '')
    .replace(/\-\-+/g, '-');
}

// GET /api/stations/proxy-stream (public HTTP audio stream proxy to resolve HTTPS Mixed Content & Shoutcast format)
router.get('/proxy-stream', async (req: Request, res: Response): Promise<void> => {
  const rawUrl = req.query.url;
  if (!rawUrl || typeof rawUrl !== 'string') {
    res.status(400).send('Stream URL parameter is required.');
    return;
  }

  let targetUrl = rawUrl;
  // Shoutcast URL auto-formatting: if ends with port or /, append ; for raw audio stream
  if (/:\d+\/?$/.test(targetUrl) && !targetUrl.endsWith(';')) {
    targetUrl = targetUrl.endsWith('/') ? `${targetUrl};` : `${targetUrl}/;`;
  }

  try {
    const upstreamRes = await fetch(targetUrl, {
      headers: {
        'User-Agent': 'VLC/3.0.18 LibVLC/3.0.18',
        'Icy-MetaData': '1',
        'Accept': '*/*',
      },
    });

    if (!upstreamRes.ok && upstreamRes.status !== 206) {
      res.status(upstreamRes.status).send(`Upstream audio server error: ${upstreamRes.statusText}`);
      return;
    }

    let contentType = upstreamRes.headers.get('content-type') || 'audio/mpeg';
    if (contentType.includes('text/html') || contentType.includes('text/plain')) {
      contentType = 'audio/mpeg';
    }

    res.setHeader('Content-Type', contentType);
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.setHeader('Access-Control-Allow-Origin', '*');

    if (upstreamRes.body) {
      const reader = upstreamRes.body.getReader();
      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          res.write(value);
        }
        res.end();
      } catch {
        res.end();
      }
    } else {
      res.status(500).send('No audio data stream available');
    }
  } catch (err: any) {
    console.error('Audio proxy streaming error:', err);
    res.status(502).send('Error connecting to remote HTTP radio server.');
  }
});

// GET /api/stations (public)
router.get('/', async (req: Request, res: Response): Promise<void> => {
  try {
    const { type, featured, include_inactive } = req.query;

    let sql = `SELECT * FROM stations WHERE 1=1`;
    const params: any[] = [];

    if (include_inactive !== 'true') {
      sql += ` AND is_active = true`;
    }

    if (type && typeof type === 'string') {
      params.push(type.toUpperCase());
      sql += ` AND station_type = $${params.length}`;
    }

    if (featured === 'true') {
      sql += ` AND is_featured = true`;
    }

    sql += ` ORDER BY display_order ASC, created_at ASC;`;

    const result = await query(sql, params);
    res.json(result.rows);
  } catch (err: any) {
    console.error('Error fetching stations:', err);
    res.status(500).json({ error: 'Failed to fetch stations from database.' });
  }
});

// GET /api/stations/:slug (public)
router.get('/:slug', async (req: Request, res: Response): Promise<void> => {
  try {
    const { slug } = req.params;
    const result = await query(
      `SELECT * FROM stations WHERE slug = $1 OR id::text = $1 LIMIT 1;`,
      [slug]
    );

    if (result.rows.length === 0) {
      res.status(404).json({ error: 'Station not found.' });
      return;
    }

    res.json(result.rows[0]);
  } catch (err: any) {
    console.error('Error fetching station by slug:', err);
    res.status(500).json({ error: 'Failed to fetch station details.' });
  }
});

// POST /api/stations (admin only)
router.post('/', requireAdmin, async (req: Request, res: Response): Promise<void> => {
  try {
    const {
      name,
      slug,
      description,
      logo_url,
      stream_url,
      stream_type,
      station_type,
      location,
      frequency,
      accent_color,
      is_active,
      is_featured,
      display_order,
    } = req.body;

    if (!name || !stream_url) {
      res.status(400).json({ error: 'Station name and stream URL are required.' });
      return;
    }

    const finalSlug = slug ? slugify(slug) : slugify(name);

    const result = await query(
      `INSERT INTO stations (
        name, slug, description, logo_url, stream_url, stream_type, station_type,
        location, frequency, accent_color, is_active, is_featured, display_order, status
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, 'ONLINE')
      RETURNING *;`,
      [
        name,
        finalSlug,
        description || '',
        logo_url || '/logo.png',
        stream_url,
        stream_type || (station_type === 'TV' ? 'HLS' : 'AUDIO'),
        station_type || 'RADIO',
        location || '',
        frequency || '',
        accent_color || '#0284c7',
        is_active !== undefined ? is_active : true,
        is_featured !== undefined ? is_featured : false,
        display_order || 0,
      ]
    );

    res.status(201).json(result.rows[0]);
  } catch (err: any) {
    console.error('Error creating station:', err);
    if (err.code === '23505') {
      res.status(400).json({ error: 'A station with this slug or name already exists.' });
      return;
    }
    res.status(500).json({ error: 'Failed to create station in database.' });
  }
});

// PUT /api/stations/:id (admin only)
router.put('/:id', requireAdmin, async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const {
      name,
      slug,
      description,
      logo_url,
      stream_url,
      stream_type,
      station_type,
      location,
      frequency,
      accent_color,
      is_active,
      is_featured,
      display_order,
      status,
    } = req.body;

    const existing = await query(`SELECT id FROM stations WHERE id = $1;`, [id]);
    if (existing.rows.length === 0) {
      res.status(404).json({ error: 'Station not found.' });
      return;
    }

    const result = await query(
      `UPDATE stations SET
        name = COALESCE($1, name),
        slug = COALESCE($2, slug),
        description = COALESCE($3, description),
        logo_url = COALESCE($4, logo_url),
        stream_url = COALESCE($5, stream_url),
        stream_type = COALESCE($6, stream_type),
        station_type = COALESCE($7, station_type),
        location = COALESCE($8, location),
        frequency = COALESCE($9, frequency),
        accent_color = COALESCE($10, accent_color),
        is_active = COALESCE($11, is_active),
        is_featured = COALESCE($12, is_featured),
        display_order = COALESCE($13, display_order),
        status = COALESCE($14, status),
        updated_at = NOW()
      WHERE id = $15
      RETURNING *;`,
      [
        name,
        slug ? slugify(slug) : undefined,
        description,
        logo_url,
        stream_url,
        stream_type,
        station_type,
        location,
        frequency,
        accent_color,
        is_active,
        is_featured,
        display_order,
        status,
        id,
      ]
    );

    res.json(result.rows[0]);
  } catch (err: any) {
    console.error('Error updating station:', err);
    res.status(500).json({ error: 'Failed to update station.' });
  }
});

// DELETE /api/stations/:id (admin only)
router.delete('/:id', requireAdmin, async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const result = await query(`DELETE FROM stations WHERE id = $1 RETURNING id;`, [id]);
    if (result.rows.length === 0) {
      res.status(404).json({ error: 'Station not found.' });
      return;
    }
    res.json({ message: 'Station deleted successfully.', id });
  } catch (err: any) {
    console.error('Error deleting station:', err);
    res.status(500).json({ error: 'Failed to delete station.' });
  }
});

// POST /api/stations/test-url (stream diagnostics tool)
router.post('/test-url', async (req: Request, res: Response): Promise<void> => {
  const { url } = req.body;
  if (!url) {
    res.status(400).json({ error: 'Stream URL is required.' });
    return;
  }

  const startTime = Date.now();
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 6000);

    const response = await fetch(url, {
      method: 'GET',
      headers: { Range: 'bytes=0-1024' },
      signal: controller.signal,
    });
    clearTimeout(timeout);

    const responseTimeMs = Date.now() - startTime;
    const contentType = response.headers.get('content-type') || 'Unknown';
    const isSuccess = response.ok || response.status === 206 || response.status === 200;

    let formatGuess = 'Unknown';
    if (url.includes('.m3u8') || contentType.includes('mpegurl') || contentType.includes('application/x-mpegURL')) {
      formatGuess = 'HLS (m3u8)';
    } else if (contentType.includes('audio/mpeg') || contentType.includes('audio/mp3') || url.endsWith('.mp3')) {
      formatGuess = 'Audio/MP3';
    } else if (contentType.includes('audio/aac') || contentType.includes('audio/aacp')) {
      formatGuess = 'Audio/AAC';
    } else if (contentType.includes('audio')) {
      formatGuess = 'HTML5 Audio';
    }

    res.json({
      reachable: isSuccess,
      status: response.status,
      statusText: response.statusText,
      contentType,
      detectedFormat: formatGuess,
      responseTimeMs,
      message: isSuccess
        ? '✓ Stream reachable and responding'
        : `⚠️ Stream responded with HTTP status ${response.status}`,
    });
  } catch (error: any) {
    const responseTimeMs = Date.now() - startTime;
    res.json({
      reachable: false,
      status: 0,
      contentType: 'N/A',
      detectedFormat: 'Unknown',
      responseTimeMs,
      error: error.message || 'Connection failed or timed out.',
      message: '✕ Stream unreachable or connection timed out.',
    });
  }
});

export default router;
