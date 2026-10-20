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
  ChevronRight,
  Gift,
  Globe,
  CreditCard,
  ShieldCheck
} from 'lucide-react';

interface CurrencyOption {
  code: string;
  name: string;
  symbol: string;
  flag: string;
  rateToRwf: number;
}

const DEPOSIT_CURRENCIES: CurrencyOption[] = [
  { code: 'RWF', name: 'Rwandan Franc', symbol: 'FRw', flag: '🇷🇼', rateToRwf: 1.0 },
  { code: 'USD', name: 'US Dollar', symbol: '$', flag: '🇺🇸', rateToRwf: 1420.0 },
  { code: 'EUR', name: 'Euro', symbol: '€', flag: '🇪🇺', rateToRwf: 1540.0 },
  { code: 'GBP', name: 'British Pound', symbol: '£', flag: '🇬🇧', rateToRwf: 1810.0 },
  { code: 'KES', name: 'Kenyan Shilling', symbol: 'KSh', flag: '🇰🇪', rateToRwf: 11.0 },
  { code: 'UGX', name: 'Ugandan Shilling', symbol: 'UGX', flag: '🇺🇬', rateToRwf: 0.38 },
  { code: 'NGN', name: 'Nigerian Naira', symbol: '₦', flag: '🇳🇬', rateToRwf: 0.90 },
  { code: 'TZS', name: 'Tanzanian Shilling', symbol: 'TZS', flag: '🇹🇿', rateToRwf: 0.55 }
];

declare global {
  interface Window {
    FlutterwaveCheckout?: (options: any) => void;
  }
}

interface Props {
  isOpen: boolean;
  onClose: () => void;
  initialTab?: 'balance' | 'deposit' | 'withdraw' | 'transfer';
}

