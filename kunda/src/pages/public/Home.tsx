import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { Button } from '../../components/ui/Button';
import {
  Heart,
  ShieldCheck,
  Lock,
  Sparkles,
  Users,
  CheckCircle,
  ArrowRight,
  MessageCircle,
  HelpCircle,
  Coffee,
  Compass,
  Check,
} from 'lucide-react';
import { api } from '../../lib/api';

export const Home: React.FC = () => {
  const { user, isAuthenticated } = useAuth();
  const { t } = useLanguage();

  const [plans, setPlans] = useState<any[]>([]);
  const [settings, setSettings] = useState<any>({
    freeInitialMessages: 3,
    freeReplies: 3,
    hourlyPassPrice: 1500,
    threeDayPassPrice: 3000,
    weeklyPassPrice: 5000,
    currency: 'RWF',
  });

  useEffect(() => {
    api.get('/subscriptions/plans')
      .then((res) => {
        if (res.data?.success) {
          if (Array.isArray(res.data.plans)) setPlans(res.data.plans);
          if (res.data.settings) {
            setSettings(res.data.settings);
          }
        }
      })
      .catch(() => {});
  }, []);

  const threeDayPlan = plans.find((p) => p.code === 'three_day') || {
    price: settings.threeDayPassPrice ?? 3000,
    currency: settings.currency ?? 'RWF',
  };
  const weeklyPlan = plans.find((p) => p.code === 'weekly') || {
    price: settings.weeklyPassPrice ?? 5000,
    currency: settings.currency ?? 'RWF',
  };

  const freeInitialMessages = settings.freeInitialMessages ?? 3;
  const freeReplies = settings.freeReplies ?? 3;

  return (
    <div className="space-y-24 pb-24 md:pb-20">
      {/* 1. HERO SECTION */}
      <section className="relative pt-12 pb-20 sm:pt-20 sm:pb-28 overflow-hidden">
        {/* Soft decorative background glow */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-rose-200/30 rounded-full blur-3xl -z-10 pointer-events-none" />
        <div className="absolute top-1/3 right-10 w-[400px] h-[400px] bg-violet-200/30 rounded-full blur-3xl -z-10 pointer-events-none" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-8">
          {/* Trust Badge or Logged In Pill */}
          {isAuthenticated ? (
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-50 border border-emerald-200/80 text-emerald-800 text-xs sm:text-sm font-bold shadow-sm animate-in fade-in">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
              <span>Logged in as <strong>{user?.email?.split('@')[0]}</strong></span>
            </div>
          ) : (
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-rose-50 border border-rose-200/80 text-rose-700 text-xs sm:text-sm font-semibold shadow-sm animate-in fade-in slide-in-from-bottom-2">
              <ShieldCheck className="w-4 h-4 text-rose-500" />
              <span>{t('hero.badge')}</span>
            </div>
          )}

          {/* Headline */}
          <h1 className="text-4xl sm:text-6xl lg:text-7xl font-extrabold text-slate-900 tracking-tight max-w-4xl mx-auto leading-[1.15]">
            {isAuthenticated ? (
              <>Welcome back to your connection journey</>
            ) : (
              t('hero.title')
            )}
          </h1>

          {/* Subtitle */}
          <p className="text-lg sm:text-xl text-slate-600 max-w-2xl mx-auto font-normal leading-relaxed">
            {isAuthenticated ? (
              <>Discover singles matching your preferences, manage your conversations, and connect respectfully with verified members across Rwanda and beyond.</>
            ) : (
              t('hero.subtitle')
            )}
          </p>

          {/* Call to Actions (Dynamic depending on session) */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
            {isAuthenticated ? (
              <>
                <Link to="/dashboard/discover" className="w-full sm:w-auto">
                  <Button size="lg" className="w-full sm:w-auto px-8 text-base font-bold shadow-lg shadow-rose-200">
                    <Compass className="w-5 h-5 mr-2" />
                    Explore Discover Feed
                  </Button>
                </Link>
                <Link to="/dashboard/messages" className="w-full sm:w-auto">
                  <Button variant="outline" size="lg" className="w-full sm:w-auto font-semibold">
                    <MessageCircle className="w-5 h-5 mr-2 text-rose-500" />
                    Open Messages
                  </Button>
                </Link>
              </>
            ) : (
              <>
                <Link to="/auth/register" className="w-full sm:w-auto">
                  <Button size="lg" className="w-full sm:w-auto px-8 text-base font-bold shadow-lg shadow-rose-200">
                    {t('hero.cta')}
                    <ArrowRight className="w-5 h-5 ml-2" />
                  </Button>
                </Link>
                <Link to="/how-it-works" className="w-full sm:w-auto">
                  <Button variant="outline" size="lg" className="w-full sm:w-auto font-semibold">
                    {t('hero.learnMore')}
                  </Button>
                </Link>
              </>
            )}
          </div>

          {/* Community Trust Indicators */}
          <div className="pt-12 grid grid-cols-3 max-w-xl mx-auto divide-x divide-slate-200 border-t border-slate-200/70">
            <div className="text-center px-2">
              <div className="text-xl sm:text-2xl font-black text-slate-900">100%</div>
              <div className="text-xs text-slate-500 font-medium">{t('hero.statsMembers')}</div>
            </div>
            <div className="text-center px-2">
              <div className="text-xl sm:text-2xl font-black text-rose-600">18+</div>
              <div className="text-xs text-slate-500 font-medium">Verified Adults</div>
            </div>
            <div className="text-center px-2">
              <div className="text-xl sm:text-2xl font-black text-slate-900">Zero</div>
              <div className="text-xs text-slate-500 font-medium">Fake Bot Accounts</div>
            </div>
          </div>
        </div>
      </section>

      {/* 2. HOW IT WORKS SECTION */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-16 space-y-3">
          <span className="text-xs font-bold text-rose-600 uppercase tracking-widest">Simple & Safe</span>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900">{t('howItWorks.title')}</h2>
          <p className="text-base text-slate-600">{t('howItWorks.subtitle')}</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="bg-white rounded-3xl p-8 border border-slate-100 shadow-card relative hover:-translate-y-1 transition-transform">
            <div className="w-14 h-14 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center font-bold text-xl mb-6">
              1
            </div>
            <h3 className="text-xl font-bold text-slate-900 mb-3">{t('howItWorks.step1Title')}</h3>
            <p className="text-sm text-slate-600 leading-relaxed">{t('howItWorks.step1Desc')}</p>
          </div>

          <div className="bg-white rounded-3xl p-8 border border-slate-100 shadow-card relative hover:-translate-y-1 transition-transform">
            <div className="w-14 h-14 rounded-2xl bg-violet-50 text-violet-600 flex items-center justify-center font-bold text-xl mb-6">
              2
            </div>
            <h3 className="text-xl font-bold text-slate-900 mb-3">{t('howItWorks.step2Title')}</h3>
            <p className="text-sm text-slate-600 leading-relaxed">{t('howItWorks.step2Desc')}</p>
          </div>

          <div className="bg-white rounded-3xl p-8 border border-slate-100 shadow-card relative hover:-translate-y-1 transition-transform">
            <div className="w-14 h-14 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold text-xl mb-6">
              3
            </div>
            <h3 className="text-xl font-bold text-slate-900 mb-3">{t('howItWorks.step3Title')}</h3>
            <p className="text-sm text-slate-600 leading-relaxed">{t('howItWorks.step3Desc')}</p>
          </div>
        </div>
      </section>

      {/* 3. TRUST & SAFETY SECTION */}
      <section className="bg-gradient-to-b from-rose-50/50 to-white py-20 border-y border-rose-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16 space-y-3">
            <span className="text-xs font-bold text-violet-600 uppercase tracking-widest">Peace of Mind</span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900">{t('safety.title')}</h2>
            <p className="text-base text-slate-600">{t('safety.subtitle')}</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="p-6 rounded-2xl bg-white border border-rose-100 shadow-sm space-y-3">
              <div className="w-10 h-10 rounded-xl bg-rose-100 text-rose-600 flex items-center justify-center">
                <Lock className="w-5 h-5" />
              </div>
              <h4 className="text-lg font-bold text-slate-900">{t('safety.pillar1Title')}</h4>
              <p className="text-sm text-slate-600 leading-relaxed">{t('safety.pillar1Desc')}</p>
            </div>

            <div className="p-6 rounded-2xl bg-white border border-rose-100 shadow-sm space-y-3">
              <div className="w-10 h-10 rounded-xl bg-violet-100 text-violet-600 flex items-center justify-center">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <h4 className="text-lg font-bold text-slate-900">{t('safety.pillar2Title')}</h4>
              <p className="text-sm text-slate-600 leading-relaxed">{t('safety.pillar2Desc')}</p>
            </div>

            <div className="p-6 rounded-2xl bg-white border border-rose-100 shadow-sm space-y-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center">
                <CheckCircle className="w-5 h-5" />
              </div>
              <h4 className="text-lg font-bold text-slate-900">{t('safety.pillar3Title')}</h4>
              <p className="text-sm text-slate-600 leading-relaxed">{t('safety.pillar3Desc')}</p>
            </div>
          </div>
        </div>
      </section>

      {/* 4. EDITORIAL / SEO CONTENT SECTION: DATING IN RWANDA */}
      <section className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        <div className="border-l-4 border-rose-500 pl-6 py-2">
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900">
            Dating in Rwanda: Cultivating Respect, Chemistry & Commitment
          </h2>
          <p className="text-sm text-slate-500 mt-1">Urukundo Nyakuri mu Rwanda | Rencontres au Rwanda</p>
        </div>

        <div className="prose prose-slate max-w-none text-slate-600 text-sm sm:text-base leading-relaxed space-y-4">
          <p>
            Whether you are living in Kigali, exploring Rubavu by Lake Kivu, working in Musanze, or living in the Rwandan diaspora across Europe, North America, and beyond, finding someone who genuinely aligns with your values should not feel like an endless guessing game.
          </p>
          <p>
            Kunda Space was created to bridge modern relationship expectations with Rwandan cultural values of dignity (<strong>Agaciro</strong>), mutual respect, and clear relationship intentions. Unlike platforms flooded with deceptive bot profiles and unverified accounts, Kunda Space enforces strict age verification, layered contact-leak detection, and atomic wallet accounting powered by Flutterwave.
          </p>
        </div>
      </section>

      {/* 5. DYNAMIC PRICING OVERVIEW (Reflects live Admin Dashboard settings) */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-14 space-y-3">
          <span className="text-xs font-bold text-rose-600 uppercase tracking-widest">Affordable & Honest</span>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900">{t('plans.title')}</h2>
          <p className="text-base text-slate-600">{t('plans.subtitle')}</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Free Plan */}
          <div className="bg-white rounded-3xl p-8 border border-slate-200 shadow-sm space-y-6 flex flex-col justify-between">
            <div className="space-y-3">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Free Starter</span>
              <div className="text-4xl font-extrabold text-slate-900">0 RWF</div>
              <p className="text-sm text-slate-600">
                {freeInitialMessages} free initial messages and {freeReplies} free replies to start your journey.
              </p>
              <div className="pt-3 border-t border-slate-100 space-y-2 text-xs text-slate-600">
                <div className="flex items-center gap-2">
                  <Check className="w-3.5 h-3.5 text-emerald-500" /> Full profile discovery
                </div>
                <div className="flex items-center gap-2">
                  <Check className="w-3.5 h-3.5 text-emerald-500" /> {freeInitialMessages} free outgoing conversations
                </div>
                <div className="flex items-center gap-2">
                  <Check className="w-3.5 h-3.5 text-emerald-500" /> {freeReplies} free conversation replies
                </div>
              </div>
            </div>
            {isAuthenticated ? (
              <Link to="/dashboard/messages">
                <Button variant="outline" className="w-full">
                  Go to Messages
                </Button>
              </Link>
            ) : (
              <Link to="/auth/register">
                <Button variant="outline" className="w-full">
                  Get Started Free
                </Button>
              </Link>
            )}
          </div>

          {/* 3-Day Plan (Dynamic Price) */}
          <div className="bg-white rounded-3xl p-8 border-2 border-rose-500 shadow-xl relative space-y-6 flex flex-col justify-between">
            <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-rose-600 text-white text-[11px] font-bold px-4 py-1 rounded-full uppercase tracking-wider shadow-sm">
              Most Popular Pass
            </div>
            <div className="space-y-3">
              <span className="text-xs font-bold text-rose-600 uppercase tracking-wider">3-Day Connection Pass</span>
              <div className="text-4xl font-extrabold text-slate-900">
                {threeDayPlan.price.toLocaleString()} {threeDayPlan.currency}
              </div>
              <p className="text-sm text-slate-600">
                Unlimited messaging for 72 hours. Perfect for weekend romance.
              </p>
              <div className="pt-3 border-t border-slate-100 space-y-2 text-xs text-slate-600">
                <div className="flex items-center gap-2">
                  <Check className="w-3.5 h-3.5 text-emerald-500" /> Unlimited messages for 72 hours
                </div>
                <div className="flex items-center gap-2">
                  <Check className="w-3.5 h-3.5 text-emerald-500" /> Direct conversation initiations
                </div>
                <div className="flex items-center gap-2">
                  <Check className="w-3.5 h-3.5 text-emerald-500" /> Priority recommendation status
                </div>
              </div>
            </div>
            {isAuthenticated ? (
              <Link to="/dashboard/subscription">
                <Button variant="primary" className="w-full shadow-md shadow-rose-200">
                  Select 3-Day Pass
                </Button>
              </Link>
            ) : (
              <Link to="/auth/register">
                <Button variant="primary" className="w-full shadow-md shadow-rose-200">
                  Join & Unlock Pass
                </Button>
              </Link>
            )}
          </div>

          {/* Weekly Plan (Dynamic Price) */}
          <div className="bg-white rounded-3xl p-8 border border-slate-200 shadow-sm space-y-6 flex flex-col justify-between">
            <div className="space-y-3">
              <span className="text-xs font-bold text-violet-600 uppercase tracking-wider">Weekly Premium</span>
              <div className="text-4xl font-extrabold text-slate-900">
                {weeklyPlan.price.toLocaleString()} {weeklyPlan.currency}
              </div>
              <p className="text-sm text-slate-600">
                Full 7-day unlimited access with top placement in recommendations.
              </p>
              <div className="pt-3 border-t border-slate-100 space-y-2 text-xs text-slate-600">
                <div className="flex items-center gap-2">
                  <Check className="w-3.5 h-3.5 text-emerald-500" /> Full 7 days unlimited messaging
                </div>
                <div className="flex items-center gap-2">
                  <Check className="w-3.5 h-3.5 text-emerald-500" /> Top placement in Discover feed
                </div>
                <div className="flex items-center gap-2">
                  <Check className="w-3.5 h-3.5 text-emerald-500" /> Dedicated support assistance
                </div>
              </div>
            </div>
            {isAuthenticated ? (
              <Link to="/dashboard/subscription">
                <Button variant="outline" className="w-full">
                  Select Weekly Premium
                </Button>
              </Link>
            ) : (
              <Link to="/auth/register">
                <Button variant="outline" className="w-full">
                  Get Weekly Premium
                </Button>
              </Link>
            )}
          </div>
        </div>
      </section>

      {/* 6. CALL TO ACTION BANNER (With visible, styled white button & logged in check) */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-gradient-to-r from-rose-600 via-rose-500 to-violet-600 rounded-3xl p-10 sm:p-16 text-center text-white space-y-6 shadow-float">
          <h2 className="text-3xl sm:text-5xl font-black tracking-tight max-w-2xl mx-auto leading-tight">
            {isAuthenticated ? (
              <>Ready to discover someone special today?</>
            ) : (
              <>Ready to Meet Someone Special Who Shares Your Values?</>
            )}
          </h2>
          <p className="text-rose-100 max-w-xl mx-auto text-base sm:text-lg">
            {isAuthenticated ? (
              <>Browse genuine verified singles right now in your Discover recommendations.</>
            ) : (
              <>Join Kunda Space today for free. Experience respectful, verified dating designed for adults 18+.</>
            )}
          </p>
          <div className="pt-2">
            {isAuthenticated ? (
              <Link to="/dashboard/discover">
                <Button
                  variant="white"
                  size="lg"
                  className="bg-white hover:bg-rose-50 text-rose-600 font-extrabold px-10 shadow-xl border-none"
                >
                  <Compass className="w-5 h-5 mr-2 text-rose-600" />
                  Continue Discovering Matches
                </Button>
              </Link>
            ) : (
              <Link to="/auth/register">
                <Button
                  variant="white"
                  size="lg"
                  className="bg-white hover:bg-rose-50 text-rose-600 font-extrabold px-10 shadow-xl border-none"
                >
                  Join Kunda Space Now (18+)
                </Button>
              </Link>
            )}
          </div>
        </div>
      </section>
    </div>
  );
};
