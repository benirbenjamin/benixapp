import React, { useEffect, useMemo, useState } from 'react';
import { AdminLayout } from '../../components/admin/AdminLayout';
import { fetchAnalyticsStats } from '../../services/api';
import {
  Users,
  Eye,
  Activity,
  Clock,
  Route,
  MousePointerClick,
  Smartphone,
  Monitor,
  Globe,
  RefreshCw,
  Calendar,
  Layers,
  Film,
  BookOpen,
  BarChart3
} from 'lucide-react';

const RANGES = [
  { label: 'Today', value: 'today' },
  { label: 'Yesterday', value: 'yesterday' },
  { label: '7 Days', value: '7d' },
  { label: '30 Days', value: '30d' },
  { label: 'This Month', value: 'month' },
  { label: 'This Year', value: 'year' },
  { label: 'All Time', value: 'all' },
  { label: 'Custom', value: 'custom' }
];

const formatNumber = (value: any) => Number(value || 0).toLocaleString();

const formatDuration = (seconds: number) => {
  const total = Math.max(0, Math.round(Number(seconds) || 0));
  const hours = Math.floor(total / 3600);
  const minutes = Math.floor((total % 3600) / 60);
  const secs = total % 60;
  if (hours > 0) return `${hours}h ${minutes}m`;
  if (minutes > 0) return `${minutes}m ${secs}s`;
  return `${secs}s`;
};

const formatEventTime = (value: any) => {
  if (!value) return '—';
  try {
    return new Date(value).toLocaleString();
  } catch {
    return '—';
  }
};

