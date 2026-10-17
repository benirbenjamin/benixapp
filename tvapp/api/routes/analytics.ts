import { Router, Request, Response } from 'express';
import { query } from '../db/pool.js';
import { requireAdmin } from '../middleware/auth.js';
import { parseUserAgent } from '../middleware/visitor.js';

const router = Router();

// POST /api/analytics/event (public tracking endpoint)
router.post('/event', async (req: Request, res: Response): Promise<void> => {
  try {
    const {
      event_type,
      station_id,
      video_id,
      session_id,
      visitor_id,
      page_url,
      referrer,
    } = req.body;

    if (!event_type || !visitor_id || !session_id) {
      res.status(400).json({ error: 'Missing required analytics fields.' });
      return;
    }

    const ua = req.headers['user-agent'] || '';
    const { deviceType, browser, os } = parseUserAgent(ua);
    const country = (req.headers['x-vercel-ip-country'] as string) || (req.headers['cf-ipcountry'] as string) || 'Rwanda';

    // 1. Ensure Visitor exists (upsert)
    await query(
      `INSERT INTO visitors (id, first_seen_at, last_seen_at, device_type, browser, os, country)
       VALUES ($1, NOW(), NOW(), $2, $3, $4, $5)
       ON CONFLICT (id) DO UPDATE SET 
         last_seen_at = NOW(),
         device_type = EXCLUDED.device_type,
         browser = EXCLUDED.browser,
         os = EXCLUDED.os;`,
      [visitor_id, deviceType, browser, os, country]
    );

    // 2. Determine Traffic Source from Referrer
    let trafficSource = 'Direct';
    if (referrer) {
      if (/google|bing|yahoo|duckduckgo/i.test(referrer)) trafficSource = 'Google/Search';
      else if (/facebook|twitter|t\.co|instagram|linkedin|youtube|tiktok/i.test(referrer)) trafficSource = 'Social';
      else if (!referrer.includes('benix.space') && !referrer.includes('localhost') && !referrer.includes('rba.co.rw')) {
        trafficSource = 'Referral';
      }
    }

    // 3. Ensure Session exists (upsert)
    await query(
      `INSERT INTO sessions (id, visitor_id, started_at, ended_at, referrer, traffic_source)
       VALUES ($1, $2, NOW(), NOW(), $3, $4)
       ON CONFLICT (id) DO UPDATE SET ended_at = NOW();`,
      [session_id, visitor_id, referrer || '', trafficSource]
    );

    // 4. If PAGE_VIEW, log into page_views
    if (event_type === 'PAGE_VIEW') {
      const pagePath = page_url ? new URL(page_url, 'https://rba.benix.space').pathname : '/';
      await query(
        `INSERT INTO page_views (session_id, visitor_id, page_path, created_at)
         VALUES ($1, $2, $3, NOW());`,
        [session_id, visitor_id, pagePath]
      );
    }

    // 5. Deduplication check for media plays (avoid spam clicks within 15 seconds)
    if (['RADIO_PLAY', 'TV_PLAY', 'VIDEO_PLAY', 'VIDEO_VIEW'].includes(event_type)) {
      const recent = await query(
        `SELECT id FROM media_events
         WHERE event_type = $1 AND session_id = $2 
           AND (station_id = $3 OR ($3 IS NULL AND station_id IS NULL))
           AND (video_id = $4 OR ($4 IS NULL AND video_id IS NULL))
           AND created_at > NOW() - INTERVAL '15 seconds'
         LIMIT 1;`,
        [event_type, session_id, station_id || null, video_id || null]
      );

      if (recent.rows.length > 0) {
        res.json({ status: 'deduplicated' });
        return;
      }
    }

    // 6. Record Media Event
    await query(
      `INSERT INTO media_events (
        event_type, station_id, video_id, session_id, visitor_id, page_url, device_type, created_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, NOW());`,
      [
        event_type,
        station_id || null,
        video_id || null,
        session_id,
        visitor_id,
        page_url || '',
        deviceType,
      ]
    );

    res.status(201).json({ status: 'recorded' });
  } catch (err: any) {
    console.error('Analytics event error:', err);
    res.status(500).json({ error: 'Failed to record analytics event.' });
  }
});

