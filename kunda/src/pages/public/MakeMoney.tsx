import React from 'react';
import { Link } from 'react-router-dom';
import { useLanguage } from '../../contexts/LanguageContext';
import { Button } from '../../components/ui/Button';
import {
  Gift,
  Users,
  Coins,
  PhoneCall,
  CheckCircle2,
  ArrowRight,
  Sparkles,
  Smartphone,
  Building,
  ShieldCheck,
  TrendingUp,
} from 'lucide-react';

export const MakeMoney: React.FC = () => {
  const { language, setLanguage } = useLanguage();

  const content = {
    en: {
      badge: 'AFFILIATE & CREATOR EARNINGS',
      title: 'How to Make Real Money on Kunda Space',
      subtitle:
        'Kunda Space isn’t just Rwanda’s premier dating community—it’s also a platform where you earn cash every single day through referrals, deposit commissions, and contact unlocks.',
      ctaBtn: 'Start Earning Now',
      methodsTitle: '4 Ways to Earn on Kunda Space',
      methods: [
        {
          icon: Gift,
          title: '1. Welcome Bonus (500 RWF)',
          amount: '500 RWF',
          desc: 'Every new member is immediately credited with a 500 RWF Welcome Bonus upon registration. You can spend this bonus on messaging and unlocking contacts before making any real cash deposit!',
          badge: 'Spendable Immediately',
          color: 'from-amber-500 to-rose-500',
        },
        {
          icon: Users,
          title: '2. Referral Signup Reward (200 RWF)',
          amount: '200 RWF / Member',
          desc: 'Share your unique invite link or referral code with friends on WhatsApp, TikTok, or Twitter. The moment they complete registration, 200 RWF is credited to your withdrawable wallet.',
          badge: '100% Withdrawable',
          color: 'from-blue-500 to-indigo-600',
        },
        {
          icon: Coins,
          title: '3. 5% Deposit Commission',
          amount: '5% of All Deposits',
          desc: 'Whenever anyone you referred tops up their wallet to buy messaging passes or unlock contacts, you receive 5% of their deposit directly in cash.',
          badge: 'Passive Income',
          color: 'from-emerald-500 to-teal-600',
        },
        {
          icon: PhoneCall,
          title: '4. 15% Contact Unlock Revenue Share',
          amount: '15% per Unlock',
          desc: 'When another verified member unlocks your phone contact with your consent, you get a 15% cut of the unlock fee credited to your withdrawable wallet!',
          badge: 'Creator Revenue',
          color: 'from-purple-500 to-pink-600',
        },
      ],
      withdrawTitle: 'Fast & Reliable Payouts in Rwanda',
      withdrawDesc:
        'Once your withdrawable earnings reach the minimum threshold of 2,000 RWF, you can request an instant withdrawal directly to:',
      withdrawMethods: [
        { name: 'MTN Mobile Money (MoMo)', desc: 'Instant transfer to your MTN Rwanda number' },
        { name: 'Airtel Money Rwanda', desc: 'Direct cash deposit to your Airtel wallet' },
        { name: 'Local Rwandan Bank Transfer', desc: 'Bank of Kigali, Equity Bank, I&M, Cogebanque' },
      ],
      faqTitle: 'Frequently Asked Questions',
      faqs: [
        {
          q: 'Can I withdraw the 500 RWF Welcome Bonus?',
          a: 'The 500 RWF Welcome Bonus is designed as spendable credits on the platform. It can be used to send messages, buy passes, and unlock contacts before depositing real money. Referral bonuses and commission earnings are 100% withdrawable to your MoMo or bank once you reach 2,000 RWF.',
        },
        {
          q: 'How do I share my referral link?',
          a: 'Log into your account, open the "Earn Money" / Referrals page, and copy your referral link or click the one-tap "Share on WhatsApp" button.',
        },
        {
          q: 'Will my payout phone number be saved?',
          a: 'Yes! Your payout details are safely stored so you don’t have to type them every time. You can change your number or withdrawal method whenever you like.',
        },
      ],
    },
    rw: {
      badge: 'GUSHAKA AMAFARANGA NO GUFATANYA',
      title: 'Uko Winjiza Amafaranga Kuri Kunda Space',
      subtitle:
        'Kunda Space si urubuga rwo gushaka umukunzi gusa—ni n’urubuga rwiza rwo kwinjiza amafaranga nyayo buri munsi ubinyujije mu gutumira inshuti, komisiyo z’amafaranga bashyiraho, no gusangiza numero yawe.',
      ctaBtn: 'Tangira Kwinjiza Amafaranga',
      methodsTitle: 'Uburyo 4 bwo Kwinjiza Amafaranga kuri Kunda Space',
      methods: [
        {
          icon: Gift,
          title: '1. Impano yo Kwinjira (500 RWF)',
          amount: '500 RWF',
          desc: 'Buri munyamuryango mushya yiyandikishije ahabwa ako kanya 500 RWF kuri konti ye. Ushobora gukoresha aya mafaranga wandikira abantu cyangwa ufungura numero zabo mbere y’uko wishyura amafaranga yawe!',
          badge: 'Uyakoresha Ako Kanya',
          color: 'from-amber-500 to-rose-500',
        },
        {
          icon: Users,
          title: '2. Amafaranga yo Gutumira Inshuti (200 RWF)',
          amount: '200 RWF / Umuntu',
          desc: 'Sangiza link yawe cyangwa kode yawe kuri WhatsApp, Facebook, cyangwa Twitter. Iyo inshuti yawe yiyandikishije, uhita ubona 200 RWF kuri wallet yawe ushobora no kubikuza.',
          badge: 'Ibihumbi ku Ijana Bibikuzwa',
          color: 'from-blue-500 to-indigo-600',
        },
        {
          icon: Coins,
          title: '3. Komisiyo ya 5% ku Mafaranga Inshuti Yagushyizeho',
          amount: '5% by’amafaranga bashyizeho',
          desc: 'Igihe cyose umuntu watumiye ashyizeho amafaranga kuri konti ye yo kwishyura ubutumwa, uhita uhabwa 5% by’ayo mafaranga ako kanya.',
          badge: 'Amafaranga ahoraho',
          color: 'from-emerald-500 to-teal-600',
        },
        {
          icon: PhoneCall,
          title: '4. Umugabane wa 15% Iyo Bafunguye Numero Yawe',
          amount: '15% kuri buri gufungura',
          desc: 'Iyo undi munyamuryango afunguye numero yawe ya terefone ku bwumvikane bwawe, uhabwa 15% by’amafaranga yishyuwe, akajya kuri wallet ushobora kubikuza!',
          badge: 'Inyungu Zihariye',
          color: 'from-purple-500 to-pink-600',
        },
      ],
      withdrawTitle: 'Kubikuza Amafaranga Mu Rwanda Byoroshye',
      withdrawDesc:
        'Iyo amafaranga watsindiye amaze kugera ku gipimo cyo hasi cyo kubikuza (2,000 RWF), ushobora kuyabikuza ako kanya kuri:',
      withdrawMethods: [
        { name: 'MTN Mobile Money (MoMo)', desc: 'Yoherezwa ako kanya kuri numero yawe ya MTN Rwanda' },
        { name: 'Airtel Money Rwanda', desc: 'Ako kanya kuri numero yawe ya Airtel' },
        { name: 'Kuri Banki yo mu Rwanda', desc: 'Bank of Kigali, Equity Bank, I&M Bank, na Cogebanque' },
      ],
      faqTitle: 'Ibibazo Bikunze Kubazwa',
      faqs: [
        {
          q: 'Ese nshobora kubikuza 500 RWF nahawe nk’impano?',
          a: 'Oya, 500 RWF y’impano igenewe gukoreshwa kuri Kunda Space wandikira abandi mbere yo gushyiraho amafaranga. Ariko amafaranga yose winjije mu gutumira abandi n’aya komisiyo (200 RWF, 5%, 15%) urayabikuza yose kuri MoMo iyo amaze kugera ku 2,000 RWF.',
        },
        {
          q: 'Nakira nte link yanjye yo gutumira?',
          a: 'Injira muri konti yawe, kanda ahanditse "Earn" cyangwa "Gushaka Amafaranga", uhite ukoporora link yawe cyangwa ukande akabuto k’ako kanya gasangiza kuri WhatsApp.',
        },
        {
          q: 'Ese nimero yanjye ibikuzwaho irabikwa?',
          a: 'Yego! Iyo ubikuje ubwa mbere, numero n’izina byawe bibikwa muri sisitemu ku buryo utongera kubyandika bundi bushya, ariko ushobora no kubihindura igihe cyose ubishakiye.',
        },
      ],
    },
    fr: {
      badge: 'AFFILIATION & REVENUS CRÉATEURS',
      title: 'Comment Gagner de l’Argent Réel sur Kunda Space',
      subtitle:
        'Kunda Space n’est pas seulement la meilleure application de rencontres au Rwanda : c’est aussi un moyen facile de gagner de l’argent chaque jour grâce aux parrainages, commissions et partages de contact.',
      ctaBtn: 'Commencer à Gagner',
      methodsTitle: '4 Façons de Gagner de l’Argent',
      methods: [
        {
          icon: Gift,
          title: '1. Bonus de Bienvenue (500 RWF)',
          amount: '500 RWF',
          desc: 'Chaque nouvel utilisateur reçoit immédiatement 500 RWF sur son solde de bienvenue. Dépensez ce bonus pour discuter et débloquer des numéros avant même de déposer votre propre argent !',
          badge: 'Utilisable Immédiatement',
          color: 'from-amber-500 to-rose-500',
        },
        {
          icon: Users,
          title: '2. Récompense d’Invitation (200 RWF)',
          amount: '200 RWF / Inscription',
          desc: 'Partagez votre lien de parrainage avec vos amis. Dès qu’un ami s’inscrit, 200 RWF sont crédités sur votre portefeuille retirable.',
          badge: '100% Retirable',
          color: 'from-blue-500 to-indigo-600',
        },
        {
          icon: Coins,
          title: '3. Commission de 5% sur les Dépôts',
          amount: '5% sur chaque Dépôt',
          desc: 'Chaque fois qu’un ami parrainé recharge son compte pour envoyer des messages ou acheter un pass, vous touchez automatiquement 5% de commission.',
          badge: 'Revenu Passif',
          color: 'from-emerald-500 to-teal-600',
        },
        {
          icon: PhoneCall,
          title: '4. 15% de Partage sur Déblocage de Contact',
          amount: '15% par Déblocage',
          desc: 'Quand un membre débloque vos coordonnées téléphoniques avec votre consentement, vous recevez 15% du montant dépensé directement sur votre compte !',
          badge: 'Revenu Membre',
          color: 'from-purple-500 to-pink-600',
        },
      ],
      withdrawTitle: 'Retraits Rapides et Sécurisés au Rwanda',
      withdrawDesc:
        'Dès que vos gains retirables atteignent le seuil minimum de 2 000 RWF, effectuez une demande de retrait instantanée vers :',
      withdrawMethods: [
        { name: 'MTN Mobile Money (MoMo)', desc: 'Paiement direct sur votre compte MTN Rwanda' },
        { name: 'Airtel Money Rwanda', desc: 'Transfert instantané sur votre numéro Airtel' },
        { name: 'Virement Bancaire Rwandais', desc: 'Bank of Kigali, Equity Bank, I&M Bank, Cogebanque' },
      ],
      faqTitle: 'Foire Aux Questions',
      faqs: [
        {
          q: 'Puis-je retirer le bonus de bienvenue de 500 RWF ?',
          a: 'Le bonus de 500 RWF est conçu pour être dépensé sur la plateforme (messages et pass). Les gains de parrainage et de commission (200 RWF, 5%, 15%) sont 100% retirables vers MoMo ou banque dès que vous atteignez 2 000 RWF.',
        },
        {
          q: 'Comment trouver mon lien de parrainage ?',
          a: 'Connectez-vous à votre compte, visitez la page "Gagner de l’argent / Parrainages", puis copiez votre lien ou cliquez sur "Partager sur WhatsApp".',
        },
        {
          q: 'Mon numéro de paiement sera-t-il enregistré ?',
          a: 'Oui ! Vos coordonnées de retrait sont sauvegardées pour simplifier vos futurs retraits, tout en restant modifiables à tout moment.',
        },
      ],
    },
  };

  const currentLang = language === 'rw' ? 'rw' : language === 'fr' ? 'fr' : 'en';
  const c = content[currentLang];

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 pb-20">
      {/* Hero Header */}
      <section className="relative overflow-hidden bg-gradient-to-b from-amber-500/10 via-rose-500/5 to-transparent pt-16 pb-20 px-4 sm:px-6 lg:px-8 text-center">
        <div className="max-w-4xl mx-auto space-y-6">
          {/* Language Switcher Tabs */}
          <div className="inline-flex p-1 bg-white border border-slate-200 rounded-2xl shadow-xs">
            <button
              onClick={() => setLanguage('en')}
              className={`px-3 py-1.5 text-xs font-bold rounded-xl transition-all ${
                currentLang === 'en' ? 'bg-amber-500 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              🇬🇧 English
            </button>
            <button
              onClick={() => setLanguage('rw')}
              className={`px-3 py-1.5 text-xs font-bold rounded-xl transition-all ${
                currentLang === 'rw' ? 'bg-amber-500 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              🇷🇼 Kinyarwanda
            </button>
            <button
              onClick={() => setLanguage('fr')}
              className={`px-3 py-1.5 text-xs font-bold rounded-xl transition-all ${
                currentLang === 'fr' ? 'bg-amber-500 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              🇫🇷 Français
            </button>
          </div>

          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-amber-100 text-amber-800 text-xs font-extrabold uppercase tracking-wider">
            <Sparkles className="w-3.5 h-3.5" />
            {c.badge}
          </div>

          <h1 className="text-3xl sm:text-5xl font-black text-slate-900 tracking-tight leading-tight">
            {c.title}
          </h1>

          <p className="text-base sm:text-lg text-slate-600 max-w-2xl mx-auto leading-relaxed">
            {c.subtitle}
          </p>

          <div className="pt-2 flex flex-wrap items-center justify-center gap-4">
            <Link to="/auth/register">
              <Button size="lg" className="bg-gradient-to-r from-amber-500 to-rose-600 hover:from-amber-600 hover:to-rose-700 text-white shadow-lg shadow-amber-500/20 font-bold px-8">
                {c.ctaBtn} <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </Link>
            <Link to="/auth/login">
              <Button variant="outline" size="lg" className="font-bold">
                Sign In to View Dashboard
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* 4 Earning Methods Cards */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center mb-10">
          <h2 className="text-2xl sm:text-3xl font-black text-slate-900">{c.methodsTitle}</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {c.methods.map((method, idx) => {
            const Icon = method.icon;
            return (
              <div
                key={idx}
                className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-card hover:shadow-lg transition-all space-y-4 relative overflow-hidden"
              >
                <div className="flex items-center justify-between">
                  <div className={`w-12 h-12 rounded-2xl bg-gradient-to-tr ${method.color} text-white flex items-center justify-center shadow-md`}>
                    <Icon className="w-6 h-6" />
                  </div>
                  <span className="px-3 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-800 border border-amber-200/60">
                    {method.badge}
                  </span>
                </div>

                <div>
                  <h3 className="text-lg font-bold text-slate-900">{method.title}</h3>
                  <div className="text-2xl font-black text-rose-600 mt-1">{method.amount}</div>
                </div>

                <p className="text-sm text-slate-600 leading-relaxed">{method.desc}</p>
              </div>
            );
          })}
        </div>
      </section>

      {/* Withdrawal Methods Section */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="bg-gradient-to-br from-slate-900 via-slate-850 to-slate-900 rounded-3xl p-8 sm:p-12 text-white shadow-2xl space-y-8">
          <div className="max-w-2xl space-y-3">
            <div className="inline-flex items-center gap-2 text-xs font-bold text-amber-400 uppercase tracking-wider">
              <TrendingUp className="w-4 h-4" /> Threshold: 2,000 RWF Minimum
            </div>
            <h2 className="text-2xl sm:text-3xl font-black">{c.withdrawTitle}</h2>
            <p className="text-sm text-slate-300 leading-relaxed">{c.withdrawDesc}</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {c.withdrawMethods.map((wm, i) => (
              <div key={i} className="bg-slate-800/80 border border-slate-700/80 rounded-2xl p-5 space-y-2">
                <div className="w-8 h-8 rounded-xl bg-amber-400/10 text-amber-400 flex items-center justify-center font-bold text-sm">
                  {i === 0 ? <Smartphone className="w-4 h-4" /> : i === 1 ? <Smartphone className="w-4 h-4" /> : <Building className="w-4 h-4" />}
                </div>
                <h4 className="font-bold text-white text-sm">{wm.name}</h4>
                <p className="text-xs text-slate-400 leading-relaxed">{wm.desc}</p>
              </div>
            ))}
          </div>

          <div className="pt-2 flex items-center gap-2 text-xs text-slate-400">
            <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>Paiements vérifiés et protégés par chiffrement. Vos informations de compte sont sauvegardées en toute sécurité pour vos prochains retraits.</span>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-6">
        <h2 className="text-2xl font-black text-slate-900 text-center">{c.faqTitle}</h2>
        <div className="space-y-4">
          {c.faqs.map((faq, idx) => (
            <div key={idx} className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs space-y-2">
              <h4 className="font-bold text-slate-900 text-sm">{faq.q}</h4>
              <p className="text-xs text-slate-600 leading-relaxed">{faq.a}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};
