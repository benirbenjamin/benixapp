'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { subscriptionService } from '@/lib/services/subscriptionService';
import { ArrowLeft, Layers, CheckCircle2, Shield } from 'lucide-react';

export default function NewPlanPage() {
  const router = useRouter();

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [priceMonthly, setPriceMonthly] = useState<number>(0);
  const [discount3Months, setDiscount3Months] = useState<number>(10);
  const [discount6Months, setDiscount6Months] = useState<number>(20);
  const [discount12Months, setDiscount12Months] = useState<number>(30);
  const [isFree, setIsFree] = useState<boolean>(true);
  const [maxMembers, setMaxMembers] = useState<number>(50);
  const [maxSongs, setMaxSongs] = useState<number>(50);
  const [maxEventsPerMonth, setMaxEventsPerMonth] = useState<number>(20);
  const [maxAnnouncementsPerMonth, setMaxAnnouncementsPerMonth] = useState<number>(15);
  const [maxStorageMb, setMaxStorageMb] = useState<number>(1000);
  
  const [features, setFeatures] = useState<string[]>([
    'song_management',
    'voice_parts',
    'events',
    'rehearsals',
    'announcements',
  ]);

  const [loading, setLoading] = useState(false);

  const toggleFeature = (f: string) => {
    setFeatures(prev => prev.includes(f) ? prev.filter(x => x !== f) : [...prev, f]);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    await subscriptionService.createPlan({
      name,
      description,
      price_monthly: isFree ? 0 : priceMonthly,
      discount_3_months: isFree ? 0 : discount3Months,
      discount_6_months: isFree ? 0 : discount6Months,
      discount_12_months: isFree ? 0 : discount12Months,
      is_free: isFree,
      features,
      limits: {
        max_members: maxMembers,
        max_songs: maxSongs,
        max_events_per_month: maxEventsPerMonth,
        max_announcements_per_month: maxAnnouncementsPerMonth,
        max_storage_mb: maxStorageMb,
        max_choirs: 1,
        max_audio_files: 200,
      },
    });

    router.push('/admin');
  };

  return (
    <div className="max-w-3xl mx-auto p-6 md:p-10 space-y-8 text-white">
      <Link href="/admin" className="inline-flex items-center gap-2 text-xs font-semibold text-slate-400 hover:text-white">
        <ArrowLeft className="w-4 h-4" /> Back to Super Admin Portal
      </Link>

      <div className="border-b border-slate-800 pb-4">
        <div className="flex items-center gap-2 mb-1">
          <Shield className="w-4 h-4 text-amber-400" />
          <span className="text-xs text-amber-400 font-bold uppercase tracking-wider">Super Admin Plan Builder</span>
        </div>
        <h1 className="text-3xl font-extrabold text-white">Create New SaaS Subscription Plan</h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8 bg-slate-900/60 p-6 md:p-8 rounded-3xl border border-slate-800">
        <div className="space-y-4">
          <div>
            <label className="text-xs font-semibold text-slate-300 block mb-1.5">Plan Name *</label>
            <input
              type="text"
              required
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="e.g. Starter, Pro Church, Cathedral"
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-amber-500"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-300 block mb-1.5">Description</label>
            <textarea
              rows={2}
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="Brief summary of plan inclusions..."
              className="w-full bg-slate-950 border border-slate-800 rounded-xl p-4 text-sm text-white focus:outline-none focus:border-amber-500"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
            <div className="flex items-center gap-3 bg-slate-950 p-4 rounded-2xl border border-slate-800">
              <input
                type="checkbox"
                id="isFree"
                checked={isFree}
                onChange={e => setIsFree(e.target.checked)}
                className="w-5 h-5 accent-amber-500 rounded cursor-pointer"
              />
              <label htmlFor="isFree" className="text-xs font-semibold cursor-pointer">
                Mark Plan as FREE (Price = $0)
              </label>
            </div>

            {!isFree && (
              <div className="space-y-4 col-span-1 md:col-span-2">
                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1.5">Base Monthly Price (USD)</label>
                  <input
                    type="number"
                    min={0}
                    step={0.01}
                    value={priceMonthly}
                    onChange={e => setPriceMonthly(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white"
                  />
                </div>

                <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-3">
                  <label className="text-xs font-bold text-amber-400 block">Interval Discount Percentages (% OFF)</label>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="text-[11px] text-slate-400 block mb-1">3 Months Pay (% Off)</label>
                      <input
                        type="number"
                        min={0}
                        max={100}
                        value={discount3Months}
                        onChange={e => setDiscount3Months(Number(e.target.value))}
                        className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] text-slate-400 block mb-1">6 Months Pay (% Off)</label>
                      <input
                        type="number"
                        min={0}
                        max={100}
                        value={discount6Months}
                        onChange={e => setDiscount6Months(Number(e.target.value))}
                        className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] text-slate-400 block mb-1">Yearly Pay (% Off)</label>
                      <input
                        type="number"
                        min={0}
                        max={100}
                        value={discount12Months}
                        onChange={e => setDiscount12Months(Number(e.target.value))}
                        className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1.5">Member Limit (Singers)</label>
              <input
                type="number"
                min={-1}
                value={maxMembers}
                onChange={e => setMaxMembers(Number(e.target.value))}
                placeholder="-1 or 999999 for Unlimited"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white"
              />
              <span className="text-[10px] text-slate-500">Use 999999 for Unlimited</span>
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1.5">Max Songs Uploaded</label>
              <input
                type="number"
                min={-1}
                value={maxSongs}
                onChange={e => setMaxSongs(Number(e.target.value))}
                placeholder="-1 or 999999 for Unlimited"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white"
              />
              <span className="text-[10px] text-slate-500">Use 999999 for Unlimited</span>
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1.5">Max Events (Per Month)</label>
              <input
                type="number"
                min={-1}
                value={maxEventsPerMonth}
                onChange={e => setMaxEventsPerMonth(Number(e.target.value))}
                placeholder="-1 or 999999 for Unlimited"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white"
              />
              <span className="text-[10px] text-slate-500">Use 999999 for Unlimited</span>
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1.5">Max Announcements (Per Month)</label>
              <input
                type="number"
                min={-1}
                value={maxAnnouncementsPerMonth}
                onChange={e => setMaxAnnouncementsPerMonth(Number(e.target.value))}
                placeholder="-1 or 999999 for Unlimited"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white"
              />
              <span className="text-[10px] text-slate-500">Use 999999 for Unlimited</span>
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1.5">Storage Limit (MB)</label>
              <input
                type="number"
                min={100}
                value={maxStorageMb}
                onChange={e => setMaxStorageMb(Number(e.target.value))}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white"
              />
            </div>
          </div>

          {/* Feature Flags Selector */}
          <div className="pt-4 space-y-3">
            <label className="text-xs font-semibold text-slate-300 block">Included Feature Flags</label>
            <div className="grid grid-cols-2 gap-3">
              {[
                { id: 'song_management', label: 'Song Library & Audio' },
                { id: 'voice_parts', label: 'Multi-Track Voice Parts' },
                { id: 'events', label: 'Sunday Service Scheduling' },
                { id: 'attendance_tracking', label: 'Rehearsal Attendance' },
                { id: 'push_notifications', label: 'Push Notifications' },
                { id: 'loop_practice_tool', label: 'A-B Loop Practice Engine' },
              ].map(f => (
                <button
                  key={f.id}
                  type="button"
                  onClick={() => toggleFeature(f.id)}
                  className={`p-3 rounded-xl text-xs font-semibold border text-left transition-all ${
                    features.includes(f.id)
                      ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                      : 'bg-slate-950 text-slate-400 border-slate-800'
                  }`}
                >
                  {features.includes(f.id) ? '✓ ' : '+ '}{f.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold py-3.5 rounded-2xl shadow-xl shadow-amber-500/20 transition-all flex items-center justify-center gap-2 text-sm"
        >
          {loading ? 'Creating SaaS Plan...' : 'Save & Publish Plan'} <CheckCircle2 className="w-4 h-4" />
        </button>
      </form>
    </div>
  );
}
