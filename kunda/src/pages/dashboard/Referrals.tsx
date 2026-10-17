import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useWallet } from '../../contexts/WalletContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { WithdrawModal } from '../../components/ui/WithdrawModal';
import { api } from '../../lib/api';
import {
  Users,
  Copy,
  CheckCircle2,
  Share2,
  Gift,
  Coins,
  PhoneCall,
  ArrowUpRight,
  TrendingUp,
  History,
  Building,
  Smartphone,
  ExternalLink,
  Sparkles,
  HelpCircle,
} from 'lucide-react';

export const Referrals: React.FC = () => {
  const { user } = useAuth();
  const { language, t } = useLanguage();
  const {
    balance,
    bonusBalance,
    totalAvailable,
    withdrawableEarned,
    currency,
    referralCode,
    referredUsersCount,
    settings,
    setIsWithdrawModalOpen,
    refreshBalance,
  } = useWallet();

  const [copiedCode, setCopiedCode] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [activeLangTab, setActiveLangTab] = useState<'rw' | 'en' | 'fr'>(
    language === 'rw' || language === 'fr' ? language : 'rw'
  );
  const [withdrawals, setWithdrawals] = useState<any[]>([]);
  const [loadingWithdrawals, setLoadingWithdrawals] = useState<boolean>(true);

  // Invite link calculation
  const origin = typeof window !== 'undefined' ? window.location.origin : 'https://kunda.space';
  const effectiveCode = referralCode || (user?.id ? user.id.replace(/-/g, '').slice(0, 8).toUpperCase() : '');
  const referralLink = `${origin}/auth/register?ref=${effectiveCode}`;

  const copyToClipboard = (text: string, isLink: boolean) => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(text);
      if (isLink) {
        setCopiedLink(true);
        setTimeout(() => setCopiedLink(false), 2500);
      } else {
        setCopiedCode(true);
        setTimeout(() => setCopiedCode(false), 2500);
      }
    }
  };

  const shareOnWhatsApp = () => {
    const textRw = `Komeza ushake umukunzi kuri Kunda Space! Koresha link yanjye ubone 500 RWF ya welcome bonus: ${referralLink}`;
    const url = `https://api.whatsapp.com/send?text=${encodeURIComponent(textRw)}`;
    window.open(url, '_blank');
  };

  const fetchWithdrawals = async () => {
    try {
      setLoadingWithdrawals(true);
      const res = await api.get('/wallet/withdraw');
      if (res.data.success && res.data.withdrawals) {
        setWithdrawals(res.data.withdrawals);
      }
    } catch (err) {
      console.error('Fetch withdrawals error:', err);
    } finally {
      setLoadingWithdrawals(false);
    }
  };

  useEffect(() => {
    refreshBalance();
    fetchWithdrawals();
  }, []);

  const explainContent = {
    rw: {
      title: 'Uburyo 4 bwo Gukorera Amafaranga kuri Kunda Space',
      sub: 'Kunda Space iguha uburyo bwo kwinjiza amafaranga nyayo kuri MoMo, Airtel Money, cyangwa Banki.',
      items: [
        {
          title: '1. Welcome Bonus (500 RWF)',
          desc: 'Igihe cyose umunyamuryango mushya yiyandikishije, ahabwa 500 RWF muri konti ye. Ayo mafaranga ashobora kuyakoresha mu kohereza ubutumwa no kureba nimero za telefone mbere yo gushyiramo amafaranga ye bwite!',
          badge: 'Ikoreshwa ako kanya',
        },
        {
          title: '2. 200 RWF ku Muntu wese uzanye',
          desc: 'Sangiza link yawe cyangwa code yawe inshuti zawe kuri WhatsApp cyangwa izindi mbuga. Iyo biyandikishije neza, uhita ubona 200 RWF kuri konti yawe ushobora kubikuza igihe icyo aricyo cyose.',
          badge: 'Ibibikuzwa 100%',
        },
        {
          title: '3. 5% kuri buri Deposit y’uwo wazanye',
          desc: 'Buri gihe uwo wazanye ashyize amafaranga kuri konti ye kugira ngo agure passes cyangwa arebe nimero, uhita uhabwa 5% by’amafaranga ashyizemo ako kanya.',
          badge: 'Umusaruro Uhoraho',
        },
        {
          title: '4. 15% iyo bafunguye Nimero yawe',
          desc: 'Iyo undi munyamuryango yishyuye kugira ngo afungure nimero yawe ya WhatsApp/telefone kubw’uburenganzira bwawe, uhabwa 15% by’amafaranga yishyuwe agahita ajya mu bifatika byo kubikuza!',
          badge: 'Amafaranga y’Incuti',
        },
      ],
    },
    en: {
      title: '4 Ways to Earn Real Money on Kunda Space',
      sub: 'Earn withdrawable cash directly to MTN MoMo, Airtel Money, or Bank Transfer.',
      items: [
        {
          title: '1. Welcome Bonus (500 RWF)',
          desc: 'Every newly registered member receives a 500 RWF bonus immediately. You can spend this bonus on chatting and unlocking contacts before making any deposit!',
          badge: 'Immediately Spendable',
        },
        {
          title: '2. 200 RWF per Referral Signup',
          desc: 'Share your link with friends. The moment they complete signup, 200 RWF is credited to your withdrawable wallet with zero holding time.',
          badge: '100% Withdrawable',
        },
        {
          title: '3. 5% Commission on All Deposits',
          desc: 'Whenever anyone you invited adds money to their wallet to buy messaging passes, you receive a 5% commission credited to your balance.',
          badge: 'Passive Income',
        },
        {
          title: '4. 15% Contact Unlock Revenue Share',
          desc: 'When another verified member unlocks your phone contact with your consent, you get a 15% cut of the unlock fee credited to your withdrawable wallet!',
          badge: 'Creator Revenue',
        },
      ],
    },
    fr: {
      title: '4 Façons de Gagner de l’Argent Réel sur Kunda Space',
      sub: 'Recevez des paiements en espèces directement sur MTN MoMo, Airtel Money ou virement bancaire.',
      items: [
        {
          title: '1. Bonus de Bienvenue (500 RWF)',
          desc: 'Tout nouveau membre reçoit 500 RWF à l’inscription. Vous pouvez dépenser ce bonus pour envoyer des messages et débloquer des contacts avant tout dépôt!',
          badge: 'Dépensable Immédiatement',
        },
        {
          title: '2. 200 RWF par Inscription de Parrainage',
          desc: 'Partagez votre lien. Dès qu’un ami s’inscrit, 200 RWF sont crédités sur votre portefeuille retirable sans délai.',
          badge: '100% Retirable',
        },
        {
          title: '3. 5% de Commission sur les Dépôts',
          desc: 'Chaque fois qu’un filleul recharge son portefeuille pour discuter, vous recevez 5% de son montant déposé.',
          badge: 'Revenu Passif',
        },
        {
          title: '4. 15% de Partage sur les Déblocages de Contact',
          desc: 'Lorsqu’un membre débloque votre contact avec votre accord, vous touchez 15% du montant du déblocage en espèces!',
          badge: 'Revenu Créateur',
        },
      ],
    },
  };

  const currentExplain = explainContent[activeLangTab];

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-50 text-rose-600 text-xs font-black uppercase tracking-wider mb-2">
            <Sparkles className="w-3.5 h-3.5" /> Affiliate & Creator Program
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            Referrals & Earning Center
          </h1>
          <p className="text-xs text-slate-500">
            Gushaka amafaranga binyuze mu gutumira inshuti no gusangiza konti yawe
          </p>
        </div>
        <Button
          onClick={() => setIsWithdrawModalOpen(true)}
          className="shadow-md shadow-emerald-200 bg-emerald-600 hover:bg-emerald-700 text-white font-bold"
        >
          <ArrowUpRight className="w-4 h-4 mr-1.5" /> Request Payout / Kubikuza
        </Button>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Withdrawable Earnings */}
        <div className="bg-gradient-to-br from-emerald-600 to-teal-700 rounded-3xl p-6 text-white shadow-lg shadow-emerald-200 space-y-2 relative overflow-hidden">
          <div className="flex justify-between items-start">
            <span className="text-xs font-semibold text-emerald-100 uppercase tracking-wider">
              Withdrawable Cash
            </span>
            <span className="text-[10px] bg-white/20 px-2.5 py-0.5 rounded-full font-bold">
              MoMo / Airtel / Bank
            </span>
          </div>
          <div className="text-3xl font-black">
            {balance.toLocaleString()} {currency}
          </div>
          <p className="text-[11px] text-emerald-100/90 flex items-center justify-between">
            <span>Min payout: {settings.minWithdrawal?.toLocaleString()} {currency}</span>
            <span className="font-bold">{balance >= (settings.minWithdrawal || 2000) ? '✓ Eligible' : 'In Progress'}</span>
          </p>
        </div>

        {/* Welcome Bonus */}
        <div className="bg-gradient-to-br from-rose-500 to-amber-500 rounded-3xl p-6 text-white shadow-lg shadow-rose-200 space-y-2 relative overflow-hidden">
          <div className="flex justify-between items-start">
            <span className="text-xs font-semibold text-rose-100 uppercase tracking-wider flex items-center gap-1">
              <Gift className="w-3.5 h-3.5" /> Welcome Bonus
            </span>
            <span className="text-[10px] bg-white/20 px-2.5 py-0.5 rounded-full font-bold">
              Spend First
            </span>
          </div>
          <div className="text-3xl font-black">
            {bonusBalance.toLocaleString()} {currency}
          </div>
          <p className="text-[11px] text-rose-100/90">
            Spendable on messaging & unlocks before depositing!
          </p>
        </div>

        {/* Total Referrals Count */}
        <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-card space-y-2">
          <div className="flex justify-between items-start">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Invited Members
            </span>
            <span className="text-[10px] bg-blue-50 text-blue-700 px-2.5 py-0.5 rounded-full font-bold">
              +{settings.referralReward} RWF / each
            </span>
          </div>
          <div className="text-3xl font-black text-slate-900">
            {referredUsersCount} <span className="text-xs font-medium text-slate-400">members</span>
          </div>
          <p className="text-[11px] text-slate-500">
            Total earned: <strong className="text-emerald-600">{(referredUsersCount * (settings.referralReward || 200)).toLocaleString()} {currency}</strong>
          </p>
        </div>
      </div>

      {/* Share Box Card */}
      <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-card space-y-5">
        <div>
          <h3 className="text-base font-extrabold text-slate-900">Your Unique Referral Invite Link</h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Send this link to friends on WhatsApp or social media. When they sign up, you instantly get 200 RWF + 5% of their deposits!
          </p>
        </div>

        {/* Link Box */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
          <div className="flex-1 px-4 py-3 bg-slate-50 rounded-2xl border border-slate-200 font-mono text-xs text-slate-700 truncate select-all">
            {referralLink}
          </div>
          <div className="flex gap-2">
            <Button
              onClick={() => copyToClipboard(referralLink, true)}
              className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 shadow-sm"
            >
              {copiedLink ? <CheckCircle2 className="w-4 h-4 text-white" /> : <Copy className="w-4 h-4" />}
              {copiedLink ? 'Copied!' : 'Copy Link'}
            </Button>
            <button
              onClick={shareOnWhatsApp}
              className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition shadow-sm"
              title="Share on WhatsApp"
            >
              <Share2 className="w-4 h-4" />
              WhatsApp
            </button>
          </div>
        </div>

        {/* Referral Code Box */}
        <div className="pt-2 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500 font-semibold">Your Referral Code:</span>
            <span className="px-3 py-1 bg-rose-50 text-rose-700 font-black rounded-xl text-xs tracking-wider border border-rose-100">
              {effectiveCode}
            </span>
          </div>
          <button
            onClick={() => copyToClipboard(effectiveCode, false)}
            className="text-xs text-rose-600 hover:text-rose-700 font-bold flex items-center gap-1"
          >
            {copiedCode ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
            {copiedCode ? 'Code Copied!' : 'Copy Code Only'}
          </button>
        </div>
      </div>

      {/* Trilingual "How It Works" Section */}
      <div className="bg-slate-900 text-white rounded-3xl p-6 sm:p-8 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h3 className="text-lg font-black tracking-tight">{currentExplain.title}</h3>
            <p className="text-xs text-slate-400 mt-1">{currentExplain.sub}</p>
          </div>
          {/* Language Switcher Tabs */}
          <div className="flex bg-slate-800 p-1 rounded-2xl border border-slate-700 self-start sm:self-auto">
            <button
              onClick={() => setActiveLangTab('rw')}
              className={`px-3 py-1 rounded-xl text-xs font-bold transition ${
                activeLangTab === 'rw' ? 'bg-rose-500 text-white shadow' : 'text-slate-400 hover:text-white'
              }`}
            >
              Kinyarwanda
            </button>
            <button
              onClick={() => setActiveLangTab('en')}
              className={`px-3 py-1 rounded-xl text-xs font-bold transition ${
                activeLangTab === 'en' ? 'bg-rose-500 text-white shadow' : 'text-slate-400 hover:text-white'
              }`}
            >
              English
            </button>
            <button
              onClick={() => setActiveLangTab('fr')}
              className={`px-3 py-1 rounded-xl text-xs font-bold transition ${
                activeLangTab === 'fr' ? 'bg-rose-500 text-white shadow' : 'text-slate-400 hover:text-white'
              }`}
            >
              Français
            </button>
          </div>
        </div>

        {/* 4 Methods Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {currentExplain.items.map((item, idx) => (
            <div
              key={idx}
              className="bg-slate-800/80 border border-slate-700/80 rounded-2xl p-4 space-y-2 hover:border-slate-600 transition"
            >
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-extrabold text-white">{item.title}</h4>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/30">
                  {item.badge}
                </span>
              </div>
              <p className="text-[11px] text-slate-300 leading-relaxed">{item.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Payout History Table */}
      <div className="bg-white rounded-3xl border border-slate-100 shadow-card overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex items-center justify-between">
          <h3 className="font-extrabold text-base text-slate-900 flex items-center gap-2">
            <History className="w-4 h-4 text-slate-500" />
            Payout Request History / Amateka yo Kubikuza
          </h3>
          <span className="text-xs text-slate-400 font-medium">{withdrawals.length} requests</span>
        </div>

        {loadingWithdrawals ? (
          <div className="p-8 text-center text-xs text-slate-400">Loading payout records...</div>
        ) : withdrawals.length === 0 ? (
          <div className="p-12 text-center text-xs text-slate-400">
            No withdrawal requests yet. Once your balance reaches {settings.minWithdrawal?.toLocaleString()} {currency}, click "Request Payout" above!
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 font-semibold uppercase tracking-wider border-b border-slate-100">
                <tr>
                  <th className="p-4">Date</th>
                  <th className="p-4">Method</th>
                  <th className="p-4">Account / Recipient</th>
                  <th className="p-4 text-right">Amount</th>
                  <th className="p-4 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {withdrawals.map((w) => (
                  <tr key={w.id} className="hover:bg-slate-50/50">
                    <td className="p-4 text-slate-500 whitespace-nowrap">
                      {new Date(w.createdAt).toLocaleDateString()}
                    </td>
                    <td className="p-4 font-bold text-slate-800 uppercase">
                      {w.payoutMethod} {w.bankName ? `(${w.bankName})` : ''}
                    </td>
                    <td className="p-4 text-slate-600">
                      <div className="font-semibold text-slate-800">{w.payoutAccount}</div>
                      <div className="text-[11px] text-slate-400">{w.accountHolderName}</div>
                    </td>
                    <td className="p-4 text-right font-black whitespace-nowrap text-emerald-600">
                      {w.amountMinor.toLocaleString()} {w.currency || 'RWF'}
                    </td>
                    <td className="p-4 text-center">
                      <Badge
                        variant={w.status === 'completed' ? 'emerald' : w.status === 'pending' ? 'amber' : 'rose'}
                        size="sm"
                      >
                        {w.status}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Withdraw Modal */}
      <WithdrawModal />
    </div>
  );
};
