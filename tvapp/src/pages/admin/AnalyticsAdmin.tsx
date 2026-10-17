import React, { useEffect, useState } from 'react';
import {
  BarChart3,
  Calendar,
  Download,
  Users,
  Radio,
  Tv,
  Eye,
  Globe,
  Smartphone,
  Monitor,
  Tablet,
  Filter,
  RefreshCw,
} from 'lucide-react';
import { AnalyticsOverview, AnalyticsChartsData } from '../../types';
import { getAnalyticsOverview, getAnalyticsCharts } from '../../services/api';
import { AdminLayout } from '../../components/layout/AdminLayout';

export const AnalyticsAdminPage: React.FC = () => {
  const [overview, setOverview] = useState<AnalyticsOverview | null>(null);
  const [charts, setCharts] = useState<AnalyticsChartsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [range, setRange] = useState<string>('7d');
  const [customStart, setCustomStart] = useState<string>('');
  const [customEnd, setCustomEnd] = useState<string>('');

  const fetchAnalytics = async (selectedRange = range) => {
    setLoading(true);
    try {
      const [ovData, chData] = await Promise.all([
        getAnalyticsOverview(),
        getAnalyticsCharts(selectedRange, customStart || undefined, customEnd || undefined),
      ]);
      setOverview(ovData);
      setCharts(chData);
    } catch (err) {
      console.error('Failed to load analytics:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, [range]);

  const handleCustomFilterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (customStart && customEnd) {
      setRange('custom');
      fetchAnalytics('custom');
    }
  };

  const handleExportCSV = () => {
    window.open('/api/analytics/export', '_blank');
  };

  const rangeButtons = [
    { label: 'Today', value: 'today' },
    { label: 'Yesterday', value: 'yesterday' },
    { label: 'Last 7 Days', value: '7d' },
    { label: 'Last 30 Days', value: '30d' },
    { label: 'This Month', value: 'this_month' },
    { label: 'This Year', value: 'year' },
  ];

  return (
    <AdminLayout>
      <div className="space-y-8 max-w-7xl mx-auto">
        
        {/* Top Header & Export */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              Audience & Stream Analytics
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              Real PostgreSQL session metrics, media playback events, and traffic telemetry
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => fetchAnalytics()}
              disabled={loading}
              className="p-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold flex items-center gap-1.5 transition-colors"
              title="Refresh metrics"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>

            <button
              onClick={handleExportCSV}
              className="px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-black text-white font-bold text-xs flex items-center gap-2 shadow-md transition-colors"
            >
              <Download className="w-4 h-4 text-rba-yellow" /> Export CSV
            </button>
          </div>
        </div>

        {/* Date Filters Bar */}
        <div className="bg-white p-4 rounded-3xl border border-slate-200 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-1.5 w-full md:w-auto">
            {rangeButtons.map((btn) => (
              <button
                key={btn.value}
                onClick={() => setRange(btn.value)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
                  range === btn.value
                    ? 'bg-rba-navy text-white shadow-sm'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {btn.label}
              </button>
            ))}
          </div>

          {/* Custom Date Range */}
          <form onSubmit={handleCustomFilterSubmit} className="flex items-center gap-2 w-full md:w-auto text-xs">
            <input
              type="date"
              value={customStart}
              onChange={(e) => setCustomStart(e.target.value)}
              className="px-2.5 py-1.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-rba-blue bg-slate-50"
            />
            <span className="text-slate-400">to</span>
            <input
              type="date"
              value={customEnd}
              onChange={(e) => setCustomEnd(e.target.value)}
              className="px-2.5 py-1.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-rba-blue bg-slate-50"
            />
            <button
              type="submit"
              className="px-3 py-1.5 rounded-xl bg-rba-blue text-white font-bold hover:bg-rba-blueHover transition-colors"
            >
              Apply
            </button>
          </form>
        </div>

        {/* Key Metrics Overview Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
          <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm">
            <span className="text-[11px] font-bold text-slate-500 block mb-1">Total Visitors</span>
            <span className="text-2xl font-black text-slate-900">
              {overview?.totalVisitors.toLocaleString()}
            </span>
          </div>
          <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm">
            <span className="text-[11px] font-bold text-slate-500 block mb-1">Visitors Today</span>
            <span className="text-2xl font-black text-emerald-600">
              {overview?.visitorsToday.toLocaleString()}
            </span>
          </div>
          <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm">
            <span className="text-[11px] font-bold text-slate-500 block mb-1">Total Page Views</span>
            <span className="text-2xl font-black text-indigo-600">
              {overview?.totalPageViews.toLocaleString()}
            </span>
          </div>
          <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm">
            <span className="text-[11px] font-bold text-slate-500 block mb-1">Radio Plays (Today)</span>
            <span className="text-2xl font-black text-amber-500">
              {overview?.radioPlaysToday.toLocaleString()}
            </span>
          </div>
          <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm">
            <span className="text-[11px] font-bold text-slate-500 block mb-1">TV Plays (Today)</span>
            <span className="text-2xl font-black text-red-600">
              {overview?.tvPlaysToday.toLocaleString()}
            </span>
          </div>
          <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm">
            <span className="text-[11px] font-bold text-slate-500 block mb-1">Video Views (Today)</span>
            <span className="text-2xl font-black text-rba-blue">
              {overview?.videoViewsToday.toLocaleString()}
            </span>
          </div>
        </div>

        {/* Time-Series Activity Bar Graph */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-4">
          <div>
            <h3 className="text-lg font-extrabold text-slate-900">Media & Traffic Time-Series</h3>
            <p className="text-xs text-slate-500">Distribution over selected period</p>
          </div>

          <div className="space-y-3 pt-4">
            {charts?.timeseries && charts.timeseries.length > 0 ? (
              charts.timeseries.map((pt) => {
                const total = pt.page_views + pt.radio_plays + pt.tv_plays + pt.video_views;
                return (
                  <div key={pt.date_label} className="flex items-center gap-3 text-xs">
                    <span className="w-24 font-mono text-slate-500 shrink-0">{pt.date_label}</span>
                    <div className="flex-1 h-7 bg-slate-100 rounded-xl overflow-hidden flex items-center p-0.5">
                      <div
                        style={{ width: `${Math.min(100, (pt.radio_plays / 20) * 100)}%` }}
                        className="h-full bg-amber-400 rounded-l-lg transition-all"
                        title={`Radio Plays: ${pt.radio_plays}`}
                      />
                      <div
                        style={{ width: `${Math.min(100, (pt.tv_plays / 20) * 100)}%` }}
                        className="h-full bg-rba-blue transition-all"
                        title={`TV Streams: ${pt.tv_plays}`}
                      />
                      <div
                        style={{ width: `${Math.min(100, (pt.page_views / 40) * 100)}%` }}
                        className="h-full bg-slate-300 rounded-r-lg transition-all"
                        title={`Page Views: ${pt.page_views}`}
                      />
                    </div>
                    <span className="w-14 text-right font-black text-slate-800">{total}</span>
                  </div>
                );
              })
            ) : (
              <div className="py-12 text-center text-xs text-slate-400">
                No events recorded in this date range.
              </div>
            )}
          </div>
        </div>

        {/* Demographics & Breakdown Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          
          {/* Traffic Sources */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-4">
            <h3 className="font-extrabold text-slate-900 text-sm">Traffic Sources</h3>
            <div className="space-y-3">
              {charts?.trafficSources && charts.trafficSources.length > 0 ? (
                charts.trafficSources.map((item) => (
                  <div key={item.name} className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-slate-700">{item.name}</span>
                    <span className="font-bold text-rba-blue px-2 py-0.5 bg-slate-100 rounded-lg">
                      {item.value} visits
                    </span>
                  </div>
                ))
              ) : (
                <p className="text-xs text-slate-400">Direct / Search visits will appear here.</p>
              )}
            </div>
          </div>

          {/* Devices */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-4">
            <h3 className="font-extrabold text-slate-900 text-sm">Device Categories</h3>
            <div className="space-y-3">
              {charts?.devices && charts.devices.length > 0 ? (
                charts.devices.map((item) => (
                  <div key={item.name} className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-slate-700">{item.name}</span>
                    <span className="font-bold text-slate-900 px-2 py-0.5 bg-slate-100 rounded-lg">
                      {item.value}
                    </span>
                  </div>
                ))
              ) : (
                <p className="text-xs text-slate-400">Desktop / Mobile clients will appear here.</p>
              )}
            </div>
          </div>

          {/* Operating Systems & Browsers */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-4">
            <h3 className="font-extrabold text-slate-900 text-sm">Top Operating Systems</h3>
            <div className="space-y-3">
              {charts?.operatingSystems && charts.operatingSystems.length > 0 ? (
                charts.operatingSystems.map((item) => (
                  <div key={item.name} className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-slate-700">{item.name}</span>
                    <span className="font-bold text-slate-800 px-2 py-0.5 bg-slate-100 rounded-lg">
                      {item.value}
                    </span>
                  </div>
                ))
              ) : (
                <p className="text-xs text-slate-400">OS telemetry will record here.</p>
              )}
            </div>
          </div>

        </div>

        {/* Top Stations & Videos Row */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Top Radio Stations */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-4">
            <h3 className="font-extrabold text-slate-900 text-sm flex items-center gap-2">
              <Radio className="w-4 h-4 text-amber-500" />
              Most Played Radio Stations
            </h3>
            <div className="space-y-2">
              {charts?.topStations && charts.topStations.length > 0 ? (
                charts.topStations.map((st) => (
                  <div
                    key={st.id}
                    className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-100 text-xs"
                  >
                    <div className="flex items-center gap-2.5">
                      <img src={st.logo_url || '/logo.png'} alt={st.name} className="w-6 h-6 object-contain" />
                      <div>
                        <span className="font-bold text-slate-900">{st.name}</span>
                        <span className="text-[10px] text-slate-400 ml-2">{st.frequency}</span>
                      </div>
                    </div>
                    <span className="font-extrabold text-amber-600">{st.plays} plays</span>
                  </div>
                ))
              ) : (
                <p className="text-xs text-slate-400">No radio plays recorded yet.</p>
              )}
            </div>
          </div>

          {/* Top Videos */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-4">
            <h3 className="font-extrabold text-slate-900 text-sm flex items-center gap-2">
              <Tv className="w-4 h-4 text-rba-blue" />
              Top Watched Videos
            </h3>
            <div className="space-y-2">
              {charts?.topVideos && charts.topVideos.length > 0 ? (
                charts.topVideos.map((vid) => (
                  <div
                    key={vid.id}
                    className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-100 text-xs"
                  >
                    <span className="font-bold text-slate-900 line-clamp-1 max-w-xs">{vid.title}</span>
                    <span className="font-extrabold text-rba-blue shrink-0">{vid.views_count} views</span>
                  </div>
                ))
              ) : (
                <p className="text-xs text-slate-400">No video views recorded yet.</p>
              )}
            </div>
          </div>
        </div>

      </div>
    </AdminLayout>
  );
};
