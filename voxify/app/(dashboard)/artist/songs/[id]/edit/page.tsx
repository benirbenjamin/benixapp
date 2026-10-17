'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/lib/context/AuthContext';
import { marketplaceService } from '@/lib/services/marketplaceService';
import { Genre, MarketplaceSong, MarketplaceSongStatus } from '@/lib/types/database.types';
import { createClient } from '@/lib/supabase/client';
import { BackButton } from '@/components/ui/BackButton';
import { generateSongCover } from '@/lib/utils/coverGenerator';
import {
  UploadCloud,
  Music,
  Clock,
  DollarSign,
  FileText,
  Image as ImageIcon,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  Sparkles,
  Loader2,
  Play,
  Pause,
  Save,
  Eye,
  Trash2,
  ShieldCheck,
} from 'lucide-react';

export default function EditSongPage() {
  const params = useParams();
  const router = useRouter();
  const songId = params?.id as string;
  const { user, artistProfile, loading: authLoading } = useAuth();

  const [loading, setLoading] = useState(true);
  const [song, setSong] = useState<MarketplaceSong | null>(null);
  const [allGenres, setAllGenres] = useState<Genre[]>([]);

  // Form Fields
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [musicType, setMusicType] = useState<'gospel' | 'secular'>('gospel');
  const [genreId, setGenreId] = useState('');
  const [language, setLanguage] = useState('Kinyarwanda');
  const [status, setStatus] = useState<MarketplaceSongStatus>('published');

  // Preview timestamps
  const [previewStart, setPreviewStart] = useState<number>(0);
  const [previewEnd, setPreviewEnd] = useState<number>(30);

  // Audio track state
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [audioFilePath, setAudioFilePath] = useState('');
  const [localAudioPreviewUrl, setLocalAudioPreviewUrl] = useState('');
  const [audioFileName, setAudioFileName] = useState('');
  const [isUploadingAudio, setIsUploadingAudio] = useState(false);
  const [storageProvider, setStorageProvider] = useState<'google_drive' | 'supabase' | null>(null);
  const [storageNote, setStorageNote] = useState<string | null>(null);

  // Cover image state
  const [coverImageUrl, setCoverImageUrl] = useState('');
  const [localCoverPreviewUrl, setLocalCoverPreviewUrl] = useState('');
  const [isUploadingCover, setIsUploadingCover] = useState(false);

  // Pricing & Lyrics
  const [lyrics, setLyrics] = useState('');
  const [price, setPrice] = useState<number>(1000);

  // UI States
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Audio Playback
  const [isPlaying, setIsPlaying] = useState(false);
  const [audioElement, setAudioElement] = useState<HTMLAudioElement | null>(null);

  // Cleanup audio & object URLs
  useEffect(() => {
    return () => {
      if (audioElement) {
        audioElement.pause();
        audioElement.src = '';
      }
      if (localAudioPreviewUrl) {
        URL.revokeObjectURL(localAudioPreviewUrl);
      }
      if (localCoverPreviewUrl) {
        URL.revokeObjectURL(localCoverPreviewUrl);
      }
    };
  }, [audioElement, localAudioPreviewUrl, localCoverPreviewUrl]);

  // Load song & genres
  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      router.push(`/login?redirect=/artist/songs/${songId}/edit`);
      return;
    }
    if (!artistProfile) {
      router.push('/onboarding/artist');
      return;
    }

    async function loadData() {
      setLoading(true);
      try {
        const [songData, genresData] = await Promise.all([
          marketplaceService.getMarketplaceSongById(songId, user?.id),
          marketplaceService.getGenres(),
        ]);

        if (!songData) {
          setError('Song not found.');
          setLoading(false);
          return;
        }

        // Authorization check: Must be artist owner or super admin
        const isOwner = songData.artist_id === artistProfile?.id || (songData.artist && songData.artist.user_id === user?.id);
        const isSuperAdmin = user?.is_super_admin === true;

        if (!isOwner && !isSuperAdmin) {
          setError('Unauthorized: You do not have permission to edit this song.');
          setLoading(false);
          return;
        }

        setSong(songData);
        setAllGenres(genresData);

        // Prepopulate form values
        setTitle(songData.title || '');
        setDescription(songData.description || '');
        setMusicType(songData.music_type || 'gospel');
        setGenreId(songData.genre_id || (genresData.length > 0 ? genresData[0].id : ''));
        setLanguage(songData.language || 'Kinyarwanda');
        setStatus(songData.status || 'published');
        setPreviewStart(songData.preview_start_time ?? 0);
        setPreviewEnd(songData.preview_end_time ?? 30);
        setAudioFilePath(songData.audio_file_path || '');
        setCoverImageUrl(songData.cover_image_url || '');
        setLyrics(songData.lyrics || '');
        setPrice(songData.price ?? 1000);
      } catch (err: any) {
        console.error('Error loading song for edit:', err);
        setError(err.message || 'Failed to load song details.');
      } finally {
        setLoading(false);
      }
    }

    if (songId && artistProfile) {
      loadData();
    }
  }, [songId, user, artistProfile, authLoading, router]);

  // Audio Playback Tester
  const toggleTestPlayback = () => {
    const streamSrc = localAudioPreviewUrl || audioFilePath;
    if (!streamSrc) return;

    if (isPlaying && audioElement) {
      audioElement.pause();
      setIsPlaying(false);
      return;
    }

    try {
      if (audioElement) {
        audioElement.pause();
      }
      const audio = new Audio(streamSrc);
      audio.currentTime = previewStart;
      audio.play().then(() => {
        setIsPlaying(true);
      }).catch((e) => {
        console.warn('Playback error:', e);
        setIsPlaying(false);
      });

      audio.ontimeupdate = () => {
        if (audio.currentTime >= previewEnd) {
          audio.pause();
          audio.currentTime = previewStart;
          setIsPlaying(false);
        }
      };

      audio.onended = () => {
        setIsPlaying(false);
      };

      setAudioElement(audio);
    } catch (e) {
      console.warn('Audio player initialization error:', e);
      setIsPlaying(false);
    }
  };

  // Replace Audio File with 3-tier upload
  const handleAudioSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !artistProfile) return;

    if (audioElement) {
      audioElement.pause();
      setIsPlaying(false);
    }

    setAudioFile(file);
    setAudioFileName(file.name);
    setIsUploadingAudio(true);
    setError(null);
    setStorageNote(null);

    const localBlobUrl = URL.createObjectURL(file);
    setLocalAudioPreviewUrl(localBlobUrl);

    try {
      const audio = new Audio();
      audio.src = localBlobUrl;
      audio.onloadedmetadata = () => {
        if (audio && typeof audio.duration === 'number' && !isNaN(audio.duration) && isFinite(audio.duration)) {
          const dur = Math.round(audio.duration);
          if (dur > 0 && previewEnd === 30) {
            setPreviewEnd(Math.min(dur, 30));
          }
        }
      };
    } catch (e) {
      console.warn('Audio metadata error:', e);
    }

    try {
      const fileExt = file.name.split('.').pop() || 'mp3';
      const cleanFileName = `marketplace/${artistProfile.id}/${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;

      let uploadedUrl: string | null = null;
      let usedProvider: 'google_drive' | 'supabase' = 'supabase';

      // Tier 1: Try Resumable Google Drive Upload
      try {
        const initRes = await fetch('/api/upload', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'init_drive_upload',
            fileName: file.name,
            mimeType: file.type || 'audio/mpeg',
            fileSize: file.size,
          }),
        });

        if (initRes.ok) {
          const initData = await initRes.json();
          if (initData.success && initData.resumableUploadUrl) {
            const drivePutRes = await fetch(initData.resumableUploadUrl, {
              method: 'PUT',
              headers: { 'Content-Type': file.type || 'application/octet-stream' },
              body: file,
            });

            if (drivePutRes.ok) {
              const driveFileData = await drivePutRes.json().catch(() => ({}));
              if (driveFileData?.id) {
                const finRes = await fetch('/api/upload', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                    action: 'finalize_drive_upload',
                    fileId: driveFileData.id,
                    accountEmail: initData.accountEmail,
                    fileSizeMb: file.size / (1024 * 1024),
                  }),
                });
                if (finRes.ok) {
                  const finData = await finRes.json().catch(() => ({}));
                  if (finData?.url) {
                    uploadedUrl = finData.url;
                    usedProvider = 'google_drive';
                  }
                }
              }
            } else {
              setStorageNote('Google Drive limit reached. Routing to Voxify Cloud Storage.');
            }
          }
        }
      } catch (driveErr) {
        console.warn('Google Drive upload attempt note:', driveErr);
      }

      // Tier 2: Signed Supabase Upload URL
      if (!uploadedUrl) {
        try {
          const signRes = await fetch('/api/upload', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              action: 'init_signed_upload',
              fileName: cleanFileName,
              bucket: 'song-audio',
            }),
          });

          if (signRes.ok) {
            const signData = await signRes.json();
            if (signData.success && signData.token) {
              const supabase = createClient();
              const { data: uploadData, error: uploadErr } = await supabase.storage
                .from('song-audio')
                .uploadToSignedUrl(cleanFileName, signData.token, file);

              if (!uploadErr && uploadData) {
                uploadedUrl = signData.publicUrl || supabase.storage.from('song-audio').getPublicUrl(cleanFileName).data.publicUrl;
                usedProvider = 'supabase';
              }
            }
          }
        } catch (signUploadErr) {
          console.warn('Signed Supabase upload note:', signUploadErr);
        }
      }

      // Tier 3: Server fallback
      if (!uploadedUrl && file.size < 4.5 * 1024 * 1024) {
        try {
          const formData = new FormData();
          formData.append('file', file);
          formData.append('bucket', 'song-audio');
          formData.append('choirId', artistProfile.id);

          const res = await fetch('/api/upload', {
            method: 'POST',
            body: formData,
          });

          if (res.ok) {
            const resData = await res.json().catch(() => ({}));
            if (resData?.url && !resData.url.startsWith('blob:')) {
              uploadedUrl = resData.url;
              usedProvider = resData.provider === 'google_drive' ? 'google_drive' : 'supabase';
            }
          }
        } catch (serverUploadErr) {
          console.warn('Server fallback upload error:', serverUploadErr);
        }
      }

      if (uploadedUrl) {
        setAudioFilePath(uploadedUrl);
        setStorageProvider(usedProvider);
        setError(null);
      } else {
        setError('Failed to upload new audio file to permanent storage. Please try again.');
      }
    } catch (err: any) {
      console.error('Audio upload error:', err);
      setError(err.message || 'Server error uploading audio file.');
    } finally {
      setIsUploadingAudio(false);
    }
  };

  // Replace Cover Artwork
  const handleCoverSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !artistProfile) return;

    setIsUploadingCover(true);
    setError(null);

    const localBlobUrl = URL.createObjectURL(file);
    setLocalCoverPreviewUrl(localBlobUrl);

    try {
      const fileExt = file.name.split('.').pop() || 'jpg';
      const cleanFileName = `covers/${artistProfile.id}/${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;

      try {
        const signRes = await fetch('/api/upload', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'init_signed_upload',
            fileName: cleanFileName,
            bucket: 'song-audio',
          }),
        });

        if (signRes.ok) {
          const signData = await signRes.json();
          if (signData.success && signData.token) {
            const supabase = createClient();
            const { data, error: uploadErr } = await supabase.storage
              .from('song-audio')
              .uploadToSignedUrl(cleanFileName, signData.token, file);

            if (!uploadErr && data) {
              const finalCover = signData.publicUrl || supabase.storage.from('song-audio').getPublicUrl(cleanFileName).data.publicUrl;
              setCoverImageUrl(finalCover);
              setIsUploadingCover(false);
              return;
            }
          }
        }
      } catch (signErr) {
        console.warn('Signed cover upload note:', signErr);
      }

      // Server fallback
      const formData = new FormData();
      formData.append('file', file);
      formData.append('bucket', 'song-audio');
      formData.append('choirId', artistProfile.id);

      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      if (res.ok) {
        const resData = await res.json().catch(() => ({}));
        if (resData?.url && !resData.url.startsWith('blob:')) {
          setCoverImageUrl(resData.url);
        }
      }
    } catch (coverErr) {
      console.warn('Cover upload error:', coverErr);
    } finally {
      setIsUploadingCover(false);
    }
  };

  // Submit edits
  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!song) return;

    if (!title.trim()) {
      setError('Song title is required.');
      return;
    }

    if (isUploadingAudio || isUploadingCover) {
      setError('Please wait for file uploads to finish before saving.');
      return;
    }

    if (!audioFilePath.trim() || audioFilePath.startsWith('blob:')) {
      setError('Audio track file must be stored in permanent storage.');
      return;
    }

    setSaving(true);
    setError(null);
    setSaveSuccess(false);

    try {
      const selectedGenre = allGenres.find(g => g.id === genreId);
      const validCover = (coverImageUrl && !coverImageUrl.startsWith('blob:')) ? coverImageUrl.trim() : '';
      const finalCoverUrl = validCover || generateSongCover({
        title: title.trim(),
        artistName: song.artist?.stage_name || artistProfile?.stage_name || 'Artist',
        genre: selectedGenre?.name || musicType,
      });

      const updated = await marketplaceService.updateMarketplaceSong(song.id, {
        title: title.trim(),
        description: description.trim(),
        genre_id: genreId || undefined,
        music_type: musicType,
        language: language.trim(),
        audio_file_path: audioFilePath.trim(),
        preview_start_time: Number(previewStart) || 0,
        preview_end_time: Number(previewEnd) || 30,
        cover_image_url: finalCoverUrl,
        lyrics: lyrics.trim(),
        price: Number(price) || 1000,
        currency: 'RWF',
        status: status,
      });

      setSong(updated);
      setCoverImageUrl(finalCoverUrl);
      setSaveSuccess(true);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err: any) {
      console.error('Failed to update song:', err);
      setError(err.message || 'Failed to update song details.');
    } finally {
      setSaving(false);
    }
  };

  if (authLoading || loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-8 h-8 border-4 border-amber-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (error && !song) {
    return (
      <div className="max-w-2xl mx-auto my-12 p-8 bg-white border border-rose-200 rounded-3xl text-center space-y-4 shadow-sm">
        <AlertCircle className="w-12 h-12 text-rose-500 mx-auto" />
        <h2 className="text-xl font-black text-slate-900">Unable to Load Song</h2>
        <p className="text-sm text-slate-600 font-medium">{error}</p>
        <Link
          href="/artist/dashboard"
          className="inline-flex items-center gap-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold px-5 py-2.5 rounded-xl text-sm transition-all"
        >
          Return to Artist Dashboard &rarr;
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6 my-6">
      <div className="flex items-center justify-between">
        <BackButton href="/artist/dashboard" label="Back to Artist Dashboard" />
        {song && (
          <Link
            href={`/songs/marketplace/${song.id}`}
            className="inline-flex items-center gap-1.5 text-xs font-bold text-amber-700 hover:text-amber-800 bg-amber-50 border border-amber-200 px-3 py-1.5 rounded-xl transition-colors"
          >
            <Eye className="w-3.5 h-3.5" /> View on Marketplace &rarr;
          </Link>
        )}
      </div>

      <div className="bg-white border border-slate-200 p-6 sm:p-8 rounded-3xl space-y-6 shadow-sm">
        
        {/* Header */}
        <div className="space-y-2 border-b border-slate-200 pb-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 text-amber-700 border border-amber-500/30 text-xs font-black uppercase tracking-wider">
            <Sparkles className="w-3.5 h-3.5 text-amber-600" /> Song Editor
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            Edit Song: <span className="text-amber-600">{song?.title || 'Track'}</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-600">
            Update song name, lyrics, marketplace price, audio preview timestamps, artwork, or upload an updated audio mix.
          </p>
        </div>

        {/* Feedback Alerts */}
        {saveSuccess && (
          <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm flex items-center justify-between gap-3 shadow-xs">
            <div className="flex items-center gap-2.5">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
              <span className="font-bold">Song details saved successfully! All updates are live.</span>
            </div>
            <Link
              href={`/songs/marketplace/${song?.id}`}
              className="text-xs font-black text-emerald-700 underline hover:text-emerald-800 shrink-0"
            >
              Preview Page &rarr;
            </Link>
          </div>
        )}

        {error && (
          <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-sm flex items-center gap-3">
            <AlertCircle className="w-5 h-5 shrink-0 text-rose-500" />
            <span className="font-semibold">{error}</span>
          </div>
        )}

        <form onSubmit={handleUpdate} className="space-y-6">
          
          {/* Section 1: Audio Track & Playback */}
          <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-black text-amber-700 uppercase tracking-wider flex items-center gap-2">
                <UploadCloud className="w-4 h-4 text-amber-600" /> 1. Audio Track File &amp; Replacement
              </h2>
              {audioFilePath && (
                <span className="text-[11px] font-bold text-emerald-700 bg-emerald-100 px-2.5 py-0.5 rounded-full border border-emerald-200 flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Audio Track Attached
                </span>
              )}
            </div>

            {/* Current / Test Audio Playback */}
            {(localAudioPreviewUrl || audioFilePath) && (
              <div className="bg-white p-4 rounded-xl border border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-sm">
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={toggleTestPlayback}
                    className="w-10 h-10 rounded-full bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold flex items-center justify-center shadow-md transition-all cursor-pointer shrink-0"
                    title="Play Preview Snippet"
                  >
                    {isPlaying ? <Pause className="w-5 h-5 fill-current" /> : <Play className="w-5 h-5 fill-current ml-0.5" />}
                  </button>
                  <div>
                    <span className="text-xs font-bold text-slate-900 block">
                      {isPlaying ? '▶ Playing Track Snippet...' : 'Listen to Audio Track'}
                    </span>
                    <span className="text-[11px] text-slate-500 font-medium">
                      Snippet preview: {previewStart}s &ndash; {previewEnd}s
                    </span>
                  </div>
                </div>

                <audio controls src={localAudioPreviewUrl || audioFilePath} className="w-full sm:w-64 h-9 rounded-lg" />
              </div>
            )}

            {/* Replace Audio File Option */}
            <div className="border-2 border-dashed border-slate-300 hover:border-amber-500 rounded-2xl p-5 text-center transition-all bg-white hover:bg-amber-50/20">
              <input
                type="file"
                accept="audio/*"
                onChange={handleAudioSelect}
                className="hidden"
                id="edit-audio-upload-input"
              />
              <label htmlFor="edit-audio-upload-input" className="cursor-pointer space-y-1.5 block">
                <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-600 border border-amber-500/30 flex items-center justify-center mx-auto">
                  {isUploadingAudio ? (
                    <Loader2 className="w-5 h-5 animate-spin text-amber-600" />
                  ) : (
                    <Music className="w-5 h-5" />
                  )}
                </div>
                <div className="text-sm font-bold text-slate-900">
                  {isUploadingAudio
                    ? `Uploading "${audioFileName}" to Cloud Storage...`
                    : audioFileName
                    ? `New File Ready: ${audioFileName} ✅`
                    : 'Click to replace audio file (MP3, WAV, M4A)'}
                </div>
                <p className="text-xs text-slate-500">
                  Leave unchanged to keep your current track, or select a new file to update the audio recording.
                </p>
              </label>
            </div>
          </div>

          {/* Section 2: Audio Preview Clip Timestamps */}
          <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200 space-y-4">
            <h2 className="text-sm font-black text-amber-700 uppercase tracking-wider flex items-center gap-2">
              <Clock className="w-4 h-4 text-amber-600" /> 2. Audio Preview Snippet Timestamps
            </h2>
            <p className="text-xs text-slate-600">
              Non-purchasing listeners can only preview this snippet range. Full track permanently unlocks once purchased.
            </p>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1.5">Preview Start (Seconds)</label>
                <input
                  type="number"
                  min={0}
                  value={previewStart}
                  onChange={e => setPreviewStart(Number(e.target.value))}
                  className="w-full bg-white border border-slate-300 rounded-xl px-4 py-2.5 text-sm text-slate-900 font-mono font-bold focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all shadow-xs"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1.5">Preview End (Seconds)</label>
                <input
                  type="number"
                  min={previewStart + 5}
                  value={previewEnd}
                  onChange={e => setPreviewEnd(Number(e.target.value))}
                  className="w-full bg-white border border-slate-300 rounded-xl px-4 py-2.5 text-sm text-slate-900 font-mono font-bold focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all shadow-xs"
                />
              </div>
            </div>
            <div className="text-xs text-amber-900 font-bold bg-amber-100/70 p-3 rounded-xl border border-amber-200">
              Current Preview Duration: {Math.max(0, previewEnd - previewStart)} seconds clip for non-purchasers
            </div>
          </div>

          {/* Section 3: Song Metadata, Pricing, Cover Art */}
          <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200 space-y-4">
            <h2 className="text-sm font-black text-amber-700 uppercase tracking-wider flex items-center gap-2">
              <Music className="w-4 h-4 text-amber-600" /> 3. Song Details &amp; Marketplace Settings
            </h2>

            {/* Title */}
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1.5">Song Title / Name *</label>
              <input
                type="text"
                required
                value={title}
                onChange={e => setTitle(e.target.value)}
                placeholder="e.g. Nitaubeba, Malaika"
                className="w-full bg-white border border-slate-300 rounded-xl px-4 py-3 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all font-medium shadow-xs"
              />
            </div>

            {/* Category & Genre */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1.5">Category</label>
                <select
                  value={musicType}
                  onChange={e => setMusicType(e.target.value as any)}
                  className="w-full bg-white border border-slate-300 rounded-xl px-4 py-2.5 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all font-medium shadow-xs"
                >
                  <option value="gospel">Gospel Music</option>
                  <option value="secular">Secular / Cultural</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1.5">Genre</label>
                <select
                  value={genreId}
                  onChange={e => setGenreId(e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded-xl px-4 py-2.5 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all font-medium shadow-xs"
                >
                  {allGenres.map(g => (
                    <option key={g.id} value={g.id}>
                      {g.name} {g.is_local ? '(Rwandan Local)' : ''}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Description & Credits */}
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1.5">Song Description &amp; Credits</label>
              <textarea
                rows={3}
                value={description}
                onChange={e => setDescription(e.target.value)}
                placeholder="Composer, instruments, arrangement details, producer..."
                className="w-full bg-white border border-slate-300 rounded-xl px-4 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 resize-none font-medium shadow-xs"
              />
            </div>

            {/* Cover Art & Price */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1.5">Cover Artwork</label>
                <div className="flex flex-col gap-2">
                  <div className="flex items-center gap-3">
                    {coverImageUrl && (
                      <div className="w-12 h-12 rounded-xl overflow-hidden shrink-0 border border-slate-300 shadow-xs">
                        <img src={coverImageUrl} alt="Current Cover" className="w-full h-full object-cover" />
                      </div>
                    )}
                    <label className="flex-1 flex items-center gap-2 bg-white border border-slate-300 hover:border-amber-500 rounded-xl px-3 py-2.5 cursor-pointer transition-colors text-xs text-slate-700 font-semibold shadow-xs">
                      <ImageIcon className="w-4 h-4 text-amber-600 shrink-0" />
                      <span className="truncate">
                        {isUploadingCover ? 'Uploading...' : 'Pick New Cover File'}
                      </span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleCoverSelect}
                        className="hidden"
                      />
                    </label>
                  </div>

                  <input
                    type="url"
                    value={coverImageUrl}
                    onChange={e => setCoverImageUrl(e.target.value)}
                    placeholder="Or paste cover image URL..."
                    className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 font-medium shadow-xs"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1.5">Song Price (RWF) *</label>
                <input
                  type="number"
                  min={100}
                  step={100}
                  required
                  value={price}
                  onChange={e => setPrice(Number(e.target.value))}
                  placeholder="1000"
                  className="w-full bg-white border border-slate-300 rounded-xl px-4 py-3 text-sm text-slate-900 font-mono font-bold focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 shadow-xs"
                />
                <p className="text-[11px] text-slate-500 font-medium mt-1">
                  Price paid once per buyer for lifetime streaming &amp; MP3 download.
                </p>
              </div>
            </div>

            {/* Publication Status */}
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1.5">Visibility / Publication Status</label>
              <select
                value={status}
                onChange={e => setStatus(e.target.value as MarketplaceSongStatus)}
                className="w-full bg-white border border-slate-300 rounded-xl px-4 py-2.5 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all font-medium shadow-xs"
              >
                <option value="published">Published (Visible in Marketplace)</option>
                <option value="draft">Draft (Hidden from Marketplace)</option>
                <option value="archived">Archived</option>
              </select>
            </div>

            {/* Lyrics Section */}
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1.5">Full Song Lyrics</label>
              <textarea
                rows={8}
                value={lyrics}
                onChange={e => setLyrics(e.target.value)}
                placeholder="Paste song lyrics here... (Full lyrics unlock for buyers)"
                className="w-full bg-white border border-slate-300 rounded-xl px-4 py-3 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 resize-none font-sans shadow-xs"
              />
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row items-center gap-3">
            <button
              type="submit"
              disabled={saving || isUploadingAudio || isUploadingCover}
              className="w-full sm:flex-1 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black py-4 rounded-2xl shadow-xl shadow-amber-500/20 transition-all flex items-center justify-center gap-2 text-base cursor-pointer disabled:opacity-50"
            >
              {saving ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" /> Saving Changes...
                </>
              ) : (
                <>
                  <Save className="w-5 h-5" /> Save Changes
                </>
              )}
            </button>

            <Link
              href="/artist/dashboard"
              className="w-full sm:w-auto px-6 py-4 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-sm text-center transition-colors"
            >
              Cancel
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}
