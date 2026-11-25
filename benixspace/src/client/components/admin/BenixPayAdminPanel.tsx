import React, { useState, useEffect, useCallback } from 'react';
import {
  CreditCard,
  RefreshCw,
  Check,
  X,
  Search,
  ShieldCheck,
  ShieldAlert,
  ExternalLink,
  Users,
  Wallet,
  TrendingUp,
  Clock,
  CheckCircle2,
  XCircle,
  FileText
} from 'lucide-react';
import { getAuthToken } from '../../services/api';

interface BenixPayAdminStats {
  totalMerchants: number;
  liveMerchants: number;
  pendingKyc: number;
  totalTransactions: number;
  grossVolume: number;
  feeRevenue: number;
  netSettled: number;
  liveTransactions: number;
  liveGrossVolume: number;
  liveFeeRevenue: number;
}

export const BenixPayAdminPanel: React.FC = () => {
  const [stats, setStats] = useState<BenixPayAdminStats | null>(null);
  const [merchants, setMerchants] = useState<any[]>([]);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [txLoading, setTxLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [statusMsg, setStatusMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [kycActionId, setKycActionId] = useState<string | null>(null);
  const [kycNotes, setKycNotes] = useState('');

  const authHeaders = () => {
    const token = getAuthToken();
    return {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {})
    };
  };

  const loadStats = useCallback(async () => {
    try {
      const res = await fetch('/api/benixpay/admin/stats', { headers: authHeaders() });
      const data = await res.json();
      if (data.success) setStats(data.stats);
    } catch (err: any) {
      console.warn('Could not load Benix Pay stats:', err?.message);
    }
  }, []);

  const loadMerchants = useCallback(async () => {
    try {
      const res = await fetch('/api/benixpay/admin/merchants', { headers: authHeaders() });
      const data = await res.json();
      if (data.success) setMerchants(data.merchants || []);
    } catch (err: any) {
      console.warn('Could not load Benix Pay merchants:', err?.message);
    }
  }, []);

  const loadTransactions = useCallback(async () => {
    try {
      setTxLoading(true);
      const res = await fetch('/api/benixpay/admin/transactions', { headers: authHeaders() });
      const data = await res.json();
      if (data.success) setTransactions(data.transactions || []);
    } catch (err: any) {
      console.warn('Could not load Benix Pay transactions:', err?.message);
    } finally {
      setTxLoading(false);
    }
  }, []);

  useEffect(() => {
    const loadAll = async () => {
      setLoading(true);
      await Promise.all([loadStats(), loadMerchants(), loadTransactions()]);
      setLoading(false);
    };
    loadAll();
  }, [loadStats, loadMerchants, loadTransactions]);

  const handleKycDecision = async (merchantId: string, approve: boolean) => {
    const action = approve ? 'approve' : 'decline';
    if (!window.confirm(`Are you sure you want to ${action} Live Mode for this merchant?`)) return;

    setKycActionId(merchantId);
    setStatusMsg(null);
    try {
      const res = await fetch(`/api/benixpay/admin/merchants/${encodeURIComponent(merchantId)}/kyc`, {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify({ approve, notes: kycNotes })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || `Failed to ${action} KYC`);

      setStatusMsg({
        type: 'success',
        text: data.message || `Merchant ${approve ? 'approved' : 'declined'} successfully.`
      });
      setKycNotes('');
      await Promise.all([loadMerchants(), loadStats()]);
    } catch (err: any) {
      setStatusMsg({ type: 'error', text: err.message });
    } finally {
      setKycActionId(null);
    }
  };

  const filteredMerchants = merchants.filter((m) => {
    const q = search.toLowerCase();
    return !q || (m.business_name || '').toLowerCase().includes(q) || (m.business_email || '').toLowerCase().includes(q) || (m.id || '').toLowerCase().includes(q);
  });

  if (loading) {
    return (
      <div className="p-12 text-center text-slate-400 flex flex-col items-center justify-center">
        <RefreshCw className="w-8 h-8 animate-spin text-blue-500 mb-2" />
        <p className="text-xs font-semibold">Loading Benix Pay Admin Control Center...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Status Banner */}
      {statusMsg && (
        <div className={`p-4 rounded-2xl border text-xs font-bold flex items-center justify-between ${
          statusMsg.type === 'success'
            ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-300'
            : 'bg-rose-500/15 border-rose-500/30 text-rose-300'
        }`}>
          <span>{statusMsg.text}</span>
          <button onClick={() => setStatusMsg(null)} className="text-slate-400 hover:text-white">✕</button>
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-2xl bg-[#0B0E14] border border-slate-800 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-500/20 text-blue-400 flex items-center justify-center border border-blue-500/30">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] text-slate-400 uppercase font-bold block">Merchants</span>
            <span className="text-lg font-black text-white">{stats?.totalMerchants ?? 0}</span>
            <span className="text-[10px] text-emerald-400 font-bold block">{stats?.liveMerchants ?? 0} Live</span>
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-[#0B0E14] border border-slate-800 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center border border-amber-500/30">
            <ShieldAlert className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] text-slate-400 uppercase font-bold block">Pending KYC</span>
            <span className="text-lg font-black text-white">{stats?.pendingKyc ?? 0}</span>
            <span className="text-[10px] text-slate-500 font-bold block">Awaiting review</span>
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-[#0B0E14] border border-slate-800 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center border border-emerald-500/30">
            <TrendingUp className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] text-slate-400 uppercase font-bold block">Gross Volume</span>
            <span className="text-lg font-black text-white">{(stats?.grossVolume ?? 0).toLocaleString()}</span>
            <span className="text-[10px] text-slate-500 font-bold block">{stats?.totalTransactions ?? 0} txns</span>
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-[#0B0E14] border border-slate-800 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-purple-500/20 text-purple-400 flex items-center justify-center border border-purple-500/30">
            <Wallet className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] text-slate-400 uppercase font-bold block">Platform Fees</span>
            <span className="text-lg font-black text-white">{(stats?.feeRevenue ?? 0).toLocaleString()}</span>
            <span className="text-[10px] text-slate-500 font-bold block">{(stats?.netSettled ?? 0).toLocaleString()} settled</span>
          </div>
        </div>
      </div>

      {/* Merchant KYC Review Table */}
      <div className="p-6 rounded-2xl bg-[#0F141F] border border-slate-800 space-y-4 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <h3 className="text-sm font-bold text-white">Merchant KYC & Live Mode Approval</h3>
          </div>
          <div className="relative w-full sm:w-72">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search merchants..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-8 pr-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white w-full focus:outline-none focus:border-blue-500"
            />
          </div>
        </div>

        {filteredMerchants.length === 0 ? (
          <div className="p-8 text-center text-slate-500 text-xs">
            No merchants registered yet. Once users create Benix Pay accounts, they will appear here.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-900/60 border-b border-slate-800 text-slate-400 uppercase font-mono text-[10px]">
                <tr>
                  <th className="p-3">Merchant</th>
                  <th className="p-3">Business Email</th>
                  <th className="p-3">KYC Status</th>
                  <th className="p-3">Live Mode</th>
                  <th className="p-3">Created</th>
                  <th className="p-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {filteredMerchants.map((m) => (
                  <tr key={m.id} className="hover:bg-slate-900/30 transition">
                    <td className="p-3">
                      <div className="font-bold text-white">{m.business_name}</div>
                      <div className="text-[10px] text-slate-400 font-mono">{m.id}</div>
                    </td>
                    <td className="p-3 text-slate-400">{m.business_email || '—'}</td>
                    <td className="p-3">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase inline-flex items-center gap-1 ${
                        m.kyc_status === 'approved'
                          ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                          : m.kyc_status === 'pending'
                          ? 'bg-amber-500/15 text-amber-400 border border-amber-500/30'
                          : m.kyc_status === 'rejected'
                          ? 'bg-rose-500/15 text-rose-400 border border-rose-500/30'
                          : 'bg-slate-800 text-slate-400 border border-slate-700'
                      }`}>
                        {m.kyc_status === 'pending' && <Clock className="w-3 h-3" />}
                        {m.kyc_status === 'approved' && <CheckCircle2 className="w-3 h-3" />}
                        {m.kyc_status === 'rejected' && <XCircle className="w-3 h-3" />}
                        <span>{m.kyc_status || 'unsubmitted'}</span>
                      </span>
                    </td>
                    <td className="p-3">
                      {m.is_live_enabled ? (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">Enabled</span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-slate-800 text-slate-400 border border-slate-700">Sandbox Only</span>
                      )}
                    </td>
                    <td className="p-3 text-slate-500 text-[11px] whitespace-nowrap">
                      {m.created_at ? new Date(m.created_at).toLocaleDateString() : '—'}
                    </td>
                    <td className="p-3">
                      {m.kyc_status === 'pending' && (
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleKycDecision(m.id, true)}
                            disabled={kycActionId === m.id}
                            className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-[11px] flex items-center gap-1 transition disabled:opacity-50"
                          >
                            {kycActionId === m.id ? <RefreshCw className="w-3 h-3 animate-spin" /> : <Check className="w-3 h-3" />}
                            Approve
                          </button>
                          <button
                            onClick={() => handleKycDecision(m.id, false)}
                            disabled={kycActionId === m.id}
                            className="px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white font-bold text-[11px] flex items-center gap-1 transition disabled:opacity-50"
                          >
                            <X className="w-3 h-3" />
                            Decline
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Transaction Ledger */}
      <div className="p-6 rounded-2xl bg-[#0F141F] border border-slate-800 space-y-4 shadow-xl">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CreditCard className="w-4 h-4 text-blue-400" />
            <h3 className="text-sm font-bold text-white">Platform Transaction Ledger</h3>
          </div>
          <div className="flex items-center gap-3">
            <a
              href="/docs/benixpay"
              target="_blank"
              rel="noreferrer"
              className="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1"
            >
              <FileText className="w-3.5 h-3.5" />
              <span>API Docs</span>
              <ExternalLink className="w-3 h-3" />
            </a>
            <button
              onClick={loadTransactions}
              disabled={txLoading}
              className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition"
              title="Refresh transactions"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${txLoading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        {transactions.length === 0 ? (
          <div className="p-8 text-center text-slate-500 text-xs">
            No Benix Pay transactions recorded yet.
          </div>
        ) : (
          <div className="overflow-x-auto max-h-[420px] overflow-y-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-900/60 border-b border-slate-800 text-slate-400 uppercase font-mono text-[10px] sticky top-0">
                <tr>
                  <th className="p-3">Txn ID</th>
                  <th className="p-3">Merchant</th>
                  <th className="p-3">Environment</th>
                  <th className="p-3">Amount</th>
                  <th className="p-3">Fee</th>
                  <th className="p-3">Net</th>
                  <th className="p-3">Status</th>
                  <th className="p-3">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {transactions.map((t) => (
                  <tr key={t.id} className="hover:bg-slate-900/30 transition">
                    <td className="p-3 font-mono text-slate-300">{t.id}</td>
                    <td className="p-3 text-white font-bold">{t.business_name || t.merchant_id}</td>
                    <td className="p-3">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase ${
                        t.mode === 'live' ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30' : 'bg-amber-500/15 text-amber-400 border border-amber-500/30'
                      }`}>
                        {t.mode}
                      </span>
                    </td>
                    <td className="p-3 font-bold text-white">{Number(t.amount).toLocaleString()} {t.currency}</td>
                    <td className="p-3 text-rose-400">{Number(t.fee_amount).toLocaleString()}</td>
                    <td className="p-3 text-emerald-400">{Number(t.net_amount).toLocaleString()}</td>
                    <td className="p-3">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                        t.status === 'successful'
                          ? 'bg-emerald-500/20 text-emerald-400'
                          : t.status === 'failed'
                          ? 'bg-rose-500/20 text-rose-400'
                          : 'bg-amber-500/20 text-amber-400'
                      }`}>
                        {t.status}
                      </span>
                    </td>
                    <td className="p-3 text-slate-500 text-[11px] whitespace-nowrap">
                      {new Date(t.created_at).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default BenixPayAdminPanel;
