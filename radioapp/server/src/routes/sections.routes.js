import express from 'express';
import { query } from '../config/db.js';
import { authenticateToken, verifyStationAccess } from '../middleware/auth.js';

const router = express.Router();

// GET /api/stations/:stationId/sections
router.get('/:stationId/sections', async (req, res) => {
  try {
    const { stationId } = req.params;
    let result = await query(`SELECT * FROM homepage_sections WHERE station_id = $1`, [stationId]);

    if (result.rows.length === 0) {
      // Auto-create default
      const secId = `sec-${Date.now()}`;
      await query(`
        INSERT INTO homepage_sections (id, station_id, player_enabled, on_air_enabled, programs_enabled, news_enabled, videos_enabled, about_enabled, social_enabled, contact_enabled)
        VALUES ($1, $2, true, true, true, true, true, true, true, true)
      `, [secId, stationId]);
      result = await query(`SELECT * FROM homepage_sections WHERE id = $1`, [secId]);
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error('[Sections] Error fetching sections:', err);
    res.status(500).json({ error: 'Failed to fetch homepage sections.' });
  }
});

// PUT /api/stations/:stationId/sections
router.put('/:stationId/sections', authenticateToken, verifyStationAccess, async (req, res) => {
  try {
    const { stationId } = req.params;
    const {
      player_enabled,
      on_air_enabled,
      programs_enabled,
      news_enabled,
      videos_enabled,
      about_enabled,
      social_enabled,
      contact_enabled
    } = req.body;

    await query(`
      UPDATE homepage_sections
      SET player_enabled = $1,
          on_air_enabled = $2,
          programs_enabled = $3,
          news_enabled = $4,
          videos_enabled = $5,
          about_enabled = $6,
          social_enabled = $7,
          contact_enabled = $8,
          updated_at = CURRENT_TIMESTAMP
      WHERE station_id = $9
    `, [
      Boolean(player_enabled),
      Boolean(on_air_enabled),
      Boolean(programs_enabled),
      Boolean(news_enabled),
      Boolean(videos_enabled),
      Boolean(about_enabled),
      Boolean(social_enabled),
      Boolean(contact_enabled),
      stationId
    ]);

    const updated = await query(`SELECT * FROM homepage_sections WHERE station_id = $1`, [stationId]);
    res.json({ message: 'Homepage sections updated.', sections: updated.rows[0] });
  } catch (err) {
    console.error('[Sections] Error updating sections:', err);
    res.status(500).json({ error: 'Failed to update homepage sections.' });
  }
});

export default router;
