import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  Palette,
  Radio,
  Calendar,
  Newspaper,
  Video,
  BarChart3,
  SlidersHorizontal,
  Settings,
  ArrowRight,
  ExternalLink,
  Activity,
  Layers,
  Users,
  CheckCircle2,
} from 'lucide-react';
import { api } from '../../api/client';

export function AdminDashboardPage() {
  const { isSuperAdmin, activeAdminStation } = useAuth();
  const [stats, setStats] = useState(null);
  const [superStats, setSuperStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadDashboard() {
      setLoading(true);
      try {
        if (isSuperAdmin) {
          const sData = await api.get('/superadmin/stats');
          setSuperStats(sData);
        }

        if (activeAdminStation?.id) {
          const aData = await api.get(`/stations/${activeAdminStation.id}/analytics/stats`);
          setStats(aData);
        }
      } catch (err) {
        console.error('Failed to load dashboard stats:', err);
      } finally {
        setLoading(false);
      }
    }

    loadDashboard();
  }, [isSuperAdmin, activeAdminStation?.id]);

  return (
    <div className="space-y-8">
      
      {/* Top Banner */}
      <div className="p-6 sm:p-8 rounded-3xl bg-slate-900 text-white flex flex-col md:flex-row items-start md:items-center justify-between gap-6 shadow-xl">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse"></span>
            <span className="text-xs font-bold text-emerald-400 uppercase tracking-widest">
              Live Station Management Console
            </span>
          </div>
          <h1 className="text-2xl sm:text-4xl font-black tracking-tight">
            {activeAdminStation?.name || 'Radio Admin Hub'}
          </h1>
          <p className="text-xs sm:text-sm text-slate-400">
            Current Station Slug: <code className="text-indigo-400 font-mono">/station/{activeAdminStation?.slug}</code>
          </p>
        </div>

        <div className="flex items-center gap-3">
          <a
            href={`/station/${activeAdminStation?.slug}`}
            target="_blank"
            rel="noopener noreferrer"
            className="px-4 py-2.5 rounded-xl font-bold text-xs bg-indigo-600 hover:bg-indigo-500 text-white flex items-center gap-2 shadow-md transition-transform active:scale-95"
          >
            <span>View Public Website</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>
      </div>

      {/* Super Admin Global Metrics (if Super Admin) */}
      {isSuperAdmin && superStats && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-500">Platform-Wide Overview</h2>
            <Link to="/admin/superadmin/stats" className="text-xs font-bold text-indigo-600 hover:underline">
              Detailed Platform Analytics →
            </Link>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs">
              <span className="text-xs font-semibold text-slate-500">Total Radio Stations</span>
              <p className="text-3xl font-black text-slate-900 mt-1">{superStats.totalStations}</p>
              <span className="text-[11px] text-emerald-600 font-bold mt-1 block">{superStats.activeStations} Active</span>
            </div>

            <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs">
              <span className="text-xs font-semibold text-slate-500">Active Audio Streams</span>
              <p className="text-3xl font-black text-slate-900 mt-1">{superStats.activeStreams}</p>
              <span className="text-[11px] text-slate-400 font-medium mt-1 block">Across all frequencies</span>
            </div>

            <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs">
              <span className="text-xs font-semibold text-slate-500">Station Administrators</span>
              <p className="text-3xl font-black text-slate-900 mt-1">{superStats.totalAdmins}</p>
              <span className="text-[11px] text-indigo-600 font-bold mt-1 block">Assigned operators</span>
            </div>

            <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs">
              <span className="text-xs font-semibold text-slate-500">Total News Published</span>
              <p className="text-3xl font-black text-slate-900 mt-1">{superStats.totalPublishedArticles}</p>
              <span className="text-[11px] text-slate-400 font-medium mt-1 block">Across stations</span>
            </div>
          </div>
        </div>
      )}

      {/* Station Specific Stats */}
      <div className="space-y-4">
        <h2 className="text-sm font-bold uppercase tracking-wider text-slate-500">
          Station Snapshot: {activeAdminStation?.name}
        </h2>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs">
            <span className="text-xs font-semibold text-slate-500">Live Audio Plays</span>
            <p className="text-3xl font-black text-indigo-600 mt-1">{stats?.totalPlays || 0}</p>
            <span className="text-[11px] text-slate-400 font-medium">Logged listener sessions</span>
          </div>

          <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs">
            <span className="text-xs font-semibold text-slate-500">Page Views</span>
            <p className="text-3xl font-black text-slate-900 mt-1">{stats?.totalPageviews || 0}</p>
            <span className="text-[11px] text-slate-400 font-medium">Public homepage visits</span>
          </div>

          <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs">
            <span className="text-xs font-semibold text-slate-500">Scheduled Shows</span>
            <p className="text-3xl font-black text-slate-900 mt-1">{stats?.activePrograms || 0}</p>
            <span className="text-[11px] text-emerald-600 font-bold">On weekly roster</span>
          </div>

          <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs">
            <span className="text-xs font-semibold text-slate-500">Published News Articles</span>
            <p className="text-3xl font-black text-slate-900 mt-1">{stats?.totalArticles || 0}</p>
            <span className="text-[11px] text-slate-400 font-medium">{stats?.totalNewsViews || 0} total reads</span>
          </div>
        </div>
      </div>

      {/* Quick Action Navigation Grid */}
      <div className="space-y-4">
        <h2 className="text-sm font-bold uppercase tracking-wider text-slate-500">Quick Configuration Shortcuts</h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <Link
            to="/admin/appearance"
            className="p-5 rounded-2xl bg-white border border-slate-200 hover:border-indigo-500 shadow-xs hover:shadow-md transition-all flex items-center justify-between group"
          >
            <div className="flex items-center gap-3.5">
              <div className="w-11 h-11 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center group-hover:scale-110 transition-transform">
                <Palette className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-sm text-slate-900">Appearance & Themes</h3>
                <p className="text-xs text-slate-400">Change Theme (1-5), Logo, Colors & Font</p>
              </div>
            </div>
            <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-indigo-600 group-hover:translate-x-1 transition-all" />
          </Link>

          <Link
            to="/admin/streams"
            className="p-5 rounded-2xl bg-white border border-slate-200 hover:border-indigo-500 shadow-xs hover:shadow-md transition-all flex items-center justify-between group"
          >
            <div className="flex items-center gap-3.5">
              <div className="w-11 h-11 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center group-hover:scale-110 transition-transform">
                <Radio className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-sm text-slate-900">Radio Streams</h3>
                <p className="text-xs text-slate-400">Configure stream URLs & formats</p>
              </div>
            </div>
            <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-indigo-600 group-hover:translate-x-1 transition-all" />
          </Link>

          <Link
            to="/admin/programs"
            className="p-5 rounded-2xl bg-white border border-slate-200 hover:border-indigo-500 shadow-xs hover:shadow-md transition-all flex items-center justify-between group"
          >
            <div className="flex items-center gap-3.5">
              <div className="w-11 h-11 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center group-hover:scale-110 transition-transform">
                <Calendar className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-sm text-slate-900">Programs & Timetable</h3>
                <p className="text-xs text-slate-400">Add shows and presenter schedules</p>
              </div>
            </div>
            <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-indigo-600 group-hover:translate-x-1 transition-all" />
          </Link>

          <Link
            to="/admin/news"
            className="p-5 rounded-2xl bg-white border border-slate-200 hover:border-indigo-500 shadow-xs hover:shadow-md transition-all flex items-center justify-between group"
          >
            <div className="flex items-center gap-3.5">
              <div className="w-11 h-11 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center group-hover:scale-110 transition-transform">
                <Newspaper className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-sm text-slate-900">News CMS</h3>
                <p className="text-xs text-slate-400">Write stories with Postimages workflow</p>
              </div>
            </div>
            <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-indigo-600 group-hover:translate-x-1 transition-all" />
          </Link>

          <Link
            to="/admin/sections"
            className="p-5 rounded-2xl bg-white border border-slate-200 hover:border-indigo-500 shadow-xs hover:shadow-md transition-all flex items-center justify-between group"
          >
            <div className="flex items-center gap-3.5">
              <div className="w-11 h-11 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center group-hover:scale-110 transition-transform">
                <SlidersHorizontal className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-sm text-slate-900">Homepage Sections</h3>
                <p className="text-xs text-slate-400">Toggle player, on-air, news, videos</p>
              </div>
            </div>
            <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-indigo-600 group-hover:translate-x-1 transition-all" />
          </Link>

          <Link
            to="/admin/settings"
            className="p-5 rounded-2xl bg-white border border-slate-200 hover:border-indigo-500 shadow-xs hover:shadow-md transition-all flex items-center justify-between group"
          >
            <div className="flex items-center gap-3.5">
              <div className="w-11 h-11 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center group-hover:scale-110 transition-transform">
                <Settings className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-sm text-slate-900">Station Settings</h3>
                <p className="text-xs text-slate-400">Contact, social links & SEO tags</p>
              </div>
            </div>
            <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-indigo-600 group-hover:translate-x-1 transition-all" />
          </Link>
        </div>
      </div>

    </div>
  );
}
