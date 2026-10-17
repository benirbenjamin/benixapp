import React, { useState, useEffect } from 'react';
import { useLanguage } from '../../contexts/LanguageContext';
import { ChevronDown, HelpCircle, Sparkles } from 'lucide-react';
import { api } from '../../lib/api';

export const Faq: React.FC = () => {
  const { language, t } = useLanguage();
  const [openIndex, setOpenIndex] = useState<number | null>(0);

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
        if (res.data?.success && res.data.settings) {
          setSettings(res.data.settings);
        }
      })
      .catch(() => {});
  }, []);

  const freeInitialMessages = settings.freeInitialMessages ?? 3;
  const freeReplies = settings.freeReplies ?? 3;
  const welcomeBonus = settings.welcomeBonus ?? 500;
  const currency = settings.currency || 'RWF';
  const threeDayPrice = settings.threeDayPassPrice ?? 1500;
  const weeklyPrice = settings.weeklyPassPrice ?? 3000;
  const payPerMsg = settings.payPerMessagePrice ?? 150;
  const referralReward = settings.referralReward ?? 200;

  const faqsByLang = {
    rw: [
      {
        q: 'Ese Kunda Space ikoreshwa ku buntu?',
        a: `Yego rwose! Gufungura konti, gushakisha abantu bakubereye, kureba amanota yo guhuza, kohereza ubutumwa ${freeInitialMessages} bwa mbere ku buntu no kohereza ibisubizo ${freeReplies} byose ni ubuntu 100%. Byongeye kandi, buri munyamuryango mushya ahabwa ${welcomeBonus.toLocaleString()} ${currency} ya Welcome Bonus ako kanya muri wallet ye yo gukoresha mbere yo gushyiramo amafaranga ye bwite! Nyuma y'ibyo, ushobora guhitamo Pass y'Amasaha 24, Pass y'Iminsi 3 (${threeDayPrice.toLocaleString()} ${currency}), cyangwa Pass y'Icyumweru (${weeklyPrice.toLocaleString()} ${currency}).`,
      },
      {
        q: 'Nshobora gukorera amafaranga kuri Kunda Space?',
        a: `Yego! Kuri Kunda Space, buri muntu wazanye akoresheje link yawe uhita ubona ${referralReward.toLocaleString()} ${currency} ako kanya mu bifatika byo kubikuza. Iyo ashyizemo amafaranga (deposit), uhabwa 5% byayo, kandi iyo undi munyamuryango yishyuye ngo afungure nimero yawe uhabwa 15% by'amafaranga yishyuwe. Ushobora kubikuza kuri MTN MoMo, Airtel Money, cyangwa Banki igihe ugejeje ku gipimo cyo kubikuza.`,
      },
      {
        q: 'Kunda Space yemeza ite ko abakoresha bafite imyaka 18 cyangwa irenga?',
        a: 'Dusuzuma kandi tukemeza itariki nyayo y’amavuko kuri seriveri yacu yizewe mugihe cyo kwiyandikisha. Konti z’abatarageza ku myaka 18 zihita zangirwa n’amategeko agenga ububiko bwacu.',
      },
      {
        q: 'Kuki ubutumwa bwange bwanzwe mugihe nageragezaga kohereza nimero ya telefone?',
        a: 'Ku bw’umutekano w’abanyamuryango no kwirinda abateka imitwe, nimero za telefone n’imiyoboro y’imbuga nkoranyambaga birinzwe mu butumwa. Kugira ngo musangire nimero mu mutekano, mwembi mukoresha Direct Contact Unlock mugihe mwembi mwabyemeranyijweho.',
      },
      {
        q: 'Kwishyura bikora bite binyuze kuri Flutterwave?',
        a: 'Dukorana na Flutterwave kugira ngo twakire MTN Mobile Money, Airtel Money, Visa, na Mastercard mu buryo bworoshye kandi bwizewe mu masegonda make.',
      },
    ],
    en: [
      {
        q: 'Is Kunda Space free to use?',
        a: `Yes! Creating your profile, discovering members, viewing compatibility breakdowns, sending your first ${freeInitialMessages} messages to distinct members, and sending ${freeReplies} replies are completely free. Additionally, every new member is automatically credited with a ${welcomeBonus.toLocaleString()} ${currency} Welcome Bonus that you can spend on messaging before depositing any real cash. If you wish to continue messaging beyond that, you can choose an affordable 3-Day Pass (${threeDayPrice.toLocaleString()} ${currency}), Weekly Pass (${weeklyPrice.toLocaleString()} ${currency}), or Pay-Per-Message (${payPerMsg.toLocaleString()} ${currency}).`,
      },
      {
        q: 'Can I earn real cash on Kunda Space?',
        a: `Yes! Through our Affiliate & Creator program, you earn ${referralReward.toLocaleString()} ${currency} withdrawable cash for every friend who signs up with your link, plus a 5% commission on all their deposits, and 15% revenue share whenever a member unlocks your direct contact. Payouts can be requested directly to MTN MoMo, Airtel Money, or Bank Transfer.`,
      },
      {
        q: 'How does Kunda Space verify that users are 18 or older?',
        a: 'We strictly calculate and validate your exact date of birth on our secure server during registration. Accounts belonging to users under 18 years of age are automatically rejected by our database constraints.',
      },
      {
        q: 'Why did my message get blocked when I tried to send my phone number?',
        a: 'For member security and anti-scam protection, our system restricts sharing direct phone numbers and external social handles in chat. To share contacts safely, both members can use the Direct Contact Unlock feature once mutual consent is granted.',
      },
      {
        q: 'How do payments work with Flutterwave?',
        a: 'We partner with Flutterwave to support MTN Mobile Money, Airtel Money, Visa, Mastercard, and bank cards. Funds are credited directly to your secure Kunda Space wallet ledger instantly.',
      },
      {
        q: 'Can members outside Rwanda join Kunda Space?',
        a: 'Absolutely! While Kunda Space focuses on Rwanda and the Rwandan diaspora, verified adult members worldwide who appreciate Rwandan culture or wish to meet singles in Rwanda are welcome to join.',
      },
    ],
    fr: [
      {
        q: 'Kunda Space est-il gratuit ?',
        a: `Oui ! Créer votre profil, découvrir les membres, voir les scores de compatibilité, envoyer vos ${freeInitialMessages} premiers messages et envoyer ${freeReplies} réponses sont 100% gratuits. De plus, tout nouveau membre reçoit automatiquement ${welcomeBonus.toLocaleString()} ${currency} de Bonus de Bienvenue utilisable pour discuter avant tout dépôt ! Vous pouvez ensuite opter pour un Pass 3 Jours (${threeDayPrice.toLocaleString()} ${currency}), Pass Semaine (${weeklyPrice.toLocaleString()} ${currency}) ou Paiement par message (${payPerMsg.toLocaleString()} ${currency}).`,
      },
      {
        q: 'Peut-on gagner de l’argent réel sur Kunda Space ?',
        a: `Absolument ! Grâce à notre programme d'affiliation, vous gagnez ${referralReward.toLocaleString()} ${currency} retirables par ami inscrit, 5% de chacun de ses dépôts et 15% à chaque déblocage de votre contact. Les retraits s'effectuent via MTN MoMo, Airtel Money ou virement bancaire.`,
      },
      {
        q: 'Comment Kunda Space vérifie-t-il que les utilisateurs ont 18 ans ou plus ?',
        a: 'Nous calculons et validons rigoureusement votre date de naissance exacte sur notre serveur sécurisé lors de l’inscription. Les mineurs sont automatiquement rejetés par nos contraintes système.',
      },
      {
        q: 'Pourquoi mon message a-t-il été bloqué lorsque j’ai tenté d’envoyer mon numéro ?',
        a: 'Pour protéger les membres contre les escroqueries, le partage direct de coordonnées externes dans le chat est restreint. Pour partager vos contacts en toute sécurité, utilisez la fonction Déblocage de Contact Direct après consentement mutuel.',
      },
      {
        q: 'Comment fonctionnent les paiements avec Flutterwave ?',
        a: 'Nous utilisons Flutterwave pour gérer en toute sécurité les paiements via MTN Mobile Money, Airtel Money, cartes bancaires Visa et Mastercard.',
      },
    ],
  };

  const activeLangKey = language === 'rw' || language === 'fr' ? language : 'en';
  const faqs = faqsByLang[activeLangKey];

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16 space-y-12">
      <div className="text-center space-y-4">
        <span className="text-xs font-bold text-rose-600 uppercase tracking-widest">
          {activeLangKey === 'rw' ? 'Ibibazo Bikunze Kubazwa' : activeLangKey === 'fr' ? 'Centre d’Aide' : 'Help Center'}
        </span>
        <h1 className="text-4xl sm:text-5xl font-extrabold text-slate-900 tracking-tight">
          {activeLangKey === 'rw' ? 'Ibibazo Bikunze Kubazwa (FAQ)' : activeLangKey === 'fr' ? 'Foire Aux Questions' : 'Frequently Asked Questions'}
        </h1>
        <p className="text-base text-slate-600 max-w-2xl mx-auto">
          {activeLangKey === 'rw'
            ? 'Buri kintu cyose wifuza kumenya ku micungire, umutekano, no gukorera amafaranga kuri Kunda Space.'
            : activeLangKey === 'fr'
            ? 'Tout ce que vous devez savoir sur Kunda Space, la sécurité des rencontres et les gains.'
            : 'Everything you need to know about Kunda Space matching, security, and memberships.'}
        </p>
      </div>

      <div className="space-y-4">
        {faqs.map((item, idx) => (
          <div
            key={idx}
            className="bg-white rounded-2xl border border-slate-200/80 overflow-hidden shadow-sm"
          >
            <button
              onClick={() => setOpenIndex(openIndex === idx ? null : idx)}
              className="w-full flex items-center justify-between p-6 text-left hover:bg-slate-50 transition-colors"
            >
              <span className="text-base font-bold text-slate-900">{item.q}</span>
              <ChevronDown
                className={`w-5 h-5 text-slate-400 transition-transform ${
                  openIndex === idx ? 'rotate-180 text-rose-600' : ''
                }`}
              />
            </button>
            {openIndex === idx && (
              <div className="px-6 pb-6 text-sm text-slate-600 leading-relaxed border-t border-slate-100 pt-4 bg-slate-50/50">
                {item.a}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};
