import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { Button } from '../../components/ui/Button';
import { Heart, MessageCircle, MapPin, Sparkles, CheckCircle2 } from 'lucide-react';
import { api } from '../../lib/api';

export const Matches: React.FC = () => {
  const { token } = useAuth();
  const { t } = useLanguage();
  const [matches, setMatches] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const fetchMatches = async () => {
      if (!token) return;
      try {
        const res = await api.get('/members/matches');
        const data = res.data;
        if (data.success && data.matches) {
          setMatches(data.matches);
        }
      } catch (err) {
        console.error('Fetch matches error:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchMatches();
  }, [token]);

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-6">
      <div>
        <h1 className="text-2xl font-black text-slate-900">{t('nav.matches')}</h1>
        <p className="text-xs text-slate-500">People who liked you back and are ready to talk</p>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 animate-pulse">
          <div className="h-64 bg-slate-100 rounded-3xl" />
          <div className="h-64 bg-slate-100 rounded-3xl" />
          <div className="h-64 bg-slate-100 rounded-3xl" />
        </div>
      ) : matches.length === 0 ? (
        <div className="bg-white rounded-3xl border border-slate-100 shadow-card p-12 text-center space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-rose-50 text-rose-500 flex items-center justify-center mx-auto">
            <Heart className="w-8 h-8" />
          </div>
          <h3 className="text-xl font-bold text-slate-900">No mutual matches yet</h3>
          <p className="text-sm text-slate-500 max-w-sm mx-auto">
            Like more people in the Discover section to unlock your first mutual connection.
          </p>
          <Link to="/dashboard/discover">
            <Button>Go to Discover</Button>
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
          {matches.map((m) => (
            <div
              key={m.matchId}
              className="bg-white rounded-3xl border border-slate-100 shadow-card overflow-hidden flex flex-col justify-between"
            >
              <div className="relative h-56 w-full">
                <img
                  src={m.photos?.[0] || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=600&q=80'}
                  alt={m.displayName}
                  className="w-full h-full object-cover"
                />
                <div className="absolute top-3 right-3 bg-white/90 backdrop-blur-md px-2.5 py-1 rounded-full text-[11px] font-black text-rose-600 shadow-sm flex items-center gap-1">
                  <Sparkles className="w-3 h-3 text-rose-500" />
                  {m.compatibilityScore}%
                </div>
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
                <div className="absolute bottom-3 left-3 text-white">
                  <h3 className="font-extrabold text-lg">{m.displayName}</h3>
                  <p className="text-xs text-slate-200 flex items-center gap-1">
                    <MapPin className="w-3 h-3 text-rose-400" /> {m.city}, {m.country}
                  </p>
                </div>
              </div>

              <div className="p-4 space-y-3">
                <p className="text-xs text-slate-500">
                  Seeking:{' '}
                  <span className="font-semibold text-slate-700 capitalize">
                    {m.relationshipIntention?.replace(/_/g, ' ')}
                  </span>
                </p>

                {m.matchReasons && m.matchReasons.length > 0 && (
                  <div className="text-[11px] bg-rose-50/60 p-2.5 rounded-xl border border-rose-100 space-y-1">
                    <span className="font-bold text-rose-950 block">Why you matched:</span>
                    {m.matchReasons.slice(0, 2).map((r: string, idx: number) => (
                      <div key={idx} className="flex items-center gap-1.5 text-rose-900">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                        <span className="truncate">{r}</span>
                      </div>
                    ))}
                  </div>
                )}

                <Link to={`/dashboard/messages?user=${m.partnerId}`} className="block">
                  <Button variant="primary" size="sm" className="w-full">
                    <MessageCircle className="w-3.5 h-3.5 mr-1.5" />
                    Send Message
                  </Button>
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