export const AdminAnalyticsPage: React.FC = () => {
  const [range, setRange] = useState('30d');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadStats = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await fetchAnalyticsStats(range, range === 'custom' ? from : undefined, range === 'custom' ? to : undefined);
      setStats(data);
    } catch (err: any) {
      setError(err?.message || 'Failed to load analytics.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStats();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [range]);

  const overview = stats?.overview || {};
  const trend: any[] = stats?.trend || [];
  const topPages: any[] = stats?.top_pages || [];
  const sources: any[] = stats?.sources || [];
  const devices: any[] = stats?.devices || [];
  const browsers: any[] = stats?.browsers || [];
  const osList: any[] = stats?.os || [];
  const recentActivity: any[] = stats?.recent_activity || [];
  const dbTotals = stats?.stats || {};

  const maxTrend = useMemo(
    () => Math.max(1, ...trend.map((t: any) => Math.max(Number(t.visitors) || 0, Number(t.page_views) || 0))),
    [trend]
  );

  const kpis = [
    { label: 'Unique Visitors', value: formatNumber(overview.unique_visitors), icon: Users, color: 'text-blue-400 bg-blue-500/10 border-blue-500/20' },
    { label: 'Page Views', value: formatNumber(overview.page_views ?? overview.total_views), icon: Eye, color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20' },
    { label: 'Sessions', value: formatNumber(overview.sessions), icon: Activity, color: 'text-purple-400 bg-purple-500/10 border-purple-500/20' },
    { label: 'Avg Time on Site', value: formatDuration(overview.avg_time_on_site), icon: Clock, color: 'text-amber-400 bg-amber-500/10 border-amber-500/20' },
    { label: 'Pages / Session', value: Number(overview.avg_views_per_session || 0).toFixed(2), icon: Route, color: 'text-sky-400 bg-sky-500/10 border-sky-500/20' },
    { label: 'Bounce Rate', value: `${Number(overview.bounce_rate || 0).toFixed(1)}%`, icon: MousePointerClick, color: 'text-rose-400 bg-rose-500/10 border-rose-500/20' }
  ];

  const renderBreakdown = (
    title: string,
    rows: any[],
    labelKey: string,
    icon: React.ReactNode
  ) => (
    <div className="rounded-3xl p-5 bg-[#131926] border border-slate-800 space-y-3">
      <div className="flex items-center gap-2">
        {icon}
        <h3 className="text-sm font-black text-white">{title}</h3>
      </div>
      {rows.length === 0 ? (
        <p className="text-xs text-slate-500 py-3">No data for this period.</p>
      ) : (
        <div className="space-y-2.5">
          {rows.map((row, idx) => (
            <div key={`${title}-${idx}`} className="space-y-1">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-300 font-semibold truncate max-w-[70%]">{row[labelKey] || 'Unknown'}</span>
                <span className="text-slate-400 font-mono">{formatNumber(row.count)}{row.pct ? ` · ${row.pct}` : ''}</span>
              </div>
              <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full"
                  style={{ width: `${Math.min(100, Number(String(row.pct || '0').replace('%', '')) || 0)}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
              <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider">Real Visitor Telemetry</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight mt-1">Website Analytics</h1>
            <p className="text-slate-400 text-sm">
              Real first-party data captured from actual site visits — no estimated or synthetic numbers.
            </p>
          </div>
          <button
            onClick={loadStats}
            disabled={loading}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-bold transition disabled:opacity-50 self-start"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>

        {/* Range selector */}
        <div className="rounded-2xl p-4 bg-[#131926] border border-slate-800 space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <Calendar className="w-4 h-4 text-slate-400" />
            {RANGES.map((r) => (
              <button
                key={r.value}
                onClick={() => setRange(r.value)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                  range === r.value
                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30'
                    : 'bg-slate-900 text-slate-300 hover:bg-slate-800 border border-slate-800'
                }`}
              >
                {r.label}
              </button>
            ))}
          </div>
          {range === 'custom' && (
            <div className="flex flex-wrap items-end gap-3 pt-1">
              <div>
                <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">From</label>
                <input
                  type="date"
                  value={from}
                  onChange={(e) => setFrom(e.target.value)}
                  className="px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white focus:outline-none focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">To</label>
                <input
                  type="date"
                  value={to}
                  onChange={(e) => setTo(e.target.value)}
                  className="px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white focus:outline-none focus:border-blue-500"
                />
              </div>
              <button
                onClick={loadStats}
                disabled={!from || !to}
                className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition disabled:opacity-50"
              >
                Apply Range
              </button>
            </div>
          )}
        </div>

        {error && (
          <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs font-semibold">
            {error}
          </div>
        )}

        {/* KPI cards */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {kpis.map((kpi) => {
            const Icon = kpi.icon;
            return (
              <div key={kpi.label} className="rounded-2xl p-4 bg-[#131926] border border-slate-800 space-y-2">
                <div className={`w-8 h-8 rounded-xl flex items-center justify-center border ${kpi.color}`}>
                  <Icon className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">{kpi.label}</p>
                  <p className="text-xl font-black text-white">{kpi.value}</p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Trend */}
        <div className="rounded-3xl p-6 bg-[#131926] border border-slate-800 space-y-4">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-blue-400" />
              <h2 className="text-sm font-black text-white">Daily Visitors & Page Views</h2>
            </div>
            <div className="flex items-center gap-4 text-[11px] font-bold">
              <span className="flex items-center gap-1.5 text-slate-300">
                <span className="w-2.5 h-2.5 rounded-sm bg-blue-500" /> Page Views
              </span>
              <span className="flex items-center gap-1.5 text-slate-300">
                <span className="w-2.5 h-2.5 rounded-sm bg-emerald-500" /> Visitors
              </span>
            </div>
          </div>

          {loading ? (
            <div className="h-48 flex items-center justify-center text-slate-400 text-xs">Loading telemetry...</div>
          ) : trend.length === 0 ? (
            <div className="h-48 flex flex-col items-center justify-center text-slate-500 text-xs text-center gap-1">
              <Activity className="w-6 h-6 text-slate-600" />
              <span>No visitor data captured yet for this period.</span>
              <span className="text-[11px] text-slate-600">Data appears automatically as users browse the site.</span>
            </div>
          ) : (
            <div className="h-48 flex items-end gap-1.5 overflow-x-auto border-b border-slate-800 pb-1">
              {trend.map((t: any) => (
                <div
                  key={t.date}
                  className="h-full flex items-end gap-0.5 group min-w-[10px]"
                  title={`${t.date}\nPage views: ${formatNumber(t.page_views)}\nVisitors: ${formatNumber(t.visitors)}`}
                >
                  <div
                    className="w-1.5 bg-blue-500/80 group-hover:bg-blue-400 rounded-t transition-colors"
                    style={{ height: `${Math.max(2, (Number(t.page_views) / maxTrend) * 100)}%` }}
                  />
                  <div
                    className="w-1.5 bg-emerald-500/80 group-hover:bg-emerald-400 rounded-t transition-colors"
                    style={{ height: `${Math.max(2, (Number(t.visitors) / maxTrend) * 100)}%` }}
                  />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Top pages */}
        <div className="rounded-3xl p-5 bg-[#131926] border border-slate-800 space-y-3">
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-amber-400" />
            <h3 className="text-sm font-black text-white">Top Pages</h3>
          </div>
          {topPages.length === 0 ? (
            <p className="text-xs text-slate-500 py-3">No page views recorded for this period.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="text-slate-400 uppercase text-[10px] font-mono border-b border-slate-800">
                  <tr>
                    <th className="py-2 pr-3">Page</th>
                    <th className="py-2 pr-3">Views</th>
                    <th className="py-2">Unique Visitors</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {topPages.map((p: any, idx: number) => (
                    <tr key={`${p.page_path}-${idx}`} className="hover:bg-slate-900/30">
                      <td className="py-2.5 pr-3 text-slate-200 font-semibold truncate max-w-[320px]">{p.page_path}</td>
                      <td className="py-2.5 pr-3 text-emerald-400 font-bold">{formatNumber(p.views)}</td>
                      <td className="py-2.5 text-blue-400 font-bold">{formatNumber(p.visitors)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Breakdowns */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {renderBreakdown('Traffic Sources', sources, 'source', <Globe className="w-4 h-4 text-blue-400" />)}
          {renderBreakdown('Devices', devices, 'device_type', <Smartphone className="w-4 h-4 text-emerald-400" />)}
          {renderBreakdown('Browsers', browsers, 'browser', <Monitor className="w-4 h-4 text-purple-400" />)}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {renderBreakdown('Operating Systems', osList, 'os', <Monitor className="w-4 h-4 text-amber-400" />)}

          {/* Recent activity */}
          <div className="rounded-3xl p-5 bg-[#131926] border border-slate-800 space-y-3">
            <div className="flex items-center gap-2">
              <Activity className="w-4 h-4 text-emerald-400" />
              <h3 className="text-sm font-black text-white">Recent Activity</h3>
            </div>
            {recentActivity.length === 0 ? (
              <p className="text-xs text-slate-500 py-3">No recent activity.</p>
            ) : (
              <div className="max-h-64 overflow-y-auto divide-y divide-slate-800/60">
                {recentActivity.map((event: any, idx: number) => (
                  <div key={idx} className="py-2 flex items-center justify-between gap-2 text-xs">
                    <div className="min-w-0">
                      <p className="text-slate-200 font-semibold truncate">{event.page_path || '—'}</p>
                      <p className="text-[10px] text-slate-500">
                        {event.event_type} · {event.device_type || 'Unknown device'} · {event.browser || 'Unknown browser'}
                      </p>
                    </div>
                    <span className="text-[10px] text-slate-500 whitespace-nowrap">{formatEventTime(event.created_at)}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Database totals (clearly labelled, not visitors) */}
        <div className="rounded-3xl p-5 bg-[#0F141F] border border-slate-800 space-y-3">
          <h3 className="text-xs font-black uppercase tracking-wider text-slate-400">Database Totals (not visitor counts)</h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="p-4 rounded-2xl bg-[#131926] border border-slate-800 flex items-center gap-3">
              <Users className="w-5 h-5 text-blue-400" />
              <div>
                <p className="text-[10px] uppercase font-bold text-slate-400">Registered Users</p>
                <p className="text-xl font-black text-white">{formatNumber(dbTotals.total_users)}</p>
              </div>
            </div>
            <div className="p-4 rounded-2xl bg-[#131926] border border-slate-800 flex items-center gap-3">
              <Film className="w-5 h-5 text-purple-400" />
              <div>
                <p className="text-[10px] uppercase font-bold text-slate-400">Videos</p>
                <p className="text-xl font-black text-white">{formatNumber(dbTotals.total_videos)}</p>
              </div>
            </div>
            <div className="p-4 rounded-2xl bg-[#131926] border border-slate-800 flex items-center gap-3">
              <BookOpen className="w-5 h-5 text-amber-400" />
              <div>
                <p className="text-[10px] uppercase font-bold text-slate-400">Articles</p>
                <p className="text-xl font-black text-white">{formatNumber(dbTotals.total_articles)}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminAnalyticsPage;
