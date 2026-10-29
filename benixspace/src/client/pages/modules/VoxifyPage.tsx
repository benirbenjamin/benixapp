import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { AppAccessWizardModal } from '../../components/modals/AppAccessWizardModal';
import { WalletModal } from '../../components/modals/WalletModal';
import { SeoHead } from '../../components/common/SeoHead';
import { getAuthToken } from '../../services/api';
import { buildSecureUrl } from '../../utils/urlSecurity';
import { uploadFileInChunks } from '../../utils/chunkedUpload';
import {
  Music,
  Play,
  Pause,
  Download,
  FileText,
  Sparkles,
  Users,
  Mic2,
  Volume2,
  CheckCircle2,
  Share2,
  Heart,
  ChevronRight,
  Headphones,
  ArrowLeft,
  Upload,
  Plus,
  X,
  Lock,
  Unlock,
  ShieldCheck,
  ShoppingBag,
  MessageCircle,
  Calendar,
  Layers,
  Crown,
  Disc,
  Check,
  RefreshCw,
  Wallet,
  Copy
} from 'lucide-react';

interface ChoirMember {
  user_id: string;
  name: string;
  email: string;
  role: string;
  voice_part: string;
}

interface ChoirTrack {
  id: string;
  choir_id: string;
  title: string;
  composer?: string;
  soprano_url?: string;
  alto_url?: string;
  tenor_url?: string;
  bass_url?: string;
  full_audio_url?: string;
  sheet_music_url?: string;
  target_sunday_date?: string;
  isMySundayReady?: boolean;
}

interface Choir {
  id: string;
  name: string;
  church_denomination?: string;
  description?: string;
  role: string;
  voice_part: string;
  choir_code?: string;
  members?: ChoirMember[];
  tracks?: ChoirTrack[];
  subscription_status?: string;
}

interface SongListing {
  id: string;
  title: string;
  composer: string;
  price: number;
  sale_type: 'exclusive_ownership' | 'digital_copies';
  is_sold: boolean;
  owner_id: string;
  owner_name?: string;
  composer_name?: string;
  audio_url: string;
  preview_audio_url?: string;
  preview_lyrics?: string;
  full_lyrics?: string;
  sheet_music_url?: string;
  preview_start_time?: number;
  is_unlocked?: boolean;
}

