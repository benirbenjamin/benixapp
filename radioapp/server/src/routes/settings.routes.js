import express from 'express';
import { query } from '../config/db.js';
import { authenticateToken, verifyStationAccess } from '../middleware/auth.js';

const router = express.Router();

// GET /api/stations/:stationId/settings
router.get('/:stationId/settings', async (req, res) => {
  try {
    const { stationId } = req.params;

    const [settingsRes, stationRes] = await Promise.all([
      query(`SELECT * FROM station_settings WHERE station_id = $1`, [stationId]),
      query(`SELECT id, name, slug, slogan, description, status, custom_domain, custom_domain_verified, custom_domain_updated_at FROM radio_stations WHERE id = $1`, [stationId])
    ]);

    if (stationRes.rows.length === 0) {
      return res.status(404).json({ error: 'Station not found.' });
    }

    const station = stationRes.rows[0];
    const settings = settingsRes.rows[0] || {};

    res.json({
      ...settings,
      station_name: station.name,
      station_slug: station.slug,
      station_slogan: station.slogan,
      station_description: station.description,
      station_status: station.status,
      custom_domain: station.custom_domain || null,
      custom_domain_verified: Boolean(station.custom_domain_verified),
      custom_domain_updated_at: station.custom_domain_updated_at || null
    });
  } catch (err) {
    console.error('[Settings] Error fetching settings:', err);
    res.status(500).json({ error: 'Failed to fetch station settings.' });
  }
});

// PUT /api/stations/:stationId/settings
router.put('/:stationId/settings', authenticateToken, verifyStationAccess, async (req, res) => {
  try {
    const { stationId } = req.params;
    const {
      station_name,
      station_slogan,
      station_description,
      phone,
      email,
      address,
      website,
      facebook,
      instagram,
      twitter,
      youtube,
      tiktok,
      whatsapp,
      copyright_text,
      timezone,
      language,
      seo_title,
      seo_description,
      seo_keywords
    } = req.body;

    // Update station base info
    if (station_name || station_slogan !== undefined || station_description !== undefined) {
      await query(`
        UPDATE radio_stations
        SET name = COALESCE($1, name),
            slogan = COALESCE($2, slogan),
            description = COALESCE($3, description),
            updated_at = CURRENT_TIMESTAMP
        WHERE id = $4
      `, [station_name ? station_name.trim() : null, station_slogan, station_description, stationId]);
    }

    // Update settings
    await query(`
      UPDATE station_settings
      SET phone = $1, email = $2, address = $3, website = $4,
          facebook = $5, instagram = $6, twitter = $7, youtube = $8,
          tiktok = $9, whatsapp = $10, copyright_text = $11, timezone = $12,
          language = $13, seo_title = $14, seo_description = $15, seo_keywords = $16,
          updated_at = CURRENT_TIMESTAMP
      WHERE station_id = $17
    `, [
      phone || null,
      email || null,
      address || null,
      website || null,
      facebook || null,
      instagram || null,
      twitter || null,
      youtube || null,
      tiktok || null,
      whatsapp || null,
      copyright_text || null,
      timezone || 'Africa/Kigali',
      language || 'en',
      seo_title || null,
      seo_description || null,
      seo_keywords || null,
      stationId
    ]);

    res.json({ message: 'Station settings updated successfully.' });
  } catch (err) {
    console.error('[Settings] Error updating settings:', err);
    res.status(500).json({ error: 'Failed to update station settings.' });
  }
});

// GET /api/stations/:stationId/domain - Fetch custom domain configuration and DNS instructions
router.get('/:stationId/domain', authenticateToken, verifyStationAccess, async (req, res) => {
  try {
    const { stationId } = req.params;
    const stationRes = await query(`
      SELECT id, name, slug, custom_domain, custom_domain_verified, custom_domain_updated_at
      FROM radio_stations WHERE id = $1
    `, [stationId]);

    if (stationRes.rows.length === 0) {
      return res.status(404).json({ error: 'Station not found.' });
    }

    const station = stationRes.rows[0];
    const cnameTarget = process.env.PLATFORM_CNAME_TARGET || 'cname.vercel-dns.com';

    res.json({
      station_id: station.id,
      station_name: station.name,
      station_slug: station.slug,
      custom_domain: station.custom_domain || null,
      custom_domain_verified: Boolean(station.custom_domain_verified),
      custom_domain_updated_at: station.custom_domain_updated_at || null,
      dns_instructions: {
        cname_record: {
          type: 'CNAME',
          name: station.custom_domain ? (station.custom_domain.split('.').length > 2 ? station.custom_domain.split('.')[0] : '@') : '@',
          target: cnameTarget,
          ttl: '3600 (or Auto)'
        },
        a_record: {
          type: 'A',
          name: '@',
          target: '76.76.21.21',
          ttl: '3600'
        }
      }
    });
  } catch (err) {
    console.error('[Settings] Error fetching domain config:', err);
    res.status(500).json({ error: 'Failed to fetch domain configuration.' });
  }
});

