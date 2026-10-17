import express from 'express';
import { query } from '../config/db.js';
import { authenticateToken, verifyStationAccess } from '../middleware/auth.js';

const router = express.Router();

// GET /api/stations/:stationId/streams
router.get('/:stationId/streams', async (req, res) => {
  try {
    const { stationId } = req.params;
    const result = await query(`
      SELECT * FROM radio_streams 
      WHERE station_id = $1 
      ORDER BY is_default DESC, created_at ASC
    `, [stationId]);

    res.json(result.rows);
  } catch (err) {
    console.error('[Streams] Error fetching streams:', err);
    res.status(500).json({ error: 'Failed to fetch radio streams.' });
  }
});

// POST /api/stations/:stationId/streams
router.post('/:stationId/streams', authenticateToken, verifyStationAccess, async (req, res) => {
  try {
    const { stationId } = req.params;
    const { name, stream_url, description, is_default, status } = req.body;

    if (!name || !stream_url) {
      return res.status(400).json({ error: 'Stream name and Stream URL are required.' });
    }

    const streamId = `stream-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;
    const shouldBeDefault = Boolean(is_default);

    // If new stream is default, clear existing defaults
    if (shouldBeDefault) {
      await query(`UPDATE radio_streams SET is_default = false WHERE station_id = $1`, [stationId]);
    }

    await query(`
      INSERT INTO radio_streams (id, station_id, name, stream_url, description, is_default, status)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
    `, [
      streamId,
      stationId,
      name.trim(),
      stream_url.trim(),
      description ? description.trim() : null,
      shouldBeDefault,
      status === 'disabled' ? 'disabled' : 'active'
    ]);

    const created = await query(`SELECT * FROM radio_streams WHERE id = $1`, [streamId]);
    res.status(201).json(created.rows[0]);
  } catch (err) {
    console.error('[Streams] Error creating stream:', err);
    res.status(500).json({ error: 'Failed to add radio stream.' });
  }
});

// PUT /api/stations/:stationId/streams/:streamId
router.put('/:stationId/streams/:streamId', authenticateToken, verifyStationAccess, async (req, res) => {
  try {
    const { stationId, streamId } = req.params;
    const { name, stream_url, description, is_default, status } = req.body;

    if (!name || !stream_url) {
      return res.status(400).json({ error: 'Stream name and Stream URL are required.' });
    }

    const shouldBeDefault = Boolean(is_default);

    if (shouldBeDefault) {
      await query(`UPDATE radio_streams SET is_default = false WHERE station_id = $1`, [stationId]);
    }

    await query(`
      UPDATE radio_streams 
      SET name = $1, stream_url = $2, description = $3, is_default = $4, status = $5
      WHERE id = $6 AND station_id = $7
    `, [
      name.trim(),
      stream_url.trim(),
      description ? description.trim() : null,
      shouldBeDefault,
      status === 'disabled' ? 'disabled' : 'active',
      streamId,
      stationId
    ]);

    const updated = await query(`SELECT * FROM radio_streams WHERE id = $1`, [streamId]);
    res.json(updated.rows[0]);
  } catch (err) {
    console.error('[Streams] Error updating stream:', err);
    res.status(500).json({ error: 'Failed to update radio stream.' });
  }
});

// DELETE /api/stations/:stationId/streams/:streamId
router.delete('/:stationId/streams/:streamId', authenticateToken, verifyStationAccess, async (req, res) => {
  try {
    const { stationId, streamId } = req.params;
    await query(`DELETE FROM radio_streams WHERE id = $1 AND station_id = $2`, [streamId, stationId]);
    res.json({ message: 'Stream deleted successfully.' });
  } catch (err) {
    console.error('[Streams] Error deleting stream:', err);
    res.status(500).json({ error: 'Failed to delete radio stream.' });
  }
});

export default router;
