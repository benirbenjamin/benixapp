import React, { useState, useEffect } from 'react';
import {
  Wallet,
  Database,
  ArrowDownLeft,
  ArrowUpRight,
  RefreshCw,
  Search,
  CheckCircle2,
  ExternalLink,
  ShieldCheck,
  Server
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { getAuthToken } from '../../services/api';

export const AdminLedgerSchemaPanel: React.FC = () => {
  const [recentTx, setRecentTx] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [search, setSearch] = useState<string>('');

  const fetchLedger = async () => {
    setLoading(true);
    try {
      const token = getAuthToken();
      const res = await fetch('/api/admin/dashboard', {
        headers: token ? { Authorization: `Bearer ${token}` } : {}
      });
      const data = await res.json();
      if (data.recentTransactions) {
        setRecentTx(data.recentTransactions);
      }
    } catch (err: any) {
      console.error('Failed to load ledger stream:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLedger();
  }, []);

  const filteredTx = recentTx.filter((tx) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      (tx.description && tx.description.toLowerCase().includes(q)) ||
      (tx.user_email && tx.user_email.toLowerCase().includes(q)) ||
      (tx.category && tx.category.toLowerCase().includes(q))
    );
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Server className="w-5 h-5 text-indigo-400" />
            Central Wallet Ledger & Database Architecture
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Real-time atomic settlement streams across all apps, deposit transactions, and PostgreSQL relation partitions.
          </p>
        </div>
        <button
          onClick={fetchLedger}
          disabled={loading}
          className="inline-flex items-center gap-2 px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl text-xs font-medium transition"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          Refresh Ledger
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Central Wallet Real-Time Ledger */}
        <div className="lg:col-span-7 rounded-2xl p-6 border border-slate-800 bg-slate-900/60 shadow-xl space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-4">
            <div className="flex items-center gap-2">
              <Wallet className="w-5 h-5 text-emerald-400" />
              <h3 className="font-extrabold text-white text-sm">Central Wallet Real-Time Ledger Stream</h3>
            </div>
            <span className="text-[11px] font-semibold text-emerald-400 flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5" /> Atomic Cross-App Settlement
            </span>
          </div>

          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-500" />
            <input
              type="text"
              placeholder="Search by user email, reason, category..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500/50"
            />
          </div>

          {loading ? (
            <div className="py-12 text-center text-slate-400 text-xs">
              <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2 text-emerald-400" />
              Loading real-time transactions...
            </div>
          ) : filteredTx.length === 0 ? (
            <div className="py-12 text-center text-slate-500 text-xs space-y-2">
              <Wallet className="w-8 h-8 mx-auto text-slate-600" />
              <p className="text-slate-400 font-bold">No transactions found.</p>
              <p className="text-slate-500">Transactions from RollDice wagering, marketplace sales, deposit approvals appear here.</p>
            </div>
          ) : (
            <div className="space-y-2.5 max-h-[420px] overflow-y-auto pr-1">
              {filteredTx.map((tx: any) => {
                const isCredit = tx.type === 'credit';
                return (
                  <div
                    key={tx.id}
                    className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between gap-3 text-xs hover:border-slate-700 transition"
                  >
                    <div className="flex items-center gap-2.5">
                      <div
                        className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${
                          isCredit ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                        }`}
                      >
                        {isCredit ? (
                          <ArrowDownLeft className="w-3.5 h-3.5" />
                        ) : (
                          <ArrowUpRight className="w-3.5 h-3.5" />
                        )}
                      </div>
                      <div>
                        <p className="font-bold text-white text-[11px]">{tx.description || tx.category || 'Transaction'}</p>
                        <span className="text-[10px] text-slate-500">
                          {tx.user_email || tx.user_id} • {new Date(tx.created_at).toLocaleString()}
                        </span>
                      </div>
                    </div>
                    <div className="text-right">
                      <span
                        className={`font-black text-xs block ${
                          isCredit ? 'text-emerald-400' : 'text-slate-200'
                        }`}
                      >
                        {isCredit ? '+' : '-'}{Number(tx.amount).toLocaleString()} RWF
                      </span>
                      <span className="text-[10px] text-slate-400 font-mono">
                        Bal: {Number(tx.balance_after || 0).toLocaleString()}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Database Partitioning & Schemas Breakdown */}
        <div className="lg:col-span-5 rounded-2xl p-6 border border-slate-800 bg-slate-900/60 shadow-xl space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-4">
            <div className="flex items-center gap-2">
              <Database className="w-5 h-5 text-blue-400" />
              <h3 className="font-extrabold text-white text-sm">PostgreSQL Schemas & Tables</h3>
            </div>
            <span className="text-xs font-bold text-emerald-400 flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" /> Neon Cloud Active
            </span>
          </div>

          <div className="space-y-2.5 text-xs">
            {[
              { name: 'core_users & core_wallets', desc: 'Unified auth, country, WhatsApp, app profiles, central wallet', rows: 'Dynamic' },
              { name: 'stations (TV & Radio)', desc: '17 TV Channels + 19 Radio Stations with HLS/Icecast feeds', rows: '36 default' },
              { name: 'pending_flutterwave_deposits', desc: 'User mobile money and card deposits with txRef audit', rows: 'Real-time' },
              { name: 'voxify_choirs & voxify_choir_tracks', desc: 'Choir directory, private members, SATB stems & rehearsals', rows: 'Choir cloud' },
              { name: 'voxify_songs & voxify_song_purchases', desc: 'Artist exclusive ownership & license marketplace', rows: 'Protected' },
              { name: 'kunda_match_profiles & passes', desc: 'Algorithm questionnaires, compatibility score & messaging passes', rows: 'Smart match' },
              { name: 'marketplace_products & services', desc: 'Product galleries, affiliate commission % & service bookings', rows: 'Active' },
              { name: 'user_videos & video_views', desc: '10s view tracking & YouTube RSS sync', rows: 'Stream pool' }
            ].map((sch, i) => (
              <div key={i} className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between">
                <div>
                  <span className="font-bold text-blue-400 block font-mono text-[11px]">{sch.name}</span>
                  <span className="text-[10px] text-slate-400">{sch.desc}</span>
                </div>
                <span className="text-[10px] font-bold text-slate-300 bg-slate-900 px-2 py-0.5 rounded border border-slate-800 shrink-0">
                  {sch.rows}
                </span>
              </div>
            ))}
          </div>

          <div className="pt-2">
            <Link
              to="/admin/users"
              className="w-full py-2.5 rounded-xl bg-blue-600/20 hover:bg-blue-600/30 text-blue-300 border border-blue-500/30 font-bold text-xs flex items-center justify-center gap-1.5 transition-colors"
            >
              <span>Manage Staff Roles & Accounts</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};
