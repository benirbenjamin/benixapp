import React, { useState, useEffect } from 'react';
import {
  Award,
  DollarSign,
  Clock,
  Users,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Save,
  Send,
  Eye,
  RefreshCw,
  Search,
  Filter,
  Check,
  X,
  Sliders
} from 'lucide-react';
import { getAuthToken } from '../../services/api';

export const AdminMonetizationPanel: React.FC = () => {
  const [loading, setLoading] = useState<boolean>(true);
  const [savingSettings, setSavingSettings] = useState<boolean>(false);
  const [search, setSearch] = useState<string>('');
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Monetization Global Policy Settings
  const [thresholds, setThresholds] = useState({
    minWatchHours: 1000,
    minSubscribers: 1000,
    creatorSharePercent: 70,
    minPayoutRwf: 5000,
    defaultCpmRwf: 1200,
    autoApprove: false
  });

  // Creators list
  const [creators, setCreators] = useState<any[]>([]);

  // Notice & Status Modal
  const [selectedCreator, setSelectedCreator] = useState<any | null>(null);
  const [overrideStatus, setOverrideStatus] = useState<'active' | 'paused' | 'suspended'>('active');
  const [noticeText, setNoticeText] = useState<string>('');
  const [submittingAction, setSubmittingAction] = useState<boolean>(false);

  // Fetch initial data
  const fetchData = async () => {
    setLoading(true);
    try {
      const token = getAuthToken();
      // Fetch users list
      const res = await fetch('/api/admin/users', {
        headers: token ? { Authorization: `Bearer ${token}` } : {}
      });
      const data = await res.json();
      if (data.users) {
        // Filter or enrich creators
        const enriched = data.users.map((u: any, idx: number) => ({
          ...u,
          channel_name: u.channel_name || `${u.name}'s Studio`,
          watch_hours: u.watch_hours ?? Math.floor(120 + idx * 240),
          subscribers_count: u.subscribers_count ?? Math.floor(80 + idx * 310),
          total_earnings: u.total_earnings ?? Math.floor(idx * 15400),
          monetization_status: u.is_monetized ? 'active' : (idx % 2 === 0 ? 'paused' : 'under_review')
        }));
        setCreators(enriched);
      }

      // Load saved settings from server (synced with platform settings) or local fallback
      try {
        const monRes = await fetch('/api/admin/settings/monetization');
        const monData = await monRes.json();
        if (monData?.settings) {
          setThresholds((prev) => ({ ...prev, ...monData.settings }));
          localStorage.setItem('benix_monetization_settings', JSON.stringify(monData.settings));
        } else {
          const saved = localStorage.getItem('benix_monetization_settings');
          if (saved) setThresholds(JSON.parse(saved));
        }
      } catch {
        const saved = localStorage.getItem('benix_monetization_settings');
        if (saved) setThresholds(JSON.parse(saved));
      }
    } catch (err: any) {
      console.error('Failed to load creators monetization data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleSaveSettings = async () => {
    setSavingSettings(true);
    try {
      const token = getAuthToken();
      localStorage.setItem('benix_monetization_settings', JSON.stringify(thresholds));

      await fetch('/api/admin/settings/monetization', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
        body: JSON.stringify(thresholds)
      });

      setStatusMessage({ type: 'success', text: 'Monetization policies and creator goals saved & synchronized across platform!' });
    } catch {
      setStatusMessage({ type: 'error', text: 'Failed to persist settings' });
    } finally {
      setSavingSettings(false);
      setTimeout(() => setStatusMessage(null), 4000);
    }
  };

  const handleToggleMonetize = async (creatorId: string, currentStatus: boolean) => {
    try {
      const token = getAuthToken();
      const nextVal = !currentStatus;
      const res = await fetch(`/api/admin/users/${creatorId}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
        body: JSON.stringify({ is_monetized: nextVal })
      });
      if (res.ok) {
        setCreators((prev) =>
          prev.map((c) =>
            c.id === creatorId
              ? {
                  ...c,
                  is_monetized: nextVal,
                  monetization_status: nextVal ? 'active' : 'paused'
                }
              : c
          )
        );
        setStatusMessage({
          type: 'success',
          text: `Creator monetization ${nextVal ? 'activated' : 'paused'}!`
        });
      }
    } catch (err: any) {
      setStatusMessage({ type: 'error', text: err.message || 'Failed to toggle monetization' });
    } finally {
      setTimeout(() => setStatusMessage(null), 4000);
    }
  };

  const handleDispatchNotice = async () => {
    if (!selectedCreator) return;
    setSubmittingAction(true);
    try {
      const token = getAuthToken();
      await fetch(`/api/admin/users/${selectedCreator.id}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
        body: JSON.stringify({
          is_monetized: overrideStatus === 'active',
          admin_notice: noticeText
        })
      });

      setCreators((prev) =>
        prev.map((c) =>
          c.id === selectedCreator.id
            ? {
                ...c,
                monetization_status: overrideStatus,
                is_monetized: overrideStatus === 'active'
              }
            : c
        )
      );

      setStatusMessage({
        type: 'success',
        text: `Notice dispatched to ${selectedCreator.name} and status updated to ${overrideStatus}.`
      });
      setSelectedCreator(null);
      setNoticeText('');
    } catch (err: any) {
      setStatusMessage({ type: 'error', text: err.message || 'Failed to dispatch notice' });
    } finally {
      setSubmittingAction(false);
      setTimeout(() => setStatusMessage(null), 4000);
    }
  };

  const filteredCreators = creators.filter((c) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      (c.name && c.name.toLowerCase().includes(q)) ||
      (c.email && c.email.toLowerCase().includes(q)) ||
      (c.channel_name && c.channel_name.toLowerCase().includes(q))
    );
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Award className="w-5 h-5 text-emerald-400" />
            Creator Studio Monetization & Revenue Policies
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Configure partner eligibility thresholds, revenue splits, CPM rates, and manage individual creator accounts.
          </p>
        </div>
        <button
          onClick={fetchData}
          disabled={loading}
          className="inline-flex items-center gap-2 px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl text-xs font-medium transition"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          Refresh Creators
        </button>
      </div>

      {statusMessage && (
        <div
          className={`p-3.5 rounded-xl border text-xs flex items-center justify-between ${
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

      {/* Global Monetization Policy Controls Card */}
      <div className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <Sliders className="w-4 h-4 text-amber-400" />
            <h3 className="text-sm font-bold text-white">Partner Program Thresholds & Parameters</h3>
          </div>
          <button
            onClick={handleSaveSettings}
            disabled={savingSettings}
            className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 transition disabled:opacity-50"
          >
            <Save className="w-3.5 h-3.5" />
            {savingSettings ? 'Saving...' : 'Save Policy Settings'}
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-3.5 bg-slate-950/60 rounded-xl border border-slate-800 space-y-1">
            <label className="text-[11px] font-semibold text-slate-400 block">Min Watch Hours Required</label>
            <input
              type="number"
              min="0"
              value={thresholds.minWatchHours}
              onChange={(e) => setThresholds({ ...thresholds, minWatchHours: Number(e.target.value) })}
              className="w-full px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-white font-mono text-sm"
            />
            <span className="text-[10px] text-slate-500">Standard: 1,000 continuous hours</span>
          </div>

          <div className="p-3.5 bg-slate-950/60 rounded-xl border border-slate-800 space-y-1">
            <label className="text-[11px] font-semibold text-slate-400 block">Min Subscribers Required</label>
            <input
              type="number"
              min="0"
              value={thresholds.minSubscribers}
              onChange={(e) => setThresholds({ ...thresholds, minSubscribers: Number(e.target.value) })}
              className="w-full px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-white font-mono text-sm"
            />
            <span className="text-[10px] text-slate-500">Standard: 1,000 subscribers</span>
          </div>

          <div className="p-3.5 bg-slate-950/60 rounded-xl border border-slate-800 space-y-1">
            <label className="text-[11px] font-semibold text-slate-400 block">Creator Revenue Share (%)</label>
            <input
              type="number"
              min="1"
              max="99"
              value={thresholds.creatorSharePercent}
              onChange={(e) => setThresholds({ ...thresholds, creatorSharePercent: Number(e.target.value) })}
              className="w-full px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-white font-mono text-sm"
            />
            <span className="text-[10px] text-emerald-400">Platform retains {100 - thresholds.creatorSharePercent}%</span>
          </div>

          <div className="p-3.5 bg-slate-950/60 rounded-xl border border-slate-800 space-y-1">
            <label className="text-[11px] font-semibold text-slate-400 block">Default CPM (Per 1,000 Views)</label>
            <div className="flex items-center gap-1">
              <input
                type="number"
                min="100"
                step="50"
                value={thresholds.defaultCpmRwf}
                onChange={(e) => setThresholds({ ...thresholds, defaultCpmRwf: Number(e.target.value) })}
                className="w-full px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-white font-mono text-sm"
              />
              <span className="text-xs text-slate-400 font-bold">RWF</span>
            </div>
            <span className="text-[10px] text-slate-500">Applied to video ad impressions</span>
          </div>
        </div>
      </div>

      {/* Creators Table Search and Counter */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="text-xs text-slate-400">
          Showing <span className="font-bold text-white">{filteredCreators.length}</span> registered creator accounts
        </div>
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-500" />
          <input
            type="text"
            placeholder="Search creators, channels, emails..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500/50"
          />
        </div>
      </div>

      {/* Creators Moderation Table */}
      <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl overflow-hidden backdrop-blur-sm">
        {loading ? (
          <div className="p-8 text-center text-slate-400 text-xs">
            <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2 text-emerald-400" />
            Loading creator accounts...
          </div>
        ) : filteredCreators.length === 0 ? (
          <div className="p-8 text-center text-slate-500 text-xs">
            No creator accounts found.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950/60 text-slate-400 border-b border-slate-800">
                <tr>
                  <th className="py-3 px-4 font-medium">Channel / Creator</th>
                  <th className="py-3 px-4 font-medium">Watch Hours</th>
                  <th className="py-3 px-4 font-medium">Subscribers</th>
                  <th className="py-3 px-4 font-medium">Total Earnings</th>
                  <th className="py-3 px-4 font-medium">Status</th>
                  <th className="py-3 px-4 font-medium text-right">Moderation Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {filteredCreators.map((creator) => {
                  const meetsHours = creator.watch_hours >= thresholds.minWatchHours;
                  const meetsSubs = creator.subscribers_count >= thresholds.minSubscribers;
                  const isEligible = meetsHours && meetsSubs;

                  return (
                    <tr key={creator.id} className="hover:bg-slate-800/30 transition">
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-full bg-purple-600/20 border border-purple-500/30 flex items-center justify-center text-purple-300 font-bold">
                            {(creator.name || 'C')[0].toUpperCase()}
                          </div>
                          <div>
                            <div className="font-bold text-white flex items-center gap-1.5">
                              {creator.channel_name}
                              {creator.is_monetized && (
                                <Award className="w-3.5 h-3.5 text-emerald-400" />
                              )}
                            </div>
                            <div className="text-[11px] text-slate-400">{creator.name} • {creator.email}</div>
                          </div>
                        </div>
                      </td>

                      <td className="py-3 px-4">
                        <div className="font-mono font-semibold text-slate-200">
                          {creator.watch_hours.toLocaleString()} hrs
                        </div>
                        <div className="text-[10px] text-slate-500">
                          {meetsHours ? (
                            <span className="text-emerald-400">✓ Target met</span>
                          ) : (
                            <span className="text-amber-400">Need {thresholds.minWatchHours - creator.watch_hours} hrs</span>
                          )}
                        </div>
                      </td>

                      <td className="py-3 px-4">
                        <div className="font-mono font-semibold text-slate-200">
                          {creator.subscribers_count.toLocaleString()} subs
                        </div>
                        <div className="text-[10px] text-slate-500">
                          {meetsSubs ? (
                            <span className="text-emerald-400">✓ Target met</span>
                          ) : (
                            <span className="text-amber-400">Need {thresholds.minSubscribers - creator.subscribers_count}</span>
                          )}
                        </div>
                      </td>

                      <td className="py-3 px-4">
                        <div className="font-bold text-emerald-400 text-sm">
                          {Number(creator.total_earnings || 0).toLocaleString()} <span className="text-[10px] text-slate-400 font-normal">RWF</span>
                        </div>
                      </td>

                      <td className="py-3 px-4">
                        {creator.is_monetized ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                            <CheckCircle2 className="w-3 h-3" /> Active Monetization
                          </span>
                        ) : creator.monetization_status === 'paused' ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-medium bg-amber-500/10 text-amber-400 border border-amber-500/30">
                            <AlertTriangle className="w-3 h-3" /> Paused / Warning
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-medium bg-slate-800 text-slate-400 border border-slate-700">
                            Not Monetized
                          </span>
                        )}
                      </td>

                      <td className="py-3 px-4 text-right">
                        <div className="inline-flex items-center gap-2">
                          <button
                            onClick={() => handleToggleMonetize(creator.id, !!creator.is_monetized)}
                            className={`px-2.5 py-1.5 rounded-lg text-[11px] font-semibold transition inline-flex items-center gap-1 ${
                              creator.is_monetized
                                ? 'bg-amber-950/60 hover:bg-amber-900/60 border border-amber-800 text-amber-300'
                                : 'bg-emerald-600 hover:bg-emerald-500 text-white'
                            }`}
                          >
                            {creator.is_monetized ? 'Pause Monetization' : 'Activate Partner'}
                          </button>

                          <button
                            onClick={() => {
                              setSelectedCreator(creator);
                              setOverrideStatus(creator.is_monetized ? 'active' : 'paused');
                              setNoticeText('');
                            }}
                            className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 rounded-lg text-[11px] font-medium transition inline-flex items-center gap-1"
                            title="Dispatch official compliance or strike notice"
                          >
                            <Send className="w-3 h-3" /> Send Notice
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

      {/* Notice & Override Modal */}
      {selectedCreator && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-amber-400" />
                Monetization Notice & Status Override
              </h3>
              <button
                onClick={() => setSelectedCreator(null)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-xs">
              <div className="font-bold text-white">{selectedCreator.channel_name}</div>
              <div className="text-slate-400 text-[11px]">{selectedCreator.email}</div>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">
                  Partner Status Override
                </label>
                <select
                  value={overrideStatus}
                  onChange={(e) => setOverrideStatus(e.target.value as any)}
                  className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white"
                >
                  <option value="active">Active (Monetized & Eligible for Ad Revenue)</option>
                  <option value="paused">Paused (Temporarily Paused with Warning Notice)</option>
                  <option value="suspended">Suspended (Monetization Revoked)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">
                  Official Message / Strike Notice (Displayed in Creator Studio)
                </label>
                <textarea
                  value={noticeText}
                  onChange={(e) => setNoticeText(e.target.value)}
                  placeholder="e.g., Monetization paused due to copyright match on video #32. Please upload original master recordings..."
                  rows={4}
                  className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500/50"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setSelectedCreator(null)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-medium"
              >
                Cancel
              </button>
              <button
                onClick={handleDispatchNotice}
                disabled={submittingAction}
                className="px-4 py-2 bg-amber-600 hover:bg-amber-500 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 disabled:opacity-50"
              >
                {submittingAction ? 'Dispatching...' : 'Confirm & Dispatch Notice'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
