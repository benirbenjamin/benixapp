'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {
  Mail,
  Phone,
  Music,
  Shield,
  Disc3,
  Video,
  Code2
} from 'lucide-react';
import { InstagramIcon } from '@/components/ui/InstagramIcon';

export function Footer() {
  return (
    <footer className="bg-white border-t border-slate-200 text-slate-700 transition-colors">
      {/* Top Value Banner */}
      <div className="bg-slate-50 border-b border-slate-200 py-6 px-4 sm:px-6">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4 text-center md:text-left">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-600/10 border border-purple-600/20 flex items-center justify-center text-purple-600 shrink-0">
              <Disc3 className="w-5 h-5 animate-spin-slow" />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-900">
                A Product of NebeluRw Co. Ltd — Operating in Rwanda since 2015
              </p>
              <p className="text-[11px] text-slate-500">
                Web &amp; Software Development • Nebelu Records Studio (Music &amp; Video Production)
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <a
              href="https://wa.me/250783987223"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 text-xs font-bold transition-all"
            >
              <Phone className="w-3.5 h-3.5 text-emerald-600" />
              <span>WhatsApp Us (+250 783 987 223)</span>
            </a>
            <a
              href="mailto:benirabok@gmail.com"
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 text-xs font-bold transition-all"
            >
              <Mail className="w-3.5 h-3.5 text-blue-600" />
              <span>benirabok@gmail.com</span>
            </a>
          </div>
        </div>
      </div>

      {/* Main Footer Links & Info */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8 lg:gap-12">
          {/* Col 1: Brand & NebeluRw Co. Ltd Overview */}
          <div className="lg:col-span-2 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-purple-600/10 border border-purple-600/20 p-1 flex items-center justify-center">
                <Image src="/logo.png" alt="Voxify Logo" width={32} height={32} className="object-contain" />
              </div>
              <div>
                <span className="font-extrabold text-base text-slate-900 tracking-tight">Voxify Space</span>
                <span className="block text-[10px] font-semibold text-purple-600 uppercase tracking-wider">
                  by NebeluRw Co. Ltd
                </span>
              </div>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed max-w-sm">
              Voxify Space empowers choir leaders, vocalists, gospel musicians, and music directors across Rwanda and beyond with multi-track vocal stems, rehearsal management, sheet music distribution, and a curated digital music marketplace.
            </p>

            <div className="flex items-center gap-3 pt-1">
              <a
                href="https://wa.me/250783987223"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="WhatsApp"
                className="w-8 h-8 rounded-xl bg-slate-100 hover:bg-emerald-500 hover:text-white text-slate-600 flex items-center justify-center transition-all shadow-xs border border-slate-200"
              >
                <Phone className="w-4 h-4" />
              </a>
              <a
                href="https://instagram.com/benirbenjamin"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Instagram"
                className="w-8 h-8 rounded-xl bg-slate-100 hover:bg-gradient-to-tr hover:from-amber-500 hover:to-fuchsia-600 hover:text-white text-slate-600 flex items-center justify-center transition-all shadow-xs border border-slate-200"
              >
                <InstagramIcon className="w-4 h-4" />
              </a>
              <a
                href="mailto:benirabok@gmail.com"
                aria-label="Email"
                className="w-8 h-8 rounded-xl bg-slate-100 hover:bg-blue-600 hover:text-white text-slate-600 flex items-center justify-center transition-all shadow-xs border border-slate-200"
              >
                <Mail className="w-4 h-4" />
              </a>
            </div>
          </div>

          {/* Col 2: Platform Features */}
          <div className="space-y-3">
            <h3 className="text-xs font-black uppercase tracking-wider text-slate-900 flex items-center gap-1.5">
              <Music className="w-3.5 h-3.5 text-purple-600" /> Platform
            </h3>
            <ul className="space-y-2 text-xs">
              <li>
                <Link href="/songs/marketplace" className="text-slate-600 hover:text-purple-600 transition-colors">
                  Music Marketplace
                </Link>
              </li>
              <li>
                <Link href="/dashboard" className="text-slate-600 hover:text-purple-600 transition-colors">
                  Choir Dashboard
                </Link>
              </li>
              <li>
                <Link href="/artist/dashboard" className="text-slate-600 hover:text-purple-600 transition-colors">
                  Artist Portal
                </Link>
              </li>
              <li>
                <Link href="/purchases" className="text-slate-600 hover:text-purple-600 transition-colors">
                  My Purchases
                </Link>
              </li>
              <li>
                <Link href="/pricing" className="text-slate-600 hover:text-purple-600 transition-colors">
                  Plans &amp; Pricing
                </Link>
              </li>
            </ul>
          </div>

          {/* Col 3: Company & NebeluRw */}
          <div className="space-y-3">
            <h3 className="text-xs font-black uppercase tracking-wider text-slate-900 flex items-center gap-1.5">
              <Code2 className="w-3.5 h-3.5 text-blue-600" /> Company
            </h3>
            <ul className="space-y-2 text-xs">
              <li>
                <Link href="/about" className="text-slate-600 hover:text-blue-600 transition-colors font-medium">
                  About NebeluRw Co. Ltd
                </Link>
              </li>
              <li>
                <Link href="/contact" className="text-slate-600 hover:text-blue-600 transition-colors font-medium">
                  Contact Us
                </Link>
              </li>
              <li>
                <span className="text-slate-400 flex items-center gap-1">
                  <Disc3 className="w-3 h-3 text-amber-500" /> Nebelu Records Studio
                </span>
              </li>
              <li>
                <span className="text-slate-400 flex items-center gap-1">
                  <Video className="w-3 h-3 text-rose-500" /> Video Production
                </span>
              </li>
              <li>
                <span className="text-slate-400 flex items-center gap-1">
                  <Code2 className="w-3 h-3 text-emerald-500" /> Website Development
                </span>
              </li>
            </ul>
          </div>

          {/* Col 4: Legal & Policies */}
          <div className="space-y-3">
            <h3 className="text-xs font-black uppercase tracking-wider text-slate-900 flex items-center gap-1.5">
              <Shield className="w-3.5 h-3.5 text-emerald-600" /> Legal &amp; Safety
            </h3>
            <ul className="space-y-2 text-xs">
              <li>
                <Link href="/terms" className="text-slate-600 hover:text-emerald-600 transition-colors font-semibold">
                  Terms &amp; Conditions
                </Link>
              </li>
              <li>
                <Link href="/disclaimer" className="text-slate-600 hover:text-emerald-600 transition-colors font-semibold">
                  Disclaimer Notice
                </Link>
              </li>
              <li>
                <Link href="/register" className="text-slate-600 hover:text-purple-600 transition-colors">
                  Create Account
                </Link>
              </li>
              <li>
                <Link href="/login" className="text-slate-600 hover:text-purple-600 transition-colors">
                  Sign In
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Copyright & Company Registration */}
        <div className="mt-10 pt-6 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500">
          <p>
            &copy; 2015&ndash;{new Date().getFullYear()} <strong className="text-slate-700">NebeluRw Co. Ltd</strong>. All rights reserved. Registered in Rwanda.
          </p>
          <div className="flex items-center gap-4 text-xs">
            <Link href="/terms" className="hover:underline text-slate-600">
              Terms
            </Link>
            <span>&bull;</span>
            <Link href="/disclaimer" className="hover:underline text-slate-600">
              Disclaimer
            </Link>
            <span>&bull;</span>
            <Link href="/contact" className="hover:underline text-slate-600">
              Contact
            </Link>
            <span>&bull;</span>
            <Link href="/about" className="hover:underline text-slate-600">
              About
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
