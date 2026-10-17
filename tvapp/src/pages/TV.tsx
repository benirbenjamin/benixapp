import React, { useEffect, useState } from 'react';
import { Tv, Filter, Search, Calendar, ChevronRight, Play } from 'lucide-react';
import { Station, Video, Category } from '../types';
import { getStations, getVideos, getCategories } from '../services/api';
import { LiveTVPlayer } from '../components/player/LiveTVPlayer';
import { VideoCard } from '../components/video/VideoCard';
import { SEO } from '../components/common/SEO';
import { AdSenseBanner } from '../components/ads/AdSenseBanner';
import { InContentAdBanner } from '../components/ads/InContentAdBanner';
import { ADS_CONFIG } from '../config/ads';
import { usePlayer } from '../context/PlayerContext';
import { TVChannelList } from '../components/tv/TVChannelList';
import { TVChannelSidebar } from '../components/tv/TVChannelSidebar';
import { TVLiveChat } from '../components/chat/TVLiveChat';

export const TVPage: React.FC = () => {
  const { setActiveTvStation, isTvPlaying } = usePlayer();
  const [tvStations, setTvStations] = useState<Station[]>([]);
  const [selectedStation, setSelectedStation] = useState<Station | null>(null);
  const [videos, setVideos] = useState<Video[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (selectedStation) {
      setActiveTvStation(selectedStation);
    }
  }, [selectedStation, setActiveTvStation]);

  useEffect(() => {
    const loadTVData = async () => {
      try {
        const [stationsData, categoriesData, videosData] = await Promise.all([
          getStations({ type: 'TV' }),
          getCategories(),
          getVideos({ limit: 24 }),
        ]);

        setTvStations(stationsData);
        if (stationsData.length > 0) {
          const rtv = stationsData.find((s) => s.slug === 'rtv') || stationsData[0];
          setSelectedStation(rtv);
          setActiveTvStation(rtv);
        }
        setCategories(categoriesData);
        setVideos(videosData.data || []);
      } catch (err) {
        console.error('Failed to load TV page data:', err);
      } finally {
        setLoading(false);
      }
    };

    loadTVData();
  }, [setActiveTvStation]);

  const filteredVideos = videos.filter((vid) => {
    const matchesSearch =
      vid.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (vid.description && vid.description.toLowerCase().includes(searchQuery.toLowerCase()));

    if (!matchesSearch) return false;

    if (selectedCategory !== 'all') {
      return vid.category_slug === selectedCategory || vid.category_id === selectedCategory;
    }

    return true;
  });

  return (
    <div className="min-h-screen bg-rba-grayBg pb-20">
      <SEO
        title="Live TV Broadcasts & Video Bulletins | Benix Space TV"
        description="Watch Benix Space TV live streaming, news bulletins, national reports, sports, and entertainment."
      />

      {/* Hero TV Player Area with TV Channel Selector in Sidebar */}
      <section className="bg-gradient-to-b from-rba-navy to-rba-navyLight text-white py-8 px-4 sm:px-6">
        <div className="max-w-7xl mx-auto">
          
          {/* Header (Clean, No Crowded Top Strip) */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-ping" />
                <span className="text-xs font-black uppercase tracking-wider text-red-400">
                  Benix Space TV Network
                </span>
              </div>
              <h1 className="text-2xl sm:text-4xl font-black text-white tracking-tight">
                {selectedStation?.name || 'Live TV Broadcast'}
              </h1>
            </div>
          </div>

          {/* Player & Sidebar Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* Main TV Player (Left) */}
            <div className="lg:col-span-8 xl:col-span-8 space-y-4">
              {selectedStation ? (
                <LiveTVPlayer station={selectedStation} autoPlay={false} />
              ) : (
                <div className="aspect-video bg-black/40 rounded-2xl flex items-center justify-center text-slate-400 text-sm">
                  Loading live broadcast...
                </div>
              )}

              {/* TV Companion Ad Banner: Only displayed if filled by Google AdSense */}
              <AdSenseBanner
                slot={ADS_CONFIG.SLOTS.TV_COMPANION_BANNER}
                format="horizontal"
                responsive={true}
                refreshInterval={ADS_CONFIG.TV_BANNER_REFRESH_SECONDS}
                label="Live TV Broadcast Sponsor"
              />

              {/* Live TV Discussion & Interactive Chat (Station-specific, Daily grouped, Threaded replies) */}
              {selectedStation && (
                <TVLiveChat station={selectedStation} />
              )}
            </div>

            {/* Sidebar: TV Channels List in the Sidebar */}
            <div className="lg:col-span-4 xl:col-span-4">
              <TVChannelSidebar
                stations={tvStations}
                selectedStation={selectedStation}
                onSelectStation={setSelectedStation}
                isPlaying={isTvPlaying}
              />
            </div>
          </div>

        </div>
      </section>

      {/* Main Content Area */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12 space-y-14">
        
        {/* Dedicated Benix Space TV Channels Showcase */}
        <TVChannelList
          stations={tvStations}
          selectedStation={selectedStation}
          onSelectStation={(st) => {
            setSelectedStation(st);
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
          isPlaying={isTvPlaying}
          layout="grid"
          title="Benix Space TV Channels"
          subtitle="Explore all available television channels on Benix Space TV"
        />

        {/* Minimal in-content scroll ad banner with zero-blank guarantee */}
        <InContentAdBanner sponsorIndex={2} label="Broadcast Sponsored Partner" />
        
        {/* Section Title & Filter Bar */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-black text-slate-900 tracking-tight">Latest Videos & News</h2>
            <p className="text-xs sm:text-sm text-slate-500">
              Catch up on full news bulletins, reports, and sports highlights
            </p>
          </div>

          {/* Search Box */}
          <div className="relative w-full md:w-72">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search video titles..."
              className="w-full pl-10 pr-4 py-2 text-xs sm:text-sm bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-rba-blue shadow-sm"
            />
          </div>
        </div>

        {/* Category Filter Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
          <button
            onClick={() => setSelectedCategory('all')}
            className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
              selectedCategory === 'all'
                ? 'bg-rba-navy text-white shadow-sm'
                : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
            }`}
          >
            All Videos
          </button>
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.slug)}
              className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                selectedCategory === cat.slug
                  ? 'bg-rba-navy text-white shadow-sm'
                  : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
              }`}
            >
              {cat.name}
            </button>
          ))}
        </div>

        {/* Videos Grid */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
              <div key={i} className="aspect-video rounded-2xl bg-white animate-pulse border border-slate-200" />
            ))}
          </div>
        ) : filteredVideos.length === 0 ? (
          <div className="bg-white rounded-3xl p-12 text-center border border-slate-200">
            <Tv className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <h3 className="font-extrabold text-slate-900 text-base">No videos found</h3>
            <p className="text-xs text-slate-500 mt-1">Try selecting another category or clear your search query.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredVideos.map((video) => (
              <VideoCard key={video.id} video={video} />
            ))}
          </div>
        )}

      </div>
    </div>
  );
};
