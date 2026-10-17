import React from 'react';
import { Heart, ShieldCheck, MapPin, Sparkles, ArrowRight } from 'lucide-react';

export const KundaSection: React.FC = () => {
  const sampleProfiles = [
    { name: 'Keza Diane', age: 24, city: 'Kigali, Rwanda', intention: 'Serious Relationship', verified: true },
    { name: 'Mugisha Kevin', age: 27, city: 'Kigali, Rwanda', intention: 'Marriage Oriented', verified: true },
    { name: 'Umutoni Grace', age: 25, city: 'Rubavu, Rwanda', intention: 'Serious Relationship', verified: true }
  ];

  return (
    <section className="py-12 bg-gradient-to-br from-rose-50 via-white to-pink-50 rounded-3xl border border-rose-100 my-8 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-end justify-between gap-4 border-b border-rose-200/60 pb-5">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-rose-600 bg-rose-100 px-3 py-1 rounded-full border border-rose-200 flex items-center gap-1.5 w-fit">
              <Heart className="w-3.5 h-3.5 text-rose-600 fill-current" />
              Kunda Space Dating
            </span>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-2 tracking-tight">
              Genuine Connections & Meaningful Matchmaking
            </h2>
          </div>
          <div className="text-xs text-rose-600 font-semibold flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4" />
            <span>Strict 18+ Verified Identity & Privacy</span>
          </div>
        </div>

        {/* Profiles Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {sampleProfiles.map((p, idx) => (
            <div
              key={idx}
              className="p-5 rounded-2xl bg-white border border-rose-100/80 shadow-md hover:shadow-xl hover:border-rose-300 transition-all flex flex-col justify-between space-y-4"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <h4 className="text-sm font-extrabold text-slate-900">{p.name}, {p.age}</h4>
                  {p.verified && <ShieldCheck className="w-4 h-4 text-sky-500 shrink-0" />}
                </div>
                <div className="p-2 rounded-full bg-rose-50 text-rose-500">
                  <Heart className="w-4 h-4 fill-current" />
                </div>
              </div>

              <div className="space-y-1.5 text-xs text-slate-600">
                <div className="flex items-center gap-1.5 text-slate-500 text-[11px]">
                  <MapPin className="w-3.5 h-3.5 text-rose-500" />
                  <span>{p.city}</span>
                </div>
                <div className="text-[11px] font-semibold text-rose-700 bg-rose-50/80 px-2.5 py-1 rounded-xl border border-rose-100 w-fit">
                  {p.intention}
                </div>
              </div>

              <button className="w-full py-2.5 rounded-xl bg-gradient-to-r from-rose-500 to-pink-500 text-white text-xs font-bold shadow-md hover:opacity-95 transition-opacity">
                Connect on Kunda
              </button>
            </div>
          ))}
        </div>

      </div>
    </section>
  );
};
