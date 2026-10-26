import React, { useState, useEffect, useRef } from 'react';
import { Link, useLocation, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { useTheme, ThemeMode, AccentColor } from '../context/ThemeContext';
import { SeoHead } from '../components/common/SeoHead';
import { WalletModal } from '../components/modals/WalletModal';
import { SubmitAdModal } from '../components/modals/SubmitAdModal';
import { DashboardCreatorBar } from '../components/dashboard/DashboardCreatorBar';
import { DashboardReceiptModal } from '../components/dashboard/DashboardReceiptModal';
import { CreateMediaModal } from '../components/modals/CreateMediaModal';
import { AppAccessWizardModal } from '../components/modals/AppAccessWizardModal';
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
  BarChart3,
  Camera,
  Edit3,
  Eye,
  Save,
  X,
  Layers,
  Clock
} from 'lucide-react';

export const DashboardPage: React.FC = () => {
  const { user, wallet, token, updateWalletBalance, updatePreferences, updateProfilePhoto } = useAuth();
  const { language, setLanguage, t } = useLanguage();
  const { mode, accent, setMode, setAccent } = useTheme();

  const location = useLocation();
  const [searchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState<'overview' | 'wallet' | 'customizer' | 'referrals' | 'security' | 'ads'>('overview');

  // React to hash (e.g. #wallet) or query param (e.g. ?tab=wallet)
  useEffect(() => {
    const hash = (location.hash || '').replace('#', '').toLowerCase();
    const tabParam = (searchParams.get('tab') || '').toLowerCase();
    const candidate = hash || tabParam;
    if (['wallet', 'overview', 'customizer', 'referrals', 'security', 'ads'].includes(candidate)) {
      setActiveTab(candidate as any);
    }
  }, [location.hash, searchParams]);
  const [showSubmitAdModal, setShowSubmitAdModal] = useState(false);
  const [userCampaigns, setUserCampaigns] = useState<any[]>([]);
  const [campaignsLoading, setCampaignsLoading] = useState(false);
  const [adActionMsg, setAdActionMsg] = useState('');
  const [copied, setCopied] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState('');
  const [showWalletModal, setShowWalletModal] = useState(false);
  const [showCreateMediaModal, setShowCreateMediaModal] = useState(false);
  const [selectedReceiptTx, setSelectedReceiptTx] = useState<any | null>(null);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authModalTab, setAuthModalTab] = useState<'login' | 'register'>('login');
  const [transactionsList, setTransactionsList] = useState<any[]>([
    {
      id: 'tx-2026-001',
      title: 'Welcome Super-Account Activation Bonus',
      type: 'bonus_credit',
      amount: 100,
      fee: 0,
      currency: 'RWF',
      date: 'Today, Just now',
      status: 'completed',
      balance_after: 100,
      description: 'BenixSpace unified welcome bonus credited to Central Wallet'
    },
    {
      id: 'tx-2026-002',
      title: 'MoMo Rwandan Instant Deposit',
      type: 'deposit',
      amount: 5000,
      fee: 0,
      currency: 'RWF',
      date: 'Today, 14:22',
      status: 'completed',
      balance_after: 5100,
      description: 'MTN Mobile Money direct wallet top-up'
    },
    {
      id: 'tx-2026-003',
      title: 'RollDice Arena PvE Wager Winnings',
      type: 'game_win',
      amount: 1200,
      fee: 0,
      currency: 'RWF',
      date: 'Yesterday, 19:40',
      status: 'completed',
      balance_after: 6300,
      description: 'RollDice High-Low challenge round payout'
    }
  ]);

  // Profile Avatar Upload State
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [photoSuccessMsg, setPhotoSuccessMsg] = useState('');
  const avatarInputRef = useRef<HTMLInputElement | null>(null);

  // Campaign Editing & Details View State
  const [editingCampaign, setEditingCampaign] = useState<any | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editDesc, setEditDesc] = useState('');
  const [editTargetUrl, setEditTargetUrl] = useState('');
  const [editCtaText, setEditCtaText] = useState('Learn More');
  const [editDailyBudget, setEditDailyBudget] = useState(100);
  const [editCpmBid, setEditCpmBid] = useState(20);
  const [editCpcBid, setEditCpcBid] = useState(15);
  const [editSaving, setEditSaving] = useState(false);
  const [detailsCampaign, setDetailsCampaign] = useState<any | null>(null);

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      alert('Please select an image file (PNG, JPG, WebP).');
      return;
    }

    try {
      setUploadingPhoto(true);
      const reader = new FileReader();
      reader.onload = (event) => {
        const img = new Image();
        img.onload = async () => {
          const canvas = document.createElement('canvas');
          const maxDim = 400;
          let w = img.width;
          let h = img.height;
          if (w > maxDim || h > maxDim) {
            if (w > h) {
              h = Math.round((h * maxDim) / w);
              w = maxDim;
            } else {
              w = Math.round((w * maxDim) / h);
              h = maxDim;
            }
          }
          canvas.width = w;
          canvas.height = h;
          const ctx = canvas.getContext('2d');
          ctx?.drawImage(img, 0, 0, w, h);
          const compressed = canvas.toDataURL('image/jpeg', 0.85);

          const res = await updateProfilePhoto(compressed);
          setUploadingPhoto(false);
          if (res.success) {
            setPhotoSuccessMsg('Profile photo updated successfully!');
            setTimeout(() => setPhotoSuccessMsg(''), 3000);
          } else {
            alert(res.error || 'Failed to update photo');
          }
        };
        img.src = event.target?.result as string;
      };
      reader.readAsDataURL(file);
    } catch (err: any) {
      setUploadingPhoto(false);
      alert(err.message || 'Error uploading photo');
    }
  };

  const openEditModal = (c: any) => {
    setEditingCampaign(c);
    setEditTitle(c.title || '');
    setEditDesc(c.description || '');
    setEditTargetUrl(c.targetUrl || c.target_url || '');
    setEditCtaText(c.ctaText || c.cta_text || 'Learn More');
    setEditDailyBudget(Number(c.dailyBudget ?? c.daily_budget ?? 100));
    setEditCpmBid(Number(c.cpmBid ?? c.cpm_bid ?? 20));
    setEditCpcBid(Number(c.cpcBid ?? c.cpc_bid ?? 15));
  };

  const handleSaveCampaignEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCampaign) return;
    try {
      setEditSaving(true);
      const authToken = token || localStorage.getItem('token') || localStorage.getItem('benix_auth_token');
      const res = await fetch(`/api/ads/${editingCampaign.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`
        },
        body: JSON.stringify({
          title: editTitle,
          description: editDesc,
          targetUrl: editTargetUrl,
          ctaText: editCtaText,
          dailyBudget: editDailyBudget,
          cpmBid: editCpmBid,
          cpcBid: editCpcBid
        })
      });
      const data = await res.json();
      if (data.success) {
        setAdActionMsg('Campaign details updated successfully!');
        setTimeout(() => setAdActionMsg(''), 3000);
        setEditingCampaign(null);
        loadUserCampaigns();
      } else {
        alert(data.error || 'Failed to update campaign');
      }
    } catch (err: any) {
      alert(err.message || 'Error saving campaign');
    } finally {
      setEditSaving(false);
    }
  };

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

  // Guard: Unauthenticated visitors cannot see private user dashboard
  if (!user && !token) {
    return (
      <div className="min-h-[85vh] bg-[#0B0E14] text-white flex items-center justify-center p-4">
        <SeoHead
          title="Sign In to Access Dashboard — Benix.Space"
          description="Access your central wallet, applications, analytics, and creator studio."
        />
        <div className="w-full max-w-md p-6 sm:p-8 rounded-3xl bg-[#121824] border border-slate-800 text-center space-y-6 shadow-2xl animate-fade-in">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center mx-auto shadow-xl">
            <Lock className="w-8 h-8" />
          </div>
          <div className="space-y-2">
            <span className="text-[10px] font-extrabold uppercase tracking-wider px-3 py-1 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20">
              Private User Dashboard
            </span>
            <h2 className="text-2xl font-black text-white">Sign In Required</h2>
            <p className="text-xs text-slate-400 leading-relaxed">
              The BenixSpace Super-Account Dashboard is reserved for registered users. Please sign in or create your unified account to access your central wallet, media tools, and personal settings.
            </p>
          </div>
          <div className="space-y-3 pt-2">
            <button
              onClick={() => { setAuthModalTab('login'); setShowAuthModal(true); }}
              className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-xs font-black shadow-lg shadow-blue-600/30 transition-all flex items-center justify-center gap-2"
            >
              <User className="w-4 h-4" />
              <span>Sign In to Your Account</span>
            </button>
            <button
              onClick={() => { setAuthModalTab('register'); setShowAuthModal(true); }}
              className="w-full py-3.5 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold border border-slate-700 transition-all"
            >
              Create Free Account
            </button>
            <Link
              to="/"
              className="block text-xs text-slate-500 hover:text-slate-300 transition-colors pt-2"
            >
              ← Return to Public Homepage
            </Link>
          </div>
        </div>
        {showAuthModal && (
          <AppAccessWizardModal
            isOpen={showAuthModal}
            onClose={() => setShowAuthModal(false)}
            targetAppKey="tv"
            initialTab={authModalTab}
          />
        )}
      </div>
    );
  }

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
            <input
              type="file"
              ref={avatarInputRef}
              onChange={handleAvatarChange}
              accept="image/*"
              className="hidden"
            />
            <div className="relative group shrink-0">
              <div 
                onClick={() => avatarInputRef.current?.click()}
                title="Click to update profile photo"
                className="w-16 h-16 rounded-2xl overflow-hidden cursor-pointer bg-gradient-to-tr from-blue-600 via-indigo-600 to-violet-600 text-white font-black text-2xl flex items-center justify-center border-2 border-white/20 shadow-xl relative hover:opacity-90 transition-all"
              >
                {user?.avatar_url ? (
                  <img src={user.avatar_url} alt={user.name} className="w-full h-full object-cover" />
                ) : (
                  <span>{user?.name ? user.name.charAt(0).toUpperCase() : 'U'}</span>
                )}
                {uploadingPhoto && (
                  <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  </div>
                )}
              </div>
              <button
                type="button"
                onClick={() => avatarInputRef.current?.click()}
                title="Update Profile Photo"
                className="absolute -bottom-1 -right-1 p-1.5 rounded-full bg-blue-600 hover:bg-blue-500 text-white shadow-lg border-2 border-[#141B2D] transition-transform active:scale-95"
              >
                <Camera className="w-3.5 h-3.5" />
              </button>
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
              {photoSuccessMsg && (
                <span className="text-[11px] text-emerald-400 font-bold block animate-fade-in">
                  ✓ {photoSuccessMsg}
                </span>
              )}
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
            <DashboardCreatorBar onOpenMediaModal={() => setShowCreateMediaModal(true)} onOpenAdModal={() => setShowSubmitAdModal(true)} />
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

            {/* Clickable Financial Transactions Ledger */}
            <div className="space-y-3 pt-4 border-t border-slate-800">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-bold text-white flex items-center gap-2">
                  <Clock className="w-4 h-4 text-slate-400" />
                  <span>Recent Financial Transactions Ledger</span>
                </h4>
                <span className="text-[11px] text-slate-400">Click any transaction to view official receipt</span>
              </div>

              <div className="divide-y divide-slate-800/80 rounded-2xl bg-[#0B0E14] border border-slate-800 overflow-hidden">
                {transactionsList.map((tx) => (
                  <div
                    key={tx.id}
                    onClick={() => setSelectedReceiptTx(tx)}
                    className="p-4 hover:bg-slate-800/40 cursor-pointer flex items-center justify-between transition-colors group"
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${
                        tx.type === 'deposit' || tx.type === 'game_win' || tx.type === 'bonus_credit'
                          ? 'bg-emerald-500/10 text-emerald-400'
                          : 'bg-rose-500/10 text-rose-400'
                      }`}>
                        {tx.type === 'deposit' || tx.type === 'game_win' || tx.type === 'bonus_credit' ? (
                          <ArrowDownLeft className="w-4 h-4" />
                        ) : (
                          <ArrowUpRight className="w-4 h-4" />
                        )}
                      </div>
                      <div>
                        <h5 className="text-xs font-bold text-white group-hover:text-blue-400 transition-colors">
                          {tx.title}
                        </h5>
                        <p className="text-[11px] text-slate-500">{tx.date} • Ref: {tx.id}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className={`text-xs font-black block ${
                        tx.type === 'deposit' || tx.type === 'game_win' || tx.type === 'bonus_credit'
                          ? 'text-emerald-400'
                          : 'text-white'
                      }`}>
                        +{tx.amount.toLocaleString()} {tx.currency}
                      </span>
                      <span className="text-[10px] text-slate-400 font-mono">
                        Bal: {tx.balance_after.toLocaleString()} RWF
                      </span>
                    </div>
                  </div>
                ))}
              </div>
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

            <div className="p-4 sm:p-5 rounded-2xl bg-[#161D2E] border border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-14 h-14 rounded-2xl overflow-hidden bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center font-bold text-white text-xl border border-slate-700">
                  {user?.avatar_url ? (
                    <img src={user.avatar_url} alt={user.name} className="w-full h-full object-cover" />
                  ) : (
                    user?.name ? user.name.charAt(0).toUpperCase() : 'U'
                  )}
                </div>
                <div>
                  <h4 className="text-sm font-bold text-white">Personal Profile Photo</h4>
                  <p className="text-[11px] text-slate-400">Personalize your avatar across BenixSpace modules and comments.</p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => avatarInputRef.current?.click()}
                className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold flex items-center gap-1.5 transition-all shadow-md"
              >
                <Camera className="w-4 h-4" />
                <span>{uploadingPhoto ? 'Uploading Photo...' : 'Update Profile Photo'}</span>
              </button>
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
                  const dailyBudget = Number(campaign.dailyBudget ?? campaign.daily_budget ?? 100);
                  const cpmBid = Number(campaign.cpmBid ?? campaign.cpm_bid ?? 20);
                  const cpcBid = Number(campaign.cpcBid ?? campaign.cpc_bid ?? 15);
                  const mediaUrl = campaign.mediaUrl || campaign.media_url || '';
                  const targetUrl = campaign.targetUrl || campaign.target_url || '';
                  const ctaText = campaign.ctaText || campaign.cta_text || 'Learn More';
                  const targetImp = Number(campaign.targetImpressions ?? campaign.target_impressions ?? 1000);
                  const deliveredImp = Number(campaign.currentImpressions ?? campaign.impressions_count ?? 0);
                  const clicks = Number(campaign.currentClicks ?? campaign.clicks_count ?? 0);
                  const spent = Number(campaign.totalSpent ?? campaign.total_spent ?? 0);
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
                            {mediaUrl ? (
                              <img
                                src={mediaUrl}
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
                              {targetUrl && (
                                <a
                                  href={targetUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-blue-400 hover:underline flex items-center gap-1 font-semibold truncate max-w-xs"
                                >
                                  <ExternalLink className="w-3 h-3 shrink-0" />
                                  <span className="truncate">{targetUrl}</span>
                                </a>
                              )}
                              <span className="text-[10px] bg-slate-800 text-slate-300 px-2 py-0.5 rounded font-bold">
                                Button: {ctaText}
                              </span>
                            </div>
                          </div>

                        </div>

                        {/* Bids & Spend Stats Strip */}
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 bg-[#0B0E14] p-3 rounded-2xl border border-slate-800 shrink-0 w-full sm:w-auto">
                          <div>
                            <span className="text-[9px] uppercase font-bold text-slate-500 block">Daily Budget</span>
                            <span className="text-xs font-black text-white">{dailyBudget.toLocaleString()} RWF</span>
                          </div>
                          <div>
                            <span className="text-[9px] uppercase font-bold text-slate-500 block">Bids (CPM / CPC)</span>
                            <span className="text-xs font-black text-amber-400">{cpmBid} / {cpcBid} RWF</span>
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
                      <div className="flex items-center justify-between pt-2 border-t border-slate-800/80 text-xs flex-wrap gap-2">
                        <div className="flex items-center gap-2">
                          <span className="text-slate-500 text-[11px]">
                            Clicks: <strong className="text-white">{clicks}</strong> ({ctr}% CTR)
                          </span>
                        </div>

                        <div className="flex items-center gap-2 flex-wrap">
                          <button
                            onClick={() => setDetailsCampaign(campaign)}
                            className="px-3 py-1.5 rounded-xl bg-blue-500/15 hover:bg-blue-500/25 border border-blue-500/30 text-blue-400 text-xs font-bold flex items-center gap-1.5 transition-all"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            <span>View Details</span>
                          </button>

                          <button
                            onClick={() => openEditModal(campaign)}
                            className="px-3 py-1.5 rounded-xl bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/30 text-amber-300 text-xs font-bold flex items-center gap-1.5 transition-all"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                            <span>Edit</span>
                          </button>

                          {campaign.status === 'active' && (
                            <button
                              onClick={() => handleTogglePause(campaign.id)}
                              className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold flex items-center gap-1.5 transition-all"
                            >
                              <Pause className="w-3.5 h-3.5" />
                              <span>Pause</span>
                            </button>
                          )}

                          {campaign.status === 'paused' && (
                            <button
                              onClick={() => handleTogglePause(campaign.id)}
                              className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center gap-1.5 transition-all"
                            >
                              <Play className="w-3.5 h-3.5" />
                              <span>Resume</span>
                            </button>
                          )}

                          <button
                            onClick={() => setShowSubmitAdModal(true)}
                            className="px-3 py-1.5 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-bold transition-all"
                          >
                            + New Ad
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

      {/* View Details Modal */}
      {detailsCampaign && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-xl rounded-3xl bg-[#101726] border border-slate-800 shadow-2xl p-6 sm:p-7 space-y-5 max-h-[90vh] overflow-y-auto">
            <div className="flex items-start justify-between gap-4 pb-3 border-b border-slate-800">
              <div className="space-y-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="text-lg font-black text-white">{detailsCampaign.title}</h3>
                  <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full border ${
                    detailsCampaign.status === 'active'
                      ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
                      : 'bg-slate-700 text-slate-300 border-slate-600'
                  }`}>
                    {detailsCampaign.status}
                  </span>
                </div>
                <p className="text-xs text-slate-400">Campaign ID: <span className="font-mono text-slate-300">{detailsCampaign.id}</span></p>
              </div>
              <button
                onClick={() => setDetailsCampaign(null)}
                className="p-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Media Creative Preview */}
            <div className="rounded-2xl overflow-hidden bg-black border border-slate-800 aspect-video max-h-56 relative flex items-center justify-center">
              {(detailsCampaign.mediaUrl || detailsCampaign.media_url) ? (
                <img
                  src={detailsCampaign.mediaUrl || detailsCampaign.media_url}
                  alt={detailsCampaign.title}
                  className="w-full h-full object-cover"
                />
              ) : (
                <Megaphone className="w-12 h-12 text-slate-600" />
              )}
            </div>

            {/* Description & Target */}
            <div className="space-y-2 p-3.5 rounded-2xl bg-[#0D121F] border border-slate-800/80 text-xs">
              <p className="text-slate-300 leading-relaxed">{detailsCampaign.description || 'No description provided.'}</p>
              <div className="flex items-center justify-between gap-2 pt-1 border-t border-slate-800 text-[11px] flex-wrap">
                <span className="text-slate-400">Target Link:</span>
                <a
                  href={detailsCampaign.targetUrl || detailsCampaign.target_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-400 hover:underline flex items-center gap-1 font-semibold truncate max-w-xs"
                >
                  <ExternalLink className="w-3 h-3" />
                  <span className="truncate">{detailsCampaign.targetUrl || detailsCampaign.target_url}</span>
                </a>
              </div>
              <div className="flex items-center justify-between text-[11px]">
                <span className="text-slate-400">Button Label:</span>
                <span className="font-bold text-white">{detailsCampaign.ctaText || detailsCampaign.cta_text || 'Learn More'}</span>
              </div>
            </div>

            {/* Performance Analytics Grid */}
            <div className="space-y-2">
              <span className="text-xs font-bold text-slate-300 uppercase tracking-wider block">Live Delivery Analytics</span>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-xs">
                <div className="p-3 rounded-xl bg-slate-900 border border-slate-800">
                  <span className="text-[10px] text-slate-400 uppercase font-semibold block">Total Spent</span>
                  <span className="text-base font-black text-emerald-400">{Number(detailsCampaign.totalSpent ?? detailsCampaign.total_spent ?? 0).toLocaleString()} RWF</span>
                </div>
                <div className="p-3 rounded-xl bg-slate-900 border border-slate-800">
                  <span className="text-[10px] text-slate-400 uppercase font-semibold block">Delivered Views</span>
                  <span className="text-base font-black text-blue-400">{Number(detailsCampaign.currentImpressions ?? detailsCampaign.impressions_count ?? 0).toLocaleString()}</span>
                </div>
                <div className="p-3 rounded-xl bg-slate-900 border border-slate-800">
                  <span className="text-[10px] text-slate-400 uppercase font-semibold block">Verified Clicks</span>
                  <span className="text-base font-black text-purple-400">{Number(detailsCampaign.currentClicks ?? detailsCampaign.clicks_count ?? 0).toLocaleString()}</span>
                </div>
                <div className="p-3 rounded-xl bg-slate-900 border border-slate-800">
                  <span className="text-[10px] text-slate-400 uppercase font-semibold block">Click Rate (CTR)</span>
                  <span className="text-base font-black text-amber-400">
                    {Number(detailsCampaign.currentImpressions ?? detailsCampaign.impressions_count ?? 0) > 0
                      ? (((Number(detailsCampaign.currentClicks ?? detailsCampaign.clicks_count ?? 0) / Number(detailsCampaign.currentImpressions ?? detailsCampaign.impressions_count ?? 1)) * 100).toFixed(1))
                      : '0.0'}%
                  </span>
                </div>
              </div>
            </div>

            {/* Campaign Bidding & Budget Breakdown */}
            <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
              <div>
                <span className="text-[10px] text-slate-400 uppercase block font-semibold">Daily Budget</span>
                <span className="font-bold text-white text-sm">{Number(detailsCampaign.dailyBudget ?? detailsCampaign.daily_budget ?? 100).toLocaleString()} RWF</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 uppercase block font-semibold">CPM Bid</span>
                <span className="font-bold text-amber-400 text-sm">{detailsCampaign.cpmBid ?? detailsCampaign.cpm_bid ?? 20} RWF</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 uppercase block font-semibold">CPC Bid</span>
                <span className="font-bold text-purple-400 text-sm">{detailsCampaign.cpcBid ?? detailsCampaign.cpc_bid ?? 15} RWF</span>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => {
                  const c = detailsCampaign;
                  setDetailsCampaign(null);
                  openEditModal(c);
                }}
                className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-black text-xs font-black flex items-center gap-1.5 transition-all"
              >
                <Edit3 className="w-3.5 h-3.5" />
                <span>Edit Campaign</span>
              </button>
              <button
                type="button"
                onClick={() => setDetailsCampaign(null)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition-all"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Ad Campaign Modal */}
      {editingCampaign && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-lg rounded-3xl bg-[#101726] border border-slate-800 shadow-2xl p-6 sm:p-7 space-y-5 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-amber-500/20 text-amber-400">
                  <Edit3 className="w-4 h-4" />
                </div>
                <h3 className="text-base font-black text-white">Edit Ad Campaign</h3>
              </div>
              <button
                onClick={() => setEditingCampaign(null)}
                className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveCampaignEdit} className="space-y-4 text-xs">
              <div>
                <label className="block text-[11px] font-bold text-slate-300 uppercase mb-1">
                  Campaign Title *
                </label>
                <input
                  type="text"
                  required
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  className="w-full px-3 py-2.5 bg-slate-900 border border-slate-700 focus:border-amber-500 rounded-xl text-white outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-300 uppercase mb-1">
                  Description / Pitch
                </label>
                <textarea
                  rows={2}
                  value={editDesc}
                  onChange={(e) => setEditDesc(e.target.value)}
                  className="w-full px-3 py-2.5 bg-slate-900 border border-slate-700 focus:border-amber-500 rounded-xl text-white outline-none resize-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-300 uppercase mb-1">
                  Target Website / Destination URL *
                </label>
                <input
                  type="url"
                  required
                  value={editTargetUrl}
                  onChange={(e) => setEditTargetUrl(e.target.value)}
                  className="w-full px-3 py-2.5 bg-slate-900 border border-slate-700 focus:border-amber-500 rounded-xl text-white outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-300 uppercase mb-1">
                  Call-to-Action Button Text
                </label>
                <select
                  value={editCtaText}
                  onChange={(e) => setEditCtaText(e.target.value)}
                  className="w-full px-3 py-2.5 bg-slate-900 border border-slate-700 focus:border-amber-500 rounded-xl text-white outline-none"
                >
                  <option value="Learn More">Learn More</option>
                  <option value="Shop Now">Shop Now</option>
                  <option value="Visit Website">Visit Website</option>
                  <option value="Subscribe">Subscribe</option>
                  <option value="Contact Us">Contact Us</option>
                  <option value="Download App">Download App</option>
                </select>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
                <div>
                  <label className="block text-[10px] font-bold text-slate-300 uppercase mb-1">
                    Daily Budget (RWF)
                  </label>
                  <input
                    type="number"
                    min={100}
                    value={editDailyBudget}
                    onChange={(e) => setEditDailyBudget(Math.max(100, Number(e.target.value) || 100))}
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-700 focus:border-amber-500 rounded-xl text-white font-bold outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-300 uppercase mb-1">
                    CPM Bid (1k Views)
                  </label>
                  <input
                    type="number"
                    min={10}
                    value={editCpmBid}
                    onChange={(e) => setEditCpmBid(Math.max(10, Number(e.target.value) || 10))}
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-700 focus:border-amber-500 rounded-xl text-amber-400 font-bold outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-300 uppercase mb-1">
                    CPC Bid (Per Click)
                  </label>
                  <input
                    type="number"
                    min={5}
                    value={editCpcBid}
                    onChange={(e) => setEditCpcBid(Math.max(5, Number(e.target.value) || 5))}
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-700 focus:border-purple-500 rounded-xl text-purple-400 font-bold outline-none"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setEditingCampaign(null)}
                  className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={editSaving}
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-black font-black flex items-center gap-1.5 transition-all disabled:opacity-50"
                >
                  <Save className="w-4 h-4" />
                  <span>{editSaving ? 'Saving Changes...' : 'Save Changes'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Central Wallet Modal */}
      {showCreateMediaModal && (
        <CreateMediaModal
          isOpen={showCreateMediaModal}
          onClose={() => setShowCreateMediaModal(false)}
        />
      )}

      {selectedReceiptTx && (
        <DashboardReceiptModal
          isOpen={!!selectedReceiptTx}
          onClose={() => setSelectedReceiptTx(null)}
          tx={selectedReceiptTx}
        />
      )}

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
