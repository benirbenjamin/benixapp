import express from 'express';
import { query } from '../config/db.js';
import { authenticateToken, verifyStationAccess } from '../middleware/auth.js';
import { calculateOnAirPrograms } from '../utils/scheduleHelper.js';

const router = express.Router();

// GET /api/stations/:stationId/programs
router.get('/:stationId/programs', async (req, res) => {
  try {
    const { stationId } = req.params;
    const result = await query(`
      SELECT * FROM programs 
      WHERE station_id = $1 
      ORDER BY start_time ASC
    `, [stationId]);

    res.json(result.rows);
  } catch (err) {
    console.error('[Programs] Error fetching programs:', err);
    res.status(500).json({ error: 'Failed to fetch radio programs.' });
  }
});

// GET /api/stations/:stationId/programs/on-air
router.get('/:stationId/programs/on-air', async (req, res) => {
  try {
    const { stationId } = req.params;
    const programsRes = await query(`
      SELECT * FROM programs 
      WHERE station_id = $1 AND status = 'active'
    `, [stationId]);

    const settingsRes = await query(`SELECT timezone FROM station_settings WHERE station_id = $1`, [stationId]);
    const timezone = settingsRes.rows[0]?.timezone || 'Africa/Kigali';

    const onAirData = calculateOnAirPrograms(programsRes.rows, timezone);
    res.json(onAirData);
  } catch (err) {
    console.error('[Programs] Error calculating on-air:', err);
    res.status(500).json({ error: 'Failed to calculate on-air schedule.' });
  }
});

// POST /api/stations/:stationId/programs
router.post('/:stationId/programs', authenticateToken, verifyStationAccess, async (req, res) => {
  try {
    const { stationId } = req.params;
    const {
      title,
      presenter,
      description,
      image_url,
      days_of_week,
      start_time,
      end_time,
      status,
      show_on_homepage
    } = req.body;

    if (!title || !presenter || !start_time || !end_time) {
      return res.status(400).json({ error: 'Title, presenter, start time, and end time are required.' });
    }

    const programId = `prog-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;
    const daysJson = typeof days_of_week === 'string' ? days_of_week : JSON.stringify(days_of_week || ['Monday']);

    await query(`
      INSERT INTO programs (
        id, station_id, title, presenter, description, image_url,
        days_of_week, start_time, end_time, status, show_on_homepage
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
    `, [
      programId,
      stationId,
      title.trim(),
      presenter.trim(),
      description ? description.trim() : null,
      image_url ? image_url.trim() : null,
      daysJson,
      start_time.trim(),
      end_time.trim(),
      status === 'disabled' ? 'disabled' : 'active',
      show_on_homepage !== undefined ? Boolean(show_on_homepage) : true
    ]);

    const created = await query(`SELECT * FROM programs WHERE id = $1`, [programId]);
    res.status(201).json(created.rows[0]);
  } catch (err) {
    console.error('[Programs] Error creating program:', err);
    res.status(500).json({ error: 'Failed to add program.' });
  }
});

// PUT /api/stations/:stationId/programs/:programId
router.put('/:stationId/programs/:programId', authenticateToken, verifyStationAccess, async (req, res) => {
  try {
    const { stationId, programId } = req.params;
    const {
      title,
      presenter,
      description,
      image_url,
      days_of_week,
      start_time,
      end_time,
      status,
      show_on_homepage
    } = req.body;

    if (!title || !presenter || !start_time || !end_time) {
      return res.status(400).json({ error: 'Title, presenter, start time, and end time are required.' });
    }

    const daysJson = typeof days_of_week === 'string' ? days_of_week : JSON.stringify(days_of_week || ['Monday']);

    await query(`
      UPDATE programs
      SET title = $1, presenter = $2, description = $3, image_url = $4,
          days_of_week = $5, start_time = $6, end_time = $7, status = $8,
          show_on_homepage = $9
      WHERE id = $10 AND station_id = $11
    `, [
      title.trim(),
      presenter.trim(),
      description ? description.trim() : null,
      image_url ? image_url.trim() : null,
      daysJson,
      start_time.trim(),
      end_time.trim(),
      status === 'disabled' ? 'disabled' : 'active',
      show_on_homepage !== undefined ? Boolean(show_on_homepage) : true,
      programId,
      stationId
    ]);

    const updated = await query(`SELECT * FROM programs WHERE id = $1`, [programId]);
    res.json(updated.rows[0]);
  } catch (err) {
    console.error('[Programs] Error updating program:', err);
    res.status(500).json({ error: 'Failed to update program.' });
  }
});

// DELETE /api/stations/:stationId/programs/:programId
router.delete('/:stationId/programs/:programId', authenticateToken, verifyStationAccess, async (req, res) => {
  try {
    const { stationId, programId } = req.params;
    await query(`DELETE FROM programs WHERE id = $1 AND station_id = $2`, [programId, stationId]);
    res.json({ message: 'Program deleted successfully.' });
  } catch (err) {
    console.error('[Programs] Error deleting program:', err);
    res.status(500).json({ error: 'Failed to delete program.' });
  }
});

export default router;
