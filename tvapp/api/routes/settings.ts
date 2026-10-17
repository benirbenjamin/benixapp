import { Router, Request, Response } from 'express';
import { query } from '../db/pool.js';
import { AuthenticatedRequest, requireAdmin } from '../middleware/auth.js';

const router = Router();

// GET /api/settings (public)
router.get('/', async (_req: Request, res: Response): Promise<void> => {
  try {
    const result = await query(`SELECT value FROM site_settings WHERE key = 'general' LIMIT 1;`);
    if (result.rows.length === 0) {
      res.json({
        site_name: 'Rwanda Broadcasting Agency (RBA)',
        site_description: "Rwanda's leading public service multimedia broadcaster. Stream RTV Live, KC2, and Radio Rwanda online anywhere.",
        logo_url: '/logo.png',
        contact_email: 'info@rba.co.rw',
        contact_phone: '+250 252 576 540',
        address: 'KG 7 Ave, Kacyiru, P.O. Box 83 Kigali - Rwanda',
        facebook_url: 'https://facebook.com/rba.rwanda',
        twitter_url: 'https://twitter.com/RBA_Rwanda',
        youtube_url: 'https://youtube.com/c/RwandaBroadcastingAgency',
        instagram_url: 'https://instagram.com/rba.rwanda',
        footer_text: '© ' + new Date().getFullYear() + ' Rwanda Broadcasting Agency (RBA). All rights reserved.',
      });
      return;
    }
    res.json(result.rows[0].value);
  } catch (err: any) {
    console.error('Settings error:', err);
    res.status(500).json({ error: 'Failed to fetch settings.' });
  }
});

// PUT /api/settings (Admin and Super Admin)
router.put('/', requireAdmin, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const newSettings = req.body;
    await query(
      `INSERT INTO site_settings (key, value, updated_at)
       VALUES ('general', $1, NOW())
       ON CONFLICT (key) DO UPDATE SET value = $1, updated_at = NOW();`,
      [JSON.stringify(newSettings)]
    );
    res.json({ message: 'Settings updated successfully.', settings: newSettings });
  } catch (err: any) {
    console.error('Update settings error:', err);
    res.status(500).json({ error: 'Failed to update settings.' });
  }
});

// GET /api/search (global search for stations, videos, categories)
router.get('/search/all', async (req: Request, res: Response): Promise<void> => {
  try {
    const q = ((req.query.q as string) || '').trim();
    if (!q) {
      res.json({ stations: [], videos: [], categories: [] });
      return;
    }

    const searchTerm = `%${q}%`;

    const [stationsRes, videosRes, categoriesRes] = await Promise.all([
      query(
        `SELECT id, name, slug, station_type, frequency, location, logo_url, accent_color 
         FROM stations 
         WHERE is_active = true AND (name ILIKE $1 OR description ILIKE $1 OR location ILIKE $1)
         ORDER BY display_order ASC LIMIT 10;`,
        [searchTerm]
      ),
      query(
        `SELECT v.id, v.title, v.slug, v.thumbnail_url, v.publication_date, c.name as category_name
         FROM videos v
         LEFT JOIN categories c ON v.category_id = c.id
         WHERE v.is_published = true AND (v.title ILIKE $1 OR v.description ILIKE $1)
         ORDER BY v.publication_date DESC LIMIT 12;`,
        [searchTerm]
      ),
      query(
        `SELECT id, name, slug 
         FROM categories 
         WHERE name ILIKE $1 
         ORDER BY display_order ASC LIMIT 5;`,
        [searchTerm]
      ),
    ]);

    res.json({
      stations: stationsRes.rows,
      videos: videosRes.rows,
      categories: categoriesRes.rows,
    });
  } catch (err: any) {
    console.error('Search error:', err);
    res.status(500).json({ error: 'Failed to perform search.' });
  }
});

export default router;
