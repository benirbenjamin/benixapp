'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { choirService } from '@/lib/services/choirService';
import { useChoir } from '@/lib/context/ChoirContext';
import { ArrowLeft, Music, Sparkles, CheckCircle2, AlertCircle } from 'lucide-react';

export default function CreateChoirPage() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [churchName, setChurchName] = useState('');
  const [location, setLocation] = useState('');
  const [description, setDescription] = useState('');
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { refreshChoirs, setActiveChoirExplicitly } = useChoir();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const { choir, error: err } = await choirService.createChoir({
      name,
      church_name: churchName || undefined,
      location: location || undefined,
      description: description || undefined,
    });

    if (err || !choir) {
      setError(err || 'Failed to create choir');
      setLoading(false);
    } else {
      setActiveChoirExplicitly(choir);
      await refreshChoirs(choir.id);
      router.push(`/choir/plan-select?choirId=${choir.id}`);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-8 text-slate-900 dark:text-white">
      <Link href="/dashboard" className="inline-flex items-center gap-2 text-xs font-semibold text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white">
        <ArrowLeft className="w-4 h-4" /> Back to Dashboard
      </Link>

      <div className="border-b border-slate-200 dark:border-slate-800 pb-4">
        <div className="flex items-center gap-2 mb-1">
          <Sparkles className="w-4 h-4 text-blue-600 dark:text-blue-400" />
          <span className="text-xs text-blue-600 dark:text-blue-400 font-bold uppercase tracking-wider">Choir SaaS Setup</span>
        </div>
        <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white">Register a New Choir</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400">A unique 5-character choir code and shareable invitation link will be generated automatically</p>
      </div>

      {error && (
        <div className="bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/30 text-rose-600 dark:text-rose-300 p-4 rounded-2xl text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-rose-500 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6 bg-white dark:bg-slate-900 p-6 md:p-8 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <div>
          <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1.5">Choir Name *</label>
          <input
            type="text"
            required
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder="e.g. Voices of Peace Choir"
            className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-2.5 text-sm text-slate-900 dark:text-white focus:outline-none focus:border-blue-500"
          />
        </div>

        <div>
          <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1.5">Church / Organization Name</label>
          <input
            type="text"
            value={churchName}
            onChange={e => setChurchName(e.target.value)}
            placeholder="e.g. St. Paul Cathedral"
            className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-2.5 text-sm text-slate-900 dark:text-white focus:outline-none focus:border-blue-500"
          />
        </div>

        <div>
          <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1.5">Location (Optional)</label>
          <input
            type="text"
            value={location}
            onChange={e => setLocation(e.target.value)}
            placeholder="e.g. Kigali, Rwanda"
            className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-2.5 text-sm text-slate-900 dark:text-white focus:outline-none focus:border-blue-500"
          />
        </div>

        <div>
          <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1.5">Description</label>
          <textarea
            rows={3}
            value={description}
            onChange={e => setDescription(e.target.value)}
            placeholder="Short description of your choir..."
            className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-4 text-sm text-slate-900 dark:text-white focus:outline-none focus:border-blue-500"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-3.5 rounded-2xl shadow-lg shadow-blue-600/30 transition-all flex items-center justify-center gap-2 text-sm cursor-pointer"
        >
          {loading ? 'Creating Choir Account...' : 'Create Choir & Become Owner'} <CheckCircle2 className="w-5 h-5" />
        </button>
      </form>
    </div>
  );
}
