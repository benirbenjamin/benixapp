import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { SeoHead } from '../components/common/SeoHead';
import { CreateMediaModal } from '../components/modals/CreateMediaModal';
import {
  Film,
  Users,
  Clock,
  Eye,
  DollarSign,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  ArrowLeft,
  Plus,
  Play,
  Share2,
  Trash2,
  ExternalLink,
  Award,
  TrendingUp,
  BarChart3,
  Video,
  Copy,
  Check
} from 'lucide-react';

interface CreatorVideo {
  id: string;
  title: string;
  description: string;
  thumbnailUrl: string;
  videoUrl: string;
  views: number;
  watchHours: number;
  price: number;
  isPaid: boolean;
  createdAt: string;
}

interface StudioAnalytics {
  totalViews: number;
  totalWatchHours: number;
  totalSubscribers: number;
  totalEarnings: number;
  lifetimeAdEarnings?: number;
  todayAdEarnings?: number;
  todayGoogleImpressions?: number;
  todayGoogleClicks?: number;
  todayCustomImpressions?: number;
  todayCustomClicks?: number;
  videosCount: number;
  requiredWatchHours: number;
  requiredSubscribers: number;
  isMonetized: boolean;
  videos: CreatorVideo[];
}

export const CreatorStudioPage: React.FC = () => {
  const { user, token } = useAuth();
  const navigate = useNavigate();

  const [analytics, setAnalytics] = useState<StudioAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'content' | 'analytics' | 'monetization'>('dashboard');

  const loadStudioData = async () => {
    if (!token) return;
    try {
      setLoading(true);
      const res = await fetch('/api/creator/studio-analytics', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        if (data.analytics) {
          setAnalytics(data.analytics);
        }
      }
    } catch (e) {
      console.warn('Studio load error:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStudioData();
  }, [token]);

  const copyVideoLink = (id: string) => {
    const url = `${window.location.origin}/videos/${id}`;
    navigator.clipboard.writeText(url);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-[#0B0E14] text-white flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-[#131926] p-8 rounded-3xl border border-slate-800 text-center space-y-4">
          <Film className="w-12 h-12 text-purple-400 mx-auto" />
          <h2 className="text-xl font-black">Benix Creator Studio</h2>
          <p className="text-xs text-slate-400">
            Log in to manage your creator channel, track real-time watch hours, subscribers, and broadcast revenue.
          </p>
          <button
            onClick={() => navigate('/videos')}
            className="w-full py-3 rounded-xl bg-purple-600 hover:bg-purple-500 font-bold text-xs"
          >
            Explore Videos & Sign In
          </button>
        </div>
      </div>
    );
  }

  const watchHours = analytics?.totalWatchHours || 0;
  const subs = analytics?.totalSubscribers || 0;
  const reqHours = analytics?.requiredWatchHours || 300;
  const reqSubs = analytics?.requiredSubscribers || 30;
  const isMonetized = Boolean(analytics?.isMonetized);

  const watchPercent = Math.min(100, Math.round((watchHours / reqHours) * 100));
  const subsPercent = Math.min(100, Math.round((subs / reqSubs) * 100));

  return (
    <div className="min-h-screen bg-[#0B0E14] text-slate-100 font-sans pb-24">
      <SeoHead
        title="Creator Studio & Analytics — BenixSpace"
        description="Monitor channel performance, real watch hours, subscriber growth, and monetization status."
      />

      {/* Top Banner & Header */}
      <div className="border-b border-slate-800 bg-[#101624]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <Link
                to="/videos"
                className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-white"
              >
                <ArrowLeft className="w-4 h-4" />
              </Link>
              <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-red-600 to-rose-500 flex items-center justify-center text-white shadow-lg">
                <Film className="w-6 h-6 stroke-[2.2]" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-lg font-black text-white">{user.channel_name || user.name}</h1>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 font-bold border border-purple-500/30">
                    Channel Studio
                  </span>
                  {isMonetized && (
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-500/30 flex items-center gap-1">
                      <Sparkles className="w-3 h-3 text-emerald-400" />
                      Partner Monetized
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-400 font-mono">@{user.email?.split('@')[0]}</p>
              </div>
            </div>

            <button
              onClick={() => setShowUploadModal(true)}
              className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white font-extrabold text-xs flex items-center gap-2 shadow-lg shadow-red-600/30 transition-all"
            >
              <Plus className="w-4 h-4 stroke-[3]" />
              <span>Create / Upload</span>
            </button>
          </div>

          {/* Studio Navigation Tabs */}
          <div className="flex items-center gap-2 mt-5 border-t border-slate-800/80 pt-3">
            {[
              { id: 'dashboard', label: 'Dashboard', icon: BarChart3 },
              { id: 'content', label: 'Content', icon: Video },
              { id: 'analytics', label: 'Analytics', icon: TrendingUp },
              { id: 'monetization', label: 'Monetization (Earn)', icon: DollarSign }
            ].map((t) => {
              const Icon = t.icon;
              const isSel = activeTab === t.id;
              return (
                <button
                  key={t.id}
                  onClick={() => setActiveTab(t.id as any)}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                    isSel
                      ? 'bg-slate-800 text-white shadow-sm border border-slate-700'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{t.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 space-y-6">
        
        {/* Top 4 Performance Cards (YouTube Studio Style) */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-4 rounded-2xl bg-[#131926] border border-slate-800 shadow-md">
            <div className="flex items-center justify-between text-slate-400 text-xs font-semibold mb-1">
              <span>Subscribers</span>
              <Users className="w-4 h-4 text-blue-400" />
            </div>
            <div className="text-2xl font-black text-white">{subs.toLocaleString()}</div>
            <p className="text-[11px] text-slate-500 mt-1">Live channel subscribers</p>
          </div>

          <div className="p-4 rounded-2xl bg-[#131926] border border-slate-800 shadow-md">
            <div className="flex items-center justify-between text-slate-400 text-xs font-semibold mb-1">
              <span>Watch Time</span>
              <Clock className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="text-2xl font-black text-emerald-400">{watchHours.toFixed(1)} hrs</div>
            <p className="text-[11px] text-slate-500 mt-1">Accumulated watch hours</p>
          </div>

          <div className="p-4 rounded-2xl bg-[#131926] border border-slate-800 shadow-md">
            <div className="flex items-center justify-between text-slate-400 text-xs font-semibold mb-1">
              <span>Total Views</span>
              <Eye className="w-4 h-4 text-purple-400" />
            </div>
            <div className="text-2xl font-black text-white">{(analytics?.totalViews || 0).toLocaleString()}</div>
            <p className="text-[11px] text-slate-500 mt-1">Across all uploaded videos</p>
          </div>

          <div className="p-4 rounded-2xl bg-[#131926] border border-slate-800 shadow-md">
            <div className="flex items-center justify-between text-slate-400 text-xs font-semibold mb-1">
              <span>Estimated Revenue</span>
              <DollarSign className="w-4 h-4 text-amber-400" />
            </div>
            <div className="text-2xl font-black text-amber-400">{(analytics?.totalEarnings || 0).toLocaleString()} RWF</div>
            <p className="text-[11px] text-slate-500 mt-1">Paid unlocks & ad earnings</p>
          </div>
        </div>

        {/* YouTube Partner Monetization Progress Tracker */}
        {(activeTab === 'dashboard' || activeTab === 'monetization') && (
          <div className="rounded-3xl p-6 bg-gradient-to-br from-[#141C2E] to-[#0E1524] border border-slate-800 shadow-xl space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800/80 pb-3">
              <div>
                <h3 className="text-sm font-black text-white flex items-center gap-2">
                  <Award className="w-5 h-5 text-amber-400" />
                  <span>Creator Partner Program (Ad Revenue Criteria)</span>
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Reach 300 watch hours and 30 subscribers to unlock automatic broadcast ad revenue paid to your central wallet.
                </p>
              </div>
              <div className="px-3 py-1 rounded-xl bg-slate-900 border border-slate-700 text-xs font-bold text-slate-300">
                {isMonetized ? '✅ Criteria Fulfilled' : '⏳ In Progress'}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
              {/* Watch Hours Progress */}
              <div className="p-4 rounded-2xl bg-[#0B0F18] border border-slate-800 space-y-2">
                <div className="flex items-center justify-between text-xs font-bold">
                  <span className="text-slate-400 flex items-center gap-1.5">
                    <Clock className="w-4 h-4 text-blue-400" /> Public Watch Hours
                  </span>
                  <span className="text-white font-mono">
                    <strong className="text-blue-400">{watchHours.toFixed(1)}</strong> / {reqHours} hrs
                  </span>
                </div>
                <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full transition-all duration-500"
                    style={{ width: `${watchPercent}%` }}
                  />
                </div>
                <div className="flex items-center justify-between text-[11px] text-slate-500">
                  <span>{watchPercent}% completed</span>
                  <span>{Math.max(0, reqHours - watchHours).toFixed(1)} hrs needed</span>
                </div>
              </div>

              {/* Subscribers Progress */}
              <div className="p-4 rounded-2xl bg-[#0B0F18] border border-slate-800 space-y-2">
                <div className="flex items-center justify-between text-xs font-bold">
                  <span className="text-slate-400 flex items-center gap-1.5">
                    <Users className="w-4 h-4 text-emerald-400" /> Channel Subscribers
                  </span>
                  <span className="text-white font-mono">
                    <strong className="text-emerald-400">{subs}</strong> / {reqSubs} subs
                  </span>
                </div>
                <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full transition-all duration-500"
                    style={{ width: `${subsPercent}%` }}
                  />
                </div>
                <div className="flex items-center justify-between text-[11px] text-slate-500">
                  <span>{subsPercent}% completed</span>
                  <span>{Math.max(0, reqSubs - subs)} subscribers needed</span>
                </div>
              </div>
            </div>

            {/* Daily Ad Earnings Breakdown Card */}
            <div className="p-4 rounded-2xl bg-[#0A0D14] border border-emerald-500/30 space-y-3 mt-2">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800/80 pb-2">
                <div className="flex items-center gap-2">
                  <DollarSign className="w-4 h-4 text-emerald-400" />
                  <span className="text-xs font-bold text-white">Daily Ad Revenue (Quiet Wallet Earnings)</span>
                </div>
                <span className="text-[11px] text-slate-400">
                  Total Lifetime Ad Revenue: <strong className="text-emerald-400 font-mono font-black">{(analytics?.lifetimeAdEarnings || 0).toLocaleString()} RWF</strong>
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800">
                  <span className="text-slate-400 text-[10px] block">Today's Total Ad Earned</span>
                  <span className="text-emerald-400 font-black text-sm font-mono mt-0.5 block">
                    +{(analytics?.todayAdEarnings || 0).toLocaleString()} RWF
                  </span>
                </div>

                <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800">
                  <span className="text-slate-400 text-[10px] block">Today's Google Impressions</span>
                  <span className="text-white font-black text-sm font-mono mt-0.5 block">
                    {analytics?.todayGoogleImpressions || 0}
                  </span>
                </div>

                <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800">
                  <span className="text-slate-400 text-[10px] block">Today's Google Clicks</span>
                  <span className="text-blue-400 font-black text-sm font-mono mt-0.5 block">
                    {analytics?.todayGoogleClicks || 0}
                  </span>
                </div>

                <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800">
                  <span className="text-slate-400 text-[10px] block">Custom Ad Views & Clicks</span>
                  <span className="text-amber-400 font-black text-sm font-mono mt-0.5 block">
                    {(analytics?.todayCustomImpressions || 0) + (analytics?.todayCustomClicks || 0)}
                  </span>
                </div>
              </div>

              <p className="text-[10px] text-slate-400 italic">
                * Note: Ad revenue is credited silently and directly to your central wallet without transaction notifications. Aggregated daily totals are displayed automatically at the end of each day.
              </p>
            </div>
          </div>
        )}

        {/* Video Content Table (Like YouTube Studio "Content" tab) */}
        {(activeTab === 'dashboard' || activeTab === 'content') && (
          <div className="rounded-3xl p-6 bg-[#131926] border border-slate-800 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <h3 className="text-sm font-black text-white flex items-center gap-2">
                  <Video className="w-4 h-4 text-purple-400" />
                  <span>Channel Videos & Broadcasts</span>
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">Manage visibility, price, and track individual watch hours</p>
              </div>
              <span className="text-xs text-slate-400 font-mono font-bold">
                {analytics?.videos.length || 0} Video(s)
              </span>
            </div>

            {analytics?.videos && analytics.videos.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="border-b border-slate-800 text-slate-400 uppercase tracking-wider font-bold">
                    <tr>
                      <th className="py-3 px-3">Video</th>
                      <th className="py-3 px-3">Visibility</th>
                      <th className="py-3 px-3">Date</th>
                      <th className="py-3 px-3">Views</th>
                      <th className="py-3 px-3">Watch Hours</th>
                      <th className="py-3 px-3">Price</th>
                      <th className="py-3 px-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 font-medium">
                    {analytics.videos.map((vid) => (
                      <tr key={vid.id} className="hover:bg-slate-800/30 transition-colors">
                        <td className="py-3 px-3">
                          <div className="flex items-center gap-3">
                            <img
                              src={vid.thumbnailUrl}
                              alt={vid.title}
                              className="w-16 aspect-video rounded-lg object-cover border border-slate-800 shrink-0"
                            />
                            <div className="min-w-0">
                              <p className="font-bold text-white truncate max-w-xs">{vid.title}</p>
                              <span className="text-[10px] text-slate-400 truncate block max-w-xs">
                                {vid.description || 'No description'}
                              </span>
                            </div>
                          </div>
                        </td>
                        <td className="py-3 px-3">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              vid.isPaid
                                ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                                : 'bg-slate-800 text-slate-300'
                            }`}
                          >
                            {vid.isPaid ? 'Pay-to-Watch' : 'Public'}
                          </span>
                        </td>
                        <td className="py-3 px-3 text-slate-400">
                          {new Date(vid.createdAt).toLocaleDateString()}
                        </td>
                        <td className="py-3 px-3 font-bold text-white">
                          {vid.views.toLocaleString()}
                        </td>
                        <td className="py-3 px-3 font-bold text-emerald-400">
                          {vid.watchHours.toFixed(1)} hrs
                        </td>
                        <td className="py-3 px-3 font-bold text-amber-400">
                          {vid.price > 0 ? `${vid.price.toLocaleString()} RWF` : 'Free'}
                        </td>
                        <td className="py-3 px-3 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => copyVideoLink(vid.id)}
                              className="p-1.5 rounded-lg bg-slate-800 text-slate-400 hover:text-white"
                              title="Copy Link"
                            >
                              {copiedId === vid.id ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                            </button>
                            <Link
                              to={`/videos/${vid.id}`}
                              className="p-1.5 rounded-lg bg-slate-800 text-slate-400 hover:text-white"
                              title="Watch Video"
                            >
                              <Play className="w-3.5 h-3.5" />
                            </Link>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="py-12 text-center text-xs text-slate-400 bg-slate-900/40 rounded-2xl border border-slate-800 space-y-3">
                <Video className="w-8 h-8 text-slate-600 mx-auto" />
                <p>You haven't uploaded any videos yet.</p>
                <button
                  onClick={() => setShowUploadModal(true)}
                  className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold"
                >
                  Upload Your First Video
                </button>
              </div>
            )}
          </div>
        )}

      </div>

      {showUploadModal && (
        <CreateMediaModal
          isOpen={showUploadModal}
          initialTab="video"
          onClose={() => setShowUploadModal(false)}
          onSuccess={() => {
            setShowUploadModal(false);
            loadStudioData();
          }}
        />
      )}
    </div>
  );
};
