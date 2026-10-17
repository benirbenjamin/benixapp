import React from 'react';
import { Music, Play, Mic2, Users, ArrowRight } from 'lucide-react';

export const VoxifySection: React.FC = () => {
  const sampleTracks = [
    { title: 'Ni Wowe Rutare Rwanjye', choir: 'Chorale de Kigali', part: 'Full SATB Mix', duration: '4:12' },
    { title: 'Mana Ishimwe', choir: 'Chorale Christus Regnat', part: 'Soprano Lead', duration: '3:45' },
    { title: 'Alleluia Umwami Yatsinze', choir: 'Regina Pacis', part: 'Tenor Voice', duration: '5:20' }
  ];

  return (
    <section className="py-12 bg-slate-900 text-white rounded-3xl overflow-hidden my-8 shadow-2xl relative border border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-end justify-between gap-4 border-b border-slate-800 pb-5">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-teal-400 bg-teal-500/20 px-3 py-1 rounded-full border border-teal-500/30 flex items-center gap-1.5 w-fit">
              <Music className="w-3.5 h-3.5 text-teal-400" />
              Voxify Music & Choirs
            </span>
            <h2 className="text-2xl sm:text-3xl font-extrabold mt-2 tracking-tight">
              Choir Rehearsal Audio & Gospel Music
            </h2>
          </div>
          <div className="text-xs text-slate-400 font-semibold">
            Multi-voice learning: Soprano, Alto, Tenor, Bass (SATB)
          </div>
        </div>

        {/* Tracks List */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {sampleTracks.map((t, idx) => (
            <div
              key={idx}
              className="p-5 rounded-2xl bg-white/5 border border-white/10 hover:border-teal-500/50 hover:bg-white/10 transition-all flex flex-col justify-between space-y-4 group"
            >
              <div className="flex items-start justify-between">
                <div className="w-10 h-10 rounded-xl bg-teal-500/20 text-teal-400 flex items-center justify-center">
                  <Play className="w-5 h-5 fill-current ml-0.5" />
                </div>
                <span className="text-[10px] font-bold text-teal-300 bg-teal-500/20 px-2 py-0.5 rounded-full border border-teal-500/30">
                  {t.part}
                </span>
              </div>
              <div>
                <h4 className="text-sm font-bold text-white group-hover:text-teal-400 transition-colors">{t.title}</h4>
                <p className="text-xs text-slate-400 mt-0.5">{t.choir} • {t.duration}</p>
              </div>
            </div>
          ))}
        </div>

      </div>
    </section>
  );
};
