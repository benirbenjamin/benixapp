'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {
  Code2,
  Disc3,
  Video,
  Music,
  Users,
  ShieldCheck,
  CheckCircle2,
  Calendar,
  Sparkles,
  ArrowRight,
  Phone,
  Mail,
  Globe2,
  ArrowLeft
} from 'lucide-react';
import { InstagramIcon } from '@/components/ui/InstagramIcon';
import { Footer } from '@/components/layout/Footer';

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col justify-between selection:bg-purple-600 selection:text-white">
      {/* Navigation Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-purple-600/10 border border-purple-600/20 p-1 flex items-center justify-center">
              <Image src="/logo.png" alt="Voxify Logo" width={32} height={32} className="object-contain" />
            </div>
            <div>
              <span className="font-extrabold text-base text-slate-900 tracking-tight">Voxify Space</span>
              <span className="hidden sm:inline-block ml-2 text-[10px] font-semibold text-purple-600 uppercase tracking-wider">
                NebeluRw Co. Ltd
              </span>
            </div>
          </Link>

          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="inline-flex items-center gap-1 text-xs font-bold text-slate-600 hover:text-slate-900 px-3 py-2 rounded-xl hover:bg-slate-100 transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Home</span>
            </Link>
            <Link
              href="/songs/marketplace"
              className="hidden sm:inline-flex text-xs font-bold text-slate-600 hover:text-purple-600 px-3 py-2 rounded-xl hover:bg-slate-100 transition-colors"
            >
              Marketplace
            </Link>
            <Link
              href="/contact"
              className="text-xs font-bold text-slate-600 hover:text-purple-600 px-3 py-2 rounded-xl hover:bg-slate-100 transition-colors"
            >
              Contact
            </Link>
            <Link
              href="/register"
              className="text-xs font-extrabold bg-purple-600 hover:bg-purple-500 text-white px-4 py-2 rounded-xl shadow-xs transition-all"
            >
              Get Started
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="bg-white border-b border-slate-200 py-16 sm:py-20 px-4 sm:px-6">
        <div className="max-w-5xl mx-auto text-center space-y-5">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-purple-50 border border-purple-200 text-purple-700 text-xs font-bold">
            <Calendar className="w-3.5 h-3.5 text-purple-600" />
            <span>Operating in Rwanda Since 2015</span>
          </div>

          <h1 className="text-3xl sm:text-5xl font-black text-slate-950 tracking-tight leading-tight">
            Innovating Music &amp; Technology in Rwanda and Across Africa
          </h1>

          <p className="text-base sm:text-lg text-slate-600 max-w-3xl mx-auto leading-relaxed">
            <strong className="text-slate-900">Voxify Space</strong> is the flagship choir workspace and digital music marketplace built and operated by <strong className="text-purple-700 font-extrabold">NebeluRw Co. Ltd</strong> — a Rwandan technology, web engineering, and multimedia production powerhouse established in 2015.
          </p>

          <div className="pt-4 flex flex-wrap items-center justify-center gap-3">
            <Link
              href="/contact"
              className="bg-purple-600 hover:bg-purple-500 text-white text-xs sm:text-sm font-extrabold px-6 py-3 rounded-xl shadow-md shadow-purple-600/20 transition-all flex items-center gap-2"
            >
              <span>Get in Touch</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
            <a
              href="https://wa.me/250783987223"
              target="_blank"
              rel="noopener noreferrer"
              className="bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-300 text-xs sm:text-sm font-bold px-5 py-3 rounded-xl transition-all flex items-center gap-2"
            >
              <Phone className="w-4 h-4 text-emerald-600" />
              <span>Chat on WhatsApp (+250 783 987 223)</span>
            </a>
          </div>
        </div>
      </section>

      {/* Main Content Sections */}
      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-16 space-y-16">
        {/* NebeluRw Co. Ltd Pillars */}
        <section className="space-y-8">
          <div className="text-center max-w-2xl mx-auto space-y-2">
            <h2 className="text-2xl sm:text-3xl font-black text-slate-950">
              The Three Pillars of NebeluRw Co. Ltd
            </h2>
            <p className="text-xs sm:text-sm text-slate-600">
              With over a decade of dedication in Rwanda, NebeluRw bridges cutting-edge software engineering with creative audio-visual arts.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Pillar 1: Tech & Web */}
            <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 space-y-4 hover:border-blue-300 hover:shadow-lg transition-all">
              <div className="w-12 h-12 rounded-2xl bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-600">
                <Code2 className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-extrabold text-slate-900">
                Tech &amp; Website Development
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                We design, build, and deploy modern, responsive websites and mission-critical web applications. From custom corporate portals and e-commerce architectures to complex SaaS platforms like Voxify Space, our software solutions are engineered for speed, scale, and intuitive usability.
              </p>
              <ul className="text-xs text-slate-500 space-y-1.5 pt-2 border-t border-slate-100">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                  <span>Custom Corporate &amp; Portfolio Websites</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                  <span>SaaS &amp; Cloud Web Applications</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                  <span>Mobile-First Responsive Layouts</span>
                </li>
              </ul>
            </div>

            {/* Pillar 2: Nebelu Records Studio */}
            <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 space-y-4 hover:border-amber-300 hover:shadow-lg transition-all">
              <div className="w-12 h-12 rounded-2xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-600">
                <Disc3 className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-extrabold text-slate-900">
                Nebelu Records Studio (Music Production)
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Operating under Nebelu Records Studio, we provide comprehensive audio recording, vocal arrangement, mixing, and mastering. We specialize in gospel music, choir multi-track vocal stems (Soprano, Alto, Tenor, Bass), acoustic instruments, and professional singles.
              </p>
              <ul className="text-xs text-slate-500 space-y-1.5 pt-2 border-t border-slate-100">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                  <span>Choir Multi-Track Stem Production</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                  <span>Professional Vocal Recording &amp; Tuning</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                  <span>Industry-Standard Mixing &amp; Mastering</span>
                </li>
              </ul>
            </div>

            {/* Pillar 3: Video Production */}
            <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 space-y-4 hover:border-rose-300 hover:shadow-lg transition-all">
              <div className="w-12 h-12 rounded-2xl bg-rose-50 border border-rose-200 flex items-center justify-center text-rose-600">
                <Video className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-extrabold text-slate-900">
                Video Production Services
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                NebeluRw produces cinematic music videos, live choir concert recordings, church service filming, and documentary storytelling. From 4K multi-camera shoots and studio lighting to color grading and visual post-production, we bring stories and music to life.
              </p>
              <ul className="text-xs text-slate-500 space-y-1.5 pt-2 border-t border-slate-100">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-rose-600 shrink-0" />
                  <span>Cinematic Music Video Production</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-rose-600 shrink-0" />
                  <span>Multi-Cam Live Choir Concert Filming</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-rose-600 shrink-0" />
                  <span>Creative Post-Production &amp; Grading</span>
                </li>
              </ul>
            </div>
          </div>
        </section>

        {/* The Mission Behind Voxify Space */}
        <section className="bg-white border border-slate-200 rounded-3xl p-8 sm:p-12 space-y-8">
          <div className="max-w-3xl space-y-4">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 text-xs font-bold border border-emerald-200">
              <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
              <span>Why We Created Voxify Space</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-slate-950">
              Solving the Real Challenges of Choir Rehearsals and African Music Distribution
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
              Every choir master knows the struggle of teaching parts individually during limited rehearsal hours. Sopranos, Altos, Tenors, and Basses often struggle to hear their isolated notes. Meanwhile, talented composers and gospel artists struggle to monetize their music without complex international systems.
            </p>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
              Voxify Space was engineered to solve both: providing singers with multi-track vocal stems so they can rehearse anywhere, while giving artists a direct marketplace connected to Rwandan Mobile Money (MTN MoMo and Airtel Money).
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 pt-4 border-t border-slate-100">
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
              <div className="w-8 h-8 rounded-xl bg-purple-600/10 text-purple-600 flex items-center justify-center font-black text-xs">
                1
              </div>
              <h4 className="text-xs font-extrabold text-slate-900">Multi-Track Vocal Audio</h4>
              <p className="text-[11px] text-slate-500 leading-relaxed">
                Singers can solo or mute SATB vocal stems to practice their exact voice part.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
              <div className="w-8 h-8 rounded-xl bg-blue-600/10 text-blue-600 flex items-center justify-center font-black text-xs">
                2
              </div>
              <h4 className="text-xs font-extrabold text-slate-900">Digital Sheet Music</h4>
              <p className="text-[11px] text-slate-500 leading-relaxed">
                Solfa and staff notation PDF distribution direct to choir members on phones.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
              <div className="w-8 h-8 rounded-xl bg-amber-600/10 text-amber-600 flex items-center justify-center font-black text-xs">
                3
              </div>
              <h4 className="text-xs font-extrabold text-slate-900">Music Marketplace</h4>
              <p className="text-[11px] text-slate-500 leading-relaxed">
                Composers sell exclusive and non-exclusive tracks directly with instant MoMo checkout.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
              <div className="w-8 h-8 rounded-xl bg-emerald-600/10 text-emerald-600 flex items-center justify-center font-black text-xs">
                4
              </div>
              <h4 className="text-xs font-extrabold text-slate-900">Direct Artist Payouts</h4>
              <p className="text-[11px] text-slate-500 leading-relaxed">
                Transparent revenue shares and low minimum withdrawal limits paid to Mobile Money.
              </p>
            </div>
          </div>
        </section>

        {/* Leadership & Founder Spotlight */}
        <section className="bg-white border border-slate-200 rounded-3xl p-8 sm:p-12">
          <div className="max-w-4xl mx-auto flex flex-col md:flex-row items-center gap-8 md:gap-12">
            <div className="w-32 h-32 sm:w-40 sm:h-40 rounded-3xl bg-gradient-to-tr from-purple-600 via-indigo-600 to-blue-500 p-1 shrink-0 shadow-xl">
              <div className="w-full h-full rounded-[22px] bg-slate-900 flex items-center justify-center text-white text-3xl font-black">
                BB
              </div>
            </div>

            <div className="space-y-4 text-center md:text-left">
              <div>
                <span className="text-xs font-black uppercase tracking-wider text-purple-600">
                  Founder &amp; Creative Technologist
                </span>
                <h3 className="text-2xl sm:text-3xl font-black text-slate-950">
                  Benir Benjamin
                </h3>
                <p className="text-xs text-slate-500 font-medium mt-0.5">
                  Managing Director, NebeluRw Co. Ltd &bull; Producer, Nebelu Records Studio
                </p>
              </div>

              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                With a deep passion for choral excellence, African gospel harmonies, and modern software engineering, Benir Benjamin founded NebeluRw in Rwanda in 2015. Under his direction, NebeluRw has successfully delivered web projects and studio productions across the country.
              </p>

              <div className="flex flex-wrap items-center justify-center md:justify-start gap-3 pt-2">
                <a
                  href="https://wa.me/250783987223"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-bold hover:bg-emerald-100 transition-colors"
                >
                  <Phone className="w-3.5 h-3.5 text-emerald-600" />
                  <span>+250 783 987 223</span>
                </a>

                <a
                  href="mailto:benirabok@gmail.com"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-50 text-blue-700 border border-blue-200 text-xs font-bold hover:bg-blue-100 transition-colors"
                >
                  <Mail className="w-3.5 h-3.5 text-blue-600" />
                  <span>benirabok@gmail.com</span>
                </a>

                <a
                  href="https://instagram.com/benirbenjamin"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-fuchsia-50 text-fuchsia-700 border border-fuchsia-200 text-xs font-bold hover:bg-fuchsia-100 transition-colors"
                >
                  <InstagramIcon className="w-3.5 h-3.5 text-fuchsia-600" />
                  <span>@benirbenjamin</span>
                </a>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Banner */}
        <section className="bg-gradient-to-r from-purple-700 via-indigo-700 to-purple-800 rounded-3xl p-8 sm:p-12 text-white text-center space-y-6 shadow-xl">
          <h2 className="text-2xl sm:text-3xl font-black">
            Join the Future of Choral &amp; Gospel Music in Rwanda
          </h2>
          <p className="text-xs sm:text-sm text-purple-100 max-w-xl mx-auto leading-relaxed">
            Whether you are a church choir looking to improve rehearsal attendance, or an artist eager to share and monetize your compositions, Voxify Space and NebeluRw are with you every step of the way.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3">
            <Link
              href="/register"
              className="bg-white hover:bg-purple-50 text-purple-900 font-extrabold text-xs sm:text-sm px-6 py-3 rounded-xl shadow-md transition-all active:scale-95"
            >
              Create Free Account
            </Link>
            <Link
              href="/songs/marketplace"
              className="bg-purple-900/60 hover:bg-purple-900 text-white font-bold text-xs sm:text-sm px-5 py-3 rounded-xl border border-purple-400/30 transition-all"
            >
              Browse Music Marketplace
            </Link>
          </div>
        </section>
      </main>

      {/* Global Footer */}
      <Footer />
    </div>
  );
}