export const WalletModal: React.FC<Props> = ({ isOpen, onClose, initialTab = 'balance' }) => {
  const { user, wallet, token, updateWalletBalance, claimDailyBonus } = useAuth();
  const [claimingBonus, setClaimingBonus] = useState(false);
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

  // Multi-Currency Flutterwave Deposit State
  const [depositCurrency, setDepositCurrency] = useState<CurrencyOption>(DEPOSIT_CURRENCIES[0]);
  const [depositEmail, setDepositEmail] = useState<string>(user?.email || '');
  const [depositPhone, setDepositPhone] = useState<string>(user?.phone || '');

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
    if (isOpen) {
      if (token) {
        loadTransactions();
      }
      ensureFlutterwaveReady();
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

  const parseSafeJson = async (res: Response) => {
    try {
      const text = await res.text();
      return text ? JSON.parse(text) : {};
    } catch {
      return { error: 'Server returned a non-JSON response. Please verify and retry.' };
    }
  };

  const ensureFlutterwaveReady = (): Promise<boolean> => {
    return new Promise((resolve) => {
      if ((window as any).FlutterwaveCheckout) return resolve(true);
      const existing = document.getElementById('flutterwave-checkout-script');
      if (existing) {
        existing.addEventListener('load', () => resolve(true));
        existing.addEventListener('error', () => resolve(false));
        setTimeout(() => resolve(!!(window as any).FlutterwaveCheckout), 4000);
        return;
      }
      const script = document.createElement('script');
      script.id = 'flutterwave-checkout-script';
      script.src = 'https://checkout.flutterwave.com/v3.js';
      script.async = true;
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
      setTimeout(() => resolve(!!(window as any).FlutterwaveCheckout), 4000);
    });
  };

  const handleDeposit = async () => {
    setStatusMsg(null);
    const num = parseFloat(amount);
    if (!num || num <= 0) {
      setStatusMsg({ text: `Please enter a valid deposit amount in ${depositCurrency.code}.`, error: true });
      return;
    }

    const currentEmail = (depositEmail || user?.email || '').trim();
    if (!currentEmail || !currentEmail.includes('@')) {
      setStatusMsg({ text: 'Please enter a valid email address for your payment receipt.', error: true });
      return;
    }

    const convertedRwf = Math.round(num * depositCurrency.rateToRwf);
    if (convertedRwf < 100) {
      setStatusMsg({ text: 'Minimum deposit equivalent is 100 RWF.', error: true });
      return;
    }

    try {
      setLoading(true);

      // 1. Ensure Flutterwave checkout script is ready
      const isReady = await ensureFlutterwaveReady();
      if (!isReady && !(window as any).FlutterwaveCheckout) {
        setStatusMsg({
          text: 'Payment gateway script failed to load. Please check your internet connection or ad-blocker and try again.',
          error: true
        });
        setLoading(false);
        return;
      }

      // 2. Initialize real transaction reference with backend & retrieve active public key
      const initRes = await fetch('/api/wallet/flutterwave/initialize', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          amount: num,
          currency: depositCurrency.code
        })
      });

      const initData = await initRes.json();
      if (!initRes.ok || !initData.success) {
        setStatusMsg({
          text: initData.error || 'Failed to initialize deposit gateway. Please retry.',
          error: true
        });
        setLoading(false);
        return;
      }

      const txRef = initData.txRef || initData.tx_ref || `FLW-BENIX-${Date.now()}`;
      const flwPublicKey = (initData.publicKey || initData.public_key || '').trim();

      if (!flwPublicKey || flwPublicKey.includes('SANDBOXDEMO')) {
        setStatusMsg({
          text: 'Flutterwave public key is not configured in Admin Settings. Please contact the administrator.',
          error: true
        });
        setLoading(false);
        return;
      }

      // 3. Open Flutterwave checkout popup with verified public key
      if (typeof window.FlutterwaveCheckout === 'function') {
        window.FlutterwaveCheckout({
          public_key: flwPublicKey,
          tx_ref: txRef,
          amount: num,
          currency: depositCurrency.code,
          payment_options: 'card,mobilemoneyrwanda,mobilemoneyuganda,mobilemoneyghana,mpesa,banktransfer,ussd',
          customer: {
            email: currentEmail,
            phone_number: (depositPhone || user?.phone || '0780000000').trim(),
            name: user?.name || 'Benix Member'
          },
          customizations: {
            title: 'Benix.Space Central Wallet',
            description: `Deposit ${num} ${depositCurrency.code} (≈ ${convertedRwf.toLocaleString()} RWF)`,
            logo: `${window.location.origin}/logo.png`
          },
          callback: async (response: any) => {
            // 4. Verify payment reference on backend & credit wallet
            try {
              const verifyRes = await fetch('/api/wallet/flutterwave/verify', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({
                  txRef,
                  convertedRwf,
                  currency: depositCurrency.code,
                  originalAmount: num,
                  flwRef: response?.transaction_id || response?.flw_ref
                })
              });
              const vData = await verifyRes.json();
              if (verifyRes.ok && vData.success) {
                notificationSound.playNotificationChime();
                setStatusMsg({
                  text: `🎉 Successfully deposited ${num} ${depositCurrency.code} (credited ${convertedRwf.toLocaleString()} RWF) via Flutterwave!`
                });
                updateWalletBalance(vData.newBalance);
                setAmount('');
                loadTransactions();
              } else {
                setStatusMsg({ text: vData.error || 'Payment verification failed.', error: true });
              }
            } catch (vErr: any) {
              setStatusMsg({ text: vErr.message || 'Payment verification failed.', error: true });
            } finally {
              setLoading(false);
            }
          },
          onclose: () => {
            setLoading(false);
          }
        });
      } else {
        setStatusMsg({
          text: 'Payment engine is still preparing. Please click "Confirm Deposit via Flutterwave" once more.',
          error: true
        });
        setLoading(false);
      }
    } catch (err: any) {
      setStatusMsg({ text: err.message || 'Deposit initialization failed.', error: true });
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
      const data = await parseSafeJson(res);
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

  const handleClaimDailyBonus = async () => {
    setClaimingBonus(true);
    try {
      const res = await claimDailyBonus();
      if (res.success) {
        notificationSound.playNotificationChime();
        setStatusMsg({ text: `🎉 Claimed ${res.bonusAmount || 200} RWF Daily Login Bonus!` });
        loadTransactions();
      } else {
        setStatusMsg({ text: res.message || 'Daily login bonus already claimed today.', error: !res.success });
      }
    } catch {
      setStatusMsg({ text: 'Could not claim daily bonus right now.', error: true });
    } finally {
      setClaimingBonus(false);
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

        {/* Dual Balance Showcase Card */}
        <div className="p-6 pb-2">
          <div className="p-5 rounded-2xl bg-gradient-to-br from-[#162032] via-[#101726] to-[#0B0F1A] border border-slate-800 text-white shadow-xl relative overflow-hidden space-y-3">
            <div className="grid grid-cols-2 gap-4 divide-x divide-slate-800">
              {/* Real Deposit & Earnings Balance */}
              <div className="pr-2">
                <span className="text-[11px] font-bold text-slate-400 block uppercase tracking-wider">Real Balance</span>
                <div className="text-2xl font-black mt-1 text-white">
                  {Number(wallet?.balance || 0).toLocaleString()} <span className="text-xs text-emerald-400 font-bold">{wallet?.currency || 'RWF'}</span>
                </div>
                <span className="text-[10px] text-emerald-400 font-medium block mt-0.5">Deposits & Earnings</span>
              </div>

              {/* Bonus Balance */}
              <div className="pl-4">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-amber-400 uppercase tracking-wider">Bonus Balance</span>
                  <span className="px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 text-[9px] font-black">Usage First</span>
                </div>
                <div className="text-2xl font-black mt-1 text-amber-300">
                  {Number(wallet?.bonus_balance || 0).toLocaleString()} <span className="text-xs text-amber-400 font-bold">RWF</span>
                </div>
                <span className="text-[10px] text-slate-400 font-medium block mt-0.5">Welcome + Daily Logins</span>
              </div>
            </div>

            {/* Daily Login Bonus Row */}
            <div className="mt-3 pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs">
              <div className="flex items-center gap-1.5 text-amber-300">
                <Gift className="w-3.5 h-3.5" />
                <span className="text-[11px] font-bold">Daily Login Bonus: 200 RWF</span>
              </div>
              <button
                onClick={handleClaimDailyBonus}
                disabled={claimingBonus}
                className="px-3 py-1 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-[11px] font-black shadow-md transition-all disabled:opacity-50"
              >
                {claimingBonus ? 'Claiming...' : 'Claim Today'}
              </button>
            </div>
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

          {/* TAB 3: DEPOSIT (TOP UP VIA REAL FLUTTERWAVE - MULTI-CURRENCY) */}
          {tab === 'deposit' && (
            <div className="space-y-4">
              {/* Currency Selector */}
              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5 flex items-center justify-between">
                  <span>Select Deposit Currency</span>
                  <span className="text-[10px] text-blue-400 font-normal">Real-Time Currency Rates</span>
                </label>
                <div className="grid grid-cols-4 gap-1.5">
                  {DEPOSIT_CURRENCIES.map((curr) => {
                    const isSel = depositCurrency.code === curr.code;
                    return (
                      <button
                        key={curr.code}
                        type="button"
                        onClick={() => setDepositCurrency(curr)}
                        className={`p-2 rounded-xl border text-xs font-bold transition-all flex flex-col items-center justify-center gap-0.5 ${
                          isSel
                            ? 'border-emerald-500 bg-emerald-500/20 text-emerald-300 shadow-md ring-1 ring-emerald-500/40'
                            : 'border-slate-800 bg-[#161D2E] text-slate-400 hover:text-white'
                        }`}
                      >
                        <span className="text-base">{curr.flag}</span>
                        <span className="text-[11px] font-black">{curr.code}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Amount Input */}
              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1 flex items-center justify-between">
                  <span>Deposit Amount ({depositCurrency.code})</span>
                  {depositCurrency.code !== 'RWF' && (
                    <span className="text-[10px] text-emerald-400 font-mono">
                      1 {depositCurrency.code} ≈ {depositCurrency.rateToRwf.toLocaleString()} RWF
                    </span>
                  )}
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-3 text-slate-400 font-black text-sm">
                    {depositCurrency.symbol}
                  </span>
                  <input
                    type="number"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder={depositCurrency.code === 'RWF' ? 'e.g. 5000' : 'e.g. 10'}
                    className="w-full pl-12 pr-4 py-3 rounded-xl bg-[#161D2E] border border-slate-700 text-white text-sm focus:outline-none focus:border-emerald-500 font-bold"
                  />
                </div>
                {/* Live RWF Credit Preview */}
                {amount && parseFloat(amount) > 0 && depositCurrency.code !== 'RWF' && (
                  <p className="text-[11px] text-emerald-400 mt-1.5 font-bold flex items-center gap-1">
                    <span>≈ {Math.round(parseFloat(amount) * depositCurrency.rateToRwf).toLocaleString()} RWF</span>
                    <span className="text-slate-400 font-normal">will be credited to your central wallet</span>
                  </p>
                )}
              </div>

              {/* Email & Phone Confirmation for Payment Receipt */}
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                    Receipt Email *
                  </label>
                  <input
                    type="email"
                    value={depositEmail}
                    onChange={(e) => setDepositEmail(e.target.value)}
                    placeholder="name@email.com"
                    required
                    className="w-full px-3 py-2 rounded-xl bg-[#161D2E] border border-slate-700 text-white text-xs focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                    Payment Phone
                  </label>
                  <input
                    type="tel"
                    value={depositPhone}
                    onChange={(e) => setDepositPhone(e.target.value)}
                    placeholder="078xxxxxxx"
                    className="w-full px-3 py-2 rounded-xl bg-[#161D2E] border border-slate-700 text-white text-xs focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              {/* Payment Channel Info */}
              <div className="p-3 rounded-2xl bg-slate-900/80 border border-slate-800 text-[11px] text-slate-400 space-y-1">
                <div className="flex items-center gap-1.5 text-slate-300 font-semibold text-xs">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  <span>Secured by Flutterwave Official Gateway</span>
                </div>
                <p className="text-[10px] leading-relaxed">
                  Supports MTN MoMo Rwanda, Airtel Money, Visa, Mastercard, M-Pesa, UGX Mobile Money, and International Bank Cards.
                </p>
              </div>

              <button
                onClick={handleDeposit}
                disabled={loading || !amount || parseFloat(amount) <= 0}
                className="w-full py-3.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-bold text-xs hover:from-emerald-500 hover:to-teal-500 shadow-lg shadow-emerald-600/30 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
              >
                <ArrowDownLeft className="w-4 h-4" />
                <span>
                  {loading
                    ? 'Launching Flutterwave Checkout...'
                    : `Confirm Deposit of ${amount || '0'} ${depositCurrency.code} via Flutterwave`}
                </span>
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
