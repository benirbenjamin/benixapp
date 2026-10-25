import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { AppAccessWizardModal } from '../../components/modals/AppAccessWizardModal';
import { SeoHead } from '../../components/common/SeoHead';
import { getAuthToken } from '../../services/api';
import axios from 'axios';
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
  X
} from 'lucide-react';

interface ChoirTrack {
  id: string;
  title: string;
  choir: string;
  category: string;
  voicePart: 'soprano' | 'alto' | 'tenor' | 'bass' | 'satb';
  duration: string;
  hasSheetMusic: boolean;
  audioUrl: string;
  sheetMusicUrl?: string;
}

export const VoxifyPage: React.FC = () => {
  const { user, hasAppProfile } = useAuth();
  const [tracks, setTracks] = useState<ChoirTrack[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [wizardTarget, setWizardTarget] = useState<string | null>(null);
  const [selectedPart, setSelectedPart] = useState<string>('all');
  const [currentTrack, setCurrentTrack] = useState<ChoirTrack | null>(null);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [actionSuccess, setActionSuccess] = useState<string>('');
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [duration, setDuration] = useState<number>(0);
  const audioRef = React.useRef<HTMLAudioElement | null>(null);

  const formatTime = (secs: number) => {
    const s = Math.max(0, Math.floor(secs || 0));
    const m = Math.floor(s / 60);
    const r = s % 60;
    return `${m}:${r < 10 ? '0' : ''}${r}`;
  };

  // Upload Track Modal State
  const [showUploadModal, setShowUploadModal] = useState<boolean>(false);
  const [newTitle, setNewTitle] = useState('');
  const [newChoir, setNewChoir] = useState('');
  const [newCategory, setNewCategory] = useState('Sacred Classical');
  const [newVoicePart, setNewVoicePart] = useState<'soprano' | 'alto' | 'tenor' | 'bass' | 'satb'>('satb');
  const [newDuration, setNewDuration] = useState('3:45');
  const [newAudioUrl, setNewAudioUrl] = useState('');
  const [newSheetUrl, setNewSheetUrl] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Fetch real tracks from DB
  const fetchTracks = () => {
    setLoading(true);
    axios
      .get('/api/modules/voxify/tracks')
      .then((res) => {
        if (res.data?.tracks && Array.isArray(res.data.tracks)) {
          setTracks(res.data.tracks);
          if (res.data.tracks.length > 0 && !currentTrack) {
            setCurrentTrack(res.data.tracks[0]);
          }
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchTracks();
  }, []);

  const handleProtectedAction = (track: ChoirTrack, action: 'play' | 'sheet' | 'join') => {
    if (!user || !hasAppProfile('voxify')) {
      setWizardTarget('voxify');
      return;
    }

    if (action === 'play') {
      setCurrentTrack(track);
      setIsPlaying(true);
      setActionSuccess(`Now rehearsing: ${track.title} (${track.choir})`);
      setTimeout(() => setActionSuccess(''), 4000);
    } else if (action === 'sheet') {
      if (track.sheetMusicUrl) {
        window.open(track.sheetMusicUrl, '_blank');
      } else {
        setActionSuccess(`Sheet music PDF for "${track.title}" is being synchronized.`);
        setTimeout(() => setActionSuccess(''), 4000);
      }
    } else {
      setActionSuccess('Joined rehearsal session. Audio sync active.');
      setTimeout(() => setActionSuccess(''), 4000);
    }
  };

  const handleUploadTrack = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      setWizardTarget('voxify');
      return;
    }
    if (!newTitle.trim() || !newAudioUrl.trim()) {
      alert('Please provide song title and audio stream URL.');
      return;
    }

    setIsSubmitting(true);
    try {
      const token = getAuthToken();
      const res = await axios.post(
        '/api/modules/voxify/tracks',
        {
          title: newTitle.trim(),
          choir: newChoir.trim() || user.name || 'Verified Choir',
          category: newCategory,
          voicePart: newVoicePart,
          duration: newDuration.trim() || '3:30',
          hasSheetMusic: Boolean(newSheetUrl.trim()),
          audioUrl: newAudioUrl.trim(),
          sheetMusicUrl: newSheetUrl.trim() || null
        },
        { headers: token ? { Authorization: `Bearer ${token}` } : undefined }
      );

      if (res.data?.track) {
        setTracks((prev) => [res.data.track, ...prev]);
        setCurrentTrack(res.data.track);
        setShowUploadModal(false);
        setNewTitle('');
        setNewChoir('');
        setNewAudioUrl('');
        setNewSheetUrl('');
        setActionSuccess('🎉 Choir track published to Voxify successfully!');
        setTimeout(() => setActionSuccess(''), 5000);
      }
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to publish track.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredTracks = tracks.filter((t) => {
    if (selectedPart === 'all') return true;
    return t.voicePart === selectedPart;
  });

  return (
    <div className="bg-[#0B0E14] text-slate-100 min-h-screen pb-24 font-sans selection:bg-indigo-600 selection:text-white">
      <SeoHead
        title="Voxify Music & Choirs — Gospel, Vocal Rehearsals & Sheet Music"
        description="Stream Rwandan choir songs, practice vocal parts (Soprano, Alto, Tenor, Bass), and download conductor sheet music on Voxify."
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 space-y-8">
        
        {/* Prominent Back to Home Button & Publish */}
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-2">
            <Link
              to="/"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-2xl bg-[#121824] hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800 text-xs font-bold transition-all hover:scale-105 shadow-md"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to Home</span>
            </Link>
            <span className="text-xs text-indigo-400 font-bold flex items-center gap-1.5 bg-[#121824] px-3 py-1.5 rounded-xl border border-slate-800">
              <Mic2 className="w-3.5 h-3.5" />
              <span>Voxify Rwandan Choir Studio</span>
            </span>
          </div>

          <button
            onClick={() => {
              if (!user) setWizardTarget('voxify');
              else setShowUploadModal(true);
            }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-lg shadow-indigo-600/30 transition-all hover:scale-105"
          >
            <Upload className="w-3.5 h-3.5" />
            <span>Upload Choir Track / Score</span>
          </button>
        </div>

        {/* Top Hero Banner */}
        <div className="relative rounded-3xl overflow-hidden border border-slate-800 bg-gradient-to-br from-[#12142d] via-[#0d0f22] to-[#0B0E14] shadow-2xl p-6 sm:p-10">
          <div className="absolute top-0 right-0 -mr-16 -mt-16 w-80 h-80 rounded-full bg-indigo-600/10 blur-3xl pointer-events-none" />
          <div className="absolute bottom-0 left-1/3 -mb-16 w-72 h-72 rounded-full bg-blue-600/10 blur-3xl pointer-events-none" />

          <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div className="space-y-4 max-w-2xl">
              <div className="flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider bg-indigo-600 text-white shadow-lg shadow-indigo-600/30">
                  <Mic2 className="w-3.5 h-3.5" />
                  Voxify Choral Studio
                </span>
                <span className="px-3 py-1 rounded-full text-xs font-semibold bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                  Multi-Voice SATB Isolation
                </span>
                <span className="px-3 py-1 rounded-full text-xs font-semibold bg-slate-800 text-slate-300">
                  Verified Sheet Music
                </span>
              </div>

              <h1 className="text-3xl sm:text-5xl font-black tracking-tight text-white leading-tight">
                Sing, Rehearse & Master <br />
                <span className="bg-gradient-to-r from-indigo-400 via-sky-300 to-purple-400 bg-clip-text text-transparent">
                  Every Vocal Choral Part
                </span>
              </h1>

              <p className="text-sm sm:text-base text-slate-400 leading-relaxed">
                Dedicated audio studio for Rwandan church choirs and vocalists. Rehearse isolated Soprano, Alto, Tenor, and Bass harmonies with synchronized score sheets.
              </p>

              <div className="flex flex-wrap items-center gap-3 pt-2">
                <button
                  onClick={() => {
                    if (!user || !hasAppProfile('voxify')) {
                      setWizardTarget('voxify');
                    } else {
                      setActionSuccess('Your vocal part profile is active! Select any choir track to rehearse.');
                      setTimeout(() => setActionSuccess(''), 4000);
                    }
                  }}
                  className="px-6 py-3.5 rounded-2xl bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-500 hover:to-blue-500 text-white font-bold text-sm shadow-xl shadow-indigo-600/25 flex items-center gap-2.5 transition-all transform active:scale-95"
                >
                  <Sparkles className="w-4 h-4" />
                  {hasAppProfile('voxify') ? 'Manage Vocal Part' : 'Select Vocal Part (S/A/T/B)'}
                </button>
              </div>
            </div>

            {/* Now Playing Rehearsal Widget */}
            {currentTrack && (
              <div className="w-full md:w-80 p-5 rounded-2xl bg-[#171A34]/90 border border-indigo-500/30 shadow-2xl backdrop-blur-md">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded-md border border-indigo-500/20">
                    Vocal Track Rehearsal
                  </span>
                  <span className="text-xs text-slate-400 font-mono">{currentTrack.duration}</span>
                </div>

                <h4 className="font-extrabold text-base text-white">{currentTrack.title}</h4>
                <p className="text-xs text-slate-400">{currentTrack.choir}</p>

                <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-between">
                  <span className="px-2.5 py-1 rounded-lg text-[10px] font-black uppercase bg-indigo-600 text-white">
                    {currentTrack.voicePart.toUpperCase()} Part
                  </span>

                  <button
                    onClick={() => handleProtectedAction(currentTrack, 'play')}
                    className="w-10 h-10 rounded-full bg-indigo-600 hover:bg-indigo-500 text-white flex items-center justify-center shadow-lg shadow-indigo-600/40 transition-all"
                  >
                    {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 fill-white ml-0.5" />}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Action feedback */}
        {actionSuccess && (
          <div className="p-4 rounded-2xl bg-indigo-950/60 border border-indigo-500/50 text-indigo-200 text-xs font-bold flex items-center gap-2 shadow-lg">
            <CheckCircle2 className="w-4 h-4 text-indigo-400" />
            <span>{actionSuccess}</span>
          </div>
        )}

        {/* Voice Part Filter Strip */}
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
            {[
              { id: 'all', label: 'All Vocal Parts' },
              { id: 'satb', label: 'SATB Full Choir' },
              { id: 'soprano', label: 'Soprano (High)' },
              { id: 'alto', label: 'Alto (Mid Harmony)' },
              { id: 'tenor', label: 'Tenor (High Male)' },
              { id: 'bass', label: 'Bass (Deep Low)' }
            ].map((p) => (
              <button
                key={p.id}
                onClick={() => setSelectedPart(p.id)}
                className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                  selectedPart === p.id
                    ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20'
                    : 'bg-[#131926] text-slate-400 hover:text-white hover:bg-[#1a2234] border border-slate-800'
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>

          <span className="text-xs text-slate-400">
            {filteredTracks.length} Scores Available
          </span>
        </div>

        {/* Tracks List */}
        {loading ? (
          <div className="p-12 text-center text-slate-400 text-xs">Loading choir rehearsal tracks...</div>
        ) : filteredTracks.length === 0 ? (
          <div className="p-12 text-center rounded-3xl bg-[#131926] border border-slate-800 space-y-3">
            <Music className="w-10 h-10 text-indigo-400 mx-auto" />
            <h3 className="text-base font-bold text-white">No Choir Tracks Published Yet</h3>
            <p className="text-xs text-slate-400 max-w-md mx-auto">
              Be the first Rwandan choir director or vocalist to publish an SATB rehearsal track and score sheet to Voxify.
            </p>
            <button
              onClick={() => {
                if (!user) setWizardTarget('voxify');
                else setShowUploadModal(true);
              }}
              className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-md shadow-indigo-600/30 transition-all inline-flex items-center gap-2"
            >
              <Upload className="w-4 h-4" />
              <span>Upload Track</span>
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredTracks.map((track) => (
              <div
                key={track.id}
                className="p-4 sm:p-5 rounded-2xl bg-[#131926] border border-slate-800/80 hover:border-indigo-500/40 transition-all flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 group"
              >
                <div className="flex items-center gap-4">
                  <button
                    onClick={() => handleProtectedAction(track, 'play')}
                    className="w-12 h-12 rounded-2xl bg-[#1A2234] group-hover:bg-indigo-600 text-slate-300 group-hover:text-white flex items-center justify-center transition-all flex-shrink-0 shadow-md"
                  >
                    <Play className="w-5 h-5 fill-current ml-0.5" />
                  </button>

                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-extrabold text-sm text-white group-hover:text-indigo-400 transition-colors">
                        {track.title}
                      </h3>
                      <span className="px-2 py-0.5 rounded-md text-[10px] font-black uppercase bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                        {track.voicePart}
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 mt-0.5">
                      {track.choir} • <span className="text-slate-500">{track.category}</span>
                    </p>
                  </div>
                </div>

                {/* Right Side Actions */}
                <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                  {track.hasSheetMusic && (
                    <button
                      onClick={() => handleProtectedAction(track, 'sheet')}
                      className="px-3.5 py-2 rounded-xl bg-[#1C2538] hover:bg-[#25324c] text-indigo-300 border border-indigo-500/30 text-xs font-bold flex items-center gap-1.5 transition-all"
                    >
                      <FileText className="w-3.5 h-3.5" />
                      Sheet PDF
                    </button>
                  )}

                  <button
                    onClick={() => handleProtectedAction(track, 'join')}
                    className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-md shadow-indigo-600/20 transition-all"
                  >
                    <Headphones className="w-3.5 h-3.5" />
                    Rehearse
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Non-Logged In Callout */}
        {!user && (
          <div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-r from-indigo-950/60 via-[#131926] to-purple-950/60 border border-indigo-500/20 flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="space-y-1 text-center md:text-left">
              <h3 className="text-lg font-black text-white">Join Voxify Choral Community</h3>
              <p className="text-xs text-slate-400">
                Register to download high-resolution choral sheet music, set your voice part, and access choir rehearsal audio tracks.
              </p>
            </div>
            <button
              onClick={() => setWizardTarget('voxify')}
              className="px-6 py-3 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-extrabold text-xs shadow-lg shadow-indigo-600/30 whitespace-nowrap transition-all"
            >
              Join Choral Studio
            </button>
          </div>
        )}

      </div>

      {/* Upload Track Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
          <div className="bg-[#121824] border border-slate-800 rounded-3xl p-6 w-full max-w-lg shadow-2xl relative">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <h3 className="text-base font-extrabold text-white flex items-center gap-2">
                <Mic2 className="w-5 h-5 text-indigo-400" />
                <span>Upload Choir Track / Sheet Music</span>
              </h3>
              <button onClick={() => setShowUploadModal(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleUploadTrack} className="space-y-4 pt-4">
              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1">Song / Choral Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Mana Ndagushimira"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1">Choir / Vocalist Name</label>
                <input
                  type="text"
                  placeholder="e.g. Chorale de Kigali"
                  value={newChoir}
                  onChange={(e) => setNewChoir(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-300 block mb-1">Voice Part</label>
                  <select
                    value={newVoicePart}
                    onChange={(e) => setNewVoicePart(e.target.value as any)}
                    className="w-full px-3 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white focus:outline-none focus:border-indigo-500"
                  >
                    <option value="satb">SATB (Full Choir)</option>
                    <option value="soprano">Soprano</option>
                    <option value="alto">Alto</option>
                    <option value="tenor">Tenor</option>
                    <option value="bass">Bass</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-300 block mb-1">Duration</label>
                  <input
                    type="text"
                    placeholder="e.g. 4:18"
                    value={newDuration}
                    onChange={(e) => setNewDuration(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1">Audio Stream / MP3 URL *</label>
                <input
                  type="url"
                  required
                  placeholder="https://... audio file URL"
                  value={newAudioUrl}
                  onChange={(e) => setNewAudioUrl(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1">Sheet Music PDF URL (Optional)</label>
                <input
                  type="url"
                  placeholder="https://... sheet music PDF link"
                  value={newSheetUrl}
                  onChange={(e) => setNewSheetUrl(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowUploadModal(false)}
                  className="px-4 py-2.5 rounded-xl bg-slate-800 text-slate-300 hover:text-white text-xs font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-lg shadow-indigo-600/30 transition-all disabled:opacity-50"
                >
                  {isSubmitting ? 'Publishing...' : 'Publish Track'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Floating Rehearsal Audio Player Bar with Chunked Streaming */}
      {currentTrack && (
        <div className="fixed bottom-0 left-0 right-0 z-40 bg-[#0F1422]/95 backdrop-blur-xl border-t border-indigo-500/30 p-3 sm:p-4 shadow-2xl animate-in slide-in-from-bottom">
          <audio
            ref={audioRef}
            key={currentTrack.id}
            src={currentTrack.audioUrl}
            preload="metadata"
            autoPlay={isPlaying}
            onTimeUpdate={(e) => setCurrentTime(e.currentTarget.currentTime)}
            onLoadedMetadata={(e) => setDuration(e.currentTarget.duration || 0)}
            onPlay={() => setIsPlaying(true)}
            onPause={() => setIsPlaying(false)}
            onEnded={() => setIsPlaying(false)}
          />
          <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="flex items-center gap-3 w-full sm:w-auto">
              <button
                onClick={() => {
                  if (!audioRef.current) return;
                  if (isPlaying) audioRef.current.pause();
                  else audioRef.current.play().catch(() => {});
                }}
                className="w-10 h-10 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white flex items-center justify-center shadow-lg shadow-indigo-600/30 shrink-0"
              >
                {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5 fill-current ml-0.5" />}
              </button>
              <div className="min-w-0">
                <h4 className="text-xs sm:text-sm font-black text-white truncate">{currentTrack.title}</h4>
                <p className="text-[11px] text-slate-400 truncate">
                  {currentTrack.choir} • <span className="text-indigo-400 font-bold uppercase">{currentTrack.voicePart}</span>
                </p>
              </div>
            </div>

            {/* Seekable Progress Bar & Timestamp */}
            <div className="flex-1 max-w-xl w-full flex items-center gap-3">
              <span className="text-[10px] font-mono text-slate-400 w-9 text-right">{formatTime(currentTime)}</span>
              <input
                type="range"
                min={0}
                max={duration || 100}
                value={currentTime}
                onChange={(e) => {
                  const val = parseFloat(e.target.value);
                  setCurrentTime(val);
                  if (audioRef.current) audioRef.current.currentTime = val;
                }}
                className="flex-1 accent-indigo-500 h-1.5 bg-slate-800 rounded-full cursor-pointer"
              />
              <span className="text-[10px] font-mono text-slate-400 w-9">{formatTime(duration)}</span>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  if (audioRef.current) audioRef.current.pause();
                  setCurrentTrack(null);
                  setIsPlaying(false);
                }}
                className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white"
                title="Close player"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Access Wizard Modal for Voxify Requirements */}
      <AppAccessWizardModal
        isOpen={!!wizardTarget}
        targetAppKey={wizardTarget}
        onClose={() => setWizardTarget(null)}
        onSuccess={() => {
          setWizardTarget(null);
          setActionSuccess('Your choir vocal profile has been configured! Enjoy rehearsal tracks and score sheets.');
          setTimeout(() => setActionSuccess(''), 5000);
        }}
      />
    </div>
  );
};
