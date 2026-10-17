import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  Megaphone,
  Eye,
  MousePointer,
  Clock,
  ExternalLink,
  ShieldCheck,
  AlertTriangle,
  Sparkles,
  TrendingUp,
  Tv,
} from 'lucide-react';
import { CustomAd } from '../types';
import { getPublicAdAnalyticsByToken } from '../services/api';
import { SEO } from '../components/common/SEO';

export const PublicAdAnalyticsPage: React.FC = () => {
  const { token } = useParams<{ token: string }>();

  const [ad, setAd] = useState<CustomAd | null>(null);
  const [timeseries, setTimeseries] = useState<Array<{ date_label: string; impressions: number; clicks: number }>>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!token) return;

    const loadAnalytics = async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await getPublicAdAnalyticsByToken(token);
        setAd(data.ad);
        setTimeseries(data.timeseries || []);
      } catch (err: any) {
        setError(err.message || 'Analytics report link expired or invalid.');
      } finally {
        setLoading(false);
      }
    };

    loadAnalytics();
  }, [token]);

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-900 text-white p-4">
        <div className="animate-spin rounded-full h-10 w-10 border-4 border-rba-yellow border-t-transparent mb-4" />
        <p className="font-extrabold text-sm tracking-wide">Retrieving Live Ad Analytics...</p>
      </div>
    );
  }

  if (error || !ad) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-900 text-white p-6 select-none">
        <SEO title="Analytics Expired - Benix Space TV" description="Ad analytics link has expired." />
        <div className="max-w-md w-full p-8 rounded-3xl bg-slate-800/80 border border-slate-700 text-center space-y-4 shadow-2xl">
          <div className="w-16 h-16 rounded-2xl bg-red-500/20 text-red-400 mx-auto flex items-center justify-center">
            <AlertTriangle className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-black text-white">Analytics Link Expired</h2>
          <p className="text-xs text-slate-300 leading-relaxed">
            {error || 'This shareable link has expired or access was revoked.'}
          </p>
          <div className="pt-2">
            <Link
              to="/"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-rba-blue hover:bg-sky-500 text-white font-extrabold text-xs shadow-lg transition-transform hover:scale-105"
            >
              <Tv className="w-4 h-4" />
              <span>Visit Benix Space TV</span>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const ctr =
    ad.impressions_count > 0 ? ((ad.clicks_count / ad.impressions_count) * 100).toFixed(1) : '0.0';

  return (
    <div className="min-h-screen bg-slate-950 text-white selection:bg-rba-yellow selection:text-slate-950 pb-16">
      <SEO
        title={`${ad.sponsor_name} Ad Analytics - Benix Space TV`}
        description={`Real-time advertising campaign analytics report for ${ad.sponsor_name}.`}
      />

      {/* Top Header */}
      <header className="border-b border-slate-800 bg-slate-900/80 backdrop-blur-md sticky top-0 z-30">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src="/logo.png" alt="Logo" className="h-8 w-auto object-contain" />
            <div>
              <span className="font-extrabold text-sm text-white tracking-wide">Benix Analytics Portal</span>
              <span className="text-[10px] block text-emerald-400 font-bold">Verified Real-Time Telemetry</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-xs font-black flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
              Live Reporting Active
            </span>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-8 space-y-8">
        
        {/* Ad Title & Sponsor Card */}
        <div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 border border-slate-800 shadow-2xl relative overflow-hidden flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-start gap-4 min-w-0 z-10">
            <div
              className="w-14 h-14 rounded-2xl flex items-center justify-center text-white font-black shadow-lg shrink-0"
              style={{ backgroundColor: ad.accent_color || '#0284c7' }}
            >
              <Megaphone className="w-7 h-7" />
            </div>

            <div className="space-y-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-white/20 text-white uppercase tracking-wider">
                  {ad.category || 'Sponsor'}
                </span>
                <span
                  className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                    ad.status === 'ACTIVE' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-amber-500/20 text-amber-400'
                  }`}
                >
                  {ad.status}
                </span>
              </div>

              <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight truncate">
                {ad.title}
              </h1>
              <p className="text-xs sm:text-sm font-bold text-amber-300">
                Sponsor: {ad.sponsor_name}
              </p>
            </div>
          </div>

          <div className="z-10 flex flex-col sm:flex-row items-stretch sm:items-center gap-3 shrink-0">
            <a
              href={ad.cta_url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl font-extrabold text-xs text-slate-950 shadow-lg transition-transform hover:scale-105"
              style={{ backgroundColor: ad.accent_color || '#0284c7' }}
            >
              <span>View Campaign Target</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>
        </div>

        {/* Key Metrics Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
          
          <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 shadow-xl space-y-2">
            <div className="flex items-center justify-between text-slate-400 text-xs font-bold">
              <span>Total Ad Views (Impressions)</span>
              <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400">
                <Eye className="w-5 h-5" />
              </div>
            </div>
            <div className="text-3xl sm:text-4xl font-black text-white tracking-tight">
              {ad.impressions_count.toLocaleString()}
            </div>
            <p className="text-[11px] text-slate-400 font-medium">Times displayed on live streams & pages</p>
          </div>

          <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 shadow-xl space-y-2">
            <div className="flex items-center justify-between text-slate-400 text-xs font-bold">
              <span>Total Clicks Captured</span>
              <div className="p-2 rounded-xl bg-purple-500/10 text-purple-400">
                <MousePointer className="w-5 h-5" />
              </div>
            </div>
            <div className="text-3xl sm:text-4xl font-black text-white tracking-tight">
              {ad.clicks_count.toLocaleString()}
            </div>
            <p className="text-[11px] text-slate-400 font-medium">Direct visitors routed to your website</p>
          </div>

          <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 shadow-xl space-y-2">
            <div className="flex items-center justify-between text-slate-400 text-xs font-bold">
              <span>Click-Through Rate (CTR)</span>
              <div className="p-2 rounded-xl bg-rba-blue/10 text-sky-400">
                <TrendingUp className="w-5 h-5" />
              </div>
            </div>
            <div className="text-3xl sm:text-4xl font-black text-sky-400 tracking-tight">
              {ctr}%
            </div>
            <p className="text-[11px] text-slate-400 font-medium">High audience engagement index</p>
          </div>

        </div>

        {/* Daily Telemetry Chart */}
        <div className="p-6 sm:p-8 rounded-3xl bg-slate-900 border border-slate-800 shadow-xl space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-black text-white">Daily Ad Performance Trend</h3>
              <p className="text-xs text-slate-400">Impressions & clicks breakdown for the past 14 days</p>
            </div>
          </div>

          {timeseries.length > 0 ? (
            <div className="space-y-3">
              {timeseries.map((pt) => {
                const maxImp = Math.max(1, ...timeseries.map((t) => t.impressions));
                const impPct = Math.min(100, (pt.impressions / maxImp) * 100);

                return (
                  <div key={pt.date_label} className="flex items-center gap-3 text-xs">
                    <span className="w-24 font-mono text-slate-400 shrink-0 font-bold">{pt.date_label}</span>
                    <div className="flex-1 h-6 bg-slate-800 rounded-lg overflow-hidden flex items-center p-0.5">
                      <div
                        style={{ width: `${Math.max(4, impPct)}%` }}
                        className="h-full bg-gradient-to-r from-rba-yellow to-amber-500 rounded-md transition-all"
                        title={`Views: ${pt.impressions}`}
                      />
                    </div>
                    <div className="w-28 text-right font-mono shrink-0">
                      <span className="font-extrabold text-amber-300">{pt.impressions} views</span>
                      <span className="text-slate-400 text-[10px] ml-1">({pt.clicks} clicks)</span>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="h-32 flex items-center justify-center text-xs text-slate-500 font-semibold">
              Telemetry events will populate here in real-time as users view and click your ad.
            </div>
          )}
        </div>

        {/* Expiration Notice & Security Badge */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 rounded-2xl bg-slate-900/60 border border-slate-800/80 text-xs text-slate-400">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>Verified streaming audience telemetry generated by Benix Space TV.</span>
          </div>

          {ad.token_expires_at && (
            <div className="flex items-center gap-1.5 text-amber-400 font-bold">
              <Clock className="w-3.5 h-3.5" />
              <span>Link Expiration: {new Date(ad.token_expires_at).toLocaleDateString()}</span>
            </div>
          )}
        </div>

      </main>
    </div>
  );
};
