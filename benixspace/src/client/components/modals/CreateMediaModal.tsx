import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useUpload } from '../../context/UploadContext';
import {
  X,
  Plus,
  Video,
  Camera,
  Upload,
  DollarSign,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  Search,
  Zap,
  Megaphone
} from 'lucide-react';
import { SubmitAdModal } from './SubmitAdModal';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

/**
 * Client-side Canvas Image Compression
 * Scales image to maximum 1080px and applies 0.75 JPEG compression
 * Drastically reduces memory usage, upload payload, and fits cleanly into PostgreSQL
 */
const compressImage = (file: File, maxDimension = 1080, quality = 0.75): Promise<string> => {
  return new Promise((resolve) => {
    if (!file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (e) => resolve(e.target?.result as string);
      reader.onerror = () => resolve('');
      reader.readAsDataURL(file);
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        let width = img.width;
        let height = img.height;
        if (width > maxDimension || height > maxDimension) {
          if (width > height) {
            height = Math.round((height * maxDimension) / width);
            width = maxDimension;
          } else {
            width = Math.round((width * maxDimension) / height);
            height = maxDimension;
          }
        }
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(e.target?.result as string);
          return;
        }
        ctx.drawImage(img, 0, 0, width, height);
        const compressedBase64 = canvas.toDataURL('image/jpeg', quality);
        resolve(compressedBase64);
      };
      img.onerror = () => resolve(e.target?.result as string);
      img.src = e.target?.result as string;
    };
    reader.onerror = () => resolve('');
    reader.readAsDataURL(file);
  });
};

