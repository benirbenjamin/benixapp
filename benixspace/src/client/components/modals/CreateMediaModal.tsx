import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useUpload } from '../../context/UploadContext';
import { uploadFileInChunks } from '../../utils/chunkedUpload';
import { notificationSound } from '../../utils/notificationSound';
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
  HardDrive,
  Clock,
  Users,
  ShieldCheck,
  Eye,
  Film,
  Link as LinkIcon,
  Search,
  FileVideo
} from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  initialTab?: 'story' | 'video';
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

export const CreateMediaModal: React.FC<Props> = ({ isOpen, onClose, onSuccess, initialTab = 'story' }) => {
  const { user, token, updateProfile } = useAuth();
  const { startUpload } = useUpload();
  const [tab, setTab] = useState<'story' | 'video'>(initialTab);
  const [loading, setLoading] = useState(false);
  const [statusMsg, setStatusMsg] = useState<{ text: string; error?: boolean } | null>(null);

  useEffect(() => {
    if (isOpen && initialTab) {
      setTab(initialTab);
    }
  }, [isOpen, initialTab]);

  // Story Form State
  const [storyMediaUrl, setStoryMediaUrl] = useState('');
  const [selectedStoryFile, setSelectedStoryFile] = useState<File | null>(null);
  const [storyCaption, setStoryCaption] = useState('');
  const [storyPreview, setStoryPreview] = useState<string | null>(null);

  // Video Form State
  const [channelNameInput, setChannelNameInput] = useState(user?.channel_name || user?.name || '');
  const [videoSourceMode, setVideoSourceMode] = useState<'youtube' | 'file'>('youtube');
  const [videoTitle, setVideoTitle] = useState('');
  const [videoDesc, setVideoDesc] = useState('');
  const [videoUrl, setVideoUrl] = useState('');
  const [selectedVideoFile, setSelectedVideoFile] = useState<File | null>(null);
  const [videoCategory, setVideoCategory] = useState('Entertainment & Movies');
  const [isPaidVideo, setIsPaidVideo] = useState(false);
  const [videoPrice, setVideoPrice] = useState('500');
  const [videoThumbnailUrl, setVideoThumbnailUrl] = useState('');
  const [isFetchingYouTube, setIsFetchingYouTube] = useState(false);
  const [selectedVideoFileName, setSelectedVideoFileName] = useState('');

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

  // Handle Story File Upload with Fast Preview & Chunk Preparation
  const handleStoryFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setSelectedStoryFile(file);
    const objectUrl = URL.createObjectURL(file);
    setStoryPreview(objectUrl);
    setStoryMediaUrl(objectUrl);

    const isVid = file.type.startsWith('video/');
    setStatusMsg({
      text: isVid
        ? `Video clip ready: "${file.name}" (${(file.size / (1024 * 1024)).toFixed(1)} MB)`
        : `Photo ready for story broadcast!`
    });
  };

  // Publish 24h Story in Background with Chunked Upload & Live Progress Line
  const handleCreateStory = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatusMsg(null);
    if (!selectedStoryFile && !storyMediaUrl) {
      setStatusMsg({ text: 'Please upload a photo or short clip for your story.', error: true });
      return;
    }

    const title = storyCaption.trim() ? `Story: "${storyCaption.trim().slice(0, 24)}..."` : '24h Story';
    const captionToUpload = storyCaption.trim();
    const fileToUpload = selectedStoryFile;
    const fallbackUrl = storyMediaUrl;

    // Start background upload & close modal so user can browse freely
    startUpload(title, 'story', async (updateProgress) => {
      let finalMediaUrl = fallbackUrl;

      // If local file selected, upload in resilient chunks (avoids Vercel 413 error completely!)
      if (fileToUpload) {
        updateProgress(10);
        finalMediaUrl = await uploadFileInChunks(fileToUpload, {
          folder: 'stories',
          onProgress: (pct) => updateProgress(Math.round(10 + pct * 0.75))
        });
      }

      updateProgress(88);
      const res = await fetch('/api/stories', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          mediaUrl: finalMediaUrl,
          caption: captionToUpload
        })
      });

      updateProgress(96);
      const text = await res.text();
      let data: any = {};
      try {
        data = JSON.parse(text);
      } catch {
        throw new Error(text.slice(0, 150) || 'Server returned invalid response');
      }

      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to publish story');
      }

      updateProgress(100);
      if (onSuccess) onSuccess();
      return data;
    });

    onClose();
  };

  // Fetch YouTube Metadata (Title, Author, Thumbnail) automatically via oEmbed
  const fetchYouTubeInfo = async (rawUrl: string) => {
    const trimmed = rawUrl.trim();
    if (!trimmed) return;

    const isYouTube = /(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)/i.test(trimmed);
    if (!isYouTube) return;

    setIsFetchingYouTube(true);
    setStatusMsg({ text: 'Fetching YouTube title, description and thumbnail...' });

    try {
      const res = await fetch(`https://noembed.com/embed?url=${encodeURIComponent(trimmed)}`);
      if (res.ok) {
        const data = await res.json();
        if (data.title) {
          setVideoTitle(data.title);
        }
        if (data.author_name) {
          setVideoDesc(`Video by ${data.author_name} — broadcasted on Benix.Space.`);
        }
        if (data.thumbnail_url) {
          setVideoThumbnailUrl(data.thumbnail_url);
        }
        setStatusMsg({ text: '✨ Details fetched! You can freely edit the title and description below.' });
      } else {
        // Fallback: extract ID directly for thumbnail
        let vidId = '';
        if (trimmed.includes('youtu.be/')) vidId = trimmed.split('youtu.be/')[1]?.split('?')[0];
        else if (trimmed.includes('v=')) vidId = trimmed.split('v=')[1]?.split('&')[0];
        if (vidId) {
          setVideoThumbnailUrl(`https://img.youtube.com/vi/${vidId}/hqdefault.jpg`);
          setStatusMsg({ text: 'YouTube link detected. Please enter a title and description.' });
        }
      }
    } catch {
      let vidId = '';
      if (trimmed.includes('youtu.be/')) vidId = trimmed.split('youtu.be/')[1]?.split('?')[0];
      else if (trimmed.includes('v=')) vidId = trimmed.split('v=')[1]?.split('&')[0];
      if (vidId) {
        setVideoThumbnailUrl(`https://img.youtube.com/vi/${vidId}/hqdefault.jpg`);
      }
      setStatusMsg({ text: 'YouTube link detected. Please enter a title.' });
    } finally {
      setIsFetchingYouTube(false);
    }
  };

  // Handle local video file selection
  const handleLocalVideoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setSelectedVideoFile(file);
    setSelectedVideoFileName(file.name);
    // Use cleaned file name as initial title if empty
    if (!videoTitle) {
      const cleanName = file.name.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' ');
      setVideoTitle(cleanName);
    }
    // Create object URL for local streaming/preview
    const objectUrl = URL.createObjectURL(file);
    setVideoUrl(objectUrl);
    setStatusMsg({ text: `Selected local video: "${file.name}" (${(file.size / (1024 * 1024)).toFixed(1)} MB)` });
  };

  // Handle Video Broadcast submission
  const handleUploadVideo = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatusMsg(null);

    if (!channelNameInput.trim()) {
      setStatusMsg({ text: 'Please set your Creator Channel Name first before publishing videos.', error: true });
      return;
    }

    if (!videoTitle.trim() || (!videoUrl.trim() && !selectedVideoFile)) {
      setStatusMsg({ text: 'Video Title and Video Stream / File / YouTube Link are required.', error: true });
      return;
    }

    // Capture parameters for background upload
    const titleToUpload = videoTitle.trim();
    const descToUpload = videoDesc.trim();
    const rawUrlToUpload = videoUrl.trim();
    const fileToUpload = videoSourceMode === 'file' ? selectedVideoFile : null;
    const categoryToUpload = videoCategory;
    const isPaidToUpload = isPaidVideo;
    const priceToUpload = isPaidVideo ? parseFloat(videoPrice) || 0 : 0;
    const channelNameToUpdate = channelNameInput.trim();
    const thumbToUpload = videoThumbnailUrl.trim();

    // Start background upload & close modal so user can browse anywhere
    startUpload(titleToUpload, 'video', async (updateProgress) => {
      updateProgress(10);

      // Save channel name if changed
      if (channelNameToUpdate !== user?.channel_name) {
        await updateProfile({ channel_name: channelNameToUpdate }).catch(() => {});
      }

      updateProgress(20);

      let formattedUrl = rawUrlToUpload;
      let thumb = thumbToUpload;

      if (fileToUpload) {
        // Upload video file safely in chunks to bypass Vercel serverless 4.5MB limit
        updateProgress(25);
        formattedUrl = await uploadFileInChunks(fileToUpload, {
          folder: 'videos',
          onProgress: (pct) => {
            // Scale progress from 25% to 75%
            updateProgress(25 + Math.round(pct * 0.5));
          }
        });
        if (!thumb) {
          thumb = 'https://images.unsplash.com/photo-1574375927938-d5a98e8ffe85?w=800&auto=format&fit=crop&q=80';
        }
      } else {
        // Clean / Format YouTube embed URL if applicable
        if (formattedUrl.includes('youtube.com/watch?v=')) {
          const id = formattedUrl.split('v=')[1]?.split('&')[0];
          formattedUrl = `https://www.youtube.com/embed/${id}`;
          if (!thumb) thumb = `https://img.youtube.com/vi/${id}/hqdefault.jpg`;
        } else if (formattedUrl.includes('youtu.be/')) {
          const id = formattedUrl.split('youtu.be/')[1]?.split('?')[0];
          formattedUrl = `https://www.youtube.com/embed/${id}`;
          if (!thumb) thumb = `https://img.youtube.com/vi/${id}/hqdefault.jpg`;
        }
      }

      updateProgress(80);

      // 1. Post to module videos endpoint
      await fetch('/api/modules/videos', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          title: titleToUpload,
          description: descToUpload,
          videoUrl: formattedUrl,
          thumbnailUrl: thumb || 'https://images.unsplash.com/photo-1574375927938-d5a98e8ffe85?w=800&auto=format&fit=crop&q=80',
          category: categoryToUpload,
          price: priceToUpload,
          channelName: channelNameToUpdate || user?.channel_name || user?.name,
          channelAvatar: user?.avatar_url || (user as any)?.app_profiles?.avatar || '/logo.png'
        })
      }).catch(() => {});

      updateProgress(90);

      // 2. Also record in user video uploads
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
          category: categoryToUpload,
          price: priceToUpload,
          channelName: channelNameToUpdate || user?.channel_name || user?.name,
          channelAvatar: user?.avatar_url || (user as any)?.app_profiles?.avatar || '/logo.png'
        })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to upload video');
      }

      updateProgress(100);
      if (onSuccess) onSuccess();
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
              <p className="text-[11px] text-slate-400">Share 24h stories and broadcast monetized videos</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-white rounded-full hover:bg-slate-800/60 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Controls: Story vs Video */}
        <div className="px-6 flex gap-2 border-b border-slate-800 pb-3 pt-3">
          <button
            onClick={() => { setTab('story'); setStatusMsg(null); }}
            className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 ${
              tab === 'story'
                ? 'bg-gradient-to-r from-rose-500 to-pink-600 text-white shadow-lg shadow-rose-600/30'
                : 'bg-slate-800/80 text-slate-300 hover:bg-slate-700'
            }`}
          >
            <Camera className="w-4 h-4" />
            <span>Post Story (24h)</span>
          </button>
          <button
            onClick={() => { setTab('video'); setStatusMsg(null); }}
            className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 ${
              tab === 'video'
                ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-600/30'
                : 'bg-slate-800/80 text-slate-300 hover:bg-slate-700'
            }`}
          >
            <Video className="w-4 h-4" />
            <span>Upload Video / Broadcast</span>
          </button>
        </div>

        {/* Body Container */}
        <div className="p-6 overflow-y-auto flex-1 space-y-4">
          {statusMsg && (
            <div className={`p-3 rounded-xl text-xs flex items-center gap-2 ${statusMsg.error ? 'bg-red-950/60 text-red-200 border border-red-500/40' : 'bg-emerald-950/60 text-emerald-200 border border-emerald-500/40'}`}>
              {statusMsg.error ? <AlertCircle className="w-4 h-4 shrink-0 text-red-400" /> : <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />}
              <span>{statusMsg.text}</span>
            </div>
          )}

          {/* TAB 1: POST STORY (With Canvas Compression) */}
          {tab === 'story' && (
            <form onSubmit={handleCreateStory} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
                  Story Photo or Short Video Clip *
                </label>
                <div className="border-2 border-dashed border-slate-700 rounded-2xl p-4 text-center hover:border-pink-500 transition-colors bg-[#121824] relative overflow-hidden">
                  {storyPreview ? (
                    <div className="relative max-h-64 h-64 w-full mx-auto rounded-xl overflow-hidden shadow-lg border border-slate-700 bg-black flex items-center justify-center">
                      {storyPreview.startsWith('data:video') || /\.(mp4|webm|mov|ogg)(\?.*)?$/i.test(storyPreview) ? (
                        <video src={storyPreview} autoPlay muted playsInline loop className="w-full h-full object-contain" />
                      ) : (
                        <img src={storyPreview} alt="Story Preview" className="w-full h-full object-contain" />
                      )}
                      <button
                        type="button"
                        onClick={() => { setStoryPreview(null); setStoryMediaUrl(''); }}
                        className="absolute top-2 right-2 p-1.5 rounded-full bg-black/70 text-white hover:bg-black transition-colors z-10"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <label className="cursor-pointer block py-6">
                      <Camera className="w-8 h-8 text-pink-400 mx-auto mb-2" />
                      <span className="text-xs font-bold text-white block">Click to select photo or clip</span>
                      <span className="text-[10px] text-slate-400 block mt-1">
                        Automatically compressed to high-efficiency format (max 1080px)
                      </span>
                      <input
                        type="file"
                        accept="image/*,video/*"
                        onChange={handleStoryFileChange}
                        className="hidden"
                      />
                    </label>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1">
                  Story Caption
                </label>
                <input
                  type="text"
                  value={storyCaption}
                  onChange={(e) => setStoryCaption(e.target.value)}
                  placeholder="Add an engaging caption to your story..."
                  className="w-full px-4 py-2.5 rounded-xl bg-[#161D2E] border border-slate-700 text-white text-xs focus:outline-none focus:border-pink-500"
                />
              </div>

              <div className="p-3 rounded-2xl bg-pink-500/10 border border-pink-500/20 text-[11px] text-pink-300 flex items-center gap-2">
                <Clock className="w-4 h-4 shrink-0 text-pink-400" />
                <span>Your story will appear in the top Stories Bar on the homepage for 24 hours.</span>
              </div>

              <button
                type="submit"
                disabled={loading || !storyMediaUrl}
                className="w-full py-3.5 rounded-xl bg-gradient-to-r from-rose-500 to-pink-600 hover:from-rose-400 hover:to-pink-500 text-white font-bold text-xs shadow-lg shadow-rose-600/30 transition-all disabled:opacity-50"
              >
                {loading ? 'Publishing Story...' : 'Publish Story to Homepage'}
              </button>
            </form>
          )}

          {/* TAB 2: UPLOAD VIDEO (YouTube Auto-Fetch or Local Video Selection) */}
          {tab === 'video' && (
            <form onSubmit={handleUploadVideo} className="space-y-4">
              
              {/* Video Source Selector: YouTube vs Local File */}
              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
                  Choose Video Source
                </label>
                <div className="grid grid-cols-2 p-1 bg-slate-900 border border-slate-800 rounded-2xl">
                  <button
                    type="button"
                    onClick={() => setVideoSourceMode('youtube')}
                    className={`py-2 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-2 ${
                      videoSourceMode === 'youtube'
                        ? 'bg-blue-600 text-white shadow-md'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    <LinkIcon className="w-3.5 h-3.5" />
                    <span>YouTube Link</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setVideoSourceMode('file')}
                    className={`py-2 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-2 ${
                      videoSourceMode === 'file'
                        ? 'bg-blue-600 text-white shadow-md'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    <FileVideo className="w-3.5 h-3.5" />
                    <span>Select Video File</span>
                  </button>
                </div>
              </div>

              {/* YouTube Link Input with Auto-Fetch */}
              {videoSourceMode === 'youtube' ? (
                <div>
                  <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1">
                    YouTube Video URL *
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={videoUrl}
                      onChange={(e) => {
                        setVideoUrl(e.target.value);
                      }}
                      onBlur={() => fetchYouTubeInfo(videoUrl)}
                      placeholder="https://youtu.be/... or https://youtube.com/watch?v=..."
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
                    Paste any YouTube URL — we will automatically fetch the video title, description, and thumbnail!
                  </span>
                </div>
              ) : (
                /* Local Video File Picker */
                <div>
                  <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1">
                    Select Video from Device *
                  </label>
                  <div className="border-2 border-dashed border-slate-700 rounded-2xl p-4 text-center hover:border-blue-500 transition-colors bg-[#121824]">
                    <label className="cursor-pointer block py-4">
                      <FileVideo className="w-8 h-8 text-blue-400 mx-auto mb-2" />
                      <span className="text-xs font-bold text-white block">
                        {selectedVideoFileName || 'Click to choose video from device'}
                      </span>
                      <span className="text-[10px] text-slate-400 block mt-1">MP4, WebM, MOV video files</span>
                      <input
                        type="file"
                        accept="video/*"
                        onChange={handleLocalVideoChange}
                        className="hidden"
                      />
                    </label>
                  </div>
                </div>
              )}

              {/* Thumbnail Preview if available */}
              {videoThumbnailUrl && (
                <div className="flex items-center gap-3 p-3 bg-[#131926] border border-slate-800 rounded-2xl">
                  <img
                    src={videoThumbnailUrl}
                    alt="Thumbnail Preview"
                    className="w-20 aspect-video rounded-lg object-cover border border-slate-700 shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <span className="text-[10px] text-blue-400 font-bold uppercase tracking-wider block">Thumbnail Fetched</span>
                    <p className="text-xs font-bold text-white truncate">{videoTitle || 'Untitled Video'}</p>
                  </div>
                </div>
              )}

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

              <button
                type="submit"
                disabled={loading || !videoTitle.trim() || !videoUrl.trim()}
                className="w-full py-3.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-xs shadow-lg shadow-blue-600/30 transition-all disabled:opacity-50"
              >
                {loading ? 'Publishing Video...' : 'Publish Video to Creator Hub'}
              </button>
            </form>
          )}

        </div>

      </div>
    </div>
  );
};
