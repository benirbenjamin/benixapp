import React, { useState, useEffect } from 'react';
import {
  ArrowLeft,
  User,
  Wallet,
  Shield,
  Film,
  Award,
  CheckCircle2,
  XCircle,
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
  DollarSign,
  ArrowDownLeft,
  ArrowUpRight,
  RefreshCw,
  Search,
  Filter,
  Phone,
  Mail,
  Calendar,
  X
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

  // Financial ledger filter
  const [txFilter, setTxFilter] = useState<'all' | 'deposits' | 'transfers' | 'earnings'>('all');
  const [txSearch, setTxSearch] = useState<string>('');

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

  const rawTransactions: any[] = data?.transactions || [];
  const rawDeposits: any[] = data?.deposits || [];

  // Filter combined audit entries
  const filteredTxs = rawTransactions.filter((tx) => {
    if (txFilter === 'deposits' && !tx.type?.toLowerCase().includes('deposit')) return false;
    if (txFilter === 'transfers' && !tx.type?.toLowerCase().includes('transfer') && !tx.type?.toLowerCase().includes('withdraw')) return false;
    if (txFilter === 'earnings' && !tx.type?.toLowerCase().includes('earning') && !tx.type?.toLowerCase().includes('bonus')) return false;
    if (!txSearch.trim()) return true;
    const q = txSearch.toLowerCase();
    return (
      (tx.reference || '').toLowerCase().includes(q) ||
      (tx.description || '').toLowerCase().includes(q) ||
      (tx.type || '').toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-6 animate-fade-in">
      
      {/* Top Navigation & Breadcrumbs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-3xl bg-[#0B0E14] border border-slate-800">
        <div className="flex items-center gap-3">
          <button
            onClick={onClose}
            className="p-2.5 rounded-2xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-300 hover:text-white transition-all flex items-center gap-2 text-xs font-bold shadow-md"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Users Directory</span>
          </button>
          <div className="h-6 w-px bg-slate-800" />
          <div>
            <h2 className="text-lg font-black text-white flex items-center gap-2">
              <span>{data?.user?.name || 'User Financial & Activity Profile'}</span>
              {data?.user?.is_verified && (
                <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                  Verified ✓
                </span>
              )}
            </h2>
            <p className="text-xs text-slate-400">
              {data?.user?.email} • ID: <span className="font-mono text-slate-300">{userId}</span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={fetchUserDetails}
            disabled={loading}
            className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition flex items-center gap-1.5"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
          <button
            onClick={handleToggleSuspend}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
              data?.user?.is_suspended
                ? 'bg-blue-600/20 text-blue-300 border border-blue-500/30 hover:bg-blue-600/30'
                : 'bg-amber-600/20 text-amber-300 border border-amber-500/30 hover:bg-amber-600/30'
            }`}
          >
            <Ban className="w-3.5 h-3.5" />
            <span>{data?.user?.is_suspended ? 'Unsuspend' : 'Suspend'}</span>
          </button>
        </div>
      </div>

      {/* Alerts */}
      {error && (
        <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs font-bold flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 shrink-0 text-rose-400" />
          <span>{error}</span>
        </div>
      )}

      {success && (
        <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs font-bold flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
          <span>{success}</span>
        </div>
      )}

      {loading ? (
        <div className="py-24 text-center text-slate-400 text-xs space-y-3 bg-[#0B0E14] rounded-3xl border border-slate-800">
          <div className="w-9 h-9 border-2 border-blue-400 border-t-transparent rounded-full animate-spin mx-auto" />
          <p>Loading full financial history, source of funds & user metrics...</p>
        </div>
      ) : data ? (
        <div className="space-y-6">

          {/* User Overview & Wallet Metrics */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            <div className="p-5 rounded-3xl bg-gradient-to-br from-[#121B2B] to-[#0B0E14] border border-blue-500/30 space-y-1 shadow-lg">
              <div className="flex items-center justify-between text-slate-400 text-[10px] font-bold uppercase">
                <span>Available Balance</span>
                <Wallet className="w-4 h-4 text-emerald-400" />
              </div>
              <div className="text-2xl font-black text-emerald-400">
                {Number(data.wallet?.balance || data.user?.wallet_balance || 0).toLocaleString()} <span className="text-xs font-normal">RWF</span>
              </div>
              <p className="text-[11px] text-slate-400">Central multi-app wallet</p>
            </div>

            <div className="p-5 rounded-3xl bg-[#0B0E14] border border-slate-800 space-y-1 shadow-lg">
              <div className="flex items-center justify-between text-slate-400 text-[10px] font-bold uppercase">
                <span>Bonus Balance</span>
                <Award className="w-4 h-4 text-amber-400" />
              </div>
              <div className="text-2xl font-black text-amber-400">
                {Number(data.wallet?.bonus_balance || data.user?.bonus_balance || 0).toLocaleString()} <span className="text-xs font-normal">RWF</span>
              </div>
              <p className="text-[11px] text-slate-400">Daily check-in & rewards</p>
            </div>

            <div className="p-5 rounded-3xl bg-[#0B0E14] border border-slate-800 space-y-1 shadow-lg">
              <div className="flex items-center justify-between text-slate-400 text-[10px] font-bold uppercase">
                <span>Lifetime Earnings</span>
                <DollarSign className="w-4 h-4 text-purple-400" />
              </div>
              <div className="text-2xl font-black text-purple-400">
                {Number(data.wallet?.total_earnings || 0).toLocaleString()} <span className="text-xs font-normal">RWF</span>
              </div>
              <p className="text-[11px] text-slate-400">Total creator/monetized income</p>
            </div>

            <div className="p-5 rounded-3xl bg-[#0B0E14] border border-slate-800 space-y-1 shadow-lg">
              <div className="flex items-center justify-between text-slate-400 text-[10px] font-bold uppercase">
                <span>Total Withdrawn</span>
                <ArrowUpRight className="w-4 h-4 text-slate-400" />
              </div>
              <div className="text-2xl font-black text-slate-200">
                {Number(data.wallet?.total_withdrawn || 0).toLocaleString()} <span className="text-xs font-normal text-slate-400">RWF</span>
              </div>
              <p className="text-[11px] text-slate-400">Paid out to MoMo / Bank</p>
            </div>
          </div>

          {/* User Contact & Metadata Row */}
          <div className="p-5 rounded-3xl bg-[#0B0E14] border border-slate-800 grid grid-cols-1 sm:grid-cols-4 gap-4 text-xs">
            <div>
              <span className="text-[10px] font-bold text-slate-500 uppercase block">Phone Number</span>
              <span className="text-slate-200 font-medium">{data.user?.phone || 'Not linked'}</span>
            </div>
            <div>
              <span className="text-[10px] font-bold text-slate-500 uppercase block">Account Role</span>
              <span className="text-slate-200 font-bold uppercase">{data.user?.role || 'USER'}</span>
            </div>
            <div>
              <span className="text-[10px] font-bold text-slate-500 uppercase block">Joined Date</span>
              <span className="text-slate-200 font-medium">{new Date(data.user?.created_at).toLocaleDateString()}</span>
            </div>
            <div>
              <span className="text-[10px] font-bold text-slate-500 uppercase block">Monetization Status</span>
              <span className="text-emerald-400 font-bold">{data.monetization?.is_monetized ? 'Monetized Partner' : 'Standard Account'}</span>
            </div>
          </div>

          {/* Full Transaction & Deposit History (SOURCE OF FUNDS AUDIT) */}
          <div className="p-6 rounded-3xl bg-[#0B0E14] border border-slate-800 space-y-5 shadow-xl">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
              <div>
                <h3 className="font-extrabold text-white text-base flex items-center gap-2">
                  <Clock className="w-5 h-5 text-emerald-400" />
                  <span>Full Financial Ledger & Source of Funds Audit</span>
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Complete history of all deposits, gateway references, peer transfers, and wallet deductions
                </p>
              </div>

              {/* Filters & Search */}
              <div className="flex flex-wrap items-center gap-2">
                <div className="flex items-center gap-1 p-1 bg-slate-900 border border-slate-800 rounded-xl text-xs">
                  {(['all', 'deposits', 'transfers', 'earnings'] as const).map((tab) => (
                    <button
                      key={tab}
                      onClick={() => setTxFilter(tab)}
                      className={`px-3 py-1.5 rounded-lg font-bold capitalize transition ${
                        txFilter === tab
                          ? 'bg-blue-600 text-white shadow'
                          : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      {tab}
                    </button>
                  ))}
                </div>

                <div className="relative">
                  <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Search reference, description..."
                    value={txSearch}
                    onChange={(e) => setTxSearch(e.target.value)}
                    className="bg-slate-900 border border-slate-800 text-xs rounded-xl pl-8 pr-3 py-1.5 text-white outline-none focus:border-blue-500 w-56"
                  />
                </div>
              </div>
            </div>

            {/* Flutterwave Deposit Audit Cards */}
            {rawDeposits.length > 0 && (
              <div className="space-y-3">
                <h4 className="text-xs font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Wallet className="w-3.5 h-3.5" />
                  <span>Flutterwave Gateway Deposit Records ({rawDeposits.length})</span>
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {rawDeposits.map((dep: any) => (
                    <div
                      key={dep.tx_ref}
                      className="p-3.5 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-2 text-xs"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-mono text-slate-300 font-bold truncate max-w-[200px]">
                          {dep.tx_ref}
                        </span>
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            dep.status === 'completed'
                              ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                              : dep.status === 'pending'
                              ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                              : 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                          }`}
                        >
                          {dep.status?.toUpperCase()}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-slate-400">Credited Volume:</span>
                        <span className="font-bold text-emerald-400 text-sm">
                          +{Number(dep.converted_rwf || dep.original_amount).toLocaleString()} RWF
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-slate-500 text-[11px]">
                        <span>Original: {dep.original_amount} {dep.currency}</span>
                        <span>{new Date(dep.created_at).toLocaleString()}</span>
                      </div>
                      {dep.flw_ref && (
                        <div className="text-[10px] text-slate-500 font-mono truncate">
                          Gateway Ref: {dep.flw_ref}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Wallet Transactions Table */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5" />
                <span>Wallet Ledger Transactions ({filteredTxs.length})</span>
              </h4>

              {filteredTxs.length === 0 ? (
                <div className="p-8 rounded-2xl bg-slate-900/40 border border-slate-800/80 text-center text-xs text-slate-500">
                  No wallet transactions match the current filter.
                </div>
              ) : (
                <div className="rounded-2xl border border-slate-800 overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-[#0B0E14] text-slate-400 font-bold border-b border-slate-800">
                      <tr>
                        <th className="p-3">Date & Time</th>
                        <th className="p-3">Reference</th>
                        <th className="p-3">Type / Source</th>
                        <th className="p-3">Description</th>
                        <th className="p-3">Amount</th>
                        <th className="p-3">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60 bg-[#0E1422]">
                      {filteredTxs.map((tx: any) => {
                        const isCredit = !tx.type?.toLowerCase().includes('deduct') && 
                                         !tx.type?.toLowerCase().includes('withdraw') && 
                                         !tx.type?.toLowerCase().includes('fee') &&
                                         !tx.type?.toLowerCase().includes('spent') &&
                                         !tx.type?.toLowerCase().includes('transfer_out');

                        return (
                          <tr key={tx.id || tx.reference} className="hover:bg-slate-800/40 transition">
                            <td className="p-3 text-slate-400 text-[11px] whitespace-nowrap">
                              {new Date(tx.created_at).toLocaleString()}
                            </td>
                            <td className="p-3 font-mono text-slate-300 text-[11px] whitespace-nowrap">
                              {tx.reference || tx.id}
                            </td>
                            <td className="p-3">
                              <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-slate-800 text-slate-300 border border-slate-700">
                                {tx.type}
                              </span>
                            </td>
                            <td className="p-3 text-white max-w-xs truncate" title={tx.description}>
                              {tx.description || 'Wallet transaction'}
                            </td>
                            <td className="p-3 font-bold whitespace-nowrap">
                              <span className={isCredit ? 'text-emerald-400' : 'text-rose-400'}>
                                {isCredit ? '+' : '-'}{Number(tx.amount).toLocaleString()} {tx.currency || 'RWF'}
                              </span>
                            </td>
                            <td className="p-3">
                              <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                tx.status?.toLowerCase() === 'completed'
                                  ? 'bg-emerald-500/20 text-emerald-400'
                                  : 'bg-amber-500/20 text-amber-400'
                              }`}>
                                {tx.status || 'completed'}
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
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
          <div className="space-y-3 p-5 rounded-3xl bg-[#0B0E14] border border-slate-800">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Film className="w-4 h-4 text-purple-400" />
                <h4 className="font-extrabold text-white text-xs uppercase tracking-wider">
                  Uploaded Videos & View Manipulation ({data.videos?.length || 0})
                </h4>
              </div>
            </div>

            {data.videos?.length === 0 ? (
              <div className="p-6 rounded-2xl bg-[#0E1422] border border-slate-800 text-center text-xs text-slate-500">
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
                                title="Save views"
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
          <div className="flex items-center justify-between p-5 rounded-3xl bg-[#0B0E14] border border-slate-800">
            <button
              onClick={handleToggleSuspend}
              className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
                data.user?.is_suspended
                  ? 'bg-blue-600/20 text-blue-300 border border-blue-500/30 hover:bg-blue-600/30'
                  : 'bg-amber-600/20 text-amber-300 border border-amber-500/30 hover:bg-amber-600/30'
              }`}
            >
              <Ban className="w-4 h-4" />
              <span>{data.user?.is_suspended ? 'Unsuspend Account' : 'Suspend Account'}</span>
            </button>

            <button
              onClick={handleDeleteUser}
              className="px-4 py-2.5 rounded-xl bg-rose-600/20 hover:bg-rose-600/30 text-rose-300 border border-rose-500/30 text-xs font-bold transition-all flex items-center gap-2"
            >
              <Trash2 className="w-4 h-4" />
              <span>Delete User Completely</span>
            </button>
          </div>

        </div>
      ) : null}

    </div>
  );
};