export const CreateMediaModal: React.FC<Props> = ({ isOpen, onClose, onSuccess }) => {
  const { user, token, updateProfile } = useAuth();
  const { startUpload } = useUpload();
  const [loading] = useState(false);
  const [statusMsg, setStatusMsg] = useState<{ text: string; error?: boolean } | null>(null);

  // Video Form State
  const [channelNameInput, setChannelNameInput] = useState(user?.channel_name || user?.name || '');
  const [videoTitle, setVideoTitle] = useState('');
  const [videoDesc, setVideoDesc] = useState('');
  const [videoUrl, setVideoUrl] = useState('');
  const [videoCategory, setVideoCategory] = useState('Entertainment & Movies');
  const [isPaidVideo, setIsPaidVideo] = useState(false);
  const [videoPrice, setVideoPrice] = useState('500');
  const [videoThumbnailUrl, setVideoThumbnailUrl] = useState('');
  const [isFetchingYouTube, setIsFetchingYouTube] = useState(false);
  const [isVideoPortrait, setIsVideoPortrait] = useState(false);
  const [detectedVideoDuration] = useState(60);

  // Video Boost state (target views + budget, 1 view = 8 RWF)
  const [showSubmitAd, setShowSubmitAd] = useState(false);
  const [isBoostEnabled, setIsBoostEnabled] = useState(false);
  const [boostTargetViews, setBoostTargetViews] = useState('100');
  const [boostBudget, setBoostBudget] = useState('800');
  const BOOST_COST_PER_VIEW = 8;
  const estimatedBoostViews = isBoostEnabled
    ? Math.floor((parseFloat(boostBudget) || 0) / BOOST_COST_PER_VIEW)
    : 0;

  // Creator Monetization Criteria (defaults to 0 until loaded live from database)
  const [monetization, setMonetization] = useState<{
    requiredWatchHours: number;
    currentWatchHours: number;
    requiredSubscribers: number;
    currentSubscribers: number;
  }>({
    requiredWatchHours: 300,
    currentWatchHours: 0,
    requiredSubscribers: 30,
    currentSubscribers: 0
  });

  useEffect(() => {
    if (isOpen && token) {
      fetch('/api/creator/monetization-status', {
        headers: { Authorization: `Bearer ${token}` }
      })
        .then((res) => res.json())
        .then((data) => {
          if (data.requiredWatchHours) setMonetization(data);
        })
        .catch(() => {});
    }
  }, [isOpen, token]);

  if (!isOpen) return null;

  // Extract 11-Character YouTube Video ID (Standard, Shortened, and Shorts)
  const extractYouTubeId = (rawUrl: string): string | null => {
    if (!rawUrl) return null;
    const trimmed = rawUrl.trim();
    if (/^[a-zA-Z0-9_-]{11}$/.test(trimmed)) return trimmed;
    const match = trimmed.match(
      /(?:youtu\.be\/|youtube\.com\/(?:watch\?(?:.*&)?v=|embed\/|shorts\/|v\/|e\/)|youtube-nocookie\.com\/embed\/)([a-zA-Z0-9_-]{11})/i
    );
    return match ? match[1] : null;
  };

  // Fetch YouTube Metadata (Title, Author, Thumbnail) automatically via oEmbed
  const fetchYouTubeInfo = async (rawUrl: string) => {
    const trimmed = rawUrl.trim();
    if (!trimmed) return;

    const vidId = extractYouTubeId(trimmed);
    if (vidId) {
      setVideoThumbnailUrl(`https://img.youtube.com/vi/${vidId}/hqdefault.jpg`);
      if (trimmed.includes('/shorts/')) {
        setIsVideoPortrait(true);
        setVideoCategory('Trending Shorts');
      }
    }

    setIsFetchingYouTube(true);
    setStatusMsg({ text: 'Fetching YouTube title, description and thumbnail...' });

    try {
      const canonicalUrl = vidId ? `https://www.youtube.com/watch?v=${vidId}` : trimmed;
      let fetchedTitle = '';
      let fetchedAuthor = '';
      let fetchedThumb = vidId ? `https://img.youtube.com/vi/${vidId}/hqdefault.jpg` : '';

      // 1. Try official YouTube oEmbed API
      try {
        const ytRes = await fetch(`https://www.youtube.com/oembed?url=${encodeURIComponent(canonicalUrl)}&format=json`);
        if (ytRes.ok) {
          const ytData = await ytRes.json();
          fetchedTitle = ytData.title || '';
          fetchedAuthor = ytData.author_name || '';
          if (ytData.thumbnail_url) fetchedThumb = ytData.thumbnail_url;
        }
      } catch {}

      // 2. Fallback to noembed if title not obtained
      if (!fetchedTitle) {
        try {
          const noembedRes = await fetch(`https://noembed.com/embed?url=${encodeURIComponent(canonicalUrl)}`);
          if (noembedRes.ok) {
            const noembedData = await noembedRes.json();
            fetchedTitle = noembedData.title || '';
            fetchedAuthor = noembedData.author_name || '';
            if (noembedData.thumbnail_url) fetchedThumb = noembedData.thumbnail_url;
          }
        } catch {}
      }

      if (fetchedTitle) {
        setVideoTitle(fetchedTitle);
      }
      if (fetchedAuthor) {
        setVideoDesc(`Video by ${fetchedAuthor} — broadcasted on Benix.Space.`);
      }
      if (fetchedThumb) {
        setVideoThumbnailUrl(fetchedThumb);
      }

      if (fetchedTitle || vidId) {
        setStatusMsg({ text: '✨ Details loaded! You can freely edit the title and description below.' });
      } else {
        setStatusMsg({ text: 'Please enter a title for this video.' });
      }
    } catch {
      if (vidId) {
        setStatusMsg({ text: 'YouTube link detected. Please enter a title.' });
      }
    } finally {
      setIsFetchingYouTube(false);
    }
  };

  // Handle custom user-uploaded video thumbnail
  const handleCustomThumbnailChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const compressed = await compressImage(file, 1280, 0.82);
      if (compressed) {
        setVideoThumbnailUrl(compressed);
        setStatusMsg({ text: `✓ Custom thumbnail selected: "${file.name}"` });
      }
    } catch (err) {
      console.warn('Thumbnail upload error:', err);
    }
  };

  // Handle Video Broadcast submission (YouTube-Only System)
  const handleUploadVideo = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatusMsg(null);

    if (!channelNameInput.trim()) {
      setStatusMsg({ text: 'Please set your Creator Channel Name first before publishing videos.', error: true });
      return;
    }

    const ytId = extractYouTubeId(videoUrl);
    if (!ytId) {
      setStatusMsg({ text: 'Please enter a valid YouTube video URL or Shorts link (e.g. https://youtu.be/... or https://youtube.com/watch?v=...)', error: true });
      return;
    }

    if (!videoTitle.trim()) {
      setStatusMsg({ text: 'Video Title is required.', error: true });
      return;
    }

    // Capture parameters for background upload
    const titleToUpload = videoTitle.trim();
    const descToUpload = videoDesc.trim();
    const categoryToUpload = videoCategory;
    const priceToUpload = isPaidVideo ? parseFloat(videoPrice) || 0 : 0;
    const channelNameToUpdate = channelNameInput.trim();
    const thumbToUpload = videoThumbnailUrl.trim() || `https://img.youtube.com/vi/${ytId}/hqdefault.jpg`;
    const formattedUrl = `https://www.youtube-nocookie.com/embed/${ytId}`;
    const boostTargetViewsToUpload = isBoostEnabled ? (parseInt(boostTargetViews) || 0) : 0;
    const boostBudgetToUpload = isBoostEnabled ? (parseFloat(boostBudget) || 0) : 0;

    // Start background upload & close modal so user can browse anywhere
    startUpload(titleToUpload, 'video', async (updateProgress) => {
      updateProgress(20);

      // Save channel name if changed
      if (channelNameToUpdate !== user?.channel_name) {
        await updateProfile({ channel_name: channelNameToUpdate }).catch(() => {});
      }

      updateProgress(60);

      // Single source of truth: post to /api/videos/upload (handles boost + wallet debit)
      const res = await fetch('/api/videos/upload', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          title: titleToUpload,
          description: descToUpload,
          videoUrl: formattedUrl,
          embedUrl: formattedUrl,
          thumbnailUrl: thumbToUpload,
          youtubeId: ytId,
          category: categoryToUpload,
          price: priceToUpload,
          channelName: channelNameToUpdate || user?.channel_name || user?.name,
          channelAvatar: user?.avatar_url || (user as any)?.app_profiles?.avatar || '/logo.png',
          isPortrait: isVideoPortrait,
          duration: detectedVideoDuration,
          targetViews: boostTargetViewsToUpload,
          budget: boostBudgetToUpload,
          isBoosted: isBoostEnabled
        })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to upload video');
      }

      updateProgress(100);
      if (onSuccess) {
        try {
          onSuccess();
        } catch (err) {
          console.error('onSuccess callback notice:', err);
        }
      }
      return data;
    });

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-[#0F1420] rounded-3xl shadow-2xl border border-slate-800 w-full max-w-lg overflow-hidden flex flex-col max-h-[92vh] text-white font-sans">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-[#131926]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center shadow-md">
              <Plus className="w-6 h-6 stroke-[2.5]" />
            </div>
            <div>
              <h3 className="text-base font-black text-white">Create on Benix.Space</h3>
              <p className="text-[11px] text-slate-400">Submit ads for leads or broadcast YouTube videos</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-white rounded-full hover:bg-slate-800/60 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Create Actions: Submit Ad or Broadcast Video */}
        <div className="px-6 flex gap-2 border-b border-slate-800 pb-3 pt-3">
          <button
            onClick={() => setShowSubmitAd(true)}
            className="flex-1 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 bg-gradient-to-r from-amber-500 to-orange-600 text-white shadow-lg shadow-amber-600/30 hover:from-amber-400 hover:to-orange-500"
          >
            <Megaphone className="w-4 h-4" />
            <span>Submit Ad for Leads</span>
          </button>
          <button
            type="button"
            className="flex-1 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-600/30"
          >
            <Video className="w-4 h-4" />
            <span>Broadcast Video</span>
          </button>
        </div>

        {/* Submit Ad Modal (opens from the Submit Ad tab) */}
        <SubmitAdModal
          isOpen={showSubmitAd}
          onClose={() => setShowSubmitAd(false)}
          onOpenWallet={() => setShowSubmitAd(false)}
        />

        {/* Body Container */}
        <div className="p-6 overflow-y-auto flex-1 space-y-4">
          {statusMsg && (
            <div className={`p-3 rounded-xl text-xs flex items-center gap-2 ${statusMsg.error ? 'bg-red-950/60 text-red-200 border border-red-500/40' : 'bg-emerald-950/60 text-emerald-200 border border-emerald-500/40'}`}>
              {statusMsg.error ? <AlertCircle className="w-4 h-4 shrink-0 text-red-400" /> : <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />}
              <span>{statusMsg.text}</span>
            </div>
          )}

          {/* Submit ad for getting leads */}
          <div className="p-4 rounded-2xl bg-gradient-to-r from-amber-950/60 to-[#121824] border border-amber-500/30 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <Megaphone className="w-5 h-5 text-amber-400 shrink-0" />
              <div>
                <p className="text-xs font-bold text-white">Submit ad for getting leads</p>
                <p className="text-[10px] text-slate-400">Reach buyers across BenixSpace and grow your business.</p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setShowSubmitAd(true)}
              className="px-3.5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-[11px] font-black shrink-0"
            >
              Submit Ad
            </button>
          </div>

          {/* Broadcast YouTube video */}
          <form onSubmit={handleUploadVideo} className="space-y-4">
              
              {/* Single YouTube Video Input (Standard, Shortened, or Shorts) */}
              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1">
                  YouTube Video or Shorts URL *
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={videoUrl}
                    onChange={(e) => {
                      const val = e.target.value;
                      setVideoUrl(val);
                      const id = extractYouTubeId(val);
                      if (id) {
                        setVideoThumbnailUrl(`https://img.youtube.com/vi/${id}/hqdefault.jpg`);
                        if (val.includes('/shorts/')) {
                          setIsVideoPortrait(true);
                          setVideoCategory('Trending Shorts');
                        }
                        fetchYouTubeInfo(val);
                      }
                    }}
                    onPaste={(e) => {
                      const pasted = e.clipboardData.getData('text');
                      if (pasted) {
                        const id = extractYouTubeId(pasted);
                        if (id) {
                          setVideoUrl(pasted);
                          setVideoThumbnailUrl(`https://img.youtube.com/vi/${id}/hqdefault.jpg`);
                          if (pasted.includes('/shorts/')) {
                            setIsVideoPortrait(true);
                            setVideoCategory('Trending Shorts');
                          }
                          setTimeout(() => fetchYouTubeInfo(pasted), 30);
                        }
                      }
                    }}
                    onBlur={() => fetchYouTubeInfo(videoUrl)}
                    placeholder="https://youtu.be/... or https://youtube.com/watch?v=... or /shorts/..."
                    required
                    className="flex-1 px-4 py-2.5 rounded-xl bg-[#161D2E] border border-slate-700 text-white text-xs focus:outline-none focus:border-blue-500 font-mono"
                  />
                  <button
                    type="button"
                    disabled={isFetchingYouTube || !videoUrl.trim()}
                    onClick={() => fetchYouTubeInfo(videoUrl)}
                    className="px-3.5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs flex items-center gap-1.5 shrink-0 transition-colors disabled:opacity-50"
                  >
                    <Search className="w-3.5 h-3.5" />
                    <span>{isFetchingYouTube ? 'Fetching...' : 'Fetch Info'}</span>
                  </button>
                </div>
                <span className="text-[10px] text-slate-400 mt-1 block">
                  Accepts Standard, Shortened, and Shorts URLs — Title, duration, and thumbnail are auto-extracted.
                </span>
              </div>

              {/* Video Thumbnail (Auto-Generated Snapshot / Upload Custom / YouTube) */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider">
                    Video Thumbnail
                  </label>
                  <label className="text-[11px] text-blue-400 hover:text-blue-300 font-bold cursor-pointer flex items-center gap-1 transition-colors">
                    <Upload className="w-3.5 h-3.5" />
                    <span>Upload Custom Thumbnail</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleCustomThumbnailChange}
                      className="hidden"
                    />
                  </label>
                </div>

                {videoThumbnailUrl ? (
                  <div className="flex items-center gap-3 p-3 bg-[#131926] border border-slate-800 rounded-2xl relative group">
                    <img
                      src={videoThumbnailUrl}
                      alt="Thumbnail Preview"
                      className="w-24 aspect-video rounded-xl object-cover border border-slate-700 shrink-0 shadow-md"
                    />
                    <div className="flex-1 min-w-0">
                      <span className="text-[10px] text-emerald-400 font-black uppercase tracking-wider block flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                        {videoThumbnailUrl.startsWith('data:') ? 'Generated from Video / Custom Image' : 'Thumbnail Ready'}
                      </span>
                      <p className="text-xs font-bold text-white truncate mt-0.5">{videoTitle || 'Active Video Broadcast'}</p>
                      <label className="text-[10px] text-slate-400 hover:text-white cursor-pointer inline-block mt-1 underline">
                        Change image
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleCustomThumbnailChange}
                          className="hidden"
                        />
                      </label>
                    </div>
                  </div>
                ) : (
                  <label className="flex items-center justify-center gap-2 p-4 border border-dashed border-slate-700 rounded-2xl cursor-pointer hover:border-blue-500 bg-[#121824] transition-all">
                    <Camera className="w-4 h-4 text-blue-400" />
                    <span className="text-xs font-bold text-slate-300">Upload custom thumbnail (or automatically snapshot first frame)</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleCustomThumbnailChange}
                      className="hidden"
                    />
                  </label>
                )}
              </div>

              {/* Creator Channel Name Requirement */}
              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1">
                  Creator Channel Name *
                </label>
                <div className="relative">
                  <Sparkles className="absolute left-3 top-2.5 w-4 h-4 text-purple-400" />
                  <input
                    type="text"
                    value={channelNameInput}
                    onChange={(e) => setChannelNameInput(e.target.value)}
                    placeholder="e.g. KigaliBeats, Isibo Creator, or @channel"
                    required
                    className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-[#161D2E] border border-slate-700 text-white text-xs focus:outline-none focus:border-purple-500 font-bold"
                  />
                </div>
                <span className="text-[10px] text-slate-400 mt-1 block">Your creator identity for this broadcast.</span>
              </div>

              {/* Editable Video Title */}
              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1">
                  Video Title * (Editable)
                </label>
                <input
                  type="text"
                  value={videoTitle}
                  onChange={(e) => setVideoTitle(e.target.value)}
                  placeholder="e.g. Rwandan Premier League Highlights"
                  required
                  className="w-full px-4 py-2.5 rounded-xl bg-[#161D2E] border border-slate-700 text-white text-xs focus:outline-none focus:border-blue-500 font-medium"
                />
              </div>

              {/* Editable Video Description */}
              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1">
                  Video Description (Editable)
                </label>
                <textarea
                  rows={2}
                  value={videoDesc}
                  onChange={(e) => setVideoDesc(e.target.value)}
                  placeholder="Describe your video broadcast..."
                  className="w-full px-4 py-2.5 rounded-xl bg-[#161D2E] border border-slate-700 text-white text-xs focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1">
                  Broadcast Category
                </label>
                <select
                  value={videoCategory}
                  onChange={(e) => setVideoCategory(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl bg-[#161D2E] border border-slate-700 text-white text-xs focus:outline-none focus:border-blue-500 font-medium"
                >
                  <option value="Gospel & Choirs">Gospel & Choirs</option>
                  <option value="Series & Comedy">Series & Comedy</option>
                  <option value="Culture & Documentaries">Culture & Documentaries</option>
                  <option value="Music & Shows">Music & Shows</option>
                  <option value="Entertainment & Movies">Entertainment & Movies</option>
                  <option value="Sports">Sports Highlights</option>
                  <option value="Live TV">Live TV & News</option>
                </select>
              </div>

              {/* Pricing & Monetization Section */}
              <div className="p-4 rounded-2xl bg-[#121824] border border-slate-700 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-xs font-extrabold text-white flex items-center gap-1.5">
                      <DollarSign className="w-4 h-4 text-emerald-400" />
                      Sell Video on Platform (Pay-to-Watch)
                    </h4>
                    <p className="text-[10px] text-slate-400">Users pay from their central wallet to unlock this video</p>
                  </div>
                  <input
                    type="checkbox"
                    id="paidVideoCheck"
                    checked={isPaidVideo}
                    onChange={(e) => setIsPaidVideo(e.target.checked)}
                    className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500"
                  />
                </div>

                {isPaidVideo && (
                  <div className="pt-2">
                    <label className="block text-[11px] font-bold text-slate-300 uppercase mb-1">
                      Price per Video Unlock (RWF)
                    </label>
                    <input
                      type="number"
                      value={videoPrice}
                      onChange={(e) => setVideoPrice(e.target.value)}
                      placeholder="e.g. 500"
                      className="w-full px-4 py-2 rounded-xl bg-[#161D2E] border border-slate-700 text-emerald-400 font-bold text-sm focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                )}
              </div>

              {/* 300 Watchhours & 30 Subscribers Monetization Criteria Card */}
              <div className="p-4 rounded-2xl bg-gradient-to-br from-[#162032] to-[#0E1524] border border-blue-500/30 space-y-2">
                <div className="flex items-center justify-between text-xs font-bold text-slate-300">
                  <span className="flex items-center gap-1.5 text-blue-400">
                    <Sparkles className="w-4 h-4" />
                    Ad Revenue Monetization Program
                  </span>
                  <span className="text-[10px] bg-blue-500/20 text-blue-300 px-2 py-0.5 rounded-full font-mono">
                    Criteria
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-3 text-[11px] pt-1">
                  <div className="p-2.5 rounded-xl bg-[#0F1420] border border-slate-800">
                    <span className="text-slate-400 block text-[10px]">Watch Hours</span>
                    <strong className="text-white text-xs">{monetization.currentWatchHours}</strong>
                    <span className="text-slate-400"> / {monetization.requiredWatchHours} hrs</span>
                    <div className="w-full h-1.5 bg-slate-800 rounded-full mt-1.5 overflow-hidden">
                      <div
                        className="h-full bg-blue-500 rounded-full"
                        style={{ width: `${Math.min(100, (monetization.currentWatchHours / monetization.requiredWatchHours) * 100)}%` }}
                      />
                    </div>
                  </div>
                  <div className="p-2.5 rounded-xl bg-[#0F1420] border border-slate-800">
                    <span className="text-slate-400 block text-[10px]">Subscribers</span>
                    <strong className="text-white text-xs">{monetization.currentSubscribers}</strong>
                    <span className="text-slate-400"> / {monetization.requiredSubscribers} subs</span>
                    <div className="w-full h-1.5 bg-slate-800 rounded-full mt-1.5 overflow-hidden">
                      <div
                        className="h-full bg-emerald-500 rounded-full"
                        style={{ width: `${Math.min(100, (monetization.currentSubscribers / monetization.requiredSubscribers) * 100)}%` }}
                      />
                    </div>
                  </div>
                </div>
                <p className="text-[10px] text-slate-400 pt-1">
                  Once criteria are reached, broadcast ad revenue is generated and deposited automatically into your central wallet.
                </p>
              </div>

              {/* Video Boost: target views + budget (1 view = 8 RWF) */}
              <div className="p-4 rounded-2xl bg-[#0E1524] border border-amber-500/30 space-y-3">
                <label className="flex items-center justify-between cursor-pointer">
                  <span className="flex items-center gap-2 text-xs font-bold text-amber-400">
                    <Zap className="w-4 h-4" />
                    Boost Video & Share-to-Earn
                  </span>
                  <input
                    type="checkbox"
                    checked={isBoostEnabled}
                    onChange={(e) => setIsBoostEnabled(e.target.checked)}
                    className="w-4 h-4 accent-amber-500"
                  />
                </label>

                {isBoostEnabled && (
                  <>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Target Views</label>
                        <input
                          type="number"
                          min="1"
                          value={boostTargetViews}
                          onChange={(e) => setBoostTargetViews(e.target.value)}
                          className="w-full px-3 py-2 rounded-xl bg-[#161D2E] border border-slate-700 text-white text-sm focus:outline-none focus:border-amber-500"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Budget (RWF)</label>
                        <input
                          type="number"
                          min="8"
                          step="8"
                          value={boostBudget}
                          onChange={(e) => setBoostBudget(e.target.value)}
                          className="w-full px-3 py-2 rounded-xl bg-[#161D2E] border border-slate-700 text-white text-sm focus:outline-none focus:border-amber-500"
                        />
                      </div>
                    </div>
                    <p className="text-[11px] text-emerald-400 font-bold">
                      Estimated views: {estimatedBoostViews.toLocaleString()} views
                    </p>
                    <p className="text-[10px] text-slate-400">
                      Your budget is deducted now. Sharers earn a reward for every verified watch. Boosted video disappears when budget or views are exhausted.
                    </p>
                  </>
                )}
              </div>

              <button
                type="submit"
                disabled={loading || !videoTitle.trim() || !videoUrl.trim()}
                className="w-full py-3.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-xs shadow-lg shadow-blue-600/30 transition-all disabled:opacity-50"
              >
                {loading ? 'Broadcasting Video...' : isBoostEnabled ? `Boost Video (${estimatedBoostViews.toLocaleString()} views)` : 'Broadcast Video to Creator Hub'}
              </button>
            </form>

        </div>

      </div>
    </div>
  );
};
