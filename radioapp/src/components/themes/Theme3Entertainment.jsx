import React from 'react';
import { Link } from 'react-router-dom';
import { RadioPlayer } from '../player/RadioPlayer';
import { Flame, Disc, Radio, Calendar, Newspaper, ArrowRight, Zap, Music2, TrendingUp, Play } from 'lucide-react';

export function Theme3Entertainment({ station, branding, streams, programs, nowOnAir, comingNext, news, videos, sections, settings }) {
  const basePath = `/station/${station?.slug}`;

  return (
    <div className="space-y-16 pb-20 bg-black text-white selection:bg-pink-500">
      
      {/* 1. HIGH ENERGY ENTERTAINMENT HERO */}
      {sections?.player_enabled && (
        <section className="relative px-3 sm:px-6 lg:px-8 pt-4 sm:pt-8">
          <div className="max-w-7xl mx-auto">
            <div className="relative rounded-3xl sm:rounded-[2.5rem] overflow-hidden p-5 sm:p-8 lg:p-10 bg-gradient-to-tr from-purple-950 via-slate-950 to-pink-950 border border-pink-500/20 shadow-2xl">
              
              {/* Neon Glow Blobs */}
              <div className="absolute top-0 right-1/4 w-72 sm:w-96 h-72 sm:h-96 bg-pink-600/15 rounded-full blur-[100px] pointer-events-none"></div>
              <div className="absolute bottom-0 left-1/4 w-72 sm:w-96 h-72 sm:h-96 bg-purple-600/15 rounded-full blur-[100px] pointer-events-none"></div>

              <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-center">
                <div className="lg:col-span-7 space-y-4 sm:space-y-5">
                  
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-pink-500/20 border border-pink-500/30 text-[11px] font-black uppercase tracking-wider text-pink-400">
                    <Flame className="w-3.5 h-3.5 text-pink-500 animate-bounce" />
                    <span>{station?.slogan ? station.slogan.toUpperCase() : 'THE NON-STOP PARTY FREQUENCY'}</span>
                  </div>

                  <h1 className="text-2xl sm:text-4xl lg:text-5xl font-black uppercase tracking-tight text-white leading-tight break-words bg-clip-text text-transparent bg-gradient-to-r from-white via-pink-100 to-purple-300">
                    {station?.name}
                  </h1>

                  <p className="text-xs sm:text-sm text-slate-300 font-medium max-w-xl leading-relaxed">
                    {station?.description || station?.slogan || 'Live independent radio broadcasting hits, programs, and talk.'}
                  </p>

                  {sections?.on_air_enabled && nowOnAir && (
                    <div className="p-3 sm:p-3.5 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-md flex items-center gap-3.5 max-w-md">
                      <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-pink-500 to-purple-600 flex items-center justify-center text-white shadow-md flex-shrink-0">
                        <Disc className="w-5 h-5 animate-spin" />
                      </div>
                      <div className="min-w-0">
                        <span className="text-[9px] font-black uppercase tracking-widest text-pink-400 block">NOW ON AIR</span>
                        <h4 className="font-extrabold text-white text-sm leading-tight truncate">{nowOnAir.title}</h4>
                        <p className="text-[11px] text-slate-400 truncate">Host: <strong className="text-white">{nowOnAir.presenter}</strong></p>
                      </div>
                    </div>
                  )}

                </div>

                <div className="lg:col-span-5">
                  <RadioPlayer variant="entertainment" />
                </div>
              </div>

            </div>
          </div>
        </section>
      )}

      {/* 2. DYNAMIC FESTIVAL SHOWS LINEUP */}
      {sections?.programs_enabled && programs && programs.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-end justify-between mb-8">
            <div>
              <div className="flex items-center gap-2 text-pink-500 text-xs font-black uppercase tracking-wider mb-1">
                <TrendingUp className="w-4 h-4" />
                <span>Prime Time Sets</span>
              </div>
              <h2 className="text-3xl sm:text-4xl font-black uppercase tracking-tight text-white">Featured DJ Mixes & Shows</h2>
            </div>
            <Link to={`${basePath}/schedule`} className="text-xs font-black uppercase tracking-wider text-pink-400 hover:text-pink-300 flex items-center gap-1">
              <span>View Full Lineup</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {programs.slice(0, 3).map((prog) => (
              <div
                key={prog.id}
                className="group relative rounded-3xl overflow-hidden bg-slate-900 border border-slate-800 hover:border-pink-500/50 shadow-lg hover:shadow-pink-500/10 transition-all duration-300 transform hover:-translate-y-1.5"
              >
                <div className="aspect-[16/10] w-full overflow-hidden relative">
                  {prog.image_url ? (
                    <img src={prog.image_url} alt={prog.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                  ) : (
                    <div className="w-full h-full bg-slate-800 flex items-center justify-center text-pink-500">
                      <Music2 className="w-12 h-12" />
                    </div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-transparent"></div>
                  
                  <div className="absolute bottom-4 left-4 right-4">
                    <span className="px-2.5 py-1 rounded-md text-[10px] font-black uppercase bg-pink-500 text-white tracking-wider">
                      {prog.start_time} - {prog.end_time}
                    </span>
                    <h3 className="text-xl font-black text-white mt-2 leading-tight">{prog.title}</h3>
                    <p className="text-xs text-pink-300 font-bold mt-0.5">DJ / Host: {prog.presenter}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* 3. TRENDING ENTERTAINMENT NEWS */}
      {sections?.news_enabled && news && news.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-end justify-between mb-8">
            <div>
              <div className="flex items-center gap-2 text-purple-400 text-xs font-black uppercase tracking-wider mb-1">
                <Zap className="w-4 h-4" />
                <span>Buzz & Pop Culture</span>
              </div>
              <h2 className="text-3xl sm:text-4xl font-black uppercase tracking-tight text-white">Trending Stories</h2>
            </div>
            <Link to={`${basePath}/news`} className="text-xs font-black uppercase tracking-wider text-purple-400 hover:text-purple-300 flex items-center gap-1">
              <span>All Stories</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {news.slice(0, 3).map((item) => (
              <article key={item.id} className="rounded-3xl overflow-hidden bg-slate-900/90 border border-slate-800 hover:border-purple-500/50 transition-colors flex flex-col justify-between">
                <Link to={`${basePath}/news/${item.slug}`} className="aspect-[16/10] overflow-hidden relative block">
                  {item.image_url ? (
                    <img src={item.image_url} alt={item.title} className="w-full h-full object-cover hover:scale-105 transition-transform duration-500" />
                  ) : (
                    <div className="w-full h-full bg-slate-800 flex items-center justify-center text-purple-400">
                      <Newspaper className="w-10 h-10" />
                    </div>
                  )}
                  {item.category_name && (
                    <span className="absolute top-3 left-3 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-purple-600 text-white">
                      {item.category_name}
                    </span>
                  )}
                </Link>

                <div className="p-6 space-y-3">
                  <Link to={`${basePath}/news/${item.slug}`}>
                    <h3 className="text-lg font-black text-white hover:text-pink-400 transition-colors line-clamp-2">
                      {item.title}
                    </h3>
                  </Link>
                  <p className="text-xs text-slate-400 line-clamp-3 leading-relaxed">
                    {item.excerpt}
                  </p>
                  <div className="pt-2">
                    <Link to={`${basePath}/news/${item.slug}`} className="text-xs font-black uppercase tracking-wider text-pink-400 flex items-center gap-1">
                      <span>Read Full Scoop</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </section>
      )}

      {/* 4. YOUTUBE MUSIC SESSIONS */}
      {sections?.videos_enabled && videos && videos.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl sm:text-4xl font-black uppercase tracking-tight text-white mb-8">Video Drops</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {videos.slice(0, 2).map((vid) => (
              <div key={vid.id} className="rounded-3xl overflow-hidden bg-slate-900 border border-slate-800">
                <div className="aspect-video w-full">
                  <iframe
                    src={`https://www.youtube.com/embed/${vid.video_id}`}
                    title={vid.title}
                    allowFullScreen
                    className="w-full h-full border-0"
                  ></iframe>
                </div>
                <div className="p-4">
                  <h3 className="font-black text-sm text-white">{vid.title}</h3>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

    </div>
  );
}
