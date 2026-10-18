import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import { notificationSound } from '../../utils/notificationSound';
import {
  X,
  Wallet as WalletIcon,
  ArrowDownLeft,
  ArrowUpRight,
  RefreshCw,
  Clock,
  CheckCircle2,
  AlertCircle,
  Send,
  Download,
  Search,
  UserCheck,
  Building,
  Smartphone,
  ChevronRight
} from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  initialTab?: 'balance' | 'deposit' | 'withdraw' | 'transfer';
}

export const WalletModal: React.FC<Props> = ({ isOpen, onClose, initialTab = 'balance' }) => {
  const { user, wallet, token, updateWalletBalance } = useAuth();
  const [tab, setTab] = useState<'balance' | 'deposit' | 'withdraw' | 'transfer'>(initialTab);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [amount, setAmount] = useState<string>('');
  const [phone, setPhone] = useState<string>(user?.phone || '');
  const [method, setMethod] = useState<'MTN_MOMO' | 'AIRTEL_MONEY' | 'BANK'>('MTN_MOMO');
  const [bankName, setBankName] = useState<string>('Bank of Kigali (BK)');
  const [accountNumber, setAccountNumber] = useState<string>('');
  const [accountName, setAccountName] = useState<string>(user?.name || '');
  const [statusMsg, setStatusMsg] = useState<{ text: string; error?: boolean } | null>(null);

  // Transfer specific state
  const [recipientEmail, setRecipientEmail] = useState<string>('');
  const [transferNote, setTransferNote] = useState<string>('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [selectedRecipient, setSelectedRecipient] = useState<any | null>(null);
  const [isSearching, setIsSearching] = useState<boolean>(false);
  const searchTimeoutRef = useRef<any>(null);

  useEffect(() => {
    if (initialTab) {
      setTab(initialTab);
    }
  }, [initialTab]);

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

  // Debounced recipient search as user enters email or name
  const handleRecipientChange = (val: string) => {
    setRecipientEmail(val);
    setSelectedRecipient(null);

    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);

    if (!val || val.trim().length < 2) {
      setSearchResults([]);
      setIsSearching(false);
      return;
    }

    setIsSearching(true);
    searchTimeoutRef.current = setTimeout(async () => {
      try {
        const res = await fetch(`/api/wallet/search-recipient?q=${encodeURIComponent(val.trim())}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (res.ok) {
          const data = await res.json();
          setSearchResults(data.users || []);
        }
      } catch (err) {
        setSearchResults([]);
      } finally {
        setIsSearching(false);
      }
    }, 280);
  };

  const handleSelectRecipient = (u: any) => {
    setSelectedRecipient(u);
    setRecipientEmail(u.email);
    setSearchResults([]);
  };

  const handleTransfer = async () => {
    setStatusMsg(null);
    const num = parseFloat(amount);
    if (!num || num <= 0) {
      setStatusMsg({ text: 'Please enter a valid amount to transfer.', error: true });
      return;
    }
    if (!recipientEmail.trim()) {
      setStatusMsg({ text: 'Recipient user email is required.', error: true });
      return;
    }

    try {
      setLoading(true);
      const res = await fetch('/api/wallet/transfer', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          recipientEmail: recipientEmail.trim(),
          amount: num,
          note: transferNote.trim() || undefined
        })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        notificationSound.playNotificationChime();
        setStatusMsg({ text: `Transferred ${num.toLocaleString()} RWF to ${data.recipientName || recipientEmail} successfully!` });
        updateWalletBalance(data.newBalance);
        setAmount('');
        setTransferNote('');
        setRecipientEmail('');
        setSelectedRecipient(null);
        loadTransactions();
      } else {
        setStatusMsg({ text: data.error || 'Transfer failed. Check recipient email and balance.', error: true });
      }
    } catch (err: any) {
      setStatusMsg({ text: err.message || 'Transfer failed.', error: true });
    } finally {
      setLoading(false);
    }
  };

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
        notificationSound.playNotificationChime();
        setStatusMsg({ text: `Deposited ${num.toLocaleString()} RWF successfully into central wallet!` });
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
      setStatusMsg({ text: 'Minimum withdrawal amount is 500 RWF.', error: true });
      return;
    }

    if (method === 'BANK') {
      if (!accountNumber.trim()) {
        setStatusMsg({ text: 'Bank Account number is required.', error: true });
        return;
      }
    } else {
      if (!phone.trim()) {
        setStatusMsg({ text: 'Mobile Money phone number is required.', error: true });
        return;
      }
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
          accountDetails: method === 'BANK' ? { bankName, accountNumber, accountName } : { phone, method }
        })
      });
      const data = await res.json();
      if (res.ok) {
        notificationSound.playNotificationChime();
        setStatusMsg({ text: `Withdrawal request for ${num.toLocaleString()} RWF submitted for processing!` });
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

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-[#0F1420] rounded-3xl shadow-2xl border border-slate-800 w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh] text-white font-sans">
        
        {/* Header */}
        <div className="px-6 py-5 border-b border-slate-800 flex items-center justify-between bg-[#131926]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/15 text-emerald-400 flex items-center justify-center border border-emerald-500/30">
              <WalletIcon className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-black text-white">Central Wallet</h3>
              <p className="text-[11px] text-slate-400">Universal balance across all Benix.Space apps</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-white rounded-full hover:bg-slate-800/60 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Balance Showcase Card */}
        <div className="p-6 pb-2">
          <div className="p-5 rounded-2xl bg-gradient-to-br from-[#162032] via-[#101726] to-[#0B0F1A] border border-slate-800 text-white shadow-xl relative overflow-hidden">
            <div className="flex items-center justify-between text-xs text-slate-400 font-medium">
              <span>Available Active Balance</span>
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 text-[10px] font-black border border-emerald-500/30">
                Active Ledger
              </span>
            </div>
            <div className="text-3xl font-black mt-2 tracking-tight text-white">
              {Number(wallet?.balance || 0).toLocaleString()} <span className="text-lg font-bold text-emerald-400">{wallet?.currency || 'RWF'}</span>
            </div>
            {wallet?.pending_balance ? (
              <div className="text-xs text-amber-300 mt-1">
                Pending: {Number(wallet.pending_balance).toLocaleString()} RWF
              </div>
            ) : null}
          </div>
        </div>

        {/* 4 Action Tabs: Transfer, Withdraw, Top Up (Deposit), History (Balance) */}
        <div className="px-6 grid grid-cols-4 gap-1.5 border-b border-slate-800 pb-3">
          {[
            { id: 'transfer', label: 'Transfer', icon: Send },
            { id: 'withdraw', label: 'Withdraw', icon: Download },
            { id: 'deposit', label: 'Top Up', icon: ArrowDownLeft },
            { id: 'balance', label: 'History', icon: Clock }
          ].map((tItem) => {
            const Icon = tItem.icon;
            const active = tab === tItem.id;
            return (
              <button
                key={tItem.id}
                onClick={() => { setTab(tItem.id as any); setStatusMsg(null); }}
                className={`py-2 px-1 rounded-xl text-xs font-bold transition-all flex flex-col sm:flex-row items-center justify-center gap-1.5 ${
                  active
                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30'
                    : 'bg-slate-800/80 text-slate-300 hover:bg-slate-700 hover:text-white'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span className="truncate">{tItem.label}</span>
              </button>
            );
          })}
        </div>

        {/* Tab Content */}
        <div className="p-6 overflow-y-auto flex-1 space-y-4">
          {statusMsg && (
            <div className={`p-3 rounded-xl text-xs flex items-center gap-2 ${statusMsg.error ? 'bg-red-950/60 text-red-200 border border-red-500/40' : 'bg-emerald-950/60 text-emerald-200 border border-emerald-500/40'}`}>
              {statusMsg.error ? <AlertCircle className="w-4 h-4 shrink-0 text-red-400" /> : <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />}
              <span>{statusMsg.text}</span>
            </div>
          )}

          {/* TAB 1: TRANSFER (Auto-search recipient email & dropdown) */}
          {tab === 'transfer' && (
            <div className="space-y-4">
              <div className="relative">
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1">
                  Recipient User Email *
                </label>
                <div className="relative">
                  <input
                    type="email"
                    value={recipientEmail}
                    onChange={(e) => handleRecipientChange(e.target.value)}
                    placeholder="Enter user email (e.g. name@example.com)"
                    className="w-full px-4 py-3 rounded-xl bg-[#161D2E] border border-slate-700 text-white text-xs focus:outline-none focus:border-blue-500"
                  />
                  {isSearching && (
                    <div className="absolute right-3 top-3 text-slate-400">
                      <RefreshCw className="w-4 h-4 animate-spin" />
                    </div>
                  )}
                </div>

                {/* Auto-Loaded User Dropdown */}
                {searchResults.length > 0 && (
                  <div className="absolute left-0 right-0 top-full mt-1.5 z-30 bg-[#161D2E] border border-slate-700 rounded-2xl shadow-2xl overflow-hidden divide-y divide-slate-800">
                    {searchResults.map((u) => (
                      <div
                        key={u.id}
                        onClick={() => handleSelectRecipient(u)}
                        className="p-3 hover:bg-blue-600/20 cursor-pointer transition-colors flex items-center justify-between"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-blue-600 text-white font-black text-xs flex items-center justify-center">
                            {u.name ? u.name.charAt(0).toUpperCase() : 'U'}
                          </div>
                          <div>
                            <div className="text-xs font-bold text-white flex items-center gap-1.5">
                              <span>{u.name}</span>
                              <span className="text-[10px] text-emerald-400 bg-emerald-500/10 px-1.5 py-0.2 rounded font-mono">
                                Verified
                              </span>
                            </div>
                            <div className="text-[11px] text-slate-400">{u.email}</div>
                          </div>
                        </div>
                        <ChevronRight className="w-4 h-4 text-slate-500" />
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Selected Recipient Card Preview */}
              {selectedRecipient && (
                <div className="p-3 rounded-2xl bg-blue-600/10 border border-blue-500/40 flex items-center gap-3">
                  <UserCheck className="w-5 h-5 text-blue-400 shrink-0" />
                  <div className="text-xs">
                    <span className="text-slate-400 block text-[10px]">Recipient Verified</span>
                    <strong className="text-white">{selectedRecipient.name}</strong> ({selectedRecipient.email})
                  </div>
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1">
                  Transfer Amount (RWF) *
                </label>
                <input
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="e.g. 5000"
                  className="w-full px-4 py-3 rounded-xl bg-[#161D2E] border border-slate-700 text-white text-sm focus:outline-none focus:border-blue-500 font-bold"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1">
                  Optional Note / Description
                </label>
                <input
                  type="text"
                  value={transferNote}
                  onChange={(e) => setTransferNote(e.target.value)}
                  placeholder="e.g. Payment for video / choir / marketplace"
                  className="w-full px-4 py-2.5 rounded-xl bg-[#161D2E] border border-slate-700 text-white text-xs focus:outline-none focus:border-blue-500"
                />
              </div>

              <button
                onClick={handleTransfer}
                disabled={loading}
                className="w-full py-3.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-lg shadow-blue-600/30 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
              >
                <Send className="w-4 h-4" />
                <span>{loading ? 'Transferring Funds...' : 'Confirm Instant Transfer'}</span>
              </button>
            </div>
          )}

          {/* TAB 2: WITHDRAW */}
          {tab === 'withdraw' && (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1">
                  Withdrawal Amount (RWF)
                </label>
                <input
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="Min 500 RWF"
                  className="w-full px-4 py-3 rounded-xl bg-[#161D2E] border border-slate-700 text-white text-sm focus:outline-none focus:border-blue-500 font-bold"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1">
                  Payout Channel
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: 'MTN_MOMO', label: 'MTN MoMo', icon: Smartphone },
                    { id: 'AIRTEL_MONEY', label: 'Airtel Money', icon: Smartphone },
                    { id: 'BANK', label: 'Bank Transfer', icon: Building }
                  ].map((mOption) => {
                    const isSel = method === mOption.id;
                    const Icon = mOption.icon;
                    return (
                      <button
                        key={mOption.id}
                        type="button"
                        onClick={() => setMethod(mOption.id as any)}
                        className={`p-2.5 rounded-xl border text-xs font-bold transition-all flex flex-col items-center justify-center gap-1 ${
                          isSel
                            ? 'border-blue-500 bg-blue-600/20 text-blue-300 shadow-md'
                            : 'border-slate-800 bg-[#161D2E] text-slate-400'
                        }`}
                      >
                        <Icon className="w-4 h-4" />
                        <span className="truncate">{mOption.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {method === 'BANK' ? (
                <>
                  <div>
                    <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1">
                      Bank Name
                    </label>
                    <select
                      value={bankName}
                      onChange={(e) => setBankName(e.target.value)}
                      className="w-full px-4 py-3 rounded-xl bg-[#161D2E] border border-slate-700 text-white text-xs focus:outline-none focus:border-blue-500"
                    >
                      <option value="Bank of Kigali (BK)">Bank of Kigali (BK)</option>
                      <option value="Equity Bank Rwanda">Equity Bank Rwanda</option>
                      <option value="I&M Bank Rwanda">I&M Bank Rwanda</option>
                      <option value="BPR Bank Rwanda">BPR Bank Rwanda</option>
                      <option value="Cogebanque">Cogebanque</option>
                      <option value="Ecobank Rwanda">Ecobank Rwanda</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1">
                      Bank Account Number
                    </label>
                    <input
                      type="text"
                      value={accountNumber}
                      onChange={(e) => setAccountNumber(e.target.value)}
                      placeholder="e.g. 00040-0694000-00"
                      className="w-full px-4 py-3 rounded-xl bg-[#161D2E] border border-slate-700 text-white text-xs focus:outline-none focus:border-blue-500"
                    />
                  </div>
                </>
              ) : (
                <div>
                  <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1">
                    Mobile Money Phone Number
                  </label>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="0783987223"
                    className="w-full px-4 py-3 rounded-xl bg-[#161D2E] border border-slate-700 text-white text-sm focus:outline-none focus:border-blue-500"
                  />
                </div>
              )}

              <button
                onClick={handleWithdraw}
                disabled={loading}
                className="w-full py-3.5 rounded-xl bg-blue-600 text-white font-bold text-xs hover:bg-blue-500 shadow-lg shadow-blue-600/30 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
              >
                <Download className="w-4 h-4" />
                <span>{loading ? 'Submitting...' : 'Submit Withdrawal Request'}</span>
              </button>
            </div>
          )}

          {/* TAB 3: DEPOSIT (TOP UP) */}
          {tab === 'deposit' && (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1">
                  Deposit Amount (RWF)
                </label>
                <input
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="e.g. 5000"
                  className="w-full px-4 py-3 rounded-xl bg-[#161D2E] border border-slate-700 text-white text-sm focus:outline-none focus:border-blue-500 font-bold"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setMethod('MTN_MOMO')}
                  className={`p-3 rounded-xl border text-xs font-bold transition-all ${method === 'MTN_MOMO' ? 'border-amber-500/60 bg-amber-500/20 text-amber-300' : 'border-slate-800 bg-[#161D2E] text-slate-400'}`}
                >
                  MTN Mobile Money
                </button>
                <button
                  type="button"
                  onClick={() => setMethod('AIRTEL_MONEY')}
                  className={`p-3 rounded-xl border text-xs font-bold transition-all ${method === 'AIRTEL_MONEY' ? 'border-rose-500/60 bg-rose-500/20 text-rose-300' : 'border-slate-800 bg-[#161D2E] text-slate-400'}`}
                >
                  Airtel Money
                </button>
              </div>

              <button
                onClick={handleDeposit}
                disabled={loading}
                className="w-full py-3.5 rounded-xl bg-emerald-600 text-white font-bold text-xs hover:bg-emerald-500 shadow-lg shadow-emerald-600/30 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
              >
                <ArrowDownLeft className="w-4 h-4" />
                <span>{loading ? 'Processing...' : 'Confirm Deposit'}</span>
              </button>
            </div>
          )}

          {/* TAB 4: HISTORY / TRANSACTIONS */}
          {tab === 'balance' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-300">Recent Transactions</span>
                <button onClick={loadTransactions} className="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1 font-semibold">
                  <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
                  <span>Refresh</span>
                </button>
              </div>

              {transactions.length === 0 ? (
                <div className="text-center py-8 text-xs text-slate-400 bg-[#131926] rounded-2xl border border-slate-800">
                  No transactions recorded yet.
                </div>
              ) : (
                <div className="space-y-2">
                  {transactions.map((tx) => {
                    const isCredit = Number(tx.amount) > 0;
                    return (
                      <div key={tx.id} className="p-3 rounded-xl border border-slate-800 bg-[#161D2E] flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${isCredit ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-rose-500/20 text-rose-400 border border-rose-500/30'}`}>
                            {isCredit ? <ArrowDownLeft className="w-4 h-4" /> : <ArrowUpRight className="w-4 h-4" />}
                          </div>
                          <div>
                            <div className="text-xs font-bold text-white">{tx.description}</div>
                            <div className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">
                              {tx.module} • {new Date(tx.created_at).toLocaleDateString()}
                            </div>
                          </div>
                        </div>
                        <div className={`text-xs font-black ${isCredit ? 'text-emerald-400' : 'text-rose-400'}`}>
                          {isCredit ? '+' : ''}{Number(tx.amount).toLocaleString()} RWF
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

        </div>

      </div>
    </div>
  );
};
