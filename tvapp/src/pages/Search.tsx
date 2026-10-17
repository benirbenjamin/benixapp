import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Search as SearchIcon, Radio, Tv, Video, Tag, Loader2 } from 'lucide-react';
import { Station, Video as VideoType, Category } from '../types';
import { globalSearch } from '../services/api';
import { StationCard } from '../components/radio/StationCard';
import { VideoCard } from '../components/video/VideoCard';
import { SEO } from '../components/common/SEO';

export const SearchPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const queryParam = searchParams.get('q') || '';
  const [query, setQuery] = useState(queryParam);
  const [results, setResults] = useState<{
    stations: Station[];
    videos: VideoType[];
    categories: Category[];
  }>({
    stations: [],
    videos: [],
    categories: [],
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const doSearch = async () => {
      if (!queryParam.trim()) {
        setResults({ stations: [], videos: [], categories: [] });
        return;
      }
      setLoading(true);
      try {
        const data = await globalSearch(queryParam.trim());
        setResults(data);
      } catch (err) {
        console.error('Search failure:', err);
      } finally {
        setLoading(false);
      }
    };

    setQuery(queryParam);
    doSearch();
  }, [queryParam]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      setSearchParams({ q: query.trim() });
    }
  };

  const totalResults = results.stations.length + results.videos.length + results.categories.length;

  return (
    <div className="min-h-screen bg-rba-grayBg pb-20">
      <SEO title={`Search results for "${queryParam}"`} />

      {/* Search Header Banner */}
      <div className="bg-rba-navy text-white py-12 px-4 sm:px-6">
        <div className="max-w-3xl mx-auto text-center">
          <h1 className="text-2xl sm:text-4xl font-black mb-4">Search Benix Space TV</h1>
          <form onSubmit={handleSubmit} className="relative">
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search radio stations, TV programs, news bulletins..."
              className="w-full pl-12 pr-28 py-3.5 rounded-2xl bg-white/10 border border-white/20 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-rba-blue focus:bg-white/15 text-sm sm:text-base shadow-lg"
            />
            <SearchIcon className="w-5 h-5 text-slate-400 absolute left-4 top-4" />
            <button
              type="submit"
              className="absolute right-2 top-2 px-5 py-2 rounded-xl bg-rba-blue hover:bg-rba-blueHover text-white font-bold text-xs shadow-md transition-colors"
            >
              Search
            </button>
          </form>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10 space-y-12">
        {loading ? (
          <div className="py-20 flex flex-col items-center justify-center">
            <Loader2 className="w-10 h-10 text-rba-blue animate-spin mb-3" />
            <p className="text-sm font-semibold text-slate-600">Searching content...</p>
          </div>
        ) : queryParam && totalResults === 0 ? (
          <div className="bg-white rounded-3xl p-12 text-center border border-slate-200">
            <SearchIcon className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <h3 className="font-extrabold text-slate-900 text-lg">No matches found for "{queryParam}"</h3>
            <p className="text-xs sm:text-sm text-slate-500 mt-1 max-w-md mx-auto">
              Please check your spelling or try searching for keywords like "Radio Rwanda", "Amakuru", "KC2", or "Sports".
            </p>
          </div>
        ) : (
          <>
            {/* Matching Stations */}
            {results.stations.length > 0 && (
              <section className="space-y-4">
                <div className="flex items-center gap-2">
                  <Radio className="w-5 h-5 text-rba-blue" />
                  <h2 className="text-xl font-extrabold text-slate-900">
                    Radio & TV Stations ({results.stations.length})
                  </h2>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                  {results.stations.map((st) => (
                    <StationCard key={st.id} station={st} />
                  ))}
                </div>
              </section>
            )}

            {/* Matching Videos */}
            {results.videos.length > 0 && (
              <section className="space-y-4">
                <div className="flex items-center gap-2">
                  <Tv className="w-5 h-5 text-red-600" />
                  <h2 className="text-xl font-extrabold text-slate-900">
                    Videos & Bulletins ({results.videos.length})
                  </h2>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                  {results.videos.map((vid) => (
                    <VideoCard key={vid.id} video={vid} />
                  ))}
                </div>
              </section>
            )}
          </>
        )}
      </div>
    </div>
  );
};
