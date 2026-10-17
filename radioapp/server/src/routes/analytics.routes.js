import express from 'express';
import { query } from '../config/db.js';
import { authenticateToken, verifyStationAccess } from '../middleware/auth.js';
import { calculateAnalytics, normalizeTrafficSource } from '../utils/analyticsAggregator.js';

const router = express.Router();

/**
 * POST /api/stations/:stationId/analytics/session
 * Public endpoint to register or increment a visitor's session
 */
router.post('/:stationId/analytics/session', async (req, res) => {
  try {
    const { stationId } = req.params;
    const { session_id, traffic_source, referrer, device_type, browser, os, page_path } = req.body;

    if (!session_id) {
      return res.status(400).json({ error: 'session_id is required' });
    }

    const cleanSource = normalizeTrafficSource(traffic_source, referrer);
    const cleanDevice = device_type || 'Desktop';
    const nowIso = new Date().toISOString();

    // Check if session already registered for this station
    const existing = await query(`
      SELECT id, pageviews_count FROM analytics_sessions
      WHERE session_id = $1 AND station_id = $2
    `, [session_id, stationId]);

    if (existing.rows.length > 0) {
      // Increment pageview count
      await query(`
        UPDATE analytics_sessions
        SET pageviews_count = pageviews_count + 1,
            page_path = $1,
            updated_at = $2
        WHERE id = $3
      `, [page_path || '/', nowIso, existing.rows[0].id]);

      return res.json({ session_recorded: true, is_new: false });
    }

    // Insert new session
    const id = `as-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`;
    await query(`
      INSERT INTO analytics_sessions (
        id, station_id, session_id, traffic_source, referrer, device_type,
        browser, os, page_path, duration_seconds, is_listening, listening_seconds, pageviews_count,
        created_at, updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 0, false, 0, 1, $10, $11)
    `, [
      id, stationId, session_id, cleanSource, referrer || '', cleanDevice,
      browser || null, os || null, page_path || '/', nowIso, nowIso
    ]);

    res.status(201).json({ session_recorded: true, is_new: true });
  } catch (err) {
    console.error('[Analytics] Error recording session:', err);
    res.status(500).json({ error: 'Failed to record session' });
  }
});

/**
 * POST /api/stations/:stationId/analytics/ping
 * Heartbeat ping from client to track active time on site and audio listening time
 */
router.post('/:stationId/analytics/ping', async (req, res) => {
  try {
    const { stationId } = req.params;
    const { session_id, duration_increment = 20, is_listening = false, listening_increment = 0 } = req.body;

    if (!session_id) {
      return res.status(400).json({ error: 'session_id is required' });
    }

    const durInc = Math.min(120, Math.max(1, parseInt(duration_increment) || 20));
    const listenInc = is_listening ? Math.min(120, Math.max(0, parseInt(listening_increment) || durInc)) : 0;
    const nowIso = new Date().toISOString();

    const existing = await query(`
      SELECT id, duration_seconds, listening_seconds FROM analytics_sessions
      WHERE session_id = $1 AND station_id = $2
    `, [session_id, stationId]);

    if (existing.rows.length > 0) {
      const row = existing.rows[0];
      const newDur = (parseInt(row.duration_seconds) || 0) + durInc;
      const newListen = (parseInt(row.listening_seconds) || 0) + listenInc;

      await query(`
        UPDATE analytics_sessions
        SET duration_seconds = $1,
            listening_seconds = $2,
            is_listening = $3,
            updated_at = $4
        WHERE id = $5
      `, [newDur, newListen, Boolean(is_listening), nowIso, row.id]);

      return res.json({ ping_recorded: true, total_duration: newDur });
    }

    // If session row missing, insert basic row
    const id = `as-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`;
    await query(`
      INSERT INTO analytics_sessions (
        id, station_id, session_id, traffic_source, referrer, device_type,
        duration_seconds, is_listening, listening_seconds, pageviews_count, created_at, updated_at
      ) VALUES ($1, $2, $3, 'Direct', '', 'Desktop', $4, $5, $6, 1, $7, $8)
    `, [id, stationId, session_id, durInc, Boolean(is_listening), listenInc, nowIso, nowIso]);

    res.json({ ping_recorded: true, total_duration: durInc });
  } catch (err) {
    console.error('[Analytics] Error recording ping:', err);
    res.status(500).json({ error: 'Failed to record ping' });
  }
});

/**
 * POST /api/stations/:stationId/analytics/event
 * Public event logging (play, pause, error, article read, etc.)
 */
router.post('/:stationId/analytics/event', async (req, res) => {
  try {
    const { stationId } = req.params;
    const { event_type, event_data } = req.body;

    if (!event_type) {
      return res.status(400).json({ error: 'event_type is required' });
    }

    const eventId = `evt-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;
    const dataStr = typeof event_data === 'object' ? JSON.stringify(event_data) : (event_data || null);

    await query(`
      INSERT INTO analytics_events (id, station_id, event_type, event_data)
      VALUES ($1, $2, $3, $4)
    `, [eventId, stationId, event_type, dataStr]);

    res.status(201).json({ recorded: true });
  } catch (err) {
    console.error('[Analytics] Error logging event:', err);
    res.status(500).json({ error: 'Failed to record event' });
  }
});

/**
 * GET /api/stations/:stationId/analytics/stats
 * Station Admin telemetry with time filters: today, yesterday, week, month, year, custom
 */
router.get('/:stationId/analytics/stats', authenticateToken, verifyStationAccess, async (req, res) => {
  try {
    const { stationId } = req.params;
    const { period = 'week', startDate, endDate } = req.query;

    const analytics = await calculateAnalytics({
      stationId,
      period,
      startDate,
      endDate,
    });

    res.json(analytics);
  } catch (err) {
    console.error('[Analytics] Error fetching station stats:', err);
    res.status(500).json({ error: 'Failed to fetch analytics statistics.' });
  }
});

export default router;

