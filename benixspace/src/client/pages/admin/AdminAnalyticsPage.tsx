import React, { useEffect, useState } from 'react';
import { AdminLayout } from '../../components/admin/AdminLayout';
import { fetchAnalyticsStats } from '../../services/api';
import {
  Users, Eye, MousePointerClick, Globe, Monitor, Smartphone,
  BarChart3, RefreshCw, Layers, BookOpen, Activity, ArrowUpRight, TrendingUp, Compass
} from 'lucide-react';

export const AdminAnalyticsPage: React.FC = () => {
  const [range, setRange] = useState('30d');
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const ranges = [
    { label: 'Today', value: 'today' },
    { label: 'Yesterday', value: 'yesterday' },
    { label: 'Last 7 Days', value: '7d' },
    { label: 'Last 30 Days', value: '30d' },
    { label: 'This Year', value: 'year' },
    { label: 'All Time', value: 'all' },
  ];

  const loadStats = async (selectedRange: string) => {
    setLoading(true);
    try {
      console.log('[AdminAnalyticsPage] Loading stats for range:', selectedRange);
      const data = await fetchAnalyticsStats(selectedRange);
      console.log('[AdminAnalyticsPage] Stats data state updated:', data);
      setStats(data);
    } catch (err) {
      console.error('[AdminAnalyticsPage] Failed to load analytics:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStats(range);
  }, [range]);

  const overview = stats?.overview || {
    total_views: 0,
    unique_visitors: 0,
    external_clicks: 0,
    avg_views_per_session: 0,
    bounce_rate: 0
  };

  const topProjects = stats?.top_projects || [];
  const topArticles = stats?.top_articles || [];
  const sources = stats?.sources || [];
  const pages = stats?.pages || [];
  const devices = stats?.devices || [];
  const browsers = stats?.browsers || [];
  const recentActivity = stats?.recent_activity || [];

  return (
    <AdminLayout>
      <div className="space-y-8">
        
        {/* Header & Date Range Filter Pills */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
          <div>
            <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Real-Time Visitor Analytics</h1>
            <p className="text-slate-600 text-sm">Live visitor stats, traffic sources, platform clicks, and content performance.</p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => loadStats(range)}
              className="p-2.5 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors"
              title="Refresh Analytics Data"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>

            <div className="flex flex-wrap items-center gap-1.5 bg-slate-200/80 p-1.5 rounded-2xl">
              {ranges.map((r) => (
                <button
                  key={r.value}
                  onClick={() => setRange(r.value)}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
                    range === r.value
                      ? 'bg-sky-600 text-white shadow-md'
                      : 'text-slate-700 hover:bg-white/60'
                  }`}
                >
                  {r.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* 1. Overview Metric Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-5">
          
          <div className="glass-card rounded-3xl p-5 border border-slate-200/80 shadow-sm space-y-2 bg-white">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Unique Visitors</span>
              <div className="w-8 h-8 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center">
                <Users className="w-4 h-4" />
              </div>
            </div>
            <p className="text-3xl font-black text-slate-900">{overview.unique_visitors}</p>
            <span className="text-[11px] font-semibold text-slate-400 block">Deduplicated Sessions</span>
          </div>

          <div className="glass-card rounded-3xl p-5 border border-slate-200/80 shadow-sm space-y-2 bg-white">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Total Page Views</span>
              <div className="w-8 h-8 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
                <Eye className="w-4 h-4" />
              </div>
            </div>
            <p className="text-3xl font-black text-slate-900">{overview.total_views}</p>
            <span className="text-[11px] font-semibold text-slate-400 block">Logged Page Views</span>
          </div>

          <div className="glass-card rounded-3xl p-5 border border-slate-200/80 shadow-sm space-y-2 bg-white">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">External Clicks</span>
              <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                <MousePointerClick className="w-4 h-4" />
              </div>
            </div>
            <p className="text-3xl font-black text-slate-900">{overview.external_clicks}</p>
            <span className="text-[11px] font-semibold text-slate-400 block">"Visit Platform" Clicks</span>
          </div>

          <div className="glass-card rounded-3xl p-5 border border-slate-200/80 shadow-sm space-y-2 bg-white">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Avg Views / Session</span>
              <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
                <TrendingUp className="w-4 h-4" />
              </div>
            </div>
            <p className="text-3xl font-black text-slate-900">{overview.avg_views_per_session || 0}</p>
            <span className="text-[11px] font-semibold text-slate-400 block">Pages Per Visitor</span>
          </div>

          <div className="glass-card rounded-3xl p-5 border border-slate-200/80 shadow-sm space-y-2 bg-white">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Bounce Rate</span>
              <div className="w-8 h-8 rounded-xl bg-red-50 text-red-600 flex items-center justify-center">
                <Compass className="w-4 h-4" />
              </div>
            </div>
            <p className="text-3xl font-black text-slate-900">{overview.bounce_rate ?? 0}%</p>
            <span className="text-[11px] font-semibold text-slate-400 block">Single-Page Visits</span>
          </div>

        </div>

        {/* 2. Main Analytics Grid (Top Clicked Platforms & Top Articles) */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          
          {/* Most Clicked Platforms */}
          <div className="glass-card rounded-3xl p-6 border border-slate-200/80 shadow-md bg-white space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-extrabold text-slate-900 text-base flex items-center gap-2">
                <Layers className="w-5 h-5 text-sky-600" /> Platform External Clicks
              </h3>
              <span className="text-xs font-bold text-slate-400 uppercase">Total: {overview.external_clicks}</span>
            </div>

            {topProjects.length === 0 ? (
              <div className="py-8 text-center text-slate-400 text-xs font-medium bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                No platform clicks recorded yet for this time range.
              </div>
            ) : (
              <div className="space-y-3">
                {topProjects.map((p: any, idx: number) => (
                  <div key={idx} className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-50 border border-slate-100 text-sm">
                    <span className="font-bold text-slate-800">{p.name}</span>
                    <span className="font-black text-sky-600 bg-sky-100 px-3 py-1 rounded-full text-xs">
                      {p.clicks} clicks
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Top Read Articles */}
          <div className="glass-card rounded-3xl p-6 border border-slate-200/80 shadow-md bg-white space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-extrabold text-slate-900 text-base flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-sky-600" /> Top Article Views
              </h3>
              <span className="text-xs font-bold text-slate-400 uppercase">Blog Content</span>
            </div>

            {topArticles.length === 0 ? (
              <div className="py-8 text-center text-slate-400 text-xs font-medium bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                No article views recorded yet.
              </div>
            ) : (
              <div className="space-y-3">
                {topArticles.map((a: any, idx: number) => (
                  <div key={idx} className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-50 border border-slate-100 text-sm gap-3">
                    <div className="truncate">
                      <span className="font-bold text-slate-800 block truncate">{a.title}</span>
                      <span className="text-[11px] text-sky-600 font-semibold">{a.category}</span>
                    </div>
                    <span className="font-black text-purple-600 bg-purple-100 px-3 py-1 rounded-full text-xs shrink-0">
                      {a.views} views
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>

        {/* 3. Traffic Sources & Page Route Breakdown */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          
          {/* Traffic Referral Sources */}
          <div className="glass-card rounded-3xl p-6 border border-slate-200/80 shadow-md bg-white space-y-4">
            <h3 className="font-extrabold text-slate-900 text-base flex items-center gap-2 border-b border-slate-100 pb-3">
              <Globe className="w-5 h-5 text-sky-600" /> Traffic Referral Sources
            </h3>
            {sources.length === 0 ? (
              <div className="py-8 text-center text-slate-400 text-xs font-medium bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                No traffic referrals recorded yet.
              </div>
            ) : (
              <div className="space-y-3">
                {sources.map((s: any, idx: number) => (
                  <div key={idx} className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-50 border border-slate-100 text-sm">
                    <span className="font-semibold text-slate-700">{s.source}</span>
                    <span className="font-bold text-slate-900 text-xs">{s.count} visits</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Page Route Breakdown */}
          <div className="glass-card rounded-3xl p-6 border border-slate-200/80 shadow-md bg-white space-y-4">
            <h3 className="font-extrabold text-slate-900 text-base flex items-center gap-2 border-b border-slate-100 pb-3">
              <BarChart3 className="w-5 h-5 text-sky-600" /> Page Views by Route Type
            </h3>
            {pages.length === 0 ? (
              <div className="py-8 text-center text-slate-400 text-xs font-medium bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                No route views recorded yet.
              </div>
            ) : (
              <div className="space-y-3">
                {pages.map((pg: any, idx: number) => (
                  <div key={idx} className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-50 border border-slate-100 text-sm">
                    <span className="font-bold text-slate-800">{pg.page_type} PAGE</span>
                    <span className="font-black text-slate-900 text-xs bg-slate-200 px-3 py-1 rounded-full">
                      {pg.count} views
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>

        {/* 4. Devices & Browsers Distribution */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          
          {/* Devices Distribution */}
          <div className="glass-card rounded-3xl p-6 border border-slate-200/80 shadow-md bg-white space-y-4">
            <h3 className="font-extrabold text-slate-900 text-base flex items-center gap-2 border-b border-slate-100 pb-3">
              <Smartphone className="w-5 h-5 text-sky-600" /> Device Type Breakdown
            </h3>
            <div className="grid grid-cols-3 gap-3">
              {devices.map((d: any, idx: number) => (
                <div key={idx} className="p-4 rounded-2xl bg-slate-50 border border-slate-100 text-center space-y-1">
                  <span className="text-[11px] font-bold uppercase text-slate-400 block">{d.device_type}</span>
                  <p className="text-2xl font-black text-slate-900">{d.count}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Browsers Distribution */}
          <div className="glass-card rounded-3xl p-6 border border-slate-200/80 shadow-md bg-white space-y-4">
            <h3 className="font-extrabold text-slate-900 text-base flex items-center gap-2 border-b border-slate-100 pb-3">
              <Monitor className="w-5 h-5 text-sky-600" /> Browser Distribution
            </h3>
            <div className="grid grid-cols-3 gap-3">
              {browsers.map((b: any, idx: number) => (
                <div key={idx} className="p-4 rounded-2xl bg-slate-50 border border-slate-100 text-center space-y-1">
                  <span className="text-[11px] font-bold uppercase text-slate-400 block">{b.browser}</span>
                  <p className="text-2xl font-black text-slate-900">{b.count}</p>
                </div>
              ))}
            </div>
          </div>

        </div>

        {/* 5. Live Events Activity Stream Log */}
        <div className="glass-card rounded-3xl p-6 border border-slate-200/80 shadow-md bg-white space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h3 className="font-extrabold text-slate-900 text-base flex items-center gap-2">
              <Activity className="w-5 h-5 text-sky-600 animate-pulse" /> Live Visitor Event Activity Stream
            </h3>
            <span className="text-xs font-semibold text-slate-400">Real-time Stream Log</span>
          </div>

          {recentActivity.length === 0 ? (
            <div className="py-8 text-center text-slate-400 text-xs font-medium bg-slate-50 rounded-2xl border border-dashed border-slate-200">
              No live visitor events recorded yet. Open your website in a new window or mobile browser to record live actions!
            </div>
          ) : (
            <div className="space-y-3">
              {recentActivity.map((evt: any) => (
                <div key={evt.id} className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-xs">
                  <div className="flex items-center gap-2">
                    <span className={`px-2.5 py-0.5 rounded-full font-bold uppercase text-[10px] ${
                      evt.event_type === 'page_view' ? 'bg-sky-100 text-sky-700' : 'bg-emerald-100 text-emerald-700'
                    }`}>
                      {evt.event_type === 'page_view' ? 'Page View' : 'Platform Click'}
                    </span>
                    <span className="font-mono text-slate-700 font-semibold truncate max-w-xs">{evt.page_url}</span>
                  </div>
                  <div className="flex items-center gap-3 text-slate-400">
                    <span className="font-medium">{evt.os} • {evt.browser} ({evt.device_type})</span>
                    <span>{new Date(evt.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>
    </AdminLayout>
  );
};
