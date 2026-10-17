import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useWallet } from '../../contexts/WalletContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { DepositModal } from '../../components/ui/DepositModal';
import { WithdrawModal } from '../../components/ui/WithdrawModal';
import { Wallet as WalletIcon, ArrowDownLeft, ArrowUpRight, ShieldCheck, History, Gift, Users, ExternalLink } from 'lucide-react';
import { Link } from 'react-router-dom';
import { api } from '../../lib/api';

export const Wallet: React.FC = () => {
  const { token } = useAuth();
  const { t } = useLanguage();
  const {
    balance,
    bonusBalance,
    totalAvailable,
    currency,
    totalDeposits,
    totalSpent,
    setIsDepositModalOpen,
    setIsWithdrawModalOpen,
    refreshBalance,
  } = useWallet();

  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  const fetchLedger = async () => {
    if (!token) return;
    try {
      setLoading(true);
      const res = await api.get('/wallet/transactions');
      if (res.data.success && res.data.transactions) {
        setTransactions(res.data.transactions);
      }
    } catch (err) {
      console.error('Fetch ledger error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLedger();
    refreshBalance();
  }, [token]);

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900">{t('wallet.title')}</h1>
          <p className="text-xs text-slate-500">{t('wallet.subtitle')}</p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={() => setIsWithdrawModalOpen(true)}
            className="border-emerald-600 text-emerald-700 hover:bg-emerald-50"
          >
            <ArrowUpRight className="w-4 h-4 mr-1.5" /> Withdraw / Kubikuza
          </Button>
          <Button onClick={() => setIsDepositModalOpen(true)} className="shadow-md shadow-rose-200">
            + Add Funds
          </Button>
        </div>
      </div>

      {/* Dual Wallet Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Withdrawable Balance */}
        <div className="bg-gradient-to-br from-emerald-600 to-teal-700 rounded-3xl p-6 text-white shadow-lg shadow-emerald-200 space-y-2 relative overflow-hidden">
          <div className="flex justify-between items-start">
            <span className="text-xs font-semibold text-emerald-100 uppercase tracking-wider">
              Withdrawable Balance
            </span>
            <span className="text-[10px] bg-white/20 px-2 py-0.5 rounded-full font-bold">100% Cash</span>
          </div>
          <div className="text-3xl font-black">{balance.toLocaleString()} {currency}</div>
          <p className="text-[11px] text-emerald-100/80">From referrals, commissions & deposits</p>
        </div>

        {/* Welcome Bonus (Spendable) */}
        <div className="bg-gradient-to-br from-rose-500 to-amber-500 rounded-3xl p-6 text-white shadow-lg shadow-rose-200 space-y-2 relative overflow-hidden">
          <div className="flex justify-between items-start">
            <span className="text-xs font-semibold text-rose-100 uppercase tracking-wider flex items-center gap-1">
              <Gift className="w-3.5 h-3.5" /> Welcome Bonus
            </span>
            <span className="text-[10px] bg-white/20 px-2 py-0.5 rounded-full font-bold">Spendable</span>
          </div>
          <div className="text-3xl font-black">{bonusBalance.toLocaleString()} {currency}</div>
          <p className="text-[11px] text-rose-100/90">Spend on messages & unlocks before depositing!</p>
        </div>

        {/* Total Available Pool */}
        <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-card space-y-2">
          <div className="flex justify-between items-start">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Total Spendable
            </span>
            <span className="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full font-bold">Combined</span>
          </div>
          <div className="text-2xl font-black text-slate-900">{totalAvailable.toLocaleString()} {currency}</div>
          <p className="text-[11px] text-slate-400">Bonus is spent first automatically</p>
        </div>
      </div>

      {/* Referral Banner */}
      <div className="bg-gradient-to-r from-rose-50 via-amber-50 to-emerald-50 rounded-3xl p-5 border border-rose-100 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-rose-500 text-white flex items-center justify-center flex-shrink-0">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-xs font-black text-slate-900">Earn 200 RWF per Referral + 5% of their Deposits!</h4>
            <p className="text-[11px] text-slate-600">Share your invite link with friends and withdraw cash to MTN MoMo or Airtel Money.</p>
          </div>
        </div>
        <Link
          to="/dashboard/referrals"
          className="text-xs font-black text-rose-600 hover:text-rose-700 flex items-center gap-1 px-4 py-2 bg-white rounded-xl shadow-sm border border-rose-200 hover:bg-rose-50 transition flex-shrink-0"
        >
          Referral Center <ArrowUpRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      {/* Immutable Transaction Ledger History Table */}
      <div className="bg-white rounded-3xl border border-slate-100 shadow-card overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex items-center justify-between">
          <h3 className="font-extrabold text-base text-slate-900 flex items-center gap-2">
            <History className="w-4 h-4 text-slate-500" />
            {t('wallet.historyTitle')}
          </h3>
          <span className="text-xs text-slate-400 font-medium">{transactions.length} records</span>
        </div>

        {loading ? (
          <div className="p-8 text-center text-xs text-slate-400">Loading ledger records...</div>
        ) : transactions.length === 0 ? (
          <div className="p-12 text-center text-xs text-slate-400">{t('wallet.noTransactions')}</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 font-semibold uppercase tracking-wider border-b border-slate-100">
                <tr>
                  <th className="p-4">Date</th>
                  <th className="p-4">Type</th>
                  <th className="p-4">Description</th>
                  <th className="p-4">Reference</th>
                  <th className="p-4 text-right">Amount</th>
                  <th className="p-4 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {transactions.map((tx) => (
                  <tr key={tx.id || tx.reference} className="hover:bg-slate-50/50">
                    <td className="p-4 text-slate-500 whitespace-nowrap">
                      {new Date(tx.createdAt).toLocaleDateString()}
                    </td>
                    <td className="p-4 font-semibold text-slate-800 capitalize">
                      {tx.type?.replace('_', ' ')}
                    </td>
                    <td className="p-4 text-slate-600 max-w-xs truncate">{tx.description}</td>
                    <td className="p-4 font-mono text-[11px] text-slate-400">{tx.reference}</td>
                    <td className="p-4 text-right font-black whitespace-nowrap">
                      <span className={tx.amountMinor > 0 ? 'text-emerald-600' : 'text-slate-900'}>
                        {tx.amountMinor > 0 ? `+${tx.amountMinor.toLocaleString()}` : tx.amountMinor.toLocaleString()} {tx.currency || 'RWF'}
                      </span>
                    </td>
                    <td className="p-4 text-center">
                      <Badge variant={tx.status === 'completed' ? 'emerald' : 'amber'} size="sm">
                        {tx.status}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Reusable Modals */}
      <DepositModal />
      <WithdrawModal />
    </div>
  );
};
