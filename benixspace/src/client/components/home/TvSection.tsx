import React, { useState, useEffect } from 'react';
import { Tv, Play, Radio as RadioIcon, Eye, ExternalLink, Sparkles } from 'lucide-react';

export const TvSection: React.FC = () => {
  const [stations, setStations] = useState<any[]>([]);
  const [videos, setVideos] = useState<any[]>([]);
  const [activeStation, setActiveStation] = useState<any>(null);
  const [activeVideo, setActiveVideo] = useState<any>(null);

  useEffect(() => {
    fetch('/api/modules/tv/stations')
      .then((res) => res.json())
      .then((data) => {
        setStations(data.stations || []);
        if (data.stations?.length > 0) {
          setActiveStation(data.stations[0]);
        }
      })
      .catch(() => {});

    fetch('/api/modules/tv/videos')
      .then((res) => res.json())
      .then((data) => {
        setVideos(data.videos || []);
        if (data.videos?.length > 0) {
          setActiveVideo(data.videos[0]);
        }
      })
      .catch(() => {});
  }, []);

  return (
    <section className="py-12 bg-slate-900 text-white rounded-3xl overflow-hidden my-8 shadow-2xl relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        
        {/* Section Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-end justify-between gap-4 border-b border-slate-800 pb-5">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-rose-400 bg-rose-500/20 px-3 py-1 rounded-full border border-rose-500/30 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping inline-block" />
                Live Broadcast
              </span>
              <span className="text-xs text-slate-400 font-semibold">Benix Space TV</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black mt-2 tracking-tight">
              Live TV Streaming & Video Library
            </h2>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400">
              {stations.length} Live Channels Available
            </span>
          </div>
        </div>

        {/* Video Player Display */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 rounded-2xl overflow-hidden bg-black aspect-video border border-slate-800 relative shadow-2xl">
            {activeVideo?.embed_url ? (
              <iframe
                src={activeVideo.embed_url + '?autoplay=0'}
                title={activeVideo.title}
                className="w-full h-full border-0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center text-slate-500 space-y-2">
                <Tv className="w-12 h-12 text-slate-700" />
                <span className="text-xs font-semibold">Select a stream or video to watch</span>
              </div>
            )}
          </div>

          {/* Channels & Video Playlist */}
          <div className="space-y-4 flex flex-col justify-between">
            <div className="space-y-2">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Live Channels
              </h3>
              <div className="grid grid-cols-2 gap-2">
                {stations.slice(0, 4).map((s) => (
                  <button
                    key={s.id}
                    onClick={() => setActiveStation(s)}
                    className={`p-3 rounded-xl border text-left transition-all ${
                      activeStation?.id === s.id
                        ? 'border-rose-500 bg-rose-500/10 text-white shadow-sm'
                        : 'border-slate-800 bg-slate-800/40 text-slate-400 hover:border-slate-700'
                    }`}
                  >
                    <div className="text-xs font-bold truncate">{s.name}</div>
                    <div className="text-[10px] text-rose-400 font-semibold mt-0.5 flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-rose-500 inline-block" />
                      {s.status}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Recent Broadcasts
              </h3>
              <div className="space-y-2">
                {videos.slice(0, 3).map((v) => (
                  <div
                    key={v.id}
                    onClick={() => setActiveVideo(v)}
                    className={`p-2.5 rounded-xl border cursor-pointer transition-all flex items-center gap-3 ${
                      activeVideo?.id === v.id
                        ? 'border-sky-500 bg-sky-500/10 text-white'
                        : 'border-slate-800 bg-slate-800/40 text-slate-400 hover:border-slate-700'
                    }`}
                  >
                    <div className="w-8 h-8 rounded-lg bg-slate-800 flex items-center justify-center shrink-0 text-sky-400">
                      <Play className="w-4 h-4 fill-current" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="text-xs font-bold truncate text-slate-200">{v.title}</div>
                      <div className="text-[10px] text-slate-500">{new Date(v.publication_date).toLocaleDateString()}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

      </div>
    </section>
  );
};
