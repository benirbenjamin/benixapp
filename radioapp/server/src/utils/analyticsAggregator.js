import { query } from '../config/db.js';

/**
 * Format duration in seconds into human-readable string (e.g., "5m 24s" or "2h 15m")
 */
export function formatDuration(seconds) {
  const s = Math.round(Math.max(0, Number(seconds) || 0));
  if (s < 60) return `${s}s`;
  const mins = Math.floor(s / 60);
  const remSec = s % 60;
  if (mins < 60) return `${mins}m ${remSec}s`;
  const hrs = Math.floor(mins / 60);
  const remMin = mins % 60;
  return `${hrs}h ${remMin}m`;
}

/**
 * Format short duration (e.g., "4.5m" or "1.2h")
 */
export function formatDurationCompact(seconds) {
  const s = Math.max(0, Number(seconds) || 0);
  if (s < 60) return `${Math.round(s)}s`;
  if (s < 3600) return `${(s / 60).toFixed(1)}m`;
  return `${(s / 3600).toFixed(1)}h`;
}

/**
 * Parse time filter period into concrete start, end, previousStart, previousEnd dates
 */
export function parseDateFilter(period = 'week', customStart, customEnd) {
  const now = new Date();
  let start = new Date();
  let end = new Date();
  let prevStart = new Date();
  let prevEnd = new Date();
  let groupBy = 'day'; // 'hour' | 'day' | 'month'

  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
  const todayEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);

  switch (period) {
    case 'today':
      start = todayStart;
      end = now;
      prevStart = new Date(todayStart.getTime() - 24 * 3600 * 1000);
      prevEnd = new Date(todayStart.getTime() - 1);
      groupBy = 'hour';
      break;

    case 'yesterday':
      start = new Date(todayStart.getTime() - 24 * 3600 * 1000);
      end = new Date(todayStart.getTime() - 1);
      prevStart = new Date(start.getTime() - 24 * 3600 * 1000);
      prevEnd = new Date(start.getTime() - 1);
      groupBy = 'hour';
      break;

    case 'week':
      start = new Date(now.getTime() - 7 * 24 * 3600 * 1000);
      end = now;
      prevStart = new Date(start.getTime() - 7 * 24 * 3600 * 1000);
      prevEnd = new Date(start.getTime() - 1);
      groupBy = 'day';
      break;

    case 'month':
      start = new Date(now.getTime() - 30 * 24 * 3600 * 1000);
      end = now;
      prevStart = new Date(start.getTime() - 30 * 24 * 3600 * 1000);
      prevEnd = new Date(start.getTime() - 1);
      groupBy = 'day';
      break;

    case 'year':
      start = new Date(now.getTime() - 365 * 24 * 3600 * 1000);
      end = now;
      prevStart = new Date(start.getTime() - 365 * 24 * 3600 * 1000);
      prevEnd = new Date(start.getTime() - 1);
      groupBy = 'month';
      break;

    case 'custom':
      if (customStart) {
        start = new Date(customStart);
        if (isNaN(start.getTime())) start = new Date(now.getTime() - 7 * 24 * 3600 * 1000);
      } else {
        start = new Date(now.getTime() - 7 * 24 * 3600 * 1000);
      }

      if (customEnd) {
        end = new Date(customEnd);
        if (isNaN(end.getTime())) end = now;
        if (customEnd.length <= 10) {
          end.setHours(23, 59, 59, 999);
        }
      } else {
        end = now;
      }

      const diffDays = Math.max(1, (end.getTime() - start.getTime()) / (24 * 3600 * 1000));
      if (diffDays <= 2) {
        groupBy = 'hour';
      } else if (diffDays <= 65) {
        groupBy = 'day';
      } else {
        groupBy = 'month';
      }

      prevStart = new Date(start.getTime() - (end.getTime() - start.getTime()));
      prevEnd = new Date(start.getTime() - 1);
      break;

    default:
      start = new Date(now.getTime() - 7 * 24 * 3600 * 1000);
      end = now;
      groupBy = 'day';
  }

  return { start, end, prevStart, prevEnd, groupBy, period };
}

/**
 * Standardize / normalize traffic source strings
 */
