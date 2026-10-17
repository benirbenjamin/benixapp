import React from 'react';
import { Link } from 'react-router-dom';
import { RadioPlayer } from '../player/RadioPlayer';
import { Radio, Calendar, Newspaper, Video, ArrowRight, Clock, Award, ShieldCheck, MapPin, Phone, Mail } from 'lucide-react';

export function Theme2Classic({ station, branding, streams, programs, nowOnAir, comingNext, news, videos, sections, settings }) {
  const basePath = `/station/${station?.slug}`;

  return (
    <div className="space-y-12 pb-16">
      
      {/* 1. CLASSIC BROADCAST HERO BANNER */}
      {sections?.player_enabled && (
        <section className="bg-slate-900 text-white border-b-4" style={{ borderColor: branding?.primary_color || '#4F46E5' }}>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-10">
            <div className="flex flex-col lg:flex-row items-center justify-between gap-6 lg:gap-8">
              
              <div className="space-y-3 max-w-2xl text-center lg:text-left">
                <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded bg-white/10 text-[11px] font-mono font-bold tracking-widest uppercase text-amber-400">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>OFFICIAL BROADCAST FREQUENCY</span>
                </div>

                <h1 className="text-2xl sm:text-4xl font-serif font-bold tracking-normal text-white break-words">
                  {station?.name}
                </h1>

                <p className="text-xs sm:text-sm text-slate-300 font-normal leading-relaxed">
                  {station?.slogan || station?.description}
                </p>

                {sections?.on_air_enabled && nowOnAir && (
                  <div className="inline-flex items-center gap-2.5 px-3 py-1.5 rounded bg-slate-800/90 border border-slate-700 text-xs text-slate-300 max-w-md">
                    <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse flex-shrink-0"></span>
                    <span className="truncate">On Air: <strong className="text-white">{nowOnAir.title}</strong> with {nowOnAir.presenter}</span>
                  </div>
                )}
              </div>

              <div className="w-full lg:w-[420px] flex-shrink-0">
                <RadioPlayer variant="classic" />
              </div>

            </div>
          </div>
        </section>
      )}

      {/* 2. STRUCTURED BROADCAST SCHEDULE GRID */}
      {sections?.programs_enabled && programs && programs.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="border-b border-slate-300 pb-3 mb-6 flex items-center justify-between">
            <h2 className="text-xl sm:text-2xl font-serif font-bold text-slate-900 flex items-center gap-2">
              <Calendar className="w-5 h-5 text-[var(--primary-color)]" />
              <span>Broadcast Timetable & Programs</span>
            </h2>
            <Link to={`${basePath}/schedule`} className="text-xs font-bold text-[var(--primary-color)] uppercase tracking-wider hover:underline">
              View Schedule Guide →
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {programs.slice(0, 6).map((prog) => (
              <div
                key={prog.id}
                className="p-5 rounded-lg bg-white border border-slate-200 shadow-sm hover:border-slate-400 transition-colors flex gap-4"
              >
                <div className="w-16 h-16 rounded bg-slate-100 flex-shrink-0 overflow-hidden">
                  {prog.image_url ? (
                    <img src={prog.image_url} alt={prog.title} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-slate-400 font-serif font-bold">
                      FM
                    </div>
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5 text-[11px] font-mono text-indigo-700 font-bold">
                    <Clock className="w-3 h-3" />
                    <span>{prog.start_time} - {prog.end_time}</span>
                  </div>
                  <h3 className="font-bold text-slate-900 text-sm truncate mt-0.5">{prog.title}</h3>
                  <p className="text-xs text-slate-500 font-medium">Presenter: {prog.presenter}</p>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* 3. CLASSIC EDITORIAL NEWS LISTING */}
      {sections?.news_enabled && news && news.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="border-b border-slate-300 pb-3 mb-6 flex items-center justify-between">
            <h2 className="text-xl sm:text-2xl font-serif font-bold text-slate-900 flex items-center gap-2">
              <Newspaper className="w-5 h-5 text-[var(--primary-color)]" />
              <span>The Station Gazette & Bulletins</span>
            </h2>
            <Link to={`${basePath}/news`} className="text-xs font-bold text-[var(--primary-color)] uppercase tracking-wider hover:underline">
              All Bulletins →
            </Link>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {news.slice(0, 3).map((item) => (
              <div key={item.id} className="bg-white border border-slate-200 rounded-lg p-5 shadow-xs flex flex-col justify-between">
                <div>
                  {item.category_name && (
                    <span className="text-[10px] font-mono uppercase tracking-widest text-indigo-700 font-bold">
                      [{item.category_name}]
                    </span>
                  )}
                  <Link to={`${basePath}/news/${item.slug}`}>
                    <h3 className="font-serif font-bold text-base text-slate-900 hover:text-[var(--primary-color)] transition-colors mt-1 line-clamp-2">
                      {item.title}
                    </h3>
                  </Link>
                  <p className="text-xs text-slate-600 mt-2 line-clamp-3 leading-relaxed">
                    {item.excerpt}
                  </p>
                </div>
                <div className="pt-4 mt-4 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400 font-mono">
                  <span>{new Date(item.published_at).toLocaleDateString()}</span>
                  <Link to={`${basePath}/news/${item.slug}`} className="text-[var(--primary-color)] font-bold">
                    Read Story
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* 4. YOUTUBE BROADCAST VIDEOS */}
      {sections?.videos_enabled && videos && videos.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="border-b border-slate-300 pb-3 mb-6 flex items-center justify-between">
            <h2 className="text-xl sm:text-2xl font-serif font-bold text-slate-900 flex items-center gap-2">
              <Video className="w-5 h-5 text-[var(--primary-color)]" />
              <span>Studio Video Archives</span>
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {videos.slice(0, 2).map((vid) => (
              <div key={vid.id} className="bg-white border border-slate-200 rounded-lg overflow-hidden shadow-xs">
                <div className="aspect-video w-full">
                  <iframe
                    src={`https://www.youtube.com/embed/${vid.video_id}`}
                    title={vid.title}
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                    className="w-full h-full border-0"
                  ></iframe>
                </div>
                <div className="p-4">
                  <h3 className="font-serif font-bold text-sm text-slate-900">{vid.title}</h3>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

    </div>
  );
}
