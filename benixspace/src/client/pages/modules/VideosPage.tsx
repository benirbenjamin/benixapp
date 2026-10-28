import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { Link, useSearchParams, useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { SeoHead } from '../../components/common/SeoHead';
import { WalletModal } from '../../components/modals/WalletModal';
import { AppAccessWizardModal } from '../../components/modals/AppAccessWizardModal';
import { SidebarRecommendationsMixedAds } from '../../components/ads/SidebarRecommendationsMixedAds';
import { TVLiveChat } from '../../components/chat/TVLiveChat';
import { getAuthToken } from '../../services/api';
import { rankPersonalizedVideos, recordWatchInteraction, recordSearchInteraction } from '../../utils/recommendationEngine';
import {
  Film,
  Play,
  Pause,
  Volume2,
  VolumeX,
  Maximize,
  Minimize,
  SkipForward,
  SkipBack,
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
  X,
  Wifi,
  Settings
} from 'lucide-react';
import axios from 'axios';
import { GoogleAdSense } from '../../components/ads/GoogleAdSense';
import { CreateMediaModal } from '../../components/modals/CreateMediaModal';
import { UniversalMediaAdOverlay } from '../../components/ads/UniversalMediaAdOverlay';
import { ADS_CONFIG } from '../../config/ads';
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

export function getSafeYouTubeEmbedUrl(
  video: { id?: string; embedUrl?: string; videoUrl?: string } | null | undefined,
  quality: string = '720p'
): string {
  if (!video) return '';
  const vidId = video.id?.trim();
  const vqMap: Record<string, string> = {
    '1080p': 'hd1080',
    '720p': 'hd720',
    '480p': 'large',
    '360p': 'medium'
  };
  const vq = vqMap[quality] || 'hd720';

  // If video id is a standard 11-char YouTube ID (e.g. B0xTrgyZGeM)
  if (vidId && /^[a-zA-Z0-9_-]{11}$/.test(vidId)) {
    return `https://www.youtube.com/embed/${vidId}?autoplay=1&enablejsapi=1&playsinline=1&rel=0&vq=${vq}`;
  }

  // Check in embedUrl or videoUrl
  const urlCandidate = (video.embedUrl || video.videoUrl || '').trim();
  const ytMatch = urlCandidate.match(/(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/|youtube-nocookie\.com\/embed\/)([a-zA-Z0-9_-]{11})/);
  if (ytMatch && ytMatch[1]) {
    return `https://www.youtube.com/embed/${ytMatch[1]}?autoplay=1&enablejsapi=1&playsinline=1&rel=0&vq=${vq}`;
  }

  if (urlCandidate.includes('/embed/')) {
    const separator = urlCandidate.includes('?') ? '&' : '?';
    return `${urlCandidate}${separator}autoplay=1&enablejsapi=1&playsinline=1&rel=0&vq=${vq}`;
  }

  return urlCandidate;
}

export function isYouTubeVideo(video: { id?: string; embedUrl?: string; videoUrl?: string } | null | undefined): boolean {
  if (!video) return false;
  const vidId = video.id?.trim();
  if (vidId && /^[a-zA-Z0-9_-]{11}$/.test(vidId) && !vidId.startsWith('vid-')) return true;
  const str = (video.embedUrl || video.videoUrl || '').toLowerCase();
  return (str.includes('youtube.com') || str.includes('youtu.be')) && !str.includes('drive.google');
}

export function isGoogleDriveVideo(video: { id?: string; embedUrl?: string; videoUrl?: string } | null | undefined): boolean {
  if (!video) return false;
  const str = (video.embedUrl || video.videoUrl || '').toLowerCase();
  return str.includes('drive.google.com') || str.includes('docs.google.com');
}

export function getGoogleDrivePreviewUrl(video: { id?: string; embedUrl?: string; videoUrl?: string } | null | undefined): string {
  if (!video) return '';
  const url = (video.embedUrl || video.videoUrl || '').trim();
  const match = url.match(/(?:\/d\/|id=)([a-zA-Z0-9_-]+)/);
  if (match && match[1]) {
    return `/api/media/stream/${match[1]}`;
  }
  return url;
}

export function getSafeVideoSrc(video: { id?: string; embedUrl?: string; videoUrl?: string } | null | undefined): string {
  if (!video) return '';
  const url = (video.embedUrl || (video as any).videoUrl || '').trim();
  if (isGoogleDriveVideo(video)) {
    const match = url.match(/(?:\/d\/|id=)([a-zA-Z0-9_-]+)/);
    if (match && match[1]) {
      return `/api/media/stream/${match[1]}`;
    }
  }
  if (url.startsWith('/uploads/') || url.includes('/uploads/')) {
    const filename = url.split('/uploads/')[1];
    if (filename) return `/api/uploads/${filename}`;
  }
  return url;
}

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

  // Personalized video feed ranking
  const rankedVideos = useMemo(() => {
    return rankPersonalizedVideos(videos, user?.id || null);
  }, [videos, user?.id]);

  const filteredVideos = useMemo(() => {
    return rankedVideos.filter((vid) => {
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
  }, [rankedVideos, searchQuery, selectedCategory]);

  // Record search queries to recommendation engine
  useEffect(() => {
    if (searchQuery.trim().length >= 3) {
      const timer = setTimeout(() => {
        recordSearchInteraction(searchQuery);
      }, 600);
      return () => clearTimeout(timer);
    }
  }, [searchQuery]);

  const [activeVideo, setActiveVideo] = useState<VideoItem | null>(null);
  const [unlockedVideoIds, setUnlockedVideoIds] = useState<string[]>(() => {
    try {
      return JSON.parse(localStorage.getItem('benix_unlocked_videos') || '[]');
    } catch {
      return [];
    }
  });

  // Autoplay feature state (persisted)
  const [autoplayEnabled, setAutoplayEnabled] = useState<boolean>(() => {
    try {
      return localStorage.getItem('benix_video_autoplay') !== 'false';
    } catch {
      return true;
    }
  });

  const toggleAutoplay = () => {
    setAutoplayEnabled((prev) => {
      const next = !prev;
      localStorage.setItem('benix_video_autoplay', String(next));
      return next;
    });
  };

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

  // Creator Upload Video Modal State (Unified Chunked + Background Upload Modal)
  const [showCreateMediaModal, setShowCreateMediaModal] = useState<boolean>(false);

  // In-Stream Video Ad Timing State (10s initial delay, 5m interval)
  const [showVideoAd, setShowVideoAd] = useState<boolean>(false);
  const [hasTriggeredInitialVideoAd, setHasTriggeredInitialVideoAd] = useState<boolean>(false);
  const [videoAdDelaySec, setVideoAdDelaySec] = useState<number>(10);
  const [videoAdIntervalSec, setVideoAdIntervalSec] = useState<number>(300);
  const videoAdInitialTimerRef = useRef<any>(null);
  const videoAdIntervalTimerRef = useRef<any>(null);

  // Media Player Ref & Playback Controls State
  const playerContainerRef = useRef<HTMLDivElement>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  const [isPlaying, setIsPlaying] = useState<boolean>(true);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [centerFeedback, setCenterFeedback] = useState<'play' | 'pause' | null>(null);
  const feedbackTimerRef = useRef<any>(null);

  // 20% Preview for Premium Videos
  const [videoCurrentTime, setVideoCurrentTime] = useState<number>(0);
  const [videoDuration, setVideoDuration] = useState<number>(0);
  const [isPreviewEnded, setIsPreviewEnded] = useState<boolean>(false);
  const [isControlsVisible, setIsControlsVisible] = useState<boolean>(true);
  const controlsTimeoutRef = useRef<any>(null);

  // Helper to robustly parse video duration in seconds whether number, string ("12:45"), or undefined
  const parseSeconds = (val: any): number => {
    if (typeof val === 'number') {
      return isNaN(val) ? 0 : val;
    }
    if (!val) return 0;
    if (typeof val === 'string') {
      const trimmed = val.trim();
      if (trimmed.includes(':')) {
        const parts = trimmed.split(':').map((p) => parseFloat(p) || 0);
        if (parts.length === 3) {
          return parts[0] * 3600 + parts[1] * 60 + parts[2];
        }
        if (parts.length === 2) {
          return parts[0] * 60 + parts[1];
        }
      }
      const num = parseFloat(trimmed);
      return isNaN(num) ? 0 : num;
    }
    return 0;
  };

  const formatTimestamp = (val: any): string => {
    if (typeof val === 'string' && val.includes(':') && !val.includes('NaN')) {
      return val;
    }
    const s = Math.max(0, Math.floor(parseSeconds(val)));
    const h = Math.floor(s / 3600);
    const m = Math.floor((s % 3600) / 60);
    const r = s % 60;
    if (h > 0) {
      return `${h}:${m < 10 ? '0' : ''}${m}:${r < 10 ? '0' : ''}${r}`;
    }
    return `${m}:${r < 10 ? '0' : ''}${r}`;
  };

  const handleMouseMovePlayer = () => {
    setIsControlsVisible(true);
    if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
    if (isPlaying) {
      controlsTimeoutRef.current = setTimeout(() => {
        setIsControlsVisible(false);
      }, 2500);
    }
  };

  const handlePlayerTap = (e: React.MouseEvent) => {
    // Only toggle if not clicking interactive controls
    setIsControlsVisible((prev) => {
      const next = !prev;
      if (next && isPlaying) {
        if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
        controlsTimeoutRef.current = setTimeout(() => {
          setIsControlsVisible(false);
        }, 2500);
      }
      return next;
    });
  };

  const handleSeek = (e: React.MouseEvent<HTMLDivElement>) => {
    e.stopPropagation();
    if (!videoRef.current) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const pos = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    const effectiveDur = videoDuration || videoRef.current.duration || parseSeconds(activeVideo?.duration) || 1;
    const targetTime = pos * effectiveDur;

    const limitSec = Math.max(12, Math.floor((parseSeconds(activeVideo?.duration) || effectiveDur) * 0.20));
    if (!activeVideo || isVideoUnlocked(activeVideo) || targetTime < limitSec) {
      videoRef.current.currentTime = targetTime;
      setVideoCurrentTime(targetTime);
    } else {
      videoRef.current.currentTime = limitSec;
      setVideoCurrentTime(limitSec);
      setIsPreviewEnded(true);
      videoRef.current.pause();
    }
  };

  useEffect(() => {
    setVideoCurrentTime(0);
    setVideoDuration(0);
    setIsPreviewEnded(false);
  }, [activeVideo?.id]);

  // Adaptive Video Quality State (Low -> Medium -> HD automatically based on connection)
  const [networkQuality, setNetworkQuality] = useState<'360p' | '480p' | '720p' | '1080p'>('720p');
  const [qualityMode, setQualityMode] = useState<'auto' | '360p' | '480p' | '720p' | '1080p'>('auto');
  const [connectionSpeedLabel, setConnectionSpeedLabel] = useState<string>('Adaptive Auto');
  const [showQualityMenu, setShowQualityMenu] = useState<boolean>(false);

  const activeQuality = qualityMode === 'auto' ? networkQuality : qualityMode;

  // Timer for 20% preview on YouTube videos
  useEffect(() => {
    if (!activeVideo || isVideoUnlocked(activeVideo) || isPreviewEnded || !isPlaying || !isYouTubeVideo(activeVideo)) return;
    const limit = Math.max(12, Math.floor((parseSeconds(activeVideo.duration) || 300) * 0.20));
    const timer = setInterval(() => {
      setVideoCurrentTime((prev) => {
        const next = prev + 1;
        if (next >= limit) {
          setIsPreviewEnded(true);
        }
        return next;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [activeVideo, unlockedVideoIds, isPreviewEnded, isPlaying]);
  // Periodic watch time tracking ping: records 5 seconds of watch time while video is playing
  useEffect(() => {
    if (!activeVideo || !isPlaying) return;

    const token = getAuthToken();
    const interval = setInterval(() => {
      fetch('/api/videos/watch-time', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
        body: JSON.stringify({
          videoId: activeVideo.id,
          seconds: 5,
          creatorId: (activeVideo as any).userId || (activeVideo as any).creator_id || (activeVideo as any).creatorId
        })
      }).catch(() => {});
    }, 5000);

    return () => clearInterval(interval);
  }, [activeVideo?.id, isPlaying]);

  // 10-Second View Counter Rule: 1 view is recorded after user watches for 10 continuous seconds
  useEffect(() => {
    if (!activeVideo || !isPlaying) return;
    let secondsWatched = 0;
    let counted = false;

    const viewInterval = setInterval(() => {
      if (!isPlaying) return;
      secondsWatched += 1;
      if (secondsWatched >= 10 && !counted) {
        counted = true;
        const token = getAuthToken();
        fetch(`/api/videos/${activeVideo.id}/view`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {})
          }
        })
          .then((res) => res.json())
          .then((data) => {
            if (data.success && typeof data.views === 'number') {
              setActiveVideo((prev) => (prev ? { ...prev, views: data.views } : prev));
              setVideos((list) => list.map((v) => (v.id === activeVideo.id ? { ...v, views: data.views } : v)));
            }
          })
          .catch(() => {});
      }
    }, 1000);

    return () => clearInterval(viewInterval);
  }, [activeVideo?.id, isPlaying]);

  useEffect(() => {
    const detectConnection = () => {
      const nav = typeof navigator !== 'undefined' ? (navigator as any) : null;
      const conn = nav?.connection || nav?.mozConnection || nav?.webkitConnection;
      if (conn) {
        const type = conn.effectiveType; // 'slow-2g', '2g', '3g', '4g'
        const downlink = conn.downlink; // speed in Mbps
        if (type === 'slow-2g' || type === '2g' || (downlink && downlink < 1.0)) {
          setNetworkQuality('360p');
          setConnectionSpeedLabel(`Low Speed (${type || '<1 Mbps'}) • 360p`);
        } else if (type === '3g' || (downlink && downlink < 2.5)) {
          setNetworkQuality('480p');
          setConnectionSpeedLabel(`Medium Speed (${type || '1-3 Mbps'}) • 480p`);
        } else if (downlink && downlink >= 6.0) {
          setNetworkQuality('1080p');
          setConnectionSpeedLabel(`High Speed (${downlink} Mbps) • 1080p HD`);
        } else {
          setNetworkQuality('720p');
          setConnectionSpeedLabel(`Standard 4G • 720p HD`);
        }
      } else {
        setNetworkQuality('720p');
        setConnectionSpeedLabel('Standard • 720p HD');
      }
    };

    detectConnection();
    const nav = typeof navigator !== 'undefined' ? (navigator as any) : null;
    const conn = nav?.connection || nav?.mozConnection || nav?.webkitConnection;
    if (conn?.addEventListener) {
      conn.addEventListener('change', detectConnection);
      return () => conn.removeEventListener('change', detectConnection);
    }
  }, []);

  // Sync quality to active YouTube iframe if playing
  useEffect(() => {
    if (iframeRef.current?.contentWindow) {
      const vqMap: Record<string, string> = {
        '1080p': 'hd1080',
        '720p': 'hd720',
        '480p': 'large',
        '360p': 'medium'
      };
      const vq = vqMap[activeQuality] || 'hd720';
      iframeRef.current.contentWindow.postMessage(
        JSON.stringify({
          event: 'command',
          func: 'setPlaybackQuality',
          args: [vq]
        }),
        '*'
      );
    }
  }, [activeQuality, activeVideo]);

  // Cross-Platform Referral Tracking
  useEffect(() => {
    const refCode = searchParams.get('ref');
    if (refCode) {
      localStorage.setItem('benix_ref', refCode);
    }
  }, [searchParams]);

  // Load dynamic video ad timing settings
  useEffect(() => {
    fetch('/api/ads/settings')
      .then((res) => res.json())
      .then((data) => {
        if (data?.settings) {
          setVideoAdDelaySec(Number(data.settings.video_delay_sec) || 10);
          setVideoAdIntervalSec(Number(data.settings.video_interval_sec) || 300);
        }
      })
      .catch(() => {});
  }, []);

  // Video Ad Timers: 10s initial delay on play, then 5 minutes (300s) repeat interval
  useEffect(() => {
    if (videoAdInitialTimerRef.current) clearTimeout(videoAdInitialTimerRef.current);
    if (videoAdIntervalTimerRef.current) clearInterval(videoAdIntervalTimerRef.current);

    if (activeVideo && isPlaying && !showVideoAd) {
      if (!hasTriggeredInitialVideoAd) {
        // Initial 10 seconds ad after start of playback
        videoAdInitialTimerRef.current = setTimeout(() => {
          setShowVideoAd(true);
          setHasTriggeredInitialVideoAd(true);

          // Periodic 5 minutes ad
          videoAdIntervalTimerRef.current = setInterval(() => {
            setShowVideoAd(true);
          }, videoAdIntervalSec * 1000);
        }, videoAdDelaySec * 1000);
      } else {
        // Subsequent periodic ad
        videoAdIntervalTimerRef.current = setInterval(() => {
          setShowVideoAd(true);
        }, videoAdIntervalSec * 1000);
      }
    }

    return () => {
      if (videoAdInitialTimerRef.current) clearTimeout(videoAdInitialTimerRef.current);
      if (videoAdIntervalTimerRef.current) clearInterval(videoAdIntervalTimerRef.current);
    };
  }, [activeVideo?.id, isPlaying, hasTriggeredInitialVideoAd, videoAdDelaySec, videoAdIntervalSec]);

  // When switching videos, reset initial ad trigger state so next video gets its 10s ad
  useEffect(() => {
    setHasTriggeredInitialVideoAd(false);
    setShowVideoAd(false);
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' as ScrollBehavior });
    document.documentElement.scrollTop = 0;
  }, [activeVideo?.id]);

  // Pause video whenever ad loads
  useEffect(() => {
    if (showVideoAd) {
      if (videoRef.current && !videoRef.current.paused) {
        videoRef.current.pause();
      }
      if (iframeRef.current?.contentWindow) {
        iframeRef.current.contentWindow.postMessage('{"event":"command","func":"pauseVideo","args":""}', '*');
      }
      setIsPlaying(false);
    }
  }, [showVideoAd]);

  // Autoplay native HTML5 video smoothly whenever activeVideo changes
  useEffect(() => {
    if (activeVideo && !isYouTubeVideo(activeVideo)) {
      setVideoCurrentTime(0);
      setIsPreviewEnded(false);
      setIsPlaying(true);
      const timer = setTimeout(() => {
        if (videoRef.current) {
          const p = videoRef.current.play();
          if (p !== undefined) {
            p.catch(() => {
              // If unmuted autoplay is rejected by browser policy before user interaction, play muted so video plays automatically
              if (videoRef.current) {
                videoRef.current.muted = true;
                setIsMuted(true);
                videoRef.current.play().catch(() => {});
              }
            });
          }
        }
      }, 60);
      return () => clearTimeout(timer);
    }
  }, [activeVideo?.id]);

  // Load video catalogue from database
  useEffect(() => {
    axios
      .get('/api/modules/videos')
      .then((res) => {
        if (res.data?.videos && Array.isArray(res.data.videos) && res.data.videos.length > 0) {
          const mapped = res.data.videos.map((v: any) => {
            const isYT = v.id && /^[a-zA-Z0-9_-]{11}$/.test(v.id) && !v.id.startsWith('vid-');
            return {
              id: v.id,
              title: v.title,
              creator: v.channelName || v.creator || 'Verified Creator',
              channelName: v.channelName || v.creator || 'Verified Creator',
              channelAvatar: v.channelAvatar || '/logo.png',
              thumbnail: v.thumbnailUrl || v.thumbnail || (isYT ? `https://img.youtube.com/vi/${v.id}/hqdefault.jpg` : '/logo.png'),
              duration: v.durationLabel || (v.duration ? `${Math.floor(v.duration / 60)}:${v.duration % 60 < 10 ? '0' : ''}${v.duration % 60}` : '10:00'),
              views: v.views || 0,
              likes: v.likes || 0,
              category: v.category || 'General',
              price: v.price || 0,
              videoUrl: v.videoUrl || v.video_url || '',
              embedUrl: v.embedUrl || v.videoUrl || (isYT ? `https://www.youtube.com/embed/${v.id}` : '') || '',
              commission_pct: v.price > 0 ? 15 : 0,
              description: v.description || ''
            };
          });
          setVideos(mapped);
        }
      })
      .catch(() => {});
  }, []);

  // Auto-sync active video if specified in route (/videos/:id) or query (?v=)
  useEffect(() => {
    const targetId = routeVideoId || searchParams.get('v');
    if (targetId) {
      const found = videos.find((v) => v.id === targetId || v.id.toLowerCase() === targetId.toLowerCase());
      if (found) {
        setActiveVideo(found);
      } else {
        const fb = FALLBACK_VIDEOS.find((v) => v.id === targetId || v.id.toLowerCase() === targetId.toLowerCase());
        if (fb) {
          setActiveVideo(fb);
        } else if (/^[a-zA-Z0-9_-]{11}$/.test(targetId)) {
          setActiveVideo({
            id: targetId,
            title: 'YouTube Video Broadcast',
            creator: 'Benix Space Channel',
            channelName: 'Benix Space Channel',
            channelAvatar: '/logo.png',
            thumbnail: `https://img.youtube.com/vi/${targetId}/hqdefault.jpg`,
            duration: '10:00',
            views: 0,
            likes: 0,
            category: 'General',
            price: 0,
            embedUrl: `https://www.youtube.com/embed/${targetId}`
          });
        }
      }
    } else {
      setActiveVideo(null);
    }
  }, [routeVideoId, searchParams, videos]);

  // Increment view count after watching for >3 seconds (avoid bounce views)
  useEffect(() => {
    if (!activeVideo) return;
    const timer = setTimeout(() => {
      axios.post(`/api/modules/videos/${activeVideo.id}/view`, { videoId: activeVideo.id }).catch(() => {});
      setVideos((prev) => prev.map((v) => (v.id === activeVideo.id ? { ...v, views: (v.views || 0) + 1 } : v)));
      setActiveVideo((prev) => (prev && prev.id === activeVideo.id ? { ...prev, views: (prev.views || 0) + 1 } : prev));
      recordWatchInteraction(activeVideo.id, activeVideo.category, activeVideo.creator);
    }, 3000);
    return () => clearTimeout(timer);
  }, [activeVideo?.id]);

  // Periodically track video watch time in real time and calculate creator hours
  useEffect(() => {
    if (!activeVideo || !isPlaying || showVideoAd) return;

    const interval = setInterval(() => {
      const creatorId = (activeVideo as any).userId || (activeVideo as any).user_id || activeVideo.channelName || activeVideo.creator;
      axios
        .post('/api/modules/videos/watch-heartbeat', {
          videoId: activeVideo.id,
          creatorId,
          durationSeconds: 10,
          viewerId: user?.id || null
        })
        .catch(() => {
          axios.post('/api/videos/track-watch', {
            videoId: activeVideo.id,
            creatorId,
            durationSeconds: 10,
            viewerId: user?.id || null
          }).catch(() => {});
        });
    }, 10000);

    return () => clearInterval(interval);
  }, [activeVideo?.id, isPlaying, showVideoAd, user]);

  const isVideoUnlocked = (vid: VideoItem): boolean => {
    if (vid.price <= 0) return true;
    if (unlockedVideoIds.includes(vid.id)) return true;
    if (user?.role === 'superadmin' || user?.role === 'admin') return true;
    return false;
  };

  const handleSelectVideo = (video: VideoItem) => {
    setActiveVideo(video);
    setIsPlaying(true);
    navigate(`/videos/${video.id}`);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Sync user's liked videos from database
  useEffect(() => {
    const token = getAuthToken();
    if (token) {
      axios
        .get('/api/modules/videos-liked-ids', { headers: { Authorization: `Bearer ${token}` } })
        .then((res) => {
          if (res.data?.likedVideoIds && Array.isArray(res.data.likedVideoIds)) {
            const merged = Array.from(new Set([...likedVideoIds, ...res.data.likedVideoIds]));
            setLikedVideoIds(merged);
            localStorage.setItem('benix_liked_videos', JSON.stringify(merged));
          }
        })
        .catch(() => {});
    }
  }, [user]);

  // Persistent Video Like Toggle
  const handleToggleLike = async (vid: VideoItem) => {
    if (!user) {
      setShowWizardModal(true);
      return;
    }

    const token = getAuthToken();
    try {
      const res = await axios.post(`/api/modules/videos/${vid.id}/like`, {}, {
        headers: token ? { Authorization: `Bearer ${token}` } : undefined
      });
      const serverLiked = res.data?.isLiked;
      const serverLikes = res.data?.likes;

      const updated = serverLiked
        ? Array.from(new Set([...likedVideoIds, vid.id]))
        : likedVideoIds.filter((id) => id !== vid.id);

      setLikedVideoIds(updated);
      localStorage.setItem('benix_liked_videos', JSON.stringify(updated));

      setVideos((prev) =>
        prev.map((v) => (v.id === vid.id ? { ...v, likes: serverLikes !== undefined ? serverLikes : (serverLiked ? v.likes + 1 : Math.max(0, v.likes - 1)) } : v))
      );

      if (activeVideo && activeVideo.id === vid.id) {
        setActiveVideo((prev) => (prev ? { ...prev, likes: serverLikes !== undefined ? serverLikes : (serverLiked ? prev.likes + 1 : Math.max(0, prev.likes - 1)) } : prev));
      }
    } catch {
      // Local optimistic fallback
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
    }
  };

  const triggerCenterFeedback = (type: 'play' | 'pause') => {
    setCenterFeedback(type);
    if (feedbackTimerRef.current) clearTimeout(feedbackTimerRef.current);
    feedbackTimerRef.current = setTimeout(() => {
      setCenterFeedback(null);
    }, 600);
  };

  const togglePlayPause = () => {
    if (!activeVideo || (!isVideoUnlocked(activeVideo) && isPreviewEnded)) return;
    const nextPlaying = !isPlaying;
    setIsPlaying(nextPlaying);
    triggerCenterFeedback(nextPlaying ? 'play' : 'pause');

    if (isYouTubeVideo(activeVideo)) {
      if (iframeRef.current?.contentWindow) {
        iframeRef.current.contentWindow.postMessage(
          JSON.stringify({
            event: 'command',
            func: nextPlaying ? 'playVideo' : 'pauseVideo',
            args: ''
          }),
          '*'
        );
      }
    } else if (videoRef.current) {
      if (nextPlaying) {
        videoRef.current.play().catch(() => {});
      } else {
        videoRef.current.pause();
      }
    }
  };

  const toggleMute = () => {
    const nextMuted = !isMuted;
    setIsMuted(nextMuted);

    if (isYouTubeVideo(activeVideo)) {
      if (iframeRef.current?.contentWindow) {
        iframeRef.current.contentWindow.postMessage(
          JSON.stringify({
            event: 'command',
            func: nextMuted ? 'mute' : 'unMute',
            args: ''
          }),
          '*'
        );
      }
    } else if (videoRef.current) {
      videoRef.current.muted = nextMuted;
    }
  };

  const playNextVideo = () => {
    if (!activeVideo || filteredVideos.length === 0) return;
    const currentIdx = filteredVideos.findIndex(v => v.id === activeVideo.id);
    const nextIdx = (currentIdx + 1) % filteredVideos.length;
    handleSelectVideo(filteredVideos[nextIdx]);
  };

  const playPreviousVideo = () => {
    if (!activeVideo || filteredVideos.length === 0) return;
    const currentIdx = filteredVideos.findIndex(v => v.id === activeVideo.id);
    const prevIdx = (currentIdx - 1 + filteredVideos.length) % filteredVideos.length;
    handleSelectVideo(filteredVideos[prevIdx]);
  };

  const handleVideoEnded = useCallback(() => {
    if (autoplayEnabled) {
      if (!activeVideo || filteredVideos.length === 0) return;
      const currentIdx = filteredVideos.findIndex(v => v.id === activeVideo.id);
      const nextIdx = (currentIdx + 1) % filteredVideos.length;
      handleSelectVideo(filteredVideos[nextIdx]);
    } else {
      setIsPlaying(false);
    }
  }, [autoplayEnabled, activeVideo, filteredVideos]);

  // Listen for YouTube iframe events (duration, current time, ended state)
  useEffect(() => {
    const handleWindowMessage = (event: MessageEvent) => {
      try {
        const data = typeof event.data === 'string' ? JSON.parse(event.data) : event.data;
        if (data?.event === 'infoDelivery' && data?.info) {
          if (typeof data.info.duration === 'number' && data.info.duration > 0) {
            setVideoDuration(data.info.duration);
          }
          if (typeof data.info.currentTime === 'number') {
            setVideoCurrentTime(data.info.currentTime);
          }
          if (data.info.playerState === 0) {
            // Player state 0 = YT.PlayerState.ENDED
            handleVideoEnded();
          } else if (data.info.playerState === 1) {
            setIsPlaying(true);
          } else if (data.info.playerState === 2) {
            setIsPlaying(false);
          }
        }
      } catch {}
    };

    window.addEventListener('message', handleWindowMessage);
    return () => window.removeEventListener('message', handleWindowMessage);
  }, [activeVideo?.id, handleVideoEnded]);

  const toggleFullscreen = async () => {
    const container = playerContainerRef.current;
    if (!container) return;

    if (!document.fullscreenElement) {
      try {
        if (container.requestFullscreen) {
          await container.requestFullscreen();
        } else if ((container as any).webkitRequestFullscreen) {
          await (container as any).webkitRequestFullscreen();
        }
        setIsFullscreen(true);
        // Force Landscape screen orientation
        if (screen.orientation && 'lock' in screen.orientation) {
          await (screen.orientation as any).lock('landscape').catch(() => {});
        }
      } catch (err) {}
    } else {
      try {
        if (document.exitFullscreen) {
          await document.exitFullscreen();
        } else if ((document as any).webkitExitFullscreen) {
          await (document as any).webkitExitFullscreen();
        }
        setIsFullscreen(false);
        if (screen.orientation && 'unlock' in screen.orientation) {
          screen.orientation.unlock();
        }
      } catch (err) {}
    }
  };

  // Fullscreen event listener
  useEffect(() => {
    const onFsChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
      if (!document.fullscreenElement && screen.orientation && 'unlock' in screen.orientation) {
        try { screen.orientation.unlock(); } catch {}
      }
    };
    document.addEventListener('fullscreenchange', onFsChange);
    document.addEventListener('webkitfullscreenchange', onFsChange);
    return () => {
      document.removeEventListener('fullscreenchange', onFsChange);
      document.removeEventListener('webkitfullscreenchange', onFsChange);
    };
  }, []);

  // Keyboard Shortcuts: Space (Play/Pause), N (Next), P (Prev), M (Mute), F (Fullscreen)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable)) {
        return;
      }

      if (e.code === 'Space' || e.key === ' ' || e.key.toLowerCase() === 'k') {
        e.preventDefault();
        togglePlayPause();
      } else if (e.key.toLowerCase() === 'n') {
        e.preventDefault();
        playNextVideo();
      } else if (e.key.toLowerCase() === 'p') {
        e.preventDefault();
        playPreviousVideo();
      } else if (e.key.toLowerCase() === 'm') {
        e.preventDefault();
        toggleMute();
      } else if (e.key.toLowerCase() === 'f') {
        e.preventDefault();
        toggleFullscreen();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isPlaying, isMuted, isFullscreen, activeVideo, filteredVideos]);

  const isOwnerOfActiveVideo = Boolean(
    user && activeVideo && (
      (activeVideo.userId && String(user.id) === String(activeVideo.userId)) ||
      (user.channel_name && activeVideo.channelName && user.channel_name.toLowerCase() === activeVideo.channelName.toLowerCase()) ||
      (user.name && activeVideo.creator && user.name.toLowerCase() === activeVideo.creator.toLowerCase())
    )
  );

  const handleToggleSubscribe = async (channelName: string) => {
    if (!user) {
      setShowWizardModal(true);
      return;
    }
    if (isOwnerOfActiveVideo) {
      return;
    }
    const isSub = subscribedChannels.includes(channelName);
    const updated = isSub ? subscribedChannels.filter((c) => c !== channelName) : [...subscribedChannels, channelName];
    setSubscribedChannels(updated);
    localStorage.setItem('benix_subscribed_channels', JSON.stringify(updated));

    // Call backend API so subscription is recorded in PostgreSQL creator_subscribers
    try {
      const creatorTarget = activeVideo?.userId || channelName;
      const endpoint = isSub
        ? `/api/creators/${encodeURIComponent(creatorTarget)}/unsubscribe`
        : `/api/creators/${encodeURIComponent(creatorTarget)}/subscribe`;
      const token = getAuthToken();
      await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        }
      });
    } catch (e) {
      console.warn('Subscription sync error:', e);
    }
  };

  const handleCloseVideoAd = useCallback(() => {
    setShowVideoAd(false);
    // Continue playing video after the ad has ended
    if (activeVideo && !isPreviewEnded) {
      if (isYouTubeVideo(activeVideo)) {
        if (iframeRef.current?.contentWindow) {
          iframeRef.current.contentWindow.postMessage('{"event":"command","func":"playVideo","args":""}', '*');
        }
      } else if (videoRef.current) {
        videoRef.current.play().catch(() => {});
      }
      setIsPlaying(true);
    }
  }, [activeVideo, isPreviewEnded]);

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



  const getAffiliateShareLink = (vid: VideoItem): string => {
    const origin = typeof window !== 'undefined' ? window.location.origin : 'https://benix.space';
    const myRef = user?.referral_code || 'BENIX-PREMIUM';
    return `${origin}/videos/${vid.id}?ref=${encodeURIComponent(myRef)}`;
  };

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
            <Link
              to="/studio"
              className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white font-extrabold text-xs flex items-center gap-1.5 shadow-md shadow-red-600/30 transition-all"
            >
              <Film className="w-3.5 h-3.5" />
              <span>Creator Studio</span>
            </Link>

            <button
              onClick={() => {
                if (!user) setShowWizardModal(true);
                else setShowCreateMediaModal(true);
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
              
              {/* 16:9 Cinema Player Screen (YouTube-like larger mobile view) */}
              <div
                ref={playerContainerRef}
                onMouseMove={handleMouseMovePlayer}
                onMouseEnter={() => setIsControlsVisible(true)}
                onClick={handlePlayerTap}
                className={`relative aspect-video w-full -mx-4 sm:mx-0 rounded-none sm:rounded-3xl bg-black border-y sm:border border-slate-800 overflow-hidden shadow-2xl select-none min-h-[220px] sm:min-h-[380px] lg:min-h-[440px] ${
                  !isControlsVisible && isPlaying ? 'cursor-none' : 'cursor-default'
                }`}
              >
                {/* Media Screen (YouTube / Direct Video Stream via /api/media/stream) */}
                {isYouTubeVideo(activeVideo) ? (
                  <iframe
                    ref={iframeRef}
                    src={getSafeYouTubeEmbedUrl(activeVideo, activeQuality)}
                    title={activeVideo.title}
                    className="w-full h-full border-0 relative z-10 pointer-events-auto"
                    allow="accelerometer; autoplay *; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                    allowFullScreen
                  />
                ) : (
                  <video
                    ref={videoRef}
                    key={activeVideo.id}
                    src={getSafeVideoSrc(activeVideo)}
                    controls={false}
                    autoPlay
                    playsInline
                    preload={activeQuality === '360p' || activeQuality === '480p' ? 'metadata' : 'auto'}
                    className="w-full h-full object-contain bg-black relative z-10 cursor-pointer"
                    poster={activeVideo.thumbnail}
                    onClick={togglePlayPause}
                    onLoadedMetadata={(e) => setVideoDuration(e.currentTarget.duration || 0)}
                    onDurationChange={(e) => setVideoDuration(e.currentTarget.duration || 0)}
                    onPlay={() => setIsPlaying(true)}
                    onPause={() => setIsPlaying(false)}
                    onEnded={handleVideoEnded}
                    onTimeUpdate={(e) => {
                      const cur = e.currentTarget.currentTime;
                      setVideoCurrentTime(cur);
                      const limitSec = Math.max(12, Math.floor((parseSeconds(activeVideo.duration) || 300) * 0.20));
                      if (!isVideoUnlocked(activeVideo) && cur >= limitSec) {
                        e.currentTarget.pause();
                        e.currentTarget.currentTime = limitSec;
                        setIsPreviewEnded(true);
                      }
                    }}
                  />
                )}

                {/* 20% Free Preview Remaining Banner (before unlock) */}
                {!isVideoUnlocked(activeVideo) && !isPreviewEnded && (
                  <div className="absolute top-3 left-3 z-30 pointer-events-none px-3 py-1 rounded-full bg-black/85 border border-amber-400/40 text-[11px] font-bold text-amber-300 flex items-center gap-1.5 backdrop-blur-md shadow-lg">
                    <Lock className="w-3.5 h-3.5 text-amber-400" />
                    <span>20% Free Preview ({Math.max(0, Math.max(12, Math.floor((parseSeconds(activeVideo.duration) || 300) * 0.20)) - Math.floor(videoCurrentTime))}s left)</span>
                  </div>
                )}

                {/* 20% Preview Ended - Unlock Screen */}
                {!isVideoUnlocked(activeVideo) && isPreviewEnded && (
                  <div className="absolute inset-0 z-40 flex flex-col items-center justify-center p-6 text-center bg-black/90 backdrop-blur-md animate-fadeIn">
                    <div className="w-16 h-16 rounded-2xl bg-amber-500/20 border border-amber-500/40 text-amber-400 flex items-center justify-center shadow-2xl mb-3">
                      <Lock className="w-8 h-8" />
                    </div>
                    <span className="text-[11px] font-extrabold uppercase tracking-wider text-amber-400 bg-amber-500/10 border border-amber-500/30 px-3 py-1 rounded-full mb-2">
                      20% Free Preview Finished ({Math.max(12, Math.floor((parseSeconds(activeVideo.duration) || 300) * 0.20))}s)
                    </span>
                    <h3 className="text-xl sm:text-2xl font-black text-white">Unlock Full Video to Continue</h3>
                    <p className="text-xs text-slate-300 mt-2 max-w-md">
                      Unlock full access to "{activeVideo.title}". Creator {activeVideo.channelName || 'channel'} receives direct revenue split on your purchase.
                    </p>
                    <button
                      onClick={() => handleUnlockVideo(activeVideo)}
                      disabled={unlockingId === activeVideo.id}
                      className="mt-5 px-6 py-3 rounded-2xl bg-gradient-to-r from-amber-500 via-amber-400 to-amber-600 text-slate-950 font-black text-sm shadow-xl shadow-amber-500/30 hover:from-amber-400 hover:to-amber-500 transition scale-100 hover:scale-105 flex items-center gap-2 cursor-pointer"
                    >
                      <Unlock className="w-4 h-4 inline-block mr-1" />
                      <span>{unlockingId === activeVideo.id ? 'Unlocking...' : `Unlock Video for ${activeVideo.price.toLocaleString()} RWF`}</span>
                    </button>
                  </div>
                )}

                {/* In-Stream Real Google AdSense & Submitted Ad Overlay (2:1 Rotation) */}
                {showVideoAd && (
                  <UniversalMediaAdOverlay
                    isOpen={showVideoAd}
                    onClose={handleCloseVideoAd}
                    mediaType="video"
                    title={activeVideo.title}
                    creatorId={(activeVideo as any).userId || (activeVideo as any).user_id || activeVideo.channelName || activeVideo.creator}
                    videoId={activeVideo.id}
                    slot={ADS_CONFIG.SLOTS.VIDEO_WATCH_BANNER}
                    countdownDuration={10}
                  />
                )}

                {/* Middle Ripple Icon Feedback (Play / Pause) */}
                {centerFeedback && (
                  <div className="absolute inset-0 z-30 pointer-events-none flex items-center justify-center">
                    <div className="p-5 rounded-full bg-black/80 backdrop-blur-md text-white border border-white/20 shadow-2xl animate-in zoom-in duration-200">
                      {centerFeedback === 'play' ? (
                        <Play className="w-12 h-12 fill-current ml-1 text-purple-400" />
                      ) : (
                        <Pause className="w-12 h-12 fill-current text-purple-400" />
                      )}
                    </div>
                  </div>
                )}

                {/* Fullscreen Floating Exit Button */}
                {isFullscreen && (
                  <div className="absolute top-4 right-4 z-40 flex items-center gap-3">
                    <button
                      onClick={toggleFullscreen}
                      className="px-4 py-2.5 rounded-2xl bg-black/85 hover:bg-black text-white font-extrabold text-xs border border-white/30 flex items-center gap-2 shadow-2xl backdrop-blur-md transition-all active:scale-95"
                    >
                      <Minimize className="w-4 h-4 text-purple-400" />
                      <span>Exit Fullscreen</span>
                    </button>
                  </div>
                )}

                {/* On-Screen Bottom Custom Control Strip */}
                <div
                  className={`absolute bottom-0 inset-x-0 z-30 p-3 sm:p-4 bg-gradient-to-t from-black/95 via-black/75 to-transparent flex flex-col gap-2.5 transition-opacity duration-300 ${
                    !isPlaying || isControlsVisible
                      ? 'opacity-100 pointer-events-auto'
                      : 'opacity-0 pointer-events-none'
                  }`}
                  onClick={(e) => e.stopPropagation()}
                >
                  {/* Custom Seek Scrubber Bar */}
                  <div
                    onClick={handleSeek}
                    className="w-full h-1.5 hover:h-2.5 bg-white/20 hover:bg-white/30 rounded-full cursor-pointer relative transition-all group/bar"
                  >
                    {/* 20% Preview Marker for Premium Videos */}
                    {!isVideoUnlocked(activeVideo) && (
                      <div
                        className="absolute top-0 bottom-0 w-0.5 bg-amber-400 z-10"
                        style={{
                          left: `${Math.min(100, (Math.max(12, Math.floor((parseSeconds(activeVideo.duration) || 300) * 0.20)) / (videoDuration || parseSeconds(activeVideo.duration) || 300)) * 100)}%`
                        }}
                        title="20% Free Preview End"
                      />
                    )}
                    {/* Active Progress Fill */}
                    <div
                      className="h-full bg-gradient-to-r from-purple-500 via-indigo-500 to-pink-500 rounded-full relative"
                      style={{
                        width: `${(videoDuration || parseSeconds(activeVideo.duration)) ? Math.min(100, (videoCurrentTime / (videoDuration || parseSeconds(activeVideo.duration) || 1)) * 100) : 0}%`
                      }}
                    >
                      <div className="absolute right-0 top-1/2 -translate-y-1/2 w-3.5 h-3.5 bg-white rounded-full shadow-lg opacity-0 group-hover/bar:opacity-100 transition-opacity" />
                    </div>
                  </div>

                  {/* Player Buttons Row */}
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 sm:gap-3">
                      <button
                        onClick={togglePlayPause}
                        className="p-2 sm:p-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white shadow-lg transition-transform hover:scale-105 active:scale-95"
                        title={isPlaying ? 'Pause (Space)' : 'Play (Space)'}
                      >
                        {isPlaying ? <Pause className="w-4 h-4 fill-current" /> : <Play className="w-4 h-4 fill-current ml-0.5" />}
                      </button>

                      <button
                        onClick={playPreviousVideo}
                        className="p-2 rounded-xl bg-slate-900/80 hover:bg-slate-800 text-slate-300 hover:text-white transition-colors"
                        title="Previous Video (P)"
                      >
                        <SkipBack className="w-4 h-4" />
                      </button>

                      <button
                        onClick={playNextVideo}
                        className="p-2 rounded-xl bg-slate-900/80 hover:bg-slate-800 text-slate-300 hover:text-white transition-colors"
                        title="Next Video (N)"
                      >
                        <SkipForward className="w-4 h-4" />
                      </button>

                      {/* Autoplay Toggle Button */}
                      <button
                        onClick={toggleAutoplay}
                        className={`px-2.5 py-1.5 rounded-xl border text-[11px] font-bold transition flex items-center gap-1.5 ${
                          autoplayEnabled
                            ? 'bg-purple-600/30 text-purple-300 border-purple-500/50'
                            : 'bg-slate-900/80 text-slate-400 border-slate-700/80 hover:text-slate-200'
                        }`}
                        title={autoplayEnabled ? 'Autoplay is ON: Next video plays automatically' : 'Autoplay is OFF'}
                      >
                        <span className="hidden sm:inline">Autoplay</span>
                        <span className={`w-2 h-2 rounded-full ${autoplayEnabled ? 'bg-purple-400 animate-pulse' : 'bg-slate-500'}`} />
                      </button>

                      <button
                        onClick={toggleMute}
                        className="p-2 rounded-xl bg-slate-900/80 hover:bg-slate-800 text-slate-300 hover:text-white transition-colors"
                        title={isMuted ? 'Unmute (M)' : 'Mute (M)'}
                      >
                        {isMuted ? <VolumeX className="w-4 h-4 text-red-400" /> : <Volume2 className="w-4 h-4" />}
                      </button>

                      {/* Video Timestamp Display */}
                      <span className="text-[11px] text-slate-300 font-mono font-bold pl-1 select-none">
                        {formatTimestamp(videoCurrentTime)} / {formatTimestamp(videoDuration || parseSeconds(activeVideo.duration) || 0)}
                      </span>

                      <span className="hidden lg:inline-block text-[11px] text-slate-500 font-mono pl-2">
                        Space: Pause • N: Next • P: Prev • M: Mute • F: Fullscreen
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      {/* Adaptive Stream Quality Dropdown */}
                      <div className="relative">
                        <button
                          onClick={() => setShowQualityMenu((prev) => !prev)}
                          className="px-2.5 py-1.5 rounded-xl bg-slate-900/90 hover:bg-slate-800 text-slate-200 border border-slate-700/60 shadow-lg transition flex items-center gap-1.5 text-xs font-semibold backdrop-blur-md"
                          title="Video Stream Quality (Adaptive)"
                        >
                          <Wifi className="w-3.5 h-3.5 text-purple-400" />
                          <span className="font-mono text-[11px]">
                            {qualityMode === 'auto' ? `Auto (${activeQuality})` : activeQuality}
                          </span>
                        </button>

                        {showQualityMenu && (
                          <div className="absolute bottom-11 right-0 z-50 w-56 bg-slate-950/95 border border-slate-700 backdrop-blur-xl rounded-2xl shadow-2xl p-2 space-y-1 text-xs">
                            <div className="px-2.5 py-1.5 text-[11px] font-bold text-slate-400 border-b border-slate-800 flex items-center justify-between">
                              <span>Adaptive Quality</span>
                              <span className="text-[10px] text-purple-400 font-mono truncate max-w-[110px]" title={connectionSpeedLabel}>
                                {connectionSpeedLabel}
                              </span>
                            </div>
                            {[
                              { id: 'auto', label: `Auto (Adaptive - ${networkQuality})` },
                              { id: '1080p', label: '1080p Full HD' },
                              { id: '720p', label: '720p HD' },
                              { id: '480p', label: '480p Medium (Data Saver)' },
                              { id: '360p', label: '360p Low (Ultra Saver)' }
                            ].map((opt) => (
                              <button
                                key={opt.id}
                                onClick={() => {
                                  setQualityMode(opt.id as any);
                                  setShowQualityMenu(false);
                                }}
                                className={`w-full text-left px-3 py-1.5 rounded-xl flex items-center justify-between transition ${
                                  qualityMode === opt.id
                                    ? 'bg-purple-600/30 text-purple-300 font-bold'
                                    : 'hover:bg-slate-800/80 text-slate-300'
                                }`}
                              >
                                <span>{opt.label}</span>
                                {qualityMode === opt.id && <Check className="w-3.5 h-3.5 text-purple-400" />}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>

                      <button
                        onClick={toggleFullscreen}
                        className="p-2 rounded-xl bg-slate-900/80 hover:bg-slate-800 text-slate-300 hover:text-white transition-colors"
                        title="Toggle Landscape Fullscreen (F)"
                      >
                        {isFullscreen ? <Minimize className="w-4 h-4" /> : <Maximize className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                </div>
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
                    src={(isOwnerOfActiveVideo && (user?.avatar_url || localStorage.getItem('benix_avatar'))) || activeVideo.channelAvatar || '/logo.png'}
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

                  {isOwnerOfActiveVideo ? (
                    <Link
                      to="/creator/studio"
                      className="ml-3 px-3.5 py-1.5 rounded-full text-[11px] font-black bg-purple-600/20 hover:bg-purple-600/30 text-purple-300 border border-purple-500/30 transition-all flex items-center gap-1"
                    >
                      <span>Your Channel</span>
                    </Link>
                  ) : (
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
                  )}
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
                items={rankedVideos.filter((v) => v.id !== activeVideo.id).map((v) => ({
                  id: v.id,
                  title: v.title,
                  name: v.title,
                  thumbnail: v.thumbnail,
                  category: v.category,
                  creator: v.channelName || v.creator,
                  channelName: v.channelName || v.creator,
                  duration: v.duration,
                  views: v.views,
                  price: v.price
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
                          src={video.thumbnail || `https://img.youtube.com/vi/${video.id}/hqdefault.jpg`}
                          alt={video.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          loading="lazy"
                          onError={(e) => {
                            (e.currentTarget as HTMLImageElement).src = `https://img.youtube.com/vi/${video.id}/hqdefault.jpg`;
                          }}
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

      {/* Unified Creator Upload Modal (Background upload with chunked compression) */}
      {showCreateMediaModal && (
        <CreateMediaModal
          isOpen={showCreateMediaModal}
          initialTab="video"
          onClose={() => setShowCreateMediaModal(false)}
          onSuccess={() => {
            setShowCreateMediaModal(false);
            // Refresh video list
            axios
              .get('/api/modules/videos')
              .then((res) => {
                if (res.data?.videos && Array.isArray(res.data.videos)) {
                  setVideos(res.data.videos);
                }
              })
              .catch(() => {});
          }}
        />
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
