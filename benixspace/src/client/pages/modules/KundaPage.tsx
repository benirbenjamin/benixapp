import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { AppAccessWizardModal } from '../../components/modals/AppAccessWizardModal';
import { KundaChatModal } from '../../components/modals/KundaChatModal';
import { KundaSubscriptionModal } from '../../components/modals/KundaSubscriptionModal';
import { WalletModal } from '../../components/modals/WalletModal';
import { SeoHead } from '../../components/common/SeoHead';
import {
  Heart,
  Sparkles,
  ShieldCheck,
  MapPin,
  MessageCircle,
  Filter,
  CheckCircle2,
  Lock,
  Search,
  Star,
  Users,
  Eye,
  ArrowLeft,
  Zap,
  Phone
} from 'lucide-react';

interface MatchProfile {
  id: string;
  name: string;
  age: number;
  city: string;
  profession: string;
  bio: string;
  interests: string[];
  image: string;
  verified: boolean;
  online: boolean;
}

export const KundaPage: React.FC = () => {
  const { user, token, hasAppProfile } = useAuth();
  const navigate = useNavigate();
  const [matches, setMatches] = useState<MatchProfile[]>([]);
  const [loadingMatches, setLoadingMatches] = useState<boolean>(true);
  const [wizardTarget, setWizardTarget] = useState<string | null>(null);
  const [selectedCity, setSelectedCity] = useState<string>('all');
  const [likedProfiles, setLikedProfiles] = useState<string[]>([]);
  const [actionSuccess, setActionSuccess] = useState<string>('');

  // Interactive Kunda Modals State
  const [selectedPartner, setSelectedPartner] = useState<MatchProfile | null>(null);
  const [isChatOpen, setIsChatOpen] = useState<boolean>(false);
  const [isSubscriptionOpen, setIsSubscriptionOpen] = useState<boolean>(false);
  const [isWalletOpen, setIsWalletOpen] = useState<boolean>(false);

  // Load real registered user matches from database
  React.useEffect(() => {
    setLoadingMatches(true);
    fetch('/api/modules/kunda/matches', {
      headers: token ? { Authorization: `Bearer ${token}` } : undefined
    })
      .then((res) => res.json())
      .then((data) => {
        if (data?.matches && Array.isArray(data.matches)) {
          setMatches(data.matches);
        }
      })
      .catch(() => {})
      .finally(() => setLoadingMatches(false));
  }, [token]);

  // Load existing persistent crushes from PostgreSQL
  React.useEffect(() => {
    if (token) {
      fetch('/api/modules/kunda/my-crushes', {
        headers: { Authorization: `Bearer ${token}` }
      })
        .then((res) => res.json())
        .then((data) => {
          if (data?.crushes && Array.isArray(data.crushes)) {
            setLikedProfiles(data.crushes);
          }
        })
        .catch(() => {});
    }
  }, [token]);

  const handleProtectedAction = (match: MatchProfile, actionName: string) => {
    if (!user || !hasAppProfile('kunda')) {
      setWizardTarget('kunda');
      return;
    }

    if (actionName === 'like') {
      const isAlreadyLiked = likedProfiles.includes(match.id);
      fetch('/api/modules/kunda/crush', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          targetProfileId: match.id,
          targetName: match.name,
          unlike: isAlreadyLiked
        })
      }).catch(() => {});

      setLikedProfiles((prev) =>
        isAlreadyLiked ? prev.filter((id) => id !== match.id) : [...prev, match.id]
      );
      setActionSuccess(
        isAlreadyLiked
          ? `Removed crush from ${match.name}.`
          : `Crush sent to ${match.name}! You will receive a notification when they match back.`
      );
      setTimeout(() => setActionSuccess(''), 4000);
    } else {
      // Direct navigation to Messages Room with partner params
      navigate(
        `/messages?user=${match.id}&name=${encodeURIComponent(match.name)}&avatar=${encodeURIComponent(match.image)}`
      );
    }
  };

  const filteredMatches = matches.filter((m) => {
    if (selectedCity === 'all') return true;
    return m.city.toLowerCase().includes(selectedCity.toLowerCase());
  });

  return (
    <div className="bg-[#0B0E14] text-slate-100 min-h-screen pb-24 font-sans selection:bg-rose-600 selection:text-white">
      <SeoHead
        title="Kunda Space Dating — Verified Rwandan Matchmaking"
        description="Find genuine, verified connections and serious relationships with shared values across Kigali and Rwanda on Kunda Space."
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 space-y-6">
        
        {/* Prominent Back to Home Button & Membership Pass Action */}
        <div className="flex items-center justify-between">
          <Link
            to="/"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-2xl bg-[#121824] hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800 text-xs font-bold transition-all hover:scale-105 shadow-md"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Home</span>
          </Link>

          <button
            onClick={() => setIsSubscriptionOpen(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-2xl bg-gradient-to-r from-rose-600 to-pink-600 hover:from-rose-500 hover:to-pink-500 text-white font-bold text-xs shadow-md shadow-rose-600/30 hover:scale-105 transition-all"
          >
            <Zap className="w-3.5 h-3.5 fill-current" />
            <span>Unlimited Passes (From 500 RWF)</span>
          </button>
        </div>

        {/* Top Hero Banner */}
        <div className="relative rounded-3xl overflow-hidden border border-slate-800 bg-gradient-to-br from-[#260f18] via-[#1a0a12] to-[#0B0E14] shadow-2xl p-6 sm:p-10">
          <div className="absolute top-0 right-0 -mr-16 -mt-16 w-80 h-80 rounded-full bg-rose-600/10 blur-3xl pointer-events-none" />
          <div className="absolute bottom-0 left-1/3 -mb-16 w-72 h-72 rounded-full bg-pink-600/10 blur-3xl pointer-events-none" />

          <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div className="space-y-4 max-w-2xl">
              <div className="flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider bg-rose-600 text-white shadow-lg shadow-rose-600/30">
                  <Heart className="w-3.5 h-3.5 fill-white" />
                  Kunda Matchmaking
                </span>
                <span className="px-3 py-1 rounded-full text-xs font-semibold bg-rose-500/10 text-rose-400 border border-rose-500/20">
                  100% Verified Profiles
                </span>
                <span className="px-3 py-1 rounded-full text-xs font-semibold bg-slate-800 text-slate-300">
                  Strict Privacy Controls
                </span>
              </div>

              <h1 className="text-3xl sm:text-5xl font-black tracking-tight text-white leading-tight">
                Meaningful Connections, <br />
                <span className="bg-gradient-to-r from-rose-400 via-pink-300 to-amber-300 bg-clip-text text-transparent">
                  Rooted in Trust & Shared Values
                </span>
              </h1>

              <p className="text-sm sm:text-base text-slate-400 leading-relaxed">
                Connect with verified singles in Rwanda looking for serious relationships, genuine companionship, and shared life goals without public embarrassment or spam.
              </p>

              <div className="flex flex-wrap items-center gap-3 pt-2">
                <button
                  onClick={() => {
                    if (!user || !hasAppProfile('kunda')) {
                      setWizardTarget('kunda');
                    } else {
                      setActionSuccess('Your Kunda Space profile is already active and visible to verified matches!');
                      setTimeout(() => setActionSuccess(''), 4000);
                    }
                  }}
                  className="px-6 py-3.5 rounded-2xl bg-gradient-to-r from-rose-600 to-pink-600 hover:from-rose-500 hover:to-pink-500 text-white font-bold text-sm shadow-xl shadow-rose-600/25 flex items-center gap-2.5 transition-all transform active:scale-95"
                >
                  <Sparkles className="w-4 h-4" />
                  {hasAppProfile('kunda') ? 'Edit Dating Preferences' : 'Set Up Dating Profile'}
                </button>
              </div>
            </div>

            {/* Privacy Guarantee Card */}
            <div className="w-full md:w-80 p-5 rounded-2xl bg-[#1F1218]/90 border border-rose-500/30 shadow-2xl backdrop-blur-md space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-rose-600/20 text-rose-400 flex items-center justify-center">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-extrabold text-sm text-white">Safe & Discrete</h4>
                  <p className="text-[11px] text-slate-400">Phone numbers never shared</p>
                </div>
              </div>
              <ul className="text-xs text-slate-300 space-y-2 pt-2 border-t border-slate-800">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-rose-400" />
                  <span>Mandatory WhatsApp identity check</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-rose-400" />
                  <span>Photo verification badge</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-rose-400" />
                  <span>End-to-end private chat requests</span>
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* Feedback alert */}
        {actionSuccess && (
          <div className="p-4 rounded-2xl bg-rose-950/60 border border-rose-500/50 text-rose-200 text-xs font-bold flex items-center gap-2 shadow-lg">
            <Heart className="w-4 h-4 fill-rose-500 text-rose-500" />
            <span>{actionSuccess}</span>
          </div>
        )}

        {/* Filter Strip */}
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
            {['all', 'kigali', 'musanze', 'rubavu', 'huye'].map((city) => (
              <button
                key={city}
                onClick={() => setSelectedCity(city)}
                className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap capitalize transition-all ${
                  selectedCity === city
                    ? 'bg-rose-600 text-white shadow-lg shadow-rose-600/20'
                    : 'bg-[#131926] text-slate-400 hover:text-white hover:bg-[#1a2234] border border-slate-800'
                }`}
              >
                {city === 'all' ? 'All Locations' : city}
              </button>
            ))}
          </div>

          <span className="text-xs text-slate-400">
            Showing {filteredMatches.length} Verified Singles
          </span>
        </div>

        {/* Match Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredMatches.map((match) => {
            const isLiked = likedProfiles.includes(match.id);
            return (
              <div
                key={match.id}
                className="group rounded-3xl bg-[#131926] border border-slate-800/80 hover:border-rose-500/50 overflow-hidden transition-all duration-300 hover:shadow-2xl hover:shadow-rose-950/20 flex flex-col justify-between"
              >
                <div>
                  {/* Photo Frame */}
                  <div className="relative aspect-[4/3] bg-slate-900 overflow-hidden">
                    <img
                      src={match.image}
                      alt={match.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      loading="lazy"
                    />

                    {/* Gradient Overlay */}
                    <div className="absolute inset-0 bg-gradient-to-t from-[#131926] via-transparent to-black/30" />

                    {/* Verification & Online Status */}
                    <div className="absolute top-3 left-3 flex items-center gap-1.5">
                      {match.verified && (
                        <span className="px-2.5 py-1 rounded-full text-[10px] font-black bg-rose-600/90 backdrop-blur-md text-white flex items-center gap-1 shadow-md">
                          <ShieldCheck className="w-3 h-3" />
                          VERIFIED
                        </span>
                      )}
                      {match.online && (
                        <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-600/90 backdrop-blur-md text-white flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                          ONLINE
                        </span>
                      )}
                    </div>

                    {/* Quick Like Heart */}
                    <button
                      onClick={() => handleProtectedAction(match, 'like')}
                      className="absolute top-3 right-3 w-9 h-9 rounded-full bg-black/60 backdrop-blur-md flex items-center justify-center text-slate-300 hover:text-rose-500 hover:scale-110 transition-all shadow-md"
                    >
                      <Heart className={`w-4 h-4 ${isLiked ? 'fill-rose-500 text-rose-500' : ''}`} />
                    </button>

                    {/* Name & Age Overlay */}
                    <div className="absolute bottom-3 left-4 right-4">
                      <h3 className="text-xl font-black text-white flex items-center gap-2">
                        {match.name}, <span className="font-normal text-slate-300">{match.age}</span>
                      </h3>
                      <p className="text-xs text-rose-300 font-semibold flex items-center gap-1 mt-0.5">
                        <MapPin className="w-3 h-3" />
                        {match.city} • {match.profession}
                      </p>
                    </div>
                  </div>

                  {/* Bio & Interests */}
                  <div className="p-5 space-y-3">
                    <p className="text-xs text-slate-400 leading-relaxed line-clamp-2">
                      "{match.bio}"
                    </p>

                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {match.interests.map((interest) => (
                        <span
                          key={interest}
                          className="px-2.5 py-1 rounded-lg text-[10px] font-bold bg-[#1C2538] text-slate-300 border border-slate-700/60"
                        >
                          #{interest}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Card Action Bar */}
                <div className="p-5 pt-0">
                  <div className="grid grid-cols-2 gap-2 pt-3 border-t border-slate-800">
                    <button
                      onClick={() => handleProtectedAction(match, 'like')}
                      className={`py-2.5 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition-all ${
                        isLiked
                          ? 'bg-rose-600 text-white shadow-md'
                          : 'bg-[#1C2538] hover:bg-[#25324c] text-rose-400 border border-rose-500/30'
                      }`}
                    >
                      <Heart className={`w-3.5 h-3.5 ${isLiked ? 'fill-white' : ''}`} />
                      {isLiked ? 'Liked' : 'Send Crush'}
                    </button>

                    <button
                      onClick={() => handleProtectedAction(match, 'chat')}
                      className="py-2.5 rounded-xl bg-gradient-to-r from-rose-600 to-pink-600 hover:from-rose-500 hover:to-pink-500 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-md shadow-rose-600/20 transition-all hover:scale-105 active:scale-95"
                    >
                      <MessageCircle className="w-3.5 h-3.5" />
                      Private Chat
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Non-Logged In Callout Banner */}
        {!user && (
          <div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-r from-rose-950/60 via-[#131926] to-pink-950/60 border border-rose-500/20 flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="space-y-1 text-center md:text-left">
              <h3 className="text-lg font-black text-white">Join Kunda Space Verified Matchmaking</h3>
              <p className="text-xs text-slate-400">
                Register with your basic info (Name, Email, WhatsApp Phone, Country), then fill your dating preferences to unlock unlimited crushes and chats.
              </p>
            </div>
            <button
              onClick={() => setWizardTarget('kunda')}
              className="px-6 py-3 rounded-2xl bg-rose-600 hover:bg-rose-500 text-white font-extrabold text-xs shadow-lg shadow-rose-600/30 whitespace-nowrap transition-all"
            >
              Start Free Dating Profile
            </button>
          </div>
        )}

      </div>

      {/* Kunda Interactive Private Chat Modal */}
      {isChatOpen && selectedPartner && (
        <KundaChatModal
          isOpen={isChatOpen}
          partner={selectedPartner}
          onClose={() => {
            setIsChatOpen(false);
            setSelectedPartner(null);
          }}
          onOpenSubscription={() => setIsSubscriptionOpen(true)}
          onOpenWallet={() => setIsWalletOpen(true)}
        />
      )}

      {/* Kunda Subscription Membership Modal */}
      {isSubscriptionOpen && (
        <KundaSubscriptionModal
          isOpen={isSubscriptionOpen}
          onClose={() => setIsSubscriptionOpen(false)}
          onOpenWallet={() => setIsWalletOpen(true)}
        />
      )}

      {/* Central Wallet Modal */}
      {isWalletOpen && (
        <WalletModal
          isOpen={isWalletOpen}
          onClose={() => setIsWalletOpen(false)}
        />
      )}

      {/* Access Wizard Modal for Kunda Requirements */}
      <AppAccessWizardModal
        isOpen={!!wizardTarget}
        targetAppKey={wizardTarget}
        onClose={() => setWizardTarget(null)}
        onSuccess={() => {
          setWizardTarget(null);
          setActionSuccess('Your Kunda Space profile is now registered! You can send crushes and private messages.');
          setTimeout(() => setActionSuccess(''), 5000);
        }}
      />
    </div>
  );
};
