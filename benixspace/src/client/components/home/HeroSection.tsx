import React from 'react';
import { Link } from 'react-router-dom';
import { Rocket, Sparkles, ArrowRight, ShieldCheck, Tv, Radio, Music, Calculator } from 'lucide-react';

export const HeroSection: React.FC = () => {
  return (
    <section className="relative overflow-hidden pt-6 pb-8 lg:pt-10 lg:pb-12 bg-gradient-to-b from-sky-50/60 via-slate-50 to-white">
      {/* Background Decorative Blur Orbs */}
      <div className="absolute top-4 left-1/2 -translate-x-1/2 w-[700px] h-[300px] bg-sky-200/40 rounded-full blur-3xl pointer-events-none -z-10" />
      <div className="absolute bottom-0 right-0 w-[350px] h-[350px] bg-blue-100/30 rounded-full blur-2xl pointer-events-none -z-10" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          
          {/* Left Hero Column */}
          <div className="lg:col-span-7 space-y-4 text-center lg:text-left">
            <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-sky-100/80 border border-sky-200 text-sky-700 text-xs font-semibold shadow-sm">
              <Sparkles className="w-3.5 h-3.5 text-sky-600 animate-spin" style={{ animationDuration: '4s' }} />
              <span>NebeluRw Co. Ltd Digital Home & Platform Ecosystem</span>
            </div>

            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-slate-900 tracking-tight leading-[1.15]">
              Building Digital <span className="bg-gradient-to-r from-sky-600 via-sky-500 to-blue-700 bg-clip-text text-transparent">Experiences</span> for Rwanda and Beyond
            </h1>

            <p className="text-slate-600 text-sm sm:text-base leading-relaxed max-w-2xl mx-auto lg:mx-0">
              BenixSpace is the central digital hub created by <strong className="text-slate-800">NebeluRw Co. Ltd</strong>. We engineer digital platforms, streaming TV & radio media, online tools, and web applications.
            </p>

            <div className="pt-2 flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-3">
              <Link
                to="/projects"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-full bg-gradient-to-r from-sky-600 via-sky-500 to-blue-600 text-white font-bold text-sm shadow-md shadow-sky-500/25 hover:shadow-sky-500/40 hover:-translate-y-0.5 transition-all"
              >
                <span>Explore Our Projects</span>
                <ArrowRight className="w-4 h-4" />
              </Link>

              <Link
                to="/about"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-full bg-white text-slate-700 font-semibold text-sm border border-slate-200 shadow-sm hover:bg-slate-50 hover:text-sky-600 transition-all"
              >
                <span>About NebeluRw</span>
                <ShieldCheck className="w-4 h-4 text-sky-600" />
              </Link>
            </div>

            {/* Quick Metrics Badge */}
            <div className="pt-4 grid grid-cols-3 gap-3 border-t border-slate-200/80 max-w-md mx-auto lg:mx-0">
              <div>
                <span className="block text-xl font-extrabold text-slate-900">5+</span>
                <span className="text-[11px] text-slate-500 font-medium">Digital Platforms</span>
              </div>
              <div>
                <span className="block text-xl font-extrabold text-slate-900">9</span>
                <span className="text-[11px] text-slate-500 font-medium">Core Services</span>
              </div>
              <div>
                <span className="block text-xl font-extrabold text-slate-900">100%</span>
                <span className="text-[11px] text-slate-500 font-medium">Production Ready</span>
              </div>
            </div>
          </div>

          {/* Right Hero Visual: Floating 3D Ecosystem Mockup */}
          <div className="lg:col-span-5 relative flex items-center justify-center pt-2">
            
            {/* Center Core Badge */}
            <div className="relative z-20 glass-card p-6 rounded-3xl border border-slate-200/80 shadow-xl text-center max-w-xs w-full animate-float">
              <div className="w-12 h-12 mx-auto rounded-2xl bg-gradient-to-tr from-sky-600 to-sky-400 text-white flex items-center justify-center shadow-md shadow-sky-500/30 mb-3">
                <Rocket className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-black text-slate-900">BenixSpace</h3>
              <p className="text-[10px] text-sky-600 font-bold uppercase tracking-wider mt-0.5">NebeluRw Co. Ltd</p>
              <p className="text-slate-500 text-[11px] mt-2 leading-relaxed">
                Centralized hub for streaming TV, radio, games, easy calc tools & Voxify.
              </p>
            </div>

            {/* Floating Project Card 1: Benix Space TV (Top Left) */}
            <div className="absolute -top-4 -left-2 z-30 glass-card p-2.5 rounded-2xl border border-sky-100 shadow-md flex items-center gap-2.5 animate-float" style={{ animationDelay: '0.5s' }}>
              <div className="w-8 h-8 rounded-lg bg-red-500 text-white flex items-center justify-center shadow-sm">
                <Tv className="w-4 h-4" />
              </div>
              <div className="text-left pr-1">
                <span className="block text-[11px] font-bold text-slate-900">Benix Space TV</span>
                <span className="text-[9px] text-slate-500">Live Streaming</span>
              </div>
            </div>

            {/* Floating Project Card 2: Benix Radio (Top Right) */}
            <div className="absolute -top-3 -right-2 z-30 glass-card p-2.5 rounded-2xl border border-sky-100 shadow-md flex items-center gap-2.5 animate-float-reverse">
              <div className="w-8 h-8 rounded-lg bg-purple-500 text-white flex items-center justify-center shadow-sm">
                <Radio className="w-4 h-4" />
              </div>
              <div className="text-left pr-1">
                <span className="block text-[11px] font-bold text-slate-900">Benix Radio</span>
                <span className="text-[9px] text-slate-500">24/7 Audio Radio</span>
              </div>
            </div>

            {/* Floating Project Card 3: Voxify (Bottom Left) */}
            <div className="absolute -bottom-4 -left-4 z-30 glass-card p-2.5 rounded-2xl border border-sky-100 shadow-md flex items-center gap-2.5 animate-float-reverse" style={{ animationDelay: '1s' }}>
              <div className="w-8 h-8 rounded-lg bg-emerald-500 text-white flex items-center justify-center shadow-sm">
                <Music className="w-4 h-4" />
              </div>
              <div className="text-left pr-1">
                <span className="block text-[11px] font-bold text-slate-900">Voxify</span>
                <span className="text-[9px] text-slate-500">Music Platform</span>
              </div>
            </div>

            {/* Floating Project Card 4: Benix Easy Calc (Bottom Right) */}
            <div className="absolute -bottom-5 -right-1 z-30 glass-card p-2.5 rounded-2xl border border-sky-100 shadow-md flex items-center gap-2.5 animate-float" style={{ animationDelay: '1.5s' }}>
              <div className="w-8 h-8 rounded-lg bg-amber-500 text-white flex items-center justify-center shadow-sm">
                <Calculator className="w-4 h-4" />
              </div>
              <div className="text-left pr-1">
                <span className="block text-[11px] font-bold text-slate-900">Easy Calc</span>
                <span className="text-[9px] text-slate-500">Smart Calculators</span>
              </div>
            </div>

          </div>

        </div>
      </div>
    </section>
  );
};
