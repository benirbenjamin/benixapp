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
  X,
  Send,
  Building,
  Smartphone,
  Percent,
  ExternalLink,
  ChevronDown
} from 'lucide-react';
import { getAuthToken } from '../../services/api';

interface WithdrawalRecord {
  id: string;
  user_id: string;
  user_name?: string;
  user_email?: string;
  user_phone?: string;
  user_role?: string;
  amount: number | string;
  currency: string;
  payout_method: string;
  account_details: any;
  status: 'PENDING' | 'COMPLETED' | 'REJECTED' | 'PARTIAL' | string;
  fee_percent?: number | string;
  fee_deducted?: number | string;
  net_amount?: number | string;
  is_partial?: boolean;
  flutterwave_ref?: string;
  flutterwave_status?: string;
  admin_note?: string;
  created_at: string;
  updated_at: string;
}

interface WithdrawalStats {
  totalUserWithdrawn: number;
  totalAdminWithdrawn: number;
  totalUserBalances: number;
  totalUserEarnings: number;
  flutterwaveBalance?: number;
  flutterwaveCurrency?: string;
}

export const AdminWithdrawalsPanel: React.FC = () => {
  const [withdrawals, setWithdrawals] = useState<WithdrawalRecord[]>([]);
  const [stats, setStats] = useState<WithdrawalStats>({
    totalUserWithdrawn: 0,
    totalAdminWithdrawn: 0,
    totalUserBalances: 0,
    totalUserEarnings: 0,
    flutterwaveBalance: 0,
    flutterwaveCurrency: 'RWF'
  });
  const [loading, setLoading] = useState<boolean>(true);
  const [filter, setFilter] = useState<'all' | 'pending' | 'completed' | 'rejected'>('all');
  const [search, setSearch] = useState<string>('');
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // Fee configuration state
  const [feePercent, setFeePercent] = useState<number>(3);
  const [savingFee, setSavingFee] = useState<boolean>(false);

  // Approve Modal State (Supports Partial Payout & Flutterwave Direct Transfer)
  const [approveModal, setApproveModal] = useState<WithdrawalRecord | null>(null);
  const [approvedAmount, setApprovedAmount] = useState<string>('');
  const [modalFeePercent, setModalFeePercent] = useState<number>(3);
  const [sendViaFlutterwave, setSendViaFlutterwave] = useState<boolean>(true);
  const [approvalNote, setApprovalNote] = useState<string>('');

  // Reject Modal State
  const [rejectModal, setRejectModal] = useState<WithdrawalRecord | null>(null);
  const [rejectReason, setRejectReason] = useState<string>('');

  // Topup Alert / Status Alert
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error' | 'warning'; text: string } | null>(null);

  const fetchWithdrawals = async () => {
    setLoading(true);
    try {
      const token = getAuthToken();
      const res = await fetch('/api/admin/withdrawals', {
        headers: token ? { Authorization: `Bearer ${token}` } : {}
      });
      const data = await res.json();
      if (data.withdrawals) {
        setWithdrawals(data.withdrawals);
      }
      if (data.kpi) {
        setStats(data.kpi);
      }
      if (data.settings?.defaultFeePercent !== undefined) {
        setFeePercent(Number(data.settings.defaultFeePercent));
        setModalFeePercent(Number(data.settings.defaultFeePercent));
      }
    } catch (err: any) {
      console.error('Failed to load withdrawals:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWithdrawals();
  }, []);

  const handleSaveFee = async () => {
    setSavingFee(true);
    try {
      const token = getAuthToken();
      const res = await fetch('/api/admin/withdrawals/settings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
        body: JSON.stringify({ feePercent })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setStatusMessage({ type: 'success', text: `Admin fee updated to ${feePercent}% successfully!` });
      } else {
        setStatusMessage({ type: 'error', text: data.error || 'Failed to update fee percentage' });
      }
    } catch (e: any) {
      setStatusMessage({ type: 'error', text: e.message || 'Network error' });
    } finally {
      setSavingFee(false);
      setTimeout(() => setStatusMessage(null), 4000);
    }
  };

  const openApproveModal = (w: WithdrawalRecord) => {
    setApproveModal(w);
    setApprovedAmount(String(w.amount));
    setModalFeePercent(feePercent);
    setSendViaFlutterwave(true);
    setApprovalNote('');
  };

  const handleApproveSubmit = async () => {
    if (!approveModal) return;
    const reqAmount = Number(approveModal.amount);
    const appAmount = parseFloat(approvedAmount);

    if (!appAmount || appAmount <= 0 || appAmount > reqAmount) {
      alert(`Approved amount must be between 1 and ${reqAmount.toLocaleString()} RWF.`);
      return;
    }

    setActionLoading(approveModal.id);
    try {
      const token = getAuthToken();
      const res = await fetch(`/api/admin/withdrawals/${encodeURIComponent(approveModal.id)}/approve`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
        body: JSON.stringify({
          approvedAmount: appAmount,
          feePercent: modalFeePercent,
          sendViaFlutterwave,
          note: approvalNote
        })
      });
      const data = await res.json();

      if (res.ok && data.success) {
        setStatusMessage({
          type: 'success',
          text: `Withdrawal #${approveModal.id} approved! Sent ${Number(data.netAmount).toLocaleString()} RWF (Fee: ${Number(data.feeDeducted).toLocaleString()} RWF)${data.refundedToUser ? ` • ${Number(data.refundedToUser).toLocaleString()} RWF refunded for partial approval` : ''}.`
        });
        setApproveModal(null);
        fetchWithdrawals();
      } else {
        // Highlighting topup warning if Flutterwave balance is low
        const isTopupNeeded = data?.error && (data.error.includes('Flutterwave account needs topup') || data.error.includes('topup') || data.error.includes('Insufficient funds'));
        setStatusMessage({
          type: isTopupNeeded ? 'warning' : 'error',
          text: data.error || 'Failed to approve withdrawal.'
        });
      }
    } catch (err: any) {
      setStatusMessage({ type: 'error', text: err.message || 'Error communicating with server' });
    } finally {
      setActionLoading(null);
      setTimeout(() => setStatusMessage(null), 8000);
    }
  };

  const handleRejectSubmit = async () => {
    if (!rejectModal) return;
    setActionLoading(rejectModal.id);
    try {
      const token = getAuthToken();
      const res = await fetch(`/api/admin/withdrawals/${encodeURIComponent(rejectModal.id)}/reject`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
        body: JSON.stringify({ reason: rejectReason })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setStatusMessage({
          type: 'success',
          text: `Withdrawal #${rejectModal.id} rejected. ${Number(rejectModal.amount).toLocaleString()} RWF was fully refunded back to user's wallet.`
        });
        setRejectModal(null);
        setRejectReason('');
        fetchWithdrawals();
      } else {
        setStatusMessage({ type: 'error', text: data.error || 'Failed to reject withdrawal' });
      }
    } catch (err: any) {
      setStatusMessage({ type: 'error', text: err.message || 'Error communicating with server' });
    } finally {
      setActionLoading(null);
      setTimeout(() => setStatusMessage(null), 5000);
    }
  };

  // Helper to extract account details cleanly
  const parseDetails = (details: any) => {
    if (!details) return { number: 'N/A', name: 'N/A', bank: '' };
    if (typeof details === 'string') {
      try {
        details = JSON.parse(details);
      } catch {
        return { number: details, name: 'N/A', bank: '' };
      }
    }
    return {
      number: details.accountNumber || details.phone || details.number || 'N/A',
      name: details.accountName || details.name || details.holder || 'N/A',
      bank: details.bankName || details.bank || ''
    };
  };

  // Filtering
  const filteredWithdrawals = withdrawals.filter((w) => {
    const st = (w.status || '').toLowerCase();
    if (filter === 'pending' && st !== 'pending') return false;
    if (filter === 'completed' && st !== 'completed' && st !== 'partial') return false;
    if (filter === 'rejected' && st !== 'rejected') return false;

    if (search.trim()) {
      const q = search.toLowerCase();
      const d = parseDetails(w.account_details);
      const matchName = (w.user_name || '').toLowerCase().includes(q);
      const matchEmail = (w.user_email || '').toLowerCase().includes(q);
      const matchPhone = (w.user_phone || '').toLowerCase().includes(q);
      const matchAccNum = String(d.number).toLowerCase().includes(q);
      const matchAccName = String(d.name).toLowerCase().includes(q);
      const matchId = String(w.id).toLowerCase().includes(q);
      return matchName || matchEmail || matchPhone || matchAccNum || matchAccName || matchId;
    }
    return true;
  });

  // Calculate live preview in approve modal
  const modalApprovedNum = parseFloat(approvedAmount) || 0;
  const modalFeeDeducted = Math.round(modalApprovedNum * (modalFeePercent / 100));
  const modalNetReceived = Math.max(0, modalApprovedNum - modalFeeDeducted);
  const modalRefundRemaining = approveModal ? Math.max(0, Number(approveModal.amount) - modalApprovedNum) : 0;

  return (
    <div className="space-y-6">
      {/* Status & Alerts Bar */}
      {statusMessage && (
        <div
          className={`p-4 rounded-2xl flex items-center justify-between gap-3 text-sm font-bold shadow-lg animate-fade-in ${
            statusMessage.type === 'success'
              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
              : statusMessage.type === 'warning'
              ? 'bg-amber-500/20 text-amber-300 border border-amber-500/50'
              : 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
          }`}
        >
          <div className="flex items-center gap-2.5">
            {statusMessage.type === 'success' ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
            ) : (
              <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0" />
            )}
            <span>{statusMessage.text}</span>
          </div>
          <button
            onClick={() => setStatusMessage(null)}
            className="p-1 hover:bg-black/20 rounded-lg text-slate-400 hover:text-white"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* TOP HEADER & ADMIN FEE PERCENTAGE CONTROL */}
      <div className="bg-[#111724] border border-slate-800 rounded-3xl p-6 shadow-xl space-y-6">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2.5">
              <span className="p-2.5 rounded-2xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                <Wallet className="w-6 h-6" />
              </span>
              <div>
                <h2 className="text-xl font-black text-white tracking-tight">
                  Withdrawal & Payouts Management Console
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  Approve full or partial withdrawals, deduct platform fees, and send instant payouts directly via Flutterwave MoMo.
                </p>
              </div>
            </div>
          </div>

          {/* Admin Percentage Fee Input Bar */}
          <div className="flex items-center gap-2.5 bg-[#0B0E14] border border-slate-700/80 p-2 rounded-2xl self-start lg:self-auto">
            <div className="flex items-center gap-1.5 px-2">
              <Percent className="w-4 h-4 text-amber-400" />
              <span className="text-xs font-extrabold text-slate-300 whitespace-nowrap">Platform Fee:</span>
            </div>
            <div className="relative">
              <input
                type="number"
                step="0.5"
                min="0"
                max="50"
                value={feePercent}
                onChange={(e) => setFeePercent(parseFloat(e.target.value) || 0)}
                className="w-20 px-3 py-1.5 rounded-xl bg-[#161D2E] border border-slate-700 text-white font-black text-sm text-center focus:outline-none focus:border-amber-400"
              />
              <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">%</span>
            </div>
            <button
              onClick={handleSaveFee}
              disabled={savingFee}
              className="px-3.5 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs transition shadow-md disabled:opacity-50"
            >
              {savingFee ? 'Saving...' : 'Set Fee %'}
            </button>
          </div>
        </div>

        {/* 4 SUMMARY KPI CARDS */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-2">
          {/* 1. Total Amount Users Withdrew */}
          <div className="p-4 rounded-2xl bg-[#161D2E]/90 border border-slate-800 space-y-1.5 shadow-sm">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
              Total Users Withdrawn
            </span>
            <div className="flex items-baseline gap-1.5">
              <span className="text-2xl font-black text-emerald-400">
                {Number(stats.totalUserWithdrawn || 0).toLocaleString()}
              </span>
              <span className="text-xs font-bold text-emerald-500/80">RWF</span>
            </div>
            <p className="text-[10px] text-slate-500">All-time approved payouts to user wallets</p>
          </div>

          {/* 2. Total What Admin Already Withdrew */}
          <div className="p-4 rounded-2xl bg-[#161D2E]/90 border border-slate-800 space-y-1.5 shadow-sm">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
              Admin Total Withdrawn
            </span>
            <div className="flex items-baseline gap-1.5">
              <span className="text-2xl font-black text-indigo-400">
                {Number(stats.totalAdminWithdrawn || 0).toLocaleString()}
              </span>
              <span className="text-xs font-bold text-indigo-500/80">RWF</span>
            </div>
            <p className="text-[10px] text-slate-500">All-time payouts executed by admin accounts</p>
          </div>

          {/* 3. Total of All Users Account Balance (Not Withdrew) */}
          <div className="p-4 rounded-2xl bg-[#161D2E]/90 border border-slate-800 space-y-1.5 shadow-sm">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
              Unwithdrawn User Balances
            </span>
            <div className="flex items-baseline gap-1.5">
              <span className="text-2xl font-black text-sky-400">
                {Number(stats.totalUserBalances || 0).toLocaleString()}
              </span>
              <span className="text-xs font-bold text-sky-500/80">RWF</span>
            </div>
            <p className="text-[10px] text-slate-500">Total liquid balance currently in user accounts</p>
          </div>

          {/* 4. Total User Earnings in System */}
          <div className="p-4 rounded-2xl bg-[#161D2E]/90 border border-slate-800 space-y-1.5 shadow-sm">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
              Total Platform Earnings
            </span>
            <div className="flex items-baseline gap-1.5">
              <span className="text-2xl font-black text-amber-400">
                {Number(stats.totalUserEarnings || 0).toLocaleString()}
              </span>
              <span className="text-xs font-bold text-amber-500/80">RWF</span>
            </div>
            <p className="text-[10px] text-slate-500">Total monetization & rewards generated</p>
          </div>
        </div>

        {/* Flutterwave Live Balance Strip */}
        <div className="p-3.5 rounded-2xl bg-[#0B0E14] border border-blue-500/30 flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-xs font-extrabold text-white">Flutterwave Payout Balance:</span>
            <span className="text-sm font-black text-emerald-400">
              {Number(stats.flutterwaveBalance || 0).toLocaleString()} {stats.flutterwaveCurrency || 'RWF'}
            </span>
          </div>
          <span className="text-[11px] text-slate-400">
            If balance is low when approving, top up on your Flutterwave dashboard to execute payouts.
          </span>
        </div>
      </div>

      {/* FILTER & SEARCH CONTROLS */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        {/* Status Filters */}
        <div className="flex items-center gap-2 bg-[#111724] p-1 rounded-2xl border border-slate-800 self-start sm:self-auto overflow-x-auto w-full sm:w-auto">
          {[
            { id: 'all', label: 'All Requests' },
            { id: 'pending', label: 'Pending Approval' },
            { id: 'completed', label: 'Completed' },
            { id: 'rejected', label: 'Rejected' }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setFilter(tab.id as any)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition whitespace-nowrap ${
                filter === tab.id
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Search & Refresh */}
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-64">
            <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search user, phone, account..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 rounded-xl bg-[#111724] border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
            />
          </div>
          <button
            onClick={fetchWithdrawals}
            className="p-2.5 rounded-xl bg-[#111724] hover:bg-slate-800 border border-slate-800 text-slate-300 transition"
            title="Refresh Withdrawals"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* WITHDRAWAL REQUESTS TABLE */}
      <div className="rounded-3xl bg-[#111724] border border-slate-800 overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-800 bg-[#0B0E14]/80 text-[10px] font-black uppercase tracking-wider text-slate-400">
                <th className="py-3 px-4">User</th>
                <th className="py-3 px-4">Payout Method</th>
                <th className="py-3 px-4">Account Number & Name</th>
                <th className="py-3 px-4">Requested</th>
                <th className="py-3 px-4">Fee & Net Received</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Date</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-medium">
              {loading ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-500">
                    <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-blue-500" />
                    <span>Loading withdrawal requests...</span>
                  </td>
                </tr>
              ) : filteredWithdrawals.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-500">
                    No withdrawal requests matching filter.
                  </td>
                </tr>
              ) : (
                filteredWithdrawals.map((w) => {
                  const details = parseDetails(w.account_details);
                  const status = (w.status || 'PENDING').toUpperCase();
                  const isPending = status === 'PENDING';
                  const isCompleted = status === 'COMPLETED';
                  const isPartial = status === 'PARTIAL' || !!w.is_partial;
                  const isRejected = status === 'REJECTED';

                  const reqAmount = Number(w.amount || 0);
                  const feeDeducted = w.fee_deducted !== undefined ? Number(w.fee_deducted) : Math.round(reqAmount * (feePercent / 100));
                  const netAmount = w.net_amount !== undefined ? Number(w.net_amount) : Math.max(0, reqAmount - feeDeducted);

                  return (
                    <tr key={w.id} className="hover:bg-slate-800/30 transition">
                      {/* User */}
                      <td className="py-3 px-4">
                        <div className="flex flex-col">
                          <span className="font-extrabold text-white text-xs">{w.user_name || 'Benix User'}</span>
                          <span className="text-[11px] text-slate-400">{w.user_email || 'No email'}</span>
                          <span className="text-[10px] text-slate-500 font-mono">ID: {w.user_id}</span>
                        </div>
                      </td>

                      {/* Method */}
                      <td className="py-3 px-4">
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#161D2E] border border-slate-700/80 font-bold text-slate-300">
                          {w.payout_method === 'BANK' ? (
                            <Building className="w-3 h-3 text-indigo-400" />
                          ) : (
                            <Smartphone className="w-3 h-3 text-amber-400" />
                          )}
                          <span>{w.payout_method || 'MTN_MOMO'}</span>
                        </span>
                      </td>

                      {/* Account Number & Name */}
                      <td className="py-3 px-4">
                        <div className="flex flex-col">
                          <span className="font-mono font-bold text-white text-xs tracking-wide">
                            {details.number}
                          </span>
                          <span className="text-[11px] text-slate-300 font-semibold">{details.name}</span>
                          {details.bank && (
                            <span className="text-[10px] text-slate-500">{details.bank}</span>
                          )}
                        </div>
                      </td>

                      {/* Requested Amount */}
                      <td className="py-3 px-4">
                        <span className="font-black text-amber-400 text-sm">
                          {reqAmount.toLocaleString()} <span className="text-[10px]">RWF</span>
                        </span>
                      </td>

                      {/* Fee & Net Received */}
                      <td className="py-3 px-4">
                        <div className="flex flex-col">
                          <span className="font-black text-emerald-400 text-sm">
                            {netAmount.toLocaleString()} <span className="text-[10px]">RWF</span>
                          </span>
                          <span className="text-[10px] text-slate-400">
                            Fee ({w.fee_percent || feePercent}%): -{feeDeducted.toLocaleString()} RWF
                          </span>
                        </div>
                      </td>

                      {/* Status */}
                      <td className="py-3 px-4">
                        {isPending && (
                          <span className="px-2.5 py-1 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 font-black text-[10px] uppercase">
                            Pending Approval
                          </span>
                        )}
                        {isCompleted && !isPartial && (
                          <span className="px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-black text-[10px] uppercase">
                            Completed
                          </span>
                        )}
                        {isPartial && (
                          <span className="px-2.5 py-1 rounded-full bg-sky-500/20 text-sky-300 border border-sky-500/40 font-black text-[10px] uppercase">
                            Partial Paid
                          </span>
                        )}
                        {isRejected && (
                          <span className="px-2.5 py-1 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/40 font-black text-[10px] uppercase">
                            Rejected & Refunded
                          </span>
                        )}
                      </td>

                      {/* Date */}
                      <td className="py-3 px-4 text-slate-400 text-[11px] whitespace-nowrap">
                        {w.created_at ? new Date(w.created_at).toLocaleDateString() : 'Recent'}
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-4 text-right">
                        {isPending ? (
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => openApproveModal(w)}
                              disabled={actionLoading === w.id}
                              className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs transition shadow-md flex items-center gap-1 cursor-pointer disabled:opacity-50"
                            >
                              <Check className="w-3.5 h-3.5" />
                              <span>Approve</span>
                            </button>
                            <button
                              onClick={() => setRejectModal(w)}
                              disabled={actionLoading === w.id}
                              className="px-3 py-1.5 rounded-xl bg-rose-600/30 hover:bg-rose-600 text-rose-300 hover:text-white border border-rose-600/40 font-black text-xs transition cursor-pointer disabled:opacity-50"
                            >
                              <X className="w-3.5 h-3.5" />
                              <span>Reject</span>
                            </button>
                          </div>
                        ) : (
                          <span className="text-[11px] text-slate-500 italic">
                            {w.admin_note || (isCompleted ? 'Processed' : 'Closed')}
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* APPROVE & PAYOUT MODAL (FULL OR PARTIAL WITH FLUTTERWAVE DIRECT TRANSFER) */}
      {approveModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-in fade-in duration-200">
          <div className="relative max-w-md w-full bg-[#111724] border border-emerald-500/40 rounded-3xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <span className="p-2 rounded-xl bg-emerald-500/20 text-emerald-400">
                  <Check className="w-5 h-5" />
                </span>
                <h3 className="text-base font-black text-white">Approve & Send Withdrawal</h3>
              </div>
              <button
                onClick={() => setApproveModal(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Recipient Details */}
            {(() => {
              const d = parseDetails(approveModal.account_details);
              return (
                <div className="p-3.5 rounded-2xl bg-[#0B0E14] border border-slate-800 space-y-1.5 text-xs">
                  <div className="flex justify-between">
                    <span className="text-slate-400">User:</span>
                    <span className="font-bold text-white">{approveModal.user_name || approveModal.user_email}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Payout Channel:</span>
                    <span className="font-bold text-amber-400">{approveModal.payout_method}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Account / Phone:</span>
                    <span className="font-mono font-bold text-emerald-400">{d.number}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Account Name:</span>
                    <span className="font-bold text-white">{d.name}</span>
                  </div>
                  <div className="flex justify-between pt-1 border-t border-slate-800/80">
                    <span className="text-slate-400">Requested Amount:</span>
                    <span className="font-black text-white text-sm">{Number(approveModal.amount).toLocaleString()} RWF</span>
                  </div>
                </div>
              );
            })()}

            {/* Adjustable Approved Amount (Supports Partial Payout) */}
            <div className="space-y-1.5">
              <label className="text-xs font-extrabold uppercase tracking-wider text-slate-300 block">
                Approved Amount (RWF)
              </label>
              <input
                type="number"
                value={approvedAmount}
                onChange={(e) => setApprovedAmount(e.target.value)}
                max={Number(approveModal.amount)}
                className="w-full px-4 py-2.5 rounded-xl bg-[#161D2E] border border-slate-700 text-white font-black text-sm focus:outline-none focus:border-emerald-400"
              />
              {modalRefundRemaining > 0 && (
                <p className="text-[11px] text-sky-400 font-bold">
                  ℹ️ Partial Approval: Remaining {modalRefundRemaining.toLocaleString()} RWF will be instantly refunded to user wallet.
                </p>
              )}
            </div>

            {/* Fee Percentage & Net Received Calculation */}
            <div className="p-3.5 rounded-2xl bg-[#161D2E] border border-slate-800 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-400">Deduct Fee Percentage:</span>
                <div className="flex items-center gap-1.5">
                  <input
                    type="number"
                    step="0.5"
                    min="0"
                    max="50"
                    value={modalFeePercent}
                    onChange={(e) => setModalFeePercent(parseFloat(e.target.value) || 0)}
                    className="w-16 px-2 py-1 rounded-lg bg-[#0B0E14] border border-slate-700 text-white font-bold text-xs text-center focus:outline-none focus:border-amber-400"
                  />
                  <span className="text-xs font-bold text-slate-400">%</span>
                </div>
              </div>

              <div className="flex items-center justify-between text-xs text-slate-400 pt-1 border-t border-slate-800">
                <span>Fee Amount Deducted:</span>
                <span className="font-bold text-rose-400">-{modalFeeDeducted.toLocaleString()} RWF</span>
              </div>

              <div className="flex items-center justify-between text-sm pt-1 border-t border-slate-800">
                <span className="font-bold text-white">Final Amount Received by User:</span>
                <span className="font-black text-emerald-400 text-base">
                  {modalNetReceived.toLocaleString()} RWF
                </span>
              </div>
            </div>

            {/* Flutterwave Direct Transfer Option */}
            <label className="flex items-center gap-2.5 p-3 rounded-xl bg-[#0B0E14] border border-slate-800 cursor-pointer hover:border-slate-700 transition">
              <input
                type="checkbox"
                checked={sendViaFlutterwave}
                onChange={(e) => setSendViaFlutterwave(e.target.checked)}
                className="w-4 h-4 rounded text-blue-600 focus:ring-0"
              />
              <div className="text-xs">
                <span className="font-bold text-white block">Send directly via Flutterwave Transfer</span>
                <span className="text-[10px] text-slate-400 block">
                  Debits from Flutterwave account balance and sends with "BenixSpace" sender text.
                </span>
              </div>
            </label>

            {/* Note */}
            <div>
              <input
                type="text"
                placeholder="Optional admin note / transaction reference"
                value={approvalNote}
                onChange={(e) => setApprovalNote(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl bg-[#161D2E] border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-400"
              />
            </div>

            {/* Action Buttons */}
            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                onClick={() => setApproveModal(null)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs transition"
              >
                Cancel
              </button>
              <button
                onClick={handleApproveSubmit}
                disabled={actionLoading === approveModal.id}
                className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs transition shadow-lg flex items-center gap-1.5 disabled:opacity-50"
              >
                <Send className="w-3.5 h-3.5" />
                <span>{actionLoading === approveModal.id ? 'Processing...' : 'Confirm & Payout'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* REJECT WITHDRAWAL MODAL (FULL REFUND TO USER WALLET) */}
      {rejectModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-in fade-in duration-200">
          <div className="relative max-w-sm w-full bg-[#111724] border border-rose-500/40 rounded-3xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2 text-rose-400">
                <XCircle className="w-5 h-5" />
                <h3 className="text-base font-black text-white">Reject Withdrawal</h3>
              </div>
              <button onClick={() => setRejectModal(null)} className="p-1 rounded-lg text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              Are you sure you want to reject withdrawal of{' '}
              <strong className="text-white">{Number(rejectModal.amount).toLocaleString()} RWF</strong> for{' '}
              <strong className="text-white">{rejectModal.user_name || rejectModal.user_email}</strong>?
            </p>
            <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-[11px] text-emerald-300 font-bold">
              ✅ The full amount of {Number(rejectModal.amount).toLocaleString()} RWF will be instantly refunded to the user's wallet.
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-400 block">Rejection Reason (Sent to User)</label>
              <textarea
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder="e.g. Invalid account number or holder name mismatch"
                rows={3}
                className="w-full p-3 rounded-xl bg-[#161D2E] border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-rose-400 resize-none"
              />
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                onClick={() => setRejectModal(null)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs transition"
              >
                Cancel
              </button>
              <button
                onClick={handleRejectSubmit}
                disabled={actionLoading === rejectModal.id}
                className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-black text-xs transition shadow-lg disabled:opacity-50"
              >
                {actionLoading === rejectModal.id ? 'Refunding...' : 'Confirm Rejection'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
