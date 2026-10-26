import React, { useState, useEffect } from 'react';
import {
  Wallet,
  CheckCircle2,
  XCircle,
  Clock,
  Search,
  Filter,
  DollarSign,
  AlertTriangle,
  RefreshCw,
  Phone,
  User,
  ShieldCheck,
  Check,
  X
} from 'lucide-react';
import { getAuthToken } from '../../services/api';

export const AdminDepositsPanel: React.FC = () => {
  const [deposits, setDeposits] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [filter, setFilter] = useState<'all' | 'pending' | 'completed' | 'rejected'>('all');
  const [search, setSearch] = useState<string>('');
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [rejectModal, setRejectModal] = useState<{ txRef: string; userName: string; amount: number } | null>(null);
  const [rejectReason, setRejectReason] = useState<string>('');
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const fetchDeposits = async () => {
    setLoading(true);
    try {
      const token = getAuthToken();
      const res = await fetch('/api/admin/deposits', {
        headers: token ? { Authorization: `Bearer ${token}` } : {}
      });
      const data = await res.json();
      if (data.deposits) {
        setDeposits(data.deposits);
      }
    } catch (err: any) {
      console.error('Failed to load deposits:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDeposits();
  }, []);

  const handleApprove = async (txRef: string) => {
    if (!confirm('Are you sure you want to approve this deposit and credit the user\'s wallet?')) return;
    setActionLoading(txRef);
    try {
      const token = getAuthToken();
      const res = await fetch(`/api/admin/deposits/${encodeURIComponent(txRef)}/approve`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        }
      });
      const data = await res.json();
      if (res.ok) {
        setStatusMessage({ type: 'success', text: `Deposit ${txRef} approved and credited successfully!` });
        fetchDeposits();
      } else {
        setStatusMessage({ type: 'error', text: data.error || 'Failed to approve deposit' });
      }
    } catch (err: any) {
      setStatusMessage({ type: 'error', text: err.message || 'Error communicating with server' });
    } finally {
      setActionLoading(null);
      setTimeout(() => setStatusMessage(null), 5000);
    }
  };

  const handleRejectSubmit = async () => {
    if (!rejectModal) return;
    setActionLoading(rejectModal.txRef);
    try {
      const token = getAuthToken();
      const res = await fetch(`/api/admin/deposits/${encodeURIComponent(rejectModal.txRef)}/reject`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
        body: JSON.stringify({ reason: rejectReason })
      });
      const data = await res.json();
      if (res.ok) {
        setStatusMessage({ type: 'success', text: `Deposit ${rejectModal.txRef} was marked as rejected.` });
        setRejectModal(null);
        setRejectReason('');
        fetchDeposits();
      } else {
        setStatusMessage({ type: 'error', text: data.error || 'Failed to reject deposit' });
      }
    } catch (err: any) {
      setStatusMessage({ type: 'error', text: err.message || 'Error communicating with server' });
    } finally {
      setActionLoading(null);
      setTimeout(() => setStatusMessage(null), 5000);
    }
  };

  const filtered = deposits.filter((d) => {
    if (filter !== 'all' && d.status?.toLowerCase() !== filter) return false;
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      (d.tx_ref && d.tx_ref.toLowerCase().includes(q)) ||
      (d.user_name && d.user_name.toLowerCase().includes(q)) ||
      (d.user_email && d.user_email.toLowerCase().includes(q)) ||
      (d.phone && d.phone.toLowerCase().includes(q)) ||
      (d.provider && d.provider.toLowerCase().includes(q))
    );
  });

  const pendingCount = deposits.filter((d) => d.status?.toLowerCase() === 'pending').length;
  const completedCount = deposits.filter((d) => d.status?.toLowerCase() === 'completed').length;
  const totalVolume = deposits
    .filter((d) => d.status?.toLowerCase() === 'completed')
    .reduce((acc, curr) => acc + (Number(curr.amount) || 0), 0);

  return (
    <div className="space-y-6">
      {/* Header & Stats Cards */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Wallet className="w-5 h-5 text-emerald-400" />
            Deposit Approvals & Management
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Review user payment requests, verify mobile money / card transfers, and manually credit or reject deposits.
          </p>
        </div>
        <button
          onClick={fetchDeposits}
          disabled={loading}
          className="inline-flex items-center gap-2 px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl text-xs font-medium transition"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          Refresh
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

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 rounded-2xl bg-amber-500/5 border border-amber-500/20">
          <div className="flex items-center justify-between text-xs text-amber-400 mb-1">
            <span className="font-medium">Pending Approvals</span>
            <Clock className="w-4 h-4" />
          </div>
          <div className="text-2xl font-bold text-amber-300">{pendingCount}</div>
          <p className="text-[11px] text-amber-500/80 mt-1">Awaiting manual or webhook verification</p>
        </div>

        <div className="p-4 rounded-2xl bg-emerald-500/5 border border-emerald-500/20">
          <div className="flex items-center justify-between text-xs text-emerald-400 mb-1">
            <span className="font-medium">Completed Deposits</span>
            <CheckCircle2 className="w-4 h-4" />
          </div>
          <div className="text-2xl font-bold text-emerald-300">{completedCount}</div>
          <p className="text-[11px] text-emerald-500/80 mt-1">Successfully credited to user wallets</p>
        </div>

        <div className="p-4 rounded-2xl bg-sky-500/5 border border-sky-500/20">
          <div className="flex items-center justify-between text-xs text-sky-400 mb-1">
            <span className="font-medium">Total Credited Volume</span>
            <DollarSign className="w-4 h-4" />
          </div>
          <div className="text-2xl font-bold text-sky-300">
            {totalVolume.toLocaleString()} <span className="text-xs text-slate-400 font-normal">RWF</span>
          </div>
          <p className="text-[11px] text-sky-500/80 mt-1">Gross lifetime deposits credited</p>
        </div>
      </div>

      {/* Filter Tabs & Search Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-1.5 p-1 bg-slate-900 border border-slate-800 rounded-xl">
          {(['all', 'pending', 'completed', 'rejected'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setFilter(tab)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium capitalize transition ${
                filter === tab
                  ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        <div className="relative w-full sm:w-64">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-500" />
          <input
            type="text"
            placeholder="Search by user, ref, phone..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500/50"
          />
        </div>
      </div>

      {/* Deposits Table */}
      <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl overflow-hidden backdrop-blur-sm">
        {loading ? (
          <div className="p-8 text-center text-slate-400 text-xs">
            <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2 text-amber-400" />
            Loading deposit records...
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-8 text-center text-slate-500 text-xs">
            No deposits found matching the active filter.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950/60 text-slate-400 border-b border-slate-800">
                <tr>
                  <th className="py-3 px-4 font-medium">User / Customer</th>
                  <th className="py-3 px-4 font-medium">Tx Ref / Provider</th>
                  <th className="py-3 px-4 font-medium">Amount</th>
                  <th className="py-3 px-4 font-medium">Date</th>
                  <th className="py-3 px-4 font-medium">Status</th>
                  <th className="py-3 px-4 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {filtered.map((dep) => {
                  const isPending = dep.status?.toLowerCase() === 'pending';
                  const isCompleted = dep.status?.toLowerCase() === 'completed';
                  const isRejected = dep.status?.toLowerCase() === 'rejected';

                  return (
                    <tr key={dep.id || dep.tx_ref} className="hover:bg-slate-800/30 transition">
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-300 font-semibold">
                            {(dep.user_name || dep.user_email || 'U')[0].toUpperCase()}
                          </div>
                          <div>
                            <div className="font-semibold text-white">{dep.user_name || 'Anonymous User'}</div>
                            <div className="text-[11px] text-slate-400">{dep.user_email || 'No email provided'}</div>
                            {dep.phone && (
                              <div className="text-[10px] text-amber-400/90 flex items-center gap-1 mt-0.5">
                                <Phone className="w-2.5 h-2.5" /> {dep.phone}
                              </div>
                            )}
                          </div>
                        </div>
                      </td>

                      <td className="py-3 px-4">
                        <div className="font-mono text-slate-300 text-[11px]">{dep.tx_ref}</div>
                        <div className="text-[10px] text-slate-500 uppercase mt-0.5">{dep.provider || 'MTN / Airtel'}</div>
                      </td>

                      <td className="py-3 px-4">
                        <span className="font-bold text-emerald-400 text-sm">
                          {Number(dep.amount).toLocaleString()}
                        </span>{' '}
                        <span className="text-[10px] text-slate-400">{dep.currency || 'RWF'}</span>
                      </td>

                      <td className="py-3 px-4 text-slate-400 text-[11px]">
                        {new Date(dep.created_at).toLocaleString()}
                      </td>

                      <td className="py-3 px-4">
                        {isPending && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-medium bg-amber-500/10 text-amber-400 border border-amber-500/30">
                            <Clock className="w-3 h-3" /> Pending Review
                          </span>
                        )}
                        {isCompleted && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                            <CheckCircle2 className="w-3 h-3" /> Approved & Credited
                          </span>
                        )}
                        {isRejected && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-medium bg-rose-500/10 text-rose-400 border border-rose-500/30">
                            <XCircle className="w-3 h-3" /> Rejected
                          </span>
                        )}
                      </td>

                      <td className="py-3 px-4 text-right">
                        {isPending ? (
                          <div className="inline-flex items-center gap-1.5">
                            <button
                              onClick={() => handleApprove(dep.tx_ref)}
                              disabled={actionLoading === dep.tx_ref}
                              className="px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-[11px] font-medium transition inline-flex items-center gap-1 disabled:opacity-50"
                              title="Approve deposit and credit user wallet"
                            >
                              <Check className="w-3 h-3" /> Approve
                            </button>
                            <button
                              onClick={() => setRejectModal({ txRef: dep.tx_ref, userName: dep.user_name || dep.user_email || 'User', amount: dep.amount })}
                              disabled={actionLoading === dep.tx_ref}
                              className="px-2.5 py-1.5 bg-rose-950 hover:bg-rose-900 border border-rose-800 text-rose-300 rounded-lg text-[11px] font-medium transition inline-flex items-center gap-1 disabled:opacity-50"
                              title="Reject deposit"
                            >
                              <X className="w-3 h-3" /> Reject
                            </button>
                          </div>
                        ) : (
                          <span className="text-[11px] text-slate-500">Processed</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Reject Modal */}
      {rejectModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="text-base font-bold text-rose-400 flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-rose-400" />
                Reject Deposit Request
              </h3>
              <button
                onClick={() => setRejectModal(null)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-300">
              You are about to reject the deposit of{' '}
              <strong className="text-white">{rejectModal.amount?.toLocaleString()} RWF</strong> from{' '}
              <strong className="text-white">{rejectModal.userName}</strong> (Ref: {rejectModal.txRef}).
            </p>

            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">
                Reason for Rejection (optional)
              </label>
              <textarea
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder="e.g., Transaction ID not found on MTN MoMo statement, invalid screenshot..."
                rows={3}
                className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-rose-500/50"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setRejectModal(null)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-medium"
              >
                Cancel
              </button>
              <button
                onClick={handleRejectSubmit}
                disabled={actionLoading === rejectModal.txRef}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 disabled:opacity-50"
              >
                {actionLoading === rejectModal.txRef ? 'Rejecting...' : 'Confirm Rejection'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
