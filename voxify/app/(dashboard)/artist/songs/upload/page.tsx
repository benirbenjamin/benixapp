'use client';

import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/context/AuthContext';
import { marketplaceService } from '@/lib/services/marketplaceService';
import { notificationService } from '@/lib/services/notificationService';
import { Genre, MusicTypeCategory } from '@/lib/types/database.types';
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
  Volume2,
  ShieldCheck
} from 'lucide-react';

export default function SongUploadPage() {
  const router = useRouter();
  const { user, artistProfile, loading: authLoading } = useAuth();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [musicType, setMusicType] = useState<'gospel' | 'secular'>('gospel');
  const [genreId, setGenreId] = useState('');
  const [allGenres, setAllGenres] = useState<Genre[]>([]);
  const [language, setLanguage] = useState('Kinyarwanda');

  // Preview timestamps
  const [previewStart, setPreviewStart] = useState<number>(0);
  const [previewEnd, setPreviewEnd] = useState<number>(30);

  // Storage paths / URL inputs
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [audioFilePath, setAudioFilePath] = useState('');
  const [localAudioPreviewUrl, setLocalAudioPreviewUrl] = useState('');
  const [audioFileName, setAudioFileName] = useState('');
  const [isUploadingAudio, setIsUploadingAudio] = useState(false);

  const [coverImageUrl, setCoverImageUrl] = useState('');
  const [localCoverPreviewUrl, setLocalCoverPreviewUrl] = useState('');
  const [isUploadingCover, setIsUploadingCover] = useState(false);

  const [lyrics, setLyrics] = useState('');
  const [price, setPrice] = useState<number>(1000);

  const [publishing, setPublishing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Live Audio Player Preview State
  const [isPlaying, setIsPlaying] = useState(false);
  const [audioElement, setAudioElement] = useState<HTMLAudioElement | null>(null);
  const [storageProvider, setStorageProvider] = useState<'google_drive' | 'supabase' | null>(null);
  const [storageNote, setStorageNote] = useState<string | null>(null);

  // Clean up audio playback & object URLs on unmount
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

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      router.push('/login');
      return;
    }
    if (!artistProfile) {
      router.push('/onboarding/artist');
      return;
    }

    async function fetchGenres() {
      const g = await marketplaceService.getGenres();
      setAllGenres(g);
      if (g.length > 0) setGenreId(g[0].id);
    }
    fetchGenres();
  }, [user, artistProfile, authLoading, router]);

  // Immediate Audio File Upload on Selection with Instant Local Playback Preview
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
    setAudioFilePath(''); // Clear previous permanent path while uploading

    // Create immediate local object URL for instant preview testing
    const localBlobUrl = URL.createObjectURL(file);
    setLocalAudioPreviewUrl(localBlobUrl);

    // Calculate audio duration safely for preview clip default
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
      audio.onerror = () => {
        console.warn('Could not read audio metadata from local preview');
      };
    } catch (e) {
      console.warn('Audio metadata load notice:', e);
    }

    try {
      const fileExt = file.name.split('.').pop() || 'mp3';
      const cleanFileName = `marketplace/${artistProfile.id}/${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;

      let uploadedUrl: string | null = null;
      let usedProvider: 'google_drive' | 'supabase' = 'supabase';

      // Tier 1: Try Resumable Google Drive Upload (Bypasses Vercel 4.5MB limit) using AXIOS
      try {
        const initRes = await axios.post('/api/upload', {
          action: 'init_drive_upload',
          fileName: file.name,
          mimeType: file.type || 'audio/mpeg',
          fileSize: file.size,
        });

        const initData = initRes.data;
        if (initData?.success && initData?.resumableUploadUrl) {
          // Upload directly to Google Drive via PUT using AXIOS
          const drivePutRes = await axios.put(initData.resumableUploadUrl, file, {
            headers: {
              'Content-Type': file.type || 'application/octet-stream',
            },
          });

          if (drivePutRes.status >= 200 && drivePutRes.status < 300) {
            const driveFileData = drivePutRes.data || {};
            if (driveFileData?.id) {
              // Finalize upload & get stream url
              const finRes = await axios.post('/api/upload', {
                action: 'finalize_drive_upload',
                fileId: driveFileData.id,
                accountEmail: initData.accountEmail,
                fileSizeMb: file.size / (1024 * 1024),
              });
              const finData = finRes.data || {};
              if (finData?.url) {
                uploadedUrl = finData.url;
                usedProvider = 'google_drive';
              }
            }
          } else {
            console.warn('Google Drive direct PUT rejected. Routing to Voxify Cloud Storage...');
            setStorageNote('Google Drive account quota limit detected. Saving securely to Voxify Cloud Storage.');
          }
        }
      } catch (driveErr) {
        console.warn('Google Drive upload attempt note:', driveErr);
      }

      // Tier 2: Signed Supabase Upload URL (Uploads files up to 50MB directly from browser) using AXIOS
      if (!uploadedUrl) {
        try {
          const signRes = await axios.post('/api/upload', {
            action: 'init_signed_upload',
            fileName: cleanFileName,
            bucket: 'song-audio',
            fileSizeMb: file.size / (1024 * 1024),
          });

          const signData = signRes.data;
          if (signData?.success && signData?.token) {
            const supabase = createClient();
            const { data: uploadData, error: uploadErr } = await supabase.storage
              .from('song-audio')
              .uploadToSignedUrl(cleanFileName, signData.token, file);

            if (!uploadErr && uploadData) {
              uploadedUrl = signData.publicUrl || supabase.storage.from('song-audio').getPublicUrl(cleanFileName).data.publicUrl;
              usedProvider = 'supabase';
            } else {
              console.warn('Signed Supabase upload error:', uploadErr?.message);
            }
          }
        } catch (signUploadErr) {
          console.warn('Signed Supabase upload attempt note:', signUploadErr);
        }
      }

      // Tier 3: Server /api/upload fallback using AXIOS
      if (!uploadedUrl) {
        try {
          const formData = new FormData();
          formData.append('file', file);
          formData.append('bucket', 'song-audio');
          formData.append('choirId', artistProfile.id);

          const res = await axios.post('/api/upload', formData);
          const resData = res.data;
          if (resData?.url && !resData.url.startsWith('blob:')) {
            uploadedUrl = resData.url;
            usedProvider = resData.provider === 'google_drive' ? 'google_drive' : 'supabase';
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
        setError('Failed to upload audio file to permanent storage. Please try again.');
      }
    } catch (err: any) {
      console.error('Audio upload error:', err);
      setError(err.message || 'Server error uploading audio file.');
    } finally {
      setIsUploadingAudio(false);
    }
  };

  // Immediate Cover Image Upload on Selection using AXIOS
  const handleCoverSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !artistProfile) return;

    setIsUploadingCover(true);
    setError(null);
    setCoverImageUrl(''); // Clear previous permanent path while uploading

    const localBlobUrl = URL.createObjectURL(file);
    setLocalCoverPreviewUrl(localBlobUrl);

    try {
      const fileExt = file.name.split('.').pop() || 'jpg';
      const cleanFileName = `covers/${artistProfile.id}/${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;

      // 1. Try Signed Supabase Upload URL using AXIOS
      try {
        const signRes = await axios.post('/api/upload', {
          action: 'init_signed_upload',
          fileName: cleanFileName,
          bucket: 'song-audio',
          fileSizeMb: file.size / (1024 * 1024),
        });

        const signData = signRes.data;
        if (signData?.success && signData?.token) {
          const supabase = createClient();
          const { data, error: uploadErr } = await supabase.storage
            .from('song-audio')
            .uploadToSignedUrl(cleanFileName, signData.token, file);

          if (!uploadErr && data) {
            const finalCover = signData.publicUrl || supabase.storage.from('song-audio').getPublicUrl(cleanFileName).data.publicUrl;
            setCoverImageUrl(finalCover);
            return;
          }
        }
      } catch (signErr) {
        console.warn('Signed cover upload note:', signErr);
      }

      // 2. Fallback to Server /api/upload using AXIOS
      const formData = new FormData();
      formData.append('file', file);
      formData.append('bucket', 'song-audio');
      formData.append('choirId', artistProfile.id);

      const res = await axios.post('/api/upload', formData);
      const resData = res.data;
      if (resData?.url && !resData.url.startsWith('blob:')) {
        setCoverImageUrl(resData.url);
      }
    } catch (err: any) {
      console.error('Cover upload error:', err);
    } finally {
      setIsUploadingCover(false);
    }
  };

  const toggleTestPlayback = () => {
    const playbackUrl = localAudioPreviewUrl || audioFilePath;
    if (!playbackUrl) return;

    if (isPlaying && audioElement) {
      audioElement.pause();
      setIsPlaying(false);
      return;
    }

    if (audioElement) {
      audioElement.pause();
    }

    try {
      const audio = new Audio(playbackUrl);
      audio.onerror = () => {
        console.warn('Audio playback error on test player');
        setIsPlaying(false);
      };
      audio.onended = () => setIsPlaying(false);
      audio.play().then(() => {
        setIsPlaying(true);
      }).catch(e => {
        console.warn('Could not start playback:', e);
        setIsPlaying(false);
      });
      setAudioElement(audio);
    } catch (e) {
      console.warn('Audio player initialization error:', e);
      setIsPlaying(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!artistProfile) return;

    if (!title.trim()) {
      setError('Song title is required.');
      return;
    }

    if (isUploadingAudio || isUploadingCover) {
      setError('Please wait a moment while your audio and cover files finish uploading to storage...');
      return;
    }

    if (!audioFilePath.trim() || audioFilePath.startsWith('blob:')) {
      setError('Audio track file has not been uploaded to permanent storage. Please re-select your audio file to upload.');
      return;
    }

    setPublishing(true);
    setError(null);

    try {
      const selectedGenre = allGenres.find(g => g.id === genreId);
      const validCover = (coverImageUrl && !coverImageUrl.startsWith('blob:')) ? coverImageUrl.trim() : '';
      const finalCoverUrl = validCover || generateSongCover({
        title: title.trim(),
        artistName: artistProfile.stage_name,
        genre: selectedGenre?.name || musicType,
      });

      await marketplaceService.createMarketplaceSong(artistProfile.id, {
        title: title.trim(),
        description: description.trim(),
        genre_id: genreId || undefined,
        music_type: musicType,
        language: language.trim(),
        audio_file_path: audioFilePath.trim(),
        preview_start_time: Number(previewStart) || 0,
        preview_end_time: Number(previewEnd) || 30,
        cover_image_url: finalCoverUrl,
        lyrics: lyrics.trim() || undefined,
        price: Number(price) || 1000,
        currency: 'RWF',
        status: 'published',
      });

      // Send In-App Notification to artist
      try {
        if (user?.id) {
          await notificationService.notifyUser(user.id, {
            title: 'Song Published Live! 🎶',
            message: `"${title.trim()}" has been published to the Voxify Marketplace for ${Number(price || 1000).toLocaleString()} RWF.`,
            type: 'song_published',
            link: '/artist/dashboard',
            priority: 'normal',
          });
        }
      } catch (notifErr) {
        console.warn('Song published notification note:', notifErr);
      }

      router.push('/artist/dashboard');
    } catch (err: any) {
      setError(err.message || 'Failed to publish song.');
      setPublishing(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6 my-6">
      <BackButton href="/artist/dashboard" label="Back to Artist Dashboard" />
      <div className="bg-white border border-slate-200 p-6 sm:p-8 rounded-3xl space-y-6 shadow-sm">
        
        {/* Header */}
        <div className="space-y-2 border-b border-slate-200 pb-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 text-amber-700 border border-amber-500/30 text-xs font-black uppercase tracking-wider">
            <Sparkles className="w-3.5 h-3.5 text-amber-600" /> Music Marketplace Publisher
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">Upload &amp; Publish New Song</h1>
          <p className="text-xs sm:text-sm text-slate-600">
            Select your track for instant upload, test audio playback, set preview clip timestamps, cover art, and pricing.
          </p>
        </div>

        {error && (
          <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-sm flex items-center gap-3">
            <AlertCircle className="w-5 h-5 shrink-0 text-rose-500" />
            <span className="font-semibold">{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          
          {/* Section 1: Immediate Audio Track Upload & Playback Test */}
          <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200 space-y-4">
            <h2 className="text-sm font-black text-amber-700 uppercase tracking-wider flex items-center gap-2">
              <UploadCloud className="w-4 h-4 text-amber-600" /> 1. Audio Track File (Instant Upload &amp; Playback)
            </h2>

            <div className="border-2 border-dashed border-slate-300 hover:border-amber-500 rounded-2xl p-6 text-center transition-all bg-white hover:bg-amber-50/20">
              <input
                type="file"
                accept="audio/*"
                onChange={handleAudioSelect}
                className="hidden"
                id="audio-upload-input"
              />
              <label htmlFor="audio-upload-input" className="cursor-pointer space-y-2 block">
                <div className="w-12 h-12 rounded-2xl bg-amber-500/10 text-amber-600 border border-amber-500/30 flex items-center justify-center mx-auto">
                  {isUploadingAudio ? (
                    <Loader2 className="w-6 h-6 animate-spin text-amber-600" />
                  ) : (
                    <Music className="w-6 h-6" />
                  )}
                </div>
                <div className="text-sm font-bold text-slate-900">
                  {isUploadingAudio
                    ? `Uploading "${audioFileName}" to Cloud Storage...`
                    : audioFilePath
                    ? `Selected: ${audioFileName} (Storage Uploaded ✅)`
                    : audioFileName
                    ? `Selected: ${audioFileName} (Upload failed - please click to re-select)`
                    : 'Click to select audio file from device (MP3, WAV, M4A)'}
                </div>
                <p className="text-xs text-slate-500">
                  Selecting a file uploads it directly so you can test audio playback before publishing.
                </p>
              </label>
            </div>

            {/* Live Audio Playback Verification Bar */}
            {(localAudioPreviewUrl || audioFilePath) && (
              <div className="bg-white p-4 rounded-xl border border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-sm">
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={toggleTestPlayback}
                    className="w-10 h-10 rounded-full bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold flex items-center justify-center shadow-md transition-all cursor-pointer shrink-0"
                  >
                    {isPlaying ? <Pause className="w-5 h-5 fill-current" /> : <Play className="w-5 h-5 fill-current ml-0.5" />}
                  </button>
                  <div>
                    <span className="text-xs font-bold text-slate-900 block">
                      {isPlaying ? '▶ Playing Track Preview...' : 'Test Audio Track Playback'}
                    </span>
                    <div className="flex flex-col gap-0.5">
                      <span className={`text-[11px] font-bold flex items-center gap-1 ${audioFilePath ? 'text-emerald-700' : 'text-amber-700'}`}>
                        {audioFilePath ? (
                          <>
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                            {storageProvider === 'google_drive'
                              ? 'Google Drive Storage Pool Ready ✅'
                              : 'Voxify Cloud Storage Ready ✅'}
                          </>
                        ) : (
                          <>
                            <Loader2 className="w-3 h-3 animate-spin text-amber-600" /> Uploading to Storage in background...
                          </>
                        )}
                      </span>
                      {storageNote && (
                        <span className="text-[10px] text-amber-800 font-semibold">
                          ℹ️ {storageNote}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <audio controls src={localAudioPreviewUrl || audioFilePath} className="w-full sm:w-64 h-9 rounded-lg" />
              </div>
            )}
          </div>

          {/* Section 2: Audio Preview Clip Timestamps */}
          <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200 space-y-4">
            <h2 className="text-sm font-black text-amber-700 uppercase tracking-wider flex items-center gap-2">
              <Clock className="w-4 h-4 text-amber-600" /> 2. Audio Preview Clip Timestamps (Start to End)
            </h2>
            <p className="text-xs text-slate-600">
              Non-purchasers will only be able to listen to this snippet. Full track unlocks permanently upon purchase.
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
              Preview Duration: {Math.max(0, previewEnd - previewStart)} seconds clip for non-purchasers
            </div>
          </div>

          {/* Section 3: Song Metadata & Cover Art */}
          <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200 space-y-4">
            <h2 className="text-sm font-black text-amber-700 uppercase tracking-wider flex items-center gap-2">
              <Music className="w-4 h-4 text-amber-600" /> 3. Song Details &amp; Cover Art
            </h2>

            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1.5">Song Title *</label>
              <input
                type="text"
                required
                value={title}
                onChange={e => setTitle(e.target.value)}
                placeholder="e.g. Nitaubeba, Malaika"
                className="w-full bg-white border border-slate-300 rounded-xl px-4 py-3 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all font-medium shadow-xs"
              />
            </div>

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

            {/* Cover Image Upload / URL */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1.5">Cover Artwork Image</label>
                <div className="flex flex-col gap-2">
                  <label className="flex items-center gap-2 bg-white border border-slate-300 hover:border-amber-500 rounded-xl px-3 py-2.5 cursor-pointer transition-colors text-xs text-slate-700 font-semibold shadow-xs">
                    <ImageIcon className="w-4 h-4 text-amber-600 shrink-0" />
                    <span className="truncate">
                      {isUploadingCover ? 'Uploading Cover Image...' : coverImageUrl ? 'Cover Attached ✅' : 'Pick Image File (JPG/PNG)'}
                    </span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleCoverSelect}
                      className="hidden"
                    />
                  </label>

                  <input
                    type="url"
                    value={coverImageUrl}
                    onChange={e => setCoverImageUrl(e.target.value)}
                    placeholder="Or paste cover image URL..."
                    className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 font-medium shadow-xs"
                  />
                  <p className="text-[11px] text-purple-700 font-medium">
                    ✨ Optional: Upload your own cover image, or leave empty to automatically generate a custom textured artwork with your song title &amp; genre.
                  </p>
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
              </div>
            </div>

            {/* Multi-Buyer Ownership Notice */}
            <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-900 space-y-1">
              <div className="flex items-center gap-2 text-amber-800 font-black">
                <ShieldCheck className="w-4 h-4 text-amber-600" /> Voxify Marketplace Purchase Model
              </div>
              <p className="text-[11px] text-amber-800/90 font-medium leading-relaxed">
                Any buyer pays the price once to own their permanent copy in their personal library with unlimited streams and MP3 downloads. You earn your commission on every single purchase!
              </p>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1.5">Full Song Lyrics</label>
              <textarea
                rows={6}
                value={lyrics}
                onChange={e => setLyrics(e.target.value)}
                placeholder="Paste song lyrics here... (Full lyrics unlock for buyers)"
                className="w-full bg-white border border-slate-300 rounded-xl px-4 py-3 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 resize-none font-sans shadow-xs"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={publishing || isUploadingAudio || isUploadingCover}
            className="w-full bg-amber-500 hover:bg-amber-400 text-slate-950 font-black py-4 rounded-2xl shadow-xl shadow-amber-500/20 transition-all flex items-center justify-center gap-2 text-base cursor-pointer disabled:opacity-50"
          >
            {isUploadingAudio || isUploadingCover ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" /> Uploading Files to Storage...
              </>
            ) : publishing ? (
              'Publishing Song to Voxify Marketplace...'
            ) : (
              <>
                Publish Song to Voxify Marketplace <ArrowRight className="w-5 h-5" />
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
