import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { notificationSound } from '../../utils/notificationSound';
import {
  X,
  Zap,
  Check,
  ShieldCheck,
  Sparkles,
  Wallet,
  Clock,
  Heart,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { getAuthToken } from '../../services/api';

interface Plan {
  code: string;
  name: string;
  price: number;
  durationHours: number;
  description: string;
}

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onOpenWallet: () => void;
}

export const KundaSubscriptionModal: React.FC<Props> = ({ isOpen, onClose, onOpenWallet }) => {
  const { wallet, refreshWallet } = useAuth();
  const [plans, setPlans] = useState<Plan[]>([
    {
      code: 'pass_24h',
      name: '24 Hours Pass',
      price: 500,
      durationHours: 24,
      description: 'Unlimited private messaging for 24 hours'
    },
    {
      code: 'pass_3d',
      name: '3-Day Pass',
      price: 1200,
      durationHours: 72,
      description: 'Unlimited messaging for 3 days (Most Popular)'
    },
    {
      code: 'pass_weekly',
      name: 'Weekly VIP Pass',
      price: 2500,
      durationHours: 168,
      description: 'Unlimited messaging for 7 days + priority matching'
    },
    {
      code: 'pass_monthly',
      name: 'Monthly Elite Pass',
      price: 6000,
      durationHours: 720,
      description: 'Unlimited messaging for 30 days + VIP verified badge'
    }
  ]);
  const [loading, setLoading] = useState(false);
  const [subscribingCode, setSubscribingCode] = useState<string | null>(null);
  const [statusMsg, setStatusMsg] = useState<{ text: string; error?: boolean } | null>(null);

  useEffect(() => {
    if (isOpen) {
      fetchPlans();
    }
  }, [isOpen]);

  const fetchPlans = async () => {
    try {
      const res = await fetch('/api/modules/kunda/plans');
      if (res.ok) {
        const data = await res.json();
        if (data.plans) setPlans(data.plans);
      }
    } catch (e) {
      console.warn('Failed to load plans:', e);
    }
  };

  const handleSubscribe = async (plan: Plan) => {
    const token = getAuthToken();
    if (!token) {
      setStatusMsg({ text: 'Please sign in to activate membership pass.', error: true });
      return;
    }

    const currentBalance = Number(wallet?.balance || 0);
    if (currentBalance < plan.price) {
      setStatusMsg({
        text: `Insufficient balance (${plan.price.toLocaleString()} RWF needed, you have ${currentBalance.toLocaleString()} RWF). Please top up.`,
        error: true
      });
      return;
    }

    setSubscribingCode(plan.code);
    setStatusMsg(null);

    try {
      const res = await fetch('/api/modules/kunda/subscribe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ planCode: plan.code })
      });

      const data = await res.json();

      if (res.ok && data.success) {
        setStatusMsg({ text: data.message || 'Pass activated successfully!' });
        notificationSound.playNotificationChime();
        refreshWallet();
      } else {
        setStatusMsg({ text: data.message || data.error || 'Failed to activate pass.', error: true });
      }
    } catch (err: any) {
      setStatusMsg({ text: 'Network connection failed. Please try again.', error: true });
    } finally {
      setSubscribingCode(null);
    }
  };

  if (!isOpen) return null;

  const currentBalance = Number(wallet?.balance || 0);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/85 backdrop-blur-md animate-fadeIn select-none">
      <div className="relative w-full max-w-xl bg-[#0E1524] text-white rounded-3xl shadow-2xl border border-rose-500/30 flex flex-col overflow-hidden max-h-[90vh] animate-scaleUp">
        
        {/* Header Bar */}
        <div className="px-5 py-4 bg-gradient-to-r from-rose-900/70 via-[#161F33] to-[#0E1524] border-b border-slate-800 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-rose-500/20 text-rose-400">
              <Heart className="w-5 h-5 fill-rose-500/40" />
            </div>
            <div>
              <h3 className="font-black text-base sm:text-lg text-white">Kunda Unlimited Passes</h3>
              <p className="text-[11px] text-slate-400">Chat freely without per-message wallet deductions</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Wallet Balance Pill Strip */}
        <div className="px-5 py-2.5 bg-[#12192A] border-b border-slate-800 flex items-center justify-between text-xs shrink-0">
          <div className="flex items-center gap-2 text-slate-300">
            <Wallet className="w-4 h-4 text-emerald-400" />
            <span>Central Wallet: <strong className="text-emerald-400 font-extrabold">{currentBalance.toLocaleString()} RWF</strong></span>
          </div>

          <button
            onClick={() => {
              onClose();
              onOpenWallet();
            }}
            className="px-3 py-1 rounded-xl bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/30 text-emerald-400 text-[11px] font-bold transition-all"
          >
            + Top Up Wallet
          </button>
        </div>

        {/* Status Message */}
        {statusMsg && (
          <div
            className={`px-5 py-2.5 text-xs font-bold flex items-center gap-2 shrink-0 ${
              statusMsg.error
                ? 'bg-rose-950/70 text-rose-200 border-b border-rose-500/40'
                : 'bg-emerald-950/70 text-emerald-200 border-b border-emerald-500/40'
            }`}
          >
            {statusMsg.error ? <AlertCircle className="w-4 h-4 shrink-0" /> : <CheckCircle2 className="w-4 h-4 shrink-0" />}
            <span>{statusMsg.text}</span>
          </div>
        )}

        {/* Plan Cards Grid */}
        <div className="p-5 overflow-y-auto space-y-3 flex-1">
          {plans.map((plan) => {
            const isPopular = plan.code === 'pass_3d';
            const canAfford = currentBalance >= plan.price;
            const isSubscribing = subscribingCode === plan.code;

            return (
              <div
                key={plan.code}
                className={`p-4 rounded-2xl border transition-all relative overflow-hidden flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
                  isPopular
                    ? 'bg-gradient-to-r from-rose-950/40 via-purple-950/30 to-slate-900 border-rose-500/50 shadow-lg'
                    : 'bg-slate-900/70 border-slate-800 hover:border-slate-700'
                }`}
              >
                {isPopular && (
                  <span className="absolute top-2 right-2 px-2 py-0.5 rounded-full bg-rose-600 text-white text-[9px] font-black uppercase tracking-wider shadow-sm">
                    Most Popular
                  </span>
                )}

                <div className="space-y-1 min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <Zap className="w-4 h-4 text-amber-400 shrink-0" />
                    <h4 className="font-extrabold text-sm text-white">{plan.name}</h4>
                  </div>
                  <p className="text-xs text-slate-400">{plan.description}</p>
                  <p className="text-[11px] text-slate-500 flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    <span>Duration: {plan.durationHours} hours</span>
                  </p>
                </div>

                <div className="flex items-center sm:flex-col items-end gap-2 shrink-0">
                  <div className="text-right">
                    <span className="font-black text-lg text-white">{plan.price.toLocaleString()}</span>
                    <span className="text-xs text-amber-400 font-bold ml-1">RWF</span>
                  </div>

                  <button
                    onClick={() => handleSubscribe(plan)}
                    disabled={isSubscribing}
                    className={`px-4 py-2 rounded-xl text-xs font-extrabold shadow-md transition-all ${
                      canAfford
                        ? 'bg-gradient-to-r from-rose-600 to-pink-600 hover:from-rose-500 hover:to-pink-500 text-white shadow-rose-600/30 active:scale-95'
                        : 'bg-slate-800 text-slate-400 hover:text-white border border-slate-700'
                    }`}
                  >
                    {isSubscribing ? 'Activating...' : canAfford ? 'Activate Pass' : 'Top Up & Activate'}
                  </button>
                </div>
              </div>
            );
          })}
        </div>

      </div>
    </div>
  );
};
