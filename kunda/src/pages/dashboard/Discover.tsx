import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Modal } from '../../components/ui/Modal';
import {
  Heart,
  X,
  Star,
  Info,
  MapPin,
  Sparkles,
  MessageCircle,
  CheckCircle2,
  SlidersHorizontal,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { api } from '../../lib/api';

export const Discover: React.FC = () => {
  const { token } = useAuth();
  const { t } = useLanguage();

  const [profiles, setProfiles] = useState<any[]>([]);
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(true);
  const [breakdownModalOpen, setBreakdownModalOpen] = useState<boolean>(false);
  const [matchModalOpen, setMatchModalOpen] = useState<boolean>(false);
  const [matchedProfile, setMatchedProfile] = useState<any>(null);

  // Filters
  const [filterCity, setFilterCity] = useState<string>('');

  const fetchProfiles = async () => {
    if (!token) return;
    try {
      setLoading(true);
      const url = filterCity ? `/members/discover?city=${encodeURIComponent(filterCity)}` : '/members/discover';
      const res = await api.get(url);
      const data = res.data;
      if (data.success && data.profiles) {
        setProfiles(data.profiles);
        setCurrentIndex(0);
      }
    } catch (err) {
      console.error('Discover fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfiles();
  }, [token, filterCity]);

  const handleInteract = async (action: 'like' | 'pass' | 'super_like') => {
    const candidate = profiles[currentIndex];
    if (!candidate || !token) return;

    try {
      const res = await api.post('/members/interaction', {
        targetUserId: candidate.userId,
        action,
      });
      const data = res.data;

      if (data.isMatch) {
        setMatchedProfile(candidate);
        setMatchModalOpen(true);
      }
    } catch (err) {
      console.error('Interaction error:', err);
    }

    // Move to next candidate card
    setCurrentIndex((prev) => prev + 1);
  };

  const currentProfile = profiles[currentIndex];

  return (
    <div className="max-w-2xl mx-auto px-4 py-8 space-y-6">
      {/* Header and City Filter */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-slate-900">{t('dashboard.discoverTitle')}</h1>
          <p className="text-xs text-slate-500">Verified singles matching your preferences</p>
        </div>

        <select
          value={filterCity}
          onChange={(e) => setFilterCity(e.target.value)}
          className="px-3 py-1.5 text-xs font-semibold rounded-xl border border-slate-200 bg-white text-slate-700 focus:outline-none focus:border-rose-500"
        >
          <option value="">All Locations</option>
          <option value="Kigali">Kigali</option>
          <option value="Rubavu">Rubavu</option>
          <option value="Musanze">Musanze</option>
          <option value="Huye">Huye</option>
        </select>
      </div>

      {loading ? (
        <div className="h-[480px] bg-slate-100 animate-pulse rounded-3xl" />
      ) : !currentProfile ? (
        <div className="bg-white rounded-3xl border border-slate-100 shadow-card p-12 text-center space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-rose-50 text-rose-500 flex items-center justify-center mx-auto">
            <Sparkles className="w-8 h-8" />
          </div>
          <h3 className="text-xl font-bold text-slate-900">You've explored all current recommendations!</h3>
          <p className="text-sm text-slate-500 max-w-sm mx-auto">
            Check back later as new members join, or try expanding your location filters.
          </p>
          <Button onClick={() => fetchProfiles()} variant="outline">
            Refresh Candidates
          </Button>
        </div>
      ) : (
        <div className="bg-white rounded-3xl border border-slate-100 shadow-card overflow-hidden relative">
          {/* Main Photo Card */}
          <div className="relative h-96 w-full">
            <img
              src={currentProfile.photos?.[0] || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=800&q=80'}
              alt={currentProfile.displayName}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-black/20" />

            {/* Compatibility Score Pill */}
            <div className="absolute top-4 left-4">
              <button
                onClick={() => setBreakdownModalOpen(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/90 backdrop-blur-md text-xs font-black text-rose-600 shadow-md hover:bg-white transition-all"
              >
                <Sparkles className="w-3.5 h-3.5 text-rose-500" />
                <span>{currentProfile.compatibilityScore}% Compatibility</span>
                <Info className="w-3.5 h-3.5 text-slate-400 ml-0.5" />
              </button>
            </div>

            {/* Basic Info Overlay */}
            <div className="absolute bottom-4 left-4 right-4 text-white space-y-1">
              <div className="flex items-center gap-2">
                <h2 className="text-2xl font-black">{currentProfile.displayName}</h2>
                {currentProfile.verifiedBadge && (
                  <Badge variant="emerald" size="sm" className="bg-emerald-500/20 text-emerald-300 border-none">
                    Verified
                  </Badge>
                )}
              </div>
              <div className="flex items-center gap-1 text-xs text-slate-200">
                <MapPin className="w-3.5 h-3.5 text-rose-400" />
                <span>
                  {currentProfile.city}, {currentProfile.country}
                </span>
              </div>
            </div>
          </div>

          {/* Bio and Details */}
          <div className="p-6 space-y-4">
            <p className="text-sm text-slate-700 leading-relaxed">{currentProfile.bio}</p>

            {/* Goals & Languages */}
            <div className="flex flex-wrap gap-2 text-xs">
              <span className="px-2.5 py-1 rounded-lg bg-rose-50 text-rose-700 font-semibold">
                Seeking: {currentProfile.relationshipIntention?.replace('_', ' ')}
              </span>
              {currentProfile.languages?.map((lang: string) => (
                <span key={lang} className="px-2.5 py-1 rounded-lg bg-slate-100 text-slate-700">
                  {lang}
                </span>
              ))}
            </div>

            {/* Shared Interests */}
            <div>
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5">
                Passions & Interests
              </span>
              <div className="flex flex-wrap gap-1.5">
                {currentProfile.interests?.map((interest: string) => (
                  <span
                    key={interest}
                    className={`text-xs px-2.5 py-0.5 rounded-full border ${
                      currentProfile.sharedInterests?.includes(interest)
                        ? 'border-rose-400 bg-rose-50 text-rose-700 font-semibold'
                        : 'border-slate-200 bg-white text-slate-600'
                    }`}
                  >
                    {interest}
                  </span>
                ))}
              </div>
            </div>

            {/* Action Buttons: Pass, Message, Like, Superlike */}
            <div className="pt-4 border-t border-slate-100 flex flex-wrap items-center justify-center gap-3 sm:gap-4">
              <button
                onClick={() => handleInteract('pass')}
                className="w-12 h-12 rounded-full border-2 border-slate-200 bg-white text-slate-400 hover:text-slate-600 hover:border-slate-300 flex items-center justify-center shadow-sm hover:scale-110 active:scale-95 transition-all"
                title="Pass"
              >
                <X className="w-6 h-6" />
              </button>

              <button
                onClick={() => handleInteract('super_like')}
                className="w-11 h-11 rounded-full border-2 border-violet-200 bg-violet-50 text-violet-600 hover:bg-violet-100 flex items-center justify-center shadow-sm hover:scale-110 active:scale-95 transition-all"
                title="Super Like"
              >
                <Star className="w-5 h-5 fill-violet-600" />
              </button>

              {/* Start Messaging Button */}
              <Link to={`/dashboard/messages?user=${currentProfile.userId}`}>
                <button
                  type="button"
                  className="px-5 py-3 rounded-2xl bg-gradient-to-r from-rose-500 via-rose-600 to-violet-600 hover:opacity-95 text-white font-bold text-xs sm:text-sm flex items-center gap-2 shadow-lg shadow-rose-200 hover:scale-105 active:scale-95 transition-all"
                  title={`Start chatting with ${currentProfile.displayName}`}
                >
                  <MessageCircle className="w-4 h-4 fill-white" />
                  <span>Start Messaging</span>
                </button>
              </Link>

              <button
                onClick={() => handleInteract('like')}
                className="w-13 h-13 sm:w-14 sm:h-14 rounded-full bg-gradient-to-tr from-rose-500 to-rose-600 text-white flex items-center justify-center shadow-lg shadow-rose-200 hover:scale-110 active:scale-95 transition-all p-3.5"
                title="Like"
              >
                <Heart className="w-7 h-7 fill-white" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Compatibility Breakdown Modal */}
      {currentProfile && (
        <Modal
          isOpen={breakdownModalOpen}
          onClose={() => setBreakdownModalOpen(false)}
          title={`Compatibility with ${currentProfile.displayName}`}
        >
          <div className="space-y-4">
            <div className="text-center py-2 bg-rose-50 rounded-2xl">
              <span className="text-3xl font-black text-rose-600">
                {currentProfile.compatibilityScore}%
              </span>
              <p className="text-xs text-rose-800 font-medium mt-0.5">Overall Mutual Match Alignment</p>
            </div>

            <div>
              <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                Why You Were Recommended:
              </h4>
              <ul className="space-y-2">
                {currentProfile.matchReasons?.map((reason: string, idx: number) => (
                  <li key={idx} className="flex items-start gap-2 text-xs text-slate-600">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                    <span>{reason}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="flex gap-2.5 pt-2">
              <Button variant="outline" onClick={() => setBreakdownModalOpen(false)} className="w-1/2">
                Close
              </Button>
              <Link to={`/dashboard/messages?user=${currentProfile.userId}`} className="w-1/2">
                <Button className="w-full">
                  <MessageCircle className="w-4 h-4 mr-1.5" /> Message {currentProfile.displayName}
                </Button>
              </Link>
            </div>
          </div>
        </Modal>
      )}

      {/* Mutual Match Modal */}
      {matchedProfile && (
        <Modal isOpen={matchModalOpen} onClose={() => setMatchModalOpen(false)} title="It's a Match! 🎉">
          <div className="text-center space-y-6 py-4">
            <div className="w-20 h-20 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mx-auto animate-bounce">
              <Heart className="w-10 h-10 fill-rose-600" />
            </div>
            <div>
              <h3 className="text-xl font-black text-slate-900">
                You and {matchedProfile.displayName} liked each other!
              </h3>
              <p className="text-xs text-slate-600 mt-1">
                You can now start a private conversation or view your mutual matches.
              </p>
            </div>
            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={() => setMatchModalOpen(false)}
                className="w-1/2"
              >
                Keep Exploring
              </Button>
              <Link to={`/dashboard/messages?user=${matchedProfile.userId}`} className="w-1/2">
                <Button className="w-full">
                  <MessageCircle className="w-4 h-4 mr-1.5" /> Chat Now
                </Button>
              </Link>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
