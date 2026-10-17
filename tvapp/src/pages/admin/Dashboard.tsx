import React, { useEffect, useState } from 'react';
import {
  Users,
  Radio,
  Tv,
  Eye,
  TrendingUp,
  Calendar,
  Activity,
  ArrowUpRight,
  Sparkles,
  ExternalLink,
} from 'lucide-react';
import { Inbox, Mail, MessageSquare } from 'lucide-react';
import { AnalyticsOverview, AnalyticsChartsData, Station } from '../../types';
import { getAnalyticsOverview, getAnalyticsCharts, getStations, getAdminFeedback } from '../../services/api';
import { AdminLayout } from '../../components/layout/AdminLayout';
import { Link } from 'react-router-dom';

export const DashboardPage: React.FC = () => {
  const [overview, setOverview] = useState<AnalyticsOverview | null>(null);
  const [charts, setCharts] = useState<AnalyticsChartsData | null>(null);
  const [stations, setStations] = useState<Station[]>([]);
  const [feedbackStats, setFeedbackStats] = useState<{ total: number; unread: number }>({ total: 0, unread: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const [overviewData, chartsData, stationsData, feedbackData] = await Promise.all([
          getAnalyticsOverview(),
          getAnalyticsCharts('7d'),
          getStations({ include_inactive: true }),
          getAdminFeedback().catch(() => ({ stats: { total: 0, unread: 0 } })),
        ]);

        setOverview(overviewData);
        setCharts(chartsData);
        setStations(stationsData);
        if (feedbackData?.stats) {
          setFeedbackStats({ total: feedbackData.stats.total, unread: feedbackData.stats.unread });
        }
      } catch (err) {
        console.error('Failed to load dashboard data:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboard();
  }, []);


  if (loading) {
    return (
      <AdminLayout>
        <div className="h-96 flex items-center justify-center">
          <div className="animate-spin rounded-full h-10 w-10 border-4 border-rba-blue border-t-transparent" />
        </div>
      </AdminLayout>
    );
  }

  const visitorCards = [
    { label: 'Total Visitors', value: overview?.totalVisitors || 0, icon: Users, color: 'text-rba-blue', bg: 'bg-rba-blue/10' },
    { label: 'Visitors Today', value: overview?.visitorsToday || 0, icon: Activity, color: 'text-emerald-600', bg: 'bg-emerald-50' },
    { label: 'Visitors Yesterday', value: overview?.visitorsYesterday || 0, icon: Calendar, color: 'text-slate-600', bg: 'bg-slate-100' },
    { label: 'Visitors This Week', value: overview?.visitorsThisWeek || 0, icon: TrendingUp, color: 'text-indigo-600', bg: 'bg-indigo-50' },
    { label: 'Visitors This Month', value: overview?.visitorsThisMonth || 0, icon: Users, color: 'text-purple-600', bg: 'bg-purple-50' },
    { label: 'Visitors This Year', value: overview?.visitorsThisYear || 0, icon: Sparkles, color: 'text-amber-600', bg: 'bg-amber-50' },
  ];

  const mediaCards = [
    { label: 'Radio Plays Today', value: overview?.radioPlaysToday || 0, icon: Radio, color: 'text-amber-600', bg: 'bg-amber-50' },
    { label: 'TV Plays Today', value: overview?.tvPlaysToday || 0, icon: Tv, color: 'text-red-600', bg: 'bg-red-50' },
    { label: 'Video Views Today', value: overview?.videoViewsToday || 0, icon: Eye, color: 'text-rba-blue', bg: 'bg-rba-blue/10' },
  ];

  return (
    <AdminLayout>
      <div className="space-y-8 max-w-7xl mx-auto">
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              Executive Dashboard
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              Live broadcast streaming statistics and real-time audience telemetry
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 text-emerald-700 font-bold text-xs border border-emerald-200">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
              PostgreSQL Telemetry Live
            </span>
          </div>
        </div>

        {/* Unread Feedback Alert Callout */}
        {feedbackStats.unread > 0 && (
          <div className="p-4 rounded-2xl bg-gradient-to-r from-red-500 via-rose-500 to-pink-600 text-white shadow-md flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-white/20 text-white shrink-0">
                <Inbox className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-extrabold text-sm">You have {feedbackStats.unread} unread feedback message{feedbackStats.unread > 1 ? 's' : ''}!</h3>
                <p className="text-xs text-red-100">Audience members have sent inquiries or suggestions via the site.</p>
              </div>
            </div>
            <Link
              to="/admin/feedback"
              className="px-4 py-2 rounded-xl bg-white text-slate-900 font-bold text-xs hover:bg-slate-100 transition-colors shadow-sm shrink-0"
            >
              View Inquiries →
            </Link>
          </div>
        )}

        {/* Coffee Blessings Quick Banner */}
        <div className="p-5 rounded-3xl bg-gradient-to-r from-amber-600 via-amber-500 to-orange-600 text-white shadow-lg flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-black/20 backdrop-blur-md flex items-center justify-center text-2xl shrink-0 shadow-inner">
              ☕
            </div>
            <div>
              <h3 className="font-black text-base tracking-tight">Coffee Blessings & Supporter Portal</h3>
              <p className="text-xs text-amber-100">Confidential admin view for supporter blessings, gifts, and direct WhatsApp thank-you notes.</p>
            </div>
          </div>
          <Link
            to="/admin/donations"
            className="px-5 py-2.5 rounded-xl bg-slate-950 hover:bg-slate-900 text-amber-300 font-extrabold text-xs transition-transform hover:scale-105 shadow-md shrink-0 flex items-center gap-1.5"
          >
            <span>Check Coffee Blessings ☕</span>
            <span>→</span>
          </Link>
        </div>


        {/* Section 1: Visitor Stats Grid */}
        <div>
          <h2 className="text-sm font-bold text-slate-700 uppercase tracking-wider mb-4">
            Audience Traffic & Visitors
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
            {visitorCards.map((card, i) => {
              const Icon = card.icon;
              return (
                <div key={i} className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm flex flex-col justify-between">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[11px] font-bold text-slate-500">{card.label}</span>
                    <div className={`p-1.5 rounded-lg ${card.bg} ${card.color}`}>
                      <Icon className="w-3.5 h-3.5" />
                    </div>
                  </div>
                  <div className="text-xl sm:text-2xl font-black text-slate-900">
                    {card.value.toLocaleString()}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Section 2: Media Plays Today */}
        <div>
          <h2 className="text-sm font-bold text-slate-700 uppercase tracking-wider mb-4">
            Today's Media Engagement
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
            {mediaCards.map((card, i) => {
              const Icon = card.icon;
              return (
                <div key={i} className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm flex items-center gap-4">
                  <div className={`p-3.5 rounded-2xl ${card.bg} ${card.color} shrink-0`}>
                    <Icon className="w-6 h-6" />
                  </div>
                  <div>
                    <span className="text-xs font-bold text-slate-500 block">{card.label}</span>
                    <span className="text-2xl sm:text-3xl font-black text-slate-900">
                      {card.value.toLocaleString()}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Section 3: Charts & Station Breakdown */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* Recent 7-day Activity Chart */}
          <div className="lg:col-span-8 bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-extrabold text-slate-900 text-base">Media Activity Trends</h3>
                <p className="text-xs text-slate-500">Radio plays, TV streams, and page views past 7 days</p>
              </div>
              <Link to="/admin/analytics" className="text-xs font-bold text-rba-blue hover:underline">
                Deep Dive Analytics →
              </Link>
            </div>

            {/* Visual Bar Graph */}
            <div className="pt-6">
              {charts?.timeseries && charts.timeseries.length > 0 ? (
                <div className="space-y-3">
                  {charts.timeseries.map((pt) => {
                    const total = pt.page_views + pt.radio_plays + pt.tv_plays + pt.video_views;
                    const max = 50; // visual scaling ceiling
                    const radioPct = Math.min(100, (pt.radio_plays / Math.max(1, total)) * 100);
                    const tvPct = Math.min(100, (pt.tv_plays / Math.max(1, total)) * 100);

                    return (
                      <div key={pt.date_label} className="flex items-center gap-3 text-xs">
                        <span className="w-20 font-mono text-slate-500 shrink-0">{pt.date_label}</span>
                        <div className="flex-1 h-6 bg-slate-100 rounded-lg overflow-hidden flex items-center">
                          <div
                            style={{ width: `${Math.min(100, (pt.radio_plays / 20) * 100)}%` }}
                            className="h-full bg-amber-400"
                            title={`Radio: ${pt.radio_plays}`}
                          />
                          <div
                            style={{ width: `${Math.min(100, (pt.tv_plays / 20) * 100)}%` }}
                            className="h-full bg-rba-blue"
                            title={`TV: ${pt.tv_plays}`}
                          />
                          <div
                            style={{ width: `${Math.min(100, (pt.page_views / 50) * 100)}%` }}
                            className="h-full bg-slate-300"
                            title={`Page views: ${pt.page_views}`}
                          />
                        </div>
                        <span className="w-12 text-right font-bold text-slate-700 shrink-0">
                          {total}
                        </span>
                      </div>
                    );
                  })}

                  <div className="flex items-center justify-end gap-5 pt-3 text-[11px] font-semibold text-slate-600">
                    <span className="flex items-center gap-1.5">
                      <span className="w-3 h-3 rounded bg-amber-400" /> Radio Plays
                    </span>
                    <span className="flex items-center gap-1.5">
                      <span className="w-3 h-3 rounded bg-rba-blue" /> TV Streams
                    </span>
                    <span className="flex items-center gap-1.5">
                      <span className="w-3 h-3 rounded bg-slate-300" /> Page Views
                    </span>
                  </div>
                </div>
              ) : (
                <div className="h-40 flex items-center justify-center text-xs text-slate-400">
                  No data accumulated yet. Plays and visits will populate here automatically.
                </div>
              )}
            </div>
          </div>

          {/* Broadcast Stations Quick Status List */}
          <div className="lg:col-span-4 bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-extrabold text-slate-900 text-base">Station Streams ({stations.length})</h3>
              <Link to="/admin/stations" className="text-xs font-bold text-rba-blue hover:underline">
                Manage
              </Link>
            </div>

            <div className="space-y-2.5 max-h-[340px] overflow-y-auto pr-1">
              {stations.map((st) => (
                <div
                  key={st.id}
                  className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-200/80 text-xs"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <img src={st.logo_url || '/logo.png'} alt={st.name} className="w-7 h-7 object-contain rounded shrink-0" />
                    <div className="min-w-0">
                      <p className="font-bold text-slate-900 truncate">{st.name}</p>
                      <p className="text-[10px] text-slate-500">{st.station_type} • {st.stream_type}</p>
                    </div>
                  </div>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                    st.status === 'ONLINE' ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'
                  }`}>
                    {st.status}
                  </span>
                </div>
              ))}
            </div>
          </div>

        </div>

      </div>
    </AdminLayout>
  );
};
