import React, { useEffect, useState } from 'react';
import { Play, Tv, Radio, Sparkles, ChevronRight, TrendingUp, Flame } from 'lucide-react';
import { Station, Video } from '../types';
import { getStations, getVideos } from '../services/api';
import { LiveTVPlayer } from '../components/player/LiveTVPlayer';
import { RadioSlider } from '../components/radio/RadioSlider';
import { StationCard } from '../components/radio/StationCard';
import { VideoCard } from '../components/video/VideoCard';
import { SEO } from '../components/common/SEO';
import { Link } from 'react-router-dom';
import { AdSenseBanner } from '../components/ads/AdSenseBanner';
import { InContentAdBanner } from '../components/ads/InContentAdBanner';
import { ADS_CONFIG } from '../config/ads';
import { usePlayer } from '../context/PlayerContext';
import { TVChannelList } from '../components/tv/TVChannelList';
import { TVChannelSidebar } from '../components/tv/TVChannelSidebar';
import { TVLiveChat } from '../components/chat/TVLiveChat';

export const Home: React.FC = () => {
  const { setActiveTvStation, isTvPlaying } = usePlayer();
  const [stations, setStations] = useState<Station[]>([]);
  const [videos, setVideos] = useState<Video[]>([]);
  const [selectedTvStation, setSelectedTvStation] = useState<Station | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (selectedTvStation) {
      setActiveTvStation(selectedTvStation);
    }
  }, [selectedTvStation, setActiveTvStation]);

  useEffect(() => {
    const loadHomeData = async () => {
      try {
        const [stationsData, videosData] = await Promise.all([
          getStations().catch((err) => {
            console.warn('Failed to load stations on home:', err);
            return [];
          }),
          getVideos({ limit: 8 }).catch((err) => {
            console.warn('Failed to load videos on home:', err);
            return { data: [] };
          }),
        ]);

        const validStations = Array.isArray(stationsData) ? stationsData : [];
        const validVideos = Array.isArray(videosData?.data) ? videosData.data : [];

        setStations(validStations);
        setVideos(validVideos);

        const tvStations = validStations.filter((s) => s && s.station_type === 'TV' && s.is_active);
        if (tvStations.length > 0) {
          // Default to RTV Live or first station
          const rtv = tvStations.find((s) => s.slug === 'rtv') || tvStations[0];
          setSelectedTvStation(rtv);
          setActiveTvStation(rtv);
        }
      } catch (err) {
        console.error('Failed to load home page data:', err);
        setStations([]);
        setVideos([]);
      } finally {
        setLoading(false);
      }

    };

    loadHomeData();
  }, [setActiveTvStation]);

  const validStationsList = Array.isArray(stations) ? stations : [];
  const validVideosList = Array.isArray(videos) ? videos : [];

  const tvStations = validStationsList.filter((s) => s && s.station_type === 'TV' && s.is_active);
  const radioStations = validStationsList.filter((s) => s && s.station_type === 'RADIO' && s.is_active);

  const latestVideos = validVideosList.slice(0, 4);
  const mostWatched = [...validVideosList].sort((a, b) => (b?.views_count || 0) - (a?.views_count || 0)).slice(0, 4);


  return (
    <div className="min-h-screen bg-rba-grayBg">
      <SEO title="Live TV & Radio Broadcast Streaming" />

      {/* Hero Section: Live TV Player with Dedicated Channel Selector Sidebar */}
      <section className="bg-gradient-to-b from-rba-navy to-rba-navyLight text-white pt-6 pb-12 px-4 sm:px-6">
        <div className="max-w-7xl mx-auto">
          
          {/* Channel Header (Clean & Uncluttered, No Top Strip) */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-5">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-ping" />
                <span className="text-xs font-black uppercase tracking-widest text-red-400">
                  Benix Space TV Network
                </span>
              </div>
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black text-white tracking-tight">
                {selectedTvStation?.name || 'Live TV Broadcast'}
              </h1>
            </div>
          </div>

          {/* Hero Player & Right Live Channels Sidebar */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            
            {/* Live TV Player Container (Left / Main) */}
            <div className="lg:col-span-8 xl:col-span-8 space-y-4">
              {selectedTvStation ? (
                <LiveTVPlayer station={selectedTvStation} autoPlay={false} />
              ) : (
                <div className="aspect-video bg-black/50 rounded-2xl flex items-center justify-center text-slate-400 text-sm">
                  Loading Live TV Stream...
                </div>
              )}

              {/* TV Companion Ad Banner: Appears ONLY when Google AdSense fills an ad */}
              <AdSenseBanner
                slot={ADS_CONFIG.SLOTS.TV_COMPANION_BANNER}
                format="horizontal"
                responsive={true}
                refreshInterval={ADS_CONFIG.TV_BANNER_REFRESH_SECONDS}
                label="Broadcast Sponsored Partner"
              />

              {/* Live TV Discussion & Interactive Chat (Station-specific, Daily grouped, Threaded replies) */}
              {selectedTvStation && (
                <TVLiveChat station={selectedTvStation} />
              )}
            </div>

            {/* Sidebar: TV Channels List in the Sidebar for clean, professional layout */}
            <div className="lg:col-span-4 xl:col-span-4 space-y-4">
              {/* Vertical Scrollable TV Channel Selector */}
              <TVChannelSidebar
                stations={tvStations}
                selectedStation={selectedTvStation}
                onSelectStation={setSelectedTvStation}
                isPlaying={isTvPlaying}
              />

              {/* Live Program Highlight */}
              <div className="bg-white/5 border border-white/10 rounded-3xl p-5 backdrop-blur-sm">
                <div className="flex items-center justify-between mb-2.5">
                  <span className="text-xs font-bold uppercase tracking-wider text-rba-yellow flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5" /> Now Streaming
                  </span>
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-red-600 text-white uppercase">
                    On Air
                  </span>
                </div>
                <h4 className="font-extrabold text-white text-sm mb-1">
                  {selectedTvStation?.name} Broadcast
                </h4>
                <p className="text-xs text-slate-300 leading-relaxed line-clamp-3">
                  {selectedTvStation?.description}
                </p>
              </div>
            </div>

          </div>

        </div>
      </section>

      {/* Main Container (TV Sections Come First, Radio Follows) */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12 space-y-14">
        
        {/* 1. Official Benix Space TV Channels Showcase Grid (FIRST) */}
        <section>
          <TVChannelList
            stations={tvStations}
            selectedStation={selectedTvStation}
            onSelectStation={(tv) => {
              setSelectedTvStation(tv);
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            isPlaying={isTvPlaying}
            layout="grid"
            title="Benix Space TV Channels"
            subtitle="Switch between live television streams on the Benix Space TV network"
          />
        </section>

        {/* 2. Latest Television Videos & Bulletins (SECOND) */}
        <section>
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-lg bg-rba-blue/10 text-rba-blue">
                <Tv className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">Latest Videos & News Bulletins</h2>
                <p className="text-xs text-slate-500">Official news reports, special coverage, and stories</p>
              </div>
            </div>

            <Link
              to="/tv"
              className="text-xs font-bold text-rba-blue hover:text-rba-navy flex items-center gap-1 transition-colors"
            >
              View All Videos <ChevronRight className="w-4 h-4" />
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {latestVideos.map((video) => (
              <VideoCard key={video.id} video={video} />
            ))}
          </div>
        </section>

        {/* 3. Most Watched & Trending Videos (THIRD) */}
        {mostWatched.length > 0 && (
          <section>
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-lg bg-red-50 text-red-600">
                  <Flame className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">Trending & Most Watched</h2>
                  <p className="text-xs text-slate-500">Popular broadcasts this week on Benix Space TV</p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
              {mostWatched.map((video) => (
                <VideoCard key={video.id} video={video} />
              ))}
            </div>
          </section>
        )}

        {/* Minimal In-Content Ad on Scroll (Zero blank space guarantee) */}
        <InContentAdBanner sponsorIndex={0} label="Official Broadcast Partner" />

        {/* 4. Live Radio Stations Carousel (FOURTH - Follows TV sections) */}
        <section className="pt-6 border-t border-slate-200">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-lg bg-amber-50 text-amber-600">
                <Radio className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">Live Radio Broadcasts</h2>
                <p className="text-xs text-slate-500">Listen to national and regional community radio stations</p>
              </div>
            </div>

            <Link
              to="/radio"
              className="text-xs font-bold text-rba-blue hover:text-rba-navy flex items-center gap-1 transition-colors"
            >
              Explore All Radio Stations <ChevronRight className="w-4 h-4" />
            </Link>
          </div>

          <RadioSlider stations={stations} />
        </section>

        {/* 5. All Radio Stations Grid */}
        <section>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {radioStations.map((station) => (
              <StationCard key={station.id} station={station} />
            ))}
          </div>
        </section>

        {/* Secondary In-Content Ad before footer */}
        <InContentAdBanner sponsorIndex={1} label="Streaming Partner" />

      </div>
    </div>
  );
};
