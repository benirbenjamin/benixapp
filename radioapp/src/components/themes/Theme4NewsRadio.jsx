import React from 'react';
import { Link } from 'react-router-dom';
import { RadioPlayer } from '../player/RadioPlayer';
import { Radio, Newspaper, Calendar, Clock, AlertTriangle, ArrowRight, Eye, Mic2 } from 'lucide-react';

export function Theme4NewsRadio({ station, branding, streams, programs, nowOnAir, comingNext, news, videos, sections, settings }) {
  const basePath = `/station/${station?.slug}`;
  const leadArticle = news && news.length > 0 ? news[0] : null;
  const secondaryArticles = news && news.length > 1 ? news.slice(1, 5) : [];

  return (
    <div className="space-y-10 pb-16 bg-[#fbfbfb] text-slate-900">
      
      {/* 1. BREAKING / LIVE NEWS TICKER */}
      <div className="bg-red-700 text-white py-2 px-4 shadow-sm">
        <div className="max-w-7xl mx-auto flex items-center gap-3 text-xs font-bold uppercase tracking-wider">
          <span className="px-2 py-0.5 rounded bg-black/30 font-black flex items-center gap-1.5 flex-shrink-0">
            <span className="w-2 h-2 rounded-full bg-white animate-ping"></span>
            LIVE BULLETIN
          </span>
          <span className="truncate">
            {leadArticle ? leadArticle.title : `${station?.name} 24/7 Primary News Network — Broadcasting live updates`}
          </span>
        </div>
      </div>

      {/* 2. NEWSROOM HEADER & COMPACT AUDIO BAR */}
      {sections?.player_enabled && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-2">
          <div className="bg-white border-y-2 border-slate-900 py-4 sm:py-6 px-3 sm:px-8 shadow-xs">
            <div className="flex flex-col lg:flex-row items-center justify-between gap-6">
              
              <div className="space-y-1 text-center lg:text-left">
                <div className="flex items-center justify-center lg:justify-start gap-2 text-[11px] font-bold text-red-700 uppercase tracking-widest">
                  <Mic2 className="w-3.5 h-3.5" />
                  <span>NATIONAL & INTERNATIONAL BROADCAST DESK</span>
                </div>
                <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight text-slate-950 break-words">
                  {station?.name}
                </h1>
                <p className="text-xs text-slate-500 max-w-lg">
                  {station?.slogan || 'Independent journalism, unbiased analysis, and verified reporting.'}
                </p>
              </div>

              <div className="w-full lg:w-[420px] flex-shrink-0">
                <RadioPlayer variant="news" />
              </div>

            </div>
          </div>
        </section>
      )}

      {/* 3. EDITORIAL LEAD STORY & HEADLINES GRID */}
      {sections?.news_enabled && news && news.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="border-b-2 border-slate-900 pb-2 mb-6 flex items-center justify-between">
            <h2 className="text-lg font-black uppercase tracking-tight text-slate-900">
              Top Headlines & Special Reports
            </h2>
            <Link to={`${basePath}/news`} className="text-xs font-bold text-red-700 uppercase hover:underline">
              News Archive →
            </Link>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            
            {/* Lead Story (Left 7 Cols) */}
            {leadArticle && (
              <div className="lg:col-span-7 bg-white border border-slate-200 p-6 shadow-xs flex flex-col justify-between">
                <div>
                  <Link to={`${basePath}/news/${leadArticle.slug}`} className="aspect-[16/9] overflow-hidden bg-slate-100 block mb-4 relative">
                    {leadArticle.image_url ? (
                      <img src={leadArticle.image_url} alt={leadArticle.title} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-slate-200 text-slate-400">
                        <Newspaper className="w-16 h-16" />
                      </div>
                    )}
                    {leadArticle.category_name && (
                      <span className="absolute top-2 left-2 px-2.5 py-0.5 rounded text-[11px] font-black uppercase tracking-wider bg-red-700 text-white">
                        {leadArticle.category_name}
                      </span>
                    )}
                  </Link>

                  <div className="space-y-2">
                    <span className="text-[11px] font-mono text-slate-500 uppercase">
                      Published {new Date(leadArticle.published_at).toLocaleDateString()}
                    </span>
                    <Link to={`${basePath}/news/${leadArticle.slug}`}>
                      <h3 className="text-2xl sm:text-3xl font-serif font-black text-slate-950 hover:text-red-700 transition-colors leading-snug">
                        {leadArticle.title}
                      </h3>
                    </Link>
                    <p className="text-sm text-slate-700 leading-relaxed pt-1">
                      {leadArticle.excerpt}
                    </p>
                  </div>
                </div>

                <div className="pt-4 mt-4 border-t border-slate-100 flex items-center justify-between text-xs">
                  <span className="text-slate-500 font-medium flex items-center gap-1">
                    <Eye className="w-3.5 h-3.5" />
                    <span>{leadArticle.views_count || 0} reads</span>
                  </span>
                  <Link to={`${basePath}/news/${leadArticle.slug}`} className="font-bold text-red-700 flex items-center gap-1 hover:underline">
                    <span>Full Coverage</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            )}

            {/* Secondary Stories List (Right 5 Cols) */}
            <div className="lg:col-span-5 space-y-4">
              {secondaryArticles.map((art) => (
                <div key={art.id} className="bg-white border border-slate-200 p-4 shadow-xs flex gap-4 items-start">
                  <div className="w-24 h-20 bg-slate-100 flex-shrink-0 overflow-hidden">
                    {art.image_url ? (
                      <img src={art.image_url} alt={art.title} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-slate-300">
                        <Newspaper className="w-6 h-6" />
                      </div>
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    {art.category_name && (
                      <span className="text-[10px] font-mono uppercase font-bold text-red-700">
                        {art.category_name}
                      </span>
                    )}
                    <Link to={`${basePath}/news/${art.slug}`}>
                      <h4 className="font-bold text-sm text-slate-900 hover:text-red-700 transition-colors line-clamp-2 leading-snug">
                        {art.title}
                      </h4>
                    </Link>
                    <span className="text-[10px] text-slate-400 font-mono mt-1 block">
                      {new Date(art.published_at).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              ))}
            </div>

          </div>
        </section>
      )}

      {/* 4. CURRENT AFFAIRS & TALK SHOW SCHEDULE */}
      {sections?.programs_enabled && programs && programs.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="border-b-2 border-slate-900 pb-2 mb-6 flex items-center justify-between">
            <h2 className="text-lg font-black uppercase tracking-tight text-slate-900 flex items-center gap-2">
              <Calendar className="w-4 h-4 text-red-700" />
              <span>Current Affairs & Debate Lineup</span>
            </h2>
            <Link to={`${basePath}/schedule`} className="text-xs font-bold text-red-700 uppercase hover:underline">
              Daily Schedule →
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {programs.slice(0, 3).map((prog) => (
              <div key={prog.id} className="bg-white border border-slate-200 p-5 shadow-xs">
                <div className="flex items-center gap-2 text-xs font-mono font-bold text-red-700">
                  <Clock className="w-3.5 h-3.5" />
                  <span>{prog.start_time} - {prog.end_time}</span>
                </div>
                <h3 className="font-bold text-base text-slate-950 mt-1">{prog.title}</h3>
                <p className="text-xs font-semibold text-slate-600 mt-0.5">Analyst / Host: {prog.presenter}</p>
                <p className="text-xs text-slate-500 mt-2 line-clamp-2 leading-relaxed">{prog.description}</p>
              </div>
            ))}
          </div>
        </section>
      )}

    </div>
  );
}
