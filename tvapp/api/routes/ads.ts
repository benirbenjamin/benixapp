import { Router, Response } from 'express';
import { query } from '../db/pool.js';
import { requireAdmin, AuthenticatedRequest } from '../middleware/auth.js';
import crypto from 'crypto';

const router = Router();

// DEFAULT AD SETTINGS
const DEFAULT_AD_SETTINGS = {
  whatsapp_number: '+250783987223',
  google_ads_per_custom_ad: 2,
  enable_custom_ads: true,
  enable_google_adsense: true,
  default_share_expiry_hours: 168, // 7 days
  radio_ad_interval_seconds: 240, // 4 minutes throttle
  radio_ad_countdown_seconds: 10,
  tv_ad_initial_delay_seconds: 60, // 1 minute after start
  tv_ad_interval_seconds: 300, // 5 minutes interval
  tv_ad_countdown_seconds: 10,
};

// Helper: Get ad settings from site_settings table or fallback to default
async function getAdSettingsFromDb() {
  try {
    const res = await query(`SELECT value FROM site_settings WHERE key = 'ad_settings'`);
    if (res.rows.length > 0 && res.rows[0].value) {
      return { ...DEFAULT_AD_SETTINGS, ...res.rows[0].value };
    }
  } catch (e) {
    // Ignore error if table not ready
  }
  return DEFAULT_AD_SETTINGS;
}

// GET /api/ads (Public active custom ads & settings)
router.get('/', async (_req, res: Response): Promise<void> => {
  try {
    const settings = await getAdSettingsFromDb();

    const adsRes = await query(`
      SELECT 
        id, title, sponsor_name, owner_phone, category, tagline, description,
        cta_text, cta_url, media_type, banner_url, bg_gradient, accent_color,
        badge_text, status, start_date, end_date, impressions_count, clicks_count, created_at
      FROM custom_ads
      WHERE status = 'ACTIVE'
        AND (start_date IS NULL OR start_date <= NOW())
        AND (end_date IS NULL OR end_date >= NOW())
      ORDER BY created_at DESC
    `);

    res.json({
      success: true,
      settings,
      ads: adsRes.rows,
    });
  } catch (error: any) {
    console.error('Error fetching public ads:', error);
    res.json({
      success: true,
      settings: DEFAULT_AD_SETTINGS,
      ads: [],
    });
  }
});

// POST /api/ads/:id/event (Public endpoint to log impression or click)
router.post('/:id/event', async (req, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { event_type } = req.body; // 'IMPRESSION' | 'CLICK'

    if (!['IMPRESSION', 'CLICK'].includes(event_type)) {
      res.status(400).json({ error: 'Invalid event_type' });
      return;
    }

    const clientIp = (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress || '';

    // Record granular event log
    await query(
      `INSERT INTO ad_events (ad_id, event_type, ip_address) VALUES ($1, $2, $3)`,
      [id, event_type, clientIp]
    );

    // Update aggregate counters on custom_ads
    if (event_type === 'IMPRESSION') {
      await query(`UPDATE custom_ads SET impressions_count = impressions_count + 1 WHERE id = $1`, [id]);
    } else {
      await query(`UPDATE custom_ads SET clicks_count = clicks_count + 1 WHERE id = $1`, [id]);
    }

    res.json({ success: true });
  } catch (error: any) {
    console.error('Error recording ad event:', error);
    res.status(500).json({ error: 'Failed to record ad event' });
  }
});

