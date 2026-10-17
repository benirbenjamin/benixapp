import React, { useState, useEffect } from 'react';
import { Modal } from './Modal';
import { Button } from './Button';
import { useWallet } from '../../contexts/WalletContext';
import { Smartphone, Building, CheckCircle2, AlertCircle, ShieldCheck } from 'lucide-react';

export const WithdrawModal: React.FC = () => {
  const {
    isWithdrawModalOpen,
    setIsWithdrawModalOpen,
    balance,
    currency,
    savedPayout,
    settings,
    requestWithdrawal,
  } = useWallet();

  const [amount, setAmount] = useState<number>(settings.minWithdrawal || 2000);
  const [payoutMethod, setPayoutMethod] = useState<'momo' | 'airtel' | 'bank'>('momo');
  const [payoutAccount, setPayoutAccount] = useState<string>('');
  const [accountHolderName, setAccountHolderName] = useState<string>('');
  const [bankName, setBankName] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<boolean>(false);

  // Pre-fill with saved details if available
  useEffect(() => {
    if (savedPayout) {
      if (savedPayout.method && ['momo', 'airtel', 'bank'].includes(savedPayout.method)) {
        setPayoutMethod(savedPayout.method as any);
      }
      if (savedPayout.account) {
        setPayoutAccount(savedPayout.account);
      }
      if (savedPayout.accountName) {
        setAccountHolderName(savedPayout.accountName);
      }
      if (savedPayout.bankName) {
        setBankName(savedPayout.bankName);
      }
    }
  }, [savedPayout, isWithdrawModalOpen]);

  const minAmount = settings.minWithdrawal || 2000;
  const canWithdraw = balance >= minAmount;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (amount < minAmount) {
      setError(`Minimum withdrawal amount is ${minAmount.toLocaleString()} ${currency}`);
      return;
    }

    if (amount > balance) {
      setError(`Insufficient withdrawable balance. You have ${balance.toLocaleString()} ${currency} available.`);
      return;
    }

    if (!payoutAccount.trim()) {
      setError('Please provide your phone number or account number.');
      return;
    }

    if (!accountHolderName.trim()) {
      setError('Please provide the account holder name.');
      return;
    }

    if (payoutMethod === 'bank' && !bankName.trim()) {
      setError('Please select or specify your bank name.');
      return;
    }

    setLoading(true);
    const res = await requestWithdrawal({
      amount,
      payoutMethod,
      payoutAccount: payoutAccount.trim(),
      accountHolderName: accountHolderName.trim(),
      bankName: payoutMethod === 'bank' ? bankName.trim() : undefined,
    });
    setLoading(false);

    if (res.success) {
      setSuccess(true);
    } else {
      setError(res.error || 'Failed to submit withdrawal request.');
    }
  };

  const handleClose = () => {
    setError(null);
    setSuccess(false);
    setIsWithdrawModalOpen(false);
  };

  return (
    <Modal isOpen={isWithdrawModalOpen} onClose={handleClose} title="Request Payout / Kubikuza">
      {success ? (
        <div className="text-center py-6 space-y-4">
          <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto animate-bounce">
            <CheckCircle2 className="w-10 h-10" />
          </div>
          <h4 className="text-lg font-black text-slate-900">Withdrawal Request Submitted!</h4>
          <p className="text-xs text-slate-600 max-w-sm mx-auto leading-relaxed">
            Your request for <strong className="text-emerald-600">{amount.toLocaleString()} {currency}</strong> has been
            queued. Payouts via {payoutMethod.toUpperCase()} ({payoutAccount}) are processed within 1-2 hours.
          </p>
          <div className="bg-slate-50 border border-slate-100 rounded-2xl p-3 text-left text-xs text-slate-600 space-y-1">
            <p><strong>Method:</strong> {payoutMethod === 'momo' ? 'MTN MoMo' : payoutMethod === 'airtel' ? 'Airtel Money' : `Bank (${bankName})`}</p>
            <p><strong>Account:</strong> {payoutAccount}</p>
            <p><strong>Recipient:</strong> {accountHolderName}</p>
          </div>
          <Button onClick={handleClose} className="w-full">
            Done / Yego
          </Button>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Balance notification */}
          <div className="bg-slate-50 rounded-2xl p-3 border border-slate-100 flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Withdrawable Balance</span>
            <span className="text-sm font-black text-slate-900">
              {balance.toLocaleString()} {currency}
            </span>
          </div>

          {!canWithdraw && (
            <div className="p-3 bg-amber-50 border border-amber-200 text-amber-800 rounded-2xl text-xs flex items-start gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
              <span>
                Minimum withdrawal is <strong>{minAmount.toLocaleString()} {currency}</strong>. Invite friends or earn
                commissions to reach the payout threshold!
              </span>
            </div>
          )}

          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-2xl text-xs flex items-start gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* Amount selection */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Amount to Withdraw ({currency})
            </label>
            <input
              type="number"
              min={minAmount}
              max={balance}
              step={100}
              value={amount}
              onChange={(e) => setAmount(Number(e.target.value))}
              disabled={!canWithdraw || loading}
              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-black text-slate-900 focus:outline-none focus:ring-2 focus:ring-rose-500"
            />
            <div className="flex gap-2 mt-2">
              {[minAmount, 5000, 10000, balance].filter((v, i, a) => v <= balance && a.indexOf(v) === i).map((preset) => (
                <button
                  type="button"
                  key={preset}
                  onClick={() => setAmount(preset)}
                  className={`text-[11px] font-bold px-2.5 py-1 rounded-lg border transition ${
                    amount === preset
                      ? 'bg-rose-500 text-white border-rose-500'
                      : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  {preset === balance ? 'Max' : `${preset.toLocaleString()}`}
                </button>
              ))}
            </div>
          </div>

          {/* Payment Method Selector */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              Payout Method / Uburyo bwo Kwakira
            </label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setPayoutMethod('momo')}
                className={`p-3 rounded-2xl border text-center transition flex flex-col items-center gap-1.5 ${
                  payoutMethod === 'momo'
                    ? 'border-yellow-500 bg-yellow-50/50 text-yellow-900 ring-2 ring-yellow-400'
                    : 'border-slate-200 hover:border-slate-300'
                }`}
              >
                <div className="w-7 h-7 rounded-full bg-yellow-400 text-yellow-900 font-black text-[11px] flex items-center justify-center">
                  MTN
                </div>
                <span className="text-xs font-bold">MoMo</span>
              </button>

              <button
                type="button"
                onClick={() => setPayoutMethod('airtel')}
                className={`p-3 rounded-2xl border text-center transition flex flex-col items-center gap-1.5 ${
                  payoutMethod === 'airtel'
                    ? 'border-rose-500 bg-rose-50/50 text-rose-900 ring-2 ring-rose-400'
                    : 'border-slate-200 hover:border-slate-300'
                }`}
              >
                <div className="w-7 h-7 rounded-full bg-red-600 text-white font-black text-[11px] flex items-center justify-center">
                  AIR
                </div>
                <span className="text-xs font-bold">Airtel</span>
              </button>

              <button
                type="button"
                onClick={() => setPayoutMethod('bank')}
                className={`p-3 rounded-2xl border text-center transition flex flex-col items-center gap-1.5 ${
                  payoutMethod === 'bank'
                    ? 'border-blue-500 bg-blue-50/50 text-blue-900 ring-2 ring-blue-400'
                    : 'border-slate-200 hover:border-slate-300'
                }`}
              >
                <div className="w-7 h-7 rounded-full bg-blue-600 text-white flex items-center justify-center">
                  <Building className="w-3.5 h-3.5" />
                </div>
                <span className="text-xs font-bold">Bank</span>
              </button>
            </div>
          </div>

          {/* Account / Phone Number */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              {payoutMethod === 'bank' ? 'Account Number / IBAN' : 'Mobile Money Phone Number'}
            </label>
            <input
              type="text"
              placeholder={payoutMethod === 'bank' ? 'e.g. 00044-01234567-89' : 'e.g. 0788123456 or 0738123456'}
              value={payoutAccount}
              onChange={(e) => setPayoutAccount(e.target.value)}
              required
              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-rose-500"
            />
            {savedPayout.account && savedPayout.account === payoutAccount && (
              <p className="text-[10px] text-emerald-600 font-semibold mt-1">
                ✓ Saved payout account (you can change it anytime)
              </p>
            )}
          </div>

          {/* Account Holder Name */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Account Holder Full Name / Amazina Ari kuri Konti
            </label>
            <input
              type="text"
              placeholder="e.g. Mugisha Jean"
              value={accountHolderName}
              onChange={(e) => setAccountHolderName(e.target.value)}
              required
              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-rose-500"
            />
          </div>

          {/* Bank Selection (If Bank method) */}
          {payoutMethod === 'bank' && (
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Bank Name
              </label>
              <select
                value={bankName}
                onChange={(e) => setBankName(e.target.value)}
                required
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-rose-500"
              >
                <option value="">Select Bank...</option>
                <option value="Bank of Kigali">Bank of Kigali (BK)</option>
                <option value="Equity Bank Rwanda">Equity Bank Rwanda</option>
                <option value="I&M Bank Rwanda">I&M Bank Rwanda</option>
                <option value="Cogebanque">Cogebanque</option>
                <option value="BPR Bank">BPR Bank (Atlas Mara / KCB)</option>
                <option value="Ecobank Rwanda">Ecobank Rwanda</option>
                <option value="Urwego Bank">Urwego Bank</option>
                <option value="Other">Other Bank</option>
              </select>
            </div>
          )}

          <div className="pt-2">
            <Button
              type="submit"
              disabled={!canWithdraw || loading}
              className="w-full shadow-md shadow-rose-200 flex items-center justify-center gap-2"
            >
              <ShieldCheck className="w-4 h-4" />
              {loading ? 'Processing...' : `Confirm Withdrawal of ${amount.toLocaleString()} ${currency}`}
            </Button>
            <p className="text-[10px] text-center text-slate-400 mt-2">
              🔒 Your payout details will be securely saved for next time.
            </p>
          </div>
        </form>
      )}
    </Modal>
  );
};
