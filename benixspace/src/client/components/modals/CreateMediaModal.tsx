import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
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
  Film
} from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export const CreateMediaModal: React.FC<Props> = ({ isOpen, onClose, onSuccess }) => {
  const { user, token } = useAuth();
  const [tab, setTab] = useState<'story' | 'video'>('story');
  const [loading, setLoading] = useState(false);
  const [statusMsg, setStatusMsg] = useState<{ text: string; error?: boolean } | null>(null);

  // Story Form State
  const [storyMediaUrl, setStoryMediaUrl] = useState('');
  const [storyCaption, setStoryCaption] = useState('');
  const [storyPreview, setStoryPreview] = useState<string | null>(null);

  // Video Form State
  const [videoTitle, setVideoTitle] = useState('');
  const [videoDesc, setVideoDesc] = useState('');
  const [videoUrl, setVideoUrl] = useState('');
  const [videoCategory, setVideoCategory] = useState('Entertainment');
  const [isPaidVideo, setIsPaidVideo] = useState(false);
  const [videoPrice, setVideoPrice] = useState('500');
  const [driveAccount, setDriveAccount] = useState('drive-primary');

  // Creator Monetization Criteria
  const [monetization, setMonetization] = useState<{
    requiredWatchHours: number;
    currentWatchHours: number;
    requiredSubscribers: number;
    currentSubscribers: number;
  }>({
    requiredWatchHours: 300,
    currentWatchHours: 142,
    requiredSubscribers: 30,
    currentSubscribers: 19
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

  const handleStoryFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const result = event.target?.result as string;
      setStoryPreview(result);
      setStoryMediaUrl(result);
    };
    reader.readAsDataURL(file);
  };

  const handleCreateStory = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatusMsg(null);
    if (!storyMediaUrl) {
      setStatusMsg({ text: 'Please upload a photo or video clip for your story.', error: true });
      return;
    }

    try {
      setLoading(true);
      const res = await fetch('/api/stories', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          mediaUrl: storyMediaUrl,
          caption: storyCaption
        })
      });
      const data = await res.json();
      if (res.ok) {
        notificationSound.playNotificationChime();
        setStatusMsg({ text: 'Story published successfully! Visible on homepage for 24h.' });
        setTimeout(() => {
          onClose();
          if (onSuccess) onSuccess();
        }, 1200);
      } else {
        setStatusMsg({ text: data.error || 'Failed to publish story.', error: true });
      }
    } catch (err: any) {
      setStatusMsg({ text: err.message || 'Network error.', error: true });
    } finally {
      setLoading(false);
    }
  };

  const handleUploadVideo = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatusMsg(null);
    if (!videoTitle.trim() || !videoUrl.trim()) {
      setStatusMsg({ text: 'Video Title and Video Stream URL / File are required.', error: true });
      return;
    }

    try {
      setLoading(true);
      const res = await fetch('/api/videos/upload', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          title: videoTitle.trim(),
          description: videoDesc.trim(),
          videoUrl: videoUrl.trim(),
          category: videoCategory,
          price: isPaidVideo ? parseFloat(videoPrice) || 0 : 0,
          driveFolder: driveAccount
        })
      });
      const data = await res.json();
      if (res.ok) {
        notificationSound.playNotificationChime();
        setStatusMsg({ text: 'Video published to Benix.Space and stored in cloud drive!' });
        setTimeout(() => {
          onClose();
          if (onSuccess) onSuccess();
        }, 1200);
      } else {
        setStatusMsg({ text: data.error || 'Failed to upload video.', error: true });
      }
    } catch (err: any) {
      setStatusMsg({ text: err.message || 'Network error.', error: true });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-[#0F1420] rounded-3xl shadow-2xl border border-slate-800 w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh] text-white font-sans">
        
        {/* Header */}
        <div className="px-6 py-5 border-b border-slate-800 flex items-center justify-between bg-[#131926]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center shadow-md">
              <Plus className="w-6 h-6 stroke-[2.5]" />
            </div>
            <div>
              <h3 className="text-base font-black text-white">Create on Benix.Space</h3>
              <p className="text-[11px] text-slate-400">Share stories and broadcast monetized videos</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-white rounded-full hover:bg-slate-800/60 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Controls: Story vs Video */}
        <div className="px-6 flex gap-2 border-b border-slate-800 pb-3 pt-4">
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

          {/* TAB 1: POST STORY */}
          {tab === 'story' && (
            <form onSubmit={handleCreateStory} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
                  Story Photo or Short Video Clip *
                </label>
                <div className="border-2 border-dashed border-slate-700 rounded-2xl p-4 text-center hover:border-pink-500 transition-colors bg-[#121824] relative overflow-hidden">
                  {storyPreview ? (
                    <div className="relative aspect-[9/16] max-h-60 mx-auto rounded-xl overflow-hidden">
                      <img src={storyPreview} alt="Story Preview" className="w-full h-full object-cover" />
                      <button
                        type="button"
                        onClick={() => { setStoryPreview(null); setStoryMediaUrl(''); }}
                        className="absolute top-2 right-2 p-1.5 rounded-full bg-black/70 text-white"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <label className="cursor-pointer block py-6">
                      <Camera className="w-8 h-8 text-pink-400 mx-auto mb-2" />
                      <span className="text-xs font-bold text-white block">Click to select photo or clip</span>
                      <span className="text-[10px] text-slate-400">PNG, JPG, MP4 up to 50MB</span>
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
                  placeholder="Add a caption to your story..."
                  className="w-full px-4 py-2.5 rounded-xl bg-[#161D2E] border border-slate-700 text-white text-xs focus:outline-none focus:border-pink-500"
                />
              </div>

              <div className="p-3 rounded-2xl bg-pink-500/10 border border-pink-500/20 text-[11px] text-pink-300 flex items-center gap-2">
                <Clock className="w-4 h-4 shrink-0 text-pink-400" />
                <span>Your story will appear in the top Stories Bar on the homepage for 24 hours.</span>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 rounded-xl bg-gradient-to-r from-rose-500 to-pink-600 hover:from-rose-400 hover:to-pink-500 text-white font-bold text-xs shadow-lg shadow-rose-600/30 transition-all disabled:opacity-50"
              >
                {loading ? 'Publishing Story...' : 'Publish Story to Homepage'}
              </button>
            </form>
          )}

          {/* TAB 2: UPLOAD VIDEO & MONETIZATION */}
          {tab === 'video' && (
            <form onSubmit={handleUploadVideo} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1">
                  Video Title *
                </label>
                <input
                  type="text"
                  value={videoTitle}
                  onChange={(e) => setVideoTitle(e.target.value)}
                  placeholder="e.g. Rwandan Premier League Highlights"
                  required
                  className="w-full px-4 py-2.5 rounded-xl bg-[#161D2E] border border-slate-700 text-white text-xs focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1">
                  Video Stream URL or YouTube Link *
                </label>
                <input
                  type="text"
                  value={videoUrl}
                  onChange={(e) => setVideoUrl(e.target.value)}
                  placeholder="https://... or YouTube video URL"
                  required
                  className="w-full px-4 py-2.5 rounded-xl bg-[#161D2E] border border-slate-700 text-white text-xs focus:outline-none focus:border-blue-500 font-mono"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1">
                    Category
                  </label>
                  <select
                    value={videoCategory}
                    onChange={(e) => setVideoCategory(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl bg-[#161D2E] border border-slate-700 text-white text-xs focus:outline-none focus:border-blue-500"
                  >
                    <option value="Live TV">Live TV & News</option>
                    <option value="Sports">Sports Highlights</option>
                    <option value="Entertainment">Entertainment & Movies</option>
                    <option value="Music">Music & Choirs</option>
                    <option value="Tech">Technology & Dev</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1">
                    Drive Cloud Storage
                  </label>
                  <select
                    value={driveAccount}
                    onChange={(e) => setDriveAccount(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl bg-[#161D2E] border border-slate-700 text-white text-xs focus:outline-none focus:border-blue-500"
                  >
                    <option value="drive-primary">Primary Drive (Account 1)</option>
                    <option value="drive-secondary">Fallback Drive (Account 2)</option>
                  </select>
                </div>
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
                  Once reached, Google AdSense & direct sponsor video ads generate automatic revenue into your central wallet.
                </p>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-xs shadow-lg shadow-blue-600/30 transition-all disabled:opacity-50"
              >
                {loading ? 'Publishing Video...' : 'Publish Video & Save to Drive'}
              </button>
            </form>
          )}

        </div>

      </div>
    </div>
  );
};