export const VoxifyPage: React.FC = () => {
  const { user, wallet, refreshWallet, hasAppProfile } = useAuth();
  const navigate = useNavigate();

  // Active Voxify Tab: 'choirs' (private workspace & SATB stems) | 'marketplace' (buy & own songs) | 'my_library'
  const [searchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState<'choirs' | 'marketplace' | 'my_library'>('choirs');

  // Sync tab or target song from search URL (e.g. /music?tab=marketplace&song=123)
  useEffect(() => {
    const tab = searchParams.get('tab');
    if (tab && ['choirs', 'marketplace', 'my_library'].includes(tab)) {
      setActiveTab(tab as any);
    }
    const songId = searchParams.get('song');
    if (songId) {
      setActiveTab('marketplace');
    }
  }, [searchParams]);
  const [loading, setLoading] = useState<boolean>(true);
  const [wizardTarget, setWizardTarget] = useState<string | null>(null);
  const [isWalletOpen, setIsWalletOpen] = useState<boolean>(false);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Audio player state
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [playingUrl, setPlayingUrl] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [activeStem, setActiveStem] = useState<string>('full'); // 'soprano' | 'alto' | 'tenor' | 'bass' | 'full'

  // Choir Workspace State
  const [myChoirs, setMyChoirs] = useState<Choir[]>([]);
  const [activeChoirId, setActiveChoirId] = useState<string | null>(null);
  const [showCreateChoirModal, setShowCreateChoirModal] = useState<boolean>(false);
  const [newChoirName, setNewChoirName] = useState<string>('');
  const [newChoirDenom, setNewChoirDenom] = useState<string>('Adventist Choral');
  const [newChoirDesc, setNewChoirDesc] = useState<string>('');
  const [copiedChoirCode, setCopiedChoirCode] = useState<string | null>(null);

  // Join Choir with Code Modal
  const [showJoinCodeModal, setShowJoinCodeModal] = useState<boolean>(false);
  const [joinCodeInput, setJoinCodeInput] = useState<string>('');
  const [joinVoicePart, setJoinVoicePart] = useState<string>('soprano');
  const [joiningCodeLoading, setJoiningCodeLoading] = useState<boolean>(false);

  // Director Upload Track Modal
  const [showUploadTrackModal, setShowUploadTrackModal] = useState<boolean>(false);
  const [trackTitle, setTrackTitle] = useState('');
  const [trackComposer, setTrackComposer] = useState('');
  const [trackFullAudio, setTrackFullAudio] = useState('');
  const [trackSoprano, setTrackSoprano] = useState('');
  const [trackAlto, setTrackAlto] = useState('');
  const [trackTenor, setTrackTenor] = useState('');
  const [trackBass, setTrackBass] = useState('');
  const [trackSheet, setTrackSheet] = useState('');
  const [trackSundayDate, setTrackSundayDate] = useState('');
  const [submittingTrack, setSubmittingTrack] = useState(false);

  // Marketplace Songs State & Selling Upload State
  const [songs, setSongs] = useState<SongListing[]>([]);
  const [myPurchases, setMyPurchases] = useState<SongListing[]>([]);
  const [showPostSongModal, setShowPostSongModal] = useState<boolean>(false);
  const [songTitle, setSongTitle] = useState('');
  const [songComposer, setSongComposer] = useState('');
  const [songPrice, setSongPrice] = useState(15000);
  const [songSaleType, setSongSaleType] = useState<'exclusive_ownership' | 'digital_copies'>('exclusive_ownership');
  const [selectedAudioFile, setSelectedAudioFile] = useState<File | null>(null);
  const [audioDuration, setAudioDuration] = useState<number>(0);
  const [audioPreviewBlobUrl, setAudioPreviewBlobUrl] = useState<string>('');
  const [selectedSheetFile, setSelectedSheetFile] = useState<File | null>(null);
  const [previewStartTime, setPreviewStartTime] = useState<number>(0); // 35-second slider start second
  const [songSheetUrl, setSongSheetUrl] = useState('');
  const [songFullLyrics, setSongFullLyrics] = useState('');
  const [submittingSong, setSubmittingSong] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const [buyingSongId, setBuyingSongId] = useState<string | null>(null);

  // Fetch Choir data
  const fetchChoirs = async () => {
    try {
      const token = getAuthToken();
      if (!token) return;
      const res = await fetch('/api/modules/voxify/choirs/my', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.choirs && Array.isArray(data.choirs)) {
        setMyChoirs(data.choirs);
        if (data.choirs.length > 0 && !activeChoirId) {
          setActiveChoirId(data.choirs[0].id);
        }
      }
    } catch (e) {
      console.warn('Choir load error:', e);
    }
  };

  // Fetch Marketplace Songs
  const fetchSongs = async () => {
    try {
      const token = getAuthToken();
      const res = await fetch('/api/modules/voxify/songs', {
        headers: token ? { Authorization: `Bearer ${token}` } : {}
      });
      const data = await res.json();
      if (data.songs && Array.isArray(data.songs)) {
        setSongs(data.songs);
      }
    } catch (e) {
      console.warn('Songs load error:', e);
    }
  };

  // Fetch User's Unlocked Purchases
  const fetchMyPurchases = async () => {
    try {
      const token = getAuthToken();
      if (!token) return;
      const res = await fetch('/api/modules/voxify/songs/my-purchases', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.purchases && Array.isArray(data.purchases)) {
        setMyPurchases(data.purchases);
      }
    } catch (e) {
      console.warn('Purchases load error:', e);
    }
  };

  useEffect(() => {
    setLoading(true);
    Promise.all([fetchChoirs(), fetchSongs(), fetchMyPurchases()]).finally(() => {
      setLoading(false);
    });
  }, [user]);

  // Handle Play/Pause
  const togglePlay = (url: string) => {
    if (playingUrl === url && isPlaying) {
      audioRef.current?.pause();
      setIsPlaying(false);
    } else {
      setPlayingUrl(url);
      setIsPlaying(true);
      if (audioRef.current) {
        audioRef.current.src = url;
        audioRef.current.play().catch(() => {});
      }
    }
  };

  // Create Choir
  const handleCreateChoir = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      setWizardTarget('voxify');
      return;
    }
    try {
      const token = getAuthToken();
      const res = await fetch('/api/modules/voxify/choirs', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
        body: JSON.stringify({
          name: newChoirName,
          church_denomination: newChoirDenom,
          description: newChoirDesc
        })
      });
      const data = await res.json();
      if (res.ok) {
        setShowCreateChoirModal(false);
        setNewChoirName('');
        setNewChoirDesc('');
        setStatusMessage({ type: 'success', text: `Choir "${newChoirName}" registered successfully!` });
        fetchChoirs();
      } else {
        alert(data.error || 'Failed to create choir');
      }
    } catch (err: any) {
      alert(err.message || 'Error creating choir');
    }
  };

  // Director posts private choir track
  const handlePostTrack = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeChoirId) return;
    setSubmittingTrack(true);
    try {
      const token = getAuthToken();
      const res = await fetch(`/api/modules/voxify/choirs/${activeChoirId}/tracks`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
        body: JSON.stringify({
          title: trackTitle,
          composer: trackComposer,
          full_audio_url: trackFullAudio,
          soprano_url: trackSoprano,
          alto_url: trackAlto,
          tenor_url: trackTenor,
          bass_url: trackBass,
          sheet_music_url: trackSheet,
          target_sunday_date: trackSundayDate
        })
      });
      const data = await res.json();
      if (res.ok) {
        setShowUploadTrackModal(false);
        setTrackTitle('');
        setTrackComposer('');
        setTrackFullAudio('');
        setTrackSoprano('');
        setTrackAlto('');
        setTrackTenor('');
        setTrackBass('');
        setTrackSheet('');
        setStatusMessage({ type: 'success', text: 'Private vocal practice stems uploaded to choir workspace!' });
        fetchChoirs();
      } else {
        alert(data.error || 'Failed to post track');
      }
    } catch (err: any) {
      alert(err.message || 'Error posting track');
    } finally {
      setSubmittingTrack(false);
    }
  };

  // Toggle "Ready for Sunday"
  const handleToggleSundayReady = async (trackId: string, currentStatus: boolean) => {
    if (!activeChoirId) return;
    try {
      const token = getAuthToken();
      const res = await fetch(`/api/modules/voxify/choirs/${activeChoirId}/ready-sunday`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
        body: JSON.stringify({
          trackId,
          isReady: !currentStatus
        })
      });
      if (res.ok) {
        setStatusMessage({
          type: 'success',
          text: !currentStatus ? 'Marked: Ready to perform on Sunday! 🌟' : 'Status updated: Still practicing'
        });
        fetchChoirs();
      }
    } catch (e) {
      console.warn('Sunday ready toggle error:', e);
    }
  };

  // Buy Song with Wallet
  const handleBuySong = async (song: SongListing) => {
    if (!user) {
      setWizardTarget('voxify');
      return;
    }
    const currentBal = Number(wallet?.balance || 0);
    if (currentBal < song.price) {
      setStatusMessage({
        type: 'error',
        text: `Insufficient wallet balance (${song.price.toLocaleString()} RWF needed). Please top up.`
      });
      setIsWalletOpen(true);
      return;
    }

    if (
      !confirm(
        `Confirm purchase of "${song.title}" for ${song.price.toLocaleString()} RWF? ${
          song.sale_type === 'exclusive_ownership'
            ? 'You will receive 100% exclusive copyright ownership.'
            : 'You will receive an official license copy.'
        }`
      )
    )
      return;

    setBuyingSongId(song.id);
    try {
      const token = getAuthToken();
      const res = await fetch(`/api/modules/voxify/songs/${song.id}/buy`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        }
      });
      const data = await res.json();
      if (res.ok) {
        setStatusMessage({
          type: 'success',
          text: `🎉 Successfully unlocked "${song.title}"! Full master audio and lyrics are now in your library.`
        });
        refreshWallet();
        fetchSongs();
        fetchMyPurchases();
        setActiveTab('my_library');
      } else {
        setStatusMessage({ type: 'error', text: data.error || 'Purchase failed.' });
      }
    } catch (err: any) {
      setStatusMessage({ type: 'error', text: err.message || 'Error completing purchase.' });
    } finally {
      setBuyingSongId(null);
    }
  };

  const handleCopyChoirCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedChoirCode(code);
    setTimeout(() => setCopiedChoirCode(null), 2500);
  };

  const handleJoinChoirByCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      setWizardTarget('voxify');
      return;
    }
    const clean = joinCodeInput.trim().toUpperCase();
    if (clean.length !== 5) {
      alert('Choir code must be exactly 5 alphanumeric characters.');
      return;
    }
    setJoiningCodeLoading(true);
    try {
      const token = getAuthToken();
      const res = await fetch('/api/modules/voxify/choirs/join-code', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
        body: JSON.stringify({ choir_code: clean, voice_part: joinVoicePart })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setShowJoinCodeModal(false);
        setJoinCodeInput('');
        setStatusMessage({ type: 'success', text: data.message || `Joined choir "${data.choir?.name}"!` });
        await fetchChoirs();
        if (data.choir?.id) setActiveChoirId(data.choir.id);
      } else {
        alert(data.error || 'Failed to join choir with that code.');
      }
    } catch (err: any) {
      alert(err.message || 'Network error joining choir.');
    } finally {
      setJoiningCodeLoading(false);
    }
  };

  const handleAudioFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setSelectedAudioFile(file);
    const objUrl = URL.createObjectURL(file);
    setAudioPreviewBlobUrl(objUrl);

    const tempAudio = document.createElement('audio');
    tempAudio.src = objUrl;
    tempAudio.onloadedmetadata = () => {
      const dur = Math.round(tempAudio.duration || 0);
      setAudioDuration(dur);
      setPreviewStartTime(0);
    };
  };

  const handleDownloadMasterAudio = async (song: SongListing) => {
    if (!user) {
      setWizardTarget('voxify');
      return;
    }
    try {
      const token = getAuthToken();
      const res = await fetch(`/api/modules/voxify/songs/${song.id}/master-download`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok && data.downloadUrl) {
        const link = document.createElement('a');
        link.href = data.downloadUrl;
        link.download = `${(data.title || 'Master_Track').replace(/\s+/g, '_')}.mp3`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        setStatusMessage({ type: 'success', text: `Master audio downloaded for "${data.title}"!` });
      } else {
        handleBuySong(song);
      }
    } catch (err: any) {
      setStatusMessage({ type: 'error', text: err.message || 'Error downloading master track' });
    }
  };

  // Artist publishes song to marketplace
  const handlePostSongToMarketplace = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      setWizardTarget('voxify');
      return;
    }
    if (!selectedAudioFile) {
      alert('Please upload an audio file (MP3, WAV, AAC, M4A) for your track.');
      return;
    }
    setSubmittingSong(true);
    setUploadProgress(10);
    try {
      // 1. Upload audio file in resilient chunks
      setUploadProgress(15);
      const uploadedAudioUrl = await uploadFileInChunks(selectedAudioFile, {
        folder: 'audio',
        onProgress: (pct) => setUploadProgress(Math.round(15 + pct * 0.7))
      });

      // 2. Upload sheet music if selected
      let uploadedSheetUrl = songSheetUrl;
      if (selectedSheetFile) {
        setUploadProgress(88);
        uploadedSheetUrl = await uploadFileInChunks(selectedSheetFile, {
          folder: 'sheets'
        });
      }

      setUploadProgress(95);

      // Auto-extract first 3-4 lines as preview teaser from full lyrics
      const autoPreview = songFullLyrics
        ? songFullLyrics.split('\n').map((l) => l.trim()).filter(Boolean).slice(0, 4).join('\n')
        : '';

      const token = getAuthToken();
      const res = await fetch('/api/modules/voxify/songs', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
        body: JSON.stringify({
          title: songTitle.trim(),
          artist_name: songComposer.trim() || user.name || 'Composer',
          price: songPrice,
          license_type: songSaleType === 'exclusive_ownership' ? 'exclusive' : 'digital_copies',
          full_audio_url: uploadedAudioUrl,
          sheet_music_url: uploadedSheetUrl || '',
          preview_lyrics: autoPreview,
          full_lyrics: songFullLyrics.trim(),
          preview_start_time: previewStartTime
        })
      });

      const data = await res.json();
      if (res.ok) {
        setShowPostSongModal(false);
        setSongTitle('');
        setSongComposer('');
        setSelectedAudioFile(null);
        setAudioPreviewBlobUrl('');
        setAudioDuration(0);
        setSelectedSheetFile(null);
        setSongSheetUrl('');
        setSongFullLyrics('');
        setPreviewStartTime(0);
        setStatusMessage({
          type: 'success',
          text: `🎉 Song "${songTitle}" published to marketplace with automated lyrics teaser and 35s preview cut!`
        });
        fetchSongs();
      } else {
        alert(data.error || 'Failed to publish song');
      }
    } catch (err: any) {
      alert(err.message || 'Error publishing song');
    } finally {
      setSubmittingSong(false);
      setUploadProgress(0);
    }
  };

  const activeChoir = myChoirs.find((c) => c.id === activeChoirId) || myChoirs[0];

  return (
    <div className="bg-[#0B0E14] text-slate-100 min-h-screen pb-28 font-sans selection:bg-indigo-600 selection:text-white">
      <SeoHead
        title="Voxify Choirs & Music Marketplace — BenixSpace"
        description="Private choral rehearsal workspaces, isolated SATB practice stems, and original musical compositions to buy and own with exclusive licenses."
      />

      {/* Hidden audio element */}
      <audio ref={audioRef} onEnded={() => setIsPlaying(false)} className="hidden" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 space-y-6">
        {/* Prominent Back to Home Button & Wallet Summary */}
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-2">
            <Link
              to="/"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-2xl bg-[#121824] hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800 text-xs font-bold transition shadow-md"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to Home</span>
            </Link>
            <span className="text-xs text-indigo-400 font-bold flex items-center gap-1.5 bg-[#121824] px-3 py-1.5 rounded-xl border border-slate-800">
              <Mic2 className="w-3.5 h-3.5" />
              <span>Voxify Choral Architecture</span>
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsWalletOpen(true)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-800 text-emerald-400 text-xs font-bold hover:bg-slate-800 transition"
            >
              <Wallet className="w-3.5 h-3.5" />
              <span>{(wallet?.balance || 0).toLocaleString()} RWF</span>
            </button>
          </div>
        </div>

        {statusMessage && (
          <div
            className={`p-3.5 rounded-2xl border text-xs flex items-center justify-between ${
              statusMessage.type === 'success'
                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                : 'bg-rose-500/10 border-rose-500/30 text-rose-400'
            }`}
          >
            <span>{statusMessage.text}</span>
            <button onClick={() => setStatusMessage(null)}>
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Top Hero Banner */}
        <div className="relative rounded-3xl overflow-hidden border border-slate-800 bg-gradient-to-br from-[#1a1333] via-[#100d20] to-[#0B0E14] shadow-2xl p-6 sm:p-8">
          <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div className="space-y-3 max-w-2xl">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider bg-indigo-600 text-white shadow-lg shadow-indigo-600/30">
                <Music className="w-3.5 h-3.5" />
                Vocal Stems & Choral Licensing
              </span>
              <h1 className="text-2xl sm:text-4xl font-black text-white">
                Voxify Choirs & Song Marketplace
              </h1>
              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                Private rehearsal stems (Soprano, Alto, Tenor, Bass) for choir members, Sunday readiness tracking, and a marketplace for composers to sell exclusive song licenses.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={() => {
                  if (!user) setWizardTarget('voxify');
                  else setShowCreateChoirModal(true);
                }}
                className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-lg shadow-indigo-600/30 flex items-center gap-1.5 transition"
              >
                <Plus className="w-4 h-4" />
                <span>Register Choir</span>
              </button>
              <button
                onClick={() => {
                  if (!user) setWizardTarget('voxify');
                  else setShowPostSongModal(true);
                }}
                className="px-4 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs shadow-lg shadow-amber-600/30 flex items-center gap-1.5 transition"
              >
                <Crown className="w-4 h-4" />
                <span>Sell Original Song</span>
              </button>
            </div>
          </div>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center gap-2 p-1.5 rounded-2xl bg-slate-900 border border-slate-800 w-fit">
          <button
            onClick={() => setActiveTab('choirs')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 ${
              activeTab === 'choirs'
                ? 'bg-indigo-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>My Choirs & Practice Stems</span>
          </button>

          <button
            onClick={() => setActiveTab('marketplace')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 ${
              activeTab === 'marketplace'
                ? 'bg-amber-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <ShoppingBag className="w-4 h-4" />
            <span>Songs Marketplace (Buy & Own)</span>
          </button>

          <button
            onClick={() => setActiveTab('my_library')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 ${
              activeTab === 'my_library'
                ? 'bg-emerald-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Disc className="w-4 h-4" />
            <span>My Owned Music ({myPurchases.length})</span>
          </button>
        </div>

        {/* ========================================================= */}
        {/* TAB 1: CHOIRS & PRIVATE REHEARSAL STEMS                   */}
        {/* ========================================================= */}
        {activeTab === 'choirs' && (
          <div className="space-y-6">
            {!user ? (
              <div className="p-8 rounded-3xl bg-slate-900/60 border border-slate-800 text-center space-y-3">
                <Users className="w-10 h-10 text-indigo-400 mx-auto" />
                <h3 className="text-base font-bold text-white">Sign In to Access Choir Rehearsals</h3>
                <p className="text-xs text-slate-400 max-w-md mx-auto">
                  Private SATB practice tracks (Soprano, Alto, Tenor, Bass) are confidential to registered choir members and not public.
                </p>
                <button
                  onClick={() => setWizardTarget('voxify')}
                  className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold"
                >
                  Join / Sign In
                </button>
              </div>
            ) : myChoirs.length === 0 ? (
              <div className="p-8 rounded-3xl bg-slate-900/60 border border-slate-800 text-center space-y-3">
                <Music className="w-10 h-10 text-indigo-400 mx-auto" />
                <h3 className="text-base font-bold text-white">No Choir Memberships Yet</h3>
                <p className="text-xs text-slate-400 max-w-md mx-auto">
                  Register your choir as a director, or enter a 5-character Choir Code from your maestro to access private SATB vocal parts.
                </p>
                <div className="flex items-center justify-center gap-3 pt-2">
                  <button
                    onClick={() => setShowCreateChoirModal(true)}
                    className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold"
                  >
                    Register New Choir
                  </button>
                  <button
                    onClick={() => setShowJoinCodeModal(true)}
                    className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5"
                  >
                    <Music className="w-4 h-4" />
                    <span>Join with Choir Code</span>
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-6">
                {/* Choir Selector Bar */}
                <div className="flex items-center justify-between flex-wrap gap-3 p-4 bg-slate-900/80 border border-slate-800 rounded-2xl">
                  <div className="flex items-center gap-3 flex-wrap">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-slate-400">Current Choir:</span>
                      <select
                        value={activeChoirId || ''}
                        onChange={(e) => setActiveChoirId(e.target.value)}
                        className="px-3 py-1.5 bg-slate-950 border border-slate-700 rounded-xl text-xs font-bold text-white outline-none focus:border-indigo-500"
                      >
                        {myChoirs.map((c) => (
                          <option key={c.id} value={c.id}>
                            {c.name} ({c.church_denomination || 'Choir'})
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Choir Code Display with Copy Button */}
                    {activeChoir?.choir_code && (
                      <div className="flex items-center gap-2 px-3 py-1.5 bg-emerald-950/60 border border-emerald-500/30 rounded-xl">
                        <span className="text-[10px] text-emerald-400 font-bold uppercase tracking-wider">Choir Code:</span>
                        <span className="font-mono text-xs font-black text-white tracking-widest">{activeChoir.choir_code}</span>
                        <button
                          type="button"
                          onClick={() => handleCopyChoirCode(activeChoir.choir_code!)}
                          className="p-1 text-emerald-400 hover:text-white transition flex items-center gap-1"
                          title="Copy Choir Code to Invite Singers"
                        >
                          {copiedChoirCode === activeChoir.choir_code ? (
                            <Check className="w-3.5 h-3.5 text-emerald-300" />
                          ) : (
                            <Copy className="w-3.5 h-3.5" />
                          )}
                        </button>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setShowJoinCodeModal(true)}
                      className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-bold flex items-center gap-1.5 transition"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Join Another Choir</span>
                    </button>
                    <button
                      onClick={() => setShowUploadTrackModal(true)}
                      className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition"
                    >
                      <Upload className="w-3.5 h-3.5" />
                      <span>Upload SATB Track</span>
                    </button>
                  </div>
                </div>

                {activeChoir && (
                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                    {/* Left: Private Rehearsal Tracks */}
                    <div className="lg:col-span-8 space-y-4">
                      <div className="flex items-center justify-between">
                        <h3 className="text-sm font-bold text-white flex items-center gap-2">
                          <Mic2 className="w-4 h-4 text-indigo-400" />
                          <span>Private Practice Tracks ({activeChoir.tracks?.length || 0})</span>
                        </h3>
                        <span className="text-[11px] text-slate-400">Confidential to Choir</span>
                      </div>

                      {(!activeChoir.tracks || activeChoir.tracks.length === 0) ? (
                        <div className="p-8 bg-slate-900/40 rounded-2xl border border-slate-800 text-center text-xs text-slate-400">
                          No private rehearsal tracks uploaded yet. Click "Upload SATB Track" to add stems.
                        </div>
                      ) : (
                        <div className="space-y-3">
                          {activeChoir.tracks.map((track) => (
                            <div
                              key={track.id}
                              className="p-4 rounded-2xl bg-slate-900/70 border border-slate-800 space-y-3 hover:border-slate-700 transition"
                            >
                              <div className="flex items-start justify-between gap-3">
                                <div>
                                  <h4 className="text-sm font-bold text-white">{track.title}</h4>
                                  <p className="text-[11px] text-slate-400">
                                    Composer: {track.composer || 'Traditional'} • Target: {track.target_sunday_date || 'Upcoming Sunday'}
                                  </p>
                                </div>

                                <button
                                  onClick={() => handleToggleSundayReady(track.id, !!track.isMySundayReady)}
                                  className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition ${
                                    track.isMySundayReady
                                      ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                                      : 'bg-slate-800 text-slate-400 hover:text-white'
                                  }`}
                                  title="Mark whether you have mastered this song for Sunday service"
                                >
                                  <CheckCircle2 className="w-3.5 h-3.5" />
                                  <span>{track.isMySundayReady ? 'Ready for Sunday ✓' : 'I Know My Part'}</span>
                                </button>
                              </div>

                              {/* SATB Vocal Stem Switcher */}
                              <div className="p-2.5 rounded-xl bg-slate-950/80 border border-slate-800/80 space-y-2">
                                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                                  Isolate & Rehearse Vocal Part
                                </span>
                                <div className="grid grid-cols-2 sm:grid-cols-5 gap-1.5 text-xs">
                                  {[
                                    { key: 'full', label: 'Full Mix', url: track.full_audio_url },
                                    { key: 'soprano', label: 'Soprano 🎤', url: track.soprano_url },
                                    { key: 'alto', label: 'Alto 🎵', url: track.alto_url },
                                    { key: 'tenor', label: 'Tenor 🎶', url: track.tenor_url },
                                    { key: 'bass', label: 'Bass 🎸', url: track.bass_url }
                                  ].map((stem) => {
                                    const available = Boolean(stem.url);
                                    const isCurrentStemPlaying = playingUrl === stem.url && isPlaying;
                                    return (
                                      <button
                                        key={stem.key}
                                        disabled={!available}
                                        onClick={() => stem.url && togglePlay(stem.url)}
                                        className={`py-1.5 px-2 rounded-lg font-semibold flex items-center justify-center gap-1 transition ${
                                          isCurrentStemPlaying
                                            ? 'bg-indigo-600 text-white shadow-md'
                                            : available
                                            ? 'bg-slate-900 hover:bg-slate-800 text-slate-300'
                                            : 'bg-slate-950 text-slate-600 cursor-not-allowed'
                                        }`}
                                      >
                                        {isCurrentStemPlaying ? (
                                          <Pause className="w-3 h-3" />
                                        ) : (
                                          <Play className="w-3 h-3" />
                                        )}
                                        <span className="truncate">{stem.label}</span>
                                      </button>
                                    );
                                  })}
                                </div>
                              </div>

                              {track.sheet_music_url && (
                                <div className="flex justify-end">
                                  <a
                                    href={track.sheet_music_url}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="text-[11px] text-indigo-400 hover:underline inline-flex items-center gap-1"
                                  >
                                    <FileText className="w-3 h-3" />
                                    <span>Download Sheet Music PDF</span>
                                  </a>
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Right: Choir Members & Subscription */}
                    <div className="lg:col-span-4 space-y-4">
                      <div className="p-4 rounded-2xl bg-slate-900/70 border border-slate-800 space-y-3">
                        <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                          <h4 className="text-xs font-bold text-white flex items-center gap-1.5">
                            <Users className="w-3.5 h-3.5 text-indigo-400" />
                            <span>Choir Members ({activeChoir.members?.length || 0})</span>
                          </h4>
                          <span className="text-[10px] text-indigo-400 font-semibold">{activeChoir.role}</span>
                        </div>

                        <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                          {activeChoir.members?.map((m) => (
                            <div
                              key={m.user_id}
                              className="p-2 rounded-xl bg-slate-950 border border-slate-800/80 flex items-center justify-between text-xs"
                            >
                              <div>
                                <p className="font-semibold text-white text-[11px]">{m.name || 'Singer'}</p>
                                <span className="text-[10px] text-slate-500">{m.role}</span>
                              </div>
                              <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-slate-900 text-indigo-300 border border-slate-800">
                                {m.voice_part || 'SATB'}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Choir Plan Card */}
                      <div className="p-4 rounded-2xl bg-gradient-to-br from-indigo-950/40 to-slate-900 border border-indigo-500/20 space-y-2 text-xs">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-indigo-300">Choir Cloud Storage</span>
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-400">
                            Active
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-400">
                          Billed to Director central wallet. Unlimited stem storage and Sunday readiness tracking.
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* ========================================================= */}
        {/* TAB 2: ARTIST MARKETPLACE (ORIGINAL SONGS TO BUY & OWN)   */}
        {/* ========================================================= */}
        {activeTab === 'marketplace' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <Crown className="w-5 h-5 text-amber-400" />
                  <span>Original Songs to Buy & Own</span>
                </h3>
                <p className="text-xs text-slate-400">
                  Exclusive full-ownership master tracks and licensed choral arrangements by verified Rwandan composers.
                </p>
              </div>

              <button
                onClick={() => {
                  if (!user) setWizardTarget('voxify');
                  else setShowPostSongModal(true);
                }}
                className="px-4 py-2 bg-amber-600 hover:bg-amber-500 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 self-start"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Sell a Song</span>
              </button>
            </div>

            {songs.length === 0 ? (
              <div className="p-8 rounded-3xl bg-slate-900/40 border border-slate-800 text-center text-xs text-slate-400">
                No songs in the marketplace currently. Be the first composer to sell your master recording!
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {songs.map((song) => {
                  const isExclusive = song.sale_type === 'exclusive_ownership' || (song as any).license_type === 'exclusive';
                  const isPlayingThis = playingUrl === (song.preview_audio_url || song.audio_url) && isPlaying;
                  const isPurchased = myPurchases.some((p) => p.id === song.id) || song.owner_id === user?.id || (song as any).artist_id === user?.id;

                  return (
                    <div
                      key={song.id}
                      className="p-5 rounded-3xl bg-slate-900/70 border border-slate-800 space-y-4 flex flex-col justify-between hover:border-slate-700 transition"
                    >
                      <div className="space-y-3">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <span
                              className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider inline-flex items-center gap-1 ${
                                isExclusive
                                  ? 'bg-amber-500/10 text-amber-400 border border-amber-500/30'
                                  : 'bg-blue-500/10 text-blue-400 border border-blue-500/30'
                              }`}
                            >
                              {isExclusive ? <Crown className="w-3 h-3" /> : <Disc className="w-3 h-3" />}
                              {isExclusive ? 'Exclusive Ownership' : 'Digital License Copy'}
                            </span>
                            <h4 className="text-base font-bold text-white mt-1.5">{song.title}</h4>
                            <p className="text-xs text-slate-400">By {song.composer || song.composer_name || (song as any).artist_name || 'Artist'}</p>
                          </div>

                          <div className="text-right">
                            <span className="text-base font-black text-emerald-400">
                              {Number(song.price).toLocaleString()}
                            </span>{' '}
                            <span className="text-[10px] text-slate-400">RWF</span>
                          </div>
                        </div>

                        {/* Audio Preview Player */}
                        <div className="p-3 rounded-2xl bg-slate-950 border border-slate-800 flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => togglePlay(song.preview_audio_url || song.audio_url)}
                              className="w-8 h-8 rounded-full bg-amber-500 hover:bg-amber-400 text-slate-950 flex items-center justify-center font-bold transition shadow"
                            >
                              {isPlayingThis ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 ml-0.5" />}
                            </button>
                            <span className="text-xs font-semibold text-slate-300">
                              {isPlayingThis ? (isExclusive ? 'Playing 35s Preview' : 'Playing Sample') : (isExclusive ? 'Listen 35s Preview' : 'Listen Sample')}
                            </span>
                          </div>
                          <Headphones className="w-4 h-4 text-slate-500" />
                        </div>

                        {/* Locked Lyrics Preview (No dummy text) */}
                        <div className="p-3 rounded-2xl bg-slate-950/80 border border-slate-800 relative overflow-hidden">
                          <div className="flex items-center justify-between text-[11px] font-bold text-slate-400 mb-1">
                            <span>Lyrics Preview</span>
                            <span className="text-amber-400 flex items-center gap-1">
                              {isPurchased ? <Check className="w-3 h-3 text-emerald-400" /> : <Lock className="w-3 h-3" />}
                              {isPurchased ? 'Unlocked' : 'Locked'}
                            </span>
                          </div>

                          <p className="text-xs text-slate-300 italic whitespace-pre-line">
                            {song.preview_lyrics || 'Lyrics preview not provided.'}
                          </p>

                          {!isPurchased && (
                            <div className="relative mt-2">
                              <p className="text-xs text-slate-600 blur-sm select-none">
                                ••••••••••••••••••••••••••••••••••••••••••••••••••••••••••
                                ••••••••••••••••••••••••••••••••••••••••••••••••••••••••••
                              </p>
                              <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/80 to-transparent flex items-center justify-center">
                                <span className="text-[10px] font-bold text-amber-300 px-2 py-1 bg-amber-950/80 rounded border border-amber-500/30">
                                  Unlock Song to View Full Lyrics
                                </span>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Buy / Download Master Audio Actions */}
                      <div className="pt-3 border-t border-slate-800 flex items-center justify-between gap-2">
                        {isPurchased ? (
                          <button
                            onClick={() => handleDownloadMasterAudio(song)}
                            className="flex-1 py-2.5 px-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 shadow"
                          >
                            <Download className="w-3.5 h-3.5" />
                            <span>Download Master Audio</span>
                          </button>
                        ) : (
                          <button
                            onClick={() => handleBuySong(song)}
                            disabled={buyingSongId === song.id}
                            className="flex-1 py-2.5 px-3 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 shadow-md shadow-emerald-600/20 disabled:opacity-50"
                          >
                            <Lock className="w-3.5 h-3.5" />
                            <span>{buyingSongId === song.id ? 'Unlocking...' : `Unlock to Download (${Number(song.price).toLocaleString()} RWF)`}</span>
                          </button>
                        )}

                        <button
                          onClick={() => {
                            if (!user) setWizardTarget('voxify');
                            else navigate(buildSecureUrl('/messages', { chatWith: song.owner_id || '', topic: `Choir Song: ${song.title}` }));
                          }}
                          className="p-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs transition"
                          title="Chat with composer about arrangement / choir coaching"
                        >
                          <MessageCircle className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ========================================================= */}
        {/* TAB 3: MY PURCHASED & OWNED MUSIC                         */}
        {/* ========================================================= */}
        {activeTab === 'my_library' && (
          <div className="space-y-6">
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Disc className="w-5 h-5 text-emerald-400" />
                <span>My Unlocked Master Recordings & Licenses ({myPurchases.length})</span>
              </h3>
              <p className="text-xs text-slate-400">
                Full unlocked master audio files, complete unblurred lyrics, and sheet music licenses owned by your account.
              </p>
            </div>

            {myPurchases.length === 0 ? (
              <div className="p-8 rounded-3xl bg-slate-900/40 border border-slate-800 text-center text-xs text-slate-400 space-y-2">
                <Disc className="w-8 h-8 text-slate-600 mx-auto mb-1" />
                <p>You haven't unlocked any songs yet.</p>
                <button
                  onClick={() => setActiveTab('marketplace')}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold"
                >
                  Explore Songs Marketplace
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {myPurchases.map((purchase) => {
                  const isPlayingThis = playingUrl === purchase.audio_url && isPlaying;
                  return (
                    <div
                      key={purchase.id}
                      className="p-5 rounded-3xl bg-slate-900/80 border border-slate-800 space-y-4"
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                            ✓ Unlocked & Owned
                          </span>
                          <h4 className="text-base font-bold text-white mt-1.5">{purchase.title}</h4>
                          <p className="text-xs text-slate-400">Composer: {purchase.composer}</p>
                        </div>

                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => togglePlay(purchase.audio_url)}
                            className="w-10 h-10 rounded-full bg-emerald-500 text-slate-950 flex items-center justify-center font-bold shadow-lg"
                          >
                            {isPlayingThis ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5 ml-0.5" />}
                          </button>
                        </div>
                      </div>

                      {/* Full Unlocked Lyrics */}
                      <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 space-y-1.5">
                        <span className="text-[10px] font-bold uppercase text-emerald-400 block">
                          Full Verified Lyrics
                        </span>
                        <p className="text-xs text-slate-200 whitespace-pre-line max-h-40 overflow-y-auto pr-1">
                          {purchase.full_lyrics || purchase.preview_lyrics || 'Full lyrics unlocked and available for performance.'}
                        </p>
                      </div>

                      <div className="flex items-center justify-between pt-2 border-t border-slate-800 text-xs">
                        <a
                          href={purchase.audio_url}
                          download
                          className="inline-flex items-center gap-1.5 text-slate-300 hover:text-white"
                        >
                          <Download className="w-3.5 h-3.5" />
                          <span>Download Master Audio</span>
                        </a>

                        {purchase.sheet_music_url && (
                          <a
                            href={purchase.sheet_music_url}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1.5 text-indigo-400 hover:underline"
                          >
                            <FileText className="w-3.5 h-3.5" />
                            <span>Sheet Music PDF</span>
                          </a>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>

      {/* ========================================================= */}
      {/* MODALS: CREATE CHOIR, UPLOAD TRACK, SELL SONG             */}
      {/* ========================================================= */}

      {/* Register Choir Modal */}
      {showCreateChoirModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-md p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Users className="w-5 h-5 text-indigo-400" />
                Register Choir Workspace
              </h3>
              <button onClick={() => setShowCreateChoirModal(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateChoir} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">Choir Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g., Kigali Choral Society, Chorale de Kigali..."
                  value={newChoirName}
                  onChange={(e) => setNewChoirName(e.target.value)}
                  className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Denomination / Category</label>
                <select
                  value={newChoirDenom}
                  onChange={(e) => setNewChoirDenom(e.target.value)}
                  className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white"
                >
                  <option value="Adventist Choral">Adventist Choral</option>
                  <option value="Catholic Hymns & Sacred">Catholic Hymns & Sacred</option>
                  <option value="Anglican & Protestant">Anglican & Protestant</option>
                  <option value="Classical & Contemporary Gospel">Classical & Contemporary Gospel</option>
                  <option value="Independent Choral">Independent Choral</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Description</label>
                <textarea
                  rows={3}
                  placeholder="Church parish, rehearsal schedule (e.g. Tuesdays & Fridays 6pm)..."
                  value={newChoirDesc}
                  onChange={(e) => setNewChoirDesc(e.target.value)}
                  className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white resize-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCreateChoirModal(false)}
                  className="px-4 py-2 bg-slate-800 text-slate-300 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-bold"
                >
                  Create Choir
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Upload Private Choir Track Modal (Vocal Stems) */}
      {showUploadTrackModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-lg max-h-[90vh] overflow-y-auto p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Upload className="w-5 h-5 text-indigo-400" />
                Upload Private Choir Practice Stems
              </h3>
              <button onClick={() => setShowUploadTrackModal(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-400">
              These vocal stems are private to your choir members for practice and are NOT published publicly.
            </p>

            <form onSubmit={handlePostTrack} className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Song Title *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Halleluyah Chorus"
                    value={trackTitle}
                    onChange={(e) => setTrackTitle(e.target.value)}
                    className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Composer</label>
                  <input
                    type="text"
                    placeholder="e.g. G.F. Handel"
                    value={trackComposer}
                    onChange={(e) => setTrackComposer(e.target.value)}
                    className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Full Mix Audio URL *</label>
                <input
                  type="text"
                  required
                  placeholder="https://... full track audio URL"
                  value={trackFullAudio}
                  onChange={(e) => setTrackFullAudio(e.target.value)}
                  className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white font-mono"
                />
              </div>

              {/* Individual Stems */}
              <div className="grid grid-cols-2 gap-3 p-3 bg-slate-950 rounded-2xl border border-slate-800/80">
                <div>
                  <label className="block text-indigo-400 font-semibold mb-1">Soprano Vocal Audio URL</label>
                  <input
                    type="text"
                    placeholder="https://... soprano stem"
                    value={trackSoprano}
                    onChange={(e) => setTrackSoprano(e.target.value)}
                    className="w-full p-2 bg-slate-900 border border-slate-800 rounded-lg text-white font-mono text-[11px]"
                  />
                </div>
                <div>
                  <label className="block text-indigo-400 font-semibold mb-1">Alto Vocal Audio URL</label>
                  <input
                    type="text"
                    placeholder="https://... alto stem"
                    value={trackAlto}
                    onChange={(e) => setTrackAlto(e.target.value)}
                    className="w-full p-2 bg-slate-900 border border-slate-800 rounded-lg text-white font-mono text-[11px]"
                  />
                </div>
                <div>
                  <label className="block text-indigo-400 font-semibold mb-1">Tenor Vocal Audio URL</label>
                  <input
                    type="text"
                    placeholder="https://... tenor stem"
                    value={trackTenor}
                    onChange={(e) => setTrackTenor(e.target.value)}
                    className="w-full p-2 bg-slate-900 border border-slate-800 rounded-lg text-white font-mono text-[11px]"
                  />
                </div>
                <div>
                  <label className="block text-indigo-400 font-semibold mb-1">Bass Vocal Audio URL</label>
                  <input
                    type="text"
                    placeholder="https://... bass stem"
                    value={trackBass}
                    onChange={(e) => setTrackBass(e.target.value)}
                    className="w-full p-2 bg-slate-900 border border-slate-800 rounded-lg text-white font-mono text-[11px]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Sheet Music PDF URL</label>
                  <input
                    type="text"
                    placeholder="https://... sheet music"
                    value={trackSheet}
                    onChange={(e) => setTrackSheet(e.target.value)}
                    className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white font-mono"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Target Sunday Service</label>
                  <input
                    type="text"
                    placeholder="e.g. Next Sunday, Nov 2"
                    value={trackSundayDate}
                    onChange={(e) => setTrackSundayDate(e.target.value)}
                    className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowUploadTrackModal(false)}
                  className="px-4 py-2 bg-slate-800 text-slate-300 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingTrack}
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-bold disabled:opacity-50"
                >
                  {submittingTrack ? 'Uploading...' : 'Publish to Choir'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Artist Sell Song Modal */}
      {showPostSongModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-lg max-h-[90vh] overflow-y-auto p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Crown className="w-5 h-5 text-amber-400" />
                Publish Song to Marketplace
              </h3>
              <button onClick={() => setShowPostSongModal(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handlePostSongToMarketplace} className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Song Title *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Umunsi Mukuru"
                    value={songTitle}
                    onChange={(e) => setSongTitle(e.target.value)}
                    className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Composer Name</label>
                  <input
                    type="text"
                    placeholder={user?.name || 'Composer'}
                    value={songComposer}
                    onChange={(e) => setSongComposer(e.target.value)}
                    className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Price (RWF) *</label>
                  <input
                    type="number"
                    min="500"
                    step="500"
                    required
                    value={songPrice}
                    onChange={(e) => setSongPrice(Number(e.target.value))}
                    className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white font-mono"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Sale Licensing Type</label>
                  <select
                    value={songSaleType}
                    onChange={(e) => setSongSaleType(e.target.value as any)}
                    className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white"
                  >
                    <option value="exclusive_ownership">👑 Exclusive Full Ownership (Sold Once)</option>
                    <option value="digital_copies">💿 Digital Copies & Licenses (Multi-sale)</option>
                  </select>
                </div>
              </div>

              {/* Audio Track File Picker (No external links) */}
              <div className="space-y-1.5">
                <label className="block text-slate-300 font-semibold">Master Audio Track *</label>
                <div className="border border-dashed border-slate-700 rounded-2xl p-4 text-center bg-slate-950/60 hover:border-amber-500 transition">
                  {selectedAudioFile ? (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-left">
                        <div className="flex items-center gap-2">
                          <Music className="w-5 h-5 text-amber-400 shrink-0" />
                          <div>
                            <p className="text-xs font-bold text-white truncate max-w-xs">{selectedAudioFile.name}</p>
                            <span className="text-[10px] text-slate-400">
                              {(selectedAudioFile.size / (1024 * 1024)).toFixed(1)} MB {audioDuration > 0 ? `• ${Math.floor(audioDuration / 60)}:${audioDuration % 60 < 10 ? '0' : ''}${audioDuration % 60}` : ''}
                            </span>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedAudioFile(null);
                            setAudioPreviewBlobUrl('');
                            setAudioDuration(0);
                            setPreviewStartTime(0);
                          }}
                          className="p-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      {audioPreviewBlobUrl && (
                        <audio src={audioPreviewBlobUrl} controls className="w-full h-8 mt-1" />
                      )}
                    </div>
                  ) : (
                    <label className="cursor-pointer block py-3">
                      <Upload className="w-6 h-6 text-amber-400 mx-auto mb-1.5" />
                      <span className="text-xs font-bold text-white block">Click to upload audio track from device</span>
                      <span className="text-[10px] text-slate-400 block mt-0.5">MP3, WAV, AAC, M4A, OGG</span>
                      <input
                        type="file"
                        accept="audio/*,.mp3,.wav,.aac,.m4a,.ogg"
                        onChange={handleAudioFileSelect}
                        className="hidden"
                      />
                    </label>
                  )}
                </div>
              </div>

              {/* 35-Second Preview Timeline Slider for Exclusive Full Ownership */}
              {songSaleType === 'exclusive_ownership' && audioDuration > 0 && (
                <div className="p-3.5 bg-amber-950/20 border border-amber-500/30 rounded-2xl space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-amber-300 flex items-center gap-1.5">
                      <Crown className="w-3.5 h-3.5" />
                      <span>35-Second Public Preview Segment (Slider)</span>
                    </span>
                    <span className="font-mono text-[11px] text-amber-400 font-bold">
                      {Math.floor(previewStartTime / 60)}:{(previewStartTime % 60) < 10 ? '0' : ''}{previewStartTime % 60} - {Math.floor((previewStartTime + 35) / 60)}:{((previewStartTime + 35) % 60) < 10 ? '0' : ''}{(previewStartTime + 35) % 60} (35s)
                    </span>
                  </div>

                  <input
                    type="range"
                    min="0"
                    max={Math.max(0, Math.floor(audioDuration - 35))}
                    step="1"
                    value={previewStartTime}
                    onChange={(e) => setPreviewStartTime(Number(e.target.value))}
                    className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-amber-500"
                  />

                  <div className="flex items-center justify-between text-[10px] text-slate-400">
                    <span>Start: 0:00</span>
                    <button
                      type="button"
                      onClick={() => {
                        if (audioPreviewBlobUrl) {
                          const testAudio = new Audio(audioPreviewBlobUrl);
                          testAudio.currentTime = previewStartTime;
                          testAudio.play();
                          setTimeout(() => testAudio.pause(), 35000);
                        }
                      }}
                      className="text-amber-400 hover:text-amber-300 font-bold underline"
                    >
                      Listen to Selected 35s ▶
                    </button>
                    <span>End: {Math.floor(audioDuration / 60)}:{(audioDuration % 60) < 10 ? '0' : ''}{audioDuration % 60}</span>
                  </div>
                  <p className="text-[10px] text-slate-400 italic">
                    Slide through the song to choose the 35s excerpt listeners can hear. Full audio is locked and protected against DevTools inspection.
                  </p>
                </div>
              )}

              {/* Sheet Music Upload (PDF / Image) */}
              <div className="space-y-1.5">
                <label className="block text-slate-300 font-semibold">Sheet Music PDF / Image (optional)</label>
                <div className="border border-dashed border-slate-700 rounded-xl p-2.5 text-center bg-slate-950/60">
                  {selectedSheetFile ? (
                    <div className="flex items-center justify-between text-left text-xs">
                      <div className="flex items-center gap-2">
                        <FileText className="w-4 h-4 text-indigo-400" />
                        <span className="font-semibold text-white truncate max-w-xs">{selectedSheetFile.name}</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => setSelectedSheetFile(null)}
                        className="text-slate-400 hover:text-white"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ) : (
                    <label className="cursor-pointer block py-1.5">
                      <span className="text-xs text-indigo-400 font-bold block">+ Select Sheet Music File (.pdf, .jpg, .png)</span>
                      <input
                        type="file"
                        accept=".pdf,image/*"
                        onChange={(e) => e.target.files?.[0] && setSelectedSheetFile(e.target.files[0])}
                        className="hidden"
                      />
                    </label>
                  )}
                </div>
              </div>

              {/* Full Lyrics (Auto-extracts opening lines as preview teaser) */}
              <div>
                <label className="block text-slate-300 font-semibold mb-1">
                  Full Lyrics (Locked; only visible after purchase) *
                </label>
                <textarea
                  rows={4}
                  required
                  placeholder="Enter complete song lyrics (verses, choruses, bridge)..."
                  value={songFullLyrics}
                  onChange={(e) => setSongFullLyrics(e.target.value)}
                  className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white font-mono text-xs"
                />
              </div>

              {/* Automated Lyrics Preview Teaser Notice */}
              {songFullLyrics.trim() && (
                <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 space-y-1">
                  <span className="text-[10px] text-amber-400 font-bold uppercase tracking-wider">
                    Automated Public Preview Teaser (First 3-4 lines):
                  </span>
                  <p className="text-xs text-slate-300 italic whitespace-pre-line">
                    {songFullLyrics.split('\n').map((l) => l.trim()).filter(Boolean).slice(0, 4).join('\n')}
                  </p>
                </div>
              )}

              {uploadProgress > 0 && (
                <div className="space-y-1">
                  <div className="flex justify-between text-[11px] text-slate-400">
                    <span>Uploading Audio Track...</span>
                    <span className="font-bold text-amber-400">{uploadProgress}%</span>
                  </div>
                  <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-amber-500 to-orange-500 transition-all duration-200"
                      style={{ width: `${uploadProgress}%` }}
                    />
                  </div>
                </div>
              )}

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowPostSongModal(false)}
                  className="px-4 py-2 bg-slate-800 text-slate-300 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingSong || !selectedAudioFile}
                  className="px-5 py-2 bg-amber-600 hover:bg-amber-500 text-white rounded-xl font-bold disabled:opacity-50"
                >
                  {submittingSong ? 'Uploading Track...' : 'Publish to Store'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Join Choir by Code Modal */}
      {showJoinCodeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-md p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Music className="w-5 h-5 text-emerald-400" />
                <span>Join Choir with 5-Digit Code</span>
              </h3>
              <button onClick={() => setShowJoinCodeModal(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleJoinChoirByCode} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">Choir Code *</label>
                <input
                  type="text"
                  required
                  maxLength={5}
                  value={joinCodeInput}
                  onChange={(e) => setJoinCodeInput(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ''))}
                  placeholder="e.g. 7X9KQ"
                  className="w-full p-3 bg-slate-950 border border-slate-800 rounded-xl text-center text-sm font-mono tracking-widest text-white uppercase font-black focus:outline-none focus:border-emerald-500"
                />
                <p className="text-[10px] text-slate-400 text-center mt-1">
                  Ask your choir director or maestro for the 5-character choir code.
                </p>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Your Voice Part *</label>
                <select
                  value={joinVoicePart}
                  onChange={(e) => setJoinVoicePart(e.target.value)}
                  className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white outline-none focus:border-emerald-500"
                >
                  <option value="soprano">Soprano (Voice 1)</option>
                  <option value="alto">Alto (Voice 2)</option>
                  <option value="tenor">Tenor (Voice 3)</option>
                  <option value="bass">Bass (Voice 4)</option>
                  <option value="director">Choir Master / Director</option>
                  <option value="pianist">Pianist / Accompanist</option>
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowJoinCodeModal(false)}
                  className="px-4 py-2 bg-slate-800 text-slate-300 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={joiningCodeLoading || joinCodeInput.length !== 5}
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold disabled:opacity-50"
                >
                  {joiningCodeLoading ? 'Verifying...' : 'Join Choir'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Wallet Modal */}
      {isWalletOpen && (
        <WalletModal
          isOpen={isWalletOpen}
          onClose={() => setIsWalletOpen(false)}
        />
      )}

      {/* Access Wizard */}
      <AppAccessWizardModal
        isOpen={!!wizardTarget}
        targetAppKey={wizardTarget}
        onClose={() => setWizardTarget(null)}
        onSuccess={() => {
          setWizardTarget(null);
          fetchChoirs();
        }}
      />
    </div>
  );
};