// GET /api/ads/public-analytics/:token (Public analytics dashboard endpoint using share token)
router.get('/public-analytics/:token', async (req, res: Response): Promise<void> => {
  try {
    const { token } = req.params;

    const adRes = await query(
      `SELECT 
        id, title, sponsor_name, owner_phone, category, tagline, description,
        cta_text, cta_url, media_type, banner_url, bg_gradient, accent_color,
        badge_text, status, start_date, end_date, impressions_count, clicks_count,
        share_token, token_expires_at, created_at
      FROM custom_ads
      WHERE share_token = $1`,
      [token]
    );

    if (adRes.rows.length === 0) {
      res.status(404).json({ error: 'Ad analytics link not found or expired token.' });
      return;
    }

    const ad = adRes.rows[0];

    // Check expiration
    if (ad.token_expires_at && new Date(ad.token_expires_at) < new Date()) {
      res.status(410).json({ error: 'This analytics share link has expired.' });
      return;
    }

    // Daily breakdown for past 14 days
    const eventsRes = await query(
      `SELECT 
        TO_CHAR(created_at, 'YYYY-MM-DD') as date_label,
        COUNT(*) FILTER (WHERE event_type = 'IMPRESSION') as impressions,
        COUNT(*) FILTER (WHERE event_type = 'CLICK') as clicks
      FROM ad_events
      WHERE ad_id = $1 AND created_at >= NOW() - INTERVAL '14 days'
      GROUP BY TO_CHAR(created_at, 'YYYY-MM-DD')
      ORDER BY date_label ASC`,
      [ad.id]
    );

    res.json({
      success: true,
      ad,
      timeseries: eventsRes.rows,
    });
  } catch (error: any) {
    console.error('Error fetching public ad analytics:', error);
    res.status(500).json({ error: 'Failed to load ad analytics report.' });
  }
});

// --- ADMIN ROUTES ---

// GET /api/admin/ads (Admin list custom ads)
router.get('/admin', requireAdmin, async (_req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const adsRes = await query(`
      SELECT 
        id, title, sponsor_name, owner_phone, category, tagline, description,
        cta_text, cta_url, media_type, banner_url, bg_gradient, accent_color,
        badge_text, status, start_date, end_date, impressions_count, clicks_count,
        share_token, token_expires_at, created_at, updated_at
      FROM custom_ads
      ORDER BY created_at DESC
    `);

    const settings = await getAdSettingsFromDb();

    res.json({
      ads: adsRes.rows,
      settings,
    });
  } catch (error: any) {
    console.error('Error getting admin ads:', error);
    res.status(500).json({ error: 'Failed to retrieve custom ads' });
  }
});

// POST /api/admin/ads (Create a new custom ad)
router.post('/admin', requireAdmin, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const {
      title,
      sponsor_name,
      owner_phone,
      category = 'General',
      tagline = '',
      description = '',
      cta_text = 'Learn More',
      cta_url,
      media_type = 'IMAGE',
      banner_url = '',
      bg_gradient = 'from-blue-900 via-blue-800 to-slate-900',
      accent_color = '#0284c7',
      badge_text = 'Sponsored',
      status = 'ACTIVE',
      start_date,
      end_date,
      expiry_hours = 168,
    } = req.body;

    if (!title || !sponsor_name || !cta_url || !owner_phone) {
      res.status(400).json({ error: 'Title, sponsor_name, owner_phone, and cta_url are required.' });
      return;
    }

    const shareToken = crypto.randomBytes(16).toString('hex');
    let expiresAt: Date | null = null;

    if (expiry_hours && typeof expiry_hours === 'number' && expiry_hours > 0) {
      expiresAt = new Date(Date.now() + expiry_hours * 3600 * 1000);
    }

    const insertRes = await query(
      `INSERT INTO custom_ads (
        title, sponsor_name, owner_phone, category, tagline, description,
        cta_text, cta_url, media_type, banner_url, bg_gradient, accent_color,
        badge_text, status, start_date, end_date, share_token, token_expires_at
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18
      ) RETURNING *`,
      [
        title.trim(),
        sponsor_name.trim(),
        owner_phone.trim(),
        category.trim(),
        tagline.trim(),
        description.trim(),
        cta_text.trim(),
        cta_url.trim(),
        media_type,
        banner_url.trim(),
        bg_gradient,
        accent_color,
        badge_text.trim(),
        status,
        start_date || new Date(),
        end_date || null,
        shareToken,
        expiresAt,
      ]
    );

    res.status(201).json({
      success: true,
      ad: insertRes.rows[0],
    });
  } catch (error: any) {
    console.error('Error creating custom ad:', error);
    res.status(500).json({ error: 'Failed to create custom ad' });
  }
});

