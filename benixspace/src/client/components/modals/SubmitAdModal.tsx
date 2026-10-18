import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { notificationSound } from '../../utils/notificationSound';
import {
  X,
  Megaphone,
  Sparkles,
  TrendingUp,
  MousePointerClick,
  Eye,
  Calendar,
  Wallet,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  Target,
  Image,
  Video,
  DollarSign
} from 'lucide-react';
import { getAuthToken } from '../../services/api';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onOpenWallet: () => void;
  onSuccess?: () => void;
}

export const SubmitAdModal: React.FC<Props> = ({
  isOpen,
  onClose,
  onOpenWallet,
  onSuccess
}) => {
  const { user, wallet, refreshWallet } = useAuth();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [targetUrl, setTargetUrl] = useState('');
  const [mediaType, setMediaType] = useState<'image' | 'video'>('image');
  const [mediaUrl, setMediaUrl] = useState('');
  const [targetAudience, setTargetAudience] = useState('all');
  const [dailyBudget, setDailyBudget] = useState(1000);
  const [durationDays, setDurationDays] = useState(7);

  const [metrics, setMetrics] = useState<{
    estimatedDailyImpressions: number;
    estimatedDailyClicks: number;
    totalImpressions: number;
    totalClicks: number;
    totalCost: number;
    estimatedCtr: string;
  }>({
    estimatedDailyImpressions: 200,
    estimatedDailyClicks: 8,
    totalImpressions: 1400,
    totalClicks: 56,
    totalCost: 7000,
    estimatedCtr: '4.2%'
  });

  const [loading, setLoading] = useState(false);
  const [statusMsg, setStatusMsg] = useState<{ text: string; error?: boolean } | null>(null);

  // Recalculate estimates whenever budget, duration, or audience changes
  useEffect(() => {
    async function calculate() {
      try {
        const res = await fetch('/api/ads/calculate-metrics', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ dailyBudget, durationDays, targetAudience })
        });
        if (res.ok) {
          const data = await res.json();
          if (data.metrics) setMetrics(data.metrics);
        }
      } catch (err) {
        // Fallback calculations
        const impDaily = Math.round(dailyBudget / 5);
        const clkDaily = Math.round(impDaily * 0.042);
        setMetrics({
          estimatedDailyImpressions: impDaily,
          estimatedDailyClicks: clkDaily,
          totalImpressions: impDaily * durationDays,
          totalClicks: clkDaily * durationDays,
          totalCost: dailyBudget * durationDays,
          estimatedCtr: '4.2%'
        });
      }
    }
    calculate();
  }, [dailyBudget, durationDays, targetAudience]);

  if (!isOpen) return null;

  const currentBalance = Number(wallet?.balance || 0);
  const canAfford = currentBalance >= dailyBudget;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const token = getAuthToken();
    if (!token) {
      setStatusMsg({ text: 'Please sign in or create an account to run ad campaigns.', error: true });
      return;
    }

    if (!title || !description || !targetUrl || !mediaUrl) {
      setStatusMsg({ text: 'Please provide title, description, link, and banner picture/video.', error: true });
      return;
    }

    if (!canAfford) {
      setStatusMsg({
        text: `Insufficient wallet balance. Launching this ad requires at least 1 day budget (${dailyBudget.toLocaleString()} RWF).`,
        error: true
      });
      return;
    }

    setLoading(true);
    setStatusMsg(null);

    try {
      const res = await fetch('/api/ads/submit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          title,
          description,
          targetUrl,
          mediaType,
          mediaUrl,
          targetAudience,
          dailyBudget,
          durationDays
        })
      });

      const data = await res.json();

      if (res.ok && data.success) {
        setStatusMsg({ text: data.message || 'Campaign launched!' });
        notificationSound.playNotificationChime();
        refreshWallet();
        setTimeout(() => {
          if (onSuccess) onSuccess();
          onClose();
        }, 1800);
      } else {
        setStatusMsg({ text: data.error || data.message || 'Failed to submit campaign.', error: true });
      }
    } catch (err: any) {
      setStatusMsg({ text: 'Network connection failed. Please try again.', error: true });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/85 backdrop-blur-md animate-fadeIn select-none">
      <div className="relative w-full max-w-2xl bg-[#0E1524] text-white rounded-3xl shadow-2xl border border-amber-500/40 flex flex-col overflow-hidden max-h-[92vh] animate-scaleUp">
        
        {/* Top Header Bar */}
        <div className="px-5 py-4 bg-gradient-to-r from-amber-900/60 via-slate-900 to-[#0E1524] border-b border-slate-800 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-amber-500/20 text-amber-400">
              <Megaphone className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-black text-base sm:text-lg text-white">Advertise on BenixSpace</h3>
              <p className="text-[11px] text-slate-400">Promote your brand, website, or video across TV, Radio & Apps</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Wallet Balance Strip */}
        <div className="px-5 py-2.5 bg-[#12192A] border-b border-slate-800 flex items-center justify-between text-xs shrink-0">
          <div className="flex items-center gap-2 text-slate-300">
            <Wallet className="w-4 h-4 text-emerald-400" />
            <span>Central Wallet: <strong className="text-emerald-400 font-extrabold">{currentBalance.toLocaleString()} RWF</strong></span>
          </div>

          <button
            onClick={onOpenWallet}
            className="px-3 py-1 rounded-xl bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/30 text-emerald-400 text-[11px] font-bold transition-all"
          >
            + Top Up Wallet
          </button>
        </div>

        {/* Feedback Alert */}
        {statusMsg && (
          <div
            className={`px-5 py-2.5 text-xs font-bold flex items-center gap-2 shrink-0 ${
              statusMsg.error
                ? 'bg-rose-950/70 text-rose-200 border-b border-rose-500/40'
                : 'bg-emerald-950/70 text-emerald-200 border-b border-emerald-500/40'
            }`}
          >
            {statusMsg.error ? <AlertCircle className="w-4 h-4 shrink-0" /> : <CheckCircle2 className="w-4 h-4 shrink-0" />}
            <span>{statusMsg.text}</span>
          </div>
        )}

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 overflow-y-auto space-y-5 flex-1">
          
          {/* Campaign Details */}
          <div className="space-y-3">
            <h4 className="text-xs font-black uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5" />
              1. Campaign Content & Creative
            </h4>

            <div className="space-y-1">
              <label className="text-[11px] font-bold text-slate-300">Headline / Business Title</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Bourbon Coffee Kigali — 15% Off Specialty Brew"
                required
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-400"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[11px] font-bold text-slate-300">Ad Description / Call to Action</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe what you are offering and why viewers should click..."
                rows={2}
                required
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-400"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[11px] font-bold text-slate-300">Target Website or WhatsApp Link</label>
              <input
                type="url"
                value={targetUrl}
                onChange={(e) => setTargetUrl(e.target.value)}
                placeholder="https://yourwebsite.com or https://wa.me/250788..."
                required
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-400"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-300">Media Format</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setMediaType('image')}
                    className={`py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 border transition-all ${
                      mediaType === 'image'
                        ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                        : 'bg-slate-900 text-slate-400 border-slate-800'
                    }`}
                  >
                    <Image className="w-3.5 h-3.5" />
                    <span>Banner Image</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setMediaType('video')}
                    className={`py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 border transition-all ${
                      mediaType === 'video'
                        ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                        : 'bg-slate-900 text-slate-400 border-slate-800'
                    }`}
                  >
                    <Video className="w-3.5 h-3.5" />
                    <span>Short Video</span>
                  </button>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-300">Banner / Media URL</label>
                <input
                  type="url"
                  value={mediaUrl}
                  onChange={(e) => setMediaUrl(e.target.value)}
                  placeholder="https://...image.jpg or video.mp4"
                  required
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-400"
                />
              </div>
            </div>
          </div>

          {/* Target Audience & Budget */}
          <div className="space-y-3 pt-3 border-t border-slate-800">
            <h4 className="text-xs font-black uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
              <Target className="w-3.5 h-3.5" />
              2. Audience, Budget & Duration
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-300">Target Audience</label>
                <select
                  value={targetAudience}
                  onChange={(e) => setTargetAudience(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-amber-400"
                >
                  <option value="all">All Rwanda & Regional Audiences</option>
                  <option value="rwanda_kigali">Kigali Tech, Creators & Youth</option>
                  <option value="music_choir">Gospel, Choirs & Music Lovers</option>
                  <option value="marketplace">Marketplace & Online Shoppers</option>
                </select>
              </div>

              <div className="space-y-1">
                <div className="flex justify-between text-[11px]">
                  <span className="font-bold text-slate-300">Duration:</span>
                  <span className="font-black text-amber-400">{durationDays} Days</span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="30"
                  value={durationDays}
                  onChange={(e) => setDurationDays(parseInt(e.target.value))}
                  className="w-full accent-amber-500 cursor-pointer"
                />
              </div>
            </div>

            {/* Daily Budget Slider */}
            <div className="space-y-1 pt-1">
              <div className="flex justify-between text-[11px]">
                <span className="font-bold text-slate-300">Daily Budget:</span>
                <span className="font-black text-emerald-400">{dailyBudget.toLocaleString()} RWF / day</span>
              </div>
              <input
                type="range"
                min="500"
                max="20000"
                step="250"
                value={dailyBudget}
                onChange={(e) => setDailyBudget(parseInt(e.target.value))}
                className="w-full accent-emerald-500 cursor-pointer"
              />
            </div>
          </div>

          {/* Real-Time Estimated Performance & ROI Card */}
          <div className="p-4 rounded-2xl bg-gradient-to-br from-indigo-950/60 to-slate-900 border border-indigo-500/30 space-y-3">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-indigo-300 flex items-center gap-1.5">
                <TrendingUp className="w-4 h-4 text-emerald-400" />
                Live Performance Forecast
              </span>
              <span className="text-[10px] text-slate-400 font-semibold">CPM Rate: 5 RWF/view</span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center">
              <div className="p-2.5 rounded-xl bg-slate-900/80 border border-slate-800">
                <p className="text-[10px] text-slate-400">Daily Views</p>
                <p className="text-sm font-black text-white">~{metrics.estimatedDailyImpressions.toLocaleString()}</p>
              </div>

              <div className="p-2.5 rounded-xl bg-slate-900/80 border border-slate-800">
                <p className="text-[10px] text-slate-400">Daily Clicks</p>
                <p className="text-sm font-black text-emerald-400">~{metrics.estimatedDailyClicks.toLocaleString()}</p>
              </div>

              <div className="p-2.5 rounded-xl bg-slate-900/80 border border-slate-800">
                <p className="text-[10px] text-slate-400">Total Views</p>
                <p className="text-sm font-black text-white">~{metrics.totalImpressions.toLocaleString()}</p>
              </div>

              <div className="p-2.5 rounded-xl bg-slate-900/80 border border-slate-800">
                <p className="text-[10px] text-slate-400">Total Clicks</p>
                <p className="text-sm font-black text-amber-400">~{metrics.totalClicks.toLocaleString()}</p>
              </div>
            </div>

            <p className="text-[10px] text-slate-400 italic text-center">
              * The ad pauses automatically when daily budget is reached or if your wallet balance falls below the cost per view.
            </p>
          </div>

          {/* Submit Action */}
          <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="text-left">
              <span className="text-[11px] text-slate-400 block">Total Campaign Budget:</span>
              <span className="text-lg font-black text-white">{metrics.totalCost.toLocaleString()} <span className="text-xs text-amber-400">RWF</span></span>
            </div>

            <button
              type="submit"
              disabled={loading}
              className={`w-full sm:w-auto px-6 py-3 rounded-2xl font-black text-xs shadow-lg transition-all ${
                canAfford
                  ? 'bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-slate-950 shadow-amber-500/25 active:scale-95'
                  : 'bg-slate-800 text-slate-400 hover:text-white border border-slate-700'
              }`}
            >
              {loading ? 'Launching Ad...' : canAfford ? 'Launch Ad Campaign' : 'Top Up Wallet to Launch'}
            </button>
          </div>

        </form>

      </div>
    </div>
  );
};
