'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useChoir } from '@/lib/context/ChoirContext';
import { songService } from '@/lib/services/songService';
import { Song } from '@/lib/types/database.types';
import { Music, Search, Filter, Volume2, Plus, Edit3, Trash2, ArrowLeft } from 'lucide-react';

export default function MusicLibraryPage() {
  const { activeChoir, isAdmin } = useChoir();
  const [songs, setSongs] = useState<Song[]>([]);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchSongs() {
      if (!activeChoir) return;
      setLoading(true);
      const data = await songService.getChoirSongs(activeChoir.id, search, category);
      setSongs(data);
      setLoading(false);
    }
    fetchSongs();
  }, [activeChoir, search, category]);

  const handleDeleteSong = async (e: React.MouseEvent, songId: string, title: string) => {
    e.preventDefault();
    e.stopPropagation();
    if (!confirm(`Are you sure you want to delete "${title}"?`)) return;

    const ok = await songService.deleteSong(songId);
    if (ok && activeChoir) {
      const updated = await songService.getChoirSongs(activeChoir.id, search, category);
      setSongs(updated);
    } else {
      alert('Failed to delete song.');
    }
  };

  return (
    <div className="space-y-8">
      {/* Back Button */}
      <Link href="/dashboard" className="inline-flex items-center gap-2 text-xs font-semibold text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white transition-colors">
        <ArrowLeft className="w-4 h-4" /> Back to Dashboard
      </Link>

      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-6">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white flex items-center gap-3">
            <Music className="w-8 h-8 text-blue-600 dark:text-blue-400" /> Choir Music Library
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">Practice Soprano, Alto, Tenor, Bass &amp; Full Mix voice tracks</p>
        </div>

        {isAdmin && (
          <Link
            href="/manage/songs/new"
            className="bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs px-5 py-3 rounded-2xl shadow-lg shadow-blue-600/30 flex items-center gap-2 transition-all self-start sm:self-auto"
          >
            <Plus className="w-4 h-4" /> Upload New Song
          </Link>
        )}
      </div>

      {/* Search & Category Filter Bar */}
      <div className="flex flex-col sm:flex-row items-center gap-4 bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search by song title or composer..."
            className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-blue-500"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Filter className="w-4 h-4 text-slate-400 shrink-0" />
          <select
            value={category}
            onChange={e => setCategory(e.target.value)}
            className="w-full sm:w-48 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2.5 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-blue-500 font-semibold"
          >
            <option value="">All Categories</option>
            <option value="Worship">Worship</option>
            <option value="Praise">Praise</option>
            <option value="Christmas">Christmas</option>
            <option value="Easter">Easter</option>
            <option value="Wedding">Wedding</option>
            <option value="Funeral">Funeral</option>
          </select>
        </div>
      </div>

      {/* Songs Grid */}
      {loading ? (
        <p className="text-center text-xs text-slate-500 dark:text-slate-400 py-16">Loading song library...</p>
      ) : songs.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 p-12 rounded-3xl border border-slate-200 dark:border-slate-800 text-center space-y-3 shadow-sm">
          <Music className="w-12 h-12 text-slate-400 mx-auto" />
          <h3 className="text-base font-bold text-slate-900 dark:text-white">No Songs Found</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400">Try clearing search filters or uploading a song.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {songs.map(s => (
            <Link
              key={s.id}
              href={`/songs/${s.id}`}
              className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 flex flex-col justify-between gap-4 hover:border-blue-400 dark:hover:border-blue-500 shadow-sm hover:shadow-md transition-all group block cursor-pointer"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[10px] uppercase font-bold text-blue-700 dark:text-blue-300 tracking-wider bg-blue-50 dark:bg-blue-950/60 px-2.5 py-1 rounded-md border border-blue-200 dark:border-blue-800/40">
                    {s.category || 'Worship'}
                  </span>
                  {s.difficulty && (
                    <span className="text-[10px] text-slate-400 font-semibold uppercase">
                      {s.difficulty}
                    </span>
                  )}
                </div>

                <h3 className="text-xl font-extrabold text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors line-clamp-1">
                  {s.title}
                </h3>
                {s.composer && <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-1">Composer: {s.composer}</p>}
              </div>

              <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                <div className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-2.5 rounded-xl text-xs flex items-center justify-center gap-2 shadow-md transition-all">
                  <Volume2 className="w-4 h-4 text-white" /> Practice Voice Parts
                </div>

                {isAdmin && (
                  <div className="flex items-center justify-end gap-3 pt-1">
                    <Link
                      href={`/manage/songs/${s.id}/edit`}
                      onClick={e => e.stopPropagation()}
                      className="text-xs text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1 font-semibold"
                    >
                      <Edit3 className="w-3.5 h-3.5" /> Edit
                    </Link>
                    <button
                      onClick={e => handleDeleteSong(e, s.id, s.title)}
                      className="text-xs text-rose-500 hover:underline flex items-center gap-1 font-semibold"
                    >
                      <Trash2 className="w-3.5 h-3.5" /> Delete
                    </button>
                  </div>
                )}
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
