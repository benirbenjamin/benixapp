'use client';

import React, { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useChoir } from '@/lib/context/ChoirContext';
import { subscriptionService } from '@/lib/services/subscriptionService';
import { SubscriptionPlan } from '@/lib/types/database.types';
import { Crown, CheckCircle2, ArrowRight, Sparkles, Shield, AlertCircle } from 'lucide-react';
import { GooglePayButton } from '@/components/payments/GooglePayButton';
import { FlutterwaveButton } from '@/components/payments/FlutterwaveButton';
import { platformSettingsService } from '@/lib/services/platformSettingsService';
import { PlatformPaymentSettings } from '@/lib/types/database.types';
import { useAuth } from '@/lib/context/AuthContext';

function PlanSelectContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user } = useAuth();
  const { activeChoir, refreshChoirs } = useChoir();

  const choirId = searchParams.get('choirId') || activeChoir?.id;
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [selectedPlanId, setSelectedPlanId] = useState<string | null>(null);
  const [currentActivePlanId, setCurrentActivePlanId] = useState<string | null>(null);
  const [billingInterval, setBillingInterval] = useState<'1M' | '3M' | '6M' | '12M'>('1M');
  const [platformSettings, setPlatformSettings] = useState<PlatformPaymentSettings>({
    google_pay_enabled: true,
    flutterwave_enabled: true,
  });

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadPlans() {
      setLoading(true);
      const [data, settings, activeSubData] = await Promise.all([
        subscriptionService.getAllPlans(),
        platformSettingsService.getSettings(),
        choirId ? subscriptionService.getChoirSubscription(choirId) : Promise.resolve(null),
      ]);
      setPlans(data);
      setPlatformSettings(settings);

      let activePlanId: string | null = null;
      if (activeSubData?.plan?.id) {
        activePlanId = activeSubData.plan.id;
        setCurrentActivePlanId(activePlanId);
        setSelectedPlanId(activePlanId);
      } else if (data.length > 0) {
        const defaultPlan = data.find(p => p.is_free) || data[0];
        setSelectedPlanId(defaultPlan.id);
      }

      // Handle Flutterwave Redirect Auto-Verification
      const statusParam = searchParams.get('status');
      const txIdParam = searchParams.get('transaction_id');
      const planIdParam = searchParams.get('planId');
      const monthsCountParam = Number(searchParams.get('monthsCount')) || 1;

      if ((statusParam === 'successful' || statusParam === 'completed' || txIdParam) && choirId && planIdParam) {
        try {
          const verifyRes = await fetch('/api/payments/flutterwave/verify', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              transactionId: txIdParam || 'flw_redirect_tx',
              choirId,
              planId: planIdParam,
              monthsCount: monthsCountParam,
            }),
          });
          const verifyData = await verifyRes.json();
          if (verifyData.success) {
            await refreshChoirs(choirId);
            router.push('/dashboard');
          }
        } catch {}
      }

      setLoading(false);
    }
    loadPlans();
  }, [searchParams, choirId]);

  const handleConfirmPlan = async () => {
    if (!choirId || !selectedPlanId) {
      setError('Please select a choir and subscription plan.');
      return;
    }

    setSubmitting(true);
    setError(null);

    const { success, error: err } = await subscriptionService.setChoirPlan(choirId, selectedPlanId);

    if (!success) {
      setError(err || 'Failed to update subscription plan.');
      setSubmitting(false);
    } else {
      await refreshChoirs(choirId);
      router.push('/dashboard');
    }
  };

  if (loading) {
    return (
      <div className="min-h-[60vh] flex flex-col justify-center items-center text-slate-400">
        <div className="w-10 h-10 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mb-4" />
        <p className="text-xs font-semibold">Loading Subscription Plans from Database...</p>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-8 text-[#475569] py-6 font-sans">
      <div className="text-center space-y-3">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#DFF1FF] border border-[#B9E2FF] text-[#475569] text-xs font-bold uppercase tracking-wider">
          <Crown className="w-4 h-4 text-purple-600" /> Choir Subscription Setup
        </div>
        <h1 className="text-3xl md:text-5xl font-extrabold text-[#475569]">Select Your Choir SaaS Plan</h1>
        <p className="text-sm sm:text-base text-[#475569]/90 max-w-xl mx-auto">
          Choose a subscription plan for <strong className="text-purple-600 font-bold">{activeChoir?.name || 'Your Choir'}</strong> directly from our active plans database.
        </p>
      </div>

      {error && (
        <div className="bg-rose-50 border border-rose-200 text-rose-700 p-4 rounded-2xl text-xs flex items-center gap-2 max-w-lg mx-auto">
          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Billing Duration Selector Tabs with Discount Badges */}
      <div className="flex justify-center">
        <div className="bg-[#F5FAFF] p-1.5 rounded-2xl border border-[#E6F2FC] flex flex-wrap justify-center gap-1.5 shadow-sm max-w-2xl w-full">
          <button
            type="button"
            onClick={() => setBillingInterval('1M')}
            className={`px-4 py-2.5 rounded-xl font-bold text-xs transition-all flex items-center gap-1.5 cursor-pointer ${
              billingInterval === '1M'
                ? 'bg-[#B9E2FF] text-[#475569] border border-[#E6F2FC] shadow-sm font-extrabold'
                : 'text-[#A8B5C2] hover:text-[#475569] hover:bg-[#DFF1FF]'
            }`}
          >
            Monthly Pay (1 Mo)
          </button>

          <button
            type="button"
            onClick={() => setBillingInterval('3M')}
            className={`px-4 py-2.5 rounded-xl font-bold text-xs transition-all flex items-center gap-1.5 cursor-pointer ${
              billingInterval === '3M'
                ? 'bg-[#B9E2FF] text-[#475569] border border-[#E6F2FC] shadow-sm font-extrabold'
                : 'text-[#A8B5C2] hover:text-[#475569] hover:bg-[#DFF1FF]'
            }`}
          >
            3 Months <span className="bg-[#DFF1FF] text-[#475569] text-[10px] px-2 py-0.5 rounded-full border border-[#B9E2FF] font-bold">SAVE %</span>
          </button>

          <button
            type="button"
            onClick={() => setBillingInterval('6M')}
            className={`px-4 py-2.5 rounded-xl font-bold text-xs transition-all flex items-center gap-1.5 cursor-pointer ${
              billingInterval === '6M'
                ? 'bg-[#B9E2FF] text-[#475569] border border-[#E6F2FC] shadow-sm font-extrabold'
                : 'text-[#A8B5C2] hover:text-[#475569] hover:bg-[#DFF1FF]'
            }`}
          >
            6 Months <span className="bg-[#DFF1FF] text-[#475569] text-[10px] px-2 py-0.5 rounded-full border border-[#B9E2FF] font-bold">SAVE MORE</span>
          </button>

          <button
            type="button"
            onClick={() => setBillingInterval('12M')}
            className={`px-4 py-2.5 rounded-xl font-bold text-xs transition-all flex items-center gap-1.5 cursor-pointer ${
              billingInterval === '12M'
                ? 'bg-[#B9E2FF] text-[#475569] border border-[#E6F2FC] shadow-sm font-black'
                : 'text-[#475569] hover:bg-[#DFF1FF]'
            }`}
          >
            Yearly (12 Mo) <Sparkles className="w-3.5 h-3.5 text-purple-600" />
          </button>
        </div>
      </div>

      {/* Subscription Plans Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {plans.map(plan => {
          const isSelected = selectedPlanId === plan.id;
          const isCurrentActive = currentActivePlanId === plan.id;

          // Calculate interval parameters
          let monthsCount = 1;
          let discountPct = 0;
          if (billingInterval === '3M') {
            monthsCount = 3;
            discountPct = plan.discount_3_months ?? 10;
          } else if (billingInterval === '6M') {
            monthsCount = 6;
            discountPct = plan.discount_6_months ?? 20;
          } else if (billingInterval === '12M') {
            monthsCount = 12;
            discountPct = plan.discount_12_months ?? 30;
          }

          const rawTotal = (plan.price_monthly || 0) * monthsCount;
          const finalTotal = plan.is_free ? 0 : Number((rawTotal * (1 - discountPct / 100)).toFixed(2));
          const effectiveMonthly = plan.is_free ? 0 : Number((finalTotal / monthsCount).toFixed(2));

          return (
            <div
              key={plan.id}
              onClick={() => setSelectedPlanId(plan.id)}
              className={`p-8 rounded-3xl border-2 transition-all cursor-pointer flex flex-col justify-between space-y-6 ${
                isCurrentActive || isSelected
                  ? 'bg-[#FFFFFF] border-2 border-[#B9E2FF] shadow-xl ring-2 ring-[#B9E2FF]/50 scale-[1.02]'
                  : 'bg-[#FFFFFF] border-[#E6F2FC] shadow-sm hover:shadow-md'
              }`}
            >
              <div className="space-y-4">
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <span className="text-xs font-bold text-[#475569] uppercase tracking-widest">{plan.name}</span>
                  {isCurrentActive ? (
                    <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-extrabold uppercase tracking-wider px-3 py-1 rounded-full flex items-center gap-1 shadow-sm">
                      ✓ Active Subscription
                    </span>
                  ) : isSelected ? (
                    <span className="bg-[#DFF1FF] text-[#475569] border border-[#B9E2FF] text-[10px] font-extrabold uppercase tracking-widest px-3 py-1 rounded-full">
                      Selected
                    </span>
                  ) : null}
                </div>

                <div className="space-y-1">
                  <div className="flex items-baseline gap-1">
                    <span className="text-4xl font-extrabold text-[#475569]">
                      ${plan.is_free ? '0' : finalTotal}
                    </span>
                    <span className="text-xs font-semibold text-[#A8B5C2]">
                      / {monthsCount === 1 ? 'month' : `${monthsCount} months`}
                    </span>
                  </div>

                  {!plan.is_free && monthsCount > 1 && (
                    <div className="flex items-center gap-2 text-xs">
                      <span className="line-through text-[#A8B5C2]">${rawTotal}</span>
                      <span className="text-amber-700 font-extrabold bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full text-[10px]">
                        {discountPct}% OFF ({`$${effectiveMonthly}/mo`})
                      </span>
                    </div>
                  )}
                </div>

                <p className="text-sm text-[#475569]/90 leading-relaxed">{plan.description}</p>

                {/* Plan Limits Badges */}
                <div className="bg-[#F5FAFF] p-3.5 rounded-2xl border border-[#E6F2FC] space-y-2 text-xs font-mono">
                  <div className="flex justify-between text-[#475569]">
                    <span className="text-[#A8B5C2] font-medium">Max Singers:</span>
                    <strong className="text-[#475569] font-bold">
                      {plan.limits?.max_members < 0 || (plan.limits?.max_members || 0) >= 999000 ? 'Unlimited' : `${plan.limits?.max_members || 15} Members`}
                    </strong>
                  </div>
                  <div className="flex justify-between text-[#475569]">
                    <span className="text-[#A8B5C2] font-medium">Song Library:</span>
                    <strong className="text-[#475569] font-bold">
                      {plan.limits?.max_songs < 0 || (plan.limits?.max_songs || 0) >= 999000 ? 'Unlimited' : `${plan.limits?.max_songs || 5} Songs`}
                    </strong>
                  </div>
                  <div className="flex justify-between text-[#475569]">
                    <span className="text-[#A8B5C2] font-medium">Monthly Events:</span>
                    <strong className="text-[#475569] font-bold">
                      {plan.limits?.max_events_per_month < 0 || (plan.limits?.max_events_per_month || 0) >= 999000 ? 'Unlimited' : `${plan.limits?.max_events_per_month || 4} Events/Mo`}
                    </strong>
                  </div>
                  <div className="flex justify-between text-[#475569]">
                    <span className="text-[#A8B5C2] font-medium">Announcements:</span>
                    <strong className="text-[#475569] font-bold">
                      {plan.limits?.max_announcements_per_month < 0 || (plan.limits?.max_announcements_per_month || 0) >= 999000 ? 'Unlimited' : `${plan.limits?.max_announcements_per_month || 3} Notices/Mo`}
                    </strong>
                  </div>
                </div>

                <div className="pt-2 border-t border-[#E6F2FC] space-y-2">
                  <span className="text-xs font-bold text-[#A8B5C2] uppercase tracking-wider block">Included Feature Flags:</span>
                  <ul className="space-y-2 text-sm text-[#475569]">
                    {(plan.features || []).map((feat, idx) => (
                      <li key={idx} className="flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                        <span className="capitalize">{feat.replace(/_/g, ' ')}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Payment Buttons Section */}
              <div className="pt-2 space-y-2.5">
                {!plan.is_free && choirId ? (
                  <>
                    {/* Google Pay Gateway Button */}
                    {platformSettings.google_pay_enabled && (
                      <GooglePayButton
                        planId={plan.id}
                        planName={plan.name}
                        priceMonthly={finalTotal}
                        choirId={choirId}
                        onSuccess={async () => {
                          await refreshChoirs(choirId);
                          router.push('/dashboard');
                        }}
                      />
                    )}

                    {/* Flutterwave Gateway Button */}
                    {platformSettings.flutterwave_enabled && (
                      <FlutterwaveButton
                        planId={plan.id}
                        planName={plan.name}
                        usdAmount={finalTotal}
                        monthsCount={monthsCount}
                        choirId={choirId}
                        userEmail={user?.email}
                        userName={user?.full_name || 'Choir Director'}
                        onSuccess={async () => {
                          await refreshChoirs(choirId);
                          router.push('/dashboard');
                        }}
                      />
                    )}
                  </>
                ) : (
                  <button
                    type="button"
                    className={`w-full py-3.5 rounded-xl font-extrabold text-xs transition-all flex items-center justify-center gap-2 border border-[#E6F2FC] ${
                      isCurrentActive
                        ? 'bg-emerald-50 text-emerald-700 shadow-sm'
                        : isSelected
                        ? 'bg-[#B9E2FF] text-[#475569] shadow-sm'
                        : 'bg-[#F5FAFF] text-[#475569] hover:bg-[#DFF1FF]'
                    }`}
                  >
                    {isCurrentActive ? '✓ Current Active Plan' : isSelected ? 'Selected Free Plan' : 'Choose Free Plan'}
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Confirm & Save Button */}
      <div className="flex justify-center pt-4">
        <button
          onClick={handleConfirmPlan}
          disabled={submitting}
          className="bg-[#B9E2FF] hover:bg-[#a5d8ff] text-[#475569] font-extrabold px-8 py-4 rounded-2xl shadow-sm text-sm border border-[#E6F2FC] flex items-center gap-2 transition-all hover:scale-105 cursor-pointer"
        >
          {submitting ? 'Activating Plan...' : 'Confirm Plan & Go to Dashboard'} <ArrowRight className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
}

export default function PlanSelectPage() {
  return (
    <Suspense fallback={
      <div className="min-h-[60vh] flex items-center justify-center text-slate-400 text-xs">
        Loading Subscription Selection...
      </div>
    }>
      <PlanSelectContent />
    </Suspense>
  );
}