// PUT /api/admin/ads/:id (Update existing custom ad)
router.put('/admin/:id', requireAdmin, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const {
      title,
      sponsor_name,
      owner_phone,
      category,
      tagline,
      description,
      cta_text,
      cta_url,
      media_type,
      banner_url,
      bg_gradient,
      accent_color,
      badge_text,
      status,
      start_date,
      end_date,
    } = req.body;

    const updateRes = await query(
      `UPDATE custom_ads SET
        title = COALESCE($1, title),
        sponsor_name = COALESCE($2, sponsor_name),
        owner_phone = COALESCE($3, owner_phone),
        category = COALESCE($4, category),
        tagline = COALESCE($5, tagline),
        description = COALESCE($6, description),
        cta_text = COALESCE($7, cta_text),
        cta_url = COALESCE($8, cta_url),
        media_type = COALESCE($9, media_type),
        banner_url = COALESCE($10, banner_url),
        bg_gradient = COALESCE($11, bg_gradient),
        accent_color = COALESCE($12, accent_color),
        badge_text = COALESCE($13, badge_text),
        status = COALESCE($14, status),
        start_date = COALESCE($15, start_date),
        end_date = COALESCE($16, end_date),
        updated_at = NOW()
      WHERE id = $17
      RETURNING *`,
      [
        title,
        sponsor_name,
        owner_phone,
        category,
        tagline,
        description,
        cta_text,
        cta_url,
        media_type,
        banner_url,
        bg_gradient,
        accent_color,
        badge_text,
        status,
        start_date,
        end_date,
        id,
      ]
    );

    if (updateRes.rows.length === 0) {
      res.status(404).json({ error: 'Ad not found' });
      return;
    }

    res.json({
      success: true,
      ad: updateRes.rows[0],
    });
  } catch (error: any) {
    console.error('Error updating custom ad:', error);
    res.status(500).json({ error: 'Failed to update custom ad' });
  }
});

// POST /api/admin/ads/:id/share-token (Generate, refresh or revoke share token for public analytics link)
router.post('/admin/:id/share-token', requireAdmin, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { expiry_hours, revoke } = req.body;

    if (revoke) {
      const updateRes = await query(
        `UPDATE custom_ads SET share_token = NULL, token_expires_at = NOW() WHERE id = $1 RETURNING *`,
        [id]
      );
      res.json({ success: true, message: 'Share link revoked successfully', ad: updateRes.rows[0] });
      return;
    }

    const newToken = crypto.randomBytes(16).toString('hex');
    let expiresAt: Date | null = null;

    if (expiry_hours && typeof expiry_hours === 'number' && expiry_hours > 0) {
      expiresAt = new Date(Date.now() + expiry_hours * 3600 * 1000);
    }

    const updateRes = await query(
      `UPDATE custom_ads SET share_token = $1, token_expires_at = $2, updated_at = NOW() WHERE id = $3 RETURNING *`,
      [newToken, expiresAt, id]
    );

    res.json({
      success: true,
      ad: updateRes.rows[0],
    });
  } catch (error: any) {
    console.error('Error generating share token:', error);
    res.status(500).json({ error: 'Failed to update share link' });
  }
});

// DELETE /api/admin/ads/:id (Delete custom ad)
router.delete('/admin/:id', requireAdmin, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const delRes = await query(`DELETE FROM custom_ads WHERE id = $1 RETURNING id`, [id]);

    if (delRes.rows.length === 0) {
      res.status(404).json({ error: 'Ad not found' });
      return;
    }

    res.json({ success: true, message: 'Custom ad deleted successfully' });
  } catch (error: any) {
    console.error('Error deleting custom ad:', error);
    res.status(500).json({ error: 'Failed to delete custom ad' });
  }
});

// POST /api/admin/ads/settings (Update global ad rotation settings)
router.post('/admin/settings', requireAdmin, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const newSettings = req.body;

    const merged = { ...DEFAULT_AD_SETTINGS, ...newSettings };

    await query(
      `INSERT INTO site_settings (key, value, updated_at)
       VALUES ('ad_settings', $1::jsonb, NOW())
       ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = NOW()`,
      [JSON.stringify(merged)]
    );

    res.json({
      success: true,
      settings: merged,
    });
  } catch (error: any) {
    console.error('Error saving ad settings:', error);
    res.status(500).json({ error: 'Failed to save ad settings' });
  }
});

export default router;
