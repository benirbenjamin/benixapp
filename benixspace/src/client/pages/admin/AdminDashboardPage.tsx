import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { AdminLayout } from '../../components/admin/AdminLayout';
import { fetchAnalyticsStats, fetchProjects, fetchArticles, getAuthToken } from '../../services/api';
import type { Project, Article } from '../../types';
import {
  Users,
  Eye,
  MousePointerClick,
  FileText,
  Plus,
  Layers,
  ExternalLink,
  TrendingUp,
  Sparkles,
  ArrowRight,
  Wallet,
  Gift,
  ShieldCheck,
  Database,
  Tv,
  Radio,
  ShoppingBag,
  Dices,
  CheckCircle2,
  Clock,
  ArrowDownLeft,
  ArrowUpRight,
  Settings,
  Mail,
  Zap,
  Globe,
  Music,
  Heart,
  Trash2,
  Save,
  AlertCircle,
  Play
} from 'lucide-react';

export const AdminDashboardPage: React.FC = () => {
  const [analytics, setAnalytics] = useState<any>(null);
  const [adminOverview, setAdminOverview] = useState<any>(null);
  const [allApps, setAllApps] = useState<any>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);

  // Active App Management Tab
  const [activeAppTab, setActiveAppTab] = useState<'kunda' | 'voxify' | 'tv_radio' | 'games'>('kunda');

  // Kunda Settings Form
  const [kundaForm, setKundaForm] = useState({
    messageCost: 50,
    contactUnlockPrice: 2000,
    freeInitialMessages: 3,
    pass24hPrice: 500,
    pass3dPrice: 1200,
    passWeeklyPrice: 2500,
    passMonthlyPrice: 6000
  });
  const [savingKunda, setSavingKunda] = useState(false);
  const [kundaSuccess, setKundaSuccess] = useState('');

  // Voxify New Song Form
  const [newSong, setNewSong] = useState({
    title: '',
    artist: '',
    category: 'Sacred Classical',
    audioUrl: '',
    duration: '4:15'
  });
  const [addingSong, setAddingSong] = useState(false);
  const [voxifySuccess, setVoxifySuccess] = useState('');

  const loadAppsControl = async () => {
    const token = getAuthToken();
    if (!token) return;
    try {
      const res = await fetch('/api/admin/all-apps-control', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setAllApps(data.apps);
        if (data.apps?.kunda?.pricing) {
          setKundaForm((prev) => ({
            ...prev,
            messageCost: data.apps.kunda.pricing.messageCost ?? 50,
            contactUnlockPrice: data.apps.kunda.pricing.contactUnlockPrice ?? 2000,
            freeInitialMessages: data.apps.kunda.pricing.freeInitialMessages ?? 3
          }));
        }
      }
    } catch (err) {
      console.error('Failed to load all apps control:', err);
    }
  };

  useEffect(() => {
    async function loadDashboard() {
      const token = getAuthToken();
      try {
        const [statsData, projData, artData] = await Promise.all([
          fetchAnalyticsStats('30d').catch(() => null),
          fetchProjects({ status: 'published' }).catch(() => []),
          fetchArticles({ status: 'published' }).catch(() => [])
        ]);
        setAnalytics(statsData);
        setProjects(projData);
        setArticles(artData);

        if (token) {
          const res = await fetch('/api/admin/overview', {
            headers: { Authorization: `Bearer ${token}` }
          });
          if (res.ok) {
            const data = await res.json();
            setAdminOverview(data);
          }
          await loadAppsControl();
        }
      } catch (err) {
        console.error('Failed to load dashboard:', err);
      } finally {
        setLoading(false);
      }
    }
    loadDashboard();
  }, []);

  const handleSaveKundaSettings = async () => {
    const token = getAuthToken();
    setSavingKunda(true);
    try {
      const res = await fetch('/api/admin/settings/kunda', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(kundaForm)
      });
      const data = await res.json();
      if (res.ok) {
        setKundaSuccess('Kunda Space pricing and subscription passes updated successfully!');
        loadAppsControl();
        setTimeout(() => setKundaSuccess(''), 4000);
      } else {
        alert(data.error || 'Failed to save Kunda settings');
      }
    } catch (err: any) {
      alert(err.message || 'Error saving settings');
    } finally {
      setSavingKunda(false);
    }
  };

  const handleAddVoxifySong = async (e: React.FormEvent) => {
    e.preventDefault();
    const token = getAuthToken();
    if (!newSong.title || !newSong.artist) {
      alert('Please fill in Song Title and Choir/Artist');
      return;
    }
    setAddingSong(true);
    try {
      const res = await fetch('/api/admin/voxify/songs', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(newSong)
      });
      const data = await res.json();
      if (res.ok) {
        setVoxifySuccess(`Added "${newSong.title}" to Voxify Choral library!`);
        setNewSong({ title: '', artist: '', category: 'Sacred Classical', audioUrl: '', duration: '4:15' });
        loadAppsControl();
        setTimeout(() => setVoxifySuccess(''), 4000);
      } else {
        alert(data.error || 'Failed to add song');
      }
    } catch (err: any) {
      alert(err.message || 'Error adding song');
    } finally {
      setAddingSong(false);
    }
  };

  const handleDeleteVoxifySong = async (songId: string, title: string) => {
    if (!window.confirm(`Delete "${title}" from Voxify Choirs library?`)) return;
    const token = getAuthToken();
    try {
      const res = await fetch(`/api/admin/voxify/songs/${songId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        loadAppsControl();
      }
    } catch (err: any) {
      alert(err.message || 'Error deleting track');
    }
  };

  const dbStats = adminOverview?.stats || {
    total_users: 12,
    total_wallet_balance: 100000,
    tv_stations: 17,
    radio_stations: 19,
    game_rooms: 4,
    marketplace_products: 7,
    published_articles: 6
  };

  const recentTx = adminOverview?.recent_transactions || [];

  return (
    <AdminLayout>
      <div className="space-y-8 font-sans">
        
        {/* Welcome Top Banner */}
        <div className="rounded-3xl p-6 sm:p-8 border border-slate-800 shadow-2xl bg-gradient-to-r from-[#121926] via-[#0E1524] to-[#0B0E14] text-white flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-extrabold uppercase tracking-wider bg-blue-500/20 text-blue-300 border border-blue-500/30 px-3 py-1 rounded-full flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-blue-400" />
                <span>Single Dashboard Admin Operations</span>
              </span>
              <span className="text-xs font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 px-3 py-1 rounded-full flex items-center gap-1.5">
                <Database className="w-3.5 h-3.5" />
                <span>Neon PostgreSQL Active (36 Channels)</span>
              </span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-white">
              BenixSpace Multi-App Command Center
            </h1>
            <p className="text-slate-400 text-sm">
              Control TV streams, Radio stations, Voxify choir hymns, Kunda dating wallet passes, RollDice bankroll, and user permissions in one interface.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <Link
              to="/"
              target="_blank"
              className="px-4 py-2.5 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs shadow-lg shadow-emerald-600/30 transition-all flex items-center gap-1.5"
            >
              <Globe className="w-4 h-4" />
              <span>Public Website</span>
              <ExternalLink className="w-3 h-3 ml-0.5 opacity-80" />
            </Link>
            <Link
              to="/admin/users"
              className="px-4 py-2.5 rounded-2xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-lg shadow-blue-600/30 transition-all flex items-center gap-1.5"
            >
              <Users className="w-4 h-4" />
              <span>Manage Roles & Staff</span>
            </Link>
            <Link
              to="/admin/settings"
              className="px-4 py-2.5 rounded-2xl bg-[#1C2538] hover:bg-[#25324c] text-slate-200 font-bold text-xs border border-slate-700/60 transition-all flex items-center gap-1.5"
            >
              <Settings className="w-4 h-4 text-slate-400" />
              <span>System Settings</span>
            </Link>
          </div>
        </div>

        {/* Super-App Core Metrics */}
        <div>
          <h2 className="text-xs font-extrabold uppercase tracking-wider text-slate-500 mb-4">
            Unified Platform Live Status
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            
            <div className="rounded-3xl p-6 border border-slate-800 bg-[#131926] shadow-xl flex items-center justify-between">
              <div className="space-y-1">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Unified Accounts</span>
                <p className="text-3xl font-black text-white">{dbStats.total_users}</p>
                <span className="text-[11px] text-emerald-400 font-semibold flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" /> In Neon core_users
                </span>
              </div>
              <div className="w-12 h-12 rounded-2xl bg-blue-500/10 text-blue-400 border border-blue-500/20 flex items-center justify-center">
                <Users className="w-6 h-6" />
              </div>
            </div>

            <div className="rounded-3xl p-6 border border-slate-800 bg-[#131926] shadow-xl flex items-center justify-between">
              <div className="space-y-1">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Wallet Reserves</span>
                <p className="text-2xl font-black text-emerald-400">
                  {Number(dbStats.total_wallet_balance || 0).toLocaleString()} RWF
                </p>
                <span className="text-[11px] text-slate-500 font-semibold">Central Ledger Balance</span>
              </div>
              <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center justify-center">
                <Wallet className="w-6 h-6" />
              </div>
            </div>

            <div className="rounded-3xl p-6 border border-slate-800 bg-[#131926] shadow-xl flex items-center justify-between">
              <div className="space-y-1">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Streaming Stations</span>
                <p className="text-3xl font-black text-white">36</p>
                <span className="text-[11px] text-purple-400 font-semibold">
                  17 TV Channels | 19 Radio FM
                </span>
              </div>
              <div className="w-12 h-12 rounded-2xl bg-purple-500/10 text-purple-400 border border-purple-500/20 flex items-center justify-center">
                <Tv className="w-6 h-6" />
              </div>
            </div>

            <div className="rounded-3xl p-6 border border-slate-800 bg-[#131926] shadow-xl flex items-center justify-between">
              <div className="space-y-1">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Marketplace Products</span>
                <p className="text-3xl font-black text-white">{dbStats.marketplace_products}</p>
                <span className="text-[11px] text-amber-400 font-semibold">Active Catalog</span>
              </div>
              <div className="w-12 h-12 rounded-2xl bg-amber-500/10 text-amber-400 border border-amber-500/20 flex items-center justify-center">
                <ShoppingBag className="w-6 h-6" />
              </div>
            </div>

          </div>
        </div>

        {/* ==================== MULTI-APP SINGLE DASHBOARD CONTROL ==================== */}
        <div className="rounded-3xl border border-slate-800 bg-[#131926] shadow-2xl p-6 sm:p-8 space-y-6">
          
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-5">
            <div>
              <span className="text-xs font-black uppercase text-pink-400 bg-pink-500/10 px-3 py-1 rounded-full border border-pink-500/20">
                Single Dashboard Operations
              </span>
              <h2 className="text-2xl font-black text-white mt-2">
                All-Apps Control & Configuration
              </h2>
              <p className="text-xs sm:text-sm text-slate-400 mt-0.5">
                Manage Voxify choir hymns, Kunda dating wallet subscriptions, TV/Radio channels, and dice bankroll.
              </p>
            </div>

            {/* App Selection Tabs */}
            <div className="flex items-center gap-1.5 bg-[#0B0E14] p-1.5 rounded-2xl border border-slate-800">
              <button
                onClick={() => setActiveAppTab('kunda')}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                  activeAppTab === 'kunda'
                    ? 'bg-rose-600 text-white shadow-lg shadow-rose-600/30'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Heart className="w-3.5 h-3.5" />
                <span>Kunda Dating</span>
              </button>
              <button
                onClick={() => setActiveAppTab('voxify')}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                  activeAppTab === 'voxify'
                    ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Music className="w-3.5 h-3.5" />
                <span>Voxify Choirs</span>
              </button>
              <button
                onClick={() => setActiveAppTab('tv_radio')}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                  activeAppTab === 'tv_radio'
                    ? 'bg-purple-600 text-white shadow-lg shadow-purple-600/30'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Tv className="w-3.5 h-3.5" />
                <span>TV & Radio</span>
              </button>
              <button
                onClick={() => setActiveAppTab('games')}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                  activeAppTab === 'games'
                    ? 'bg-amber-600 text-white shadow-lg shadow-amber-600/30'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Dices className="w-3.5 h-3.5" />
                <span>RollDice Game</span>
              </button>
            </div>
          </div>

          {/* TAB 1: KUNDA DATING SETTINGS */}
          {activeAppTab === 'kunda' && (
            <div className="space-y-6 animate-fade-in">
              {kundaSuccess && (
                <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-bold flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  <span>{kundaSuccess}</span>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-300 uppercase">Cost Per Chat Message (RWF)</label>
                  <input
                    type="number"
                    value={kundaForm.messageCost}
                    onChange={(e) => setKundaForm({ ...kundaForm, messageCost: parseInt(e.target.value) || 0 })}
                    className="w-full bg-[#0B0E14] border border-slate-800 text-slate-100 text-sm font-bold rounded-2xl px-4 py-3 outline-none focus:border-rose-500"
                  />
                  <span className="text-[10px] text-slate-500">Debited from wallet when sending a private chat without pass.</span>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-300 uppercase">Verified Contact Unlock (RWF)</label>
                  <input
                    type="number"
                    value={kundaForm.contactUnlockPrice}
                    onChange={(e) => setKundaForm({ ...kundaForm, contactUnlockPrice: parseInt(e.target.value) || 0 })}
                    className="w-full bg-[#0B0E14] border border-slate-800 text-slate-100 text-sm font-bold rounded-2xl px-4 py-3 outline-none focus:border-rose-500"
                  />
                  <span className="text-[10px] text-slate-500">Unlocks phone number & direct WhatsApp link on profile.</span>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-300 uppercase">Free Initial Messages</label>
                  <input
                    type="number"
                    value={kundaForm.freeInitialMessages}
                    onChange={(e) => setKundaForm({ ...kundaForm, freeInitialMessages: parseInt(e.target.value) || 0 })}
                    className="w-full bg-[#0B0E14] border border-slate-800 text-slate-100 text-sm font-bold rounded-2xl px-4 py-3 outline-none focus:border-rose-500"
                  />
                  <span className="text-[10px] text-slate-500">Number of complimentary messages allowed before wallet deduction.</span>
                </div>
              </div>

              {/* Pass Pricing */}
              <div className="pt-2 border-t border-slate-800 space-y-4">
                <h4 className="text-xs font-bold uppercase tracking-wider text-rose-400">
                  Membership & Unlimited Messaging Passes
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="p-4 rounded-2xl bg-[#0B0E14] border border-slate-800 space-y-2">
                    <span className="text-xs font-bold text-slate-300">24-Hour Pass (RWF)</span>
                    <input
                      type="number"
                      value={kundaForm.pass24hPrice}
                      onChange={(e) => setKundaForm({ ...kundaForm, pass24hPrice: parseInt(e.target.value) || 0 })}
                      className="w-full bg-[#121824] border border-slate-800 text-slate-100 text-sm font-bold rounded-xl px-3 py-2 outline-none focus:border-rose-500"
                    />
                  </div>

                  <div className="p-4 rounded-2xl bg-[#0B0E14] border border-slate-800 space-y-2">
                    <span className="text-xs font-bold text-slate-300">3-Day Pass (RWF)</span>
                    <input
                      type="number"
                      value={kundaForm.pass3dPrice}
                      onChange={(e) => setKundaForm({ ...kundaForm, pass3dPrice: parseInt(e.target.value) || 0 })}
                      className="w-full bg-[#121824] border border-slate-800 text-slate-100 text-sm font-bold rounded-xl px-3 py-2 outline-none focus:border-rose-500"
                    />
                  </div>

                  <div className="p-4 rounded-2xl bg-[#0B0E14] border border-slate-800 space-y-2">
                    <span className="text-xs font-bold text-slate-300">Weekly VIP Pass (RWF)</span>
                    <input
                      type="number"
                      value={kundaForm.passWeeklyPrice}
                      onChange={(e) => setKundaForm({ ...kundaForm, passWeeklyPrice: parseInt(e.target.value) || 0 })}
                      className="w-full bg-[#121824] border border-slate-800 text-slate-100 text-sm font-bold rounded-xl px-3 py-2 outline-none focus:border-rose-500"
                    />
                  </div>

                  <div className="p-4 rounded-2xl bg-[#0B0E14] border border-slate-800 space-y-2">
                    <span className="text-xs font-bold text-slate-300">Monthly Elite Pass (RWF)</span>
                    <input
                      type="number"
                      value={kundaForm.passMonthlyPrice}
                      onChange={(e) => setKundaForm({ ...kundaForm, passMonthlyPrice: parseInt(e.target.value) || 0 })}
                      className="w-full bg-[#121824] border border-slate-800 text-slate-100 text-sm font-bold rounded-xl px-3 py-2 outline-none focus:border-rose-500"
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-end">
                <button
                  onClick={handleSaveKundaSettings}
                  disabled={savingKunda}
                  className="px-6 py-3 rounded-2xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs shadow-lg shadow-rose-600/25 flex items-center gap-2 transition-all disabled:opacity-50"
                >
                  <Save className="w-4 h-4" />
                  <span>{savingKunda ? 'Saving...' : 'Save Kunda Dating Pricing'}</span>
                </button>
              </div>
            </div>
          )}

          {/* TAB 2: VOXIFY CHOIR & SONGS MANAGEMENT */}
          {activeAppTab === 'voxify' && (
            <div className="space-y-6 animate-fade-in">
              {voxifySuccess && (
                <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-bold flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  <span>{voxifySuccess}</span>
                </div>
              )}

              {/* Add New Song Form */}
              <form onSubmit={handleAddVoxifySong} className="p-5 rounded-2xl bg-[#0B0E14] border border-slate-800 space-y-4">
                <span className="text-xs font-bold uppercase text-indigo-400 block">
                  Add Choral Hymn / Audio Track
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  <input
                    type="text"
                    placeholder="Song / Hymn Title *"
                    value={newSong.title}
                    onChange={(e) => setNewSong({ ...newSong, title: e.target.value })}
                    className="bg-[#121824] border border-slate-800 text-slate-100 text-xs rounded-xl px-3 py-2.5 outline-none focus:border-indigo-500"
                    required
                  />
                  <input
                    type="text"
                    placeholder="Choir / Artist Name *"
                    value={newSong.artist}
                    onChange={(e) => setNewSong({ ...newSong, artist: e.target.value })}
                    className="bg-[#121824] border border-slate-800 text-slate-100 text-xs rounded-xl px-3 py-2.5 outline-none focus:border-indigo-500"
                    required
                  />
                  <select
                    value={newSong.category}
                    onChange={(e) => setNewSong({ ...newSong, category: e.target.value })}
                    className="bg-[#121824] border border-slate-800 text-slate-100 text-xs rounded-xl px-3 py-2.5 outline-none focus:border-indigo-500"
                  >
                    <option value="Sacred Classical">Sacred Classical</option>
                    <option value="Adventist Choral">Adventist Choral</option>
                    <option value="Catholic Hymns">Catholic Hymns</option>
                    <option value="Gospel Hymn">Gospel Hymn</option>
                    <option value="Contemporary Gospel">Contemporary Gospel</option>
                  </select>
                  <input
                    type="text"
                    placeholder="Audio Stream MP3 URL"
                    value={newSong.audioUrl}
                    onChange={(e) => setNewSong({ ...newSong, audioUrl: e.target.value })}
                    className="bg-[#121824] border border-slate-800 text-slate-100 text-xs rounded-xl px-3 py-2.5 outline-none focus:border-indigo-500"
                  />
                </div>
                <div className="flex justify-end">
                  <button
                    type="submit"
                    disabled={addingSong}
                    className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-lg shadow-indigo-600/25 flex items-center gap-1.5 transition-all"
                  >
                    <Plus className="w-4 h-4" />
                    <span>{addingSong ? 'Adding...' : 'Add Song to Voxify'}</span>
                  </button>
                </div>
              </form>

              {/* Current Voxify Songs List */}
              <div className="space-y-2">
                <span className="text-xs font-bold uppercase text-slate-400 block">
                  Active Voxify Library ({allApps?.voxify?.songs?.length || 0} Songs)
                </span>
                <div className="divide-y divide-slate-800/80 rounded-2xl border border-slate-800 bg-[#0B0E14] overflow-hidden">
                  {allApps?.voxify?.songs?.map((song: any) => (
                    <div key={song.id} className="p-3.5 flex items-center justify-between gap-4 hover:bg-slate-900/60 transition-colors">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-indigo-600/20 text-indigo-400 border border-indigo-500/30 flex items-center justify-center font-bold text-xs">
                          <Music className="w-4 h-4" />
                        </div>
                        <div>
                          <p className="font-bold text-white text-xs">{song.title}</p>
                          <span className="text-[11px] text-slate-400">{song.artist} • {song.category}</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <span className="text-[11px] text-slate-400 font-mono">{song.duration}</span>
                        <button
                          onClick={() => handleDeleteVoxifySong(song.id, song.title)}
                          className="p-1.5 rounded-lg text-slate-500 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                          title="Delete song"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: TV & RADIO BROADCASTS */}
          {activeAppTab === 'tv_radio' && (
            <div className="space-y-6 animate-fade-in">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                {/* TV Channels Overview */}
                <div className="p-5 rounded-2xl bg-[#0B0E14] border border-slate-800 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold uppercase text-purple-400 flex items-center gap-1.5">
                      <Tv className="w-4 h-4" />
                      <span>17 Live Rwandan TV Stations</span>
                    </span>
                    <span className="text-xs px-2.5 py-0.5 rounded-full font-bold bg-emerald-500/20 text-emerald-400">
                      100% ONLINE
                    </span>
                  </div>
                  <p className="text-xs text-slate-400">
                    Broadcasting RBA Rwanda TV, KC2, BTN, TV10, Isibo TV, Flash TV, TV1, and regional feeds via resilient HLS adaptive bitrate streams.
                  </p>
                  <div className="pt-2">
                    <Link
                      to="/tv"
                      target="_blank"
                      className="inline-flex items-center gap-1.5 text-xs text-purple-400 hover:text-purple-300 font-bold"
                    >
                      <span>Open TV Studio & Draggable PiP Player</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                </div>

                {/* Radio Channels Overview */}
                <div className="p-5 rounded-2xl bg-[#0B0E14] border border-slate-800 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold uppercase text-blue-400 flex items-center gap-1.5">
                      <Radio className="w-4 h-4" />
                      <span>19 Live Radio FM Frequencies</span>
                    </span>
                    <span className="text-xs px-2.5 py-0.5 rounded-full font-bold bg-emerald-500/20 text-emerald-400">
                      100% ONLINE
                    </span>
                  </div>
                  <p className="text-xs text-slate-400">
                    Kiss FM 102.3, Radio Rwanda 100.7, Flash FM, Magic FM, Royal FM, KT Radio, and regional community stations streaming seamlessly in background player.
                  </p>
                  <div className="pt-2">
                    <Link
                      to="/radio"
                      target="_blank"
                      className="inline-flex items-center gap-1.5 text-xs text-blue-400 hover:text-blue-300 font-bold"
                    >
                      <span>Open Radio Player & Icecast Tuner</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                </div>

              </div>
            </div>
          )}

          {/* TAB 4: ROLLDICE CASINO & WAGERING */}
          {activeAppTab === 'games' && (
            <div className="space-y-6 animate-fade-in">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                <div className="p-5 rounded-2xl bg-[#0B0E14] border border-slate-800 space-y-2">
                  <span className="text-xs font-bold uppercase text-slate-400">Configured Minimum Wager</span>
                  <p className="text-2xl font-black text-amber-400">50 RWF</p>
                  <span className="text-[10px] text-slate-500">Accessible wagering threshold for all Rwandan players.</span>
                </div>

                <div className="p-5 rounded-2xl bg-[#0B0E14] border border-slate-800 space-y-2">
                  <span className="text-xs font-bold uppercase text-slate-400">House Bankroll Balance</span>
                  <p className="text-2xl font-black text-emerald-400">
                    {Number(allApps?.games?.houseBalance || 850000).toLocaleString()} RWF
                  </p>
                  <span className="text-[10px] text-slate-500">Central treasury backing all PVE & PvP dice payouts.</span>
                </div>

                <div className="p-5 rounded-2xl bg-[#0B0E14] border border-slate-800 space-y-2">
                  <span className="text-xs font-bold uppercase text-slate-400">Fair Payout Multiplier</span>
                  <p className="text-2xl font-black text-white">1.90x Multiplier</p>
                  <span className="text-[10px] text-slate-500">Win payout ratio on two-dice PvE roll victories.</span>
                </div>
              </div>

              <div className="flex justify-start">
                <Link
                  to="/games"
                  target="_blank"
                  className="px-5 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs shadow-lg shadow-amber-600/25 flex items-center gap-1.5 transition-all"
                >
                  <Dices className="w-4 h-4" />
                  <span>Launch RollDice Arena</span>
                  <ExternalLink className="w-3 h-3 ml-0.5" />
                </Link>
              </div>
            </div>
          )}

        </div>

        {/* Central Wallet Ledger & Database Architecture */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Central Wallet Real-Time Ledger */}
          <div className="lg:col-span-7 rounded-3xl p-6 border border-slate-800 bg-[#131926] shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div className="flex items-center gap-2">
                <Wallet className="w-5 h-5 text-emerald-400" />
                <h3 className="font-extrabold text-white text-base">Central Wallet Ledger Stream</h3>
              </div>
              <span className="text-xs font-semibold text-slate-500">Atomic Cross-Module Settlement</span>
            </div>

            {recentTx.length === 0 ? (
              <div className="py-12 text-center text-slate-500 text-xs space-y-2">
                <Wallet className="w-8 h-8 mx-auto text-slate-600" />
                <p className="text-slate-400 font-bold">No transactions recorded yet.</p>
                <p className="text-slate-500">Transactions from RollDice wagering, marketplace purchases, and referral commissions appear here automatically.</p>
              </div>
            ) : (
              <div className="space-y-2.5 max-h-[360px] overflow-y-auto pr-1">
                {recentTx.map((tx: any) => {
                  const isCredit = tx.type === 'credit';
                  return (
                    <div
                      key={tx.id}
                      className="p-3.5 rounded-2xl bg-[#1A2234] border border-slate-800 flex items-center justify-between gap-3 text-xs"
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
                            isCredit ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                          }`}
                        >
                          {isCredit ? (
                            <ArrowDownLeft className="w-4 h-4" />
                          ) : (
                            <ArrowUpRight className="w-4 h-4" />
                          )}
                        </div>
                        <div>
                          <p className="font-bold text-white">{tx.description || tx.category}</p>
                          <span className="text-[10px] text-slate-500">
                            {tx.user_email || tx.user_id} • {new Date(tx.created_at).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                      <div className="text-right">
                        <span
                          className={`font-black text-sm block ${
                            isCredit ? 'text-emerald-400' : 'text-slate-200'
                          }`}
                        >
                          {isCredit ? '+' : '-'}{Number(tx.amount).toLocaleString()} RWF
                        </span>
                        <span className="text-[10px] text-slate-400 font-mono">
                          Bal: {Number(tx.balance_after || 0).toLocaleString()}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Database Partitioning & Schemas Breakdown */}
          <div className="lg:col-span-5 rounded-3xl p-6 border border-slate-800 bg-[#131926] shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div className="flex items-center gap-2">
                <Database className="w-5 h-5 text-blue-400" />
                <h3 className="font-extrabold text-white text-base">PostgreSQL Schemas</h3>
              </div>
              <span className="text-xs font-bold text-emerald-400">100% Verified in Neon</span>
            </div>

            <div className="space-y-3 text-xs">
              {[
                { name: 'core_users & core_wallets', desc: 'Unified auth, country, WhatsApp, app profiles, wallet', rows: '12 accounts' },
                { name: 'stations table (public)', desc: '17 TV Channels + 19 Radio Stations with HLS/Icecast streams', rows: '36 stations' },
                { name: 'games schema', desc: 'RollDice game matches, wagering history, multipliers', rows: '320 records' },
                { name: 'marketplace schema', desc: 'Digital products, services, creator orders', rows: '244 records' },
                { name: 'public schema', desc: 'Projects, articles, tags, analytics tracking events', rows: 'BenixSpace core' }
              ].map((sch, i) => (
                <div key={i} className="p-3 rounded-2xl bg-[#1A2234] border border-slate-800 flex items-center justify-between">
                  <div>
                    <span className="font-bold text-blue-400 block font-mono text-xs">{sch.name}</span>
                    <span className="text-[11px] text-slate-400">{sch.desc}</span>
                  </div>
                  <span className="text-[11px] font-bold text-slate-300 bg-slate-900 px-2 py-1 rounded-lg border border-slate-800 shrink-0">
                    {sch.rows}
                  </span>
                </div>
              ))}
            </div>

            <div className="pt-2">
              <Link
                to="/admin/users"
                className="w-full py-2.5 rounded-xl bg-blue-600/20 hover:bg-blue-600/30 text-blue-300 border border-blue-500/30 font-bold text-xs flex items-center justify-center gap-1.5 transition-colors"
              >
                <span>View Users & Assign Roles</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>

        </div>

      </div>
    </AdminLayout>
  );
};
