import React, { useState, useEffect } from 'react';
import {
  X,
  User,
  Wallet,
  Shield,
  Film,
  Award,
  CheckCircle2,
  AlertTriangle,
  Trash2,
  Ban,
  Play,
  Edit2,
  Plus,
  Minus,
  Save,
  Clock,
  Eye,
  DollarSign
} from 'lucide-react';
import { getAuthToken } from '../../services/api';

interface AdminUserDetailModalProps {
  userId: string;
  onClose: () => void;
  onUserUpdated: () => void;
}

export const AdminUserDetailModal: React.FC<AdminUserDetailModalProps> = ({
  userId,
  onClose,
  onUserUpdated
}) => {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Balance adjustment state
  const [adjustAmount, setAdjustAmount] = useState<string>('');
  const [adjustType, setAdjustType] = useState<'credit' | 'deduct'>('credit');
  const [adjustNote, setAdjustNote] = useState<string>('');
  const [isAdjusting, setIsAdjusting] = useState(false);

  // Video view editing state
  const [editingVideoId, setEditingVideoId] = useState<string | null>(null);
  const [editingVideoViews, setEditingVideoViews] = useState<number>(0);

  const fetchUserDetails = async () => {
    setLoading(true);
    setError(null);
    try {
      const token = getAuthToken();
      const res = await fetch(`/api/admin/users/${userId}/details`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {}
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.error || 'Failed to load user details');
      setData(result);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUserDetails();
  }, [userId]);

  const handleAdjustBalance = async (e: React.FormEvent) => {
    e.preventDefault();
    const num = Number(adjustAmount);
    if (!num || num <= 0) {
      alert('Please enter a valid amount.');
      return;
    }

    setIsAdjusting(true);
    setSuccess(null);
    setError(null);
    try {
      const token = getAuthToken();
      const res = await fetch(`/api/admin/users/${userId}/adjust-wallet`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
        body: JSON.stringify({
          amount: num,
          type: adjustType,
          note: adjustNote.trim()
        })
      });
      const resData = await res.json();
      if (!res.ok) throw new Error(resData.error || 'Failed to adjust balance');

      setSuccess(resData.message);
      setAdjustAmount('');
      setAdjustNote('');
      await fetchUserDetails();
      onUserUpdated();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsAdjusting(false);
    }
  };

  const handleToggleSuspend = async () => {
    const isCurrentlySuspended = !!data?.user?.is_suspended;
    if (!window.confirm(`Are you sure you want to ${isCurrentlySuspended ? 'unsuspend' : 'suspend'} this account?`)) return;

    try {
      const token = getAuthToken();
      const res = await fetch(`/api/admin/users/${userId}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
        body: JSON.stringify({ is_suspended: !isCurrentlySuspended })
      });
      if (!res.ok) throw new Error('Failed to update suspension status');
      setSuccess(`User has been ${isCurrentlySuspended ? 'unsuspended' : 'suspended'}.`);
      await fetchUserDetails();
      onUserUpdated();
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleDeleteUser = async () => {
    if (!window.confirm(`⚠️ PERMANENT DELETION: Are you sure you want to delete user "${data?.user?.email}" and all associated wallet and video data? This cannot be undone.`)) return;

    try {
      const token = getAuthToken();
      const res = await fetch(`/api/admin/users/${userId}`, {
        method: 'DELETE',
        headers: token ? { Authorization: `Bearer ${token}` } : {}
      });
      if (!res.ok) throw new Error('Failed to delete user');
      alert('User deleted permanently.');
      onUserUpdated();
      onClose();
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleSaveVideoViews = async (videoId: string) => {
    try {
      const token = getAuthToken();
      const res = await fetch(`/api/admin/videos/${videoId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
        body: JSON.stringify({ views: editingVideoViews })
      });
      if (!res.ok) throw new Error('Failed to update views');
      setEditingVideoId(null);
      await fetchUserDetails();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleDeleteUserVideo = async (videoId: string, title: string) => {
    if (!window.confirm(`Delete video "${title}"?`)) return;
    try {
      const token = getAuthToken();
      const res = await fetch(`/api/admin/videos/${videoId}`, {
        method: 'DELETE',
        headers: token ? { Authorization: `Bearer ${token}` } : {}
      });
      if (!res.ok) throw new Error('Failed to delete video');
      await fetchUserDetails();
    } catch (err: any) {
      alert(err.message);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 animate-fade-in overflow-y-auto">
      <div className="bg-[#131926] rounded-3xl max-w-4xl w-full p-6 sm:p-8 shadow-2xl border border-slate-800 space-y-6 my-8 max-h-[90vh] overflow-y-auto">
        
        {/* Top Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white shadow-lg shadow-blue-500/20">
              <User className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-black text-white text-lg">
                {data?.user?.name || 'User Profile'}
              </h3>
              <p className="text-xs text-slate-400">
                {data?.user?.email} • ID: <span className="font-mono text-slate-300">{userId}</span>
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Alerts */}
        {error && (
          <div className="p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs font-bold flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0 text-rose-400" />
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div className="p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs font-bold flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
            <span>{success}</span>
          </div>
        )}

        {loading ? (
          <div className="py-16 text-center text-slate-400 text-xs space-y-3">
            <div className="w-8 h-8 border-2 border-blue-400 border-t-transparent rounded-full animate-spin mx-auto" />
            <p>Loading user financial metrics and uploaded video catalog...</p>
          </div>
        ) : data ? (
          <div className="space-y-6">

            {/* Quick Metrics Strip */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="p-4 rounded-2xl bg-[#0B0E14] border border-slate-800 space-y-1">
                <span className="text-[10px] uppercase font-bold text-slate-500 block">Central Wallet</span>
                <span className="text-lg font-black text-emerald-400">
                  {Number(data.user?.wallet_balance || 0).toLocaleString()} RWF
                </span>
              </div>

              <div className="p-4 rounded-2xl bg-[#0B0E14] border border-slate-800 space-y-1">
                <span className="text-[10px] uppercase font-bold text-slate-500 block">Monetization</span>
                <span className={`text-xs font-black px-2 py-0.5 rounded-md inline-block ${
                  data.monetization?.is_monetized
                    ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                    : 'bg-slate-800 text-slate-400'
                }`}>
                  {data.monetization?.is_monetized ? 'MONETIZED ✓' : 'STANDARD'}
                </span>
              </div>

              <div className="p-4 rounded-2xl bg-[#0B0E14] border border-slate-800 space-y-1">
                <span className="text-[10px] uppercase font-bold text-slate-500 block">Videos Uploaded</span>
                <span className="text-lg font-black text-purple-400">
                  {data.videos?.length || 0}
                </span>
              </div>

              <div className="p-4 rounded-2xl bg-[#0B0E14] border border-slate-800 space-y-1">
                <span className="text-[10px] uppercase font-bold text-slate-500 block">Account Status</span>
                <span className={`text-xs font-black px-2 py-0.5 rounded-md inline-block ${
                  data.user?.is_suspended
                    ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                    : 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                }`}>
                  {data.user?.is_suspended ? 'SUSPENDED' : 'ACTIVE'}
                </span>
              </div>
            </div>

            {/* Manual Balance Adjustment Form */}
            <div className="p-5 rounded-3xl bg-[#0B0E14] border border-slate-800 space-y-4">
              <div className="flex items-center gap-2">
                <Wallet className="w-4 h-4 text-emerald-400" />
                <h4 className="font-extrabold text-white text-xs uppercase tracking-wider">
                  Manual Central Wallet Adjustment
                </h4>
              </div>

              <form onSubmit={handleAdjustBalance} className="grid grid-cols-1 sm:grid-cols-4 gap-3 items-end">
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Type</label>
                  <select
                    value={adjustType}
                    onChange={(e) => setAdjustType(e.target.value as any)}
                    className="w-full bg-[#161C2C] border border-slate-700 text-xs text-white rounded-xl px-3 py-2 outline-none"
                  >
                    <option value="credit">Credit (+) Add Funds</option>
                    <option value="deduct">Deduct (-) Remove Funds</option>
                  </select>
                </div>

                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Amount (RWF)</label>
                  <input
                    type="number"
                    min="1"
                    placeholder="E.g. 5000"
                    value={adjustAmount}
                    onChange={(e) => setAdjustAmount(e.target.value)}
                    className="w-full bg-[#161C2C] border border-slate-700 text-xs text-white rounded-xl px-3 py-2 outline-none focus:border-emerald-500"
                    required
                  />
                </div>

                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Reason / Admin Note</label>
                  <input
                    type="text"
                    placeholder="E.g. Deposit reconciliation"
                    value={adjustNote}
                    onChange={(e) => setAdjustNote(e.target.value)}
                    className="w-full bg-[#161C2C] border border-slate-700 text-xs text-white rounded-xl px-3 py-2 outline-none"
                  />
                </div>

                <div>
                  <button
                    type="submit"
                    disabled={isAdjusting}
                    className={`w-full py-2 px-4 rounded-xl text-xs font-bold text-white transition-all shadow-md flex items-center justify-center gap-1.5 ${
                      adjustType === 'credit'
                        ? 'bg-emerald-600 hover:bg-emerald-500 shadow-emerald-600/30'
                        : 'bg-rose-600 hover:bg-rose-500 shadow-rose-600/30'
                    }`}
                  >
                    {adjustType === 'credit' ? <Plus className="w-3.5 h-3.5" /> : <Minus className="w-3.5 h-3.5" />}
                    <span>{isAdjusting ? 'Processing...' : `${adjustType === 'credit' ? 'Credit' : 'Deduct'} Balance`}</span>
                  </button>
                </div>
              </form>
            </div>

            {/* Uploaded Videos Management */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Film className="w-4 h-4 text-purple-400" />
                  <h4 className="font-extrabold text-white text-xs uppercase tracking-wider">
                    Uploaded Videos & View Manipulation ({data.videos?.length || 0})
                  </h4>
                </div>
              </div>

              {data.videos?.length === 0 ? (
                <div className="p-6 rounded-2xl bg-[#0B0E14] border border-slate-800 text-center text-xs text-slate-500">
                  This user has not uploaded any videos yet.
                </div>
              ) : (
                <div className="rounded-2xl border border-slate-800 overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-[#0B0E14] text-slate-400 font-bold border-b border-slate-800">
                      <tr>
                        <th className="p-3">Video Title</th>
                        <th className="p-3">Category</th>
                        <th className="p-3">Views (Click to Edit)</th>
                        <th className="p-3">Watch Hours</th>
                        <th className="p-3">Price</th>
                        <th className="p-3 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60 bg-[#0E1422]">
                      {data.videos.map((vid: any) => (
                        <tr key={vid.id} className="hover:bg-slate-800/40">
                          <td className="p-3">
                            <span className="font-bold text-white block max-w-xs truncate">{vid.title}</span>
                            <span className="text-[10px] text-slate-500 font-mono">{vid.id}</span>
                          </td>
                          <td className="p-3">
                            <span className="text-[10px] font-bold text-slate-300 bg-slate-800 px-2 py-0.5 rounded">
                              {vid.category}
                            </span>
                          </td>
                          <td className="p-3">
                            {editingVideoId === vid.id ? (
                              <div className="flex items-center gap-1.5">
                                <input
                                  type="number"
                                  value={editingVideoViews}
                                  onChange={(e) => setEditingVideoViews(parseInt(e.target.value) || 0)}
                                  className="w-20 px-2 py-1 bg-slate-900 border border-purple-500 rounded text-xs text-white"
                                  autoFocus
                                />
                                <button
                                  onClick={() => handleSaveVideoViews(vid.id)}
                                  className="p-1 rounded bg-purple-600 text-white"
                                  title="Save dummy views"
                                >
                                  <Save className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  onClick={() => setEditingVideoId(null)}
                                  className="p-1 rounded bg-slate-700 text-slate-300"
                                >
                                  <X className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            ) : (
                              <div
                                onClick={() => {
                                  setEditingVideoId(vid.id);
                                  setEditingVideoViews(vid.views || 0);
                                }}
                                className="flex items-center gap-1.5 cursor-pointer group"
                                title="Click to edit dummy views"
                              >
                                <span className="font-black text-amber-400">
                                  {(vid.views || 0).toLocaleString()}
                                </span>
                                <Edit2 className="w-3 h-3 text-slate-600 group-hover:text-purple-400 transition-colors" />
                              </div>
                            )}
                          </td>
                          <td className="p-3 text-emerald-400 font-bold">
                            {(vid.watch_hours || 0).toFixed(1)}h
                          </td>
                          <td className="p-3 font-semibold text-slate-300">
                            {vid.price > 0 ? `${Number(vid.price).toLocaleString()} RWF` : 'Free'}
                          </td>
                          <td className="p-3 text-right">
                            <button
                              onClick={() => handleDeleteUserVideo(vid.id, vid.title)}
                              className="p-1.5 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                              title="Delete Video"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Bottom Actions: Suspend and Delete */}
            <div className="flex items-center justify-between pt-4 border-t border-slate-800">
              <button
                onClick={handleToggleSuspend}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                  data.user?.is_suspended
                    ? 'bg-blue-600/20 text-blue-300 border border-blue-500/30 hover:bg-blue-600/30'
                    : 'bg-amber-600/20 text-amber-300 border border-amber-500/30 hover:bg-amber-600/30'
                }`}
              >
                <Ban className="w-3.5 h-3.5" />
                <span>{data.user?.is_suspended ? 'Unsuspend Account' : 'Suspend Account'}</span>
              </button>

              <button
                onClick={handleDeleteUser}
                className="px-4 py-2 rounded-xl bg-rose-600/20 hover:bg-rose-600/30 text-rose-300 border border-rose-500/30 text-xs font-bold transition-all flex items-center gap-1.5"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Delete User Completely</span>
              </button>
            </div>

          </div>
        ) : null}

      </div>
    </div>
  );
};
