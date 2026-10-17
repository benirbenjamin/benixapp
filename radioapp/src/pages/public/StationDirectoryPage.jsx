import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Radio, Search, Sparkles, ArrowRight, Shield, Layers, Globe } from 'lucide-react';
import { api } from '../../api/client';
import { AdSenseUnit } from '../../components/ads/AdSenseUnit';

export function StationDirectoryPage() {
  const [stations, setStations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    async function loadStations() {
      try {
        const data = await api.get('/stations');
        setStations(data);
      } catch (err) {
        console.error('Failed to load stations directory:', err);
      } finally {
        setLoading(false);
      }
    }
    loadStations();
  }, []);

  const filtered = stations.filter(s =>
    s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (s.slogan && s.slogan.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="min-h-screen bg-slate-900 text-white font-sans selection:bg-indigo-500 selection:text-white">
      
      {/* Navigation */}
      <header className="border-b border-slate-800 bg-slate-950/70 backdrop-blur-md sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-600 flex items-center justify-center text-white shadow-lg shadow-indigo-600/30">
              <Radio className="w-6 h-6" />
            </div>
            <div>
              <h1 className="font-extrabold text-lg text-white leading-tight">Radio Station Network</h1>
              <p className="text-[11px] text-slate-400 font-medium">Multi-Station Broadcast Platform</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Link
              to="/request-station"
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-500 shadow-md shadow-indigo-600/20 transition-all transform active:scale-95"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>List Your Radio</span>
            </Link>

            <Link
              to="/admin/login"
              className="px-3.5 py-2 rounded-xl text-xs font-bold text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 border border-slate-700 transition-colors"
            >
              Admin Login
            </Link>
          </div>
        </div>
      </header>

      {/* Directory Hero */}
      <section className="relative px-4 sm:px-6 lg:px-8 py-14 sm:py-20 text-center max-w-4xl mx-auto space-y-6">
        <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-xs font-bold text-indigo-400 uppercase tracking-widest">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Live Radio Broadcasting Network</span>
        </div>

        <h2 className="text-3xl sm:text-5xl font-black tracking-tight text-white leading-tight">
          Explore Live Radio Broadcasters
        </h2>

        <p className="text-sm sm:text-base text-slate-400 max-w-2xl mx-auto leading-relaxed">
          Tune in to premier independent radio stations broadcasting high-definition audio, curated daily shows, journalism, and live events.
        </p>

        <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
          <Link
            to="/request-station"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-black text-white bg-indigo-600 hover:bg-indigo-500 shadow-lg shadow-indigo-600/25 transition-all transform active:scale-95"
          >
            <span>Submit Your Radio Station</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
          <a
            href="#stations-grid"
            className="px-4 py-2.5 rounded-xl text-xs font-bold text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 border border-slate-700 transition-colors"
          >
            Browse Stations
          </a>
        </div>

        {/* Search Bar */}
        <div id="stations-grid" className="max-w-md mx-auto relative pt-4">
          <Search className="w-5 h-5 absolute left-4 top-7 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search stations by name or genre..."
            className="w-full pl-12 pr-4 py-3.5 rounded-2xl bg-slate-800/80 border border-slate-700 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 text-sm text-white placeholder-slate-400 focus:outline-none"
          />
        </div>
      </section>

      {/* Directory Responsive Ad Slot (Zero blank space if unfilled) */}
      <div className="max-w-5xl mx-auto px-4">
        <AdSenseUnit
          slot="7034214536"
          client="ca-pub-4078466828008985"
          className="my-6"
        />
      </div>

      {/* Stations Cards Grid */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-24">
        {loading ? (
          <div className="text-center py-16 text-slate-500 font-medium">Loading broadcasting stations...</div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16 text-slate-500">No radio stations found matching your search.</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filtered.map((station) => (
              <div
                key={station.id}
                className="group relative rounded-3xl overflow-hidden bg-slate-950 border border-slate-800/80 hover:border-slate-700 p-6 flex flex-col justify-between shadow-xl transition-all duration-300 hover:-translate-y-1"
              >
                <div>
                  <div className="flex items-start justify-between gap-4 mb-4">
                    <div className="relative">
                      {station.logo_url ? (
                        <img src={station.logo_url} alt={station.name} className="w-16 h-16 rounded-2xl object-cover ring-2 ring-white/10" />
                      ) : (
                        <div
                          className="w-16 h-16 rounded-2xl flex items-center justify-center text-white font-black text-2xl"
                          style={{ backgroundColor: station.primary_color || '#4F46E5' }}
                        >
                          <Radio className="w-8 h-8" />
                        </div>
                      )}
                      {station.is_default && (
                        <span className="absolute -bottom-2 -right-2 px-2 py-0.5 rounded-full text-[9px] font-bold bg-amber-500 text-slate-950">
                          Primary
                        </span>
                      )}
                    </div>

                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                      <span>Live 24/7</span>
                    </span>
                  </div>

                  <h3 className="text-xl font-black text-white group-hover:text-indigo-400 transition-colors">
                    {station.name}
                  </h3>

                  {station.slogan && (
                    <p className="text-xs font-semibold text-indigo-300 mt-1 line-clamp-1">
                      {station.slogan}
                    </p>
                  )}

                  <p className="text-xs text-slate-400 mt-3 line-clamp-3 leading-relaxed">
                    {station.description || 'Live independent radio broadcasting hits, programs, and talk.'}
                  </p>
                </div>

                <div className="pt-6 mt-6 border-t border-slate-800/80 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                    <span className="text-xs font-semibold text-slate-400">Broadcasting Live</span>
                  </div>

                  <Link
                    to={`/station/${station.slug}`}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-white shadow-md transition-transform active:scale-95"
                    style={{ backgroundColor: station.primary_color || '#4F46E5' }}
                  >
                    <span>Listen Live</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Broadcaster Join Banner */}
      <section className="border-t border-slate-800 bg-slate-950 py-16 px-4 sm:px-6 lg:px-8 text-center">
        <div className="max-w-3xl mx-auto space-y-4">
          <div className="w-12 h-12 rounded-2xl bg-indigo-600/20 text-indigo-400 flex items-center justify-center mx-auto border border-indigo-500/30">
            <Radio className="w-6 h-6" />
          </div>
          <h3 className="text-2xl sm:text-3xl font-black text-white">
            Do You Manage a Radio Station?
          </h3>
          <p className="text-sm text-slate-400 leading-relaxed max-w-xl mx-auto">
            Get your radio listed on our global directory. Enjoy automatic player routing, custom themes, show scheduling, and dedicated news publishing.
          </p>
          <div className="pt-2">
            <Link
              to="/request-station"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl text-xs font-black text-white bg-indigo-600 hover:bg-indigo-500 shadow-xl shadow-indigo-600/30 transition-all transform active:scale-95"
            >
              <span>Apply for Station Listing</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>

    </div>
  );
}
