import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { useTheme, ThemeMode, AccentColor } from '../context/ThemeContext';
import { SeoHead } from '../components/common/SeoHead';
import { WalletModal } from '../components/modals/WalletModal';
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
  ArrowLeft
} from 'lucide-react';

export const DashboardPage: React.FC = () => {
  const { user, wallet, token, updateWalletBalance, updatePreferences } = useAuth();
  const { language, setLanguage, t } = useLanguage();
  const { mode, accent, setMode, setAccent } = useTheme();

  const [activeTab, setActiveTab] = useState<'overview' | 'wallet' | 'customizer' | 'referrals' | 'security'>('overview');
  const [copied, setCopied] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState('');
  const [showWalletModal, setShowWalletModal] = useState(false);

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

      </div>

      {/* Central Wallet Modal */}
      {showWalletModal && (
        <WalletModal
          isOpen={showWalletModal}
          onClose={() => setShowWalletModal(false)}
        />
      )}
    </div>
  );
};