export function normalizeTrafficSource(rawSource, referrer) {
  if (rawSource && rawSource !== 'Direct') {
    return rawSource;
  }

  const ref = (referrer || '').toLowerCase();
  if (!ref) return 'Direct';

  if (ref.includes('google.')) return 'Google Search';
  if (ref.includes('bing.')) return 'Bing Search';
  if (ref.includes('facebook.') || ref.includes('fb.')) return 'Facebook';
  if (ref.includes('whatsapp.') || ref.includes('wa.me')) return 'WhatsApp';
  if (ref.includes('instagram.')) return 'Instagram';
  if (ref.includes('twitter.') || ref.includes('t.co') || ref.includes('x.com')) return 'X (Twitter)';
  if (ref.includes('youtube.')) return 'YouTube';
  if (ref.includes('tiktok.')) return 'TikTok';
  if (ref.includes('benix.space') || ref.includes('localhost')) return 'Platform Directory';

  try {
    const parsed = new URL(ref);
    return parsed.hostname.replace(/^www\./, '');
  } catch {
    return 'Referral';
  }
}

/**
 * Core Analytics Aggregation Engine
 * Evaluates telemetry for a single station or across ALL stations
 */
export async function calculateAnalytics({ stationId = 'all', period = 'week', startDate, endDate }) {
  const { start, end, prevStart, prevEnd, groupBy } = parseDateFilter(period, startDate, endDate);

  // 1. Fetch raw sessions & events
  // Use SELECT * to ensure 100% compatibility with both Postgres and LocalStorageAdapter
  const [sessionsRes, eventsRes, stationsRes] = await Promise.all([
    query(`SELECT * FROM analytics_sessions`),
    query(`SELECT * FROM analytics_events`),
    query(`SELECT id, name, slug, status FROM radio_stations`)
  ]);

  const stationsMap = {};
  (stationsRes.rows || []).forEach(st => {
    stationsMap[st.id] = st;
  });

  // Filter by station if not 'all'
  const filterByStation = (row) => {
    if (stationId === 'all') return true;
    return String(row.station_id) === String(stationId);
  };

  const allSessions = (sessionsRes.rows || []).filter(filterByStation);
  const allEvents = (eventsRes.rows || []).filter(filterByStation);

  // Split into Current Period and Previous Period
  const startMs = start.getTime();
  const endMs = end.getTime();
  const prevStartMs = prevStart.getTime();
  const prevEndMs = prevEnd.getTime();

  const currentSessions = [];
  const prevSessions = [];

  allSessions.forEach(s => {
    const time = new Date(s.created_at || s.updated_at).getTime();
    if (time >= startMs && time <= endMs) {
      currentSessions.push(s);
    } else if (time >= prevStartMs && time <= prevEndMs) {
      prevSessions.push(s);
    }
  });

  const currentEvents = [];
  const prevEvents = [];

  allEvents.forEach(e => {
    const time = new Date(e.created_at).getTime();
    if (time >= startMs && time <= endMs) {
      currentEvents.push(e);
    } else if (time >= prevStartMs && time <= prevEndMs) {
      prevEvents.push(e);
    }
  });

  // 2. Compute Primary Current Period KPIs
  const totalVisitors = new Set(currentSessions.map(s => s.session_id)).size;
  const totalSessions = currentSessions.length;
  const totalPageviews = currentSessions.reduce((sum, s) => sum + (parseInt(s.pageviews_count) || 1), 0);
  const totalDurationSeconds = currentSessions.reduce((sum, s) => sum + (parseInt(s.duration_seconds) || 0), 0);
  const totalListeningSeconds = currentSessions.reduce((sum, s) => sum + (parseInt(s.listening_seconds) || 0), 0);
  const totalPlays = currentEvents.filter(e => e.event_type === 'play').length;
  const totalPauses = currentEvents.filter(e => e.event_type === 'pause').length;
  const totalErrors = currentEvents.filter(e => e.event_type === 'error').length;

  const avgDurationSeconds = totalSessions > 0 ? Math.round(totalDurationSeconds / totalSessions) : 0;
  const avgListeningSeconds = totalSessions > 0 ? Math.round(totalListeningSeconds / totalSessions) : 0;

  // Bounce rate: sessions with <= 1 pageview and duration <= 10 seconds
  const bouncedSessions = currentSessions.filter(s => (parseInt(s.pageviews_count) || 1) <= 1 && (parseInt(s.duration_seconds) || 0) <= 15).length;
  const bounceRate = totalSessions > 0 ? Math.round((bouncedSessions / totalSessions) * 100) : 0;

  // 3. Compute Previous Period KPIs for Comparison
  const prevTotalVisitors = new Set(prevSessions.map(s => s.session_id)).size;
  const prevTotalPlays = prevEvents.filter(e => e.event_type === 'play').length;
  const prevTotalDuration = prevSessions.reduce((sum, s) => sum + (parseInt(s.duration_seconds) || 0), 0);
  const prevAvgDuration = prevSessions.length > 0 ? Math.round(prevTotalDuration / prevSessions.length) : 0;
  const prevTotalListening = prevSessions.reduce((sum, s) => sum + (parseInt(s.listening_seconds) || 0), 0);

  const calcGrowth = (curr, prev) => {
    if (!prev || prev === 0) return curr > 0 ? 100 : 0;
    return Math.round(((curr - prev) / prev) * 100);
  };

  const growth = {
    visitors: calcGrowth(totalVisitors, prevTotalVisitors),
    plays: calcGrowth(totalPlays, prevTotalPlays),
    duration: calcGrowth(avgDurationSeconds, prevAvgDuration),
    listeningHours: calcGrowth(totalListeningSeconds, prevTotalListening),
  };

  // 4. Traffic Sources Breakdown (Crucial user requirement!)
  const sourceGroups = {};
  currentSessions.forEach(s => {
    const src = normalizeTrafficSource(s.traffic_source, s.referrer);
    if (!sourceGroups[src]) {
      sourceGroups[src] = {
        name: src,
        count: 0,
        totalDuration: 0,
        listeningCount: 0,
        listeningDuration: 0,
      };
    }
    sourceGroups[src].count++;
    sourceGroups[src].totalDuration += parseInt(s.duration_seconds) || 0;
    if (s.is_listening || (parseInt(s.listening_seconds) || 0) > 0) {
      sourceGroups[src].listeningCount++;
      sourceGroups[src].listeningDuration += parseInt(s.listening_seconds) || 0;
    }
  });

  const trafficSources = Object.values(sourceGroups)
    .map(sg => {
      const percentage = totalSessions > 0 ? Math.round((sg.count / totalSessions) * 100) : 0;
      const avgDuration = sg.count > 0 ? Math.round(sg.totalDuration / sg.count) : 0;
      return {
        source: sg.name,
        count: sg.count,
        percentage,
        avgDurationSeconds: avgDuration,
        avgDurationFormatted: formatDuration(avgDuration),
        totalTimeFormatted: formatDuration(sg.totalDuration),
        listenersCount: sg.listeningCount,
      };
    })
    .sort((a, b) => b.count - a.count);

  // 5. Device Breakdown
  const deviceCounts = { Mobile: 0, Desktop: 0, Tablet: 0 };
  currentSessions.forEach(s => {
    const dev = s.device_type || 'Desktop';
    if (deviceCounts[dev] !== undefined) {
      deviceCounts[dev]++;
    } else {
      deviceCounts.Desktop++;
    }
  });

  const deviceBreakdown = Object.entries(deviceCounts).map(([device, count]) => ({
    device,
    count,
    percentage: totalSessions > 0 ? Math.round((count / totalSessions) * 100) : 0,
  }));

  // 6. Timeline Generation (Hourly, Daily, or Monthly based on groupBy)
  const timeline = generateTimelineBuckets({
    start,
    end,
    groupBy,
    sessions: currentSessions,
    events: currentEvents,
  });

  // 7. Top Visited Pages
  const pageMap = {};
  currentSessions.forEach(s => {
    const p = s.page_path || '/';
    if (!pageMap[p]) {
      pageMap[p] = { path: p, views: 0, totalDuration: 0 };
    }
    pageMap[p].views += parseInt(s.pageviews_count) || 1;
    pageMap[p].totalDuration += parseInt(s.duration_seconds) || 0;
  });

  const topPages = Object.values(pageMap)
    .map(p => ({
      path: p.path,
      views: p.views,
      avgTimeSeconds: p.views > 0 ? Math.round(p.totalDuration / p.views) : 0,
      avgTimeFormatted: formatDuration(p.views > 0 ? Math.round(p.totalDuration / p.views) : 0),
    }))
    .sort((a, b) => b.views - a.views)
    .slice(0, 6);

  // 8. Top Streams Listened
  const streamMap = {};
  currentEvents.filter(e => e.event_type === 'play').forEach(e => {
    let name = 'Main Stream';
    try {
      const parsed = typeof e.event_data === 'string' ? JSON.parse(e.event_data) : e.event_data;
      if (parsed?.stream_name) name = parsed.stream_name;
    } catch {}
    streamMap[name] = (streamMap[name] || 0) + 1;
  });

  const topStreams = Object.entries(streamMap)
    .map(([name, plays]) => ({ name, plays }))
    .sort((a, b) => b.plays - a.plays)
    .slice(0, 5);

  // 9. Overall Station Rankings / Leaderboard (When stationId is 'all')
  let stationRankings = [];
  if (stationId === 'all') {
    const stationStats = {};
    (stationsRes.rows || []).forEach(st => {
      stationStats[st.id] = {
        station_id: st.id,
        station_name: st.name,
        slug: st.slug,
        status: st.status,
        visitors: 0,
        sessionsCount: 0,
        plays: 0,
        totalDurationSeconds: 0,
        totalListeningSeconds: 0,
        pageviews: 0,
      };
    });

    currentSessions.forEach(s => {
      if (stationStats[s.station_id]) {
        stationStats[s.station_id].visitors++;
        stationStats[s.station_id].sessionsCount++;
        stationStats[s.station_id].totalDurationSeconds += parseInt(s.duration_seconds) || 0;
        stationStats[s.station_id].totalListeningSeconds += parseInt(s.listening_seconds) || 0;
        stationStats[s.station_id].pageviews += parseInt(s.pageviews_count) || 1;
      }
    });

    currentEvents.filter(e => e.event_type === 'play').forEach(e => {
      if (stationStats[e.station_id]) {
        stationStats[e.station_id].plays++;
      }
    });

    stationRankings = Object.values(stationStats)
      .map(st => ({
        ...st,
        avgDurationSeconds: st.sessionsCount > 0 ? Math.round(st.totalDurationSeconds / st.sessionsCount) : 0,
        avgDurationFormatted: formatDuration(st.sessionsCount > 0 ? Math.round(st.totalDurationSeconds / st.sessionsCount) : 0),
        totalListeningHoursFormatted: formatDuration(st.totalListeningSeconds),
        listeningPercentage: totalListeningSeconds > 0 ? Math.round((st.totalListeningSeconds / totalListeningSeconds) * 100) : 0,
      }))
      .sort((a, b) => b.totalListeningSeconds - a.totalListeningSeconds || b.visitors - a.visitors);
  }

  return {
    stationId,
    stationName: stationId === 'all' ? 'All Radio Stations (Overall)' : (stationsMap[stationId]?.name || 'Radio Station'),
    period,
    dateRange: {
      start: start.toISOString(),
      end: end.toISOString(),
      groupBy,
    },
    kpis: {
      totalVisitors,
      totalSessions,
      totalPageviews,
      totalPlays,
      totalPauses,
      totalErrors,
      // Time Spent Highlights
      avgDurationSeconds,
      avgDurationFormatted: formatDuration(avgDurationSeconds),
      avgDurationCompact: formatDurationCompact(avgDurationSeconds),
      totalDurationSeconds,
      totalDurationFormatted: formatDuration(totalDurationSeconds),
      totalListeningSeconds,
      totalListeningFormatted: formatDuration(totalListeningSeconds),
      avgListeningFormatted: formatDuration(avgListeningSeconds),
      bounceRate,
    },
    growth,
    trafficSources,
    deviceBreakdown,
    timeline,
    topPages,
    topStreams,
    stationRankings,
    totalStations: Object.keys(stationsMap).length,
  };
}

