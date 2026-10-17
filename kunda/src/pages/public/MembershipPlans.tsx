import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useLanguage } from '../../contexts/LanguageContext';
import { Button } from '../../components/ui/Button';
import { Check, ShieldCheck, Zap, Heart, MessageCircle } from 'lucide-react';
import { api } from '../../lib/api';

export const MembershipPlans: React.FC = () => {
  const { t } = useLanguage();
  const [plans, setPlans] = useState<any[]>([]);
  const [settings, setSettings] = useState<any>({ freeInitialMessages: 3, freeReplies: 3 });

  useEffect(() => {
    api.get('/subscriptions/plans')
      .then((res) => {
        if (res.data?.success) {
          if (Array.isArray(res.data.plans)) setPlans(res.data.plans);
          if (res.data.settings) setSettings(res.data.settings);
        }
      })
      .catch(() => {});
  }, []);

  const hourlyPlan = plans.find((p) => p.code === 'hourly' || p.code === 'daily') || { price: 1500, currency: 'RWF' };
  const threeDayPlan = plans.find((p) => p.code === 'three_day') || { price: 3000, currency: 'RWF' };
  const weeklyPlan = plans.find((p) => p.code === 'weekly') || { price: 5000, currency: 'RWF' };
  const payPerMsgPlan = plans.find((p) => p.code === 'pay_per_message') || { price: 150, currency: 'RWF' };
  const contactUnlockPlan = plans.find((p) => p.code === 'contact_unlock') || { price: 2000, currency: 'RWF' };

  const freeInitialMessages = settings.freeInitialMessages ?? 3;
  const freeReplies = settings.freeReplies ?? 3;

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16 space-y-16">
      <div className="text-center space-y-4 max-w-3xl mx-auto">
        <span className="text-xs font-bold text-rose-600 uppercase tracking-widest">
          Transparent Pricing
        </span>
        <h1 className="text-4xl sm:text-5xl font-extrabold text-slate-900 tracking-tight">
          Membership Plans & Pricing
        </h1>
        <p className="text-lg text-slate-600">
          No hidden recurring fees. Pay only when you want to connect, with secure payments processed via Flutterwave.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {/* Free Plan */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm flex flex-col justify-between space-y-6">
          <div className="space-y-4">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Free Starter</span>
            <div className="text-3xl font-black text-slate-900">0 RWF</div>
            <p className="text-xs text-slate-600">
              {freeInitialMessages} free initial messages and {freeReplies} free replies to start your journey.
            </p>
            <div className="pt-4 border-t border-slate-100 space-y-2.5">
              <div className="flex items-center gap-2 text-xs text-slate-700">
                <Check className="w-4 h-4 text-emerald-500 shrink-0" /> Full Profile Discovery
              </div>
              <div className="flex items-center gap-2 text-xs text-slate-700">
                <Check className="w-4 h-4 text-emerald-500 shrink-0" /> {freeInitialMessages} Free Initial Outgoing Messages
              </div>
              <div className="flex items-center gap-2 text-xs text-slate-700">
                <Check className="w-4 h-4 text-emerald-500 shrink-0" /> {freeReplies} Free Conversation Replies
              </div>
              <div className="flex items-center gap-2 text-xs text-slate-700">
                <Check className="w-4 h-4 text-emerald-500 shrink-0" /> Compatibility Score Breakdown
              </div>
            </div>
          </div>
          <Link to="/auth/register">
            <Button variant="outline" className="w-full text-xs">
              Get Started Free
            </Button>
          </Link>
        </div>

        {/* 24-Hour Pass */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm flex flex-col justify-between space-y-6">
          <div className="space-y-4">
            <span className="text-xs font-bold text-amber-600 uppercase tracking-wider">24-Hour Pass (Daily)</span>
            <div className="text-3xl font-black text-slate-900">{hourlyPlan.price.toLocaleString()} {hourlyPlan.currency}</div>
            <p className="text-xs text-slate-600">Quick connection boost for fast interactions and spontaneous dates.</p>
            <div className="pt-4 border-t border-slate-100 space-y-2.5">
              <div className="flex items-center gap-2 text-xs text-slate-700">
                <Check className="w-4 h-4 text-emerald-500 shrink-0" /> 24 Hours Unlimited Chat
              </div>
              <div className="flex items-center gap-2 text-xs text-slate-700">
                <Check className="w-4 h-4 text-emerald-500 shrink-0" /> No Per-Message Charges
              </div>
              <div className="flex items-center gap-2 text-xs text-slate-700">
                <Check className="w-4 h-4 text-emerald-500 shrink-0" /> Instant Match Delivery
              </div>
              <div className="flex items-center gap-2 text-xs text-slate-700">
                <Check className="w-4 h-4 text-emerald-500 shrink-0" /> Safe Internal Messaging
              </div>
            </div>
          </div>
          <Link to="/auth/register">
            <Button variant="outline" className="w-full text-xs">
              Select 24-Hour Pass
            </Button>
          </Link>
        </div>

        {/* 3-Day Pass */}
        <div className="bg-white rounded-3xl p-6 border-2 border-rose-500 shadow-xl relative flex flex-col justify-between space-y-6">
          <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-rose-600 text-white text-[10px] font-bold px-3 py-0.5 rounded-full uppercase tracking-wider">
            Most Popular
          </div>
          <div className="space-y-4">
            <span className="text-xs font-bold text-rose-600 uppercase tracking-wider">3-Day Connection Pass</span>
            <div className="text-3xl font-black text-slate-900">{threeDayPlan.price.toLocaleString()} {threeDayPlan.currency}</div>
            <p className="text-xs text-slate-600">{t('plans.threeDayDesc')}</p>
            <div className="pt-4 border-t border-slate-100 space-y-2.5">
              <div className="flex items-center gap-2 text-xs text-slate-700">
                <Check className="w-4 h-4 text-emerald-500 shrink-0" /> Unlimited Messages for 72 Hours
              </div>
              <div className="flex items-center gap-2 text-xs text-slate-700">
                <Check className="w-4 h-4 text-emerald-500 shrink-0" /> Message Anyone Without Fees
              </div>
              <div className="flex items-center gap-2 text-xs text-slate-700">
                <Check className="w-4 h-4 text-emerald-500 shrink-0" /> Priority Recommendation
              </div>
              <div className="flex items-center gap-2 text-xs text-slate-700">
                <Check className="w-4 h-4 text-emerald-500 shrink-0" /> Safe Internal Chat Delivery
              </div>
            </div>
          </div>
          <Link to="/auth/register">
            <Button variant="primary" className="w-full text-xs shadow-md shadow-rose-200">
              Select 3-Day Pass
            </Button>
          </Link>
        </div>

        {/* Weekly Pass */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm flex flex-col justify-between space-y-6">
          <div className="space-y-4">
            <span className="text-xs font-bold text-violet-600 uppercase tracking-wider">Weekly Premium</span>
            <div className="text-3xl font-black text-slate-900">{weeklyPlan.price.toLocaleString()} {weeklyPlan.currency}</div>
            <p className="text-xs text-slate-600">{t('plans.weeklyDesc')}</p>
            <div className="pt-4 border-t border-slate-100 space-y-2.5">
              <div className="flex items-center gap-2 text-xs text-slate-700">
                <Check className="w-4 h-4 text-emerald-500 shrink-0" /> Full 7 Days Unlimited Messages
              </div>
              <div className="flex items-center gap-2 text-xs text-slate-700">
                <Check className="w-4 h-4 text-emerald-500 shrink-0" /> Top Placement in Discover Feed
              </div>
              <div className="flex items-center gap-2 text-xs text-slate-700">
                <Check className="w-4 h-4 text-emerald-500 shrink-0" /> See Mutual Likes Immediately
              </div>
              <div className="flex items-center gap-2 text-xs text-slate-700">
                <Check className="w-4 h-4 text-emerald-500 shrink-0" /> Dedicated Moderation Support
              </div>
            </div>
          </div>
          <Link to="/auth/register">
            <Button variant="outline" className="w-full text-xs">
              Select Weekly Pass
            </Button>
          </Link>
        </div>
      </div>

      {/* Pay-as-you-go & Unlock Addons */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-4">
        <div className="p-6 rounded-2xl bg-white border border-slate-200 space-y-2 shadow-sm">
          <div className="flex items-center justify-between">
            <h4 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <MessageCircle className="w-5 h-5 text-rose-500" /> Pay-Per-Message
            </h4>
            <span className="text-sm font-black text-slate-900">{payPerMsgPlan.price.toLocaleString()} {payPerMsgPlan.currency} / msg</span>
          </div>
          <p className="text-xs text-slate-600">
            Debited only when you send an individual message after exhausting your free allowance. No subscription commitment required.
          </p>
        </div>

        <div className="p-6 rounded-2xl bg-white border border-slate-200 space-y-2 shadow-sm">
          <div className="flex items-center justify-between">
            <h4 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-emerald-600" /> Direct Contact Unlock
            </h4>
            <span className="text-sm font-black text-slate-900">{contactUnlockPlan.price.toLocaleString()} {contactUnlockPlan.currency} / contact</span>
          </div>
          <p className="text-xs text-slate-600">
            Reveals the member's verified phone number directly. Requires mutual consent from both parties.
          </p>
        </div>
      </div>
    </div>
  );
};