// GET /api/admin/analytics/overview (admin only)
router.get('/overview', requireAdmin, async (_req: Request, res: Response): Promise<void> => {
  try {
    // Queries for dashboard KPI cards
    const [
      totalVisitors,
      visitorsToday,
      visitorsYesterday,
      visitorsThisWeek,
      visitorsThisMonth,
      visitorsThisYear,
      radioPlaysToday,
      tvPlaysToday,
      videoViewsToday,
      totalPageViews,
    ] = await Promise.all([
      query(`SELECT COUNT(*) FROM visitors;`),
      query(`SELECT COUNT(DISTINCT visitor_id) FROM sessions WHERE started_at >= CURRENT_DATE;`),
      query(`SELECT COUNT(DISTINCT visitor_id) FROM sessions WHERE started_at >= CURRENT_DATE - INTERVAL '1 day' AND started_at < CURRENT_DATE;`),
      query(`SELECT COUNT(DISTINCT visitor_id) FROM sessions WHERE started_at >= DATE_TRUNC('week', CURRENT_DATE);`),
      query(`SELECT COUNT(DISTINCT visitor_id) FROM sessions WHERE started_at >= DATE_TRUNC('month', CURRENT_DATE);`),
      query(`SELECT COUNT(DISTINCT visitor_id) FROM sessions WHERE started_at >= DATE_TRUNC('year', CURRENT_DATE);`),
      query(`SELECT COUNT(*) FROM media_events WHERE event_type = 'RADIO_PLAY' AND created_at >= CURRENT_DATE;`),
      query(`SELECT COUNT(*) FROM media_events WHERE event_type = 'TV_PLAY' AND created_at >= CURRENT_DATE;`),
      query(`SELECT COUNT(*) FROM media_events WHERE event_type IN ('VIDEO_PLAY', 'VIDEO_VIEW') AND created_at >= CURRENT_DATE;`),
      query(`SELECT COUNT(*) FROM page_views;`),
    ]);

    res.json({
      totalVisitors: parseInt(totalVisitors.rows[0].count, 10),
      visitorsToday: parseInt(visitorsToday.rows[0].count, 10),
      visitorsYesterday: parseInt(visitorsYesterday.rows[0].count, 10),
      visitorsThisWeek: parseInt(visitorsThisWeek.rows[0].count, 10),
      visitorsThisMonth: parseInt(visitorsThisMonth.rows[0].count, 10),
      visitorsThisYear: parseInt(visitorsThisYear.rows[0].count, 10),
      radioPlaysToday: parseInt(radioPlaysToday.rows[0].count, 10),
      tvPlaysToday: parseInt(tvPlaysToday.rows[0].count, 10),
      videoViewsToday: parseInt(videoViewsToday.rows[0].count, 10),
      totalPageViews: parseInt(totalPageViews.rows[0].count, 10),
    });
  } catch (err: any) {
    console.error('Analytics overview error:', err);
    res.status(500).json({ error: 'Failed to fetch analytics overview.' });
  }
});

