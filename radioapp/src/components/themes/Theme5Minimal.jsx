import React from 'react';
import { Link } from 'react-router-dom';
import { RadioPlayer } from '../player/RadioPlayer';
import { ArrowRight, Clock, Radio, Newspaper } from 'lucide-react';

export function Theme5Minimal({ station, branding, streams, programs, nowOnAir, comingNext, news, videos, sections, settings }) {
  const basePath = `/station/${station?.slug}`;

  return (
    <div className="space-y-24 pb-24 bg-white text-slate-900 font-light">
      
      {/* 1. MINIMAL HERO SECTION */}
      {sections?.player_enabled && (
        <section className="pt-8 sm:pt-16 px-4 sm:px-8 max-w-5xl mx-auto text-center space-y-6">
          <div className="space-y-3">
            <span className="text-[11px] tracking-[0.25em] uppercase font-semibold text-slate-400">
              Live Broadcast Experience
            </span>
            <h1 className="text-3xl sm:text-5xl font-normal tracking-tight text-slate-900 break-words">
              {station?.name}
            </h1>
            <p className="text-xs sm:text-base text-slate-500 max-w-xl mx-auto leading-relaxed">
              {station?.slogan || station?.description}
            </p>
          </div>

          <div className="pt-2 max-w-xl mx-auto">
            <RadioPlayer variant="minimal" />
          </div>
        </section>
      )}

      {/* 2. ON AIR REFINED STRIP */}
      {sections?.on_air_enabled && nowOnAir && (
        <section className="max-w-4xl mx-auto px-6">
          <div className="py-6 border-y border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-left">
            <div className="flex items-center gap-3">
              <span className="w-2 h-2 rounded-full bg-slate-900"></span>
              <span className="text-xs tracking-wider uppercase text-slate-400 font-medium">Currently On Air</span>
            </div>
            <div className="text-sm font-medium text-slate-900">
              <span>{nowOnAir.title}</span>
              <span className="text-slate-400 mx-2">—</span>
              <span className="text-slate-500">{nowOnAir.presenter}</span>
            </div>
            <div className="text-xs text-slate-400 font-mono">
              {nowOnAir.start_time} - {nowOnAir.end_time}
            </div>
          </div>
        </section>
      )}

      {/* 3. SHOWS SCHEDULE — MINIMAL LIST */}
      {sections?.programs_enabled && programs && programs.length > 0 && (
        <section className="max-w-5xl mx-auto px-6 sm:px-12">
          <div className="flex items-baseline justify-between mb-8 pb-4 border-b border-slate-100">
            <h2 className="text-2xl font-normal text-slate-900">Schedule</h2>
            <Link to={`${basePath}/schedule`} className="text-xs text-slate-500 hover:text-slate-900 tracking-wider uppercase">
              Full Timetable →
            </Link>
          </div>

          <div className="divide-y divide-slate-100">
            {programs.slice(0, 4).map((prog) => (
              <div key={prog.id} className="py-5 flex flex-col sm:flex-row sm:items-center justify-between gap-2 hover:bg-slate-50/50 px-2 transition-colors">
                <div className="sm:w-48 text-xs font-mono text-slate-400">
                  {prog.start_time} - {prog.end_time}
                </div>
                <div className="flex-1">
                  <h3 className="text-base font-normal text-slate-900">{prog.title}</h3>
                  <p className="text-xs text-slate-400 mt-0.5">{prog.presenter}</p>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* 4. NEWS EDITORIAL — MINIMAL TILES */}
      {sections?.news_enabled && news && news.length > 0 && (
        <section className="max-w-5xl mx-auto px-6 sm:px-12">
          <div className="flex items-baseline justify-between mb-8 pb-4 border-b border-slate-100">
            <h2 className="text-2xl font-normal text-slate-900">Stories</h2>
            <Link to={`${basePath}/news`} className="text-xs text-slate-500 hover:text-slate-900 tracking-wider uppercase">
              Archive →
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {news.slice(0, 3).map((item) => (
              <article key={item.id} className="space-y-3">
                <Link to={`${basePath}/news/${item.slug}`} className="block aspect-[16/10] overflow-hidden bg-slate-50 rounded-xl">
                  {item.image_url ? (
                    <img src={item.image_url} alt={item.title} className="w-full h-full object-cover grayscale hover:grayscale-0 transition-all duration-500" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-slate-300">
                      <Newspaper className="w-8 h-8" />
                    </div>
                  )}
                </Link>
                <div className="text-[11px] text-slate-400">
                  {new Date(item.published_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                </div>
                <Link to={`${basePath}/news/${item.slug}`}>
                  <h3 className="text-base font-medium text-slate-900 hover:text-slate-600 transition-colors line-clamp-2">
                    {item.title}
                  </h3>
                </Link>
              </article>
            ))}
          </div>
        </section>
      )}

    </div>
  );
}
