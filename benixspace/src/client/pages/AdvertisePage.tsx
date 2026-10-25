import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { SeoHead } from '../components/common/SeoHead';
import {
  Megaphone,
  Upload,
  ArrowRight,
  Sparkles,
  TrendingUp,
  Eye,
  MousePointerClick,
  CheckCircle2,
  Clock,
  ExternalLink,
  Wallet,
  Play,
  Film,
  Tv,
  Newspaper,
  Layers,
  Info,
  ArrowLeft
} from 'lucide-react';
import { notificationSound } from '../utils/notificationSound';

const BUDGET_PRESETS = [100, 250, 500, 1000, 2500, 5000];

export const AdvertisePage: React.FC = () => {
  const navigate = useNavigate();
  const { user, wallet, token, updateWalletBalance, refreshMe } = useAuth();
  const { t } = useLanguage();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [targetUrl, setTargetUrl] = useState('');
  const [ctaText, setCtaText] = useState('Learn More');
  const [mediaType, setMediaType] = useState<'image' | 'video'>('image');
  const [mediaUrl, setMediaUrl] = useState('https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=800&auto=format&fit=crop&q=80');
  const [targetAudience, setTargetAudience] = useState<'all' | 'kigali' | 'youth' | 'business'>('all');
  const [dailyBudget, setDailyBudget] = useState<number>(100);
  const [durationDays, setDurationDays] = useState<number>(7);
  const [cpmBid, setCpmBid] = useState<number>(20);
  const [cpcBid, setCpcBid] = useState<number>(15);
  const [targetMode, setTargetMode] = useState<'duration' | 'quota'>('duration');
  const [targetQuota, setTargetQuota] = useState<number>(1000);
  const [cropMode, setCropMode] = useState<'cover' | 'contain'>('cover');
  const [activePreviewFormat, setActivePreviewFormat] = useState<'story' | 'video' | 'tv' | 'article' | 'recommendation'>('story');

  const [loading, setLoading] = useState(false);
  const [statusMsg, setStatusMsg] = useState<{ text: string; error?: boolean } | null>(null);

  const [metrics, setMetrics] = useState({
    estimatedDailyImpressions: 5000,
    estimatedDailyClicks: 220,
    totalImpressions: 35000,
    totalClicks: 1540,
    estimatedCtr: 4.4,
    totalCost: 700
  });

  // Calculate dynamic metrics
  useEffect(() => {
    const estDailyImp = Math.round((dailyBudget / cpmBid) * 1000);
    const estDailyClicks = Math.round((dailyBudget / (cpcBid * 2)));
    const days = targetMode === 'duration' ? durationDays : Math.max(1, Math.round(targetQuota / Math.max(1, estDailyImp)));
    const totalCost = dailyBudget * days;
    const totalImp = targetMode === 'quota' ? targetQuota : estDailyImp * days;
    const totalClicks = estDailyClicks * days;

    setMetrics({
      estimatedDailyImpressions: estDailyImp,
      estimatedDailyClicks: estDailyClicks,
      totalImpressions: totalImp,
      totalClicks: totalClicks,
      estimatedCtr: totalImp > 0 ? Number(((totalClicks / totalImp) * 100).toFixed(1)) : 4.4,
      totalCost
    });
  }, [dailyBudget, durationDays, cpmBid, cpcBid, targetMode, targetQuota]);

  // Client-side automatic Canvas image compressor (prevents 403 Forbidden / ERR_CONNECTION_RESET)
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.type.startsWith('video/')) {
      setMediaType('video');
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) setMediaUrl(event.target.result as string);
      };
      reader.readAsDataURL(file);
      return;
    }

    setMediaType('image');
    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;
        const maxDim = 1200;
        if (width > maxDim || height > maxDim) {
          if (width > height) {
            height = Math.round((height * maxDim) / width);
            width = maxDim;
          } else {
            width = Math.round((width * maxDim) / height);
            height = maxDim;
          }
        }
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx?.drawImage(img, 0, 0, width, height);
        // Compressed JPEG base64 (~80KB - 150KB)
        const compressed = canvas.toDataURL('image/jpeg', 0.82);
        setMediaUrl(compressed);
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  const currentBalance = Number(wallet?.balance || 0);
  const canAfford = currentBalance >= dailyBudget;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const authToken = token || localStorage.getItem('token');
    if (!authToken) {
      setStatusMsg({ text: 'Please sign in to launch ad campaigns.', error: true });
      return;
    }

    if (!title || !description || !targetUrl || !mediaUrl) {
      setStatusMsg({ text: 'Please provide headline, description, destination URL, and image.', error: true });
      return;
    }

    if (!canAfford) {
      setStatusMsg({
        text: `Insufficient wallet balance. Launching this ad requires at least 1 day budget of ${dailyBudget.toLocaleString()} RWF. Your current balance is ${currentBalance.toLocaleString()} RWF.`,
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
          Authorization: `Bearer ${authToken}`
        },
        body: JSON.stringify({
          title,
          description,
          targetUrl,
          mediaType,
          mediaUrl,
          targetAudience,
          dailyBudget,
          durationDays: targetMode === 'duration' ? durationDays : Math.max(1, Math.round(targetQuota / Math.max(1, metrics.estimatedDailyImpressions))),
          cpmBid,
          cpcBid,
          targetQuota: targetMode === 'quota' ? targetQuota : undefined
        })
      });

      const data = await res.json();

      if (res.ok && data.success) {
        setStatusMsg({ text: data.message || '🎉 Ad campaign launched successfully!' });
        notificationSound.playNotificationChime();
        if (data.newBalance !== undefined) {
          updateWalletBalance(data.newBalance);
        } else {
          refreshMe();
        }
        setTimeout(() => {
          navigate('/dashboard#ads');
        }, 1500);
      } else {
        setStatusMsg({ text: data.message || data.error || 'Failed to launch campaign', error: true });
      }
    } catch (err: any) {
      console.error('Submit ad error:', err);
      setStatusMsg({ text: 'Network connection failed. Please try again.', error: true });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0B0E14] text-white py-8 font-sans">
      <SeoHead
        title="Self-Serve Advertising Studio — BenixSpace"
        description="Broadcast your ads across Rwandan TV, Videos, Stories, and Articles. Budgets from 100 RWF."
      />

      <div className="w-full max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        
        {/* Navigation Breadcrumb */}
        <div className="flex items-center justify-between">
          <Link
            to="/"
            className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 hover:text-white text-xs font-bold transition-all hover:scale-105 shadow-sm"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Home</span>
          </Link>

          <Link
            to="/dashboard#ads"
            className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-amber-300 hover:text-amber-200 text-xs font-bold transition-all shadow-sm"
          >
            <TrendingUp className="w-4 h-4 text-amber-400" />
            <span>My Live Campaigns & Analytics →</span>
          </Link>
        </div>

        {/* Studio Top Banner */}
        <div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-r from-[#141C2E] via-[#101726] to-[#0D121F] border border-amber-500/30 shadow-2xl flex flex-col md:flex-row items-start md:items-center justify-between gap-6 relative overflow-hidden">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="p-2.5 rounded-2xl bg-amber-500/20 text-amber-400">
                <Megaphone className="w-6 h-6" />
              </span>
              <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                Self-Serve Advertising Studio
              </h1>
              <span className="text-[10px] uppercase font-black px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40">
                Starts from 100 RWF
              </span>
            </div>
            <p className="text-xs text-slate-300 max-w-2xl leading-relaxed">
              Target viewers across Rwandan live TV, creator videos, 24/7 radio, stories, and articles. Bids start from 100 RWF daily budget with automated wallet deduction per real impression and click.
            </p>
          </div>

          <div className="flex items-center gap-3 w-full md:w-auto">
            <div className="p-3.5 rounded-2xl bg-[#0B0E14] border border-slate-800 flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
                <Wallet className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[10px] text-slate-400 uppercase font-bold block">Central Wallet</span>
                <span className="text-base font-black text-white">{currentBalance.toLocaleString()} RWF</span>
              </div>
            </div>
            <button
              onClick={() => navigate('/dashboard#wallet')}
              className="px-4 py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-md transition-all shrink-0"
            >
              + Top Up
            </button>
          </div>
        </div>

        {statusMsg && (
          <div className={`p-4 rounded-2xl border text-xs font-bold flex items-center gap-2 shadow-lg ${
            statusMsg.error
              ? 'bg-rose-500/20 border-rose-500/40 text-rose-300'
              : 'bg-emerald-500/20 border-emerald-500/40 text-emerald-300'
          }`}>
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{statusMsg.text}</span>
          </div>
        )}

        {/* 2-Column Responsive Layout: Left Form | Right Compact Preview */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* LEFT: Campaign Builder Form */}
          <form onSubmit={handleSubmit} className="lg:col-span-7 space-y-6">
            
            {/* Step 1: Creative & Banner Asset */}
            <div className="p-6 rounded-3xl bg-[#121824] border border-slate-800 space-y-4 shadow-xl">
              <div className="flex items-center gap-2 text-xs font-black uppercase text-amber-400 tracking-wider">
                <Sparkles className="w-4 h-4" />
                <span>1. Creative & Banner Asset</span>
              </div>

              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">Headline / Brand Name</label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="E.g., Kigali Prime Tech Store — 20% Off MacBooks"
                    className="w-full px-4 py-2.5 bg-slate-900 border border-slate-700/80 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-400"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">Ad Description / Pitch</label>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    rows={2}
                    placeholder="Describe your offer, products, discounts, or reason for users to click..."
                    className="w-full px-4 py-2 bg-slate-900 border border-slate-700/80 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-400"
                    required
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-1">Destination URL / WhatsApp</label>
                    <input
                      type="url"
                      value={targetUrl}
                      onChange={(e) => setTargetUrl(e.target.value)}
                      placeholder="https://yourstore.rw or https://wa.me/25078..."
                      className="w-full px-4 py-2.5 bg-slate-900 border border-slate-700/80 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-400"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-1">Call To Action (CTA)</label>
                    <select
                      value={ctaText}
                      onChange={(e) => setCtaText(e.target.value)}
                      className="w-full px-4 py-2.5 bg-slate-900 border border-slate-700/80 rounded-xl text-xs text-white focus:outline-none focus:border-amber-400"
                    >
                      <option value="Learn More">Learn More</option>
                      <option value="Shop Now">Shop Now</option>
                      <option value="Order on WhatsApp">Order on WhatsApp</option>
                      <option value="Subscribe">Subscribe</option>
                      <option value="Watch Video">Watch Video</option>
                      <option value="Book Now">Book Now</option>
                    </select>
                  </div>
                </div>

                {/* Banner Upload */}
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">Banner Image or Short Clip</label>
                  <div className="flex items-center gap-3">
                    <label className="px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-black text-xs font-black cursor-pointer inline-flex items-center gap-2 shadow-md transition-all">
                      <Upload className="w-4 h-4" />
                      <span>Upload Banner Image</span>
                      <input type="file" accept="image/*,video/*" onChange={handleFileUpload} className="hidden" />
                    </label>
                    <span className="text-[11px] text-slate-400">
                      Auto-resized & optimized for instant loading.
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Step 2: Budget, Bidding & Duration */}
            <div className="p-6 rounded-3xl bg-[#121824] border border-slate-800 space-y-4 shadow-xl">
              <div className="flex items-center gap-2 text-xs font-black uppercase text-amber-400 tracking-wider">
                <TrendingUp className="w-4 h-4" />
                <span>2. Budget, Bidding & Target</span>
              </div>

              {/* Preset Budget Chips starting from 100 RWF */}
              <div className="space-y-2">
                <label className="block text-xs font-bold text-slate-300">
                  Daily Budget (Minimum 100 RWF)
                </label>
                <div className="flex flex-wrap gap-2">
                  {BUDGET_PRESETS.map((amount) => (
                    <button
                      key={amount}
                      type="button"
                      onClick={() => setDailyBudget(amount)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all ${
                        dailyBudget === amount
                          ? 'bg-amber-500 text-black shadow-md'
                          : 'bg-slate-900 border border-slate-700/80 text-slate-300 hover:text-white'
                      }`}
                    >
                      {amount.toLocaleString()} RWF
                    </button>
                  ))}
                  <div className="flex items-center gap-1 bg-slate-900 border border-slate-700/80 rounded-xl px-2.5 py-1">
                    <input
                      type="number"
                      min={100}
                      step={50}
                      value={dailyBudget}
                      onChange={(e) => setDailyBudget(Math.max(100, Number(e.target.value) || 100))}
                      className="w-20 bg-transparent text-xs font-bold text-white outline-none"
                    />
                    <span className="text-[10px] text-slate-400 font-bold">RWF</span>
                  </div>
                </div>
              </div>

              {/* CPM & CPC Sliders & Custom Inputs */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                <div className="p-3.5 rounded-2xl bg-[#0B0E14] border border-slate-800 space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-400 font-semibold">CPM (Per 1,000 Views)</span>
                    <div className="flex items-center gap-1.5">
                      <input
                        type="number"
                        min={10}
                        value={cpmBid}
                        onChange={(e) => setCpmBid(Math.max(10, Number(e.target.value) || 10))}
                        className="w-20 px-2 py-1 bg-slate-900 border border-slate-700 focus:border-amber-500 rounded-lg text-xs font-black text-amber-400 text-right outline-none"
                      />
                      <span className="text-xs font-bold text-amber-400">RWF</span>
                    </div>
                  </div>
                  <input
                    type="range"
                    min={10}
                    max={1000}
                    step={5}
                    value={Math.min(1000, cpmBid)}
                    onChange={(e) => setCpmBid(Number(e.target.value))}
                    className="w-full accent-amber-500 cursor-pointer"
                  />
                  <div className="flex items-center justify-between text-[10px] text-slate-500">
                    <span>Higher bids give priority display in rotation</span>
                    <span>Max slider: 1,000 RWF</span>
                  </div>
                </div>

                <div className="p-3.5 rounded-2xl bg-[#0B0E14] border border-slate-800 space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-400 font-semibold">CPC (Per Verified Click)</span>
                    <div className="flex items-center gap-1.5">
                      <input
                        type="number"
                        min={5}
                        value={cpcBid}
                        onChange={(e) => setCpcBid(Math.max(5, Number(e.target.value) || 5))}
                        className="w-20 px-2 py-1 bg-slate-900 border border-slate-700 focus:border-purple-500 rounded-lg text-xs font-black text-purple-400 text-right outline-none"
                      />
                      <span className="text-xs font-bold text-purple-400">RWF</span>
                    </div>
                  </div>
                  <input
                    type="range"
                    min={5}
                    max={1000}
                    step={5}
                    value={Math.min(1000, cpcBid)}
                    onChange={(e) => setCpcBid(Number(e.target.value))}
                    className="w-full accent-purple-500 cursor-pointer"
                  />
                  <div className="flex items-center justify-between text-[10px] text-slate-500">
                    <span>Only deducted when a viewer clicks your link</span>
                    <span>Max slider: 1,000 RWF</span>
                  </div>
                </div>
              </div>

              {/* Target Mode: Duration vs Target Quota */}
              <div className="pt-2 space-y-3">
                <div className="flex items-center gap-3 text-xs">
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="radio"
                      name="targetMode"
                      checked={targetMode === 'duration'}
                      onChange={() => setTargetMode('duration')}
                      className="accent-amber-500"
                    />
                    <span className="font-bold text-slate-200">Run for Duration (Days)</span>
                  </label>
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="radio"
                      name="targetMode"
                      checked={targetMode === 'quota'}
                      onChange={() => setTargetMode('quota')}
                      className="accent-amber-500"
                    />
                    <span className="font-bold text-slate-200">Target Impression Quota</span>
                  </label>
                </div>

                {targetMode === 'duration' ? (
                  <div className="flex items-center gap-2">
                    {[3, 7, 14, 30].map((d) => (
                      <button
                        key={d}
                        type="button"
                        onClick={() => setDurationDays(d)}
                        className={`px-3 py-1 rounded-xl text-xs font-bold ${
                          durationDays === d ? 'bg-amber-500 text-black' : 'bg-slate-900 border border-slate-800 text-slate-400'
                        }`}
                      >
                        {d} Days
                      </button>
                    ))}
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    {[500, 1000, 2500, 5000, 10000].map((q) => (
                      <button
                        key={q}
                        type="button"
                        onClick={() => setTargetQuota(q)}
                        className={`px-3 py-1 rounded-xl text-xs font-bold ${
                          targetQuota === q ? 'bg-amber-500 text-black' : 'bg-slate-900 border border-slate-800 text-slate-400'
                        }`}
                      >
                        {q.toLocaleString()} Views
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Launch Action */}
            <div className="p-6 rounded-3xl bg-gradient-to-r from-[#141C2E] to-[#0F1422] border border-amber-500/30 flex items-center justify-between gap-4">
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Total Estimated Campaign Spend</span>
                <span className="text-xl font-black text-white">{metrics.totalCost.toLocaleString()} RWF</span>
                <span className="text-[10px] text-emerald-400 font-bold block mt-0.5">
                  Deposit deducted: {dailyBudget.toLocaleString()} RWF
                </span>
              </div>

              <button
                type="submit"
                disabled={loading || !canAfford}
                className="px-6 py-3 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-black font-black text-xs shadow-xl shadow-amber-500/20 flex items-center gap-2 transition-all hover:scale-105 active:scale-95 disabled:opacity-50"
              >
                <Megaphone className="w-4 h-4 stroke-[2.5]" />
                <span>{loading ? 'Launching Campaign...' : 'Launch Ad Campaign'}</span>
              </button>
            </div>

          </form>

          {/* RIGHT: Compact Multi-Placement Live Preview */}
          <div className="lg:col-span-5 sticky top-20 space-y-4">
            
            <div className="p-5 rounded-3xl bg-[#121824] border border-slate-800 shadow-2xl space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div className="flex items-center gap-2">
                  <Eye className="w-4 h-4 text-amber-400" />
                  <h3 className="font-extrabold text-sm text-white">Live Placement Preview</h3>
                </div>
                <div className="flex items-center gap-1 text-[10px]">
                  <button
                    type="button"
                    onClick={() => setCropMode('cover')}
                    className={`px-2 py-0.5 rounded font-bold ${cropMode === 'cover' ? 'bg-amber-500 text-black' : 'text-slate-400'}`}
                  >
                    Cover
                  </button>
                  <button
                    type="button"
                    onClick={() => setCropMode('contain')}
                    className={`px-2 py-0.5 rounded font-bold ${cropMode === 'contain' ? 'bg-amber-500 text-black' : 'text-slate-400'}`}
                  >
                    Fit
                  </button>
                </div>
              </div>

              {/* Placement Selector Tabs */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
                {[
                  { id: 'story', label: '📱 Story', icon: Film },
                  { id: 'video', label: '🎬 Video', icon: Play },
                  { id: 'tv', label: '📺 TV & Radio', icon: Tv },
                  { id: 'article', label: '📰 Article', icon: Newspaper },
                  { id: 'recommendation', label: '✨ Sidebar', icon: Layers }
                ].map((fmt) => (
                  <button
                    key={fmt.id}
                    type="button"
                    onClick={() => setActivePreviewFormat(fmt.id as any)}
                    className={`px-2.5 py-1 rounded-xl text-[11px] font-bold shrink-0 transition-all ${
                      activePreviewFormat === fmt.id
                        ? 'bg-amber-500 text-black font-black'
                        : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
                    }`}
                  >
                    {fmt.label}
                  </button>
                ))}
              </div>

              {/* Compact Preview Card Container */}
              <div className="bg-[#0B0E14] rounded-2xl p-3 border border-slate-800 min-h-[300px] flex flex-col justify-center">
                
                {/* 1. Story Preview (Compact 9:16 aspect) */}
                {activePreviewFormat === 'story' && (
                  <div className="relative mx-auto w-52 h-80 rounded-2xl overflow-hidden bg-slate-950 border border-slate-700 shadow-xl flex flex-col justify-between p-3">
                    <img
                      src={mediaUrl || '/logo.png'}
                      alt="Story preview"
                      className={`absolute inset-0 w-full h-full ${cropMode === 'cover' ? 'object-cover' : 'object-contain'}`}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-black/60 pointer-events-none" />

                    {/* Top Creator Tag */}
                    <div className="relative z-10 flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-blue-600 flex items-center justify-center text-[10px] font-bold text-white">
                        B
                      </div>
                      <span className="text-[11px] font-bold text-white truncate">
                        {user?.name || 'Benix Creator'}
                      </span>
                      <span className="ml-auto text-[8px] bg-amber-500 text-black font-extrabold px-1.5 py-0.5 rounded">
                        SPONSOR
                      </span>
                    </div>

                    {/* Bottom Headline & CTA */}
                    <div className="relative z-10 space-y-1.5 text-center">
                      <h4 className="text-xs font-black text-white line-clamp-1">{title || 'Your Headline Here'}</h4>
                      <p className="text-[10px] text-slate-300 line-clamp-1">{description || 'Ad pitch summary...'}</p>
                      <button
                        type="button"
                        className="w-full py-1.5 rounded-xl bg-amber-500 text-black font-black text-[11px] shadow-md"
                      >
                        {ctaText}
                      </button>
                    </div>
                  </div>
                )}

                {/* 2. Cinema Video In-Stream Overlay Preview */}
                {activePreviewFormat === 'video' && (
                  <div className="relative w-full aspect-video rounded-2xl overflow-hidden bg-slate-950 border border-slate-700 shadow-xl flex items-end p-3">
                    <img
                      src={mediaUrl || '/logo.png'}
                      alt="Video overlay"
                      className={`absolute inset-0 w-full h-full ${cropMode === 'cover' ? 'object-cover' : 'object-contain'}`}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent pointer-events-none" />
                    <div className="relative z-10 flex items-center justify-between w-full">
                      <div className="space-y-0.5 max-w-[70%]">
                        <span className="text-[8px] uppercase bg-amber-500 text-black font-black px-1 rounded">Ad • 0:05</span>
                        <h4 className="text-xs font-black text-white truncate">{title || 'Headline'}</h4>
                      </div>
                      <button type="button" className="px-3 py-1 rounded-xl bg-amber-500 text-black font-black text-[10px]">
                        {ctaText}
                      </button>
                    </div>
                  </div>
                )}

                {/* 3. TV / Radio Companion */}
                {activePreviewFormat === 'tv' && (
                  <div className="p-3 rounded-2xl bg-slate-900 border border-slate-800 flex items-center gap-3">
                    <img
                      src={mediaUrl || '/logo.png'}
                      alt="TV companion"
                      className="w-16 h-16 rounded-xl object-cover shrink-0 border border-slate-700"
                    />
                    <div className="flex-1 min-w-0 space-y-1">
                      <span className="text-[8px] bg-amber-500/20 text-amber-300 px-1.5 py-0.5 rounded font-bold uppercase">
                        Live Stream Sponsor
                      </span>
                      <h4 className="text-xs font-bold text-white truncate">{title || 'Your Ad Title'}</h4>
                      <p className="text-[10px] text-slate-400 line-clamp-1">{description || 'Ad pitch...'}</p>
                    </div>
                  </div>
                )}

                {/* 4. Article Native Feed Card */}
                {activePreviewFormat === 'article' && (
                  <div className="p-3 rounded-2xl bg-slate-900 border border-slate-800 space-y-2">
                    <span className="text-[8px] bg-amber-500/20 text-amber-300 px-1.5 py-0.5 rounded font-bold uppercase">
                      Sponsored Editorial
                    </span>
                    <img
                      src={mediaUrl || '/logo.png'}
                      alt="Article feed"
                      className="w-full h-28 rounded-xl object-cover"
                    />
                    <h4 className="text-xs font-black text-white truncate">{title || 'Article Sponsored Headline'}</h4>
                    <p className="text-[11px] text-slate-300 line-clamp-2">{description || 'Description of product or service...'}</p>
                  </div>
                )}

                {/* 5. Sidebar Recommendation Card */}
                {activePreviewFormat === 'recommendation' && (
                  <div className="p-3 rounded-2xl bg-gradient-to-r from-amber-500/10 to-transparent border border-amber-500/30 flex items-center gap-3">
                    <img
                      src={mediaUrl || '/logo.png'}
                      alt="Sidebar"
                      className="w-14 h-14 rounded-xl object-cover shrink-0"
                    />
                    <div className="flex-1 min-w-0">
                      <span className="text-[8px] uppercase font-bold text-amber-400">Featured</span>
                      <h4 className="text-xs font-bold text-white truncate">{title || 'Recommendation Title'}</h4>
                      <span className="text-[10px] text-blue-400 hover:underline block truncate">{ctaText} →</span>
                    </div>
                  </div>
                )}

              </div>

              {/* Performance Projections Summary */}
              <div className="p-3.5 rounded-2xl bg-[#0B0E14] border border-slate-800 space-y-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                  AI Delivery Projections (Rwanda Benchmark)
                </span>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <span className="text-[9px] text-slate-500 block">Expected Total Views</span>
                    <span className="font-black text-blue-400 text-sm">~{metrics.totalImpressions.toLocaleString()}</span>
                  </div>
                  <div>
                    <span className="text-[9px] text-slate-500 block">Expected Total Clicks</span>
                    <span className="font-black text-purple-400 text-sm">~{metrics.totalClicks.toLocaleString()}</span>
                  </div>
                </div>
              </div>

            </div>

          </div>

        </div>

      </div>
    </div>
  );
};
