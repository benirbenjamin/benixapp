import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useWallet } from '../../contexts/WalletContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { DepositModal } from '../../components/ui/DepositModal';
import { Zap, Check, ShieldCheck, Sparkles, AlertCircle } from 'lucide-react';
import { api, getErrorMessage } from '../../lib/api';

export const Subscription: React.FC = () => {
  const { token, refreshSession } = useAuth();
  const { t } = useLanguage();
  const { balance, refreshBalance, setIsDepositModalOpen } = useWallet();

  const [plans, setPlans] = useState<any[]>([]);
  const [activeSub, setActiveSub] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [message, setMessage] = useState<string | null>(null);

  const fetchPlans = async () => {
    try {
      setLoading(true);
      const res = await api.get('/subscriptions/plans');
      if (res.data.success && res.data.plans) {
        setPlans(res.data.plans);
      }

      // Check current session
      const meRes = await api.get('/auth/me');
      if (meRes.data.success && meRes.data.activeSubscription) {
        setActiveSub(meRes.data.activeSubscription);
      }
    } catch (err) {
      console.error('Fetch plans error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) fetchPlans();
  }, [token]);

  const handleSubscribe = async (planCode: string) => {
    if (!token) return;
    setSubmitting(true);
    setMessage(null);

    try {
      const res = await api.post('/subscriptions/subscribe', { planCode });
      const data = res.data;

      if (data.success && data.subscription) {
        setActiveSub(data.subscription);
        setMessage('Subscription successfully activated!');
        refreshBalance();
        refreshSession();
      } else if (data.error === 'INSUFFICIENT_FUNDS') {
        setIsDepositModalOpen(true);
      } else {
        alert(data.message || data.error);
      }
    } catch (err: any) {
      if (err.response?.data?.error === 'INSUFFICIENT_FUNDS') {
        setIsDepositModalOpen(true);
      } else {
        alert(getErrorMessage(err) || 'Subscription failed');
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-8">
      <div>
        <h1 className="text-2xl font-black text-slate-900">Membership Passes</h1>
        <p className="text-xs text-slate-500">
          Unlock unlimited conversations without per-message deductions
        </p>
      </div>

      {message && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center gap-2 text-xs font-bold text-emerald-700">
          <Sparkles className="w-4 h-4 text-emerald-600" />
          <span>{message}</span>
        </div>
      )}

      {/* Active Subscription Status Banner */}
      {activeSub && (
        <div className="bg-gradient-to-r from-violet-600 to-rose-600 text-white rounded-3xl p-6 shadow-float space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-rose-200">
              Active Membership
            </span>
            <Badge variant="emerald" size="sm">
              Active
            </Badge>
          </div>
          <h3 className="text-2xl font-black">{activeSub.planName}</h3>
          <p className="text-xs text-rose-100">
            Valid until {new Date(activeSub.expiresAt).toLocaleDateString()} at{' '}
            {new Date(activeSub.expiresAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </p>
        </div>
      )}

      {/* Available Passes */}
      {(() => {
        const hourlyPlan = plans.find((p) => p.code === 'hourly' || p.code === 'daily') || { price: 1500, currency: 'RWF' };
        const threeDayPlan = plans.find((p) => p.code === 'three_day') || { price: 3000, currency: 'RWF' };
        const weeklyPlan = plans.find((p) => p.code === 'weekly') || { price: 5000, currency: 'RWF' };

        return (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* 24-Hour Pass */}
            <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-card flex flex-col justify-between space-y-6">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-amber-600 uppercase tracking-wider">
                    24-Hour Pass (Daily)
                  </span>
                  <span className="text-xs px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-700 font-bold">
                    Quick Boost
                  </span>
                </div>
                <div className="text-3xl font-black text-slate-900">
                  {hourlyPlan.price.toLocaleString()} {hourlyPlan.currency}
                </div>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Unlimited messaging for 24 hours. Great for instant connection boosts and active dates.
                </p>
                <div className="pt-3 border-t border-slate-100 space-y-2 text-xs text-slate-700">
                  <div className="flex items-center gap-2">
                    <Check className="w-3.5 h-3.5 text-emerald-500" /> 24 hours unlimited messages
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="w-3.5 h-3.5 text-emerald-500" /> No per-message deductions
                  </div>
                </div>
              </div>

              <Button
                variant="outline"
                onClick={() => handleSubscribe('hourly')}
                loading={submitting}
                className="w-full text-xs"
              >
                Activate 24-Hour Pass ({hourlyPlan.price.toLocaleString()} {hourlyPlan.currency})
              </Button>
            </div>

            {/* 3-Day Pass */}
            <div className="bg-white rounded-3xl p-6 border-2 border-rose-500 shadow-card flex flex-col justify-between space-y-6 relative">
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-rose-600 text-white text-[10px] font-bold px-3 py-0.5 rounded-full uppercase tracking-wider">
                Most Popular
              </div>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-rose-600 uppercase tracking-wider">
                    3-Day Connection Pass
                  </span>
                  <span className="text-xs px-2.5 py-0.5 rounded-full bg-rose-50 text-rose-700 font-bold">
                    Weekend Romance
                  </span>
                </div>
                <div className="text-3xl font-black text-slate-900">
                  {threeDayPlan.price.toLocaleString()} {threeDayPlan.currency}
                </div>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Unlimited outgoing messages for 72 hours. Perfect for focused conversation without allowances.
                </p>
                <div className="pt-3 border-t border-slate-100 space-y-2 text-xs text-slate-700">
                  <div className="flex items-center gap-2">
                    <Check className="w-3.5 h-3.5 text-emerald-500" /> 72 hours unlimited messages
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="w-3.5 h-3.5 text-emerald-500" /> Priority recommendations
                  </div>
                </div>
              </div>

              <Button
                onClick={() => handleSubscribe('three_day')}
                loading={submitting}
                className="w-full text-xs"
              >
                Activate 3-Day Pass ({threeDayPlan.price.toLocaleString()} {threeDayPlan.currency})
              </Button>
            </div>

            {/* Weekly Premium Pass */}
            <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-card flex flex-col justify-between space-y-6">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-violet-600 uppercase tracking-wider">
                    Weekly Premium Pass
                  </span>
                  <span className="text-xs px-2.5 py-0.5 rounded-full bg-violet-50 text-violet-700 font-bold">
                    Full Week
                  </span>
                </div>
                <div className="text-3xl font-black text-slate-900">
                  {weeklyPlan.price.toLocaleString()} {weeklyPlan.currency}
                </div>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Full 7 days of unlimited messaging plus top placement in the Discover feed.
                </p>
                <div className="pt-3 border-t border-slate-100 space-y-2 text-xs text-slate-700">
                  <div className="flex items-center gap-2">
                    <Check className="w-3.5 h-3.5 text-emerald-500" /> 7 full days unlimited messages
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="w-3.5 h-3.5 text-emerald-500" /> Top placement in recommendations
                  </div>
                </div>
              </div>

              <Button
                variant="secondary"
                onClick={() => handleSubscribe('weekly')}
                loading={submitting}
                className="w-full text-xs"
              >
                Activate Weekly Pass ({weeklyPlan.price.toLocaleString()} {weeklyPlan.currency})
              </Button>
            </div>
          </div>
        );
      })()}

      <DepositModal />
    </div>
  );
};
