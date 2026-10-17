import React, { useState, useEffect, useRef } from 'react';
import { Radio as RadioIcon, Play, Pause, Volume2, VolumeX, Music, Calendar } from 'lucide-react';

export const RadioSection: React.FC = () => {
  const [stations, setStations] = useState<any[]>([]);
  const [programs, setPrograms] = useState<any[]>([]);
  const [activeStation, setActiveStation] = useState<any>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    fetch('/api/modules/radio/stations')
      .then((res) => res.json())
      .then((data) => {
        setStations(data.stations || []);
        if (data.stations?.length > 0) {
          setActiveStation(data.stations[0]);
        }
      })
      .catch(() => {});

    fetch('/api/modules/radio/programs')
      .then((res) => res.json())
      .then((data) => setPrograms(data.programs || []))
      .catch(() => {});
  }, []);

  const togglePlay = () => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.play().then(() => setIsPlaying(true)).catch(() => {});
    }
  };

  const selectStation = (st: any) => {
    setActiveStation(st);
    setIsPlaying(false);
    if (audioRef.current) {
      audioRef.current.src = 'https://stream.zeno.fm/f3wvbbqmdg8uv'; // Stream URL from backup
      audioRef.current.load();
      audioRef.current.play().then(() => setIsPlaying(true)).catch(() => {});
    }
  };

  return (
    <section className="py-12 bg-gradient-to-br from-indigo-950 via-slate-900 to-slate-950 text-white rounded-3xl overflow-hidden my-8 shadow-2xl relative border border-indigo-900/50">
      <audio
        ref={audioRef}
        src="https://stream.zeno.fm/f3wvbbqmdg8uv"
        preload="none"
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-end justify-between gap-4 border-b border-indigo-900/60 pb-5">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-indigo-400 bg-indigo-500/20 px-3 py-1 rounded-full border border-indigo-500/30 flex items-center gap-1.5 w-fit">
              <RadioIcon className="w-3.5 h-3.5 text-indigo-400 animate-pulse" />
              Live Radio Ecosystem
            </span>
            <h2 className="text-2xl sm:text-3xl font-black mt-2 tracking-tight">
              Benix Radio Broadcasts
            </h2>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs text-indigo-300 font-semibold">Crystal Clear 320kbps Audio</span>
          </div>
        </div>

        {/* Player Bar */}
        <div className="p-6 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-md flex flex-col md:flex-row items-center justify-between gap-6 shadow-xl">
          <div className="flex items-center gap-4 w-full md:w-auto">
            <button
              onClick={togglePlay}
              className="w-14 h-14 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white flex items-center justify-center shadow-lg shadow-indigo-600/40 transition-all shrink-0 hover:scale-105"
            >
              {isPlaying ? <Pause className="w-6 h-6 fill-current" /> : <Play className="w-6 h-6 fill-current ml-0.5" />}
            </button>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-indigo-400 uppercase tracking-wider">Now Playing</span>
                {isPlaying && (
                  <span className="flex items-center gap-0.5">
                    <span className="w-1 h-3 bg-indigo-400 animate-pulse" />
                    <span className="w-1 h-5 bg-indigo-400 animate-pulse delay-75" />
                    <span className="w-1 h-2 bg-indigo-400 animate-pulse delay-150" />
                  </span>
                )}
              </div>
              <h3 className="text-lg font-extrabold text-white truncate">
                {activeStation?.name || 'Kigali Wave 94.7 FM'}
              </h3>
              <p className="text-xs text-slate-400 truncate">
                {activeStation?.slogan || 'Your Sound, Your Energy, Your Kigali'}
              </p>
            </div>
          </div>

          {/* Station Switcher Pills */}
          <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
            {stations.map((st) => (
              <button
                key={st.id}
                onClick={() => selectStation(st)}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                  activeStation?.id === st.id
                    ? 'bg-indigo-600 text-white shadow-md'
                    : 'bg-white/10 text-slate-300 hover:bg-white/15'
                }`}
              >
                {st.name}
              </button>
            ))}
          </div>
        </div>

        {/* Program Schedule Preview */}
        {programs.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-400 uppercase tracking-wider">
              <Calendar className="w-4 h-4 text-indigo-400" />
              <span>Featured Shows on Schedule</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {programs.slice(0, 3).map((p) => (
                <div key={p.id} className="p-4 rounded-2xl bg-white/5 border border-white/10 space-y-1">
                  <div className="text-[11px] font-bold text-indigo-400">{p.start_time} - {p.end_time}</div>
                  <h4 className="text-xs font-bold text-white">{p.title}</h4>
                  <p className="text-[11px] text-slate-400 line-clamp-1">{p.presenter}</p>
                </div>
              ))}
            </div>
          </div>
        )}

      </div>
    </section>
  );
};