/**
 * Generate timeline buckets according to groupBy resolution
 */
function generateTimelineBuckets({ start, end, groupBy, sessions, events }) {
  const buckets = [];
  const cur = new Date(start);

  if (groupBy === 'hour') {
    // Hourly buckets (e.g. for today or yesterday)
    while (cur.getTime() <= end.getTime()) {
      const hourKey = cur.getHours();
      const label = `${String(hourKey).padStart(2, '0')}:00`;
      const bucketStart = new Date(cur);
      const bucketEnd = new Date(cur.getTime() + 3600 * 1000 - 1);

      const bStartMs = bucketStart.getTime();
      const bEndMs = bucketEnd.getTime();

      const bSessions = sessions.filter(s => {
        const t = new Date(s.created_at || s.updated_at).getTime();
        return t >= bStartMs && t <= bEndMs;
      });

      const bEvents = events.filter(e => {
        const t = new Date(e.created_at).getTime();
        return t >= bStartMs && t <= bEndMs && e.event_type === 'play';
      });

      const totalDur = bSessions.reduce((acc, s) => acc + (parseInt(s.duration_seconds) || 0), 0);

      buckets.push({
        label,
        timestamp: cur.toISOString(),
        visitors: bSessions.length,
        plays: bEvents.length,
        timeSpentMinutes: Math.round(totalDur / 60),
      });

      cur.setHours(cur.getHours() + 1);
    }
  } else if (groupBy === 'day') {
    // Daily buckets (e.g. for week or month)
    while (cur.getTime() <= end.getTime()) {
      const bStart = new Date(cur.getFullYear(), cur.getMonth(), cur.getDate(), 0, 0, 0, 0);
      const bEnd = new Date(cur.getFullYear(), cur.getMonth(), cur.getDate(), 23, 59, 59, 999);

      const bStartMs = bStart.getTime();
      const bEndMs = bEnd.getTime();

      const bSessions = sessions.filter(s => {
        const t = new Date(s.created_at || s.updated_at).getTime();
        return t >= bStartMs && t <= bEndMs;
      });

      const bEvents = events.filter(e => {
        const t = new Date(e.created_at).getTime();
        return t >= bStartMs && t <= bEndMs && e.event_type === 'play';
      });

      const totalDur = bSessions.reduce((acc, s) => acc + (parseInt(s.duration_seconds) || 0), 0);

      const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
      const label = `${dayNames[cur.getDay()]} ${cur.getDate()} ${monthNames[cur.getMonth()]}`;

      buckets.push({
        label,
        dayName: dayNames[cur.getDay()],
        timestamp: cur.toISOString(),
        visitors: bSessions.length,
        plays: bEvents.length,
        timeSpentMinutes: Math.round(totalDur / 60),
      });

      cur.setDate(cur.getDate() + 1);
    }
  } else {
    // Monthly buckets (e.g. for year)
    while (cur.getTime() <= end.getTime()) {
      const bStart = new Date(cur.getFullYear(), cur.getMonth(), 1, 0, 0, 0, 0);
      const bEnd = new Date(cur.getFullYear(), cur.getMonth() + 1, 0, 23, 59, 59, 999);

      const bStartMs = bStart.getTime();
      const bEndMs = bEnd.getTime();

      const bSessions = sessions.filter(s => {
        const t = new Date(s.created_at || s.updated_at).getTime();
        return t >= bStartMs && t <= bEndMs;
      });

      const bEvents = events.filter(e => {
        const t = new Date(e.created_at).getTime();
        return t >= bStartMs && t <= bEndMs && e.event_type === 'play';
      });

      const totalDur = bSessions.reduce((acc, s) => acc + (parseInt(s.duration_seconds) || 0), 0);

      const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      const label = `${monthNames[cur.getMonth()]} ${cur.getFullYear()}`;

      buckets.push({
        label,
        timestamp: cur.toISOString(),
        visitors: bSessions.length,
        plays: bEvents.length,
        timeSpentMinutes: Math.round(totalDur / 60),
      });

      cur.setMonth(cur.getMonth() + 1);
    }
  }

  return buckets;
}