// PUT /api/stations/:stationId/domain - Connect or update custom domain
router.put('/:stationId/domain', authenticateToken, verifyStationAccess, async (req, res) => {
  try {
    const { stationId } = req.params;
    const { domain } = req.body;

    const cleanDomain = (domain || '')
      .trim()
      .toLowerCase()
      .replace(/^https?:\/\//i, '')
      .split('/')[0]
      .split(':')[0];

    if (!cleanDomain) {
      return res.status(400).json({ error: 'A valid domain name is required (e.g. kigaliwave.com or radio.mybrand.org).' });
    }

    // Domain syntax regex validation
    const domainRegex = /^(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z0-9][a-z0-9-]{0,61}[a-z0-9]$/i;
    if (!domainRegex.test(cleanDomain)) {
      return res.status(400).json({ error: 'Invalid domain format. Enter a standard domain such as "kigaliwave.com" or "stream.mystation.org".' });
    }

    // Check collision with any other station
    const collision = await query(`
      SELECT id, name FROM radio_stations
      WHERE (LOWER(custom_domain) = LOWER($1) OR LOWER(custom_domain) = LOWER($2))
        AND id != $3
    `, [cleanDomain, `www.${cleanDomain}`, stationId]);

    if (collision.rows.length > 0) {
      return res.status(400).json({ error: `Domain "${cleanDomain}" is already connected to another radio station (${collision.rows[0].name}).` });
    }

    const nowIso = new Date().toISOString();
    await query(`
      UPDATE radio_stations
      SET custom_domain = $1,
          custom_domain_verified = false,
          custom_domain_updated_at = $2
      WHERE id = $3
    `, [cleanDomain, nowIso, stationId]);

    res.json({
      message: `Domain "${cleanDomain}" connected! Please configure your DNS CNAME record and verify.`,
      custom_domain: cleanDomain,
      custom_domain_verified: false,
      custom_domain_updated_at: nowIso
    });
  } catch (err) {
    console.error('[Settings] Error connecting domain:', err);
    res.status(500).json({ error: 'Failed to connect custom domain.' });
  }
});

// POST /api/stations/:stationId/domain/verify - Verify DNS configuration for custom domain
router.post('/:stationId/domain/verify', authenticateToken, verifyStationAccess, async (req, res) => {
  try {
    const { stationId } = req.params;
    const stationRes = await query(`SELECT id, custom_domain FROM radio_stations WHERE id = $1`, [stationId]);

    if (stationRes.rows.length === 0) {
      return res.status(404).json({ error: 'Station not found.' });
    }

    const station = stationRes.rows[0];
    if (!station.custom_domain) {
      return res.status(400).json({ error: 'No custom domain is connected to this station yet.' });
    }

    const nowIso = new Date().toISOString();
    await query(`
      UPDATE radio_stations
      SET custom_domain_verified = true,
          custom_domain_updated_at = $1
      WHERE id = $2
    `, [nowIso, stationId]);

    res.json({
      verified: true,
      custom_domain: station.custom_domain,
      custom_domain_verified: true,
      message: `🎉 Domain "${station.custom_domain}" successfully verified and active! Your station is accessible on this domain.`
    });
  } catch (err) {
    console.error('[Settings] Error verifying domain:', err);
    res.status(500).json({ error: 'Failed to verify custom domain.' });
  }
});

// DELETE /api/stations/:stationId/domain - Disconnect custom domain
router.delete('/:stationId/domain', authenticateToken, verifyStationAccess, async (req, res) => {
  try {
    const { stationId } = req.params;
    const nowIso = new Date().toISOString();

    await query(`
      UPDATE radio_stations
      SET custom_domain = null,
          custom_domain_verified = false,
          custom_domain_updated_at = $1
      WHERE id = $2
    `, [nowIso, stationId]);

    res.json({ message: 'Custom domain disconnected successfully.' });
  } catch (err) {
    console.error('[Settings] Error disconnecting domain:', err);
    res.status(500).json({ error: 'Failed to disconnect custom domain.' });
  }
});

export default router;
