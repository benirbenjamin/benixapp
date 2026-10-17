'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { songService } from '@/lib/services/songService';
import { Song, LearningStatus } from '@/lib/types/database.types';
import { AudioPracticePlayer } from '@/components/audio/AudioPracticePlayer';
import { useAuth } from '@/lib/context/AuthContext';
import { useChoir } from '@/lib/context/ChoirContext';
import { ArrowLeft, FileText, Download, Edit3, Trash2 } from 'lucide-react';

export default function SongDetailPage() {
  const params = useParams();
  const router = useRouter();
  const songId = params?.id as string;
  
  const { user } = useAuth();
  const { activeMember, isAdmin } = useChoir();

  const [song, setSong] = useState<Song | null>(null);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);
  const [statusMap, setStatusMap] = useState<Record<string, LearningStatus>>({});

  useEffect(() => {
    async function loadSong() {
      if (!songId) return;
      setLoading(true);
      const data = await songService.getSongById(songId);
      setSong(data);

      if (data && activeMember) {
        const statuses = await songService.getMemberLearningStatus(activeMember.id, data.id);
        setStatusMap(statuses);
      }
      setLoading(false);
    }
    loadSong();
  }, [songId, activeMember]);

  const handleStatusChange = async (partName: string, status: LearningStatus) => {
    if (!song || !activeMember) return;
    await songService.updateLearningStatus(activeMember.id, song.id, partName, status);
  };

  const handleDeleteSong = async () => {
    if (!song) return;
    if (!confirm(`Are you sure you want to delete "${song.title}"? This cannot be undone.`)) return;

    setDeleting(true);
    const ok = await songService.deleteSong(song.id);
    if (ok) {
      router.push('/songs');
    } else {
      alert('Failed to delete song.');
      setDeleting(false);
    }
  };

  if (loading) {
    return <div className="py-20 text-center text-slate-400">Loading song practice room...</div>;
  }

  if (!song) {
    return (
      <div className="py-20 text-center text-slate-400 space-y-4">
        <h2 className="text-xl font-bold">Song Not Found</h2>
        <Link href="/songs" className="text-purple-400 underline text-xs">Return to Music Library</Link>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Back Navigation Bar */}
      <div className="flex items-center justify-between">
        <Link href="/songs" className="inline-flex items-center gap-2 text-xs font-semibold text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white transition-colors">
          <ArrowLeft className="w-4 h-4" /> Back to Music Library
        </Link>

        {isAdmin && (
          <div className="flex items-center gap-2">
            <Link
              href={`/manage/songs/${song.id}/edit`}
              className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 flex items-center gap-1.5 bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800/40 px-3 py-1.5 rounded-xl transition-all"
            >
              <Edit3 className="w-3.5 h-3.5" /> Edit Song &amp; Audio Tracks
            </Link>

            <button
              onClick={handleDeleteSong}
              disabled={deleting}
              className="text-xs font-semibold text-rose-500 hover:text-rose-600 flex items-center gap-1.5 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800/40 px-3 py-1.5 rounded-xl transition-all"
            >
              <Trash2 className="w-3.5 h-3.5" /> {deleting ? 'Deleting...' : 'Delete Song'}
            </button>
          </div>
        )}
      </div>

      {/* Primary Audio Practice Player Component */}
      <AudioPracticePlayer
        parts={song.parts || []}
        songTitle={song.title}
        composer={song.composer}
        initialStatusMap={statusMap}
        onStatusChange={handleStatusChange}
      />

      {/* Lyrics & Sheet Music PDF Section */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 pt-4">
        {/* Lyrics Container */}
        <div className="md:col-span-2 bg-white dark:bg-slate-900 p-6 md:p-8 rounded-3xl border border-slate-200 dark:border-slate-800 space-y-4 shadow-sm">
          <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <FileText className="w-5 h-5 text-blue-600 dark:text-blue-400" /> Song Lyrics
          </h3>
          {song.lyrics ? (
            <pre className="text-sm font-sans text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-wrap font-medium">
              {song.lyrics}
            </pre>
          ) : (
            <p className="text-xs text-slate-400 italic">No written lyrics provided for this song yet.</p>
          )}
        </div>

        {/* Resources & PDF Sheet Music Download */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 space-y-6 h-fit shadow-sm">
          <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Download className="w-5 h-5 text-blue-600 dark:text-blue-400" /> Sheet Music &amp; PDFs
          </h3>
          {song.sheet_music_pdf_url ? (
            <a
              href={song.sheet_music_pdf_url}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full bg-blue-600 hover:bg-blue-500 text-white font-semibold py-3 px-4 rounded-xl text-xs flex items-center justify-center gap-2 shadow-lg shadow-blue-600/30 transition-all"
            >
              <Download className="w-4 h-4" /> Download PDF Sheet Music
            </a>
          ) : (
            <p className="text-xs text-slate-400">No PDF sheet music attached.</p>
          )}

          <div className="border-t border-slate-100 dark:border-slate-800 pt-4 space-y-2 text-xs text-slate-500 dark:text-slate-400">
            <p>Category: <strong className="text-slate-900 dark:text-slate-200">{song.category}</strong></p>
            <p>Language: <strong className="text-slate-900 dark:text-slate-200">{song.language}</strong></p>
            <p>Difficulty: <strong className="text-slate-900 dark:text-slate-200">{song.difficulty}</strong></p>
          </div>
        </div>
      </div>
    </div>
  );
}
