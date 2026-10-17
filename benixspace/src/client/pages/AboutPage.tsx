import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { SeoHead } from '../components/common/SeoHead';
import { AdSenseUnit } from '../components/common/AdSenseUnit';
import { trackPageView } from '../analytics/tracker';
import { Rocket, ShieldCheck, Mail, Phone, MapPin, CheckCircle2, ArrowRight } from 'lucide-react';

export const AboutPage: React.FC = () => {
  useEffect(() => {
    trackPageView(window.location.href, 'about');
  }, []);

  return (
    <>
      <SeoHead
        title="About Us — NebeluRw Co. Ltd & Benir Benjamin"
        description="Learn about NebeluRw Co. Ltd, a technology and digital services company in Rwanda developing digital platforms, streaming TV/radio, and music platforms under Benir Benjamin leadership."
      />

      <div className="bg-slate-50 min-h-screen py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-16">
          
          {/* Header Banner */}
          <div className="text-center max-w-3xl mx-auto space-y-4">
            <span className="text-xs font-bold uppercase tracking-wider text-sky-600 bg-sky-100/80 px-4 py-1.5 rounded-full border border-sky-200">
              NebeluRw Company Story
            </span>
            <h1 className="text-4xl sm:text-5xl font-extrabold text-slate-900 tracking-tight">
              Building Digital Ecosystems for Rwanda & Beyond
            </h1>
            <p className="text-slate-600 text-base leading-relaxed">
              NebeluRw Co. Ltd is a modern software and digital media company committed to developing user-centered web applications, streaming platforms, and digital platforms.
            </p>
          </div>

          {/* Company Story & Mission */}
          <div className="glass-card rounded-3xl p-8 sm:p-12 border border-slate-200/80 shadow-xl space-y-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-center">
              <div className="space-y-4">
                <h2 className="text-2xl sm:text-3xl font-bold text-slate-900">What NebeluRw Does</h2>
                <p className="text-slate-600 text-sm sm:text-base leading-relaxed">
                  Founded by <strong className="text-slate-800">Benir Benjamin</strong>, NebeluRw Co. Ltd operates at the intersection of web engineering, digital marketing, audio-visual production, and online media.
                </p>
                <p className="text-slate-600 text-sm sm:text-base leading-relaxed">
                  Through our central home platform <strong className="text-sky-600">BenixSpace</strong>, we deliver a diverse portfolio of live digital platforms:
                </p>

                <div className="space-y-3 pt-2">
                  <div className="flex items-start gap-3">
                    <CheckCircle2 className="w-5 h-5 text-sky-500 shrink-0 mt-0.5" />
                    <div>
                      <strong className="text-slate-900 text-sm">Benix Space TV & Radio:</strong>
                      <span className="text-slate-600 text-sm block">Live video streaming broadcasts and 24/7 digital audio stations.</span>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <CheckCircle2 className="w-5 h-5 text-sky-500 shrink-0 mt-0.5" />
                    <div>
                      <strong className="text-slate-900 text-sm">Benix Easy Calc:</strong>
                      <span className="text-slate-600 text-sm block">Smart productivity calculators and conversion utilities.</span>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <CheckCircle2 className="w-5 h-5 text-sky-500 shrink-0 mt-0.5" />
                    <div>
                      <strong className="text-slate-900 text-sm">Voxify Platform:</strong>
                      <span className="text-slate-600 text-sm block">Digital music catalog and distribution hub for choirs and artists.</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-gradient-to-tr from-slate-900 via-sky-950 to-slate-900 text-white rounded-2xl p-8 space-y-6 shadow-2xl">
                <div className="w-12 h-12 rounded-xl bg-sky-500 text-slate-950 flex items-center justify-center font-bold">
                  <Rocket className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-bold">The NebeluRw Vision</h3>
                <p className="text-slate-300 text-sm leading-relaxed">
                  To establish a world-class technology company delivering seamless digital experiences, high-availability streaming platforms, and empowering online services across East Africa and globally.
                </p>
                <div className="pt-4 border-t border-slate-800 text-xs text-slate-400 space-y-1">
                  <p>📍 Headquartered in Kigali, Rwanda</p>
                  <p>🌐 Domain: benix.space</p>
                </div>
              </div>
            </div>
          </div>

          {/* Benir Benjamin Founder Leadership Section */}
          <div className="glass-card rounded-3xl p-8 sm:p-12 border border-slate-200/80 shadow-xl space-y-6">
            <div className="flex flex-col md:flex-row items-center gap-8">
              <div className="w-28 h-28 rounded-3xl bg-gradient-to-tr from-sky-600 to-sky-400 text-white flex items-center justify-center font-extrabold text-4xl shadow-xl shadow-sky-500/20 shrink-0">
                BB
              </div>
              <div className="space-y-3 text-center md:text-left">
                <span className="text-xs font-bold uppercase tracking-wider text-sky-600 bg-sky-50 px-3 py-1 rounded-full border border-sky-100">
                  Company Leadership
                </span>
                <h3 className="text-2xl sm:text-3xl font-extrabold text-slate-900">Benir Benjamin</h3>
                <p className="text-slate-600 text-sm sm:text-base leading-relaxed">
                  Benir Benjamin is the founder and primary contact behind NebeluRw Co. Ltd and the BenixSpace ecosystem. He guides platform development, software architecture, media production, and digital strategy.
                </p>
                <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 text-xs font-semibold text-slate-700 pt-2">
                  <a href="mailto:benirabok@gmail.com" className="flex items-center gap-1.5 hover:text-sky-600">
                    <Mail className="w-4 h-4 text-sky-600" /> benirabok@gmail.com
                  </a>
                  <a href="tel:0783987223" className="flex items-center gap-1.5 hover:text-sky-600">
                    <Phone className="w-4 h-4 text-sky-600" /> 0783987223
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
          <div className="text-center pt-4">
            <Link
              to="/contact"
              className="inline-flex items-center gap-2 px-8 py-4 rounded-full bg-sky-600 hover:bg-sky-700 text-white font-bold text-sm shadow-lg shadow-sky-500/25 transition-all"
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