// GET /api/admin/analytics/charts (admin only with date filtering)
router.get('/charts', requireAdmin, async (req: Request, res: Response): Promise<void> => {
  try {
    const { range = '7d', startDate, endDate } = req.query;

    let timeFilter = `created_at >= NOW() - INTERVAL '7 days'`;
    let sessionTimeFilter = `started_at >= NOW() - INTERVAL '7 days'`;

    if (range === 'today') {
      timeFilter = `created_at >= CURRENT_DATE`;
      sessionTimeFilter = `started_at >= CURRENT_DATE`;
    } else if (range === 'yesterday') {
      timeFilter = `created_at >= CURRENT_DATE - INTERVAL '1 day' AND created_at < CURRENT_DATE`;
      sessionTimeFilter = `started_at >= CURRENT_DATE - INTERVAL '1 day' AND started_at < CURRENT_DATE`;
    } else if (range === '30d') {
      timeFilter = `created_at >= NOW() - INTERVAL '30 days'`;
      sessionTimeFilter = `started_at >= NOW() - INTERVAL '30 days'`;
    } else if (range === 'this_month') {
      timeFilter = `created_at >= DATE_TRUNC('month', CURRENT_DATE)`;
      sessionTimeFilter = `started_at >= DATE_TRUNC('month', CURRENT_DATE)`;
    } else if (range === 'year') {
      timeFilter = `created_at >= DATE_TRUNC('year', CURRENT_DATE)`;
      sessionTimeFilter = `started_at >= DATE_TRUNC('year', CURRENT_DATE)`;
    } else if (range === 'custom' && startDate && endDate) {
      timeFilter = `created_at >= '${startDate}'::timestamp AND created_at <= '${endDate}'::timestamp`;
      sessionTimeFilter = `started_at >= '${startDate}'::timestamp AND started_at <= '${endDate}'::timestamp`;
    }

    // 1. Time-series data (grouped by date)
    const timeseries = await query(`
      SELECT 
        TO_CHAR(d.date, 'YYYY-MM-DD') as date_label,
        COALESCE(p.page_views, 0) as page_views,
        COALESCE(r.radio_plays, 0) as radio_plays,
        COALESCE(t.tv_plays, 0) as tv_plays,
        COALESCE(v.video_views, 0) as video_views
      FROM (
        SELECT generate_series(
          (NOW() - INTERVAL '6 days')::date,
          NOW()::date,
          '1 day'::interval
        )::date as date
      ) d
      LEFT JOIN (
        SELECT created_at::date as dt, COUNT(*) as page_views
        FROM page_views
        WHERE ${timeFilter}
        GROUP BY dt
      ) p ON d.date = p.dt
      LEFT JOIN (
        SELECT created_at::date as dt, COUNT(*) as radio_plays
        FROM media_events
        WHERE event_type = 'RADIO_PLAY' AND ${timeFilter}
        GROUP BY dt
      ) r ON d.date = r.dt
      LEFT JOIN (
        SELECT created_at::date as dt, COUNT(*) as tv_plays
        FROM media_events
        WHERE event_type = 'TV_PLAY' AND ${timeFilter}
        GROUP BY dt
      ) t ON d.date = t.dt
      LEFT JOIN (
        SELECT created_at::date as dt, COUNT(*) as video_views
        FROM media_events
        WHERE event_type IN ('VIDEO_PLAY', 'VIDEO_VIEW') AND ${timeFilter}
        GROUP BY dt
      ) v ON d.date = v.dt
      ORDER BY d.date ASC;
    `);

    // 2. Traffic Sources
    const trafficSources = await query(`
      SELECT traffic_source as name, COUNT(*) as value
      FROM sessions
      WHERE ${sessionTimeFilter}
      GROUP BY traffic_source
      ORDER BY value DESC;
    `);

    // 3. Devices
    const devices = await query(`
      SELECT COALESCE(device_type, 'Desktop') as name, COUNT(*) as value
      FROM visitors
      GROUP BY device_type
      ORDER BY value DESC;
    `);

    // 4. Browsers
    const browsers = await query(`
      SELECT COALESCE(browser, 'Other') as name, COUNT(*) as value
      FROM visitors
      GROUP BY browser
      ORDER BY value DESC LIMIT 5;
    `);

    // 5. Operating Systems
    const operatingSystems = await query(`
      SELECT COALESCE(os, 'Other') as name, COUNT(*) as value
      FROM visitors
      GROUP BY os
      ORDER BY value DESC LIMIT 5;
    `);

    // 6. Top Radio Stations
    const topStations = await query(`
      SELECT s.id, s.name, s.logo_url, s.frequency, COUNT(m.id) as plays
      FROM stations s
      JOIN media_events m ON s.id = m.station_id
      WHERE m.event_type = 'RADIO_PLAY' AND ${timeFilter.replace(/created_at/g, 'm.created_at')}
      GROUP BY s.id, s.name, s.logo_url, s.frequency
      ORDER BY plays DESC LIMIT 6;
    `);

    // 7. Top Videos
    const topVideos = await query(`
      SELECT v.id, v.title, v.thumbnail_url, v.views_count, COUNT(m.id) as recent_plays
      FROM videos v
      LEFT JOIN media_events m ON v.id = m.video_id AND m.event_type IN ('VIDEO_PLAY', 'VIDEO_VIEW')
      GROUP BY v.id, v.title, v.thumbnail_url, v.views_count
      ORDER BY recent_plays DESC, v.views_count DESC LIMIT 6;
    `);

    res.json({
      timeseries: timeseries.rows,
      trafficSources: trafficSources.rows,
      devices: devices.rows,
      browsers: browsers.rows,
      operatingSystems: operatingSystems.rows,
      topStations: topStations.rows,
      topVideos: topVideos.rows,
    });
  } catch (err: any) {
    console.error('Analytics charts error:', err);
    res.status(500).json({ error: 'Failed to fetch analytics chart metrics.' });
  }
});

// GET /api/admin/analytics/export (CSV export)
router.get('/export', requireAdmin, async (_req: Request, res: Response): Promise<void> => {
  try {
    const result = await query(`
      SELECT 
        m.id, 
        m.event_type, 
        COALESCE(s.name, v.title, 'General') as content_title,
        m.device_type, 
        m.page_url, 
        m.created_at
      FROM media_events m
      LEFT JOIN stations s ON m.station_id = s.id
      LEFT JOIN videos v ON m.video_id = v.id
      ORDER BY m.created_at DESC LIMIT 5000;
    `);

    let csv = 'ID,Event Type,Content Title,Device Type,Page URL,Timestamp\n';
    for (const row of result.rows) {
      const title = (row.content_title || '').replace(/"/g, '""');
      const url = (row.page_url || '').replace(/"/g, '""');
      csv += `"${row.id}","${row.event_type}","${title}","${row.device_type}","${url}","${row.created_at}"\n`;
    }

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename=rba-analytics-${Date.now()}.csv`);
    res.send(csv);
  } catch (err: any) {
    console.error('Export error:', err);
    res.status(500).send('Failed to export CSV');
  }
});

export default router;
