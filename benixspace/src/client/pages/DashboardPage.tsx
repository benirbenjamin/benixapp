import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { useTheme, ThemeMode, AccentColor } from '../context/ThemeContext';
import { SeoHead } from '../components/common/SeoHead';
import { WalletModal } from '../components/modals/WalletModal';
import { SubmitAdModal } from '../components/modals/SubmitAdModal';
import {
  LayoutDashboard,
  Wallet,
  Gift,
  Settings,
  Users,
  Tv,
  Radio,
  Heart,
  Music,
  ShoppingBag,
  Dices,
  Calculator,
  Copy,
  Check,
  Sparkles,
  ShieldCheck,
  ArrowDownLeft,
  ArrowUpRight,
  Sun,
  Moon,
  Palette,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  Lock,
  User,
  ArrowLeft,
  Megaphone,
  TrendingUp,
  Pause,
  Play,
  Plus,
  BarChart3
} from 'lucide-react';

export const DashboardPage: React.FC = () => {
  const { user, wallet, token, updateWalletBalance, updatePreferences } = useAuth();
  const { language, setLanguage, t } = useLanguage();
  const { mode, accent, setMode, setAccent } = useTheme();

  const [activeTab, setActiveTab] = useState<'overview' | 'wallet' | 'customizer' | 'referrals' | 'security' | 'ads'>('overview');
  const [showSubmitAdModal, setShowSubmitAdModal] = useState(false);
  const [userCampaigns, setUserCampaigns] = useState<any[]>([]);
  const [campaignsLoading, setCampaignsLoading] = useState(false);
  const [adActionMsg, setAdActionMsg] = useState('');
  const [copied, setCopied] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState('');
  const [showWalletModal, setShowWalletModal] = useState(false);

  useEffect(() => {
    const isWalletHash = window.location.hash === '#wallet';
    const isAdsHash = window.location.hash === '#ads';
    if (isAdsHash) {
      setActiveTab('ads');
    }
    const isPaymentReturn = window.location.search.includes('flw') || 
                            window.location.search.includes('payment=') || 
                            window.location.search.includes('tx_ref');
    if (isWalletHash || isPaymentReturn) {
      setActiveTab('wallet');
      setShowWalletModal(true);
    }
  }, []);


  const loadUserCampaigns = async () => {
    if (!token && !localStorage.getItem('token')) return;
    try {
      setCampaignsLoading(true);
      const authToken = token || localStorage.getItem('token');
      const res = await fetch('/api/ads/my-campaigns', {
        headers: {
          Authorization: `Bearer ${authToken}`
        }
      });
      const data = await res.json();
      if (data.success && Array.isArray(data.campaigns)) {
        setUserCampaigns(data.campaigns);
      }
    } catch (err) {
      console.error('Failed to load user campaigns:', err);
    } finally {
      setCampaignsLoading(false);
    }
  };

  const handleTogglePause = async (campaignId: string) => {
    try {
      const authToken = token || localStorage.getItem('token');
      const res = await fetch(`/api/ads/${campaignId}/toggle-pause`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${authToken}`
        }
      });
      const data = await res.json();
      if (data.success) {
        setAdActionMsg(data.message || 'Campaign updated successfully.');
        setTimeout(() => setAdActionMsg(''), 3000);
        loadUserCampaigns();
      } else {
        alert(data.error || 'Failed to update campaign');
      }
    } catch (err) {
      console.error('Error toggling campaign pause:', err);
    }
  };

  useEffect(() => {
    if (activeTab === 'ads') {
      loadUserCampaigns();
    }
  }, [activeTab]);

  // Selected Modules
  const [modules, setModules] = useState<string[]>(
    user?.selected_modules || ['videos', 'radio', 'dating', 'music', 'marketplace', 'games', 'calc']
  );

  const handleCopyRef = () => {
    const link = `https://benix.space/?ref=${user?.referral_code || 'BENIX'}`;
    navigator.clipboard.writeText(link);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleToggleModule = (modId: string) => {
    let updated: string[];
    if (modules.includes(modId)) {
      if (modules.length === 1) return;
      updated = modules.filter((m) => m !== modId);
    } else {
      updated = [...modules, modId];
    }
    setModules(updated);
    updatePreferences(updated, { order: updated });
    setSaveSuccess('Preferences saved!');
    setTimeout(() => setSaveSuccess(''), 2500);
  };

  const isSuperAdmin = user?.role === 'superadmin' || user?.role === 'admin';

  return (
    <div className="min-h-screen bg-[#0B0E14] text-white py-6 sm:py-8 transition-colors font-sans selection:bg-blue-600">
      <SeoHead
        title="My Super-Account Dashboard — Benix.Space"
        description="Unified management for your Benix.Space modules, central wallet, and personal profile."
      />

      <div className="w-full max-w-[1720px] mx-auto px-4 sm:px-6 lg:px-10 space-y-6">
        
        {/* Navigation Breadcrumb / Back Button */}
        <div className="flex items-center justify-between">
          <Link
            to="/"
            className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-slate-800/80 hover:bg-slate-700/90 text-slate-300 hover:text-white text-xs font-bold border border-slate-700 transition-all shadow-md group"
          >
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
            <span>Back to Home</span>
          </Link>

          {/* Admin Banner if Admin */}
          {isSuperAdmin && (
            <Link
              to="/admin"
              className="inline-flex items-center gap-2 px-4 py-1.5 rounded-xl bg-gradient-to-r from-amber-500/20 to-yellow-500/10 border border-amber-500/40 text-amber-300 hover:border-amber-400 text-xs font-black shadow-lg shadow-amber-500/10 transition-all hover:scale-105"
            >
              <ShieldCheck className="w-4 h-4 text-amber-400" />
              <span>Admin Control Center & Cloud Storage →</span>
            </Link>
          )}
        </div>

        {/* Dashboard Top Header Profile Card */}
        <div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-r from-[#141B2D] via-[#101726] to-[#0D121F] border border-slate-800 shadow-2xl flex flex-col md:flex-row items-start md:items-center justify-between gap-6 relative overflow-hidden">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-violet-600 text-white font-black text-2xl flex items-center justify-center border-2 border-white/20 shadow-xl">
              {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                  Hello, {user?.name || 'Benix User'} 👋
                </h1>
                <span className="text-[10px] uppercase font-bold tracking-wider px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                  Verified Super-Account
                </span>
              </div>
              <p className="text-xs text-slate-400">{user?.email}</p>
            </div>
          </div>

          {/* Wallet Balance & Referral Action */}
          <div className="flex items-center gap-3 w-full md:w-auto">
            <div
              onClick={() => setShowWalletModal(true)}
              className="p-3.5 rounded-2xl bg-[#162032] border border-slate-700/80 cursor-pointer hover:border-emerald-500/50 transition-all flex items-center gap-3 shadow-lg"
            >
              <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center border border-emerald-500/30">
                <Wallet className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[10px] text-slate-400 uppercase font-bold block">Real Balance</span>
                <span className="text-lg font-black text-white">
                  {Number(wallet?.balance || 0).toLocaleString()}{' '}
                  <span className="text-xs text-emerald-400">{wallet?.currency || 'RWF'}</span>
                </span>
                {Boolean(wallet?.bonus_balance) && (
                  <span className="text-[10px] text-amber-300 font-bold block mt-0.5">
                    +{Number(wallet?.bonus_balance || 0).toLocaleString()} Bonus RWF
                  </span>
                )}
              </div>
            </div>

            <button
              onClick={handleCopyRef}
              className="px-4 py-3.5 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 text-white font-bold text-xs flex items-center gap-2 shadow-lg shadow-amber-500/20 transition-all active:scale-95 shrink-0"
            >
              <Gift className="w-4 h-4" />
              <span>{copied ? 'Copied!' : 'Invite & Earn Rewards'}</span>
            </button>
          </div>
        </div>

        {/* Dashboard Navigation Tabs */}
        <div className="flex items-center gap-2 border-b border-slate-800 pb-3 overflow-x-auto scrollbar-none">
          {[
            { id: 'overview', label: 'Overview & Apps', icon: LayoutDashboard },
            { id: 'wallet', label: 'Central Wallet & Ledger', icon: Wallet },
            { id: 'customizer', label: 'App Customizer', icon: Palette },
            { id: 'ads', label: 'Ad Campaigns & Analytics', icon: Megaphone },
            { id: 'referrals', label: 'Referrals & Earnings', icon: Gift },
            { id: 'security', label: 'Account & Security', icon: ShieldCheck }
          ].map((tab) => {
            const Icon = tab.icon;
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`px-4 py-2.5 rounded-2xl text-xs font-bold flex items-center gap-2 shrink-0 transition-all ${
                  active
                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30'
                    : 'bg-[#121824] text-slate-300 border border-slate-800 hover:bg-slate-800 hover:text-white'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {saveSuccess && (
          <div className="p-3 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs font-bold flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4" />
            <span>{saveSuccess}</span>
          </div>
        )}

        {/* TAB 1: OVERVIEW & CONNECTED APPS */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            <div>
              <h3 className="text-sm font-extrabold uppercase tracking-wider text-slate-400 mb-4">
                Your Enabled Application Suite
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                  { id: 'videos', name: 'Benix Space TV', icon: Tv, path: '/tv', desc: 'Live Rwandan TV & Video Stream', color: 'from-blue-600 to-indigo-700' },
                  { id: 'radio', name: 'Live Radio FM', icon: Radio, path: '/radio', desc: '24/7 Digital Radio & Shows', color: 'from-purple-600 to-pink-600' },
                  { id: 'dating', name: 'Kunda Space', icon: Heart, path: '/dating', desc: 'Verified Rwandan Dating & Matchmaking', color: 'from-rose-500 to-pink-600' },
                  { id: 'music', name: 'Voxify Choirs', icon: Music, path: '/music', desc: 'Choir Music & Vocal Tracks', color: 'from-emerald-500 to-teal-600' },
                  { id: 'marketplace', name: 'Benix Market', icon: ShoppingBag, path: '/marketplace', desc: 'Digital Goods & Freelance Services', color: 'from-amber-500 to-orange-600' },
                  { id: 'games', name: 'RollDice Games', icon: Dices, path: '/games', desc: 'RollDice Challenges & Wagers', color: 'from-violet-600 to-indigo-700' },
                  { id: 'calc', name: 'EasyCalc Smart', icon: Calculator, path: '/calc', desc: 'Loan EMI, Tax & Financial Tools', color: 'from-cyan-500 to-blue-600' }
                ].map((app) => {
                  const Icon = app.icon;
                  const isEnabled = modules.includes(app.id);
                  return (
                    <Link
                      key={app.id}
                      to={app.path}
                      className={`p-5 rounded-3xl border transition-all flex flex-col justify-between group ${
                        isEnabled
                          ? 'bg-[#121824] border-slate-800 hover:border-slate-700 hover:shadow-xl'
                          : 'bg-[#0E131E] border-slate-900 opacity-60'
                      }`}
                    >
                      <div className="flex items-start justify-between mb-4">
                        <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${app.color} flex items-center justify-center text-white shadow-lg group-hover:scale-105 transition-transform`}>
                          <Icon className="w-6 h-6" />
                        </div>
                        <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                          isEnabled ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-slate-800 text-slate-500'
                        }`}>
                          {isEnabled ? 'Active' : 'Disabled'}
                        </span>
                      </div>
                      <div>
                        <h4 className="font-extrabold text-sm text-white group-hover:text-blue-400 transition-colors flex items-center justify-between">
                          <span>{app.name}</span>
                          <ExternalLink className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-opacity" />
                        </h4>
                        <p className="text-xs text-slate-400 mt-1">{app.desc}</p>
                      </div>
                    </Link>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: CENTRAL WALLET & LEDGER */}
        {activeTab === 'wallet' && (
          <div className="p-6 sm:p-8 rounded-3xl bg-[#121824] border border-slate-800 space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-black text-white">Central Wallet Overview</h3>
                <p className="text-xs text-slate-400">Universal balance shared across all Benix.Space mini-apps</p>
              </div>
              <button
                onClick={() => setShowWalletModal(true)}
                className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-md transition-all"
              >
                Open Full Wallet Controls
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="p-5 rounded-2xl bg-gradient-to-br from-[#162032] to-[#0E1524] border border-slate-700/80 space-y-2">
                <span className="text-xs text-slate-400 font-bold uppercase block">Available Balance</span>
                <span className="text-3xl font-black text-white">{Number(wallet?.balance || 100).toLocaleString()} <span className="text-sm font-bold text-emerald-400">{wallet?.currency || 'RWF'}</span></span>
              </div>
              <div className="p-5 rounded-2xl bg-[#161D2E] border border-slate-800 space-y-2">
                <span className="text-xs text-slate-400 font-bold uppercase block">Total Earnings</span>
                <span className="text-3xl font-black text-emerald-400">{Number(wallet?.total_earnings || 100).toLocaleString()} <span className="text-sm font-bold text-emerald-400">RWF</span></span>
              </div>
              <div className="p-5 rounded-2xl bg-[#161D2E] border border-slate-800 space-y-2">
                <span className="text-xs text-slate-400 font-bold uppercase block">Pending Withdrawals</span>
                <span className="text-3xl font-black text-amber-400">{Number(wallet?.pending_balance || 0).toLocaleString()} <span className="text-sm font-bold text-amber-400">RWF</span></span>
              </div>
            </div>

            <div className="pt-2 flex items-center gap-3">
              <button
                onClick={() => setShowWalletModal(true)}
                className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-md transition-all"
              >
                Top Up Balance
              </button>
              <button
                onClick={() => setShowWalletModal(true)}
                className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs border border-slate-700 transition-all"
              >
                Transfer Funds
              </button>
              <button
                onClick={() => setShowWalletModal(true)}
                className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs border border-slate-700 transition-all"
              >
                Withdraw to MoMo / Bank
              </button>
            </div>
          </div>
        )}

        {/* TAB 3: APP CUSTOMIZER */}
        {activeTab === 'customizer' && (
          <div className="p-6 sm:p-8 rounded-3xl bg-[#121824] border border-slate-800 space-y-6">
            <div>
              <h3 className="text-lg font-black text-white">Customize Your Enabled Apps</h3>
              <p className="text-xs text-slate-400">Toggle which apps appear on your homepage and navigation bar.</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {[
                { id: 'videos', name: 'Benix Space TV', icon: Tv, desc: 'Watch streaming TV and live channels' },
                { id: 'radio', name: 'Live Radio FM', icon: Radio, desc: '24/7 digital radio broadcasts' },
                { id: 'dating', name: 'Kunda Space Dating', icon: Heart, desc: 'Connect with verified matches' },
                { id: 'music', name: 'Voxify Choir & Music', icon: Music, desc: 'Choir practice and vocal audio' },
                { id: 'marketplace', name: 'Benix Marketplace', icon: ShoppingBag, desc: 'Digital products & freelance services' },
                { id: 'games', name: 'RollDice Games', icon: Dices, desc: 'Multiplayer dice challenge' },
                { id: 'calc', name: 'EasyCalc Smart Utilities', icon: Calculator, desc: 'Instant financial calculators' }
              ].map((m) => {
                const Icon = m.icon;
                const isChecked = modules.includes(m.id);
                return (
                  <div
                    key={m.id}
                    onClick={() => handleToggleModule(m.id)}
                    className={`p-4 rounded-2xl border cursor-pointer flex items-center justify-between transition-all ${
                      isChecked
                        ? 'bg-blue-600/10 border-blue-500/50 text-white'
                        : 'bg-[#0E131E] border-slate-800 text-slate-400 opacity-60'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`p-2.5 rounded-xl ${isChecked ? 'bg-blue-600 text-white' : 'bg-slate-800 text-slate-400'}`}>
                        <Icon className="w-5 h-5" />
                      </div>
                      <div>
                        <h4 className="font-bold text-xs text-white">{m.name}</h4>
                        <p className="text-[11px] text-slate-400">{m.desc}</p>
                      </div>
                    </div>
                    <div className={`w-5 h-5 rounded-md flex items-center justify-center border ${
                      isChecked ? 'bg-blue-600 border-blue-500 text-white' : 'border-slate-700'
                    }`}>
                      {isChecked && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* TAB 4: REFERRALS & EARNINGS */}
        {activeTab === 'referrals' && (
          <div className="p-6 sm:p-8 rounded-3xl bg-[#121824] border border-slate-800 space-y-6">
            <div>
              <h3 className="text-lg font-black text-white">Invite Friends & Earn Rewards</h3>
              <p className="text-xs text-slate-400">Share your referral link to earn rewards directly in your central wallet.</p>
            </div>

            <div className="p-5 rounded-2xl bg-[#161D2E] border border-slate-700/80 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div>
                <span className="text-[10px] text-slate-400 uppercase font-bold block">Your Unique Referral Code</span>
                <span className="text-2xl font-black text-white font-mono tracking-wider">{user?.referral_code || 'BENIX'}</span>
              </div>
              <button
                onClick={handleCopyRef}
                className="w-full sm:w-auto px-6 py-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-extrabold text-xs flex items-center justify-center gap-2 transition-all shadow-md"
              >
                <Copy className="w-4 h-4" />
                <span>{copied ? 'Copied to Clipboard!' : 'Copy Referral Link'}</span>
              </button>
            </div>
          </div>
        )}

        {/* TAB 5: ACCOUNT & SECURITY */}
        {activeTab === 'security' && (
          <div className="p-6 sm:p-8 rounded-3xl bg-[#121824] border border-slate-800 space-y-6">
            <div>
              <h3 className="text-lg font-black text-white">Account Details & Preferences</h3>
              <p className="text-xs text-slate-400">Manage your language, credentials, and profile settings.</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div className="p-4 rounded-2xl bg-[#161D2E] border border-slate-800 space-y-1">
                <span className="text-slate-400 block text-[10px] uppercase font-bold">Full Name</span>
                <span className="text-sm font-bold text-white">{user?.name}</span>
              </div>
              <div className="p-4 rounded-2xl bg-[#161D2E] border border-slate-800 space-y-1">
                <span className="text-slate-400 block text-[10px] uppercase font-bold">Email Address</span>
                <span className="text-sm font-bold text-white">{user?.email}</span>
              </div>
              <div className="p-4 rounded-2xl bg-[#161D2E] border border-slate-800 space-y-1">
                <span className="text-slate-400 block text-[10px] uppercase font-bold">Registered Phone</span>
                <span className="text-sm font-bold text-white">{user?.phone || 'Not configured'}</span>
              </div>
              <div className="p-4 rounded-2xl bg-[#161D2E] border border-slate-800 space-y-1">
                <span className="text-slate-400 block text-[10px] uppercase font-bold">Role</span>
                <span className="text-sm font-bold text-white uppercase">{user?.role || 'User'}</span>
              </div>
            </div>
          </div>
        )}

        {/* TAB 6: AD CAMPAIGNS & SELF-SERVE ANALYTICS */}
        {activeTab === 'ads' && (
          <div className="space-y-6">
            
            {/* Header with CTA Button */}
            <div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-r from-[#121A2C] via-[#0E1524] to-[#0A0E18] border border-amber-500/20 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-5 relative overflow-hidden">
              <div className="space-y-1.5">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="p-2 rounded-xl bg-amber-500/20 text-amber-400">
                    <Megaphone className="w-5 h-5" />
                  </span>
                  <h3 className="text-lg sm:text-xl font-black text-white">Self-Serve Advertising & Campaign Analytics</h3>
                  <span className="text-[10px] uppercase font-black px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40">
                    From 100 RWF
                  </span>
                </div>
                <p className="text-xs text-slate-300 max-w-2xl leading-relaxed">
                  Broadcast your products, YouTube channels, music, and businesses across Rwandan TV, live videos, stories, and recommendations. Budget is deducted incrementally from your central wallet as real impressions and clicks occur.
                </p>
              </div>

              <button
                onClick={() => setShowSubmitAdModal(true)}
                className="px-5 py-3 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-black font-black text-xs shadow-lg shadow-amber-500/20 flex items-center gap-2 shrink-0 transition-all hover:scale-105 active:scale-95"
              >
                <Plus className="w-4 h-4 stroke-[3]" />
                <span>Launch New Campaign</span>
              </button>
            </div>

            {adActionMsg && (
              <div className="p-4 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs font-bold flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4" />
                <span>{adActionMsg}</span>
              </div>
            )}

            {/* Campaign Performance Metrics Strip */}
            {(() => {
              const totalSpent = userCampaigns.reduce((sum, c) => sum + Number(c.total_spent || 0), 0);
              const totalViews = userCampaigns.reduce((sum, c) => sum + Number(c.impressions_count || 0), 0);
              const totalClicks = userCampaigns.reduce((sum, c) => sum + Number(c.clicks_count || 0), 0);
              const activeCount = userCampaigns.filter(c => c.status === 'active').length;
              const ctr = totalViews > 0 ? ((totalClicks / totalViews) * 100).toFixed(1) : '0.0';

              return (
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-3.5">
                  <div className="p-4 rounded-2xl bg-[#121824] border border-slate-800 space-y-1">
                    <span className="text-[10px] font-bold uppercase text-slate-400">Total Money Spent</span>
                    <p className="text-xl font-black text-emerald-400">{totalSpent.toLocaleString()} <span className="text-xs">RWF</span></p>
                    <span className="text-[9px] text-slate-500 block">Deducted from wallet</span>
                  </div>
                  <div className="p-4 rounded-2xl bg-[#121824] border border-slate-800 space-y-1">
                    <span className="text-[10px] font-bold uppercase text-slate-400">Delivered Views</span>
                    <p className="text-xl font-black text-blue-400">{totalViews.toLocaleString()}</p>
                    <span className="text-[9px] text-slate-500 block">Real user impressions</span>
                  </div>
                  <div className="p-4 rounded-2xl bg-[#121824] border border-slate-800 space-y-1">
                    <span className="text-[10px] font-bold uppercase text-slate-400">Total Clicks</span>
                    <p className="text-xl font-black text-purple-400">{totalClicks.toLocaleString()}</p>
                    <span className="text-[9px] text-slate-500 block">Direct website visits</span>
                  </div>
                  <div className="p-4 rounded-2xl bg-[#121824] border border-slate-800 space-y-1">
                    <span className="text-[10px] font-bold uppercase text-slate-400">Average CTR</span>
                    <p className="text-xl font-black text-amber-400">{ctr}%</p>
                    <span className="text-[9px] text-slate-500 block">Click-through rate</span>
                  </div>
                  <div className="p-4 rounded-2xl bg-[#121824] border border-slate-800 space-y-1 col-span-2 sm:col-span-1">
                    <span className="text-[10px] font-bold uppercase text-slate-400">Active Campaigns</span>
                    <p className="text-xl font-black text-white">{activeCount} / {userCampaigns.length}</p>
                    <span className="text-[9px] text-emerald-400 font-bold block">Running in rotation</span>
                  </div>
                </div>
              );
            })()}

            {/* Campaign Cards List */}
            {campaignsLoading ? (
              <div className="p-12 text-center text-slate-400 text-xs">
                <div className="w-8 h-8 border-2 border-amber-400 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
                <span>Loading your advertising campaigns...</span>
              </div>
            ) : userCampaigns.length === 0 ? (
              <div className="p-10 sm:p-14 rounded-3xl bg-[#121824] border border-slate-800 text-center space-y-4">
                <div className="w-14 h-14 rounded-2xl bg-amber-500/15 text-amber-400 flex items-center justify-center mx-auto shadow-inner">
                  <Megaphone className="w-7 h-7" />
                </div>
                <div className="space-y-1">
                  <h4 className="font-extrabold text-base text-white">You don't have any ad campaigns yet</h4>
                  <p className="text-xs text-slate-400 max-w-md mx-auto">
                    Start reaching thousands of viewers across Benix.Space with flexible budgets starting from only 100 RWF.
                  </p>
                </div>
                <button
                  onClick={() => setShowSubmitAdModal(true)}
                  className="px-6 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-black text-xs shadow-lg shadow-amber-500/20 inline-flex items-center gap-2 transition-all hover:scale-105"
                >
                  <Plus className="w-4 h-4 stroke-[3]" />
                  <span>Launch Your First Campaign</span>
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {userCampaigns.map(campaign => {
                  const targetImp = Number(campaign.target_impressions || 0);
                  const deliveredImp = Number(campaign.impressions_count || 0);
                  const clicks = Number(campaign.clicks_count || 0);
                  const spent = Number(campaign.total_spent || 0);
                  const progressPct = targetImp > 0 ? Math.min(100, Math.round((deliveredImp / targetImp) * 100)) : 0;
                  const ctr = deliveredImp > 0 ? ((clicks / deliveredImp) * 100).toFixed(1) : '0.0';

                  return (
                    <div
                      key={campaign.id}
                      className="p-5 sm:p-6 rounded-3xl bg-[#121824] border border-slate-800 hover:border-slate-700 transition-all space-y-4 shadow-xl"
                    >
                      {/* Top: Media Thumbnail, Title, Destination, Status Badge */}
                      <div className="flex flex-col sm:flex-row items-start justify-between gap-4">
                        <div className="flex items-start gap-4 flex-1">
                          
                          {/* Image preview */}
                          <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl bg-black border border-slate-800 overflow-hidden shrink-0 relative">
                            {campaign.media_url ? (
                              <img
                                src={campaign.media_url}
                                alt={campaign.title}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-slate-600">
                                <Megaphone className="w-6 h-6" />
                              </div>
                            )}
                          </div>

                          <div className="space-y-1.5 flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <h4 className="font-extrabold text-base text-white truncate">
                                {campaign.title}
                              </h4>

                              {/* Status Badge */}
                              <span className={`text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full border ${
                                campaign.status === 'active'
                                  ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
                                  : campaign.status === 'pending'
                                  ? 'bg-amber-500/20 text-amber-400 border-amber-500/30 animate-pulse'
                                  : campaign.status === 'paused'
                                  ? 'bg-slate-700 text-slate-300 border-slate-600'
                                  : 'bg-rose-500/20 text-rose-400 border-rose-500/30'
                              }`}>
                                {campaign.status === 'pending' ? 'Under Review' : campaign.status}
                              </span>
                            </div>

                            <p className="text-xs text-slate-300 line-clamp-2">
                              {campaign.description || 'No description provided.'}
                            </p>

                            <div className="flex items-center gap-3 text-xs flex-wrap pt-0.5">
                              <a
                                href={campaign.target_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-blue-400 hover:underline flex items-center gap-1 font-semibold truncate max-w-xs"
                              >
                                <ExternalLink className="w-3 h-3 shrink-0" />
                                <span className="truncate">{campaign.target_url}</span>
                              </a>
                              <span className="text-[10px] bg-slate-800 text-slate-300 px-2 py-0.5 rounded font-bold">
                                Button: {campaign.cta_text || 'Learn More'}
                              </span>
                            </div>
                          </div>

                        </div>

                        {/* Bids & Spend Stats Strip */}
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 bg-[#0B0E14] p-3 rounded-2xl border border-slate-800 shrink-0 w-full sm:w-auto">
                          <div>
                            <span className="text-[9px] uppercase font-bold text-slate-500 block">Daily Budget</span>
                            <span className="text-xs font-black text-white">{Number(campaign.daily_budget).toLocaleString()} RWF</span>
                          </div>
                          <div>
                            <span className="text-[9px] uppercase font-bold text-slate-500 block">Bids (CPM / CPC)</span>
                            <span className="text-xs font-black text-amber-400">{campaign.cpm_bid} / {campaign.cpc_bid} RWF</span>
                          </div>
                          <div>
                            <span className="text-[9px] uppercase font-bold text-slate-500 block">Delivered Views</span>
                            <span className="text-xs font-black text-blue-400">{deliveredImp.toLocaleString()}</span>
                          </div>
                          <div>
                            <span className="text-[9px] uppercase font-bold text-slate-500 block">Spent from Wallet</span>
                            <span className="text-xs font-black text-emerald-400">{spent.toLocaleString()} RWF</span>
                          </div>
                        </div>

                      </div>

                      {/* Progress Bar towards target quota */}
                      {targetImp > 0 && (
                        <div className="space-y-1 pt-1">
                          <div className="flex items-center justify-between text-[11px] text-slate-400">
                            <span>Impression Delivery Progress</span>
                            <span className="font-bold text-slate-200">
                              {deliveredImp} / {targetImp} views ({progressPct}%)
                            </span>
                          </div>
                          <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-gradient-to-r from-amber-500 to-emerald-500 rounded-full transition-all"
                              style={{ width: `${progressPct}%` }}
                            />
                          </div>
                        </div>
                      )}

                      {/* Rejection notice if rejected */}
                      {campaign.status === 'rejected' && campaign.rejection_reason && (
                        <div className="p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs space-y-1">
                          <span className="font-bold uppercase text-[10px] text-rose-400 flex items-center gap-1.5">
                            <AlertCircle className="w-3.5 h-3.5" />
                            <span>Action Required — Campaign Rejected by Moderation</span>
                          </span>
                          <p>{campaign.rejection_reason}</p>
                        </div>
                      )}

                      {/* Action Bar */}
                      <div className="flex items-center justify-between pt-2 border-t border-slate-800/80 text-xs">
                        <div className="flex items-center gap-2">
                          <span className="text-slate-500 text-[11px]">
                            Clicks: <strong className="text-white">{clicks}</strong> ({ctr}% CTR)
                          </span>
                        </div>

                        <div className="flex items-center gap-2">
                          {campaign.status === 'active' && (
                            <button
                              onClick={() => handleTogglePause(campaign.id)}
                              className="px-3.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold flex items-center gap-1.5 transition-all"
                            >
                              <Pause className="w-3.5 h-3.5" />
                              <span>Pause Campaign</span>
                            </button>
                          )}

                          {campaign.status === 'paused' && (
                            <button
                              onClick={() => handleTogglePause(campaign.id)}
                              className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center gap-1.5 transition-all"
                            >
                              <Play className="w-3.5 h-3.5" />
                              <span>Resume Campaign</span>
                            </button>
                          )}

                          <button
                            onClick={() => setShowSubmitAdModal(true)}
                            className="px-3.5 py-1.5 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-bold transition-all"
                          >
                            New Ad
                          </button>
                        </div>
                      </div>

                    </div>
                  );
                })}
              </div>
            )}

          </div>
        )}

      </div>

      {/* Central Wallet Modal */}
      {showWalletModal && (
        <WalletModal
          isOpen={showWalletModal}
          onClose={() => setShowWalletModal(false)}
        />
      )}

      {showSubmitAdModal && (
        <SubmitAdModal
          isOpen={showSubmitAdModal}
          onClose={() => {
            setShowSubmitAdModal(false);
            loadUserCampaigns();
          }}
          onOpenWallet={() => {
            setShowSubmitAdModal(false);
            setActiveTab('wallet');
          }}
        />
      )}
    </div>
  );
};
