import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import {
  BarChart3, Radio, Eye, Newspaper, Play, Clock,
  TrendingUp, TrendingDown, Users, Globe, Smartphone,
  Monitor, Tablet, Calendar, RefreshCw, Compass, ArrowUpRight,
  ArrowDownRight, Headphones, Layers, Sparkles
} from 'lucide-react';
import { api } from '../../api/client';

export function AnalyticsPage() {
  const { activeAdminStation } = useAuth();
  const stationId = activeAdminStation?.id;

  const [period, setPeriod] = useState('week'); // 'today' | 'yesterday' | 'week' | 'month' | 'year' | 'custom'
  const [customStart, setCustomStart] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() - 14);
    return d.toISOString().split('T')[0];
  });
  const [customEnd, setCustomEnd] = useState(() => new Date().toISOString().split('T')[0]);
  const [showCustomPicker, setShowCustomPicker] = useState(false);

  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview'); // 'overview' | 'sources' | 'content'

  const loadStats = async (p = period, cStart = customStart, cEnd = customEnd) => {
    if (!stationId) return;
    setLoading(true);
    try {
      let url = `/stations/${stationId}/analytics/stats?period=${p}`;
      if (p === 'custom') {
        url += `&startDate=${encodeURIComponent(cStart)}&endDate=${encodeURIComponent(cEnd)}`;
      }
      const data = await api.get(url);
      setStats(data);
    } catch (err) {
      console.error('Failed to load analytics:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStats(period, customStart, customEnd);
  }, [stationId, period]);

  const handlePeriodChange = (newPeriod) => {
    setPeriod(newPeriod);
    if (newPeriod === 'custom') {
      setShowCustomPicker(true);
    } else {
      setShowCustomPicker(false);
    }
  };

  const handleApplyCustom = (e) => {
    e.preventDefault();
    setShowCustomPicker(false);
    loadStats('custom', customStart, customEnd);
  };

  const kpis = stats?.kpis || {};
  const growth = stats?.growth || {};
  const timeline = stats?.timeline || [];
  const trafficSources = stats?.trafficSources || [];
  const deviceBreakdown = stats?.deviceBreakdown || [];

  const maxTimelineVisitors = Math.max(...timeline.map(t => t.visitors || 0), 10);
  const maxTimelinePlays = Math.max(...timeline.map(t => t.plays || 0), 5);

  const periods = [
    { key: 'today', label: 'Today' },
    { key: 'yesterday', label: 'Yesterday' },
    { key: 'week', label: 'This Week (7D)' },
    { key: 'month', label: 'This Month (30D)' },
    { key: 'year', label: 'This Year (12M)' },
    { key: 'custom', label: 'Custom Range' },
  ];

  const getSourceIcon = (source) => {
    const s = (source || '').toLowerCase();
    if (s.includes('google') || s.includes('bing') || s.includes('search')) return Search;
    if (s.includes('facebook') || s.includes('instagram') || s.includes('x') || s.includes('twitter') || s.includes('whatsapp') || s.includes('youtube') || s.includes('tiktok')) return Globe;
    return Compass;
  };

  return (
    <div className="space-y-8">
      
      {/* Header with Title and Time Filter Selector */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2 text-indigo-600 font-bold text-xs uppercase tracking-wider">
            <BarChart3 className="w-4 h-4" />
            <span>Telemetry & Audience Insights</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 mt-1">Station Analytics</h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Real-time measurement of estimated visitor time on site, traffic sources, listeners, and streaming activity.
          </p>
        </div>

        {/* Refresh & Period Controls */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => loadStats()}
            title="Refresh Metrics"
            className="p-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 transition-colors shadow-2xs"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-indigo-600' : ''}`} />
          </button>

          {/* Time Filter Pills */}
          <div className="inline-flex p-1 bg-slate-200/70 rounded-2xl gap-1 text-xs font-semibold text-slate-600">
            {periods.map(p => (
              <button
                key={p.key}
                onClick={() => handlePeriodChange(p.key)}
                className={`px-3 py-1.5 rounded-xl transition-all ${
                  period === p.key
                    ? 'bg-white text-indigo-600 font-bold shadow-xs'
                    : 'hover:text-slate-900'
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Custom Date Range Picker Modal/Card */}
      {showCustomPicker && (
        <form onSubmit={handleApplyCustom} className="p-4 rounded-2xl bg-indigo-50 border border-indigo-200 flex flex-wrap items-center gap-4 animate-in fade-in">
          <div className="flex items-center gap-2 text-xs font-bold text-indigo-900">
            <Calendar className="w-4 h-4 text-indigo-600" />
            <span>Select Custom Range:</span>
          </div>
          <div className="flex items-center gap-2 text-xs">
            <label className="text-slate-600 font-medium">From:</label>
            <input
              type="date"
              required
              value={customStart}
              onChange={(e) => setCustomStart(e.target.value)}
              className="px-3 py-1.5 rounded-xl border border-slate-300 bg-white text-slate-800 text-xs font-medium focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <div className="flex items-center gap-2 text-xs">
            <label className="text-slate-600 font-medium">To:</label>
            <input
              type="date"
              required
              value={customEnd}
              onChange={(e) => setCustomEnd(e.target.value)}
              className="px-3 py-1.5 rounded-xl border border-slate-300 bg-white text-slate-800 text-xs font-medium focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <div className="flex items-center gap-2 ml-auto">
            <button
              type="submit"
              className="px-4 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-xs transition-colors"
            >
              Apply Filter
            </button>
            <button
              type="button"
              onClick={() => setShowCustomPicker(false)}
              className="px-3 py-1.5 rounded-xl bg-white border border-slate-300 text-slate-600 hover:bg-slate-100 text-xs font-semibold transition-colors"
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      {/* 4 PRIMARY METRIC CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* KPI 1: Estimated Time on Site (Crucial Requirement!) */}
        <div className="p-6 rounded-3xl bg-gradient-to-br from-indigo-900 via-indigo-950 to-slate-950 text-white border border-indigo-800/40 shadow-xl space-y-3 relative overflow-hidden">
          <div className="absolute top-0 right-0 p-6 opacity-10">
            <Clock className="w-24 h-24" />
          </div>
          <div className="flex items-center justify-between relative z-10">
            <span className="text-xs font-bold uppercase tracking-wider text-indigo-300 flex items-center gap-1.5">
              <Clock className="w-4 h-4 text-indigo-400" />
              <span>Est. Time on Site</span>
            </span>
            {growth.duration !== undefined && (
              <span className={`inline-flex items-center text-[11px] font-bold px-2 py-0.5 rounded-full ${
                growth.duration >= 0 ? 'bg-emerald-500/20 text-emerald-400' : 'bg-rose-500/20 text-rose-400'
              }`}>
                {growth.duration >= 0 ? <ArrowUpRight className="w-3 h-3 mr-0.5" /> : <ArrowDownRight className="w-3 h-3 mr-0.5" />}
                {Math.abs(growth.duration)}%
              </span>
            )}
          </div>
          <div className="relative z-10">
            <p className="text-3xl sm:text-4xl font-black text-white tracking-tight">
              {kpis.avgDurationFormatted || '0s'}
            </p>
            <p className="text-xs text-indigo-200/80 font-medium mt-1">
              Average session duration
            </p>
          </div>
          <div className="pt-2 border-t border-indigo-800/40 flex items-center justify-between text-[11px] text-indigo-300/90 relative z-10">
            <span>Total Time Spent:</span>
            <span className="font-mono font-bold text-white">{kpis.totalDurationFormatted || '0s'}</span>
          </div>
        </div>

        {/* KPI 2: Stream Plays & Listeners */}
        <div className="p-6 rounded-3xl bg-white border border-slate-200 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
              <Headphones className="w-4 h-4 text-sky-600" />
              <span>Stream Plays</span>
            </span>
            {growth.plays !== undefined && (
              <span className={`inline-flex items-center text-[11px] font-bold px-2 py-0.5 rounded-full ${
                growth.plays >= 0 ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'
              }`}>
                {growth.plays >= 0 ? <ArrowUpRight className="w-3 h-3 mr-0.5" /> : <ArrowDownRight className="w-3 h-3 mr-0.5" />}
                {Math.abs(growth.plays)}%
              </span>
            )}
          </div>
          <div>
            <p className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">
              {kpis.totalPlays || 0}
            </p>
            <p className="text-xs text-slate-500 font-medium mt-1">
              Broadcast audio starts
            </p>
          </div>
          <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
            <span>Listening Duration:</span>
            <span className="font-mono font-bold text-indigo-600">{kpis.totalListeningFormatted || '0s'}</span>
          </div>
        </div>

        {/* KPI 3: Unique Visitors & Sessions */}
        <div className="p-6 rounded-3xl bg-white border border-slate-200 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
              <Users className="w-4 h-4 text-purple-600" />
              <span>Audience Size</span>
            </span>
            {growth.visitors !== undefined && (
              <span className={`inline-flex items-center text-[11px] font-bold px-2 py-0.5 rounded-full ${
                growth.visitors >= 0 ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'
              }`}>
                {growth.visitors >= 0 ? <ArrowUpRight className="w-3 h-3 mr-0.5" /> : <ArrowDownRight className="w-3 h-3 mr-0.5" />}
                {Math.abs(growth.visitors)}%
              </span>
            )}
          </div>
          <div>
            <p className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">
              {kpis.totalVisitors || 0}
            </p>
            <p className="text-xs text-slate-500 font-medium mt-1">
              Unique audience listeners
            </p>
          </div>
          <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
            <span>Total Visits:</span>
            <span className="font-mono font-bold text-slate-900">{kpis.totalSessions || 0}</span>
          </div>
        </div>

        {/* KPI 4: Total Pageviews & Engagement */}
        <div className="p-6 rounded-3xl bg-white border border-slate-200 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
              <Eye className="w-4 h-4 text-emerald-600" />
              <span>Page Impressions</span>
            </span>
            <span className="text-[11px] font-bold text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">
              {kpis.bounceRate || 0}% bounce
            </span>
          </div>
          <div>
            <p className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">
              {kpis.totalPageviews || 0}
            </p>
            <p className="text-xs text-slate-500 font-medium mt-1">
              Total page views loaded
            </p>
          </div>
          <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
            <span>Avg Pages/Session:</span>
            <span className="font-mono font-bold text-slate-900">
              {kpis.totalSessions > 0 ? (kpis.totalPageviews / kpis.totalSessions).toFixed(1) : '1.0'}
            </span>
          </div>
        </div>

      </div>

      {/* SECTION 2: TIMELINE ACTIVITY CHART */}
      <div className="p-6 sm:p-8 rounded-3xl bg-white border border-slate-200 shadow-xs space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="space-y-1">
            <h2 className="font-extrabold text-base text-slate-900 flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-indigo-600" />
              <span>Activity Breakdown Over Time</span>
            </h2>
            <p className="text-xs text-slate-400">
              Comparing audience traffic, audio stream play starts, and estimated listening time.
            </p>
          </div>

          <div className="flex items-center gap-4 text-xs font-bold">
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-full bg-indigo-600"></span>
              <span className="text-slate-600">Visitors</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-full bg-sky-500"></span>
              <span className="text-slate-600">Audio Plays</span>
            </div>
          </div>
        </div>

        {/* Bar Timeline */}
        {timeline.length === 0 ? (
          <div className="h-48 flex items-center justify-center text-slate-400 text-xs">
            No telemetry recorded for this timeframe yet.
          </div>
        ) : (
          <div className="pt-6 pb-2 border-b border-slate-100 overflow-x-auto">
            <div className="flex items-end gap-2 sm:gap-4 min-w-[500px] h-64">
              {timeline.map((item, idx) => {
                const visitorHeight = Math.max(8, Math.round((item.visitors / maxTimelineVisitors) * 190));
                const playHeight = Math.max(6, Math.round((item.plays / maxTimelinePlays) * 190));

                return (
                  <div key={idx} className="flex-1 flex flex-col items-center justify-end h-full group relative">
                    {/* Tooltip */}
                    <div className="opacity-0 group-hover:opacity-100 transition-opacity absolute -top-14 z-20 pointer-events-none bg-slate-900 text-white text-[10px] rounded-xl px-2.5 py-1.5 shadow-lg whitespace-nowrap space-y-0.5">
                      <p className="font-bold text-indigo-300">{item.label}</p>
                      <p>{item.visitors} visitors • {item.plays} plays</p>
                      <p className="text-slate-300">{item.timeSpentMinutes}m spent</p>
                    </div>

                    <div className="flex items-end gap-1 w-full justify-center">
                      <div
                        style={{ height: `${visitorHeight}px` }}
                        className="w-2.5 sm:w-5 bg-indigo-600 rounded-t-md transition-all group-hover:bg-indigo-500 shadow-2xs"
                      />
                      <div
                        style={{ height: `${playHeight}px` }}
                        className="w-2.5 sm:w-5 bg-sky-400 rounded-t-md transition-all group-hover:bg-sky-300 shadow-2xs"
                      />
                    </div>
                    <span className="text-[10px] font-bold text-slate-400 mt-2 truncate max-w-[50px] text-center">
                      {item.dayName || item.label}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* SECTION 3: TRAFFIC SOURCES & AUDIENCE BEHAVIOR (Core user requirement!) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Card 1: Traffic Sources Breakdown (2 cols) */}
        <div className="lg:col-span-2 p-6 sm:p-8 rounded-3xl bg-white border border-slate-200 shadow-xs space-y-5">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <h2 className="font-extrabold text-base text-slate-900 flex items-center gap-2">
                <Compass className="w-4 h-4 text-indigo-600" />
                <span>Source of Traffic & Referrers</span>
              </h2>
              <p className="text-xs text-slate-400">
                Where your audience is arriving from and how long each cohort stays.
              </p>
            </div>
            <span className="text-xs font-bold text-slate-500">
              {trafficSources.length} sources detected
            </span>
          </div>

          {trafficSources.length === 0 ? (
            <div className="py-12 text-center text-slate-400 text-xs">
              No traffic source data available for this range.
            </div>
          ) : (
            <div className="space-y-3.5">
              {trafficSources.map((ts, idx) => {
                const IconComponent = getSourceIcon(ts.source);

                return (
                  <div key={idx} className="p-3.5 rounded-2xl bg-slate-50/80 border border-slate-100 hover:border-slate-200 transition-colors space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2 font-bold text-slate-900">
                        <div className="w-6 h-6 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-600">
                          <IconComponent className="w-3.5 h-3.5" />
                        </div>
                        <span>{ts.source}</span>
                      </div>
                      
                      <div className="flex items-center gap-4">
                        <span className="text-slate-500">
                          Avg: <strong className="text-slate-800 font-mono">{ts.avgDurationFormatted}</strong>
                        </span>
                        <span className="font-bold text-slate-900 font-mono">
                          {ts.count} <span className="text-[11px] font-normal text-slate-400">({ts.percentage}%)</span>
                        </span>
                      </div>
                    </div>

                    {/* Progress Bar */}
                    <div className="w-full bg-slate-200/80 rounded-full h-2 overflow-hidden">
                      <div
                        className="bg-indigo-600 h-2 rounded-full transition-all duration-500"
                        style={{ width: `${Math.max(4, ts.percentage)}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Card 2: Devices & Audience Platform Distribution (1 col) */}
        <div className="p-6 sm:p-8 rounded-3xl bg-white border border-slate-200 shadow-xs space-y-6">
          <div className="space-y-0.5">
            <h2 className="font-extrabold text-base text-slate-900 flex items-center gap-2">
              <Smartphone className="w-4 h-4 text-purple-600" />
              <span>Devices & Platforms</span>
            </h2>
            <p className="text-xs text-slate-400">
              Listener device hardware breakdown
            </p>
          </div>

          <div className="space-y-4">
            {deviceBreakdown.map((dev, idx) => {
              const DeviceIcon = dev.device === 'Mobile' ? Smartphone : (dev.device === 'Tablet' ? Tablet : Monitor);
              const colorClass = dev.device === 'Mobile' ? 'text-purple-600 bg-purple-50' : (dev.device === 'Tablet' ? 'text-amber-600 bg-amber-50' : 'text-sky-600 bg-sky-50');
              const barClass = dev.device === 'Mobile' ? 'bg-purple-600' : (dev.device === 'Tablet' ? 'bg-amber-500' : 'bg-sky-500');

              return (
                <div key={idx} className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2 font-bold text-slate-800">
                      <div className={`w-6 h-6 rounded-lg flex items-center justify-center ${colorClass}`}>
                        <DeviceIcon className="w-3.5 h-3.5" />
                      </div>
                      <span>{dev.device}</span>
                    </div>
                    <span className="font-mono font-bold text-slate-900">
                      {dev.count} <span className="text-[11px] font-normal text-slate-400">({dev.percentage}%)</span>
                    </span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                    <div className={`${barClass} h-2 rounded-full`} style={{ width: `${Math.max(4, dev.percentage)}%` }} />
                  </div>
                </div>
              );
            })}
          </div>

          {/* Quick Audio Telemetry Summary */}
          <div className="pt-4 border-t border-slate-100 space-y-2 text-xs text-slate-500">
            <div className="flex justify-between">
              <span>Avg Listening Session:</span>
              <span className="font-mono font-bold text-slate-900">{kpis.avgListeningFormatted || '0s'}</span>
            </div>
            <div className="flex justify-between">
              <span>Audio Play Rate:</span>
              <span className="font-mono font-bold text-indigo-600">
                {kpis.totalSessions > 0 ? Math.round((kpis.totalPlays / kpis.totalSessions) * 100) : 0}%
              </span>
            </div>
          </div>
        </div>

      </div>

      {/* SECTION 4: CONTENT & PAGES ENGAGEMENT */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Top Pages */}
        <div className="p-6 rounded-3xl bg-white border border-slate-200 shadow-xs space-y-4">
          <h3 className="font-extrabold text-sm text-slate-900 flex items-center gap-2">
            <Layers className="w-4 h-4 text-slate-700" />
            <span>Top Visited Station Pages</span>
          </h3>

          <div className="divide-y divide-slate-100 text-xs">
            {(stats?.topPages || []).map((page, idx) => (
              <div key={idx} className="py-2.5 flex items-center justify-between">
                <span className="font-mono text-slate-800 font-semibold truncate max-w-[200px]">
                  {page.path}
                </span>
                <div className="flex items-center gap-4 text-slate-500">
                  <span>Avg: <strong className="text-slate-700 font-mono">{page.avgTimeFormatted}</strong></span>
                  <span className="font-bold text-slate-900 font-mono">{page.views} views</span>
                </div>
              </div>
            ))}
            {(stats?.topPages || []).length === 0 && (
              <p className="py-4 text-slate-400 text-center">No pageview data recorded yet.</p>
            )}
          </div>
        </div>

        {/* Top Audio Streams */}
        <div className="p-6 rounded-3xl bg-white border border-slate-200 shadow-xs space-y-4">
          <h3 className="font-extrabold text-sm text-slate-900 flex items-center gap-2">
            <Radio className="w-4 h-4 text-indigo-600" />
            <span>Popular Stream Channels</span>
          </h3>

          <div className="divide-y divide-slate-100 text-xs">
            {(stats?.topStreams || []).map((stream, idx) => (
              <div key={idx} className="py-2.5 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Play className="w-3.5 h-3.5 text-indigo-600 fill-current" />
                  <span className="font-semibold text-slate-800">{stream.name}</span>
                </div>
                <span className="font-bold text-indigo-600 font-mono">{stream.plays} plays</span>
              </div>
            ))}
            {(stats?.topStreams || []).length === 0 && (
              <p className="py-4 text-slate-400 text-center">No stream plays recorded yet.</p>
            )}
          </div>
        </div>

      </div>

    </div>
  );
}

