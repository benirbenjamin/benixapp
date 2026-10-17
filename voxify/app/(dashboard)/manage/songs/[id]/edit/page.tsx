'use client';

import React, { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { useChoir } from '@/lib/context/ChoirContext';
import { songService } from '@/lib/services/songService';
import { Song, SongPart, VoicePart } from '@/lib/types/database.types';
import {
  ArrowLeft,
  Music,
  Upload,
  Plus,
  Trash2,
  CheckCircle2,
  AlertCircle,
  FileText,
  Loader2,
  FileAudio,
  Save,
  ShieldCheck
} from 'lucide-react';

interface PartDraft {
  id?: string;
  part_name: VoicePart;
  audio_url: string;
  duration_seconds: number;
  isUploading?: boolean;
  fileName?: string;
  uploadError?: string;
}

export default function EditSongPage() {
  const router = useRouter();
  const params = useParams();
  const songId = params?.id as string;

  const { activeChoir, isAdmin } = useChoir();

  const [title, setTitle] = useState('');
  const [composer, setComposer] = useState('');
  const [category, setCategory] = useState('Worship');
  const [difficulty, setDifficulty] = useState<'Easy' | 'Medium' | 'Hard' | 'Advanced'>('Medium');
  const [lyrics, setLyrics] = useState('');
  const [sheetPdfUrl, setSheetPdfUrl] = useState('');
  const [uploadingPdf, setUploadingPdf] = useState(false);
  const [pdfFileName, setPdfFileName] = useState('');
  const [pdfUploadError, setPdfUploadError] = useState<string | null>(null);

  const [parts, setParts] = useState<PartDraft[]>([]);
  const [deletedPartIds, setDeletedPartIds] = useState<string[]>([]);

  const [initialLoading, setInitialLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deletingSong, setDeletingSong] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isAnyUploading = uploadingPdf || parts.some(p => p.isUploading);

  useEffect(() => {
    async function loadSong() {
      if (!songId) return;
      setInitialLoading(true);
      const songData = await songService.getSongById(songId);
      if (songData) {
        setTitle(songData.title || '');
        setComposer(songData.composer || '');
        setCategory(songData.category || 'Worship');
        setDifficulty(songData.difficulty || 'Medium');
        setLyrics(songData.lyrics || '');
        setSheetPdfUrl(songData.sheet_music_pdf_url || '');

        if (songData.parts && songData.parts.length > 0) {
          setParts(
            songData.parts.map(p => ({
              id: p.id,
              part_name: p.part_name,
              audio_url: p.audio_url,
              duration_seconds: p.duration_seconds || 180,
            }))
          );
        } else {
          setParts([
            { part_name: 'Full Mix', audio_url: '', duration_seconds: 180 },
            { part_name: 'Soprano', audio_url: '', duration_seconds: 180 },
            { part_name: 'Alto', audio_url: '', duration_seconds: 180 },
            { part_name: 'Tenor', audio_url: '', duration_seconds: 180 },
            { part_name: 'Bass', audio_url: '', duration_seconds: 180 },
          ]);
        }
      }
      setInitialLoading(false);
    }
    loadSong();
  }, [songId]);

  if (!isAdmin) {
    return (
      <div className="py-20 text-center text-slate-400 space-y-4">
        <ShieldCheck className="w-12 h-12 text-rose-500 mx-auto" />
        <h2 className="text-xl font-bold text-white">Access Restricted</h2>
        <p className="text-xs">You must be a Choir Owner or Admin to edit song details.</p>
      </div>
    );
  }

  const handleAddPart = () => {
    setParts(prev => [...prev, { part_name: 'Custom', audio_url: '', duration_seconds: 180 }]);
  };

  const handlePartChange = (index: number, field: keyof PartDraft, value: any) => {
    setParts(prev => {
      const copy = [...prev];
      copy[index] = { ...copy[index], [field]: value };
      return copy;
    });
  };

  const handleRemovePart = (index: number) => {
    const target = parts[index];
    if (target.id) {
      setDeletedPartIds(prev => [...prev, target.id!]);
    }
    setParts(prev => prev.filter((_, i) => i !== index));
  };

  const getAudioDurationFromFile = (file: File): Promise<number> => {
    return new Promise((resolve) => {
      const audio = new Audio();
      const objectUrl = URL.createObjectURL(file);
      audio.src = objectUrl;
      audio.onloadedmetadata = () => {
        const dur = Math.round(audio.duration);
        URL.revokeObjectURL(objectUrl);
        resolve(dur > 0 ? dur : 180);
      };
      audio.onerror = () => {
        URL.revokeObjectURL(objectUrl);
        resolve(180);
      };
    });
  };

  const handleAudioFileUpload = async (index: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !activeChoir) return;

    handlePartChange(index, 'isUploading', true);
    handlePartChange(index, 'fileName', file.name);
    handlePartChange(index, 'uploadError', undefined);
    setError(null);

    const exactDuration = await getAudioDurationFromFile(file);
    handlePartChange(index, 'duration_seconds', exactDuration);

    const { url, error: uploadErr } = await songService.uploadAudioFile(file, activeChoir.id);
    if (url) {
      handlePartChange(index, 'audio_url', url);
      handlePartChange(index, 'uploadError', undefined);
    } else {
      const errMsg = uploadErr || `Failed to upload '${file.name}'`;
      handlePartChange(index, 'uploadError', errMsg);
      setError(`Audio Upload Error for '${file.name}': ${errMsg}`);
    }

    handlePartChange(index, 'isUploading', false);
  };

  const handlePdfFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !activeChoir) return;

    setUploadingPdf(true);
    setPdfFileName(file.name);
    setPdfUploadError(null);
    setError(null);

    const { url, error: uploadErr } = await songService.uploadPdfFile(file, activeChoir.id);
    if (url) {
      setSheetPdfUrl(url);
      setPdfUploadError(null);
    } else {
      const errMsg = uploadErr || `Failed to upload '${file.name}'`;
      setPdfUploadError(errMsg);
      setError(`PDF Upload Error for '${file.name}': ${errMsg}`);
    }

    setUploadingPdf(false);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeChoir || !songId) return;

    if (isAnyUploading) {
      setError('Please wait until all audio/PDF files finish uploading before saving.');
      return;
    }

    setSaving(true);
    setError(null);

    // 1. Update Song metadata
    const { success, error: updateErr } = await songService.updateSong(songId, {
      title,
      composer,
      category,
      difficulty,
      lyrics,
      sheet_music_pdf_url: sheetPdfUrl.trim() || null,
    });

    if (!success || updateErr) {
      setError(updateErr || 'Failed to update song details');
      setSaving(false);
      return;
    }

    // 2. Delete removed song parts
    for (const partId of deletedPartIds) {
      await songService.deleteSongPart(partId);
    }

    // 3. Upsert / Add song parts
    for (const p of parts) {
      if (p.audio_url.trim()) {
        if (!p.id) {
          await songService.addSongPart({
            song_id: songId,
            part_name: p.part_name,
            audio_url: p.audio_url.trim(),
            duration_seconds: p.duration_seconds || 180,
          });
        }
      }
    }

    router.push(`/songs/${songId}`);
  };

  const handleDeleteSong = async () => {
    if (!confirm(`Are you sure you want to delete "${title}"? This action cannot be undone.`)) return;

    setDeletingSong(true);
    const ok = await songService.deleteSong(songId);
    if (ok) {
      router.push('/songs');
    } else {
      setError('Failed to delete song.');
      setDeletingSong(false);
    }
  };

  if (initialLoading) {
    return <div className="py-20 text-center text-slate-400">Loading song editor...</div>;
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="flex items-center justify-between">
        <Link href={`/songs/${songId}`} className="inline-flex items-center gap-2 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors">
          <ArrowLeft className="w-4 h-4" /> Back to Song Practice Room
        </Link>

        <button
          type="button"
          onClick={handleDeleteSong}
          disabled={deletingSong}
          className="text-xs font-semibold text-rose-600 dark:text-rose-400 hover:text-rose-700 dark:hover:text-rose-300 flex items-center gap-1 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800/40 px-3 py-1.5 rounded-xl transition-all"
        >
          <Trash2 className="w-3.5 h-3.5" /> {deletingSong ? 'Deleting Song...' : 'Delete Song'}
        </button>
      </div>

      <div className="border-b border-slate-200 dark:border-slate-800 pb-4">
        <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white flex items-center gap-3">
          <Music className="w-8 h-8 text-blue-600 dark:text-blue-400" /> Edit Song: {title}
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400">Update song details, replace MP3/WAV voice parts, or attach PDF sheet music</p>
      </div>

      {error && (
        <div className="bg-rose-500/10 border border-rose-500/30 text-rose-700 dark:text-rose-300 p-4 rounded-2xl text-xs flex items-center gap-3 shadow-lg">
          <AlertCircle className="w-5 h-5 text-rose-500 shrink-0" />
          <div className="flex-1">
            <strong className="block text-rose-800 dark:text-rose-200 font-bold mb-0.5">Upload Warning / Action Required:</strong>
            <span>{error}</span>
          </div>
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-8">
        {/* Song Info */}
        <div className="bg-white dark:bg-slate-900 p-6 md:p-8 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-6">
          <h3 className="text-lg font-extrabold text-slate-900 dark:text-white flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-3">
            <Music className="w-5 h-5 text-blue-600 dark:text-blue-400" /> Song Details
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1.5">Song Title *</label>
              <input
                type="text"
                required
                value={title}
                onChange={e => setTitle(e.target.value)}
                placeholder="e.g. Amahoro"
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-2.5 text-sm text-slate-900 dark:text-white focus:outline-none focus:border-blue-500"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1.5">Composer / Arranger</label>
              <input
                type="text"
                value={composer}
                onChange={e => setComposer(e.target.value)}
                placeholder="e.g. Traditional Choir Arrangement"
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-2.5 text-sm text-slate-900 dark:text-white focus:outline-none focus:border-blue-500"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1.5">Category</label>
              <select
                value={category}
                onChange={e => setCategory(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-2.5 text-sm text-slate-900 dark:text-white focus:outline-none focus:border-blue-500 font-semibold"
              >
                <option value="Worship">Worship</option>
                <option value="Praise">Praise</option>
                <option value="Christmas">Christmas</option>
                <option value="Easter">Easter</option>
                <option value="Wedding">Wedding</option>
                <option value="Funeral">Funeral</option>
              </select>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1.5">Difficulty Level</label>
              <select
                value={difficulty}
                onChange={e => setDifficulty(e.target.value as any)}
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-2.5 text-sm text-slate-900 dark:text-white focus:outline-none focus:border-blue-500 font-semibold"
              >
                <option value="Easy">Easy</option>
                <option value="Medium">Medium</option>
                <option value="Hard">Hard</option>
                <option value="Advanced">Advanced</option>
              </select>
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1.5">Lyrics</label>
            <textarea
              rows={4}
              value={lyrics}
              onChange={e => setLyrics(e.target.value)}
              placeholder="Paste song lyrics here..."
              className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-4 text-sm text-slate-900 dark:text-white focus:outline-none focus:border-blue-500 font-sans"
            />
          </div>

          {/* PDF Sheet Music Upload */}
          <div>
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1.5 flex items-center justify-between">
              <span>PDF Sheet Music Upload</span>
              <span className="text-[10px] text-blue-600 dark:text-blue-400 font-bold uppercase tracking-wider">Supabase Storage</span>
            </label>
            
            <div className="flex flex-col md:flex-row items-center gap-4">
              <label className="flex-1 w-full flex items-center gap-3 bg-slate-50 dark:bg-slate-950 border border-dashed border-slate-300 dark:border-slate-700 hover:border-blue-500 rounded-xl px-4 py-3 cursor-pointer transition-colors group">
                <FileText className="w-5 h-5 text-blue-600 dark:text-blue-400 group-hover:scale-110 transition-transform shrink-0" />
                <div className="flex-1 truncate">
                  <span className="text-xs text-slate-800 dark:text-slate-200 block truncate">
                    {uploadingPdf ? 'Uploading PDF to Supabase Storage...' : pdfFileName ? pdfFileName : sheetPdfUrl ? 'PDF Attached ✅' : 'Choose PDF Sheet Music File'}
                  </span>
                  <span className="text-[10px] text-slate-500 block">Click to browse .pdf files</span>
                </div>
                {uploadingPdf ? (
                  <Loader2 className="w-4 h-4 text-blue-600 dark:text-blue-400 animate-spin shrink-0" />
                ) : sheetPdfUrl ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                ) : null}
                <input
                  type="file"
                  accept="application/pdf"
                  onChange={handlePdfFileUpload}
                  className="hidden"
                />
              </label>

              <div className="w-full md:w-auto text-xs text-slate-400 font-mono">OR</div>

              <input
                type="url"
                value={sheetPdfUrl}
                onChange={e => setSheetPdfUrl(e.target.value)}
                placeholder="Or paste external PDF URL..."
                className="w-full md:w-64 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-3 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-blue-500"
              />
            </div>
            {pdfUploadError && (
              <p className="text-[11px] text-rose-500 mt-1 font-semibold flex items-center gap-1">
                <AlertCircle className="w-3 h-3 shrink-0" /> {pdfUploadError}
              </p>
            )}
          </div>
        </div>

        {/* Multi-Track Voice Parts Audio Setup */}
        <div className="bg-white dark:bg-slate-900 p-6 md:p-8 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-6">
          <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-4">
            <div>
              <h3 className="text-lg font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                <Upload className="w-5 h-5 text-blue-600 dark:text-blue-400" /> Voice Part Audio Tracks (Upload MP3 / WAV)
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">Select MP3/WAV files for each choir section or paste audio links</p>
            </div>
            <button
              type="button"
              onClick={handleAddPart}
              className="text-xs font-bold text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 flex items-center gap-1 bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800/40 px-3 py-2 rounded-xl transition-all"
            >
              <Plus className="w-4 h-4" /> Add Track
            </button>
          </div>

          <div className="space-y-4">
            {parts.map((p, idx) => (
              <div key={idx} className="bg-slate-50 dark:bg-slate-950 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-3">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-center">
                  <div>
                    <label className="text-[10px] text-slate-500 dark:text-slate-400 uppercase font-bold block mb-1">Voice Part</label>
                    <select
                      value={p.part_name}
                      onChange={e => handlePartChange(idx, 'part_name', e.target.value)}
                      className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white focus:border-blue-500 font-semibold"
                    >
                      <option value="Full Mix">Full Mix</option>
                      <option value="Soprano">Soprano</option>
                      <option value="Alto">Alto</option>
                      <option value="Tenor">Tenor</option>
                      <option value="Bass">Bass</option>
                      <option value="Instrumental">Instrumental</option>
                      <option value="Custom">Custom</option>
                    </select>
                  </div>

                  {/* Audio File Upload Picker */}
                  <div className="md:col-span-2 space-y-1">
                    <label className="text-[10px] text-slate-500 dark:text-slate-400 uppercase font-bold flex items-center justify-between">
                      <span>Audio File (Upload MP3 / WAV)</span>
                      <span className="text-blue-600 dark:text-blue-400">Supabase Storage</span>
                    </label>

                    <div className="flex items-center gap-2">
                      <label className="flex-1 flex items-center gap-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-blue-500 rounded-xl px-3 py-2 cursor-pointer transition-colors group truncate">
                        <FileAudio className="w-4 h-4 text-blue-600 dark:text-blue-400 group-hover:scale-110 transition-transform shrink-0" />
                        <span className="text-xs text-slate-700 dark:text-slate-300 truncate">
                          {p.isUploading ? 'Uploading audio...' : p.fileName ? p.fileName : p.audio_url ? 'File Ready ✅' : 'Choose Audio File'}
                        </span>
                        {p.isUploading ? (
                          <Loader2 className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400 animate-spin shrink-0 ml-auto" />
                        ) : p.audio_url ? (
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0 ml-auto" />
                        ) : null}
                        <input
                          type="file"
                          accept="audio/*"
                          onChange={e => handleAudioFileUpload(idx, e)}
                          className="hidden"
                        />
                      </label>

                      <input
                        type="url"
                        value={p.audio_url}
                        onChange={e => handlePartChange(idx, 'audio_url', e.target.value)}
                        placeholder="Or paste URL..."
                        className="w-1/3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-blue-500 hidden md:block"
                      />
                    </div>
                    {p.uploadError && (
                      <p className="text-[11px] text-rose-500 mt-1 font-semibold flex items-center gap-1">
                        <AlertCircle className="w-3 h-3 shrink-0" /> {p.uploadError}
                      </p>
                    )}
                  </div>

                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs text-slate-500 dark:text-slate-400 font-mono">{p.duration_seconds}s</span>
                    <button
                      type="button"
                      onClick={() => handleRemovePart(idx)}
                      className="p-2 text-rose-500 hover:text-rose-600 transition-colors"
                      title="Remove Track"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <button
          type="submit"
          disabled={saving || isAnyUploading}
          className="w-full bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-bold py-4 rounded-2xl shadow-lg shadow-blue-600/30 transition-all flex items-center justify-center gap-2 text-sm"
        >
          {isAnyUploading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" /> Uploading Files to Storage, Please Wait...
            </>
          ) : saving ? (
            'Saving Changes...'
          ) : (
            <>
              <Save className="w-4 h-4" /> Save Song &amp; Audio Tracks
            </>
          )}
        </button>
      </form>
    </div>
  );
}
