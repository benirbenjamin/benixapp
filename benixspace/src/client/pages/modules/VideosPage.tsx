import React, { useState, useEffect } from 'react';
import { Link, useSearchParams, useParams } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { SeoHead } from '../../components/common/SeoHead';
import { WalletModal } from '../../components/modals/WalletModal';
import { AppAccessWizardModal } from '../../components/modals/AppAccessWizardModal';
import {
  Film,
  Play,
  Heart,
  Share2,
  Lock,
  Unlock,
  CheckCircle2,
  DollarSign,
  Sparkles,
  Search,
  ArrowLeft,
  X,
  Copy,
  ExternalLink,
  Eye,
  Check,
  TrendingUp,
  Award
} from 'lucide-react';
import axios from 'axios';

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
}

const FALLBACK_VIDEOS: VideoItem[] = [
  {
    id: 'vid-01',
    title: 'Ambassadors of Christ Choir - Kwetu Pazuri Live in Concert',
    creator: 'Ambassadors of Christ',
    thumbnail: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=800&auto=format&fit=crop&q=80',
    duration: '14:20',
    views: 482000,
    likes: 29400,
    category: 'Gospel & Choirs',
    price: 0,
    embedUrl: 'https://www.youtube-nocookie.com/embed/videoseries?list=PLrEnWoR732-C_N24_e0fP_E',
    description: 'The world-renowned Ambassadors of Christ choir performing signature hymns live in Kigali.'
  },
  {
    id: 'vid-02',
    title: 'Israel Mbonyi - Nina Siri Live Acoustic BK Arena Experience',
    creator: 'Israel Mbonyi Official',
    thumbnail: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=800&auto=format&fit=crop&q=80',
    duration: '8:45',
    views: 890000,
    likes: 64200,
    category: 'Gospel & Choirs',
    price: 0,
    embedUrl: 'https://www.youtube-nocookie.com/embed/7V-2mGj8H1M',
    description: 'Soul-stirring live gospel performance with a 20,000 capacity BK Arena audience in worship.'
  },
  {
    id: 'vid-03',
    title: 'Seburikoko Season 18 — Full Episode Premier (Afrifame Pictures)',
    creator: 'Afrifame Pictures',
    thumbnail: 'https://images.unsplash.com/photo-1574375927938-d5a98e8ffe85?w=800&auto=format&fit=crop&q=80',
    duration: '26:15',
    views: 312000,
    likes: 18900,
    category: 'Series & Comedy',
    price: 300,
    commission_pct: 15,
    embedUrl: 'https://www.youtube-nocookie.com/embed/videoseries?list=PLfWb3Xk-comedy',
    description: "Rwanda's favorite national television drama series. Follow Seburikoko's village adventures."
  },
  {
    id: 'vid-04',
    title: 'Bamenya Series Episode 142 — Byakaze mu Mujyi',
    creator: 'Zacu TV',
    thumbnail: 'https://images.unsplash.com/photo-1485846234645-a62644f84728?w=800&auto=format&fit=crop&q=80',
    duration: '22:30',
    views: 520000,
    likes: 31000,
    category: 'Series & Comedy',
    price: 0,
    embedUrl: 'https://www.youtube-nocookie.com/embed/videoseries?list=PLzacu-bamenya',
    description: 'City life comedy drama starring Denis Nsanzimahoro (Bamenya) exploring modern youth culture.'
  },
  {
    id: 'vid-05',
    title: 'City Maid Season 12 Finale — Inkuru Idasanzwe',
    creator: 'Zacu Entertainment',
    thumbnail: 'https://images.unsplash.com/photo-1536440136628-849c177e76a1?w=800&auto=format&fit=crop&q=80',
    duration: '28:10',
    views: 410000,
    likes: 24500,
    category: 'Series & Comedy',
    price: 500,
    commission_pct: 15,
    embedUrl: 'https://www.youtube-nocookie.com/embed/videoseries?list=PLzacu-citymaid',
    description: 'Emotional season finale unveiling domestic challenges and family triumphs in Kigali.'
  },
  {
    id: 'vid-06',
    title: 'Alarm Ministries - Hashimwe Izina Ryera Live Worship Album',
    creator: 'Alarm Ministries',
    thumbnail: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=800&auto=format&fit=crop&q=80',
    duration: '18:50',
    views: 295000,
    likes: 21300,
    category: 'Gospel & Choirs',
    price: 0,
    embedUrl: 'https://www.youtube-nocookie.com/embed/videoseries?list=PLalarm-ministries',
    description: 'An anointed evening of praise and prophetic worship recorded live in Kimisagara.'
  },
  {
    id: 'vid-07',
    title: 'Chorale de Kigali — Easter Gala Evening at Kigali Serena',
    creator: 'Chorale de Kigali',
    thumbnail: 'https://images.unsplash.com/photo-1465847899084-d164df4dedc6?w=800&auto=format&fit=crop&q=80',
    duration: '32:00',
    views: 180000,
    likes: 14700,
    category: 'Gospel & Choirs',
    price: 500,
    commission_pct: 15,
    embedUrl: 'https://www.youtube-nocookie.com/embed/videoseries?list=PLchorale-de-kigali',
    description: 'Majestic classical polyphonic choral harmony performing traditional and sacred masterpieces.'
  },
  {
    id: 'vid-08',
    title: 'Visit Rwanda 4K Cinematic Journey — The Land of a Thousand Hills',
    creator: 'Rwanda Development Board',
    thumbnail: 'https://images.unsplash.com/photo-1547471080-7cc2caa01a7e?w=800&auto=format&fit=crop&q=80',
    duration: '12:15',
    views: 740000,
    likes: 58000,
    category: 'Culture & Documentaries',
    price: 0,
    embedUrl: 'https://www.youtube-nocookie.com/embed/videoseries?list=PLvisit-rwanda',
    description: 'Breathtaking 4K drone cinematography spanning Volcanoes National Park, Lake Kivu, and Akagera.'
  },
  {
    id: 'vid-09',
    title: 'BK Arena All-Stars Mega Concert Live Stream Experience',
    creator: 'BK Arena Live',
    thumbnail: 'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=800&auto=format&fit=crop&q=80',
    duration: '45:30',
    views: 620000,
    likes: 49200,
    category: 'Music & Shows',
    price: 1000,
    commission_pct: 20,
    embedUrl: 'https://www.youtube-nocookie.com/embed/videoseries?list=PLbk-arena-concerts',
    description: 'High-energy arena concert featuring the best contemporary African and Rwandan musicians.'
  }
];

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
  const [searchParams] = useSearchParams();
  const { id: routeVideoId } = useParams();
  const { user, wallet, refreshMe } = useAuth();

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

  // Share & Earn Affiliate Modal State
  const [shareVideo, setShareVideo] = useState<VideoItem | null>(null);
  const [copiedLink, setCopiedLink] = useState<boolean>(false);
  const [showWalletModal, setShowWalletModal] = useState<boolean>(false);
  const [showWizardModal, setShowWizardModal] = useState<boolean>(false);
  const [unlockingId, setUnlockingId] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<string>('');

  // 1. Cross-Platform Referral Code Listener: Capture ?ref= from URL
  useEffect(() => {
    const refCode = searchParams.get('ref');
    if (refCode) {
      localStorage.setItem('benix_ref', refCode);
      console.log('🔗 Cross-Platform Affiliate Referral Tracked:', refCode);
    }
  }, [searchParams]);

  // 2. Fetch video catalogue from server
  useEffect(() => {
    axios
      .get('/api/modules/videos')
      .then((res) => {
        if (res.data?.videos && Array.isArray(res.data.videos) && res.data.videos.length > 0) {
          setVideos(res.data.videos);
        }
      })
      .catch(() => {
        // Keeps fallback videos smoothly
      });
  }, []);

  // 3. Auto-open video if specified in route or URL query (?v= or /videos/:id)
  useEffect(() => {
    const targetId = routeVideoId || searchParams.get('v');
    if (targetId) {
      const found = videos.find((v) => v.id === targetId);
      if (found) {
        setActiveVideo(found);
      }
    }
  }, [routeVideoId, searchParams, videos]);

  const handleLike = async (vid: VideoItem) => {
    setVideos((prev) =>
      prev.map((v) => (v.id === vid.id ? { ...v, likes: v.likes + 1 } : v))
    );
    try {
      const token = localStorage.getItem('benix_auth_token');
      if (token) {
        await axios.post(
          `/api/modules/videos/${vid.id}/like`,
          {},
          { headers: { Authorization: `Bearer ${token}` } }
        );
      }
    } catch {}
  };

  const handleUnlockVideo = async (video: VideoItem) => {
    if (!user) {
      setShowWizardModal(true);
      return;
    }

    const totalBalance = (wallet?.balance || 0) + (wallet?.bonus_balance || 0);
    if (totalBalance < video.price) {
      setShowWalletModal(true);
      return;
    }

    setUnlockingId(video.id);
    const token = localStorage.getItem('benix_auth_token');
    const refCode = localStorage.getItem('benix_ref') || '';

    try {
      const res = await axios.post(
        `/api/modules/videos/${video.id}/unlock`,
        { ref: refCode },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      const updated = [...unlockedVideoIds, video.id];
      setUnlockedVideoIds(updated);
      localStorage.setItem('benix_unlocked_videos', JSON.stringify(updated));

      setStatusMessage(`Unlocked "${video.title}" successfully!`);
      setTimeout(() => setStatusMessage(''), 4000);
      await refreshMe();
    } catch (err: any) {
      setStatusMessage(err.response?.data?.error || 'Failed to unlock video.');
      setTimeout(() => setStatusMessage(''), 4000);
    } finally {
      setUnlockingId(null);
    }
  };

  const isVideoUnlocked = (video: VideoItem) => {
    if (video.price <= 0) return true;
    return unlockedVideoIds.includes(video.id);
  };

  const getAffiliateShareLink = (video: VideoItem) => {
    const refParam = user?.referral_code || user?.id || 'BENIX-INVITE';
    const origin = window.location.origin;
    return `${origin}/videos?ref=${refParam}&v=${video.id}`;
  };

  const handleCopyAffiliateLink = (video: VideoItem) => {
    const link = getAffiliateShareLink(video);
    navigator.clipboard.writeText(link);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 3000);
  };

  const filteredVideos = videos.filter((vid) => {
    const matchesSearch =
      vid.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      vid.creator.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (vid.description && vid.description.toLowerCase().includes(searchQuery.toLowerCase()));

    if (!matchesSearch) return false;

    if (selectedCategory === 'All') return true;
    if (selectedCategory === 'Free to Watch') return vid.price <= 0;
    if (selectedCategory === 'Premium') return vid.price > 0;
    return vid.category.toLowerCase().includes(selectedCategory.toLowerCase());
  });

  return (
    <div className="bg-[#0B0E14] text-slate-100 min-h-screen pb-24 font-sans selection:bg-purple-600 selection:text-white">
      <SeoHead
        title="Creator Studio & Video Hub — BenixSpace"
        description="Stream exclusive Rwandan creator shows, live choir concerts, series, and comedy. Share videos to earn affiliate commissions directly into your real wallet."
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 space-y-6">
        
        {/* Top Breadcrumb Navigation */}
        <div className="flex items-center justify-between">
          <Link
            to="/"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-2xl bg-[#121824] hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800 text-xs font-bold transition-all hover:scale-105 shadow-md"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Home</span>
          </Link>

          {/* Dual Wallet Display in Header */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowWalletModal(true)}
              className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-2xl bg-[#131E2C] hover:bg-[#1A2A3E] border border-blue-500/30 text-xs font-bold text-blue-400 transition-all shadow-md"
            >
              <DollarSign className="w-3.5 h-3.5" />
              <span>Real: {(wallet?.balance || 0).toLocaleString()} RWF</span>
              {Boolean(wallet?.bonus_balance) && (
                <span className="px-1.5 py-0.5 rounded-md bg-amber-500/20 text-amber-300 text-[10px] font-black border border-amber-500/30">
                  +{(wallet?.bonus_balance || 0).toLocaleString()} Bonus
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Hero Section */}
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

        {/* Status Notification */}
        {statusMessage && (
          <div className="p-4 rounded-2xl bg-purple-950/80 border border-purple-500/50 text-purple-200 text-xs font-bold flex items-center gap-2 shadow-lg animate-in fade-in">
            <CheckCircle2 className="w-4 h-4 text-purple-400" />
            <span>{statusMessage}</span>
          </div>
        )}

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
                  {/* Thumbnail & Player Overlay */}
                  <div
                    onClick={() => {
                      if (unlocked) setActiveVideo(video);
                      else handleUnlockVideo(video);
                    }}
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
                      onClick={() => {
                        if (unlocked) setActiveVideo(video);
                        else handleUnlockVideo(video);
                      }}
                      className="font-black text-sm text-white group-hover:text-purple-300 transition-colors line-clamp-2 cursor-pointer"
                    >
                      {video.title}
                    </h3>

                    <p className="text-xs text-slate-400 font-medium">
                      {video.creator}
                    </p>
                  </div>
                </div>

                {/* Bottom Actions Bar */}
                <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => handleLike(video)}
                      className="text-xs text-slate-400 hover:text-rose-400 flex items-center gap-1 transition-colors"
                      title="Like Video"
                    >
                      <Heart className="w-3.5 h-3.5" />
                      <span>{video.likes.toLocaleString()}</span>
                    </button>

                    {/* Share & Earn Affiliate Link */}
                    <button
                      onClick={() => setShareVideo(video)}
                      className="text-xs text-purple-400 hover:text-purple-300 font-bold flex items-center gap-1 transition-colors px-2.5 py-1 rounded-xl bg-purple-600/10 hover:bg-purple-600/20 border border-purple-500/20"
                      title="Share & Earn 15% Affiliate Commission"
                    >
                      <Share2 className="w-3.5 h-3.5" />
                      <span>Share & Earn</span>
                    </button>
                  </div>

                  {unlocked ? (
                    <button
                      onClick={() => setActiveVideo(video)}
                      className="px-3.5 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs flex items-center gap-1 transition-all shadow-md"
                    >
                      <Play className="w-3 h-3 fill-white" />
                      <span>Watch</span>
                    </button>
                  ) : (
                    <button
                      onClick={() => handleUnlockVideo(video)}
                      disabled={unlockingId === video.id}
                      className="px-3.5 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs flex items-center gap-1 transition-all shadow-md disabled:opacity-50"
                    >
                      <Unlock className="w-3 h-3" />
                      <span>{unlockingId === video.id ? 'Unlocking...' : `Unlock ${video.price} RWF`}</span>
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>

      </div>

      {/* Video Player Modal */}
      {activeVideo && (
        <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-4">
          <div className="relative w-full max-w-4xl rounded-3xl bg-[#121824] border border-slate-700 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            {/* Header */}
            <div className="p-4 sm:p-5 flex items-center justify-between border-b border-slate-800">
              <div className="flex items-center gap-3">
                <Film className="w-5 h-5 text-purple-400" />
                <h3 className="font-extrabold text-base text-white line-clamp-1">
                  {activeVideo.title}
                </h3>
              </div>
              <button
                onClick={() => setActiveVideo(null)}
                className="w-8 h-8 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition-all"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Video Frame */}
            <div className="relative aspect-video w-full bg-black">
              <iframe
                src={activeVideo.embedUrl}
                title={activeVideo.title}
                className="w-full h-full border-0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                allowFullScreen
              />
            </div>

            {/* Details Footer */}
            <div className="p-4 sm:p-6 space-y-3 overflow-y-auto">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h4 className="font-extrabold text-lg text-white">{activeVideo.title}</h4>
                  <p className="text-xs text-slate-400">{activeVideo.creator} • {activeVideo.category}</p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setShareVideo(activeVideo)}
                    className="px-4 py-2 rounded-xl bg-purple-600/20 hover:bg-purple-600/30 text-purple-300 border border-purple-500/30 text-xs font-bold flex items-center gap-1.5 transition-all"
                  >
                    <Share2 className="w-3.5 h-3.5" />
                    <span>Share & Earn 15%</span>
                  </button>
                </div>
              </div>
              {activeVideo.description && (
                <p className="text-xs text-slate-300 leading-relaxed pt-2 border-t border-slate-800">
                  {activeVideo.description}
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Share & Earn Affiliate Modal */}
      {shareVideo && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="relative w-full max-w-lg rounded-3xl bg-[#121824] border border-slate-700 shadow-2xl p-6 space-y-5">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-purple-600/20 text-purple-400 flex items-center justify-center">
                  <TrendingUp className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-black text-base text-white">Share & Earn 15% Commission</h3>
                  <p className="text-xs text-slate-400">Paid straight to your Real Wallet</p>
                </div>
              </div>
              <button
                onClick={() => setShareVideo(null)}
                className="w-8 h-8 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition-all"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-4 rounded-2xl bg-[#182133] border border-slate-700/80 space-y-1">
              <p className="text-[11px] uppercase font-bold text-purple-400 tracking-wider">Video</p>
              <h4 className="font-bold text-sm text-white line-clamp-1">{shareVideo.title}</h4>
              <p className="text-xs text-slate-400">By {shareVideo.creator}</p>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-300 block">Your Unique Affiliate Link</label>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  readOnly
                  value={getAffiliateShareLink(shareVideo)}
                  className="flex-1 px-3.5 py-2.5 rounded-xl bg-[#0B0E14] border border-slate-700 text-xs text-slate-200 font-mono focus:outline-none"
                />
                <button
                  onClick={() => handleCopyAffiliateLink(shareVideo)}
                  className="px-4 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs shadow-md flex items-center gap-1.5 transition-all shrink-0"
                >
                  {copiedLink ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                  <span>{copiedLink ? 'Copied!' : 'Copy'}</span>
                </button>
              </div>
            </div>

            {/* Quick Share to Socials */}
            <div className="space-y-2 pt-2 border-t border-slate-800">
              <p className="text-xs font-semibold text-slate-400">Instant One-Click Share:</p>
              <div className="grid grid-cols-2 gap-3">
                <a
                  href={`https://wa.me/?text=${encodeURIComponent(
                    `Watch "${shareVideo.title}" on BenixSpace: ${getAffiliateShareLink(shareVideo)}`
                  )}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-4 py-2.5 rounded-xl bg-emerald-600/20 hover:bg-emerald-600/30 border border-emerald-500/30 text-emerald-300 font-bold text-xs flex items-center justify-center gap-2 transition-all"
                >
                  <span>WhatsApp</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>

                <a
                  href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(
                    `Check out "${shareVideo.title}" on BenixSpace Video Hub: ${getAffiliateShareLink(shareVideo)}`
                  )}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-4 py-2.5 rounded-xl bg-sky-600/20 hover:bg-sky-600/30 border border-sky-500/30 text-sky-300 font-bold text-xs flex items-center justify-center gap-2 transition-all"
                >
                  <span>Twitter / X</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>
            </div>

            {!user && (
              <p className="text-[11px] text-amber-300 bg-amber-500/10 p-2.5 rounded-xl border border-amber-500/20 text-center">
                Log in or sign up to ensure commissions are credited to your personal account wallet.
              </p>
            )}
          </div>
        </div>
      )}

      {/* Modals */}
      <WalletModal isOpen={showWalletModal} onClose={() => setShowWalletModal(false)} />
      <AppAccessWizardModal
        isOpen={showWizardModal}
        targetAppKey="videos"
        onClose={() => setShowWizardModal(false)}
        onSuccess={() => setShowWizardModal(false)}
      />
    </div>
  );
};
