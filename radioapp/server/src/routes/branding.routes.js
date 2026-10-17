import express from 'express';
import { query } from '../config/db.js';
import { authenticateToken, verifyStationAccess } from '../middleware/auth.js';
import { uploadLogo } from '../middleware/upload.js';

const router = express.Router();

// GET /api/stations/:stationId/branding
router.get('/:stationId/branding', async (req, res) => {
  try {
    const { stationId } = req.params;
    const result = await query(`SELECT * FROM station_branding WHERE station_id = $1`, [stationId]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Branding configuration not found.' });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error('[Branding] Error fetching branding:', err);
    res.status(500).json({ error: 'Failed to retrieve branding.' });
  }
});

// PUT /api/stations/:stationId/branding
router.put('/:stationId/branding', authenticateToken, verifyStationAccess, async (req, res) => {
  try {
    const { stationId } = req.params;
    const {
      theme,
      primary_color,
      secondary_color,
      accent_color,
      background_color,
      surface_color,
      text_color,
      muted_color,
      header_color,
      footer_color,
      font_family,
      custom_font_url,
      logo_url
    } = req.body;

    // Validate HEX colors (must match #RGB, #RRGGBB, or #RRGGBBAA if provided)
    const hexRegex = /^#([0-9A-Fa-f]{3}|[0-9A-Fa-f]{6}|[0-9A-Fa-f]{8})$/;
    const colors = [
      { name: 'Primary', val: primary_color },
      { name: 'Secondary', val: secondary_color },
      { name: 'Accent', val: accent_color },
      { name: 'Background', val: background_color },
      { name: 'Surface', val: surface_color },
      { name: 'Text', val: text_color },
      { name: 'Muted', val: muted_color },
      { name: 'Header', val: header_color },
      { name: 'Footer', val: footer_color },
    ];

    for (const c of colors) {
      if (c.val && !hexRegex.test(c.val)) {
        return res.status(400).json({ error: `Invalid ${c.name} color format. Must be a valid HEX color (e.g. #0066FF).` });
      }
    }

    // Update branding
    await query(`
      UPDATE station_branding
      SET theme = COALESCE($1, theme),
          primary_color = COALESCE($2, primary_color),
          secondary_color = COALESCE($3, secondary_color),
          accent_color = COALESCE($4, accent_color),
          background_color = COALESCE($5, background_color),
          surface_color = COALESCE($6, surface_color),
          text_color = COALESCE($7, text_color),
          muted_color = COALESCE($8, muted_color),
          header_color = COALESCE($9, header_color),
          footer_color = COALESCE($10, footer_color),
          font_family = COALESCE($11, font_family),
          custom_font_url = COALESCE($12, custom_font_url),
          logo_url = COALESCE($13, logo_url),
          updated_at = CURRENT_TIMESTAMP
      WHERE station_id = $14
    `, [
      theme,
      primary_color,
      secondary_color,
      accent_color,
      background_color,
      surface_color,
      text_color,
      muted_color,
      header_color,
      footer_color,
      font_family,
      custom_font_url,
      logo_url,
      stationId
    ]);

    const updated = await query(`SELECT * FROM station_branding WHERE station_id = $1`, [stationId]);
    res.json({ message: 'Branding updated successfully.', branding: updated.rows[0] });
  } catch (err) {
    console.error('[Branding] Error updating branding:', err);
    res.status(500).json({ error: 'Failed to update branding settings.' });
  }
});

// POST /api/stations/:stationId/branding/logo (Upload logo file or set logo URL)
router.post('/:stationId/branding/logo', authenticateToken, verifyStationAccess, (req, res, next) => {
  uploadLogo.single('logo')(req, res, (err) => {
    if (err) {
      return res.status(400).json({ error: err.message || 'File upload error.' });
    }
    next();
  });
}, async (req, res) => {
  try {
    const { stationId } = req.params;
    let logoUrl = null;

    if (req.file) {
      logoUrl = `/uploads/${req.file.filename}`;
    } else if (req.body.logo_url) {
      logoUrl = req.body.logo_url.trim();
    }

    if (!logoUrl) {
      return res.status(400).json({ error: 'Please select a logo file or provide a direct image URL.' });
    }

    await query(`
      UPDATE station_branding
      SET logo_url = $1, updated_at = CURRENT_TIMESTAMP
      WHERE station_id = $2
    `, [logoUrl, stationId]);

    res.json({ message: 'Logo updated successfully.', logo_url: logoUrl });
  } catch (err) {
    console.error('[Branding] Error uploading logo:', err);
    res.status(500).json({ error: 'Failed to upload station logo.' });
  }
});

// DELETE /api/stations/:stationId/branding/logo (Remove logo)
router.delete('/:stationId/branding/logo', authenticateToken, verifyStationAccess, async (req, res) => {
  try {
    const { stationId } = req.params;
    await query(`
      UPDATE station_branding
      SET logo_url = NULL, updated_at = CURRENT_TIMESTAMP
      WHERE station_id = $1
    `, [stationId]);

    res.json({ message: 'Station logo removed successfully.' });
  } catch (err) {
    console.error('[Branding] Error removing logo:', err);
    res.status(500).json({ error: 'Failed to remove station logo.' });
  }
});

export default router;
