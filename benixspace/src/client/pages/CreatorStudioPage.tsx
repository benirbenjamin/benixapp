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
  Check,
  Edit2,
  RefreshCw,
  X,
  AlertTriangle
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

interface CreatorStory {
  id: string;
  mediaUrl: string;
  mediaType: string;
  caption: string;
  views: number;
  duration?: number;
  createdAt: string;
  expiresAt: string;
  isExpired: boolean;
}

interface StoryViewer {
  viewerId: string;
  viewerName: string;
  viewerAvatar: string;
  viewedAt: string;
}

interface StudioAnalytics {
  totalViews: number;
  totalWatchHours: number;
  totalSubscribers: number;
  totalEarnings: number;
  storyCount?: number;
  totalStoryViews?: number;
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
  monetizationStatus?: string;
  monetizationNotice?: string | null;
  videos: CreatorVideo[];
}

export const CreatorStudioPage: React.FC = () => {
  const { user, token } = useAuth();
  const navigate = useNavigate();

  const [analytics, setAnalytics] = useState<StudioAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'content' | 'stories' | 'analytics' | 'monetization'>('dashboard');

  // Stories State
  const [creatorStories, setCreatorStories] = useState<CreatorStory[]>([]);
  const [loadingStories, setLoadingStories] = useState(false);
  const [storyActionMsg, setStoryActionMsg] = useState('');
  const [viewingStoryViewers, setViewingStoryViewers] = useState<{ storyId: string; viewers: StoryViewer[] } | null>(null);
  const [loadingViewers, setLoadingViewers] = useState(false);

  // Video Edit State
  const [editingVideo, setEditingVideo] = useState<CreatorVideo | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editPrice, setEditPrice] = useState(0);
  const [savingVideo, setSavingVideo] = useState(false);
  const [videoActionMsg, setVideoActionMsg] = useState('');

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

  const loadStories = async () => {
    if (!token) return;
    try {
      setLoadingStories(true);
      const res = await fetch('/api/creator/stories', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        if (data.stories) {
          setCreatorStories(data.stories);
        }
      }
    } catch (e) {
      console.warn('Stories load error:', e);
    } finally {
      setLoadingStories(false);
    }
  };

  useEffect(() => {
    loadStudioData();
    loadStories();
  }, [token]);

  const handleRepostStory = async (storyId: string) => {
    if (!token) return;
    try {
      const res = await fetch(`/api/stories/${storyId}/repost`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        setStoryActionMsg('🎉 Story successfully reposted for 24 hours!');
        setTimeout(() => setStoryActionMsg(''), 4000);
        loadStories();
        loadStudioData();
      } else {
        alert(data.error || 'Failed to repost story');
      }
    } catch {
      alert('Error reposting story');
    }
  };

  const handleDeleteStory = async (storyId: string) => {
    if (!window.confirm('Are you sure you want to delete this story?')) return;
    if (!token) return;
    try {
      const res = await fetch(`/api/stories/${storyId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        setStoryActionMsg('Story removed.');
        setTimeout(() => setStoryActionMsg(''), 3000);
        loadStories();
        loadStudioData();
      }
    } catch {
      alert('Error deleting story');
    }
  };

  const handleOpenStoryViewers = async (storyId: string) => {
    if (!token) return;
    setLoadingViewers(true);
    setViewingStoryViewers({ storyId, viewers: [] });
    try {
      const res = await fetch(`/api/stories/${storyId}/viewers`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success && Array.isArray(data.viewers)) {
        setViewingStoryViewers({ storyId, viewers: data.viewers });
      }
    } catch {
    } finally {
      setLoadingViewers(false);
    }
  };

  const handleStartEditVideo = (video: CreatorVideo) => {
    setEditingVideo(video);
    setEditTitle(video.title);
    setEditDescription(video.description || '');
    setEditPrice(video.price || 0);
  };

  const handleSaveVideoEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingVideo || !token) return;
    setSavingVideo(true);
    try {
      const res = await fetch(`/api/creator/videos/${editingVideo.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          title: editTitle,
          description: editDescription,
          price: editPrice
        })
      });
      const data = await res.json();
      if (data.success) {
        setVideoActionMsg('Video details updated successfully!');
        setTimeout(() => setVideoActionMsg(''), 3000);
        setEditingVideo(null);
        loadStudioData();
      } else {
        alert(data.error || 'Failed to update video');
      }
    } catch {
      alert('Error updating video');
    } finally {
      setSavingVideo(false);
    }
  };

  const handleDeleteVideo = async (videoId: string, title: string) => {
    if (!window.confirm(`Are you sure you want to delete "${title}"?`)) return;
    if (!token) return;
    try {
      const res = await fetch(`/api/creator/videos/${videoId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        setVideoActionMsg('Video deleted.');
        setTimeout(() => setVideoActionMsg(''), 3000);
        loadStudioData();
      }
    } catch {
      alert('Error deleting video');
    }
  };

  const groupStoriesByPeriod = (stories: CreatorStory[]) => {
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    const yesterdayStart = todayStart - 86400000;
    const thisWeekStart = todayStart - 6 * 86400000;
    const thisMonthStart = todayStart - 29 * 86400000;

    const groups: { [key: string]: CreatorStory[] } = {
      Today: [],
      Yesterday: [],
      'This Week': [],
      'This Month': [],
      Earlier: []
    };

    stories.forEach((st) => {
      const time = new Date(st.createdAt).getTime();
      if (time >= todayStart) {
        groups.Today.push(st);
      } else if (time >= yesterdayStart) {
        groups.Yesterday.push(st);
      } else if (time >= thisWeekStart) {
        groups['This Week'].push(st);
      } else if (time >= thisMonthStart) {
        groups['This Month'].push(st);
      } else {
        groups.Earlier.push(st);
      }
    });

    return groups;
  };

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

  const formatWatchHours = (hours: number): string => {
    if (!hours || hours <= 0) return '0.0 hrs';
    if (hours < 0.1) {
      return `${parseFloat(hours.toFixed(4))} hrs`;
    }
    return `${hours.toFixed(1)} hrs`;
  };

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
              { id: 'stories', label: 'Stories', icon: Play },
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
        
        {/* Monetization Status / Warning Banner */}
        {analytics?.monetizationNotice && (
          <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-200 flex items-start gap-3 shadow-lg">
            <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-xs uppercase tracking-wider text-amber-300">
                  Monetization Notice:
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 font-bold border border-amber-500/40 uppercase">
                  Status: {analytics.monetizationStatus || 'Active'}
                </span>
              </div>
              <p className="text-xs text-amber-100">{analytics.monetizationNotice}</p>
            </div>
          </div>
        )}

        {/* Video / Story Notification Messages */}
        {videoActionMsg && (
          <div className="p-3 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs font-bold flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4" />
            <span>{videoActionMsg}</span>
          </div>
        )}
        {storyActionMsg && (
          <div className="p-3 rounded-xl bg-purple-500/20 border border-purple-500/40 text-purple-300 text-xs font-bold flex items-center gap-2">
            <Sparkles className="w-4 h-4" />
            <span>{storyActionMsg}</span>
          </div>
        )}

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
            <div className="text-2xl font-black text-emerald-400">{formatWatchHours(watchHours)}</div>
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
                  Reach {reqHours.toLocaleString()} watch hours and {reqSubs.toLocaleString()} subscribers to unlock automatic broadcast ad revenue paid to your central wallet.
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
                    <strong className="text-blue-400">{formatWatchHours(watchHours)}</strong> / {reqHours} hrs
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
                              onClick={() => handleStartEditVideo(vid)}
                              className="p-1.5 rounded-lg bg-slate-800 text-blue-400 hover:text-blue-300 hover:bg-slate-700 transition-colors"
                              title="Edit Video (Title, Description, Price)"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
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
                            <button
                              onClick={() => handleDeleteVideo(vid.id, vid.title)}
                              className="p-1.5 rounded-lg bg-slate-800 text-red-400 hover:text-red-300 hover:bg-red-950/40 transition-colors"
                              title="Delete Video"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
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

        {/* Stories Management Tab */}
        {activeTab === 'stories' && (
          <div className="rounded-3xl p-6 bg-[#131926] border border-slate-800 shadow-xl space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-3">
              <div>
                <h3 className="text-sm font-black text-white flex items-center gap-2">
                  <Play className="w-4 h-4 text-rose-500 fill-rose-500" />
                  <span>Your Stories & Real-Time Viewers</span>
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Monitor story audience, view who watched your stories, and repost expired stories to keep them live.
                </p>
              </div>
              <button
                onClick={() => setShowUploadModal(true)}
                className="px-3.5 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs flex items-center gap-1.5"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Post New Story</span>
              </button>
            </div>

            {loadingStories ? (
              <div className="py-12 text-center text-xs text-slate-400">Loading stories...</div>
            ) : creatorStories.length === 0 ? (
              <div className="py-12 text-center text-xs text-slate-400 bg-slate-900/40 rounded-2xl border border-slate-800 space-y-3">
                <Play className="w-8 h-8 text-slate-600 mx-auto" />
                <p>You haven't posted any stories yet.</p>
                <button
                  onClick={() => setShowUploadModal(true)}
                  className="px-4 py-2 rounded-xl bg-gradient-to-r from-purple-600 to-rose-600 text-white font-bold"
                >
                  Create Your First Story
                </button>
              </div>
            ) : (
              <div className="space-y-6">
                {Object.entries(groupStoriesByPeriod(creatorStories)).map(([period, items]) => {
                  if (items.length === 0) return null;
                  return (
                    <div key={period} className="space-y-3">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-black uppercase tracking-wider text-slate-400 bg-slate-900/80 px-2.5 py-1 rounded-lg border border-slate-800">
                          {period}
                        </span>
                        <div className="flex-1 h-px bg-slate-800" />
                        <span className="text-[11px] text-slate-500 font-mono">{items.length} item(s)</span>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                        {items.map((st) => {
                          const isExpired = st.expiresAt ? new Date(st.expiresAt).getTime() < Date.now() : false;
                          return (
                            <div
                              key={st.id}
                              className="group relative rounded-2xl bg-[#0d121c] border border-slate-800 overflow-hidden hover:border-slate-700 transition-all shadow-md flex flex-col"
                            >
                              <div className="relative aspect-[9/16] bg-black overflow-hidden flex items-center justify-center">
                                {st.mediaUrl ? (
                                  st.mediaType === 'video' ? (
                                    <video
                                      src={st.mediaUrl}
                                      className="w-full h-full object-cover"
                                      muted
                                      playsInline
                                    />
                                  ) : (
                                    <img
                                      src={st.mediaUrl}
                                      alt={st.caption || 'Story'}
                                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                    />
                                  )
                                ) : (
                                  <div className="p-4 text-center text-xs text-slate-300 bg-gradient-to-br from-purple-900 to-indigo-950 w-full h-full flex items-center justify-center font-bold">
                                    "{st.caption || 'Text Story'}"
                                  </div>
                                )}

                                {/* Expiry badge */}
                                <div className="absolute top-2 left-2">
                                  {isExpired ? (
                                    <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-rose-500/90 text-white shadow">
                                      Expired
                                    </span>
                                  ) : (
                                    <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-500/90 text-white shadow">
                                      Active (24h)
                                    </span>
                                  )}
                                </div>

                                {/* Clickable Viewers Badge */}
                                <button
                                  onClick={() => handleOpenStoryViewers(st.id)}
                                  className="absolute bottom-2 left-2 px-2.5 py-1 rounded-full bg-black/80 backdrop-blur border border-white/20 text-white text-[11px] font-bold flex items-center gap-1.5 hover:bg-black transition-all shadow"
                                  title="View who watched this story"
                                >
                                  <Eye className="w-3.5 h-3.5 text-blue-400" />
                                  <span>{st.views || 0} views</span>
                                </button>
                              </div>

                              <div className="p-3 space-y-2 flex-1 flex flex-col justify-between">
                                <div>
                                  <p className="text-xs text-white line-clamp-2 font-medium">
                                    {st.caption || <span className="text-slate-500 italic">No caption</span>}
                                  </p>
                                  <span className="text-[10px] text-slate-400 block mt-1">
                                    {new Date(st.createdAt).toLocaleString()}
                                  </span>
                                </div>

                                <div className="flex items-center gap-2 pt-2 border-t border-slate-800/80">
                                  <button
                                    onClick={() => handleRepostStory(st.id)}
                                    className="flex-1 py-1.5 px-2 rounded-xl bg-purple-600/20 hover:bg-purple-600/30 border border-purple-500/30 text-purple-300 hover:text-purple-200 text-xs font-bold flex items-center justify-center gap-1 transition-all"
                                    title="Repost this story for another 24 hours"
                                  >
                                    <RefreshCw className="w-3 h-3" />
                                    <span>Repost</span>
                                  </button>
                                  <button
                                    onClick={() => handleDeleteStory(st.id)}
                                    className="p-1.5 rounded-xl bg-slate-800 hover:bg-rose-950/40 text-slate-400 hover:text-rose-400 border border-slate-700/60 transition-all"
                                    title="Delete Story"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

      </div>

      {/* Story Viewers Modal */}
      {viewingStoryViewers && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="max-w-md w-full bg-[#131926] rounded-3xl border border-slate-800 p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Eye className="w-5 h-5 text-blue-400" />
                <h3 className="font-black text-sm text-white">Story Viewers</h3>
              </div>
              <button
                onClick={() => setViewingStoryViewers(null)}
                className="p-1.5 rounded-xl bg-slate-800 text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {loadingViewers ? (
              <div className="py-8 text-center text-xs text-slate-400">Loading viewers...</div>
            ) : viewingStoryViewers.viewers.length === 0 ? (
              <div className="py-8 text-center text-xs text-slate-400">
                <Users className="w-8 h-8 text-slate-600 mx-auto mb-2" />
                <p>No recorded viewers yet.</p>
              </div>
            ) : (
              <div className="max-h-72 overflow-y-auto space-y-2 pr-1">
                {viewingStoryViewers.viewers.map((viewer) => (
                  <div
                    key={viewer.id}
                    className="flex items-center justify-between p-2.5 rounded-xl bg-slate-900/60 border border-slate-800/80"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-purple-600 to-blue-500 overflow-hidden flex items-center justify-center text-white font-bold text-xs shrink-0">
                        {viewer.avatarUrl ? (
                          <img src={viewer.avatarUrl} alt={viewer.name} className="w-full h-full object-cover" />
                        ) : (
                          viewer.name.charAt(0).toUpperCase()
                        )}
                      </div>
                      <div>
                        <p className="text-xs font-bold text-white">{viewer.name}</p>
                        <span className="text-[10px] text-slate-400">{viewer.email || 'Benix Member'}</span>
                      </div>
                    </div>
                    <span className="text-[10px] text-slate-500 font-mono">
                      {new Date(viewer.viewedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Video Edit Modal (Title, Description, Price) */}
      {editingVideo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="max-w-lg w-full bg-[#131926] rounded-3xl border border-slate-800 p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Edit2 className="w-5 h-5 text-blue-400" />
                <h3 className="font-black text-sm text-white">Edit Video Details</h3>
              </div>
              <button
                onClick={() => setEditingVideo(null)}
                className="p-1.5 rounded-xl bg-slate-800 text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveVideoEdit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">Video Title</label>
                <input
                  type="text"
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  required
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs focus:outline-none focus:border-blue-500 font-medium"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">Description</label>
                <textarea
                  rows={3}
                  value={editDescription}
                  onChange={(e) => setEditDescription(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs focus:outline-none focus:border-blue-500 font-medium resize-none"
                  placeholder="Explain what your video is about..."
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">
                  Access Price (RWF) — <span className="text-slate-400 font-normal">Set 0 for free</span>
                </label>
                <input
                  type="number"
                  min="0"
                  value={editPrice}
                  onChange={(e) => setEditPrice(Number(e.target.value))}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs focus:outline-none focus:border-blue-500 font-medium font-mono"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setEditingVideo(null)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingVideo}
                  className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold flex items-center gap-1.5 disabled:opacity-50"
                >
                  {savingVideo ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

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
