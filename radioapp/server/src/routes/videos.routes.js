import express from 'express';
import { query } from '../config/db.js';
import { authenticateToken, verifyStationAccess } from '../middleware/auth.js';
import { extractYouTubeId } from '../utils/youtubeHelper.js';

const router = express.Router();

// GET /api/stations/:stationId/videos
router.get('/:stationId/videos', async (req, res) => {
  try {
    const { stationId } = req.params;
    const { status } = req.query;

    let sql = `SELECT * FROM videos WHERE station_id = $1`;
    const params = [stationId];

    if (status && status !== 'all') {
      params.push(status);
      sql += ` AND status = $2`;
    }

    sql += ` ORDER BY created_at DESC`;
    const result = await query(sql, params);

    res.json(result.rows);
  } catch (err) {
    console.error('[Videos] Error fetching videos:', err);
    res.status(500).json({ error: 'Failed to fetch videos.' });
  }
});

// POST /api/stations/:stationId/videos
router.post('/:stationId/videos', authenticateToken, verifyStationAccess, async (req, res) => {
  try {
    const { stationId } = req.params;
    const { title, youtube_url, description, status, show_on_homepage } = req.body;

    if (!title || !youtube_url) {
      return res.status(400).json({ error: 'Video title and YouTube URL are required.' });
    }

    const videoId = extractYouTubeId(youtube_url);
    if (!videoId) {
      return res.status(400).json({ error: 'Invalid YouTube URL. Please provide a valid YouTube video link.' });
    }

    const newId = `vid-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;

    await query(`
      INSERT INTO videos (id, station_id, title, youtube_url, video_id, description, status, show_on_homepage)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
    `, [
      newId,
      stationId,
      title.trim(),
      youtube_url.trim(),
      videoId,
      description ? description.trim() : null,
      status === 'disabled' ? 'disabled' : 'active',
      show_on_homepage !== undefined ? Boolean(show_on_homepage) : true
    ]);

    const created = await query(`SELECT * FROM videos WHERE id = $1`, [newId]);
    res.status(201).json(created.rows[0]);
  } catch (err) {
    console.error('[Videos] Error adding video:', err);
    res.status(500).json({ error: 'Failed to add YouTube video.' });
  }
});

// PUT /api/stations/:stationId/videos/:videoId
router.put('/:stationId/videos/:videoId', authenticateToken, verifyStationAccess, async (req, res) => {
  try {
    const { stationId, videoId } = req.params;
    const { title, youtube_url, description, status, show_on_homepage } = req.body;

    if (!title || !youtube_url) {
      return res.status(400).json({ error: 'Video title and YouTube URL are required.' });
    }

    const parsedVideoId = extractYouTubeId(youtube_url);
    if (!parsedVideoId) {
      return res.status(400).json({ error: 'Invalid YouTube URL. Please provide a valid YouTube video link.' });
    }

    await query(`
      UPDATE videos
      SET title = $1, youtube_url = $2, video_id = $3, description = $4,
          status = $5, show_on_homepage = $6
      WHERE id = $7 AND station_id = $8
    `, [
      title.trim(),
      youtube_url.trim(),
      parsedVideoId,
      description ? description.trim() : null,
      status === 'disabled' ? 'disabled' : 'active',
      show_on_homepage !== undefined ? Boolean(show_on_homepage) : true,
      videoId,
      stationId
    ]);

    const updated = await query(`SELECT * FROM videos WHERE id = $1`, [videoId]);
    res.json(updated.rows[0]);
  } catch (err) {
    console.error('[Videos] Error updating video:', err);
    res.status(500).json({ error: 'Failed to update video.' });
  }
});

// DELETE /api/stations/:stationId/videos/:videoId
router.delete('/:stationId/videos/:videoId', authenticateToken, verifyStationAccess, async (req, res) => {
  try {
    const { stationId, videoId } = req.params;
    await query(`DELETE FROM videos WHERE id = $1 AND station_id = $2`, [videoId, stationId]);
    res.json({ message: 'Video deleted successfully.' });
  } catch (err) {
    console.error('[Videos] Error deleting video:', err);
    res.status(500).json({ error: 'Failed to delete video.' });
  }
});

export default router;
