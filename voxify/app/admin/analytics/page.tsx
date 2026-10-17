'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useAuth } from '@/lib/context/AuthContext';
import { AnalyticsSummary } from '@/lib/types/database.types';
import {
  BarChart3,
  Globe,
  Clock,
  Users,
  Eye,
  Smartphone,
  Monitor,
  Tablet,
  ArrowLeft,
  Loader2,
  ShieldCheck,
  TrendingUp,
  Music,
  Calendar,
  Layers,
  Sparkles,
  ExternalLink
} from 'lucide-react';

export default function SuperAdminAnalyticsPage() {
  const { user } = useAuth();
  const [timeframe, setTimeframe] = useState<'today' | '7d' | '30d' | '365d' | 'all'>('30d');
  const [analytics, setAnalytics] = useState<AnalyticsSummary | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadAnalytics() {
      if (!user?.is_super_admin) return;
      setLoading(true);
      try {
        const res = await fetch(`/api/analytics/summary?timeframe=${timeframe}`);
        const data = await res.json();
        setAnalytics(data);
      } catch (err) {
        console.log('Analytics load note:', err);
      } finally {
        setLoading(false);
      }
    }
    loadAnalytics();
  }, [user, timeframe]);

  if (!user?.is_super_admin) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col justify-center items-center p-6 text-white text-center space-y-4">
        <ShieldCheck className="w-16 h-16 text-rose-500 mx-auto animate-pulse" />
        <h1 className="text-2xl font-bold">Platform Super Admin Access Restricted</h1>
        <p className="text-xs text-slate-400 max-w-sm">This page is reserved for the platform administrator.</p>
        <Link href="/dashboard" className="bg-purple-600 text-white font-semibold px-4 py-2 rounded-xl text-xs">
          Return to Dashboard
        </Link>
      </div>
    );
  }

  const timeframeLabels: Record<string, string> = {
    today: 'Today (24 Hours)',
    '7d': 'Weekly (7 Days)',
    '30d': 'Monthly (30 Days)',
    '365d': 'Yearly (365 Days)',
    all: 'All Time',
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-6 md:p-10 space-y-8 max-w-7xl mx-auto">
      {/* Header Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-6">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-purple-600/20 border border-purple-500/30 p-1 flex items-center justify-center">
            <Image src="/logo.png" alt="Voxify Logo" width={40} height={40} className="object-contain" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="bg-purple-500/20 text-purple-300 text-[10px] px-2.5 py-0.5 rounded-full border border-purple-500/30 font-bold uppercase tracking-wider">
                Real-Time Traffic &amp; Web Insights
              </span>
            </div>
            <h1 className="text-3xl font-extrabold text-white flex items-center gap-3">
              <BarChart3 className="w-8 h-8 text-purple-400" /> Platform Analytics Hub
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/admin"
            className="bg-slate-900 border border-slate-800 hover:bg-slate-800 text-slate-300 font-semibold px-4 py-2.5 rounded-xl text-xs flex items-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" /> Super Admin Control Center
          </Link>
        </div>
      </div>

      {/* Timeframe Selector Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900/80 p-4 rounded-2xl border border-slate-800 shadow-lg">
        <div className="text-xs font-bold text-slate-300 flex items-center gap-2">
          <Clock className="w-4 h-4 text-purple-400" /> Filtering Range: <span className="text-purple-300 font-extrabold">{timeframeLabels[timeframe]}</span>
        </div>

        <div className="flex items-center gap-1.5 flex-wrap">
          {(['today', '7d', '30d', '365d', 'all'] as const).map((tf) => (
            <button
              key={tf}
              onClick={() => setTimeframe(tf)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                timeframe === tf
                  ? 'bg-purple-600 text-white shadow-md shadow-purple-600/30 scale-105'
                  : 'bg-slate-950 text-slate-400 hover:text-white hover:bg-slate-800 border border-slate-800'
              }`}
            >
              {tf === 'today' ? 'Today' : tf === '7d' ? '7 Days' : tf === '30d' ? '30 Days' : tf === '365d' ? '365 Days' : 'All Time'}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="py-24 text-center text-slate-400 space-y-3">
          <Loader2 className="w-10 h-10 text-purple-500 animate-spin mx-auto" />
          <p className="text-xs font-semibold">Aggregating platform web traffic, referrers &amp; user metrics...</p>
        </div>
      ) : (
        <>
          {/* 4 Hero Metric Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-gradient-to-br from-purple-950/40 to-slate-900 p-6 rounded-3xl border border-purple-500/30 space-y-2 relative overflow-hidden shadow-xl">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-purple-400 uppercase tracking-wider">Unique Visitors</span>
                <div className="w-9 h-9 rounded-2xl bg-purple-600/20 text-purple-300 flex items-center justify-center border border-purple-500/30">
                  <Users className="w-4 h-4" />
                </div>
              </div>
              <div className="text-3xl font-extrabold text-white">{analytics?.uniqueVisitorsCount || 0}</div>
              <p className="text-[11px] text-slate-400 flex items-center gap-1">
                <TrendingUp className="w-3 h-3 text-emerald-400" /> Distinct sessions in {timeframeLabels[timeframe]}
              </p>
            </div>

            <div className="bg-gradient-to-br from-indigo-950/40 to-slate-900 p-6 rounded-3xl border border-indigo-500/30 space-y-2 relative overflow-hidden shadow-xl">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-indigo-400 uppercase tracking-wider">Total Pageviews</span>
                <div className="w-9 h-9 rounded-2xl bg-indigo-600/20 text-indigo-300 flex items-center justify-center border border-indigo-500/30">
                  <Eye className="w-4 h-4" />
                </div>
              </div>
              <div className="text-3xl font-extrabold text-white">{analytics?.totalPageviewsCount || 0}</div>
              <p className="text-[11px] text-slate-400">Total page loads &amp; route clicks</p>
            </div>

            <div className="bg-gradient-to-br from-emerald-950/40 to-slate-900 p-6 rounded-3xl border border-emerald-500/30 space-y-2 relative overflow-hidden shadow-xl">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider">Avg. Session Time</span>
                <div className="w-9 h-9 rounded-2xl bg-emerald-500/20 text-emerald-300 flex items-center justify-center border border-emerald-500/30">
                  <Clock className="w-4 h-4" />
                </div>
              </div>
              <div className="text-3xl font-extrabold text-white">{analytics?.avgTimeSpentFormatted || '0s'}</div>
              <p className="text-[11px] text-slate-400">Average time spent per session</p>
            </div>

            <div className="bg-gradient-to-br from-amber-950/40 to-slate-900 p-6 rounded-3xl border border-amber-500/30 space-y-2 relative overflow-hidden shadow-xl">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-amber-400 uppercase tracking-wider">Registered Accounts</span>
                <div className="w-9 h-9 rounded-2xl bg-amber-600/20 text-amber-300 flex items-center justify-center border border-amber-500/30">
                  <ShieldCheck className="w-4 h-4" />
                </div>
              </div>
              <div className="text-3xl font-extrabold text-white">{analytics?.activeUsersCount || 0}</div>
              <p className="text-[11px] text-slate-400">Total active profiles on Voxify</p>
            </div>
          </div>

          {/* Traffic Sources & Visitor Trend Split */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            
            {/* Traffic Sources Breakdown (Where Users Come From) */}
            <div className="bg-slate-900/70 border border-slate-800 p-6 md:p-8 rounded-3xl space-y-6 shadow-xl">
              <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                <div>
                  <h3 className="text-lg font-bold text-white flex items-center gap-2">
                    <Globe className="w-5 h-5 text-purple-400" /> Visitor Traffic Sources
                  </h3>
                  <p className="text-xs text-slate-400">Where site visitors are arriving from</p>
                </div>
                <span className="text-xs text-purple-300 font-mono font-bold">
                  {analytics?.trafficSources.length || 0} Sources
                </span>
              </div>

              <div className="space-y-4">
                {!analytics?.trafficSources || analytics.trafficSources.length === 0 ? (
                  <div className="py-10 text-center text-slate-500 space-y-2">
                    <Globe className="w-8 h-8 mx-auto text-slate-600 opacity-60" />
                    <p className="text-xs font-semibold">No visitor traffic sources recorded yet for this timeframe.</p>
                    <p className="text-[11px] text-slate-600">Real visits will populate here automatically as users navigate Voxify.</p>
                  </div>
                ) : (
                  analytics.trafficSources.map((item) => (
                    <div key={item.source} className="space-y-1.5">
                      <div className="flex items-center justify-between text-xs font-semibold">
                        <span className="text-white flex items-center gap-2">
                          <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                          {item.source}
                        </span>
                        <div className="flex items-center gap-3 font-mono">
                          <span className="text-slate-400">{item.count} visit(s)</span>
                          <span className="text-purple-300 font-bold">{item.percentage}%</span>
                        </div>
                      </div>
                      <div className="w-full bg-slate-950 h-2.5 rounded-full overflow-hidden border border-slate-800">
                        <div
                          className="h-full rounded-full transition-all duration-500"
                          style={{ width: `${Math.max(item.percentage, 5)}%`, backgroundColor: item.color }}
                        />
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Top Visited Pages Ranking */}
            <div className="bg-slate-900/70 border border-slate-800 p-6 md:p-8 rounded-3xl space-y-6 shadow-xl">
              <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                <div>
                  <h3 className="text-lg font-bold text-white flex items-center gap-2">
                    <Layers className="w-5 h-5 text-indigo-400" /> Most Visited Pages &amp; Routes
                  </h3>
                  <p className="text-xs text-slate-400">Top user destinations across Voxify Space</p>
                </div>
              </div>

              <div className="space-y-3">
                {!analytics?.topPages || analytics.topPages.length === 0 ? (
                  <div className="py-10 text-center text-slate-500 space-y-2">
                    <Layers className="w-8 h-8 mx-auto text-slate-600 opacity-60" />
                    <p className="text-xs font-semibold">No page view data recorded yet for this timeframe.</p>
                    <p className="text-[11px] text-slate-600">Routes visited by users will be listed here in real time.</p>
                  </div>
                ) : (
                  analytics.topPages.map((page, idx) => (
                    <div key={page.path} className="bg-slate-950 p-3.5 rounded-2xl border border-slate-800/80 flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3 min-w-0">
                        <span className="w-6 h-6 rounded-xl bg-indigo-950/80 text-indigo-300 text-xs font-mono font-bold flex items-center justify-center shrink-0 border border-indigo-800/40">
                          #{idx + 1}
                        </span>
                        <div className="min-w-0">
                          <h4 className="text-xs font-bold text-white truncate">{page.label}</h4>
                          <p className="text-[10px] font-mono text-slate-500 truncate">{page.path}</p>
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <div className="text-xs font-bold text-indigo-300 font-mono">{page.views} views</div>
                        <div className="text-[10px] text-slate-500 font-semibold">{page.percentage}% of total</div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

          </div>

          {/* Device & Browser Distribution */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="bg-slate-900/70 border border-slate-800 p-6 md:p-8 rounded-3xl space-y-4 shadow-xl">
              <h3 className="text-lg font-bold text-white flex items-center gap-2 border-b border-slate-800 pb-3">
                <Monitor className="w-5 h-5 text-emerald-400" /> Device Type Distribution
              </h3>
              <div className="grid grid-cols-3 gap-4 pt-2">
                {analytics?.deviceBreakdown.map((d) => (
                  <div key={d.device} className="bg-slate-950 p-4 rounded-2xl border border-slate-800 text-center space-y-1">
                    {d.device === 'Mobile' ? (
                      <Smartphone className="w-6 h-6 text-purple-400 mx-auto" />
                    ) : d.device === 'Tablet' ? (
                      <Tablet className="w-6 h-6 text-indigo-400 mx-auto" />
                    ) : (
                      <Monitor className="w-6 h-6 text-emerald-400 mx-auto" />
                    )}
                    <h4 className="text-xs font-bold text-white pt-1">{d.device}</h4>
                    <div className="text-lg font-extrabold text-purple-300">{d.percentage}%</div>
                    <p className="text-[10px] text-slate-500">{d.count} session(s)</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Platform Content Activity Metrics */}
            <div className="bg-slate-900/70 border border-slate-800 p-6 md:p-8 rounded-3xl space-y-4 shadow-xl">
              <h3 className="text-lg font-bold text-white flex items-center gap-2 border-b border-slate-800 pb-3">
                <Sparkles className="w-5 h-5 text-amber-400" /> Platform Content Performance
              </h3>
              <div className="grid grid-cols-3 gap-4 pt-2">
                <Link href="/admin/choirs" className="bg-slate-950 p-4 rounded-2xl border border-slate-800 text-center space-y-1 hover:border-purple-500/40 transition-all group block">
                  <Music className="w-6 h-6 text-purple-400 mx-auto group-hover:scale-110 transition-transform" />
                  <h4 className="text-xs font-bold text-white pt-1">Active Choirs</h4>
                  <div className="text-lg font-extrabold text-purple-300">{analytics?.choirsCount || 0}</div>
                  <p className="text-[10px] text-slate-500">Registered choirs</p>
                </Link>

                <Link href="/songs" className="bg-slate-950 p-4 rounded-2xl border border-slate-800 text-center space-y-1 hover:border-indigo-500/40 transition-all group block">
                  <Layers className="w-6 h-6 text-indigo-400 mx-auto group-hover:scale-110 transition-transform" />
                  <h4 className="text-xs font-bold text-white pt-1">Song Parts</h4>
                  <div className="text-lg font-extrabold text-indigo-300">{analytics?.songsCount || 0}</div>
                  <p className="text-[10px] text-slate-500">Audio practice tracks</p>
                </Link>

                <Link href="/admin/events" className="bg-slate-950 p-4 rounded-2xl border border-slate-800 text-center space-y-1 hover:border-emerald-500/40 transition-all group block">
                  <Calendar className="w-6 h-6 text-emerald-400 mx-auto group-hover:scale-110 transition-transform" />
                  <h4 className="text-xs font-bold text-white pt-1">Total Events</h4>
                  <div className="text-lg font-extrabold text-emerald-300">{analytics?.eventsCount || 0}</div>
                  <p className="text-[10px] text-slate-500">Worship rehearsals</p>
                </Link>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
