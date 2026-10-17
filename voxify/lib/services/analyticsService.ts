import { createClient } from '../supabase/client';
import { AnalyticsSummary, TrafficSourceItem, VisitorTrendItem, TopPageItem, DeviceBreakdownItem } from '../types/database.types';

function formatDuration(seconds: number): string {
  if (!seconds || seconds <= 0) return '0s';
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  if (mins === 0) return `${secs}s`;
  if (mins < 60) return `${mins}m ${secs}s`;
  const hours = Math.floor(mins / 60);
  const remMins = mins % 60;
  return `${hours}h ${remMins}m`;
}

const COLOR_PALETTE = ['#9333ea', '#3b82f6', '#10b981', '#f59e0b', '#ec4899', '#8b5cf6', '#06b6d4'];

export const analyticsService = {
  async getAnalyticsSummary(
    timeframe: 'today' | '7d' | '30d' | '365d' | 'all' = '30d',
    customSupabase?: any
  ): Promise<AnalyticsSummary> {
    const supabase = customSupabase || createClient();

    // 1. Calculate startDate based on timeframe
    let startDate: Date | null = new Date();
    if (timeframe === 'today') {
      startDate.setHours(0, 0, 0, 0);
    } else if (timeframe === '7d') {
      startDate.setDate(startDate.getDate() - 7);
    } else if (timeframe === '30d') {
      startDate.setDate(startDate.getDate() - 30);
    } else if (timeframe === '365d') {
      startDate.setDate(startDate.getDate() - 365);
    } else {
      startDate = null; // 'all'
    }

    // 2. Query site_visits table
    let visitsQuery = supabase.from('site_visits').select('*');
    if (startDate) {
      visitsQuery = visitsQuery.gte('created_at', startDate.toISOString());
    }

    const [
      { data: visits },
      { count: choirsCount },
      { count: songsCount },
      { count: eventsCount },
      { count: usersCount },
    ] = await Promise.all([
      visitsQuery,
      supabase.from('choirs').select('id', { count: 'exact', head: true }),
      supabase.from('songs').select('id', { count: 'exact', head: true }),
      supabase.from('events').select('id', { count: 'exact', head: true }),
      supabase.from('profiles').select('id', { count: 'exact', head: true }),
    ]);

    const records = visits || [];
    const totalPageviews = records.length;

    // Unique Visitors (unique session_id)
    const sessionSet = new Set<string>();
    let totalDurationSeconds = 0;
    const referrerCounts: Record<string, number> = {};
    const pageCounts: Record<string, number> = {};
    const deviceCounts: Record<string, number> = { desktop: 0, mobile: 0, tablet: 0 };
    const dateTrendCounts: Record<string, { visitors: Set<string>; pageviews: number }> = {};

    records.forEach((v: any) => {
      sessionSet.add(v.session_id);
      totalDurationSeconds += v.session_duration_seconds || 0;

      // Referrer Domain
      const refDomain = v.referrer_domain || 'Direct / Bookmark';
      referrerCounts[refDomain] = (referrerCounts[refDomain] || 0) + 1;

      // Page path
      const path = v.page_path || '/';
      pageCounts[path] = (pageCounts[path] || 0) + 1;

      // Device
      const dev = (v.device_type || 'desktop').toLowerCase();
      if (dev in deviceCounts) {
        deviceCounts[dev]++;
      } else {
        deviceCounts.desktop++;
      }

      // Date trend
      const dateStr = new Date(v.created_at).toISOString().split('T')[0];
      if (!dateTrendCounts[dateStr]) {
        dateTrendCounts[dateStr] = { visitors: new Set(), pageviews: 0 };
      }
      dateTrendCounts[dateStr].visitors.add(v.session_id);
      dateTrendCounts[dateStr].pageviews++;
    });

    const uniqueVisitors = sessionSet.size;
    const avgTimeSpentSeconds = uniqueVisitors > 0 ? Math.round(totalDurationSeconds / uniqueVisitors) : 0;

    // Process Traffic Sources
    const trafficSourcesList: TrafficSourceItem[] = Object.entries(referrerCounts)
      .map(([source, count], idx) => ({
        source,
        count,
        percentage: totalPageviews > 0 ? Math.round((count / totalPageviews) * 100) : 0,
        color: COLOR_PALETTE[idx % COLOR_PALETTE.length],
      }))
      .sort((a, b) => b.count - a.count);

    // Process Top Pages
    const topPagesList: TopPageItem[] = Object.entries(pageCounts)
      .map(([path, views]) => {
        let label = path;
        if (path === '/') label = 'Landing Page (Home)';
        else if (path === '/dashboard') label = 'User Dashboard';
        else if (path === '/songs') label = 'Music Song Library';
        else if (path === '/events') label = 'Worship Events Calendar';
        else if (path === '/announcements') label = 'Choir Announcements';
        else if (path === '/manage') label = 'Choir Master Control Panel';
        else if (path === '/profile') label = 'User Profile & Settings';
        else if (path === '/login') label = 'Sign In Page';
        else if (path === '/register') label = 'Account Registration';
        else if (path === '/forgot-password') label = 'Password Reset Request';
        else if (path === '/reset-password') label = 'New Password Form';

        return {
          path,
          label,
          views,
          percentage: totalPageviews > 0 ? Math.round((views / totalPageviews) * 100) : 0,
        };
      })
      .sort((a, b) => b.views - a.views)
      .slice(0, 8);

    // Process Device Breakdown
    const totalDevices = (deviceCounts.desktop || 0) + (deviceCounts.mobile || 0) + (deviceCounts.tablet || 0);
    const deviceBreakdownList: DeviceBreakdownItem[] = [
      { device: 'Desktop', count: deviceCounts.desktop, percentage: totalDevices > 0 ? Math.round((deviceCounts.desktop / totalDevices) * 100) : 0 },
      { device: 'Mobile', count: deviceCounts.mobile, percentage: totalDevices > 0 ? Math.round((deviceCounts.mobile / totalDevices) * 100) : 0 },
      { device: 'Tablet', count: deviceCounts.tablet, percentage: totalDevices > 0 ? Math.round((deviceCounts.tablet / totalDevices) * 100) : 0 },
    ];

    // Process Visitor Trends Over Time (sorted by date)
    const visitorTrendsList: VisitorTrendItem[] = Object.entries(dateTrendCounts)
      .map(([date, data]) => ({
        date: new Date(date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
        visitors: data.visitors.size,
        pageviews: data.pageviews,
      }))
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    return {
      timeframe,
      uniqueVisitorsCount: uniqueVisitors,
      totalPageviewsCount: totalPageviews,
      avgTimeSpentSeconds: avgTimeSpentSeconds,
      avgTimeSpentFormatted: formatDuration(avgTimeSpentSeconds),
      activeUsersCount: usersCount || 0,
      trafficSources: trafficSourcesList,
      visitorTrends: visitorTrendsList,
      topPages: topPagesList,
      deviceBreakdown: deviceBreakdownList,
      choirsCount: choirsCount || 0,
      songsCount: songsCount || 0,
      eventsCount: eventsCount || 0,
    };
  },
};
