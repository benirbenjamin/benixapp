'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/lib/context/AuthContext';
import { artistService } from '@/lib/services/artistService';
import { financialService, MarketplacePlatformAnalytics } from '@/lib/services/financialService';
import { marketplaceService } from '@/lib/services/marketplaceService';
import { ArtistProfile, Genre, MarketplaceSettings, WithdrawalRequest } from '@/lib/types/database.types';
import { BackButton } from '@/components/ui/BackButton';
import { generateSongCover } from '@/lib/utils/coverGenerator';
import {
  Shield,
  Sliders,
  Users,
  Clock,
  Music,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Sparkles,
  Save,
  Globe,
  DollarSign,
  TrendingUp,
  Play,
  Pause,
  Trash2,
  Plus,
  Search,
  Copy,
  Check,
  ExternalLink,
  Eye,
  Phone,
  Mail,
  MapPin,
  CreditCard,
  ShoppingBag,
  FileText,
  RefreshCw,
  X
} from 'lucide-react';

export default function AdminMarketplacePage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();

  const [activeTab, setActiveTab] = useState<'songs' | 'analytics' | 'artists' | 'withdrawals' | 'settings' | 'genres'>('songs');

  const [settings, setSettings] = useState<MarketplaceSettings | null>(null);
  const [artists, setArtists] = useState<ArtistProfile[]>([]);
  const [songs, setSongs] = useState<any[]>([]);
  const [analytics, setAnalytics] = useState<MarketplacePlatformAnalytics | null>(null);
  const [withdrawals, setWithdrawals] = useState<WithdrawalRequest[]>([]);
  const [genres, setGenres] = useState<Genre[]>([]);

  const [loading, setLoading] = useState(true);
  const [actionMsg, setActionMsg] = useState<string | null>(null);

  // Settings form
  const [commissionPercent, setCommissionPercent] = useState<number>(15);
  const [minWithdrawal, setMinWithdrawal] = useState<number>(5000);
  const [autoApproval, setAutoApproval] = useState<boolean>(true);
  const [savingSettings, setSavingSettings] = useState(false);

  // Audio Preview Player
  const [previewSongId, setPreviewSongId] = useState<string | null>(null);
  const [isPlayingPreview, setIsPlayingPreview] = useState(false);
  const [audioElement, setAudioElement] = useState<HTMLAudioElement | null>(null);

  // Filters & Search
  const [songSearch, setSongSearch] = useState('');
  const [songFilter, setSongFilter] = useState<'all' | 'available' | 'sold'>('all');
  const [artistSearch, setArtistSearch] = useState('');

  // Selected Artist Deep-Dive Modal
  const [selectedArtist, setSelectedArtist] = useState<any | null>(null);

  // Manual Purchase Modal
  const [showManualModal, setShowManualModal] = useState(false);
  const [manualSongId, setManualSongId] = useState<string>('');
  const [manualBuyerEmail, setManualBuyerEmail] = useState('');
  const [manualBuyerName, setManualBuyerName] = useState('');
  const [manualBuyerPhone, setManualBuyerPhone] = useState('');
  const [manualAmount, setManualAmount] = useState<number>(0);
  const [manualOrderRef, setManualOrderRef] = useState('');
  const [manualAdminNote, setManualAdminNote] = useState('');
  const [manualSubmitting, setManualSubmitting] = useState(false);
  const [manualError, setManualError] = useState<string | null>(null);

  // Payout note
  const [adminNote, setAdminNote] = useState('');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const loadAdminData = async () => {
    try {
      const [setRes, artList, songList, withList, genList, statsRes] = await Promise.all([
        financialService.getMarketplaceSettings(),
        artistService.listAllArtistsForAdmin(),
        marketplaceService.listAllSongsForAdmin(),
        financialService.listAllWithdrawalRequestsForAdmin(),
        marketplaceService.getGenres(),
        financialService.getMarketplacePlatformAnalytics(),
      ]);

      setSettings(setRes);
      setCommissionPercent(setRes.platform_commission_percent);
      setMinWithdrawal(setRes.min_withdrawal_amount);
      setAutoApproval(setRes.allow_auto_artist_approval);

      setArtists(artList);
      setSongs(songList);
      setWithdrawals(withList);
      setGenres(genList);
      setAnalytics(statsRes);
    } catch (err) {
      console.error('Error loading admin marketplace data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (authLoading) return;
    if (!user || !user.is_super_admin) {
      router.push('/dashboard');
      return;
    }

    loadAdminData();
  }, [user, authLoading, router]);

  // Audio cleanup on unmount
  useEffect(() => {
    return () => {
      if (audioElement) {
        audioElement.pause();
        audioElement.src = '';
      }
    };
  }, [audioElement]);

  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const handlePlayPreview = (song: any) => {
    if (previewSongId === song.id && isPlayingPreview) {
      audioElement?.pause();
      setIsPlayingPreview(false);
      return;
    }

    if (audioElement) {
      audioElement.pause();
      audioElement.src = '';
    }

    const audioUrl = song.preview_audio_path || song.audio_file_path;
    if (!audioUrl || audioUrl.startsWith('blob:')) {
      alert('Audio preview file is not available.');
      return;
    }

    const audio = new Audio(audioUrl);
    audio.onerror = () => {
      setIsPlayingPreview(false);
      setPreviewSongId(null);
    };
    audio.onended = () => setIsPlayingPreview(false);
    audio.play().catch(e => {
      console.warn('Could not start preview:', e);
      setIsPlayingPreview(false);
    });

    setAudioElement(audio);
    setPreviewSongId(song.id);
    setIsPlayingPreview(true);
  };

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingSettings(true);
    setActionMsg(null);
    try {
      const updated = await financialService.updateMarketplaceSettings({
        platform_commission_percent: commissionPercent,
        min_withdrawal_amount: minWithdrawal,
        allow_auto_artist_approval: autoApproval,
      });
      setSettings(updated);
      setActionMsg('Platform marketplace settings saved and applied dynamically!');
    } catch (err: any) {
      setActionMsg('Failed to save settings: ' + err.message);
    } finally {
      setSavingSettings(false);
    }
  };

  const handleArtistStatusChange = async (artistId: string, status: 'approved' | 'suspended') => {
    const success = await artistService.updateArtistStatus(artistId, status);
    if (success) {
      setArtists(artists.map(a => a.id === artistId ? { ...a, status } : a));
      if (selectedArtist?.id === artistId) {
        setSelectedArtist({ ...selectedArtist, status });
      }
      setActionMsg(`Artist status updated to ${status}.`);
      loadAdminData();
    }
  };

  const handleSongStatusChange = async (songId: string, status: 'published' | 'draft' | 'archived') => {
    const success = await marketplaceService.updateSongStatusForAdmin(songId, status);
    if (success) {
      setSongs(songs.map(s => s.id === songId ? { ...s, status } : s));
      setActionMsg(`Song status updated to ${status.toUpperCase()}.`);
    }
  };

  const handleDeleteSong = async (songId: string, songTitle: string) => {
    if (!confirm(`Are you sure you want to permanently delete "${songTitle}" from the marketplace?`)) {
      return;
    }
    const success = await marketplaceService.deleteSongForAdmin(songId);
    if (success) {
      setSongs(songs.filter(s => s.id !== songId));
      setActionMsg(`Song "${songTitle}" permanently deleted.`);
      loadAdminData();
    }
  };

  const handleWithdrawalProcess = async (requestId: string, status: 'paid' | 'rejected') => {
    const success = await financialService.updateWithdrawalStatus(requestId, status, adminNote);
    if (success) {
      setWithdrawals(withdrawals.map(w => w.id === requestId ? { ...w, status, admin_note: adminNote } : w));
      setActionMsg(`Withdrawal request marked as ${status.toUpperCase()}.`);
      setAdminNote('');
      loadAdminData();
    }
  };

  const openManualPurchaseForSong = (song: any) => {
    setManualSongId(song.id);
    setManualAmount(Number(song.price) || 0);
    setManualOrderRef(`MANUAL-${Date.now().toString().slice(-6)}`);
    setManualBuyerEmail('');
    setManualBuyerName('');
    setManualBuyerPhone('');
    setManualAdminNote('');
    setManualError(null);
    setShowManualModal(true);
  };

  const handleManualPurchaseSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualSongId) {
      setManualError('Please select a song.');
      return;
    }
    if (!manualBuyerEmail.trim() || !manualBuyerEmail.includes('@')) {
      setManualError('Please enter a valid buyer email address.');
      return;
    }

    setManualSubmitting(true);
    setManualError(null);

    try {
      const res = await financialService.markSongPurchasedManually({
        songId: manualSongId,
        buyerEmail: manualBuyerEmail.trim(),
        buyerName: manualBuyerName.trim() || undefined,
        buyerPhone: manualBuyerPhone.trim() || undefined,
        amountPaid: Number(manualAmount),
        orderRef: manualOrderRef.trim() || undefined,
        adminNote: manualAdminNote.trim() || undefined,
      });

      if (!res.success) {
        setManualError(res.message);
      } else {
        setActionMsg(res.message);
        setShowManualModal(false);
        await loadAdminData();
      }
    } catch (err: any) {
      setManualError(err.message || 'Failed to record manual purchase.');
    } finally {
      setManualSubmitting(false);
    }
  };

  if (authLoading || loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-8 h-8 border-4 border-amber-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  // Filtered Songs
  const filteredSongs = songs.filter(song => {
    const matchesSearch = !songSearch.trim() ||
      song.title.toLowerCase().includes(songSearch.toLowerCase()) ||
      (song.artist?.stage_name || '').toLowerCase().includes(songSearch.toLowerCase());
    const isSold = song.is_purchased || (song.purchases_count || 0) > 0;
    const matchesFilter = songFilter === 'all' || (songFilter === 'sold' ? isSold : !isSold);
    return matchesSearch && matchesFilter;
  });

  // Filtered Artists
  const filteredArtists = artists.filter(art => {
    if (!artistSearch.trim()) return true;
    const q = artistSearch.toLowerCase();
    return (
      art.stage_name?.toLowerCase().includes(q) ||
      (art.profile?.full_name || '').toLowerCase().includes(q) ||
      (art.profile?.email || '').toLowerCase().includes(q) ||
      (art.profile?.phone || '').includes(q)
    );
  });

  return (
    <div className="space-y-6 my-4">
      <BackButton href="/admin" label="Back to Super Admin Dashboard" />
      
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-purple-950 via-slate-900 to-indigo-950 border border-purple-500/30 p-6 sm:p-8 rounded-3xl text-white shadow-xl flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 text-xs font-bold uppercase">
            <Shield className="w-3.5 h-3.5" /> Super Admin Control Center
          </div>
          <h1 className="text-2xl sm:text-3xl font-black">Music Marketplace &amp; Ecosystem Manager</h1>
          <p className="text-xs sm:text-sm text-slate-300 max-w-2xl">
            Control song catalog, manage track exclusivity &amp; manual purchases, monitor platform commission analytics, inspect artists, and process Mobile Money payouts.
          </p>
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          <button
            onClick={() => {
              setLoading(true);
              loadAdminData();
            }}
            className="px-4 py-2.5 rounded-xl bg-slate-800/80 hover:bg-slate-800 text-slate-200 text-xs font-bold border border-slate-700 flex items-center gap-2 transition-all shadow-sm"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
          <button
            onClick={() => {
              setManualSongId(songs[0]?.id || '');
              setManualAmount(Number(songs[0]?.price) || 0);
              setManualOrderRef(`MANUAL-${Date.now().toString().slice(-6)}`);
              setManualBuyerEmail('');
              setManualBuyerName('');
              setManualBuyerPhone('');
              setManualAdminNote('');
              setManualError(null);
              setShowManualModal(true);
            }}
            className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 text-xs font-black flex items-center gap-2 transition-all shadow-lg"
          >
            <Plus className="w-4 h-4" />
            <span>Record Manual Purchase</span>
          </button>
        </div>
      </div>

      {actionMsg && (
        <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs font-bold flex items-center justify-between gap-2 animate-fadeIn">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 shrink-0 text-amber-400" />
            <span>{actionMsg}</span>
          </div>
          <button onClick={() => setActionMsg(null)} className="text-amber-400/70 hover:text-amber-300">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 rounded-2xl shadow-sm space-y-1">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
            <span className="text-[11px] font-semibold">Total Gross Sales</span>
            <DollarSign className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="text-lg font-black text-slate-900 dark:text-white">
            {(analytics?.totalGrossSales || 0).toLocaleString()} <span className="text-xs font-normal text-slate-400">RWF</span>
          </div>
          <div className="text-[10px] text-slate-400">{analytics?.totalSoldSongsCount || 0} track(s) sold</div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 rounded-2xl shadow-sm space-y-1">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
            <span className="text-[11px] font-semibold">Platform Fee Cut</span>
            <TrendingUp className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-lg font-black text-amber-500">
            {(analytics?.platformCommissionRevenue || 0).toLocaleString()} <span className="text-xs font-normal text-slate-400">RWF</span>
          </div>
          <div className="text-[10px] text-amber-500/80 font-bold">{commissionPercent}% app commission</div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 rounded-2xl shadow-sm space-y-1">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
            <span className="text-[11px] font-semibold">Artists Net Cut</span>
            <Users className="w-4 h-4 text-blue-500" />
          </div>
          <div className="text-lg font-black text-slate-900 dark:text-white">
            {(analytics?.artistsNetRevenue || 0).toLocaleString()} <span className="text-xs font-normal text-slate-400">RWF</span>
          </div>
          <div className="text-[10px] text-slate-400">{100 - commissionPercent}% artist share</div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 rounded-2xl shadow-sm space-y-1">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
            <span className="text-[11px] font-semibold">Paid Out</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="text-lg font-black text-emerald-600 dark:text-emerald-400">
            {(analytics?.totalPaidOut || 0).toLocaleString()} <span className="text-xs font-normal text-slate-400">RWF</span>
          </div>
          <div className="text-[10px] text-slate-400">Via MoMo / Airtel / Bank</div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 rounded-2xl shadow-sm space-y-1">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
            <span className="text-[11px] font-semibold">Pending Payouts</span>
            <Clock className="w-4 h-4 text-rose-500" />
          </div>
          <div className="text-lg font-black text-rose-600 dark:text-rose-400">
            {(analytics?.totalPendingPayouts || 0).toLocaleString()} <span className="text-xs font-normal text-slate-400">RWF</span>
          </div>
          <div className="text-[10px] text-rose-500/80 font-bold">{withdrawals.filter(w => w.status === 'pending').length} request(s) awaiting</div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 rounded-2xl shadow-sm space-y-1">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
            <span className="text-[11px] font-semibold">Catalog Total</span>
            <Music className="w-4 h-4 text-purple-500" />
          </div>
          <div className="text-lg font-black text-slate-900 dark:text-white">
            {songs.length} <span className="text-xs font-normal text-slate-400">songs</span>
          </div>
          <div className="text-[10px] text-slate-400">{artists.length} registered artists</div>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="flex items-center gap-2 bg-slate-100 dark:bg-slate-900 p-1.5 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-x-auto">
        {[
          { key: 'songs', label: `Songs Catalog (${songs.length})`, icon: Music },
          { key: 'analytics', label: 'Sales & Revenue Ledger', icon: TrendingUp },
          { key: 'artists', label: `Artists (${artists.length})`, icon: Users },
          { 
            key: 'withdrawals', 
            label: `Payout Requests (${withdrawals.filter(w => w.status === 'pending').length} pending)`, 
            icon: Clock,
            badge: withdrawals.filter(w => w.status === 'pending').length > 0
          },
          { key: 'settings', label: 'Platform Rules', icon: Sliders },
          { key: 'genres', label: `Genres (${genres.length})`, icon: Globe },
        ].map(tab => {
          const Icon = tab.icon;
          const isCurrent = activeTab === tab.key;
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key as any)}
              className={`px-4 py-2.5 rounded-xl text-xs font-extrabold transition-all flex items-center gap-2 whitespace-nowrap ${
                isCurrent
                  ? 'bg-amber-500 text-slate-950 shadow-md'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
              {tab.badge && !isCurrent && (
                <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse"></span>
              )}
            </button>
          );
        })}
      </div>

      {/* TAB 1: SONGS CATALOG & CONTROL */}
      {activeTab === 'songs' && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 sm:p-6 space-y-4 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Music className="w-5 h-5 text-amber-500" /> Marketplace Songs Control
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Track sold/available status, preview audio, change publishing status, or delete tracks.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search song or artist..."
                  value={songSearch}
                  onChange={e => setSongSearch(e.target.value)}
                  className="pl-9 pr-3 py-1.5 text-xs rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-amber-500 w-52"
                />
              </div>

              <div className="flex rounded-xl bg-slate-100 dark:bg-slate-950 p-0.5 border border-slate-200 dark:border-slate-800 text-xs">
                {(['all', 'available', 'sold'] as const).map(f => (
                  <button
                    key={f}
                    onClick={() => setSongFilter(f)}
                    className={`px-3 py-1 rounded-lg font-bold capitalize transition-all ${
                      songFilter === f
                        ? 'bg-amber-500 text-slate-950 shadow-sm'
                        : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    {f}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {filteredSongs.length === 0 ? (
            <div className="text-center py-12 bg-slate-50 dark:bg-slate-950 rounded-2xl border border-slate-200 dark:border-slate-800 text-slate-500 text-xs">
              No songs found matching the selected filter.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-100 dark:bg-slate-950 text-slate-500 dark:text-slate-400 font-semibold border-b border-slate-200 dark:border-slate-800">
                  <tr>
                    <th className="py-3 px-4">Track</th>
                    <th className="py-3 px-4">Artist</th>
                    <th className="py-3 px-4">Price</th>
                    <th className="py-3 px-4">Exclusivity / Ownership</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-800/60">
                  {filteredSongs.map(song => {
                    const isSold = song.is_purchased || (song.purchases_count || 0) > 0;
                    const buyer = song.user_purchases?.[0]?.profile;
                    const buyerEmail = buyer?.email || song.user_purchases?.[0]?.buyer_email;
                    const isPlayingThis = previewSongId === song.id && isPlayingPreview;

                    return (
                      <tr key={song.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-3">
                            <div className="relative w-11 h-11 rounded-xl overflow-hidden shrink-0 border border-slate-200 dark:border-slate-800 bg-slate-800">
                              <img
                                src={song.cover_image_path || generateSongCover({ title: song.title, artistName: song.artist?.stage_name || 'Artist', genre: song.genre?.name })}
                                alt={song.title}
                                className="w-full h-full object-cover"
                              />
                              {(song.preview_audio_path || song.audio_file_path) && (
                                <button
                                  onClick={() => handlePlayPreview(song)}
                                  className="absolute inset-0 bg-black/40 hover:bg-black/60 flex items-center justify-center text-white transition-opacity"
                                  title={isPlayingThis ? 'Pause preview' : 'Play audio preview'}
                                >
                                  {isPlayingThis ? (
                                    <Pause className="w-4 h-4 text-amber-400 fill-amber-400" />
                                  ) : (
                                    <Play className="w-4 h-4 text-white fill-white ml-0.5" />
                                  )}
                                </button>
                              )}
                            </div>
                            <div>
                              <div className="font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                                <span>{song.title}</span>
                                {song.genre?.name && (
                                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-purple-500/10 text-purple-600 dark:text-purple-300 font-semibold">
                                    {song.genre.name}
                                  </span>
                                )}
                              </div>
                              <div className="text-[11px] text-slate-400 flex items-center gap-2">
                                {song.musical_key && <span>Key: {song.musical_key}</span>}
                                {song.bpm && <span>• {song.bpm} BPM</span>}
                              </div>
                            </div>
                          </div>
                        </td>

                        <td className="py-3 px-4">
                          <button
                            onClick={() => {
                              const found = artists.find(a => a.id === song.artist_id);
                              if (found) setSelectedArtist(found);
                            }}
                            className="font-bold text-amber-600 dark:text-amber-400 hover:underline flex items-center gap-1"
                          >
                            <span>{song.artist?.stage_name || 'Unknown Artist'}</span>
                            <Eye className="w-3 h-3 opacity-70" />
                          </button>
                        </td>

                        <td className="py-3 px-4 font-mono font-bold text-slate-900 dark:text-white">
                          {(song.price || 0).toLocaleString()} {song.currency || 'RWF'}
                        </td>

                        <td className="py-3 px-4">
                          {isSold ? (
                            <div className="space-y-0.5">
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20">
                                <CheckCircle2 className="w-3 h-3" /> SOLD / EXCLUSIVE
                              </span>
                              {buyerEmail && (
                                <div className="text-[10px] text-slate-400 font-mono truncate max-w-[180px]">
                                  Buyer: {buyerEmail}
                                </div>
                              )}
                            </div>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                              Available in Market
                            </span>
                          )}
                        </td>

                        <td className="py-3 px-4">
                          <select
                            value={song.status}
                            onChange={e => handleSongStatusChange(song.id, e.target.value as any)}
                            className="text-[11px] font-bold rounded-lg px-2 py-1 bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white"
                          >
                            <option value="published">Published</option>
                            <option value="draft">Draft</option>
                            <option value="archived">Archived</option>
                          </select>
                        </td>

                        <td className="py-3 px-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            {!isSold && (
                              <button
                                onClick={() => openManualPurchaseForSong(song)}
                                className="px-2.5 py-1 rounded-lg bg-amber-500/15 hover:bg-amber-500 text-amber-700 dark:text-amber-300 hover:text-slate-950 font-bold text-[11px] transition-all"
                                title="Mark as purchased manually for a customer"
                              >
                                Mark Purchased
                              </button>
                            )}

                            <Link
                              href={`/songs/marketplace/${song.id}`}
                              target="_blank"
                              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                              title="View song marketplace page"
                            >
                              <ExternalLink className="w-4 h-4" />
                            </Link>

                            <button
                              onClick={() => handleDeleteSong(song.id, song.title)}
                              className="p-1.5 rounded-lg text-rose-500 hover:text-rose-600 hover:bg-rose-500/10 transition-colors"
                              title="Delete song permanently"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* TAB 2: SALES & REVENUE ANALYTICS */}
      {activeTab === 'analytics' && (
        <div className="space-y-6">
          {/* Financial Ledger */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 sm:p-6 space-y-4 shadow-sm">
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-emerald-500" /> Marketplace Transactions Ledger
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Detailed transaction records with automatic {commissionPercent}% platform commission and {100 - commissionPercent}% artist cut split.
              </p>
            </div>

            {(!analytics?.purchases || analytics.purchases.length === 0) ? (
              <div className="text-center py-12 bg-slate-50 dark:bg-slate-950 rounded-2xl border border-slate-200 dark:border-slate-800 text-slate-500 text-xs">
                No marketplace sales logged yet.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-100 dark:bg-slate-950 text-slate-500 dark:text-slate-400 font-semibold border-b border-slate-200 dark:border-slate-800">
                    <tr>
                      <th className="py-3 px-4">Date / Ref</th>
                      <th className="py-3 px-4">Song Title</th>
                      <th className="py-3 px-4">Artist</th>
                      <th className="py-3 px-4">Buyer Email</th>
                      <th className="py-3 px-4">Gross Price</th>
                      <th className="py-3 px-4">App Cut ({commissionPercent}%)</th>
                      <th className="py-3 px-4">Artist Net ({100 - commissionPercent}%)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 dark:divide-slate-800/60">
                    {analytics.purchases.map((tx: any) => (
                      <tr key={tx.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                        <td className="py-3 px-4">
                          <div className="font-bold text-slate-900 dark:text-white">
                            {new Date(tx.purchased_at).toLocaleDateString()}
                          </div>
                          <div className="text-[10px] text-slate-400 font-mono">{tx.order_ref}</div>
                        </td>
                        <td className="py-3 px-4 font-bold text-slate-900 dark:text-white">
                          {tx.song?.title || 'Song'}
                        </td>
                        <td className="py-3 px-4 text-amber-600 dark:text-amber-400 font-semibold">
                          {tx.song?.artist?.stage_name || 'Artist'}
                        </td>
                        <td className="py-3 px-4 text-slate-500 dark:text-slate-300 font-mono text-[11px]">
                          {tx.buyer?.email || 'N/A'}
                        </td>
                        <td className="py-3 px-4 font-mono font-bold text-slate-900 dark:text-white">
                          {tx.amount_paid.toLocaleString()} {tx.currency || 'RWF'}
                        </td>
                        <td className="py-3 px-4 font-mono font-bold text-amber-500">
                          +{tx.platformFee.toLocaleString()} RWF
                        </td>
                        <td className="py-3 px-4 font-mono font-bold text-emerald-600 dark:text-emerald-400">
                          {tx.netArtist.toLocaleString()} RWF
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Artist Earnings Leaderboard */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 sm:p-6 space-y-4 shadow-sm">
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Users className="w-5 h-5 text-blue-500" /> Individual Artist Financial Balances
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Track how much each artist has generated, withdrawable balance, and payout history.
              </p>
            </div>

            {(!analytics?.artistStats || analytics.artistStats.length === 0) ? (
              <div className="text-center py-8 bg-slate-50 dark:bg-slate-950 rounded-2xl border border-slate-200 dark:border-slate-800 text-slate-500 text-xs">
                No artist financial records available.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-100 dark:bg-slate-950 text-slate-500 dark:text-slate-400 font-semibold border-b border-slate-200 dark:border-slate-800">
                    <tr>
                      <th className="py-3 px-4">Artist Name</th>
                      <th className="py-3 px-4">Tracks Sold</th>
                      <th className="py-3 px-4">Gross Sales</th>
                      <th className="py-3 px-4">Net Earned</th>
                      <th className="py-3 px-4">Total Paid Out</th>
                      <th className="py-3 px-4">Available to Withdraw</th>
                      <th className="py-3 px-4 text-right">Details</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 dark:divide-slate-800/60">
                    {analytics.artistStats.map((art: any) => {
                      const fullArt = artists.find(a => a.id === art.artistId);
                      return (
                        <tr key={art.artistId} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                          <td className="py-3 px-4">
                            <div className="font-extrabold text-slate-900 dark:text-white">{art.stageName}</div>
                            {art.realName && (
                              <div className="text-[10px] text-slate-400">{art.realName}</div>
                            )}
                          </td>
                          <td className="py-3 px-4 font-mono font-bold text-slate-600 dark:text-slate-300">
                            {art.songsSoldCount}
                          </td>
                          <td className="py-3 px-4 font-mono text-slate-900 dark:text-white font-bold">
                            {art.grossSales.toLocaleString()} RWF
                          </td>
                          <td className="py-3 px-4 font-mono text-emerald-600 dark:text-emerald-400 font-bold">
                            {art.netEarnings.toLocaleString()} RWF
                          </td>
                          <td className="py-3 px-4 font-mono text-slate-500">
                            {art.paidOut.toLocaleString()} RWF
                          </td>
                          <td className="py-3 px-4 font-mono font-black text-amber-500">
                            {art.availableBalance.toLocaleString()} RWF
                          </td>
                          <td className="py-3 px-4 text-right">
                            <button
                              onClick={() => fullArt && setSelectedArtist(fullArt)}
                              className="px-3 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-amber-500 hover:text-slate-950 font-bold text-[11px] transition-all"
                            >
                              Inspect
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 3: ARTISTS MANAGEMENT & DEEP-DIVE */}
      {activeTab === 'artists' && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 sm:p-6 space-y-4 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Users className="w-5 h-5 text-amber-500" /> Registered Artists Directory
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Click on any artist to see contact info, Mobile Money payout methods, songs uploaded, and earnings.
              </p>
            </div>

            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search by name, email, phone..."
                value={artistSearch}
                onChange={e => setArtistSearch(e.target.value)}
                className="pl-9 pr-3 py-1.5 text-xs rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-amber-500 w-64"
              />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-100 dark:bg-slate-950 text-slate-500 dark:text-slate-400 font-semibold border-b border-slate-200 dark:border-slate-800">
                <tr>
                  <th className="py-3 px-4">Artist / Real Name</th>
                  <th className="py-3 px-4">Contact Info</th>
                  <th className="py-3 px-4">Payout Method</th>
                  <th className="py-3 px-4">Location</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800/60">
                {filteredArtists.map(art => (
                  <tr key={art.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 cursor-pointer" onClick={() => setSelectedArtist(art)}>
                    <td className="py-3 px-4">
                      <div className="font-extrabold text-slate-900 dark:text-white flex items-center gap-1.5">
                        <span>{art.stage_name}</span>
                        <span className="text-[10px] uppercase font-bold text-amber-500 bg-amber-500/10 px-1.5 py-0.5 rounded">
                          {art.music_type}
                        </span>
                      </div>
                      <div className="text-[10px] text-slate-400">
                        {art.profile?.full_name || 'No full name provided'}
                      </div>
                    </td>

                    <td className="py-3 px-4 text-slate-600 dark:text-slate-300">
                      <div className="flex items-center gap-1">
                        <Mail className="w-3 h-3 text-slate-400" />
                        <span>{art.profile?.email || 'N/A'}</span>
                      </div>
                      {art.profile?.phone && (
                        <div className="flex items-center gap-1 text-[11px] text-slate-400">
                          <Phone className="w-3 h-3 text-slate-400" />
                          <span>{art.profile?.phone}</span>
                        </div>
                      )}
                    </td>

                    <td className="py-3 px-4">
                      <span className="font-bold text-slate-900 dark:text-white uppercase text-[11px]">
                        {art.payout_details?.payment_method || art.payout_details?.payout_method || (art as any).payout_method || 'MTN Mobile Money'}
                      </span>
                      {art.payout_details?.phone_number && (
                        <div className="font-mono text-[10px] text-amber-600 dark:text-amber-400">
                          {art.payout_details.phone_number}
                        </div>
                      )}
                    </td>

                    <td className="py-3 px-4 text-slate-500 dark:text-slate-400">
                      {art.location ? `${art.location}, ${art.country || 'Rwanda'}` : (art.country || 'Rwanda')}
                    </td>

                    <td className="py-3 px-4" onClick={e => e.stopPropagation()}>
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                        art.status === 'approved'
                          ? 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-300'
                          : art.status === 'pending'
                          ? 'bg-amber-500/20 text-amber-600 dark:text-amber-300'
                          : 'bg-rose-500/20 text-rose-600 dark:text-rose-300'
                      }`}>
                        {art.status}
                      </span>
                    </td>

                    <td className="py-3 px-4 text-right" onClick={e => e.stopPropagation()}>
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => setSelectedArtist(art)}
                          className="px-2.5 py-1 rounded-lg bg-amber-500 text-slate-950 font-extrabold text-[11px] hover:bg-amber-400 transition-colors shadow-sm"
                        >
                          View Details
                        </button>
                        {art.status !== 'approved' && (
                          <button
                            onClick={() => handleArtistStatusChange(art.id, 'approved')}
                            className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-[11px] font-bold"
                          >
                            Approve
                          </button>
                        )}
                        {art.status !== 'suspended' && (
                          <button
                            onClick={() => handleArtistStatusChange(art.id, 'suspended')}
                            className="px-2.5 py-1 bg-rose-600 hover:bg-rose-500 text-white rounded-lg text-[11px] font-bold"
                          >
                            Suspend
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 4: PAYOUT REQUESTS */}
      {activeTab === 'withdrawals' && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 sm:p-6 space-y-4 shadow-sm">
          <div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Clock className="w-5 h-5 text-amber-500" /> Artist Withdrawal Payout Requests
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Transfer funds via MTN Mobile Money or Airtel Money, then click "Confirm Paid" with the transaction note.
            </p>
          </div>

          {withdrawals.length === 0 ? (
            <div className="text-xs text-slate-500 py-12 text-center bg-slate-50 dark:bg-slate-950 rounded-2xl border border-slate-200 dark:border-slate-800">
              No withdrawal requests logged yet.
            </div>
          ) : (
            <div className="space-y-4">
              {withdrawals.map(req => {
                const phone = req.payout_details?.phone_number || '';
                const accountName = req.payout_details?.account_name || '';
                const isCopied = copiedKey === req.id;

                return (
                  <div key={req.id} className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 space-y-3">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 dark:border-slate-800/80 pb-3">
                      <div>
                        <div className="text-sm font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                          <span>{req.artist?.stage_name || 'Artist ID: ' + req.artist_id}</span>
                          <span className="text-xs px-2 py-0.5 rounded-md bg-amber-500/10 text-amber-600 dark:text-amber-400 font-bold uppercase">
                            {req.payout_method}
                          </span>
                        </div>
                        <div className="text-xs text-slate-500 dark:text-slate-400">
                          Requested: <strong className="text-slate-900 dark:text-white font-mono">{req.amount.toLocaleString()} RWF</strong> on {new Date(req.created_at).toLocaleDateString()}
                        </div>
                      </div>

                      <span className={`px-3 py-1 rounded-full text-xs font-extrabold uppercase ${
                        req.status === 'paid'
                          ? 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-300 border border-emerald-500/30'
                          : req.status === 'pending'
                          ? 'bg-amber-500/20 text-amber-600 dark:text-amber-300 border border-amber-500/30 animate-pulse'
                          : 'bg-rose-500/20 text-rose-600 dark:text-rose-300 border border-rose-500/30'
                      }`}>
                        {req.status}
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                      <div className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center justify-between">
                        <div>
                          <div className="text-[10px] text-slate-400 font-semibold uppercase">Mobile Money / Account #</div>
                          <div className="font-mono font-bold text-slate-900 dark:text-white text-sm">
                            {phone || 'Not provided'}
                          </div>
                        </div>
                        {phone && (
                          <button
                            onClick={() => copyToClipboard(phone, req.id)}
                            className="p-2 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-amber-500 hover:text-slate-950 text-slate-600 dark:text-slate-300 transition-colors flex items-center gap-1 text-[11px] font-bold"
                            title="Copy phone number"
                          >
                            {isCopied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                            <span>{isCopied ? 'Copied' : 'Copy'}</span>
                          </button>
                        )}
                      </div>

                      <div className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                        <div className="text-[10px] text-slate-400 font-semibold uppercase">Account Holder Name</div>
                        <div className="font-bold text-slate-900 dark:text-white text-sm">
                          {accountName || 'N/A'}
                        </div>
                      </div>
                    </div>

                    {req.admin_note && (
                      <div className="text-xs text-slate-400 bg-slate-100 dark:bg-slate-900 p-2.5 rounded-xl border border-slate-200 dark:border-slate-800">
                        <strong>Admin Note:</strong> {req.admin_note}
                      </div>
                    )}

                    {req.status === 'pending' && (
                      <div className="pt-2 flex flex-col sm:flex-row items-center gap-3">
                        <input
                          type="text"
                          placeholder="Processing reference / MoMo transaction ID (optional)..."
                          value={adminNote}
                          onChange={e => setAdminNote(e.target.value)}
                          className="flex-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-3.5 py-2 text-xs text-slate-900 dark:text-white placeholder-slate-400"
                        />
                        <div className="flex items-center gap-2 w-full sm:w-auto">
                          <button
                            onClick={() => handleWithdrawalProcess(req.id, 'paid')}
                            className="flex-1 sm:flex-initial bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-4 py-2 rounded-xl text-xs flex items-center justify-center gap-1.5 shadow-md transition-colors"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5" /> Confirm Paid
                          </button>
                          <button
                            onClick={() => handleWithdrawalProcess(req.id, 'rejected')}
                            className="flex-1 sm:flex-initial bg-rose-600 hover:bg-rose-500 text-white font-bold px-3.5 py-2 rounded-xl text-xs flex items-center justify-center gap-1.5 transition-colors"
                          >
                            <XCircle className="w-3.5 h-3.5" /> Reject
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* TAB 5: PLATFORM RULES & SETTINGS */}
      {activeTab === 'settings' && (
        <form onSubmit={handleSaveSettings} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 space-y-6 max-w-2xl shadow-sm">
          <div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Sliders className="w-5 h-5 text-amber-500" /> Platform Marketplace Rules
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Any changes here are saved to the database and dynamically apply across all checkout revenue splits and artist withdrawal forms.
            </p>
          </div>

          <div className="space-y-4">
            <div>
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                Platform Sales Commission Percentage (%)
              </label>
              <input
                type="number"
                min={0}
                max={50}
                value={commissionPercent}
                onChange={e => setCommissionPercent(Number(e.target.value))}
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-2.5 text-sm text-slate-900 dark:text-white font-mono font-bold"
              />
              <p className="text-[11px] text-slate-400 mt-1">
                Platform retains {commissionPercent}%, artist automatically receives {100 - commissionPercent}% net upon song purchase.
              </p>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                Minimum Withdrawal Threshold (RWF)
              </label>
              <input
                type="number"
                min={1000}
                step={1000}
                value={minWithdrawal}
                onChange={e => setMinWithdrawal(Number(e.target.value))}
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-2.5 text-sm text-slate-900 dark:text-white font-mono font-bold"
              />
              <p className="text-[11px] text-slate-400 mt-1">
                Artists can only request payouts once their balance reaches this amount (currently {minWithdrawal.toLocaleString()} RWF).
              </p>
            </div>

            <div className="flex items-center gap-3 pt-2">
              <input
                type="checkbox"
                id="auto-approval-check"
                checked={autoApproval}
                onChange={e => setAutoApproval(e.target.checked)}
                className="w-4 h-4 rounded border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-amber-500 focus:ring-amber-500"
              />
              <label htmlFor="auto-approval-check" className="text-xs font-semibold text-slate-700 dark:text-slate-300 cursor-pointer">
                Automatically approve new artist registrations
              </label>
            </div>
          </div>

          <button
            type="submit"
            disabled={savingSettings}
            className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-extrabold px-6 py-3 rounded-2xl shadow-lg transition-all flex items-center gap-2 text-xs disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            <span>{savingSettings ? 'Saving Settings...' : 'Save Marketplace Settings'}</span>
          </button>
        </form>
      )}

      {/* TAB 6: GENRES */}
      {activeTab === 'genres' && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 sm:p-6 space-y-4 shadow-sm">
          <div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Globe className="w-5 h-5 text-amber-500" /> Configured Rwandan &amp; International Genres
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Music genres available for artists when publishing tracks to the marketplace.
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {genres.map(g => (
              <div
                key={g.id}
                className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-1.5"
              >
                <div className="flex items-center justify-between text-xs font-bold text-slate-900 dark:text-white">
                  <span>{g.name}</span>
                  {g.is_local && (
                    <span className="text-[10px] bg-emerald-500/20 text-emerald-600 dark:text-emerald-300 px-2 py-0.5 rounded-full font-bold">
                      Rwandan Local
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-2">
                  {g.description || 'No description configured.'}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* MODAL 1: ARTIST DEEP-DIVE MODAL */}
      {selectedArtist && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto space-y-6 shadow-2xl animate-fadeIn text-slate-900 dark:text-white">
            <div className="flex items-start justify-between border-b border-slate-200 dark:border-slate-800 pb-4">
              <div>
                <div className="text-xs font-bold uppercase text-amber-500">Artist Deep-Dive Profile</div>
                <h3 className="text-xl font-black">{selectedArtist.stage_name}</h3>
                <p className="text-xs text-slate-400">{selectedArtist.profile?.full_name || 'No full name on file'}</p>
              </div>
              <button
                onClick={() => setSelectedArtist(null)}
                className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Profile Overview */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-2">
                <div className="text-[11px] font-bold text-amber-500 uppercase">Contact Details</div>
                <div className="flex items-center gap-2">
                  <Mail className="w-4 h-4 text-slate-400 shrink-0" />
                  <span className="font-mono">{selectedArtist.profile?.email || 'N/A'}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Phone className="w-4 h-4 text-slate-400 shrink-0" />
                  <span className="font-mono">{selectedArtist.profile?.phone || 'N/A'}</span>
                </div>
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-slate-400 shrink-0" />
                  <span>{selectedArtist.location ? `${selectedArtist.location}, ${selectedArtist.country || 'Rwanda'}` : (selectedArtist.country || 'Rwanda')}</span>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-2">
                <div className="text-[11px] font-bold text-amber-500 uppercase">Payout &amp; Mobile Money Details</div>
                <div>
                  <span className="text-slate-400">Method: </span>
                  <span className="font-bold uppercase text-slate-900 dark:text-white">{selectedArtist.payout_method || 'MTN Mobile Money'}</span>
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-slate-400">Account / Phone: </span>
                    <span className="font-mono font-bold text-amber-500">{selectedArtist.payout_details?.phone_number || 'N/A'}</span>
                  </div>
                  {selectedArtist.payout_details?.phone_number && (
                    <button
                      onClick={() => copyToClipboard(selectedArtist.payout_details.phone_number, 'artist-modal-phone')}
                      className="px-2 py-1 bg-slate-200 dark:bg-slate-800 hover:bg-amber-500 hover:text-slate-950 rounded text-[10px] font-bold"
                    >
                      {copiedKey === 'artist-modal-phone' ? 'Copied' : 'Copy'}
                    </button>
                  )}
                </div>
                <div>
                  <span className="text-slate-400">Account Name: </span>
                  <span className="font-bold">{selectedArtist.payout_details?.account_name || 'N/A'}</span>
                </div>
              </div>
            </div>

            {/* Financial Stats for this Artist */}
            {(() => {
              const artFin = analytics?.artistStats?.find((a: any) => a.artistId === selectedArtist.id);
              return (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
                    <div className="text-[10px] text-slate-400">Tracks Sold</div>
                    <div className="text-base font-black text-slate-900 dark:text-white font-mono">{artFin?.songsSoldCount || 0}</div>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
                    <div className="text-[10px] text-slate-400">Gross Sales</div>
                    <div className="text-base font-black text-slate-900 dark:text-white font-mono">{(artFin?.grossSales || 0).toLocaleString()} RWF</div>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
                    <div className="text-[10px] text-slate-400">Net Earned</div>
                    <div className="text-base font-black text-emerald-500 font-mono">{(artFin?.netEarnings || 0).toLocaleString()} RWF</div>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
                    <div className="text-[10px] text-slate-400">Withdrawable Balance</div>
                    <div className="text-base font-black text-amber-500 font-mono">{(artFin?.availableBalance || 0).toLocaleString()} RWF</div>
                  </div>
                </div>
              );
            })()}

            {/* Uploaded Songs Catalog */}
            <div className="space-y-2">
              <div className="text-xs font-bold uppercase text-slate-400">Songs Uploaded by this Artist</div>
              {(() => {
                const artistSongs = songs.filter(s => s.artist_id === selectedArtist.id);
                if (artistSongs.length === 0) {
                  return (
                    <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs text-slate-400 text-center">
                      No songs uploaded by this artist yet.
                    </div>
                  );
                }
                return (
                  <div className="divide-y divide-slate-200 dark:divide-slate-800/80 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden">
                    {artistSongs.map(s => {
                      const isSold = s.is_purchased || (s.purchases_count || 0) > 0;
                      return (
                        <div key={s.id} className="p-3 bg-slate-50 dark:bg-slate-950 flex items-center justify-between text-xs">
                          <div>
                            <div className="font-bold text-slate-900 dark:text-white">{s.title}</div>
                            <div className="text-[11px] text-slate-400 font-mono">{(s.price || 0).toLocaleString()} RWF</div>
                          </div>
                          <div className="flex items-center gap-2">
                            {isSold ? (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/20 text-rose-500 border border-rose-500/30">
                                Sold &amp; Owned
                              </span>
                            ) : (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-500 border border-emerald-500/30">
                                Available
                              </span>
                            )}
                            <span className="text-[10px] uppercase font-bold text-slate-400">
                              {s.status}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                );
              })()}
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setSelectedArtist(null)}
                className="px-5 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-xs font-bold"
              >
                Close Profile
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: MANUAL PURCHASE CONFIRMATION MODAL */}
      {showManualModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 max-w-lg w-full space-y-5 shadow-2xl animate-fadeIn text-slate-900 dark:text-white">
            <div className="flex items-start justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
              <div>
                <div className="text-xs font-bold uppercase text-amber-500 flex items-center gap-1.5">
                  <ShoppingBag className="w-3.5 h-3.5" /> Manual Marketplace Purchase
                </div>
                <h3 className="text-lg font-black">Record Offline / Direct Payment</h3>
                <p className="text-xs text-slate-400">
                  Assign track ownership to a customer who paid via direct Mobile Money or offline transfer.
                </p>
              </div>
              <button
                onClick={() => setShowManualModal(false)}
                className="p-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {manualError && (
              <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-500 text-xs font-bold flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{manualError}</span>
              </div>
            )}

            <form onSubmit={handleManualPurchaseSubmit} className="space-y-4 text-xs">
              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">Select Song</label>
                <select
                  value={manualSongId}
                  onChange={e => {
                    const sid = e.target.value;
                    setManualSongId(sid);
                    const chosen = songs.find(s => s.id === sid);
                    if (chosen) setManualAmount(Number(chosen.price) || 0);
                  }}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white font-semibold"
                  required
                >
                  <option value="">-- Choose track --</option>
                  {songs.map(s => {
                    const isSold = s.is_purchased || (s.purchases_count || 0) > 0;
                    return (
                      <option key={s.id} value={s.id}>
                        {s.title} — {s.artist?.stage_name || 'Artist'} ({(s.price || 0).toLocaleString()} RWF) {isSold ? '[ALREADY SOLD]' : ''}
                      </option>
                    );
                  })}
                </select>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    Buyer Email <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="email"
                    placeholder="buyer@example.com"
                    value={manualBuyerEmail}
                    onChange={e => setManualBuyerEmail(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white"
                    required
                  />
                  <p className="text-[10px] text-slate-400 mt-0.5">Song will unlock in their library account.</p>
                </div>

                <div>
                  <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    Buyer Full Name (optional)
                  </label>
                  <input
                    type="text"
                    placeholder="Jean Baptiste"
                    value={manualBuyerName}
                    onChange={e => setManualBuyerName(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">Buyer Phone (optional)</label>
                  <input
                    type="text"
                    placeholder="078..."
                    value={manualBuyerPhone}
                    onChange={e => setManualBuyerPhone(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">Amount Paid (RWF)</label>
                  <input
                    type="number"
                    min={0}
                    value={manualAmount}
                    onChange={e => setManualAmount(Number(e.target.value))}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white font-mono font-bold"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">Payment Reference / MoMo Tx ID</label>
                <input
                  type="text"
                  placeholder="e.g. MOMO-98218192 or CASH"
                  value={manualOrderRef}
                  onChange={e => setManualOrderRef(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white font-mono"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">Admin Notes</label>
                <textarea
                  rows={2}
                  placeholder="Notes about direct payment confirmation..."
                  value={manualAdminNote}
                  onChange={e => setManualAdminNote(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white resize-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowManualModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={manualSubmitting}
                  className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black flex items-center gap-1.5 shadow-lg transition-all disabled:opacity-50"
                >
                  {manualSubmitting ? (
                    <span>Recording...</span>
                  ) : (
                    <>
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Confirm &amp; Grant Ownership</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}

