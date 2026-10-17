import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useLanguage } from '../../contexts/LanguageContext';
import { Button } from '../../components/ui/Button';
import {
  UserCheck,
  Cpu,
  Lock,
  HeartHandshake,
  ArrowRight,
  Gift,
  Coins,
  MessageCircle,
  ShieldCheck,
  Zap,
  CheckCircle2,
} from 'lucide-react';
import { api } from '../../lib/api';

export const HowItWorks: React.FC = () => {
  const { language, t } = useLanguage();

  const [plans, setPlans] = useState<any[]>([]);
  const [settings, setSettings] = useState<any>({
    freeInitialMessages: 3,
    freeReplies: 3,
    welcomeBonus: 500,
    hourlyPassPrice: 1500,
    threeDayPassPrice: 3000,
    weeklyPassPrice: 5000,
    payPerMessagePrice: 150,
    contactUnlockPrice: 2000,
    referralReward: 200,
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

  const freeInitialMessages = settings.freeInitialMessages ?? 3;
  const freeReplies = settings.freeReplies ?? 3;
  const welcomeBonus = settings.welcomeBonus ?? 500;
  const currency = settings.currency || 'RWF';

  const hourlyPlan = plans.find((p) => p.code === 'hourly') || { price: settings.hourlyPassPrice ?? 500, currency };
  const threeDayPlan = plans.find((p) => p.code === 'three_day') || { price: settings.threeDayPassPrice ?? 1500, currency };
  const weeklyPlan = plans.find((p) => p.code === 'weekly') || { price: settings.weeklyPassPrice ?? 3000, currency };
  const payPerMsgPlan = plans.find((p) => p.code === 'pay_per_message') || { price: settings.payPerMessagePrice ?? 150, currency };
  const contactUnlockPlan = plans.find((p) => p.code === 'contact_unlock') || { price: settings.contactUnlockPrice ?? 2000, currency };

  const content = {
    rw: {
      tag: 'Uko Kunda Space Ikora',
      title: 'Uburyo Nyabwo bwo Gushaka Umukunzi no Kuganira',
      subtitle:
        'Intambwe zizewe, umutekano w’amakuru yawe, ubutumwa bw’ubuntu bwo gutangira, hamwe na passes zidahenze zishyurwa kuri MTN MoMo & Airtel Money.',
      step1Title: '1. Kwiyandikisha & Kwemeza Imyaka (18+)',
      step1Desc:
        'Buri munyamuryango yemeza itariki y’amavuko. Abatarageza ku myaka 18 ntibemerewe kwinjira. Ushyiraho amafoto nyayo, ibyo ukunda, n’intego z’umubano wifuza (gushyingirwa, umubano ukomeye cyangwa kumenyana).',
      step2Title: '2. Algorithme yo Kuguhuza n’Ukubereye',
      step2Desc:
        'Sisteme yacu ipima ubwumvikane bwanyu ku ntego z’ubuzima (25%), imyaka (20%), aho mutuye (15%), ibyo mukunda (15%), n’ururimi (10%). Uhabwa amanota 0-100% asobanura neza impamvu muhura.',
      step3Title: '3. Ubutumwa bw’Ubuntu & Welcome Bonus',
      step3Desc: `Buri munyamuryango mushya ahabwa ${welcomeBonus.toLocaleString()} ${currency} ya Welcome Bonus ako kanya, hamwe n'ubutumwa bwa mbere ${freeInitialMessages} n'ibisubizo ${freeReplies} by'ubuntu! Ushobora gukoresha iyi bonus mu kuganira mbere yo gushyiramo amafaranga yawe.`,
      step4Title: '4. Kurinda Nimero & Guhanahana Contacts ku Bwumvikane',
      step4Desc:
        'Kugira ngo twirinde abateka imitwe, nimero za telefone n’imiyoboro y’imbuga nkoranyambaga birinzwe mu butumwa. Iyo mwembi mubyemeranyijweho, mushobora gufungura nimero ya telefone mukavugana kuri WhatsApp cyangwa guhura amaso ku maso.',
      pricingTitle: 'Ibiciro n’Amahitamo ya Passes (Birasobanutse)',
      pricingSub: 'Nta mafaranga acibwa mu ibanga. Wishyura gusa igihe ubishatse ukoresheje MoMo cyangwa Airtel Money.',
      earnBannerTitle: 'Ushobora no Gukorera Amafaranga kuri Kunda Space!',
      earnBannerSub: `Buri muntu wazanye wiyandikishije uhabwa ${settings.referralReward || 200} ${currency} ako kanya mu bifatika byo kubikuza, hamwe na 5% bya buri deposit ashyizemo, na 15% iyo bafunguye nimero yawe!`,
      earnBtn: 'Reba Uburyo bwo Gushaka Amafaranga',
    },
    en: {
      tag: 'Transparent Matchmaking',
      title: 'How Kunda Space Works',
      subtitle:
        'A step-by-step guide to our intentional matchmaking philosophy, privacy protection, free dynamic starter allowances, and honest passes.',
      step1Title: '1. Adult Verification (18+) & Profile Creation',
      step1Desc:
        'Every member verifies their birth date. Minors are strictly prohibited. You describe your relationship intentions (marriage, serious relationship, or dating), hobbies, lifestyle, and upload genuine photos.',
      step2Title: '2. Smart Algorithmic Compatibility Breakdown',
      step2Desc:
        'Our matching engine evaluates mutual relationship goals (25%), age alignment (20%), location (15%), shared interests (15%), and language compatibility (10%). You receive a clear 0–100 compatibility score explaining why you matched.',
      step3Title: '3. Free Starter Messages & Welcome Bonus',
      step3Desc: `Every new member is immediately credited with a ${welcomeBonus.toLocaleString()} ${currency} Welcome Bonus, plus ${freeInitialMessages} free initial outgoing messages and ${freeReplies} free replies! You can spend this bonus on chatting before making any cash deposit.`,
      step4Title: '4. Anti-Scam Contact Locking & Mutual Direct Unlock',
      step4Desc:
        'To protect members against extortion, external phone numbers and social links are guarded in chat. Once genuine trust is established, both parties can mutually unlock verified phone contacts for WhatsApp and real-world dates.',
      pricingTitle: 'Dynamic Membership & Connection Passes',
      pricingSub: 'Live pricing dynamically configured from our admin controls. No hidden recurring fees.',
      earnBannerTitle: 'Earn Cash While Connecting on Kunda Space!',
      earnBannerSub: `Get ${settings.referralReward || 200} ${currency} for every friend you invite, 5% of all their future deposits, and a 15% creator cut whenever another member unlocks your contact!`,
      earnBtn: 'Learn How to Make Money',
    },
    fr: {
      tag: 'Rencontres Transparentes',
      title: 'Comment Fonctionne Kunda Space',
      subtitle:
        'Un guide étape par étape sur notre philosophie de rencontres respectueuses, la sécurité des données, les quotas de messages gratuits et les pass abordables.',
      step1Title: '1. Vérification 18+ & Création de Profil',
      step1Desc:
        'Chaque membre confirme sa date de naissance. Les mineurs sont strictement refusés. Précisez vos intentions (mariage, sérieux ou rencontres), loisirs et photos authentiques.',
      step2Title: '2. Moteur de Compatibilité Intelligent',
      step2Desc:
        'Notre système analyse les objectifs de vie (25%), l’âge (20%), la ville (15%), les centres d’intérêt (15%) et la langue (10%) pour vous attribuer un score de 0 à 100%.',
      step3Title: '3. Messages Gratuits & Bonus de Bienvenue',
      step3Desc: `Chaque nouveau membre reçoit immédiatement un Bonus de Bienvenue de ${welcomeBonus.toLocaleString()} ${currency}, avec ${freeInitialMessages} messages gratuits pour de nouveaux contacts et ${freeReplies} réponses gratuites!`,
      step4Title: '4. Protection Anti-Fraude & Déblocage Mutuel de Contact',
      step4Desc:
        'Les numéros de téléphone et réseaux sociaux sont automatiquement protégés dans le chat. Lorsque le courant passe et avec accord mutuel, débloquez les numéros vérifiés pour WhatsApp et vos rendez-vous.',
      pricingTitle: 'Pass de Connexion & Tarifs Dynamiques',
      pricingSub: 'Tarifs en direct configurés par notre administration. Aucun abonnement caché.',
      earnBannerTitle: 'Gagnez de l’Argent Réel sur Kunda Space!',
      earnBannerSub: `Touchez ${settings.referralReward || 200} ${currency} par ami parrainé, 5% de leurs dépôts et 15% à chaque déblocage de votre contact!`,
      earnBtn: 'Découvrir Comment Gagner de l’Argent',
    },
  };

  const c = content[language === 'rw' || language === 'fr' ? language : 'en'];

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-16 space-y-16">
      {/* Header */}
      <div className="text-center space-y-4 max-w-3xl mx-auto">
        <span className="text-xs font-bold text-rose-600 uppercase tracking-widest">
          {c.tag}
        </span>
        <h1 className="text-4xl sm:text-5xl font-extrabold text-slate-900 tracking-tight">
          {c.title}
        </h1>
        <p className="text-base sm:text-lg text-slate-600 leading-relaxed">
          {c.subtitle}
        </p>
      </div>

      {/* 4 Steps */}
      <div className="space-y-8">
        {/* Step 1 */}
        <div className="flex flex-col md:flex-row gap-6 md:gap-8 items-start md:items-center bg-white p-6 sm:p-8 rounded-3xl border border-slate-100 shadow-card">
          <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center shrink-0">
            <UserCheck className="w-7 h-7 sm:w-8 sm:h-8" />
          </div>
          <div className="space-y-2">
            <span className="text-xs font-bold text-rose-600 uppercase">Step 1</span>
            <h3 className="text-xl sm:text-2xl font-bold text-slate-900">{c.step1Title}</h3>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">{c.step1Desc}</p>
          </div>
        </div>

        {/* Step 2 */}
        <div className="flex flex-col md:flex-row gap-6 md:gap-8 items-start md:items-center bg-white p-6 sm:p-8 rounded-3xl border border-slate-100 shadow-card">
          <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-violet-100 text-violet-600 flex items-center justify-center shrink-0">
            <Cpu className="w-7 h-7 sm:w-8 sm:h-8" />
          </div>
          <div className="space-y-2">
            <span className="text-xs font-bold text-violet-600 uppercase">Step 2</span>
            <h3 className="text-xl sm:text-2xl font-bold text-slate-900">{c.step2Title}</h3>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">{c.step2Desc}</p>
          </div>
        </div>

        {/* Step 3 (Dynamic Free Initial Messages & Welcome Bonus) */}
        <div className="flex flex-col md:flex-row gap-6 md:gap-8 items-start md:items-center bg-white p-6 sm:p-8 rounded-3xl border border-amber-200/80 bg-gradient-to-r from-amber-50/40 via-white to-rose-50/30 shadow-card">
          <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-amber-100 text-amber-600 flex items-center justify-center shrink-0">
            <Gift className="w-7 h-7 sm:w-8 sm:h-8" />
          </div>
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-amber-600 uppercase">Step 3</span>
              <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-amber-100 text-amber-800">
                Dynamic Allowance
              </span>
            </div>
            <h3 className="text-xl sm:text-2xl font-bold text-slate-900">{c.step3Title}</h3>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">{c.step3Desc}</p>
          </div>
        </div>

        {/* Step 4 */}
        <div className="flex flex-col md:flex-row gap-6 md:gap-8 items-start md:items-center bg-white p-6 sm:p-8 rounded-3xl border border-slate-100 shadow-card">
          <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0">
            <HeartHandshake className="w-7 h-7 sm:w-8 sm:h-8" />
          </div>
          <div className="space-y-2">
            <span className="text-xs font-bold text-emerald-600 uppercase">Step 4</span>
            <h3 className="text-xl sm:text-2xl font-bold text-slate-900">{c.step4Title}</h3>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">{c.step4Desc}</p>
          </div>
        </div>
      </div>

      {/* Dynamic Pricing Table Section */}
      <div className="space-y-6 pt-4">
        <div className="text-center space-y-2 max-w-2xl mx-auto">
          <span className="text-xs font-bold text-violet-600 uppercase tracking-widest">
            Live Pricing Structure
          </span>
          <h2 className="text-2xl sm:text-3xl font-black text-slate-900">
            {c.pricingTitle}
          </h2>
          <p className="text-xs sm:text-sm text-slate-600">
            {c.pricingSub}
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Free Starter */}
          <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-sm space-y-3 flex flex-col justify-between">
            <div className="space-y-2">
              <span className="text-xs font-bold text-slate-500 uppercase">Free Starter</span>
              <div className="text-2xl font-black text-slate-900">0 {currency}</div>
              <p className="text-xs text-slate-600">
                {freeInitialMessages} free initial messages + {freeReplies} free replies.
              </p>
              <div className="pt-2 border-t border-slate-100 text-[11px] text-slate-600 space-y-1">
                <div>✓ Complete Profile Setup</div>
                <div>✓ Compatibility score</div>
                <div>✓ {welcomeBonus.toLocaleString()} {currency} Welcome bonus</div>
              </div>
            </div>
            <Link to="/auth/register">
              <Button variant="outline" className="w-full text-xs">Join Free</Button>
            </Link>
          </div>

          {/* 24-Hour Pass (Daily) */}
          <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-sm space-y-3 flex flex-col justify-between">
            <div className="space-y-2">
              <span className="text-xs font-bold text-amber-600 uppercase">24-Hour Pass (Daily)</span>
              <div className="text-2xl font-black text-slate-900">{hourlyPlan.price.toLocaleString()} {hourlyPlan.currency}</div>
              <p className="text-xs text-slate-600">
                24 hours unlimited chat. No per-message deduction.
              </p>
              <div className="pt-2 border-t border-slate-100 text-[11px] text-slate-600 space-y-1">
                <div>✓ 24 hours unlimited chat</div>
                <div>✓ Instant match delivery</div>
                <div>✓ Mobile Money checkout</div>
              </div>
            </div>
            <Link to="/membership">
              <Button variant="outline" className="w-full text-xs">View Pass</Button>
            </Link>
          </div>

          {/* 3-Day Pass */}
          <div className="bg-white rounded-3xl p-5 border-2 border-rose-500 shadow-md relative space-y-3 flex flex-col justify-between">
            <div className="absolute -top-2.5 left-1/2 -translate-x-1/2 bg-rose-600 text-white text-[9px] font-bold px-2.5 py-0.5 rounded-full uppercase">
              Most Popular
            </div>
            <div className="space-y-2">
              <span className="text-xs font-bold text-rose-600 uppercase">3-Day Pass</span>
              <div className="text-2xl font-black text-slate-900">{threeDayPlan.price.toLocaleString()} {threeDayPlan.currency}</div>
              <p className="text-xs text-slate-600">
                72 hours of unlimited messages with priority ranking.
              </p>
              <div className="pt-2 border-t border-slate-100 text-[11px] text-slate-600 space-y-1">
                <div>✓ 72 hours unlimited chat</div>
                <div>✓ Priority match boost</div>
                <div>✓ Chat with anyone</div>
              </div>
            </div>
            <Link to="/membership">
              <Button variant="primary" className="w-full text-xs shadow-sm">Select 3-Day</Button>
            </Link>
          </div>

          {/* Weekly Pass */}
          <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-sm space-y-3 flex flex-col justify-between">
            <div className="space-y-2">
              <span className="text-xs font-bold text-violet-600 uppercase">Weekly Pass</span>
              <div className="text-2xl font-black text-slate-900">{weeklyPlan.price.toLocaleString()} {weeklyPlan.currency}</div>
              <p className="text-xs text-slate-600">
                7 full days unlimited messaging + top feed placement.
              </p>
              <div className="pt-2 border-t border-slate-100 text-[11px] text-slate-600 space-y-1">
                <div>✓ 7 days unlimited chat</div>
                <div>✓ Top feed spotlight</div>
                <div>✓ See likes immediately</div>
              </div>
            </div>
            <Link to="/membership">
              <Button variant="outline" className="w-full text-xs">Select Weekly</Button>
            </Link>
          </div>
        </div>

        {/* Micro-charges */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between">
            <div>
              <p className="text-xs font-black text-slate-900 flex items-center gap-1.5">
                <MessageCircle className="w-4 h-4 text-rose-500" /> Pay-Per-Message
              </p>
              <p className="text-[11px] text-slate-500">Only debited if sending beyond free allowance without a pass.</p>
            </div>
            <span className="text-sm font-black text-slate-900 ml-3 whitespace-nowrap">
              {payPerMsgPlan.price.toLocaleString()} {payPerMsgPlan.currency}
            </span>
          </div>

          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between">
            <div>
              <p className="text-xs font-black text-slate-900 flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-emerald-600" /> Direct Contact Unlock
              </p>
              <p className="text-[11px] text-slate-500">Reveals phone number after mutual consent is confirmed.</p>
            </div>
            <span className="text-sm font-black text-slate-900 ml-3 whitespace-nowrap">
              {contactUnlockPlan.price.toLocaleString()} {contactUnlockPlan.currency}
            </span>
          </div>
        </div>
      </div>

      {/* Earn Banner */}
      <div className="bg-gradient-to-r from-emerald-600 to-teal-700 text-white rounded-3xl p-6 sm:p-8 shadow-lg shadow-emerald-100 flex flex-col sm:flex-row items-center justify-between gap-6">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-white/20 text-white text-[10px] font-black uppercase tracking-wider">
            <Coins className="w-3.5 h-3.5" /> Affiliate Cash Program
          </div>
          <h3 className="text-xl sm:text-2xl font-black">{c.earnBannerTitle}</h3>
          <p className="text-xs sm:text-sm text-emerald-100 max-w-xl leading-relaxed">
            {c.earnBannerSub}
          </p>
        </div>
        <Link to="/make-money" className="shrink-0 w-full sm:w-auto">
          <Button className="w-full sm:w-auto bg-white text-emerald-800 hover:bg-emerald-50 font-black shadow-md">
            {c.earnBtn}
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        </Link>
      </div>

      {/* Bottom CTA */}
      <div className="text-center pt-4">
        <Link to="/auth/register">
          <Button size="lg" className="px-10 shadow-lg shadow-rose-200">
            Start Your Journey Now
            <ArrowRight className="w-5 h-5 ml-2" />
          </Button>
        </Link>
      </div>
    </div>
  );
};
