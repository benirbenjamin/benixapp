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
  Image as ImageIcon,
  Video,
  DollarSign,
  Tv,
  Radio,
  FileText,
  Smartphone,
  Flame,
  Check,
  Upload,
  Layers,
  Crop
} from 'lucide-react';
import { getAuthToken } from '../../services/api';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onOpenWallet: () => void;
  onSuccess?: () => void;
}

type PreviewFormat = 'story' | 'video' | 'sidebar' | 'article' | 'tv';

export const SubmitAdModal: React.FC<Props> = ({
  isOpen,
  onClose,
  onOpenWallet,
  onSuccess
}) => {
  const { user, wallet, refreshMe, updateWalletBalance } = useAuth();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [targetUrl, setTargetUrl] = useState('');
  const [mediaType, setMediaType] = useState<'image' | 'video'>('image');
  const [mediaUrl, setMediaUrl] = useState('https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=800&auto=format&fit=crop&q=80');
  const [cropMode, setCropMode] = useState<'cover' | 'contain'>('cover');
  const [targetAudience, setTargetAudience] = useState('all');
  
  // Budget starting from 100 RWF as requested
  const [dailyBudget, setDailyBudget] = useState(100);
  const [durationDays, setDurationDays] = useState(7);
  const [cpmBid, setCpmBid] = useState(20); // 20 RWF per 1000 impressions
  const [cpcBid, setCpcBid] = useState(15); // 15 RWF per click
  const [targetMode, setTargetMode] = useState<'duration' | 'quota'>('duration');
  const [targetQuota, setTargetQuota] = useState(5000);

  // Multi-format preview tab
  const [previewTab, setPreviewTab] = useState<PreviewFormat>('video');

  const [metrics, setMetrics] = useState<{
    estimatedDailyImpressions: number;
    estimatedDailyClicks: number;
    totalImpressions: number;
    totalClicks: number;
    totalCost: number;
    estimatedCtr: string;
    historyInsight?: string;
  }>({
    estimatedDailyImpressions: 5000,
    estimatedDailyClicks: 220,
    totalImpressions: 35000,
    totalClicks: 1540,
    totalCost: 700,
    estimatedCtr: '4.4%',
    historyInsight: 'Based on performance from recent campaigns in Rwanda, your 700 RWF budget will deliver ~35,000 views and ~1,540 verified clicks.'
  });

  const [benchmarks, setBenchmarks] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [statusMsg, setStatusMsg] = useState<{ text: string; error?: boolean } | null>(null);

  // Load platform benchmarks on open
  useEffect(() => {
    if (isOpen) {
      fetch('/api/ads/benchmarks')
        .then((res) => res.json())
        .then((data) => {
          if (data?.benchmarks) setBenchmarks(data.benchmarks);
        })
        .catch(() => {});
    }
  }, [isOpen]);

  // Recalculate estimates dynamically based on budget, CPM, CPC, duration, and historical performance
  useEffect(() => {
    async function calculate() {
      try {
        const res = await fetch('/api/ads/calculate-metrics', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            dailyBudget,
            durationDays: targetMode === 'duration' ? durationDays : Math.max(1, Math.round(targetQuota / ((dailyBudget / cpmBid) * 1000))),
            cpmBid,
            cpcBid,
            targetAudience
          })
        });
        if (res.ok) {
          const data = await res.json();
          if (data.metrics) setMetrics(data.metrics);
        }
      } catch (err) {
        // Fallback calculation using benchmark 4.4% CTR
        const impDaily = Math.round((dailyBudget / cpmBid) * 1000);
        const clkDaily = Math.round(impDaily * 0.044);
        const effDays = targetMode === 'duration' ? durationDays : Math.max(1, Math.round(targetQuota / impDaily));
        setMetrics({
          estimatedDailyImpressions: impDaily,
          estimatedDailyClicks: clkDaily,
          totalImpressions: targetMode === 'quota' ? targetQuota : impDaily * effDays,
          totalClicks: clkDaily * effDays,
          totalCost: dailyBudget * effDays,
          estimatedCtr: '4.4%',
          historyInsight: `Based on similar campaigns in Rwanda, your ${dailyBudget * effDays} RWF budget will reach ~${(impDaily * effDays).toLocaleString()} views and ~${(clkDaily * effDays).toLocaleString()} clicks.`
        });
      }
    }
    calculate();
  }, [dailyBudget, durationDays, cpmBid, cpcBid, targetAudience, targetMode, targetQuota]);

  // Handle local file selection with instant Base64 preview
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      if (event.target?.result) {
        setMediaUrl(event.target.result as string);
        if (file.type.startsWith('video/')) {
          setMediaType('video');
        } else {
          setMediaType('image');
        }
      }
    };
    reader.readAsDataURL(file);
  };

  if (!isOpen) return null;

  const currentBalance = Number(wallet?.balance || 0);
  const totalCost = metrics.totalCost || dailyBudget * durationDays;
  const canAfford = currentBalance >= dailyBudget;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const token = getAuthToken();
    if (!token) {
      setStatusMsg({ text: 'Please sign in or create an account to run ad campaigns.', error: true });
      return;
    }

    if (!title || !description || !targetUrl || !mediaUrl) {
      setStatusMsg({ text: 'Please provide title, description, target link, and banner picture/video.', error: true });
      return;
    }

    if (!canAfford) {
      setStatusMsg({
        text: `Insufficient wallet balance. Launching this ad requires at least 1 day budget (${dailyBudget.toLocaleString()} RWF). Your balance is ${currentBalance.toLocaleString()} RWF.`,
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
          durationDays: targetMode === 'duration' ? durationDays : Math.max(1, Math.round(targetQuota / metrics.estimatedDailyImpressions)),
          cpmBid,
          cpcBid,
          targetQuota: targetMode === 'quota' ? targetQuota : undefined
        })
      });

      const data = await res.json();

      if (res.ok && data.success) {
        setStatusMsg({ text: data.message || '🎉 Campaign launched successfully!' });
        notificationSound.playNotificationChime();
        if (data.newBalance !== undefined) {
          updateWalletBalance(data.newBalance);
        } else {
          refreshMe();
        }
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/85 backdrop-blur-md animate-fadeIn select-none">
      <div className="relative w-full max-w-4xl bg-[#0E1524] text-white rounded-3xl shadow-2xl border border-amber-500/40 flex flex-col overflow-hidden max-h-[94vh] animate-scaleUp">
        
        {/* Top Header Bar */}
        <div className="px-5 py-3.5 bg-gradient-to-r from-amber-900/60 via-slate-900 to-[#0E1524] border-b border-slate-800 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-amber-500/20 text-amber-400">
              <Megaphone className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-black text-base sm:text-lg text-white flex items-center gap-2">
                <span>Self-Serve Advertising Studio</span>
                <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-amber-500 text-slate-950">
                  From 100 RWF
                </span>
              </h3>
              <p className="text-[11px] text-slate-400">Promote your brand, website, or social media across Videos, TV, Stories & Articles</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Central Wallet Strip */}
        <div className="px-5 py-2.5 bg-[#12192A] border-b border-slate-800 flex items-center justify-between text-xs shrink-0">
          <div className="flex items-center gap-2 text-slate-300">
            <Wallet className="w-4 h-4 text-emerald-400" />
            <span>Central Wallet: <strong className="text-emerald-400 font-black">{currentBalance.toLocaleString()} RWF</strong></span>
          </div>

          <button
            onClick={onOpenWallet}
            className="px-3 py-1 rounded-xl bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/30 text-emerald-400 text-[11px] font-bold transition-all"
          >
            + Top Up MoMo Wallet
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

        {/* Modal Content: 2-Column Responsive Layout (Form on Left, Multi-Format YouTube-style Preview on Right) */}
        <div className="flex-1 overflow-y-auto grid grid-cols-1 lg:grid-cols-12 gap-5 p-4 sm:p-6">
          
          {/* Left Column: Configuration Form (7 Cols) */}
          <form onSubmit={handleSubmit} className="lg:col-span-7 space-y-5">
            
            {/* Step 1: Creative & Content */}
            <div className="space-y-3">
              <h4 className="text-xs font-black uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5" />
                1. Creative & Banner Asset
              </h4>

              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-300">Headline / Business Title</label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Kigali Prime Tech Store — 20% Off MacBooks"
                  required
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-400"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-300">Ad Description / Pitch</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Describe your offer, products, or reason for users to click..."
                  rows={2}
                  required
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-400"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-300">Target Website, WhatsApp, or App Link</label>
                <input
                  type="url"
                  value={targetUrl}
                  onChange={(e) => setTargetUrl(e.target.value)}
                  placeholder="https://yourwebsite.com or https://wa.me/250788..."
                  required
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-400"
                />
              </div>

              {/* Upload Image / Enter URL */}
              <div className="space-y-2 pt-1">
                <div className="flex items-center justify-between text-[11px] font-bold text-slate-300">
                  <span>Banner Image or Short Clip</span>
                  <div className="flex items-center gap-2 text-[10px] text-amber-400">
                    <Crop className="w-3 h-3" />
                    <span>Auto-crops cleanly across placements</span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <label className="cursor-pointer px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-bold flex items-center gap-1.5 transition">
                    <Upload className="w-3.5 h-3.5 text-amber-400" />
                    <span>Upload Image</span>
                    <input
                      type="file"
                      accept="image/*,video/*"
                      onChange={handleFileUpload}
                      className="hidden"
                    />
                  </label>

                  <input
                    type="url"
                    value={mediaUrl}
                    onChange={(e) => setMediaUrl(e.target.value)}
                    placeholder="Or paste image/video URL..."
                    required
                    className="flex-1 bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-400"
                  />
                </div>

                {/* Cropping Fit Toggle */}
                <div className="flex items-center gap-3 text-[11px] pt-1">
                  <span className="text-slate-400 font-semibold">Image Crop Mode:</span>
                  <button
                    type="button"
                    onClick={() => setCropMode('cover')}
                    className={`px-2.5 py-0.5 rounded-lg text-[10px] font-bold transition ${
                      cropMode === 'cover' ? 'bg-amber-500 text-slate-950 font-black' : 'bg-slate-800 text-slate-400'
                    }`}
                  >
                    Smart Cover (Fill)
                  </button>
                  <button
                    type="button"
                    onClick={() => setCropMode('contain')}
                    className={`px-2.5 py-0.5 rounded-lg text-[10px] font-bold transition ${
                      cropMode === 'contain' ? 'bg-amber-500 text-slate-950 font-black' : 'bg-slate-800 text-slate-400'
                    }`}
                  >
                    Contain (Full Aspect)
                  </button>
                </div>
              </div>
            </div>

            {/* Step 2: Budget, Bidding & Duration (Minimum 100 RWF) */}
            <div className="space-y-3 pt-3 border-t border-slate-800">
              <h4 className="text-xs font-black uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
                <Target className="w-3.5 h-3.5" />
                2. Budget, Bidding & Priority (Starts from 100 RWF)
              </h4>

              {/* Quick Daily Budget Presets */}
              <div className="space-y-1.5">
                <div className="flex justify-between text-[11px]">
                  <span className="font-bold text-slate-300">Daily Budget (Starts from 100 RWF):</span>
                  <span className="font-black text-emerald-400">{dailyBudget.toLocaleString()} RWF / day</span>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  {[100, 250, 500, 1000, 2500, 5000].map((preset) => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => setDailyBudget(preset)}
                      className={`px-3 py-1 rounded-xl text-xs font-bold transition ${
                        dailyBudget === preset
                          ? 'bg-emerald-500 text-slate-950 font-black shadow-md'
                          : 'bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-700'
                      }`}
                    >
                      {preset.toLocaleString()} RWF
                    </button>
                  ))}
                  <input
                    type="number"
                    min="100"
                    step="50"
                    value={dailyBudget}
                    onChange={(e) => setDailyBudget(Math.max(100, parseInt(e.target.value) || 100))}
                    className="w-24 px-2.5 py-1 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white font-bold text-center"
                    placeholder="Custom"
                  />
                </div>
              </div>

              {/* Bidding Controls: CPM & CPC */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                {/* CPM Bidding */}
                <div className="p-3 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-2">
                  <div className="flex justify-between items-center text-[11px]">
                    <span className="font-bold text-slate-300">CPM (Per 1,000 Views):</span>
                    <div className="flex items-center gap-1.5">
                      <input
                        type="number"
                        min="10"
                        value={cpmBid}
                        onChange={(e) => setCpmBid(Math.max(10, parseInt(e.target.value) || 10))}
                        className="w-16 px-1.5 py-0.5 bg-slate-800 border border-slate-700 rounded text-[11px] font-black text-amber-400 text-right outline-none"
                      />
                      <span className="font-bold text-amber-400">RWF</span>
                    </div>
                  </div>
                  <input
                    type="range"
                    min="10"
                    max="1000"
                    step="5"
                    value={Math.min(1000, cpmBid)}
                    onChange={(e) => setCpmBid(parseInt(e.target.value))}
                    className="w-full accent-amber-500 cursor-pointer"
                  />
                  <div className="flex items-center justify-between text-[10px] text-slate-400">
                    <span>Higher bid = priority rotation</span>
                    <span>Max: 1,000 RWF</span>
                  </div>
                </div>

                {/* CPC Bidding */}
                <div className="p-3 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-2">
                  <div className="flex justify-between items-center text-[11px]">
                    <span className="font-bold text-slate-300">CPC (Per Verified Click):</span>
                    <div className="flex items-center gap-1.5">
                      <input
                        type="number"
                        min="5"
                        value={cpcBid}
                        onChange={(e) => setCpcBid(Math.max(5, parseInt(e.target.value) || 5))}
                        className="w-16 px-1.5 py-0.5 bg-slate-800 border border-slate-700 rounded text-[11px] font-black text-purple-400 text-right outline-none"
                      />
                      <span className="font-bold text-purple-400">RWF</span>
                    </div>
                  </div>
                  <input
                    type="range"
                    min="5"
                    max="1000"
                    step="5"
                    value={Math.min(1000, cpcBid)}
                    onChange={(e) => setCpcBid(parseInt(e.target.value))}
                    className="w-full accent-purple-500 cursor-pointer"
                  />
                  <div className="flex items-center justify-between text-[10px] text-slate-400">
                    <span>Deducted only on verified link clicks</span>
                    <span>Max: 1,000 RWF</span>
                  </div>
                </div>
              </div>

              {/* Priority Weight Badge */}
              <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-between text-xs">
                <span className="text-amber-300 font-bold flex items-center gap-1.5">
                  <Flame className="w-4 h-4 text-amber-400" />
                  Delivery Priority Weight:
                </span>
                <span className="font-mono font-black text-white">
                  {cpmBid >= 35 ? '🔥 High Priority' : cpmBid >= 20 ? '⚡ Standard Speed' : '🐢 Data-Saver Pace'}
                </span>
              </div>

              {/* Duration or Target Quota Mode */}
              <div className="space-y-2 pt-1">
                <div className="flex items-center gap-3 text-xs font-bold">
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="radio"
                      name="targetMode"
                      checked={targetMode === 'duration'}
                      onChange={() => setTargetMode('duration')}
                      className="accent-amber-500"
                    />
                    <span>Run for Duration (Days)</span>
                  </label>
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="radio"
                      name="targetMode"
                      checked={targetMode === 'quota'}
                      onChange={() => setTargetMode('quota')}
                      className="accent-amber-500"
                    />
                    <span>Target Total Impressions</span>
                  </label>
                </div>

                {targetMode === 'duration' ? (
                  <div className="space-y-1">
                    <div className="flex justify-between text-[11px]">
                      <span className="font-bold text-slate-300">Campaign Duration:</span>
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
                ) : (
                  <div className="space-y-1">
                    <div className="flex justify-between text-[11px]">
                      <span className="font-bold text-slate-300">Target Impression Goal:</span>
                      <span className="font-black text-amber-400">{targetQuota.toLocaleString()} Views</span>
                    </div>
                    <div className="flex items-center gap-2">
                      {[1000, 5000, 10000, 25000, 50000].map((q) => (
                        <button
                          key={q}
                          type="button"
                          onClick={() => setTargetQuota(q)}
                          className={`px-2.5 py-1 rounded-xl text-xs font-bold transition ${
                            targetQuota === q ? 'bg-amber-500 text-slate-950 font-black' : 'bg-slate-900 text-slate-300 border border-slate-700'
                          }`}
                        >
                          {(q / 1000).toFixed(0)}K
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Step 3: Historical Projections & Comparison */}
            <div className="p-4 rounded-2xl bg-gradient-to-br from-indigo-950/60 to-slate-900 border border-indigo-500/30 space-y-3">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-indigo-300 flex items-center gap-1.5">
                  <TrendingUp className="w-4 h-4 text-emerald-400" />
                  Historical Platform Intelligence & Projections
                </span>
                <span className="text-[10px] text-slate-400 font-mono">Benchmark CTR: ~4.4%</span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center">
                <div className="p-2.5 rounded-xl bg-slate-900/80 border border-slate-800">
                  <p className="text-[10px] text-slate-400">Est. Daily Views</p>
                  <p className="text-sm font-black text-white">~{metrics.estimatedDailyImpressions.toLocaleString()}</p>
                </div>
                <div className="p-2.5 rounded-xl bg-slate-900/80 border border-slate-800">
                  <p className="text-[10px] text-slate-400">Est. Daily Clicks</p>
                  <p className="text-sm font-black text-emerald-400">~{metrics.estimatedDailyClicks.toLocaleString()}</p>
                </div>
                <div className="p-2.5 rounded-xl bg-slate-900/80 border border-slate-800">
                  <p className="text-[10px] text-slate-400">Total Campaign Views</p>
                  <p className="text-sm font-black text-white">~{metrics.totalImpressions.toLocaleString()}</p>
                </div>
                <div className="p-2.5 rounded-xl bg-slate-900/80 border border-slate-800">
                  <p className="text-[10px] text-slate-400">Total Campaign Clicks</p>
                  <p className="text-sm font-black text-amber-400">~{metrics.totalClicks.toLocaleString()}</p>
                </div>
              </div>

              <p className="text-[11px] text-indigo-200 leading-relaxed bg-indigo-900/20 p-2.5 rounded-xl border border-indigo-500/20">
                💡 {metrics.historyInsight}
              </p>
            </div>

            {/* Launch Action */}
            <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="text-left">
                <span className="text-[11px] text-slate-400 block">Total Campaign Budget:</span>
                <span className="text-xl font-black text-white">
                  {totalCost.toLocaleString()} <span className="text-xs text-amber-400">RWF</span>
                </span>
              </div>

              <button
                type="submit"
                disabled={loading}
                className={`w-full sm:w-auto px-6 py-3 rounded-2xl font-black text-xs shadow-lg transition-all ${
                  canAfford
                    ? 'bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-600 hover:from-amber-400 hover:to-yellow-300 text-slate-950 shadow-amber-500/25 active:scale-95'
                    : 'bg-slate-800 text-slate-400 hover:text-white border border-slate-700'
                }`}
              >
                {loading ? 'Launching Ad...' : canAfford ? '🚀 Launch Ad Campaign' : 'Deposit via MoMo to Launch'}
              </button>
            </div>

          </form>

          {/* Right Column: Multi-Format Live Preview Carousel (YouTube Banner Preview Style!) (5 Cols) */}
          <div className="lg:col-span-5 bg-[#090D16] p-4 rounded-3xl border border-slate-800 flex flex-col justify-between space-y-4">
            
            {/* Preview Format Selector Tabs */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black uppercase text-amber-400 flex items-center gap-1">
                  <Eye className="w-3.5 h-3.5" />
                  Live Responsive Format Preview
                </span>
                <span className="text-[10px] text-slate-400">YouTube style</span>
              </div>

              <div className="grid grid-cols-3 sm:grid-cols-5 gap-1 bg-slate-900 p-1 rounded-2xl border border-slate-800 text-[10px] font-bold">
                <button
                  type="button"
                  onClick={() => setPreviewTab('video')}
                  className={`py-1.5 rounded-xl transition text-center truncate px-1 ${
                    previewTab === 'video' ? 'bg-amber-500 text-slate-950 font-black' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  🎬 Video
                </button>
                <button
                  type="button"
                  onClick={() => setPreviewTab('story')}
                  className={`py-1.5 rounded-xl transition text-center truncate px-1 ${
                    previewTab === 'story' ? 'bg-amber-500 text-slate-950 font-black' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  📱 Story
                </button>
                <button
                  type="button"
                  onClick={() => setPreviewTab('sidebar')}
                  className={`py-1.5 rounded-xl transition text-center truncate px-1 ${
                    previewTab === 'sidebar' ? 'bg-amber-500 text-slate-950 font-black' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  ✨ Sidebar
                </button>
                <button
                  type="button"
                  onClick={() => setPreviewTab('article')}
                  className={`py-1.5 rounded-xl transition text-center truncate px-1 ${
                    previewTab === 'article' ? 'bg-amber-500 text-slate-950 font-black' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  📰 Article
                </button>
                <button
                  type="button"
                  onClick={() => setPreviewTab('tv')}
                  className={`py-1.5 rounded-xl transition text-center truncate px-1 ${
                    previewTab === 'tv' ? 'bg-amber-500 text-slate-950 font-black' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  📺 TV/Radio
                </button>
              </div>
            </div>

            {/* Screen Mockup Viewport */}
            <div className="flex-1 min-h-[320px] bg-black/60 rounded-2xl border border-slate-800/80 p-3 flex flex-col justify-center items-center overflow-hidden relative">
              
              {/* 1. In-Stream Video Ad Format Preview */}
              {previewTab === 'video' && (
                <div className="w-full aspect-video rounded-2xl overflow-hidden bg-slate-950 border border-slate-800 relative flex flex-col justify-between p-3 shadow-xl">
                  {/* Mock Background Stream */}
                  <img
                    src="https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=600&auto=format&fit=crop&q=80"
                    alt="Stream"
                    className="absolute inset-0 w-full h-full object-cover opacity-25 filter blur-[1px]"
                  />
                  <div className="relative z-10 flex items-center justify-between">
                    <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded bg-amber-500 text-slate-950">
                      Ad • 0:10
                    </span>
                    <span className="text-[10px] text-white/80 font-mono">Reward: 10 RWF</span>
                  </div>

                  {/* Floating Ad Card Overlay */}
                  <div className="relative z-10 p-2.5 rounded-xl bg-black/85 backdrop-blur-md border border-white/20 flex items-center justify-between gap-2 shadow-2xl">
                    <div className="flex items-center gap-2 min-w-0">
                      <img
                        src={mediaUrl || '/logo.png'}
                        alt={title}
                        className={`w-9 h-9 rounded-lg border border-amber-500/40 shrink-0 ${
                          cropMode === 'contain' ? 'object-contain bg-slate-900' : 'object-cover'
                        }`}
                        onError={(e) => { (e.currentTarget as HTMLImageElement).src = '/logo.png'; }}
                      />
                      <div className="min-w-0">
                        <h5 className="font-extrabold text-xs text-white truncate">{title || 'Your Ad Headline'}</h5>
                        <p className="text-[10px] text-slate-300 truncate">{description || 'Ad description appears here'}</p>
                      </div>
                    </div>
                    <span className="px-2.5 py-1 rounded-lg bg-amber-500 text-slate-950 text-[10px] font-black shrink-0 flex items-center gap-1 shadow">
                      <span>Visit</span>
                      <ExternalLink className="w-2.5 h-2.5" />
                    </span>
                  </div>
                </div>
              )}

              {/* 2. Story Ad Format Preview */}
              {previewTab === 'story' && (
                <div className="w-44 h-80 rounded-2xl overflow-hidden bg-slate-950 border border-slate-800 relative flex flex-col justify-between p-2 shadow-2xl">
                  {/* Mock Story Media */}
                  <img
                    src={mediaUrl || '/logo.png'}
                    alt="Story"
                    className={`absolute inset-0 w-full h-full ${
                      cropMode === 'contain' ? 'object-contain bg-slate-900' : 'object-cover'
                    }`}
                    onError={(e) => { (e.currentTarget as HTMLImageElement).src = '/logo.png'; }}
                  />
                  <div className="relative z-10 w-full bg-white/30 h-1 rounded-full overflow-hidden">
                    <div className="w-2/3 h-full bg-white" />
                  </div>

                  {/* Story Mini Ad Strip */}
                  <div className="relative z-10 p-2 rounded-xl bg-black/85 backdrop-blur-md border border-white/20 flex items-center justify-between gap-1 shadow-lg">
                    <div className="min-w-0">
                      <span className="text-[8px] font-black uppercase text-amber-400">Sponsored</span>
                      <p className="text-[10px] font-bold text-white truncate">{title || 'Ad Headline'}</p>
                    </div>
                    <span className="px-2 py-0.5 rounded bg-amber-500 text-slate-950 text-[9px] font-black shrink-0">
                      Open
                    </span>
                  </div>
                </div>
              )}

              {/* 3. Sidebar Recommendation Card Preview */}
              {previewTab === 'sidebar' && (
                <div className="w-full p-2.5 rounded-2xl bg-[#131926] border border-amber-500/40 flex items-center gap-3 shadow-lg">
                  <div className="relative w-24 aspect-video rounded-xl bg-slate-900 overflow-hidden shrink-0">
                    <img
                      src={mediaUrl || '/logo.png'}
                      alt="Thumbnail"
                      className={`w-full h-full ${cropMode === 'contain' ? 'object-contain' : 'object-cover'}`}
                      onError={(e) => { (e.currentTarget as HTMLImageElement).src = '/logo.png'; }}
                    />
                    <span className="absolute bottom-1 right-1 px-1 rounded bg-black/80 text-[8px] font-black text-amber-400">
                      Ad
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <h5 className="text-xs font-bold text-white line-clamp-1">{title || 'Campaign Title'}</h5>
                    <p className="text-[10px] text-slate-400 line-clamp-1 mt-0.5">{description || 'Ad description'}</p>
                    <span className="text-[9px] text-amber-400 font-extrabold mt-1 block">Sponsored Promotion</span>
                  </div>
                </div>
              )}

              {/* 4. Editorial Article In-Feed Banner Preview */}
              {previewTab === 'article' && (
                <div className="w-full p-3 rounded-2xl bg-gradient-to-r from-slate-900 to-[#12192A] border border-slate-700/80 flex items-center justify-between gap-3 shadow-md">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <img
                      src={mediaUrl || '/logo.png'}
                      alt="Article ad"
                      className={`w-12 h-12 rounded-xl border border-slate-700 shrink-0 ${
                        cropMode === 'contain' ? 'object-contain bg-slate-900' : 'object-cover'
                      }`}
                      onError={(e) => { (e.currentTarget as HTMLImageElement).src = '/logo.png'; }}
                    />
                    <div className="min-w-0">
                      <span className="text-[8px] font-black uppercase text-amber-400 bg-amber-500/15 px-1.5 py-0.2 rounded border border-amber-500/30">
                        Sponsored Article
                      </span>
                      <h5 className="text-xs font-bold text-white truncate mt-0.5">{title || 'Special Feature'}</h5>
                      <p className="text-[10px] text-slate-400 truncate">{description || 'Read full announcement'}</p>
                    </div>
                  </div>
                  <span className="px-3 py-1.5 rounded-xl bg-amber-500 text-slate-950 font-black text-[10px] shrink-0">
                    Explore
                  </span>
                </div>
              )}

              {/* 5. TV / Radio Companion Ticker Preview */}
              {previewTab === 'tv' && (
                <div className="w-full p-2.5 rounded-xl bg-[#0F172A] border border-amber-500/30 flex items-center justify-between gap-2 shadow-lg">
                  <div className="flex items-center gap-2 min-w-0">
                    <Tv className="w-4 h-4 text-amber-400 shrink-0" />
                    <div className="min-w-0">
                      <span className="text-[9px] text-amber-400 font-black uppercase">Live Broadcast Sponsor • </span>
                      <span className="text-xs font-bold text-white truncate">{title || 'Brand Headline'}</span>
                    </div>
                  </div>
                  <span className="px-2.5 py-1 rounded-lg bg-amber-500 text-slate-950 text-[10px] font-black shrink-0">
                    Learn More
                  </span>
                </div>
              )}

            </div>

            {/* Placement Distribution Guarantee */}
            <div className="p-3 bg-slate-900/80 rounded-2xl border border-slate-800 text-[11px] text-slate-400 space-y-1">
              <span className="font-extrabold text-white flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                Guaranteed Multi-Channel Exposure:
              </span>
              <p className="text-[10px] text-slate-400">
                Your ad is automatically distributed in rotation (1 custom ad per 2 AdSense ads) across Videos, Stories, TV channels, Radio stations, and Article feeds!
              </p>
            </div>

          </div>

        </div>

      </div>
    </div>
  );
};
