import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import {
  X,
  Wallet as WalletIcon,
  ArrowDownLeft,
  ArrowUpRight,
  RefreshCw,
  Clock,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export const WalletModal: React.FC<Props> = ({ isOpen, onClose }) => {
  const { user, wallet, token, updateWalletBalance } = useAuth();
  const [tab, setTab] = useState<'balance' | 'deposit' | 'withdraw'>('balance');
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [amount, setAmount] = useState<string>('');
  const [phone, setPhone] = useState<string>(user?.phone || '');
  const [method, setMethod] = useState<'MTN_MOMO' | 'AIRTEL_MONEY'>('MTN_MOMO');
  const [statusMsg, setStatusMsg] = useState<{ text: string; error?: boolean } | null>(null);

  useEffect(() => {
    if (isOpen && token) {
      loadTransactions();
    }
  }, [isOpen, token]);

  const loadTransactions = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/wallet', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setTransactions(data.transactions || []);
        if (data.wallet?.balance !== undefined) {
          updateWalletBalance(data.wallet.balance);
        }
      }
    } catch (e) {
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  const handleDeposit = async () => {
    setStatusMsg(null);
    const num = parseFloat(amount);
    if (!num || num <= 0) {
      setStatusMsg({ text: 'Please enter a valid amount to deposit.', error: true });
      return;
    }

    try {
      setLoading(true);
      const res = await fetch('/api/wallet/deposit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ amount: num, paymentMethod: method })
      });
      const data = await res.json();
      if (res.ok) {
        setStatusMsg({ text: `Deposited ${num} RWF successfully!` });
        updateWalletBalance(data.newBalance);
        setAmount('');
        loadTransactions();
      } else {
        setStatusMsg({ text: data.error || 'Deposit failed.', error: true });
      }
    } catch (err: any) {
      setStatusMsg({ text: err.message || 'Deposit failed.', error: true });
    } finally {
      setLoading(false);
    }
  };

  const handleWithdraw = async () => {
    setStatusMsg(null);
    const num = parseFloat(amount);
    if (!num || num < 500) {
      setStatusMsg({ text: 'Minimum withdrawal is 500 RWF.', error: true });
      return;
    }
    if (!phone) {
      setStatusMsg({ text: 'Mobile Money phone number is required.', error: true });
      return;
    }

    try {
      setLoading(true);
      const res = await fetch('/api/wallet/withdraw', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          amount: num,
          payoutMethod: method,
          accountDetails: { phone, method }
        })
      });
      const data = await res.json();
      if (res.ok) {
        setStatusMsg({ text: 'Withdrawal request submitted for processing!' });
        setAmount('');
        loadTransactions();
      } else {
        setStatusMsg({ text: data.error || 'Withdrawal failed.', error: true });
      }
    } catch (err: any) {
      setStatusMsg({ text: err.message || 'Withdrawal error', error: true });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-lg overflow-hidden flex flex-col max-h-[85vh]">
        
        {/* Header */}
        <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center border border-emerald-500/20">
              <WalletIcon className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-slate-900">Unified Central Wallet</h3>
              <p className="text-[11px] text-slate-500">Shared across all Benix.Space modules</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-200/50">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Balance Showcase Card */}
        <div className="p-6 pb-2">
          <div className="p-5 rounded-2xl bg-gradient-to-br from-slate-900 via-sky-950 to-slate-900 text-white shadow-xl relative overflow-hidden">
            <div className="flex items-center justify-between text-xs text-slate-400 font-medium">
              <span>Available Balance</span>
              <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 text-[10px] font-bold border border-emerald-500/30">
                Active Ledger
              </span>
            </div>
            <div className="text-3xl font-black mt-2 tracking-tight">
              {Number(wallet?.balance || 0).toLocaleString()} <span className="text-lg font-bold text-sky-400">{wallet?.currency || 'RWF'}</span>
            </div>
            {wallet?.pending_balance ? (
              <div className="text-xs text-amber-300 mt-1">
                Pending: {Number(wallet.pending_balance).toLocaleString()} RWF
              </div>
            ) : null}
          </div>
        </div>

        {/* Tab Controls */}
        <div className="px-6 flex gap-2 border-b border-slate-100 pb-3">
          {(['balance', 'deposit', 'withdraw'] as const).map((tName) => (
            <button
              key={tName}
              onClick={() => { setTab(tName); setStatusMsg(null); }}
              className={`px-4 py-2 rounded-xl text-xs font-bold capitalize transition-all ${
                tab === tName
                  ? 'bg-sky-600 text-white shadow-sm'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {tName === 'balance' ? 'Ledger History' : tName}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div className="p-6 overflow-y-auto flex-1 space-y-4">
          {statusMsg && (
            <div className={`p-3 rounded-xl text-xs flex items-center gap-2 ${statusMsg.error ? 'bg-red-50 text-red-600 border border-red-200' : 'bg-emerald-50 text-emerald-600 border border-emerald-200'}`}>
              {statusMsg.error ? <AlertCircle className="w-4 h-4 shrink-0" /> : <CheckCircle2 className="w-4 h-4 shrink-0" />}
              <span>{statusMsg.text}</span>
            </div>
          )}

          {/* TAB 1: Ledger History */}
          {tab === 'balance' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-700">Recent Transactions</span>
                <button onClick={loadTransactions} className="text-xs text-sky-600 hover:text-sky-700 flex items-center gap-1">
                  <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
                  <span>Refresh</span>
                </button>
              </div>

              {transactions.length === 0 ? (
                <div className="text-center py-8 text-xs text-slate-400">
                  No transactions recorded yet.
                </div>
              ) : (
                <div className="space-y-2">
                  {transactions.map((tx) => {
                    const isCredit = Number(tx.amount) > 0;
                    return (
                      <div key={tx.id} className="p-3 rounded-xl border border-slate-100 bg-slate-50/50 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${isCredit ? 'bg-emerald-100 text-emerald-600' : 'bg-rose-100 text-rose-600'}`}>
                            {isCredit ? <ArrowDownLeft className="w-4 h-4" /> : <ArrowUpRight className="w-4 h-4" />}
                          </div>
                          <div>
                            <div className="text-xs font-bold text-slate-800">{tx.description}</div>
                            <div className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">
                              {tx.module} • {new Date(tx.created_at).toLocaleDateString()}
                            </div>
                          </div>
                        </div>
                        <div className={`text-xs font-black ${isCredit ? 'text-emerald-600' : 'text-rose-600'}`}>
                          {isCredit ? '+' : ''}{Number(tx.amount).toLocaleString()} RWF
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* TAB 2: Deposit */}
          {tab === 'deposit' && (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Deposit Amount (RWF)
                </label>
                <input
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="e.g. 5000"
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 font-bold"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setMethod('MTN_MOMO')}
                  className={`p-3 rounded-xl border text-xs font-bold ${method === 'MTN_MOMO' ? 'border-amber-400 bg-amber-50 text-amber-900' : 'border-slate-200 text-slate-600'}`}
                >
                  MTN Mobile Money
                </button>
                <button
                  type="button"
                  onClick={() => setMethod('AIRTEL_MONEY')}
                  className={`p-3 rounded-xl border text-xs font-bold ${method === 'AIRTEL_MONEY' ? 'border-rose-400 bg-rose-50 text-rose-900' : 'border-slate-200 text-slate-600'}`}
                >
                  Airtel Money
                </button>
              </div>

              <button
                onClick={handleDeposit}
                disabled={loading}
                className="w-full py-3 rounded-xl bg-emerald-600 text-white font-bold text-xs hover:bg-emerald-700 shadow-md transition-colors disabled:opacity-50"
              >
                {loading ? 'Processing...' : 'Confirm Deposit'}
              </button>
            </div>
          )}

          {/* TAB 3: Withdraw */}
          {tab === 'withdraw' && (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Withdrawal Amount (RWF)
                </label>
                <input
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="Min 500 RWF"
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 font-bold"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Recipient Mobile Number
                </label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="0783987223"
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
                />
              </div>

              <button
                onClick={handleWithdraw}
                disabled={loading}
                className="w-full py-3 rounded-xl bg-slate-900 text-white font-bold text-xs hover:bg-sky-600 shadow-md transition-colors disabled:opacity-50"
              >
                {loading ? 'Submitting...' : 'Submit Withdrawal Request'}
              </button>
            </div>
          )}
        </div>

      </div>
    </div>
  );
};
