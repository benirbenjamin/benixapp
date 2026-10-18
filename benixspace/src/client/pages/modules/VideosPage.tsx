import React, { useState, useEffect } from 'react';
import { Link, useSearchParams, useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { SeoHead } from '../../components/common/SeoHead';
import { WalletModal } from '../../components/modals/WalletModal';
import { AppAccessWizardModal } from '../../components/modals/AppAccessWizardModal';
import { SidebarRecommendationsMixedAds } from '../../components/ads/SidebarRecommendationsMixedAds';
import { TVLiveChat } from '../../components/chat/TVLiveChat';
import { getAuthToken } from '../../services/api';
import {
  Film,
  Play,
  Heart,
  Share2,
  Lock,
  Unlock,
  CheckCircle2,
  Sparkles,
  Search,
  ArrowLeft,
  Copy,
  ExternalLink,
  Eye,
  Check,
  TrendingUp,
  Award,
  Upload,
  ThumbsUp,
  Bell,
  UserPlus,
  Plus,
  X
} from 'lucide-react';
import axios from 'axios';
import { GoogleAdSense } from '../../components/ads/GoogleAdSense';
import realVideosData from '../../config/realVideos.json';

interface VideoItem {
  id: string;
  title: string;
  creator: string;
  thumbnail: string;
  duration: string;
  views: number;
  likes: number;
  category: string;
  price: number;
  embedUrl: string;
  commission_pct?: number;
  description?: string;
  channelName?: string;
  channelAvatar?: string;
  createdAt?: string;
}

// 94 Real YouTube videos provided by user (real creators & titles, 0 fake subscriber counters)
const FALLBACK_VIDEOS: VideoItem[] = realVideosData as VideoItem[];

const CATEGORIES = [
  'All',
  'Gospel & Choirs',
  'Series & Comedy',
  'Culture & Documentaries',
  'Music & Shows',
  'Free to Watch',
  'Premium'
];

export const VideosPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { id: routeVideoId } = useParams();
  const { user, wallet, refreshMe, updateWalletBalance } = useAuth();

  const [videos, setVideos] = useState<VideoItem[]>(FALLBACK_VIDEOS);
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [activeVideo, setActiveVideo] = useState<VideoItem | null>(null);
  const [unlockedVideoIds, setUnlockedVideoIds] = useState<string[]>(() => {
    try {
      return JSON.parse(localStorage.getItem('benix_unlocked_videos') || '[]');
    } catch {
      return [];
    }
  });

  // Creator Subscriptions State
  const [subscribedChannels, setSubscribedChannels] = useState<string[]>(() => {
    try {
      return JSON.parse(localStorage.getItem('benix_subscribed_channels') || '[]');
    } catch {
      return [];
    }
  });

  // Liked Videos
  const [likedVideoIds, setLikedVideoIds] = useState<string[]>(() => {
    try {
      return JSON.parse(localStorage.getItem('benix_liked_videos') || '[]');
    } catch {
      return [];
    }
  });

  // Share & Earn Affiliate Modal State
  const [shareVideo, setShareVideo] = useState<VideoItem | null>(null);
  const [copiedLink, setCopiedLink] = useState<boolean>(false);
  const [showWalletModal, setShowWalletModal] = useState<boolean>(false);
  const [showWizardModal, setShowWizardModal] = useState<boolean>(false);
  const [unlockingId, setUnlockingId] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<string>('');

  // Creator Upload Video Modal State
  const [showPostModal, setShowPostModal] = useState<boolean>(false);
  const [newTitle, setNewTitle] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [newVideoUrl, setNewVideoUrl] = useState('');
  const [newThumbnailUrl, setNewThumbnailUrl] = useState('');
  const [newCategory, setNewCategory] = useState('Gospel & Choirs');
  const [newPrice, setNewPrice] = useState(0);
  const [isPosting, setIsPosting] = useState(false);

  // Cross-Platform Referral Tracking
  useEffect(() => {
    const refCode = searchParams.get('ref');
    if (refCode) {
      localStorage.setItem('benix_ref', refCode);
    }
  }, [searchParams]);

  // Load video catalogue from database
  useEffect(() => {
    axios
      .get('/api/modules/videos')
      .then((res) => {
        if (res.data?.videos && Array.isArray(res.data.videos) && res.data.videos.length > 0) {
          const mapped = res.data.videos.map((v: any) => ({
            id: v.id,
            title: v.title,
            creator: v.channelName || v.creator || 'Verified Creator',
            channelName: v.channelName || v.creator || 'Verified Creator',
            channelAvatar: v.channelAvatar || '/logo.png',
            thumbnail: v.thumbnailUrl || v.thumbnail || 'https://images.unsplash.com/photo-1574375927938-d5a98e8ffe85?w=800&auto=format&fit=crop&q=80',
            duration: v.durationLabel || (v.duration ? `${Math.floor(v.duration / 60)}:${v.duration % 60 < 10 ? '0' : ''}${v.duration % 60}` : '10:00'),
            views: v.views || 0,
            likes: v.likes || 0,
            category: v.category || 'General',
            price: v.price || 0,
            embedUrl: v.videoUrl || v.embedUrl || '',
            commission_pct: v.price > 0 ? 15 : 0,
            description: v.description || ''
          }));
          setVideos(mapped);
        }
      })
      .catch(() => {});
  }, []);

  // Auto-sync active video if specified in route (/videos/:id) or query (?v=)
  useEffect(() => {
    const targetId = routeVideoId || searchParams.get('v');
    if (targetId) {
      const found = videos.find((v) => v.id === targetId);
      if (found) {
        setActiveVideo(found);
      }
    } else {
      setActiveVideo(null);
    }
  }, [routeVideoId, searchParams, videos]);

  const isVideoUnlocked = (vid: VideoItem): boolean => {
    if (vid.price <= 0) return true;
    if (unlockedVideoIds.includes(vid.id)) return true;
    if (user?.role === 'superadmin' || user?.role === 'admin') return true;
    return false;
  };

  const handleSelectVideo = (video: VideoItem) => {
    setActiveVideo(video);
    navigate(`/videos/${video.id}`);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleToggleLike = (vid: VideoItem) => {
    if (!user) {
      setShowWizardModal(true);
      return;
    }
    const isLiked = likedVideoIds.includes(vid.id);
    const updated = isLiked ? likedVideoIds.filter((id) => id !== vid.id) : [...likedVideoIds, vid.id];
    setLikedVideoIds(updated);
    localStorage.setItem('benix_liked_videos', JSON.stringify(updated));

    setVideos((prev) =>
      prev.map((v) => (v.id === vid.id ? { ...v, likes: isLiked ? Math.max(0, v.likes - 1) : v.likes + 1 } : v))
    );

    if (activeVideo && activeVideo.id === vid.id) {
      setActiveVideo((prev) => (prev ? { ...prev, likes: isLiked ? Math.max(0, prev.likes - 1) : prev.likes + 1 } : prev));
    }
  };

  const handleToggleSubscribe = (channelName: string) => {
    if (!user) {
      setShowWizardModal(true);
      return;
    }
    const isSub = subscribedChannels.includes(channelName);
    const updated = isSub ? subscribedChannels.filter((c) => c !== channelName) : [...subscribedChannels, channelName];
    setSubscribedChannels(updated);
    localStorage.setItem('benix_subscribed_channels', JSON.stringify(updated));
  };

  // Video Unlock with Central Unified Wallet
  const handleUnlockVideo = async (vid: VideoItem) => {
    if (!user) {
      setShowWizardModal(true);
      return;
    }

    const availableBal = (wallet?.balance || 0) + (wallet?.bonus_balance || 0);
    if (availableBal < vid.price) {
      setShowWalletModal(true);
      return;
    }

    setUnlockingId(vid.id);
    setStatusMessage('');

    try {
      const token = getAuthToken();
      const activeRef = localStorage.getItem('benix_ref') || undefined;
      const res = await axios.post(
        '/api/modules/videos/unlock',
        { videoId: vid.id, ref: activeRef },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (res.data?.success) {
        const nextUnlocked = [...unlockedVideoIds, vid.id];
        setUnlockedVideoIds(nextUnlocked);
        localStorage.setItem('benix_unlocked_videos', JSON.stringify(nextUnlocked));

        if (res.data.wallet) {
          updateWalletBalance(res.data.wallet.balance, res.data.wallet.bonus_balance);
        } else {
          refreshMe();
        }

        setStatusMessage(`🎉 Successfully unlocked "${vid.title}"! Enjoy streaming in HD.`);
        setActiveVideo(vid);
        navigate(`/videos/${vid.id}`);
      }
    } catch (err: any) {
      setStatusMessage(err.response?.data?.error || 'Failed to unlock video. Please try again.');
    } finally {
      setUnlockingId(null);
    }
  };

  // Creator Post Video Submission
  const handlePostVideo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      setShowWizardModal(true);
      return;
    }

    if (!newTitle.trim() || !newVideoUrl.trim()) {
      alert('Please fill in title and video stream/embed URL.');
      return;
    }

    setIsPosting(true);
    try {
      const token = getAuthToken();
      let formattedUrl = newVideoUrl.trim();
      // Auto-format standard youtube watch urls to embed
      if (formattedUrl.includes('youtube.com/watch?v=')) {
        const id = formattedUrl.split('v=')[1]?.split('&')[0];
        formattedUrl = `https://www.youtube-nocookie.com/embed/${id}`;
      } else if (formattedUrl.includes('youtu.be/')) {
        const id = formattedUrl.split('youtu.be/')[1]?.split('?')[0];
        formattedUrl = `https://www.youtube-nocookie.com/embed/${id}`;
      }

      const res = await axios.post(
        '/api/modules/videos',
        {
          title: newTitle.trim(),
          description: newDescription.trim(),
          videoUrl: formattedUrl,
          thumbnailUrl: newThumbnailUrl.trim() || 'https://images.unsplash.com/photo-1574375927938-d5a98e8ffe85?w=800&auto=format&fit=crop&q=80',
          category: newCategory,
          price: Number(newPrice) || 0
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (res.data?.video) {
        const addedVideo: VideoItem = {
          id: res.data.video.id,
          title: res.data.video.title,
          creator: res.data.video.channelName || user.name || 'Verified Creator',
          channelName: res.data.video.channelName || user.name || 'Verified Creator',
          channelAvatar: user.name ? '/logo.png' : '/logo.png',
          thumbnail: res.data.video.thumbnailUrl,
          duration: '5:00',
          views: 0,
          likes: 0,
          category: res.data.video.category,
          price: res.data.video.price,
          embedUrl: res.data.video.videoUrl,
          commission_pct: res.data.video.price > 0 ? 15 : 0,
          description: res.data.video.description
        };

        setVideos((prev) => [addedVideo, ...prev]);
        setShowPostModal(false);
        setNewTitle('');
        setNewDescription('');
        setNewVideoUrl('');
        setNewThumbnailUrl('');
        setNewPrice(0);
        setStatusMessage('🚀 Your video has been published to Benix Creator Studio & Video Hub!');
        handleSelectVideo(addedVideo);
      }
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to publish video');
    } finally {
      setIsPosting(false);
    }
  };

  const getAffiliateShareLink = (vid: VideoItem): string => {
    const origin = typeof window !== 'undefined' ? window.location.origin : 'https://benix.space';
    const myRef = user?.referral_code || 'BENIX-PREMIUM';
    return `${origin}/videos/${vid.id}?ref=${encodeURIComponent(myRef)}`;
  };

  const filteredVideos = videos.filter((vid) => {
    const matchesSearch =
      vid.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      vid.creator.toLowerCase().includes(searchQuery.toLowerCase()) ||
      vid.category.toLowerCase().includes(searchQuery.toLowerCase());

    if (!matchesSearch) return false;

    if (selectedCategory === 'All') return true;
    if (selectedCategory === 'Free to Watch') return vid.price <= 0;
    if (selectedCategory === 'Premium') return vid.price > 0;
    return vid.category.toLowerCase() === selectedCategory.toLowerCase();
  });

  return (
    <div className="bg-[#0B0E14] text-slate-100 min-h-screen pb-28 font-sans selection:bg-purple-600 selection:text-white">
      <SeoHead
        title={
          activeVideo
            ? `${activeVideo.title} — Watch on BenixSpace`
            : "Creator Studio & Video Hub — BenixSpace"
        }
        description="Stream Rwandan concert streams, exclusive comedy shows, choir harmonies, and documentaries. Monetize with 15% instant affiliate commissions."
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 space-y-6">
        
        {/* Top Navigation Bar & Action Strip */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            {activeVideo ? (
              <button
                onClick={() => {
                  setActiveVideo(null);
                  navigate('/videos');
                }}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-[#121824] hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800 text-xs font-bold transition-all"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>All Videos</span>
              </button>
            ) : (
              <Link
                to="/"
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-[#121824] hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800 text-xs font-bold transition-all"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Home</span>
              </Link>
            )}

            <span className="text-xs text-purple-400 font-bold flex items-center gap-1.5 bg-[#121824] px-3 py-1.5 rounded-xl border border-slate-800">
              <Film className="w-3.5 h-3.5" />
              <span>Creator Studio & Video Hub</span>
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                if (!user) setShowWizardModal(true);
                else setShowPostModal(true);
              }}
              className="px-3.5 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-extrabold text-xs flex items-center gap-1.5 shadow-md shadow-purple-600/30 transition-all"
            >
              <Upload className="w-3.5 h-3.5" />
              <span>Post / Upload Video</span>
            </button>

            <button
              onClick={() => setShowWalletModal(true)}
              className="px-3.5 py-1.5 rounded-xl bg-[#121824] border border-slate-800 hover:border-purple-500/50 text-slate-300 hover:text-white text-xs font-bold flex items-center gap-2 transition-all shadow-md"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>Wallet: {(wallet?.balance || 0).toLocaleString()} RWF</span>
              {Boolean(wallet?.bonus_balance) && (
                <span className="px-1.5 py-0.5 rounded-md bg-amber-500/20 text-amber-300 text-[10px] font-black border border-amber-500/30">
                  +{(wallet?.bonus_balance || 0).toLocaleString()} Bonus
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Status Notification */}
        {statusMessage && (
          <div className="p-4 rounded-2xl bg-purple-950/80 border border-purple-500/50 text-purple-200 text-xs font-bold flex items-center justify-between gap-2 shadow-lg animate-in fade-in">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-purple-400 shrink-0" />
              <span>{statusMessage}</span>
            </div>
            <button onClick={() => setStatusMessage('')} className="text-slate-400 hover:text-white">
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* ============================================================== */}
        {/* 1. YOUTUBE-STYLE WATCH VIEW (When Active Video is Selected)    */}
        {/* ============================================================== */}
        {activeVideo ? (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            
            {/* Left Column: Player, Title, Channel, Meta, Description & Comments */}
            <div className="lg:col-span-8 space-y-4">
              
              {/* 16:9 Cinema Player Screen */}
              <div className="relative aspect-video w-full rounded-3xl bg-black border border-slate-800 overflow-hidden shadow-2xl">
                {isVideoUnlocked(activeVideo) ? (
                  activeVideo.embedUrl.includes('youtube') || activeVideo.embedUrl.includes('embed') ? (
                    <iframe
                      src={activeVideo.embedUrl.includes('?') ? `${activeVideo.embedUrl}&autoplay=1` : `${activeVideo.embedUrl}?autoplay=1`}
                      title={activeVideo.title}
                      className="w-full h-full border-0"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                      allowFullScreen
                    />
                  ) : (
                    <video
                      src={activeVideo.embedUrl}
                      controls
                      autoPlay
                      className="w-full h-full object-cover"
                      poster={activeVideo.thumbnail}
                    />
                  )
                ) : (
                  <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center bg-gradient-to-b from-slate-950/80 via-black to-slate-950">
                    <div className="w-16 h-16 rounded-2xl bg-amber-500/20 border border-amber-500/40 text-amber-400 flex items-center justify-center shadow-2xl mb-4">
                      <Lock className="w-8 h-8" />
                    </div>
                    <h3 className="text-xl sm:text-2xl font-black text-white">Premium Creator Video</h3>
                    <p className="text-xs text-slate-300 mt-2 max-w-md">
                      Unlock full access to "{activeVideo.title}". You can pay using your unified wallet balance (bonus wallet is used first!).
                    </p>
                    <button
                      onClick={() => handleUnlockVideo(activeVideo)}
                      disabled={unlockingId === activeVideo.id}
                      className="mt-5 px-6 py-3 rounded-2xl bg-gradient-to-r from-amber-500 via-amber-400 to-amber-600 text-slate-950 font-black text-sm shadow-xl shadow-amber-500/30 hover:from-amber-400 hover:to-amber-500 transition scale-100 hover:scale-105"
                    >
                      <Unlock className="w-4 h-4 inline-block mr-2" />
                      {unlockingId === activeVideo.id ? 'Unlocking...' : `Unlock Video for ${activeVideo.price.toLocaleString()} RWF`}
                    </button>
                  </div>
                )}
              </div>

              {/* Video Title */}
              <h1 className="text-xl sm:text-2xl font-black text-white leading-tight">
                {activeVideo.title}
              </h1>

              {/* Channel Row & Action Buttons (YouTube Style) */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
                {/* Channel Info */}
                <div className="flex items-center gap-3">
                  <img
                    src={activeVideo.channelAvatar || '/logo.png'}
                    alt={activeVideo.creator}
                    className="w-11 h-11 rounded-full object-cover border border-purple-500/30"
                  />
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="font-extrabold text-sm text-white">{activeVideo.channelName || activeVideo.creator}</span>
                      <CheckCircle2 className="w-3.5 h-3.5 text-purple-400 fill-purple-400/20" />
                    </div>
                    <span className="text-[11px] text-slate-400">
                      Official Benix Partner Channel
                    </span>
                  </div>

                  <button
                    onClick={() => handleToggleSubscribe(activeVideo.channelName || activeVideo.creator)}
                    className={`ml-3 px-4 py-2 rounded-full text-xs font-black transition-all ${
                      subscribedChannels.includes(activeVideo.channelName || activeVideo.creator)
                        ? 'bg-slate-800 hover:bg-slate-700 text-slate-300'
                        : 'bg-white hover:bg-slate-200 text-slate-950 shadow-md'
                    }`}
                  >
                    {subscribedChannels.includes(activeVideo.channelName || activeVideo.creator) ? (
                      <span className="flex items-center gap-1">
                        <Bell className="w-3 h-3 fill-current" /> Subscribed
                      </span>
                    ) : (
                      'Subscribe'
                    )}
                  </button>
                </div>

                {/* Actions: Like, Share & Earn, Unlock */}
                <div className="flex flex-wrap items-center gap-2">
                  {/* Like Button */}
                  <button
                    onClick={() => handleToggleLike(activeVideo)}
                    className={`px-4 py-2 rounded-full text-xs font-bold flex items-center gap-1.5 transition-all ${
                      likedVideoIds.includes(activeVideo.id)
                        ? 'bg-purple-600 text-white shadow-md shadow-purple-600/30'
                        : 'bg-[#141B29] hover:bg-slate-800 text-slate-300 border border-slate-800'
                    }`}
                  >
                    <ThumbsUp className={`w-3.5 h-3.5 ${likedVideoIds.includes(activeVideo.id) ? 'fill-current' : ''}`} />
                    <span>{activeVideo.likes.toLocaleString()}</span>
                  </button>

                  {/* Share & Earn 15% Affiliate Button */}
                  <button
                    onClick={() => setShareVideo(activeVideo)}
                    className="px-4 py-2 rounded-full bg-purple-600/20 hover:bg-purple-600/30 border border-purple-500/40 text-purple-300 text-xs font-bold flex items-center gap-1.5 transition-all shadow-md"
                    title="Earn 15% cash commission when friends unlock through your link"
                  >
                    <Share2 className="w-3.5 h-3.5" />
                    <span>Share & Earn 15%</span>
                  </button>

                  {/* Unlock Button if Paid and Locked */}
                  {!isVideoUnlocked(activeVideo) && (
                    <button
                      onClick={() => handleUnlockVideo(activeVideo)}
                      disabled={unlockingId === activeVideo.id}
                      className="px-4 py-2 rounded-full bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-black flex items-center gap-1.5 transition-all shadow-md shadow-amber-500/20"
                    >
                      <Unlock className="w-3.5 h-3.5" />
                      <span>{unlockingId === activeVideo.id ? 'Unlocking...' : `Unlock (${activeVideo.price} RWF)`}</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Collapsible Video Description Box (YouTube Style) */}
              <div className="p-4 rounded-2xl bg-[#131926] border border-slate-800/80 space-y-2">
                <div className="flex items-center gap-3 text-xs font-extrabold text-slate-300">
                  <span>{(activeVideo.views || 0).toLocaleString()} views</span>
                  <span>&bull;</span>
                  <span>{activeVideo.category}</span>
                  {activeVideo.price > 0 && (
                    <>
                      <span>&bull;</span>
                      <span className="text-amber-400">15% Affiliate Commission Available</span>
                    </>
                  )}
                </div>
                <p className="text-xs text-slate-300 leading-relaxed whitespace-pre-line">
                  {activeVideo.description || 'Verified high definition creator broadcast on BenixSpace.'}
                </p>
              </div>

              {/* Google AdSense Banner below description */}
              <div className="pt-2">
                <GoogleAdSense slot="8392017482" format="horizontal" />
              </div>

              {/* YouTube-Style Threaded Comments & Live Replies with Multilingual Moderation */}
              <div className="pt-2">
                <TVLiveChat videoId={activeVideo.id} title={activeVideo.title} />
              </div>

            </div>

            {/* Right Column: Recommended Videos (YouTube Sidebar) Mixed with Ads */}
            <div className="lg:col-span-4 space-y-4">
              <h3 className="text-sm font-extrabold text-white flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-purple-400" />
                <span>Up Next & Recommendations</span>
              </h3>

              <SidebarRecommendationsMixedAds
                items={videos.map((v) => ({
                  id: v.id,
                  title: v.title,
                  name: v.title,
                  thumbnail: v.thumbnail,
                  category: v.category
                }))}
                type="video"
                activeItemId={activeVideo.id}
                onSelectItem={(item) => {
                  const target = videos.find((x) => x.id === item.id);
                  if (target) handleSelectVideo(target);
                }}
              />
            </div>

          </div>
        ) : (
          /* ============================================================== */
          /* 2. CATALOG BROWSE VIEW (When No Active Video is Open)          */
          /* ============================================================== */
          <>
            {/* Hero Banner */}
            <div className="relative rounded-3xl overflow-hidden border border-slate-800 bg-gradient-to-br from-[#1C0F38] via-[#120B24] to-[#0B0E14] shadow-2xl p-6 sm:p-10">
              <div className="absolute top-0 right-0 -mr-16 -mt-16 w-80 h-80 rounded-full bg-purple-600/15 blur-3xl pointer-events-none" />
              <div className="absolute bottom-0 left-1/3 -mb-16 w-72 h-72 rounded-full bg-indigo-600/15 blur-3xl pointer-events-none" />

              <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
                <div className="space-y-4 max-w-2xl">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider bg-purple-600 text-white shadow-lg shadow-purple-600/30">
                      <Film className="w-3.5 h-3.5" />
                      Creator Studio & Video Hub
                    </span>
                    <span className="px-3 py-1 rounded-full text-xs font-semibold bg-purple-500/10 text-purple-300 border border-purple-500/20">
                      15% Affiliate Commission
                    </span>
                    <span className="px-3 py-1 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-300 border border-amber-500/20 flex items-center gap-1">
                      <Sparkles className="w-3 h-3 text-amber-400" />
                      Bonus Wallet Usable First
                    </span>
                  </div>

                  <h1 className="text-3xl sm:text-5xl font-black tracking-tight text-white leading-tight">
                    Watch Exclusive Rwandan Shows, <br />
                    <span className="bg-gradient-to-r from-purple-400 via-pink-300 to-indigo-300 bg-clip-text text-transparent">
                      Choral Concerts & Earn Commissions
                    </span>
                  </h1>

                  <p className="text-sm sm:text-base text-slate-300 leading-relaxed">
                    Stream verified high-definition Rwandan concerts, comedy, and cinema. Share your unique link to earn instant 15% cash commissions directly to your real wallet on every unlock!
                  </p>
                </div>

                <div className="w-full md:w-80 p-5 rounded-2xl bg-[#1C1236]/90 border border-purple-500/30 shadow-2xl backdrop-blur-md space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-purple-600/20 text-purple-400 flex items-center justify-center">
                      <Award className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="font-extrabold text-sm text-white">Affiliate Partner Hub</h4>
                      <p className="text-[11px] text-slate-400">Share any video to monetize</p>
                    </div>
                  </div>
                  <ul className="text-xs text-slate-300 space-y-2 pt-2 border-t border-slate-800">
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="w-3.5 h-3.5 text-purple-400" />
                      <span>15% commission on paid unlocks</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="w-3.5 h-3.5 text-purple-400" />
                      <span>Credited to Real Wallet for withdrawal</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="w-3.5 h-3.5 text-purple-400" />
                      <span>Cross-platform tracking & WhatsApp share</span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Categories Strip & Search */}
            <div className="flex flex-col md:flex-row items-center justify-between gap-4 pt-2">
              <div className="flex items-center gap-2 overflow-x-auto w-full md:w-auto pb-2 md:pb-0 scrollbar-none">
                {CATEGORIES.map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategory(cat)}
                    className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                      selectedCategory === cat
                        ? 'bg-purple-600 text-white shadow-lg shadow-purple-600/30'
                        : 'bg-[#131926] text-slate-400 hover:text-white hover:bg-[#1a2234] border border-slate-800'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>

              <div className="relative w-full md:w-72">
                <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search videos, choirs, shows..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-[#131926] border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-purple-500 transition-all"
                />
              </div>
            </div>

            {/* Video Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredVideos.map((video) => {
                const unlocked = isVideoUnlocked(video);
                return (
                  <div
                    key={video.id}
                    className="group rounded-3xl bg-[#131926] border border-slate-800/80 hover:border-purple-500/50 p-4 transition-all duration-300 hover:shadow-2xl hover:shadow-purple-950/30 flex flex-col justify-between"
                  >
                    <div>
                      {/* Thumbnail & Click to Watch */}
                      <div
                        onClick={() => handleSelectVideo(video)}
                        className="relative aspect-video rounded-2xl bg-slate-900 overflow-hidden cursor-pointer border border-slate-800/80 group-hover:border-purple-500/30 transition-all"
                      >
                        <img
                          src={video.thumbnail}
                          alt={video.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          loading="lazy"
                        />

                        {/* Duration Badge */}
                        <span className="absolute bottom-2.5 right-2.5 px-2 py-0.5 rounded-md bg-black/80 backdrop-blur-md text-[10px] font-bold text-slate-200">
                          {video.duration}
                        </span>

                        {/* Price / Unlocked Status Badge */}
                        <div className="absolute top-2.5 left-2.5 flex items-center gap-1.5">
                          {video.price <= 0 ? (
                            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase bg-emerald-600 text-white shadow-md">
                              Free
                            </span>
                          ) : unlocked ? (
                            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase bg-purple-600 text-white shadow-md flex items-center gap-1">
                              <Unlock className="w-3 h-3" />
                              Unlocked
                            </span>
                          ) : (
                            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase bg-amber-500 text-slate-950 shadow-md flex items-center gap-1">
                              <Lock className="w-3 h-3" />
                              {video.price.toLocaleString()} RWF
                            </span>
                          )}
                        </div>

                        {/* Play Hover Overlay */}
                        <div className="absolute inset-0 bg-purple-950/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                          <div className="w-12 h-12 rounded-2xl bg-purple-600 text-white flex items-center justify-center shadow-xl shadow-purple-600/50 transform group-hover:scale-110 transition-transform">
                            <Play className="w-5 h-5 fill-white ml-0.5" />
                          </div>
                        </div>
                      </div>

                      {/* Metadata */}
                      <div className="mt-3.5 space-y-1.5">
                        <div className="flex items-center justify-between text-[11px] text-purple-400 font-semibold">
                          <span>{video.category}</span>
                          <span className="text-slate-400 flex items-center gap-1">
                            <Eye className="w-3 h-3" />
                            {(video.views || 0).toLocaleString()}
                          </span>
                        </div>

                        <h3
                          onClick={() => handleSelectVideo(video)}
                          className="font-black text-sm text-white group-hover:text-purple-300 transition-colors line-clamp-2 cursor-pointer"
                        >
                          {video.title}
                        </h3>

                        <p className="text-xs text-slate-400 font-medium">
                          {video.channelName || video.creator}
                        </p>
                      </div>
                    </div>

                    {/* Bottom Actions Bar */}
                    <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <button
                          onClick={() => handleToggleLike(video)}
                          className="text-xs text-slate-400 hover:text-rose-400 flex items-center gap-1 transition-colors"
                          title="Like Video"
                        >
                          <Heart className={`w-3.5 h-3.5 ${likedVideoIds.includes(video.id) ? 'fill-rose-500 text-rose-500' : ''}`} />
                          <span>{video.likes.toLocaleString()}</span>
                        </button>

                        <button
                          onClick={() => setShareVideo(video)}
                          className="text-xs text-purple-400 hover:text-purple-300 font-bold flex items-center gap-1 transition-colors px-2.5 py-1 rounded-xl bg-purple-600/10 hover:bg-purple-600/20 border border-purple-500/20"
                          title="Share & Earn 15% Affiliate Commission"
                        >
                          <Share2 className="w-3.5 h-3.5" />
                          <span>Share & Earn</span>
                        </button>
                      </div>

                      <button
                        onClick={() => handleSelectVideo(video)}
                        className="px-3.5 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs flex items-center gap-1 transition-all shadow-md"
                      >
                        <Play className="w-3 h-3 fill-white" />
                        <span>Watch</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}

      </div>

      {/* Share & Earn Affiliate Modal */}
      {shareVideo && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="relative w-full max-w-lg rounded-3xl bg-[#121824] border border-purple-500/40 p-6 sm:p-8 shadow-2xl space-y-5">
            <button
              onClick={() => {
                setShareVideo(null);
                setCopiedLink(false);
              }}
              className="absolute top-4 right-4 w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition-all"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-purple-600/20 text-purple-400 flex items-center justify-center">
                <Share2 className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-black text-lg text-white">Share & Earn 15% Cash</h3>
                <p className="text-xs text-slate-400">Unique cross-platform affiliate referral tracking</p>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-[#1C1236]/80 border border-purple-500/30 text-xs text-purple-200 space-y-1">
              <p className="font-bold">How it works:</p>
              <p className="text-slate-300">
                When anyone clicks your link and unlocks this video ({shareVideo.price > 0 ? `${shareVideo.price} RWF` : 'paid catalog items'}), you instantly receive <strong className="text-amber-400">15% cash commission</strong> directly credited to your real withdrawal wallet!
              </p>
            </div>

            {/* Generated Shareable Link Box */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-400">Your Shareable Affiliate Link:</label>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  readOnly
                  value={getAffiliateShareLink(shareVideo)}
                  className="flex-1 px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-xs text-purple-300 font-mono focus:outline-none"
                />
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(getAffiliateShareLink(shareVideo));
                    setCopiedLink(true);
                    setTimeout(() => setCopiedLink(false), 3000);
                  }}
                  className={`px-4 py-2.5 rounded-xl font-bold text-xs flex items-center gap-1.5 transition-all ${
                    copiedLink
                      ? 'bg-emerald-600 text-white'
                      : 'bg-purple-600 hover:bg-purple-500 text-white shadow-md'
                  }`}
                >
                  {copiedLink ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  <span>{copiedLink ? 'Copied!' : 'Copy'}</span>
                </button>
              </div>
            </div>

            {/* Instant WhatsApp Share Button */}
            <a
              href={`https://wa.me/?text=${encodeURIComponent(
                `Reba iyi video nziza "${shareVideo.title}" kuri BenixSpace Video Hub: ${getAffiliateShareLink(shareVideo)}`
              )}`}
              target="_blank"
              rel="noreferrer"
              className="w-full py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/30 transition-all"
            >
              <ExternalLink className="w-4 h-4" />
              <span>Share to WhatsApp Contacts & Groups</span>
            </a>
          </div>
        </div>
      )}

      {/* Creator Upload / Post Video Modal */}
      {showPostModal && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
          <div className="relative w-full max-w-lg rounded-3xl bg-[#121824] border border-purple-500/40 p-6 sm:p-8 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setShowPostModal(false)}
              className="absolute top-4 right-4 w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition-all"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-purple-600/20 text-purple-400 flex items-center justify-center">
                <Upload className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-black text-lg text-white">Post / Upload Video</h3>
                <p className="text-xs text-slate-400">Share your Rwandan concerts, shows, or tutorials</p>
              </div>
            </div>

            <form onSubmit={handlePostVideo} className="space-y-3.5">
              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1">Video Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Live Worship Concert in Kigali"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white focus:outline-none focus:border-purple-500"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1">Video Stream / YouTube URL *</label>
                <input
                  type="url"
                  required
                  placeholder="https://www.youtube.com/watch?v=... or HLS/MP4 link"
                  value={newVideoUrl}
                  onChange={(e) => setNewVideoUrl(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white focus:outline-none focus:border-purple-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-300 block mb-1">Category</label>
                  <select
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white focus:outline-none focus:border-purple-500"
                  >
                    <option value="Gospel & Choirs">Gospel & Choirs</option>
                    <option value="Series & Comedy">Series & Comedy</option>
                    <option value="Culture & Documentaries">Culture & Documentaries</option>
                    <option value="Music & Shows">Music & Shows</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-300 block mb-1">Unlock Price (RWF)</label>
                  <input
                    type="number"
                    min="0"
                    step="50"
                    placeholder="0 for Free"
                    value={newPrice}
                    onChange={(e) => setNewPrice(Number(e.target.value))}
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white focus:outline-none focus:border-purple-500"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1">Thumbnail Image URL</label>
                <input
                  type="url"
                  placeholder="https://... (Optional cover photo)"
                  value={newThumbnailUrl}
                  onChange={(e) => setNewThumbnailUrl(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white focus:outline-none focus:border-purple-500"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1">Description</label>
                <textarea
                  rows={3}
                  placeholder="Provide context, performers, date, and details..."
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white focus:outline-none focus:border-purple-500 resize-none"
                />
              </div>

              <button
                type="submit"
                disabled={isPosting}
                className="w-full py-3 rounded-2xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-black text-xs shadow-lg shadow-purple-600/30 transition-all disabled:opacity-50"
              >
                {isPosting ? 'Publishing Video...' : 'Publish Video to Hub 🎬'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Central Wallet Modal */}
      <WalletModal
        isOpen={showWalletModal}
        onClose={() => setShowWalletModal(false)}
      />

      {/* Access Wizard Modal for Authentication Prompt */}
      <AppAccessWizardModal
        isOpen={showWizardModal}
        targetAppKey="videos"
        onClose={() => setShowWizardModal(false)}
        onSuccess={() => {
          setShowWizardModal(false);
          refreshMe();
        }}
      />
    </div>
  );
};
