import React, { useState } from 'react';
import { Modal } from './Modal';
import { Button } from './Button';
import { useWallet } from '../../contexts/WalletContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { CreditCard, Smartphone, CheckCircle2, ShieldCheck } from 'lucide-react';
import { api } from '../../lib/api';

export const DepositModal: React.FC = () => {
  const { isDepositModalOpen, setIsDepositModalOpen, depositFunds, refreshBalance } = useWallet();
  const { t } = useLanguage();
  const [amount, setAmount] = useState<number>(3000);
  const [loading, setLoading] = useState<boolean>(false);
  const [testComplete, setTestComplete] = useState<boolean>(false);

  const presetAmounts = [1500, 3000, 5000, 10000];

  const handleDeposit = async () => {
    setLoading(true);
    const result = await depositFunds(amount);
    setLoading(false);

    if (result.success && result.paymentUrl) {
      if (result.paymentUrl.includes('test_payment=1')) {
        // Dev Sandbox auto-credited
        try {
          const urlParams = new URLSearchParams(result.paymentUrl.split('?')[1]);
          const txRef = urlParams.get('tx_ref');
          await api.post('/payments/verify', { txRef, amount });
          await refreshBalance();
          setTestComplete(true);
        } catch (err) {
          console.error('Verify error:', err);
        }
      } else {
        // Redirect to real Flutterwave checkout
        window.location.href = result.paymentUrl;
      }
    }
  };

  const closeModal = () => {
    setTestComplete(false);
    setIsDepositModalOpen(false);
  };

  return (
    <Modal isOpen={isDepositModalOpen} onClose={closeModal} title={t('wallet.depositModalTitle')}>
      {testComplete ? (
        <div className="text-center py-6">
          <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4 animate-bounce">
            <CheckCircle2 className="w-10 h-10" />
          </div>
          <h4 className="text-lg font-bold text-slate-900 mb-1">Deposit Confirmed!</h4>
          <p className="text-sm text-slate-600 mb-6">
            Your wallet has been credited with {amount.toLocaleString()} RWF.
          </p>
          <Button onClick={closeModal} className="w-full">
            Done
          </Button>
        </div>
      ) : (
        <div className="space-y-5">
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
              Select Amount (RWF)
            </label>
            <div className="grid grid-cols-2 gap-2 mb-3">
              {presetAmounts.map((preset) => (
                <button
                  key={preset}
                  type="button"
                  onClick={() => setAmount(preset)}
                  className={`py-2.5 px-3 rounded-xl border text-sm font-semibold transition-all ${
                    amount === preset
                      ? 'border-rose-500 bg-rose-50 text-rose-700 ring-2 ring-rose-500/20'
                      : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                  }`}
                >
                  {preset.toLocaleString()} RWF
                </button>
              ))}
            </div>

            <div className="relative mt-2">
              <input
                type="number"
                min="500"
                step="500"
                value={amount}
                onChange={(e) => setAmount(parseInt(e.target.value, 10) || 0)}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm font-semibold text-slate-900 focus:outline-none focus:border-rose-500"
                placeholder="Custom amount"
              />
              <span className="absolute right-3 top-2.5 text-xs font-bold text-slate-400">RWF</span>
            </div>
          </div>

          <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-100">
            <div className="text-xs font-semibold text-slate-700 mb-2 flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              Flutterwave Secured Payment Methods:
            </div>
            <div className="flex items-center gap-4 text-xs text-slate-600">
              <span className="flex items-center gap-1 font-medium">
                <Smartphone className="w-3.5 h-3.5 text-amber-500" /> MTN MoMo
              </span>
              <span className="flex items-center gap-1 font-medium">
                <Smartphone className="w-3.5 h-3.5 text-red-500" /> Airtel Money
              </span>
              <span className="flex items-center gap-1 font-medium">
                <CreditCard className="w-3.5 h-3.5 text-blue-500" /> Visa / Mastercard
              </span>
            </div>
          </div>

          <Button
            onClick={handleDeposit}
            loading={loading}
            className="w-full py-3"
            disabled={amount < 500}
          >
            {t('wallet.payNow')} ({amount.toLocaleString()} RWF)
          </Button>
        </div>
      )}
    </Modal>
  );
};
