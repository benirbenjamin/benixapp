import React from 'react';
import { Link } from 'react-router-dom';
import { RadioPlayer } from '../player/RadioPlayer';
import { Play, Calendar, Newspaper, Video, ArrowRight, Music, Clock, Sparkles, MapPin, Phone, Mail } from 'lucide-react';

export function Theme1Modern({ station, branding, streams, programs, nowOnAir, comingNext, news, videos, sections, settings }) {
  const basePath = `/station/${station?.slug}`;

  return (
    <div className="space-y-16 pb-16">
      
      {/* 1. HERO / LIVE RADIO SECTION */}
      {sections?.player_enabled && (
        <section className="relative pt-4 sm:pt-8 px-3 sm:px-6 lg:px-8">
          <div className="max-w-7xl mx-auto">
            <div className="relative rounded-3xl overflow-hidden p-5 sm:p-8 lg:p-10 bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 text-white shadow-2xl">
              
              {/* Decorative background glow */}
              <div className="absolute -right-20 -top-20 w-80 sm:w-96 h-80 sm:h-96 bg-[var(--primary-color)] opacity-20 rounded-full blur-3xl pointer-events-none"></div>
              <div className="absolute -left-20 -bottom-20 w-80 sm:w-96 h-80 sm:h-96 bg-[var(--secondary-color)] opacity-15 rounded-full blur-3xl pointer-events-none"></div>

              <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-center">
                
                <div className="lg:col-span-7 space-y-4 sm:space-y-5">
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/15 text-[11px] font-bold uppercase tracking-wider text-indigo-300">
                    <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                    <span>Broadcasting Live 24/7</span>
                  </div>

                  <h1 className="text-2xl sm:text-4xl lg:text-5xl font-black tracking-tight leading-tight text-white break-words">
                    {station?.name}
                  </h1>

                  <p className="text-xs sm:text-base text-slate-300 max-w-xl leading-relaxed">
                    {station?.description || station?.slogan || 'Independent live radio streaming hits, talk, and news.'}
                  </p>

                  {/* Now On Air Highlight Badge */}
                  {sections?.on_air_enabled && nowOnAir && (
                    <div className="p-3 sm:p-3.5 rounded-2xl bg-white/10 backdrop-blur-md border border-white/15 max-w-md flex items-center gap-3.5">
                      {nowOnAir.image_url ? (
                        <img src={nowOnAir.image_url} alt={nowOnAir.title} className="w-11 h-11 rounded-xl object-cover flex-shrink-0" />
                      ) : (
                        <div className="w-11 h-11 rounded-xl bg-indigo-600/50 flex items-center justify-center text-white flex-shrink-0">
                          <Music className="w-5 h-5" />
                        </div>
                      )}
                      <div className="min-w-0">
                        <span className="text-[9px] font-bold text-red-400 uppercase tracking-wider block">NOW ON AIR</span>
                        <h4 className="font-extrabold text-white text-sm leading-tight truncate">{nowOnAir.title}</h4>
                        <p className="text-[11px] text-slate-300 truncate">with {nowOnAir.presenter} ({nowOnAir.start_time} - {nowOnAir.end_time})</p>
                      </div>
                    </div>
                  )}
                </div>

                <div className="lg:col-span-5">
                  <RadioPlayer variant="hero" />
                </div>

              </div>
            </div>
          </div>
        </section>
      )}

      {/* 2. COMING NEXT & TODAY'S SCHEDULE HIGHLIGHTS */}
      {sections?.programs_enabled && programs && programs.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between mb-8">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-[var(--primary-color)]">Program Lineup</span>
              <h2 className="text-2xl sm:text-3xl font-black text-[var(--text-color)]">Radio Shows & Presenters</h2>
            </div>
            <Link
              to={`${basePath}/schedule`}
              className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-bold text-[var(--primary-color)] hover:underline"
            >
              <span>Full Schedule</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {programs.slice(0, 4).map((prog) => (
              <div
                key={prog.id}
                className="group relative rounded-3xl overflow-hidden bg-[var(--surface-color)] border border-slate-200/80 shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
              >
                <div className="aspect-[4/3] w-full overflow-hidden bg-slate-200 relative">
                  {prog.image_url ? (
                    <img
                      src={prog.image_url}
                      alt={prog.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-slate-800 text-slate-400">
                      <Calendar className="w-10 h-10" />
                    </div>
                  )}
                  <div className="absolute top-3 right-3 px-2.5 py-1 rounded-full text-[11px] font-bold bg-slate-900/80 text-white backdrop-blur-sm flex items-center gap-1">
                    <Clock className="w-3 h-3 text-indigo-400" />
                    <span>{prog.start_time} - {prog.end_time}</span>
                  </div>
                </div>

                <div className="p-5 space-y-2">
                  <h3 className="font-extrabold text-base text-[var(--text-color)] group-hover:text-[var(--primary-color)] transition-colors">
                    {prog.title}
                  </h3>
                  <p className="text-xs font-semibold text-[var(--primary-color)]">
                    Host: {prog.presenter}
                  </p>
                  <p className="text-xs text-[var(--muted-color)] line-clamp-2 leading-relaxed">
                    {prog.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* 3. LATEST NEWS SECTION */}
      {sections?.news_enabled && news && news.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between mb-8">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-[var(--primary-color)]">Headlines & Stories</span>
              <h2 className="text-2xl sm:text-3xl font-black text-[var(--text-color)]">Latest Radio News</h2>
            </div>
            <Link
              to={`${basePath}/news`}
              className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-bold text-[var(--primary-color)] hover:underline"
            >
              <span>View All News</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {news.slice(0, 3).map((item) => (
              <article
                key={item.id}
                className="group rounded-3xl overflow-hidden bg-[var(--surface-color)] border border-slate-200/80 shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col"
              >
                <Link to={`${basePath}/news/${item.slug}`} className="aspect-[16/10] overflow-hidden bg-slate-100 relative block">
                  {item.image_url ? (
                    <img
                      src={item.image_url}
                      alt={item.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-slate-200 text-slate-400">
                      <Newspaper className="w-12 h-12" />
                    </div>
                  )}
                  {item.category_name && (
                    <span className="absolute top-3 left-3 px-3 py-1 rounded-full text-xs font-bold bg-white/90 text-slate-900 backdrop-blur-sm shadow-xs">
                      {item.category_name}
                    </span>
                  )}
                </Link>

                <div className="p-6 flex-1 flex flex-col justify-between">
                  <div className="space-y-2">
                    <span className="text-[11px] font-medium text-[var(--muted-color)]">
                      {new Date(item.published_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                    </span>
                    <Link to={`${basePath}/news/${item.slug}`}>
                      <h3 className="font-extrabold text-lg text-[var(--text-color)] group-hover:text-[var(--primary-color)] transition-colors line-clamp-2">
                        {item.title}
                      </h3>
                    </Link>
                    <p className="text-xs text-[var(--muted-color)] line-clamp-3 leading-relaxed">
                      {item.excerpt}
                    </p>
                  </div>

                  <Link
                    to={`${basePath}/news/${item.slug}`}
                    className="mt-4 inline-flex items-center gap-1.5 text-xs font-bold text-[var(--primary-color)]"
                  >
                    <span>Read Article</span>
                    <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                  </Link>
                </div>
              </article>
            ))}
          </div>
        </section>
      )}

      {/* 4. YOUTUBE VIDEOS SECTION */}
      {sections?.videos_enabled && videos && videos.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between mb-8">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-[var(--primary-color)]">Watch Live & Clips</span>
              <h2 className="text-2xl sm:text-3xl font-black text-[var(--text-color)]">Studio Video Highlights</h2>
            </div>
            <Link
              to={`${basePath}/videos`}
              className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-bold text-[var(--primary-color)] hover:underline"
            >
              <span>More Videos</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 gap-8">
            {videos.slice(0, 2).map((vid) => (
              <div key={vid.id} className="rounded-3xl overflow-hidden bg-[var(--surface-color)] border border-slate-200/80 shadow-md">
                <div className="aspect-video w-full">
                  <iframe
                    src={`https://www.youtube.com/embed/${vid.video_id}`}
                    title={vid.title}
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                    className="w-full h-full border-0"
                  ></iframe>
                </div>
                <div className="p-5">
                  <h3 className="font-extrabold text-base text-[var(--text-color)] truncate">{vid.title}</h3>
                  {vid.description && <p className="text-xs text-[var(--muted-color)] mt-1 line-clamp-2">{vid.description}</p>}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* 5. ABOUT & CONTACT SNIPPET */}
      {(sections?.about_enabled || sections?.contact_enabled) && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="p-8 sm:p-12 rounded-3xl bg-[var(--surface-color)] border border-slate-200/80 shadow-sm grid grid-cols-1 lg:grid-cols-2 gap-10">
            {sections?.about_enabled && (
              <div className="space-y-4">
                <span className="text-xs font-bold uppercase tracking-wider text-[var(--primary-color)]">About The Station</span>
                <h3 className="text-2xl font-black text-[var(--text-color)]">{station?.name}</h3>
                <p className="text-sm text-[var(--muted-color)] leading-relaxed">
                  {station?.description || 'Broadcasting high-definition music, interactive shows, and journalism.'}
                </p>
                {station?.slogan && (
                  <p className="text-xs font-bold italic text-[var(--primary-color)]">"{station.slogan}"</p>
                )}
              </div>
            )}

            {sections?.contact_enabled && (
              <div className="space-y-4 lg:border-l lg:border-slate-200 lg:pl-10">
                <span className="text-xs font-bold uppercase tracking-wider text-[var(--primary-color)]">Get In Touch</span>
                <h3 className="text-xl font-bold text-[var(--text-color)]">Call or Visit Studio</h3>
                <div className="space-y-3 text-sm text-[var(--muted-color)]">
                  {settings?.phone && (
                    <div className="flex items-center gap-3">
                      <Phone className="w-4 h-4 text-[var(--primary-color)]" />
                      <span>{settings.phone}</span>
                    </div>
                  )}
                  {settings?.email && (
                    <div className="flex items-center gap-3">
                      <Mail className="w-4 h-4 text-[var(--primary-color)]" />
                      <span>{settings.email}</span>
                    </div>
                  )}
                  {settings?.address && (
                    <div className="flex items-start gap-3">
                      <MapPin className="w-4 h-4 text-[var(--primary-color)] mt-1" />
                      <span>{settings.address}</span>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </section>
      )}

    </div>
  );
}
