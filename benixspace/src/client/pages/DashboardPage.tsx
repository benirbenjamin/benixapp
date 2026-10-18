import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { useTheme, ThemeMode, AccentColor } from '../context/ThemeContext';
import { SeoHead } from '../components/common/SeoHead';
import {
  LayoutDashboard,
  Wallet,
  Gift,
  Settings,
  Users,
  BarChart3,
  Tv,
  Radio,
  Heart,
  Music,
  ShoppingBag,
  Dices,
  Calculator,
  HardDrive,
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
  AlertCircle
} from 'lucide-react';

export const DashboardPage: React.FC = () => {
  const { user, wallet, token, updateWalletBalance, updatePreferences } = useAuth();
  const { language, setLanguage, t } = useLanguage();
  const { mode, accent, setMode, setAccent } = useTheme();

  const [activeTab, setActiveTab] = useState<'overview' | 'preferences' | 'settings' | 'analytics' | 'users'>('overview');
  const [copied, setCopied] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState('');

  // Selected Modules
  const [modules, setModules] = useState<string[]>(
    user?.selected_modules || ['videos', 'radio', 'dating', 'music', 'marketplace', 'games', 'calc']
  );

  // Google Drive Admin Config State
  const [driveConfig, setDriveConfig] = useState({
    clientId: '',
    clientSecret: '',
    refreshToken: '',
    folderId: 'root'
  });
  const [driveTesting, setDriveTesting] = useState(false);
  const [driveStatus, setDriveStatus] = useState<string | null>(null);

  // Users State (For Admin role)
  const [allUsers, setAllUsers] = useState<any[]>([]);

  useEffect(() => {
    if (token) {
      // Fetch Google Drive Settings if admin
      if (user?.role === 'admin' || user?.role === 'superadmin') {
        fetch('/api/admin/settings/storage', {
          headers: { Authorization: `Bearer ${token}` }
        })
          .then((res) => res.json())
          .then((data) => {
            setDriveConfig({
              clientId: data.clientId || '',
              clientSecret: data.clientSecret || '',
              refreshToken: data.refreshToken || '',
              folderId: data.folderId || 'root'
            });
          })
          .catch(() => {});

        fetch('/api/admin/users', {
          headers: { Authorization: `Bearer ${token}` }
        })
          .then((res) => res.json())
          .then((data) => setAllUsers(data.users || []))
          .catch(() => {});
      }
    }
  }, [token, user]);

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

  const handleSaveDriveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setDriveStatus('Saving...');
    try {
      const res = await fetch('/api/admin/settings/storage', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(driveConfig)
      });
      const data = await res.json();
      setDriveStatus(data.message || 'Storage settings saved successfully!');
    } catch (e: any) {
      setDriveStatus('Failed to save settings: ' + e.message);
    }
  };

  const handleTestDriveConnection = async () => {
    setDriveTesting(true);
    setDriveStatus(null);
    try {
      const res = await fetch('/api/admin/settings/storage/test', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      setDriveStatus(data.message);
    } catch (e: any) {
      setDriveStatus('Test failed: ' + e.message);
    } finally {
      setDriveTesting(false);
    }
  };

  const isSuperAdmin = user?.role === 'superadmin' || user?.role === 'admin';

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 py-8 transition-colors">
      <SeoHead
        title="Unified Super-App Dashboard — BenixSpace"
        description="Unified personalized dashboard across all BenixSpace apps: TV, Radio, Kunda Dating, Voxify, Benix Marketplace, RollDice, and central wallet ledger."
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        
        {/* Top Header Card */}
        <div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-r from-slate-900 via-sky-950 to-slate-900 text-white shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-6 border border-slate-800">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider bg-sky-500/20 text-sky-300 border border-sky-500/30 px-3 py-1 rounded-full">
                Personalized Super-App Dashboard
              </span>
              <span className="text-xs font-bold text-amber-400 bg-amber-400/10 border border-amber-400/30 px-3 py-1 rounded-full uppercase">
                {user?.role || 'Guest'}
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              {user ? `Hello, ${user.name} 👋` : 'Welcome to Benix.Space'}
            </h1>
            <p className="text-slate-300 text-xs sm:text-sm">
              One unified platform combining streaming media, games, dating, marketplace, and finance tools.
            </p>
          </div>

          {/* Quick Wallet & Referral Widget */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="p-4 rounded-2xl bg-white/10 backdrop-blur-md border border-white/10 text-right">
              <span className="text-[10px] text-slate-300 uppercase font-bold block">Central Wallet</span>
              <span className="text-xl font-black text-emerald-400">
                {(wallet?.balance || 0).toLocaleString()} RWF
              </span>
            </div>

            <button
              onClick={handleCopyRef}
              className="px-4 py-3 rounded-2xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs flex items-center gap-2 transition-all shadow-md"
              title="Copy referral link"
            >
              <Gift className="w-4 h-4" />
              <span>{copied ? 'Copied!' : 'Invite & Earn 500 RWF'}</span>
            </button>
          </div>
        </div>

        {/* Dashboard Navigation Tabs */}
        <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-3 overflow-x-auto scrollbar-none">
          {[
            { id: 'overview', label: 'Overview & Apps', icon: LayoutDashboard },
            { id: 'preferences', label: 'Module Customizer', icon: Palette },
            { id: 'settings', label: 'Broad Project Settings & Drive', icon: Settings },
            { id: 'analytics', label: 'Cross-App Analytics', icon: BarChart3 },
            ...(isSuperAdmin ? [{ id: 'users', label: 'User Directory', icon: Users }] : [])
          ].map((tab) => {
            const Icon = tab.icon;
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`px-4 py-2.5 rounded-2xl text-xs font-bold flex items-center gap-2 shrink-0 transition-all ${
                  active
                    ? 'bg-sky-600 text-white shadow-md shadow-sky-600/20'
                    : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-800 hover:bg-slate-50'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* TAB 1: OVERVIEW & CONNECTED APPS */}
        {activeTab === 'overview' && (
          <div className="space-y-8">
            {/* 7 Connected App Cards */}
            <div>
              <h3 className="text-sm font-extrabold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-4">
                Your Enabled Application Suite
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                  { id: 'videos', name: 'Benix Space TV', icon: Tv, path: '/tv', desc: 'Live Rwandan TV & Video Stream', color: 'text-sky-600 bg-sky-50 dark:bg-sky-950/40' },
                  { id: 'radio', name: 'Live Radio FM', icon: Radio, path: '/radio', desc: '24/7 Digital Radio & Shows', color: 'text-purple-600 bg-purple-50 dark:bg-purple-950/40' },
                  { id: 'dating', name: 'Kunda Space', icon: Heart, path: '/dating', desc: 'Verified Rwandan Dating & Matchmaking', color: 'text-rose-600 bg-rose-50 dark:bg-rose-950/40' },
                  { id: 'music', name: 'Voxify Choirs', icon: Music, path: '/music', desc: 'Choir Music & Vocal Tracks', color: 'text-indigo-600 bg-indigo-50 dark:bg-indigo-950/40' },
                  { id: 'marketplace', name: 'Benix Market', icon: ShoppingBag, path: '/marketplace', desc: 'Digital Goods & Freelance Services', color: 'text-emerald-600 bg-emerald-50 dark:bg-emerald-950/40' },
                  { id: 'games', name: 'RollDice Games', icon: Dices, path: '/games', desc: 'RollDice Challenges & Wagers', color: 'text-amber-600 bg-amber-50 dark:bg-amber-950/40' },
                  { id: 'calc', name: 'EasyCalc Smart', icon: Calculator, path: '/calc', desc: 'Loan EMI & Financial Tools', color: 'text-teal-600 bg-teal-50 dark:bg-teal-950/40' }
                ].map((app) => {
                  const Icon = app.icon;
                  const isEnabled = modules.includes(app.id);
                  return (
                    <a
                      key={app.id}
                      href={app.path}
                      className={`p-5 rounded-3xl border transition-all flex flex-col justify-between ${
                        isEnabled
                          ? 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:shadow-lg'
                          : 'bg-slate-100 dark:bg-slate-900/50 border-slate-200 dark:border-slate-800 opacity-50'
                      }`}
                    >
                      <div className="flex items-start justify-between mb-4">
                        <div className={`p-3 rounded-2xl ${app.color}`}>
                          <Icon className="w-6 h-6" />
                        </div>
                        <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                          isEnabled ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950' : 'bg-slate-200 text-slate-500'
                        }`}>
                          {isEnabled ? 'Active' : 'Disabled'}
                        </span>
                      </div>
                      <div>
                        <h4 className="font-extrabold text-sm text-slate-900 dark:text-white">{app.name}</h4>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{app.desc}</p>
                      </div>
                    </a>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: PREFERENCES & CUSTOMIZER */}
        {activeTab === 'preferences' && (
          <div className="p-6 sm:p-8 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-6">
            <div>
              <h3 className="font-extrabold text-lg text-slate-900 dark:text-white">
                Customize Your Modules & Homepage Feed
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Toggle apps on or off to tailor your homepage experience:
              </p>
            </div>

            {saveSuccess && (
              <div className="p-3 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-2xl text-xs font-bold flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4" />
                <span>{saveSuccess}</span>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {[
                { id: 'videos', label: 'TV & Video Stream' },
                { id: 'radio', label: 'Live Radio 24/7' },
                { id: 'dating', label: 'Kunda Space Dating' },
                { id: 'music', label: 'Voxify Music & Choirs' },
                { id: 'marketplace', label: 'Benix Marketplace' },
                { id: 'games', label: 'RollDice Games' },
                { id: 'calc', label: 'EasyCalc Smart Calculators' }
              ].map((item) => {
                const active = modules.includes(item.id);
                return (
                  <button
                    key={item.id}
                    onClick={() => handleToggleModule(item.id)}
                    className={`p-4 rounded-2xl border text-left flex items-center justify-between transition-all ${
                      active
                        ? 'border-sky-500 bg-sky-50/70 dark:bg-sky-950/40 text-sky-900 dark:text-sky-200 font-bold'
                        : 'border-slate-200 dark:border-slate-800 text-slate-500'
                    }`}
                  >
                    <span className="text-xs">{item.label}</span>
                    <span className={`w-5 h-5 rounded-full flex items-center justify-center text-xs ${
                      active ? 'bg-sky-600 text-white' : 'bg-slate-200 text-slate-500'
                    }`}>
                      {active ? '✓' : ''}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* TAB 3: BROAD PROJECT SETTINGS & GOOGLE DRIVE */}
        {activeTab === 'settings' && (
          <div className="space-y-6">
            
            {/* Google Drive Configuration Card */}
            <div className="p-6 sm:p-8 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-4">
                <div className="flex items-center gap-3">
                  <div className="p-3 rounded-2xl bg-amber-50 dark:bg-amber-950/40 text-amber-600">
                    <HardDrive className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="font-extrabold text-base text-slate-900 dark:text-white">
                      Google Drive Cloud Storage via Refresh Token
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      Store user uploads, videos, songs, and files directly to Google Drive.
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleTestDriveConnection}
                  disabled={driveTesting}
                  className="px-4 py-2.5 rounded-2xl bg-slate-900 text-white dark:bg-slate-800 text-xs font-bold hover:bg-slate-800 disabled:opacity-50 transition-all flex items-center gap-2 shrink-0"
                >
                  <Sparkles className="w-4 h-4 text-amber-400" />
                  <span>{driveTesting ? 'Verifying Token...' : 'Test Drive Connection'}</span>
                </button>
              </div>

              {driveStatus && (
                <div className={`p-4 rounded-2xl text-xs font-medium border flex items-center gap-2 ${
                  driveStatus.includes('success') || driveStatus.includes('valid')
                    ? 'bg-emerald-50 text-emerald-800 border-emerald-200 dark:bg-emerald-950 dark:text-emerald-300'
                    : 'bg-amber-50 text-amber-800 border-amber-200 dark:bg-amber-950 dark:text-amber-300'
                }`}>
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  <span>{driveStatus}</span>
                </div>
              )}

              <form onSubmit={handleSaveDriveSettings} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                      Google Drive Client ID
                    </label>
                    <input
                      type="text"
                      value={driveConfig.clientId}
                      onChange={(e) => setDriveConfig({ ...driveConfig, clientId: e.target.value })}
                      placeholder="e.g. 123456789-abcdef.apps.googleusercontent.com"
                      className="w-full px-4 py-3 rounded-2xl border border-slate-200 dark:border-slate-800 dark:bg-slate-800 text-xs font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                      Google Drive Client Secret
                    </label>
                    <input
                      type="password"
                      value={driveConfig.clientSecret}
                      onChange={(e) => setDriveConfig({ ...driveConfig, clientSecret: e.target.value })}
                      placeholder="Enter Client Secret"
                      className="w-full px-4 py-3 rounded-2xl border border-slate-200 dark:border-slate-800 dark:bg-slate-800 text-xs font-mono"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                      OAuth2 Refresh Token *
                    </label>
                    <input
                      type="password"
                      value={driveConfig.refreshToken}
                      onChange={(e) => setDriveConfig({ ...driveConfig, refreshToken: e.target.value })}
                      placeholder="1//04abcdef... (Persistent Refresh Token)"
                      className="w-full px-4 py-3 rounded-2xl border border-slate-200 dark:border-slate-800 dark:bg-slate-800 text-xs font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                      Target Folder ID
                    </label>
                    <input
                      type="text"
                      value={driveConfig.folderId}
                      onChange={(e) => setDriveConfig({ ...driveConfig, folderId: e.target.value })}
                      placeholder="root or Folder ID"
                      className="w-full px-4 py-3 rounded-2xl border border-slate-200 dark:border-slate-800 dark:bg-slate-800 text-xs font-mono"
                    />
                  </div>
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    className="px-6 py-3 rounded-2xl bg-sky-600 hover:bg-sky-700 text-white font-bold text-xs shadow-md transition-all"
                  >
                    Save Google Drive Cloud Storage Configuration
                  </button>
                </div>
              </form>
            </div>

            {/* Other Project Control Settings */}
            <div className="p-6 sm:p-8 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-4">
              <h4 className="font-extrabold text-sm uppercase tracking-wider text-slate-700 dark:text-slate-300">
                Broad App Values & Rules
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 space-y-2">
                  <span className="font-bold text-slate-900 dark:text-white block">RollDice Gaming Stake</span>
                  <span className="text-slate-500">Min wager: 100 RWF • Max wager: 50,000 RWF</span>
                </div>
                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 space-y-2">
                  <span className="font-bold text-slate-900 dark:text-white block">Kunda Space Matching</span>
                  <span className="text-slate-500">Age: 18+ strict • Verification: SMS / Email</span>
                </div>
                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 space-y-2">
                  <span className="font-bold text-slate-900 dark:text-white block">Referral Rewards</span>
                  <span className="text-slate-500">500 RWF credited upon qualifying first deposit</span>
                </div>
              </div>
            </div>

          </div>
        )}

        {/* TAB 4: CROSS-APP ANALYTICS */}
        {activeTab === 'analytics' && (
          <div className="p-6 sm:p-8 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-6">
            <h3 className="font-extrabold text-lg text-slate-900 dark:text-white">
              Broad Cross-Module Analytics
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="p-4 rounded-2xl bg-sky-50 dark:bg-sky-950/40 border border-sky-100 dark:border-sky-900">
                <span className="text-xs text-sky-700 dark:text-sky-300 font-bold block">TV Views</span>
                <span className="text-2xl font-black text-slate-900 dark:text-white">7,948</span>
              </div>
              <div className="p-4 rounded-2xl bg-purple-50 dark:bg-purple-950/40 border border-purple-100 dark:border-purple-900">
                <span className="text-xs text-purple-700 dark:text-purple-300 font-bold block">Radio Listeners</span>
                <span className="text-2xl font-black text-slate-900 dark:text-white">791</span>
              </div>
              <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-100 dark:border-amber-900">
                <span className="text-xs text-amber-700 dark:text-amber-300 font-bold block">Dice Rolls</span>
                <span className="text-2xl font-black text-slate-900 dark:text-white">320</span>
              </div>
              <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-100 dark:border-emerald-900">
                <span className="text-xs text-emerald-700 dark:text-emerald-300 font-bold block">Market Items</span>
                <span className="text-2xl font-black text-slate-900 dark:text-white">244</span>
              </div>
            </div>
          </div>
        )}

        {/* TAB 5: USER MANAGEMENT (ADMIN ONLY) */}
        {activeTab === 'users' && isSuperAdmin && (
          <div className="p-6 sm:p-8 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
              <div>
                <h3 className="font-extrabold text-base text-slate-900 dark:text-white">
                  Unified Users Directory ({allUsers.length})
                </h3>
                <p className="text-xs text-slate-500">Migrated accounts from TV, Radio, Kunda, Voxify, and Marketplace into Neon PostgreSQL core_users.</p>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-500 font-bold uppercase">
                    <th className="py-3 px-3">Name</th>
                    <th className="py-3 px-3">Email</th>
                    <th className="py-3 px-3">Role</th>
                    <th className="py-3 px-3">Wallet</th>
                    <th className="py-3 px-3">Referral Code</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {allUsers.map((u) => (
                    <tr key={u.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                      <td className="py-3 px-3 font-bold text-slate-900 dark:text-white">{u.name}</td>
                      <td className="py-3 px-3 text-slate-600 dark:text-slate-300 font-mono">{u.email}</td>
                      <td className="py-3 px-3">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                          u.role === 'superadmin' ? 'bg-amber-100 text-amber-800' : 'bg-slate-100 text-slate-700'
                        }`}>
                          {u.role}
                        </span>
                      </td>
                      <td className="py-3 px-3 font-bold text-emerald-600">
                        {Number(u.wallet_balance || 0).toLocaleString()} RWF
                      </td>
                      <td className="py-3 px-3 font-mono text-slate-500">{u.referral_code || '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};
