import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { SeoHead } from '../components/common/SeoHead';
import { AdSenseUnit } from '../components/common/AdSenseUnit';
import { trackPageView } from '../analytics/tracker';
import {
  Rocket, ShieldCheck, Mail, Phone, MapPin, ArrowRight,
  Tv, Radio, Gamepad2, CreditCard, Server, Zap
} from 'lucide-react';

export const AboutPage: React.FC = () => {
  useEffect(() => {
    trackPageView(window.location.href, 'about');
  }, []);

  const platforms = [
    { icon: Tv, name: 'Benix Space TV', desc: 'Live Rwandan TV channels, creator videos and on-demand streaming.', color: 'from-blue-600 to-indigo-700' },
    { icon: Radio, name: 'Live Radio FM', desc: '24/7 digital radio stations with background audio playback.', color: 'from-purple-600 to-pink-600' },
    { icon: Gamepad2, name: 'RollDice Games', desc: 'Interactive dice wagering with instant central-wallet payouts.', color: 'from-emerald-600 to-teal-600' },
    { icon: CreditCard, name: 'Benix Pay Gateway', desc: 'Developer-friendly MTN MoMo, Airtel and card payments for merchants.', color: 'from-amber-500 to-orange-600' },
    { icon: Server, name: 'Benix Cloud Hosting', desc: 'Zero-config app hosting, custom domains and GitHub auto-sync.', color: 'from-rose-500 to-pink-600' }
  ];

  return (
    <>
      <SeoHead
        title="About Us — NebeluRw Co. Ltd & Benir Benjamin"
        description="Learn about NebeluRw Co. Ltd, a technology and digital services company in Rwanda developing streaming TV/radio, games, payments, and cloud hosting under Benir Benjamin leadership."
      />

      <div className="bg-[#0B0E14] min-h-screen py-12 sm:py-16 text-slate-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          
          {/* Header Banner */}
          <div className="text-center max-w-3xl mx-auto space-y-4">
            <span className="text-xs font-bold uppercase tracking-wider text-blue-400 bg-blue-500/10 px-4 py-1.5 rounded-full border border-blue-500/20 inline-flex items-center gap-2">
              <Rocket className="w-3.5 h-3.5" />
              NebeluRw Company Story
            </span>
            <h1 className="text-3xl sm:text-5xl font-black text-white tracking-tight leading-tight">
              Building Digital Ecosystems for <span className="bg-gradient-to-r from-blue-400 to-indigo-400 bg-clip-text text-transparent">Rwanda & Beyond</span>
            </h1>
            <p className="text-slate-400 text-base leading-relaxed">
              NebeluRw Co. Ltd is a modern software and digital media company committed to developing user-centered web applications, streaming platforms, and payment infrastructure.
            </p>
          </div>

          {/* Company Story & Mission */}
          <div className="rounded-3xl p-8 sm:p-12 border border-slate-800 bg-[#121824] shadow-2xl space-y-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-center">
              <div className="space-y-4">
                <h2 className="text-2xl sm:text-3xl font-black text-white">What NebeluRw Does</h2>
                <p className="text-slate-400 text-sm sm:text-base leading-relaxed">
                  Founded by <strong className="text-white">Benir Benjamin</strong>, NebeluRw Co. Ltd operates at the intersection of web engineering, digital media, streaming, and online payments.
                </p>
                <p className="text-slate-400 text-sm sm:text-base leading-relaxed">
                  Through our central home platform <strong className="text-blue-400">BenixSpace</strong>, we deliver a unified digital ecosystem:
                </p>

                <div className="space-y-3 pt-2">
                  <div className="flex items-start gap-3">
                    <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                    <div>
                      <strong className="text-white text-sm">Central Wallet & Payments:</strong>
                      <span className="text-slate-400 text-sm block">Atomic ledger, deposits, withdrawals, and Benix Pay merchant gateway.</span>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <Zap className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
                    <div>
                      <strong className="text-white text-sm">Creator Monetization:</strong>
                      <span className="text-slate-400 text-sm block">Share-and-earn rewards, video boosts, and ad revenue for content creators.</span>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <Server className="w-5 h-5 text-blue-400 shrink-0 mt-0.5" />
                    <div>
                      <strong className="text-white text-sm">Cloud Hosting:</strong>
                      <span className="text-slate-400 text-sm block">GitHub auto-sync, custom domains, and zero-config application deployment.</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-gradient-to-tr from-[#1C2538] via-[#141B2D] to-[#0D121F] border border-slate-800 rounded-2xl p-8 space-y-6 shadow-2xl">
                <div className="w-12 h-12 rounded-xl bg-blue-600 text-white flex items-center justify-center">
                  <Rocket className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-black text-white">The NebeluRw Vision</h3>
                <p className="text-slate-300 text-sm leading-relaxed">
                  To establish a world-class technology company delivering seamless digital experiences, high-availability streaming platforms, and empowering online services across East Africa and globally.
                </p>
                <div className="pt-4 border-t border-slate-700 text-xs text-slate-400 space-y-1.5">
                  <p className="flex items-center gap-1.5"><MapPin className="w-3.5 h-3.5 text-blue-400" /> Headquartered in Kigali, Rwanda</p>
                  <p className="flex items-center gap-1.5"><ShieldCheck className="w-3.5 h-3.5 text-emerald-400" /> Domain: benix.space</p>
                </div>
              </div>
            </div>
          </div>

          {/* Platform Portfolio Grid */}
          <div className="space-y-5">
            <div className="text-center space-y-1">
              <h2 className="text-2xl sm:text-3xl font-black text-white">Our Platform Suite</h2>
              <p className="text-slate-400 text-sm">Six integrated products under one BenixSpace super-account.</p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {platforms.map((p) => {
                const Icon = p.icon;
                return (
                  <div key={p.name} className="p-5 rounded-2xl bg-[#121824] border border-slate-800 hover:border-slate-700 shadow-lg transition-all space-y-3">
                    <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${p.color} flex items-center justify-center text-white shadow-lg`}>
                      <Icon className="w-5 h-5" />
                    </div>
                    <h3 className="font-bold text-white text-sm">{p.name}</h3>
                    <p className="text-xs text-slate-400 leading-relaxed">{p.desc}</p>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Benir Benjamin Founder Leadership Section */}
          <div className="rounded-3xl p-8 sm:p-12 border border-slate-800 bg-[#121824] shadow-xl space-y-6">
            <div className="flex flex-col md:flex-row items-center gap-8">
              <div className="w-28 h-28 rounded-3xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center font-extrabold text-4xl shadow-xl shadow-blue-600/20 shrink-0">
                BB
              </div>
              <div className="space-y-3 text-center md:text-left">
                <span className="text-xs font-bold uppercase tracking-wider text-blue-400 bg-blue-500/10 px-3 py-1 rounded-full border border-blue-500/20">
                  Company Leadership
                </span>
                <h3 className="text-2xl sm:text-3xl font-black text-white">Benir Benjamin</h3>
                <p className="text-slate-400 text-sm sm:text-base leading-relaxed">
                  Benir Benjamin is the founder and primary contact behind NebeluRw Co. Ltd and the BenixSpace ecosystem. He guides platform development, software architecture, media production, and digital strategy.
                </p>
                <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 text-xs font-semibold text-slate-300 pt-2">
                  <a href="mailto:benirabok@gmail.com" className="flex items-center gap-1.5 hover:text-blue-400 transition-colors">
                    <Mail className="w-4 h-4 text-blue-400" /> benirabok@gmail.com
                  </a>
                  <a href="tel:0783987223" className="flex items-center gap-1.5 hover:text-blue-400 transition-colors">
                    <Phone className="w-4 h-4 text-blue-400" /> 0783987223
                  </a>
                </div>
              </div>
            </div>
          </div>

          {/* AdSense Unit */}
          <div className="py-4">
            <AdSenseUnit className="w-full" />
          </div>

          {/* Contact Banner */}
          <div className="text-center pt-2">
            <Link
              to="/contact"
              className="inline-flex items-center gap-2 px-8 py-4 rounded-full bg-blue-600 hover:bg-blue-500 text-white font-bold text-sm shadow-lg shadow-blue-600/25 transition-all"
            >
              <span>Get in Touch with NebeluRw</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

        </div>
      </div>
    </>
  );
};
