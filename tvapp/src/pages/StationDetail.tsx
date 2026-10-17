import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  Play,
  Pause,
  Radio as RadioIcon,
  Heart,
  Share2,
  MapPin,
  Clock,
  ArrowLeft,
  Tv,
  Check,
} from 'lucide-react';
import { Station } from '../types';
import { getStationBySlug, getStations } from '../services/api';
import { usePlayer } from '../context/PlayerContext';
import { AudioWaveform } from '../components/player/AudioWaveform';
import { isStationFavorite, toggleFavorite } from '../utils/favorites';
import { StationCard } from '../components/radio/StationCard';
import { LiveTVPlayer } from '../components/player/LiveTVPlayer';
import { SEO } from '../components/common/SEO';

import { useAds } from '../context/AdContext';

export const StationDetailPage: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const [station, setStation] = useState<Station | null>(null);
  const [otherStations, setOtherStations] = useState<Station[]>([]);
  const [loading, setLoading] = useState(true);
  const [isFav, setIsFav] = useState(false);
  const [copied, setCopied] = useState(false);

  const { currentStation, isPlaying, playStation, pauseStation } = usePlayer();
  const { triggerRadioAdIfNeeded } = useAds();

  useEffect(() => {
    const fetchStation = async () => {
      if (!slug) return;
      setLoading(true);
      try {
        const data = await getStationBySlug(slug);
        setStation(data);
        setIsFav(isStationFavorite(data.id));

        // Fetch other stations for recommendation
        const all = await getStations({ type: data.station_type });
        setOtherStations(all.filter((s) => s.id !== data.id).slice(0, 4));
      } catch (err) {
        console.error('Failed to load station:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchStation();
  }, [slug]);

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="animate-spin rounded-full h-10 w-10 border-4 border-rba-blue border-t-transparent" />
      </div>
    );
  }

  if (!station) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center p-6 text-center">
        <RadioIcon className="w-16 h-16 text-slate-300 mb-4" />
        <h2 className="text-2xl font-black text-slate-900 mb-2">Station Not Found</h2>
        <p className="text-slate-500 text-sm mb-6">The requested broadcasting station could not be located.</p>
        <Link to="/radio" className="px-5 py-2.5 rounded-xl bg-rba-navy text-white font-bold text-sm">
          Return to Radio Guide
        </Link>
      </div>
    );
  }

  const isCurrentActive = currentStation?.id === station.id;
  const isCurrentlyPlaying = isCurrentActive && isPlaying;

  const handlePlayToggle = () => {
    if (isCurrentlyPlaying) {
      pauseStation();
    } else {
      triggerRadioAdIfNeeded(station, () => {
        playStation(station);
      });
    }
  };

  const handleToggleFav = () => {
    const next = toggleFavorite(station.id);
    setIsFav(next);
  };

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div className="min-h-screen bg-rba-grayBg pb-20">
      <SEO
        title={`${station.name} Live Stream`}
        description={station.description || `Listen to ${station.name} broadcast live online.`}
      />

      {/* Breadcrumb Header */}
      <div className="bg-rba-navy text-white py-6 px-4 sm:px-6">
        <div className="max-w-7xl mx-auto">
          <Link
            to={station.station_type === 'TV' ? '/tv' : '/radio'}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-300 hover:text-white transition-colors mb-4"
          >
            <ArrowLeft className="w-4 h-4" /> Back to {station.station_type === 'TV' ? 'TV' : 'Radio'}
          </Link>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 -mt-6">
        {/* Main Station Profile Card */}
        <div className="bg-white rounded-3xl border border-slate-200 shadow-lg overflow-hidden mb-12">
          
          {station.station_type === 'TV' ? (
            /* If TV Station, render live player directly */
            <div className="p-4 sm:p-6 bg-slate-950">
              <LiveTVPlayer station={station} autoPlay={true} />
            </div>
          ) : (
            /* Radio Station Hero Banner */
            <div
              className="p-6 sm:p-10 flex flex-col md:flex-row items-center justify-between gap-8 border-b border-slate-100"
              style={{ backgroundColor: station.accent_color ? `${station.accent_color}14` : '#f8fafc' }}
            >
              <div className="flex flex-col sm:flex-row items-center gap-6 text-center sm:text-left">
                <div
                  className="w-28 h-28 sm:w-36 sm:h-36 rounded-3xl bg-white shadow-xl p-4 flex items-center justify-center border border-slate-200/80 shrink-0"
                  style={{ borderColor: station.accent_color || '#e2e8f0' }}
                >
                  <img
                    src={station.logo_url || '/logo.png'}
                    alt={station.name}
                    className="max-h-full max-w-full object-contain"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-center sm:justify-start gap-2 mb-2">
                    <span className="px-2.5 py-0.5 rounded text-xs font-black uppercase tracking-wider bg-red-600 text-white flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" /> Live
                    </span>
                    {station.frequency && (
                      <span className="px-2.5 py-0.5 rounded text-xs font-bold bg-white text-rba-blue border border-slate-200">
                        {station.frequency}
                      </span>
                    )}
                  </div>

                  <h1 className="text-2xl sm:text-4xl font-black text-slate-900 mb-2">
                    {station.name}
                  </h1>

                  {station.location && (
                    <div className="flex items-center justify-center sm:justify-start gap-1.5 text-xs text-slate-500">
                      <MapPin className="w-4 h-4 text-rba-blue" />
                      <span>{station.location}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center justify-center gap-3">
                <button
                  onClick={handlePlayToggle}
                  className={`px-8 py-4 rounded-2xl font-black text-sm flex items-center gap-3 shadow-xl transition-all hover:scale-105 active:scale-95 ${
                    isCurrentlyPlaying
                      ? 'bg-amber-500 text-white hover:bg-amber-600'
                      : 'bg-rba-blue text-white hover:bg-rba-blueHover'
                  }`}
                >
                  {isCurrentlyPlaying ? (
                    <>
                      <Pause className="w-5 h-5 fill-current" />
                      <span>Pause Audio</span>
                    </>
                  ) : (
                    <>
                      <Play className="w-5 h-5 fill-current" />
                      <span>Listen Live Now</span>
                    </>
                  )}
                </button>

                <button
                  onClick={handleToggleFav}
                  className={`p-4 rounded-2xl border transition-colors shadow-sm ${
                    isFav
                      ? 'bg-red-50 border-red-200 text-red-500'
                      : 'bg-white border-slate-200 text-slate-600 hover:text-red-500'
                  }`}
                  aria-label="Toggle favorite"
                >
                  <Heart className={`w-5 h-5 ${isFav ? 'fill-current' : ''}`} />
                </button>

                <button
                  onClick={handleShare}
                  className="p-4 rounded-2xl bg-white border border-slate-200 text-slate-600 hover:text-rba-blue hover:border-rba-blue transition-colors shadow-sm flex items-center gap-1.5 text-xs font-bold"
                  title="Share station"
                >
                  {copied ? <Check className="w-5 h-5 text-emerald-600" /> : <Share2 className="w-5 h-5" />}
                </button>
              </div>
            </div>
          )}

          {/* Details & Description Section */}
          <div className="p-6 sm:p-10 space-y-6">
            <div>
              <h3 className="text-lg font-extrabold text-slate-900 mb-2">About {station.name}</h3>
              <p className="text-slate-600 text-sm sm:text-base leading-relaxed max-w-4xl">
                {station.description || 'Official broadcasting channel on Benix Space TV.'}
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4 border-t border-slate-100">
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80">
                <span className="text-xs font-semibold text-slate-500 block mb-1">Broadcaster</span>
                <span className="text-sm font-bold text-slate-900">Benix Space TV</span>
              </div>
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80">
                <span className="text-xs font-semibold text-slate-500 block mb-1">Coverage Area</span>
                <span className="text-sm font-bold text-slate-900">{station.location || 'National'}</span>
              </div>
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80">
                <span className="text-xs font-semibold text-slate-500 block mb-1">Broadcast Type</span>
                <span className="text-sm font-bold text-slate-900">
                  {station.station_type === 'TV' ? 'Digital Terrestrial & Web HLS' : `${station.frequency} Stereo & Web Audio`}
                </span>
              </div>
            </div>
          </div>

        </div>

        {/* Other Stations Recommendations */}
        {otherStations.length > 0 && (
          <section>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-extrabold text-slate-900">More Stations</h2>
              <Link to="/radio" className="text-xs font-bold text-rba-blue hover:underline">
                View All Stations
              </Link>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {otherStations.map((st) => (
                <StationCard key={st.id} station={st} />
              ))}
            </div>
          </section>
        )}

      </div>
    </div>
  );
};
