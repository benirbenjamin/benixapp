'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {
  ShieldAlert,
  ArrowLeft,
  AlertTriangle,
  FileText,
  Music,
  CreditCard,
  WifiOff,
  HelpCircle,
  Mail,
  Phone
} from 'lucide-react';
import { Footer } from '@/components/layout/Footer';

export default function DisclaimerPage() {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col justify-between selection:bg-purple-600 selection:text-white">
      {/* Top Header */}
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
              <span>Back to Home</span>
            </Link>
            <Link
              href="/register"
              className="text-xs font-extrabold bg-purple-600 hover:bg-purple-500 text-white px-4 py-2 rounded-xl shadow-xs transition-all"
            >
              Register
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-4xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-14 space-y-8">
        {/* Title Header */}
        <div className="space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-50 border border-amber-200 text-amber-800 text-xs font-bold">
            <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
            <span>Legal Disclaimer &amp; Notices</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-black text-slate-950 tracking-tight">
            Platform Disclaimers
          </h1>
          <p className="text-xs text-slate-500">
            Last Updated: September 2026 &bull; Published by NebeluRw Co. Ltd (Kigali, Rwanda).
          </p>
        </div>

        {/* Overview Box */}
        <div className="p-6 rounded-3xl bg-white border border-slate-200 shadow-xs space-y-2">
          <p className="text-xs sm:text-sm text-slate-700 leading-relaxed">
            The information, audio streams, sheet music, and services provided on <strong className="text-slate-950">Voxify Space</strong> (accessible at voxify.space) are provided by <strong className="text-slate-950">NebeluRw Co. Ltd</strong> on an &ldquo;as is&rdquo; and &ldquo;as available&rdquo; basis. Please review the following disclaimers carefully.
          </p>
        </div>

        {/* Disclaimer Cards */}
        <div className="space-y-6">
          {/* Card 1: Music & Copyright */}
          <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 space-y-3 shadow-xs">
            <div className="flex items-center gap-2 text-slate-950 font-extrabold text-base">
              <Music className="w-5 h-5 text-purple-600 shrink-0" />
              <h3>1. User-Uploaded Content &amp; Copyright Disclaimer</h3>
            </div>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
              Voxify Space operates as a technical platform enabling choir masters, vocalists, and musical artists to organize rehearsals and distribute music. We do not independently verify the original authorship of every file uploaded by individual users.
            </p>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
              The responsibility for ensuring that audio files, stems, sheet music PDFs, and lyrics do not violate third-party copyright rests exclusively with the uploader. NebeluRw Co. Ltd disclaims any liability for unauthorized material uploaded by users.
            </p>
            <div className="p-3.5 rounded-2xl bg-purple-50 border border-purple-200 text-purple-900 text-xs font-medium">
              <strong>Copyright Inquiries &amp; Takedowns:</strong> If you believe your copyrighted music was uploaded without permission, please email <a href="mailto:benirabok@gmail.com" className="underline font-bold">benirabok@gmail.com</a> with the track link and proof of ownership. We will take prompt remedial action.
            </div>
          </div>

          {/* Card 2: Audio Preview & Digital Delivery */}
          <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 space-y-3 shadow-xs">
            <div className="flex items-center gap-2 text-slate-950 font-extrabold text-base">
              <FileText className="w-5 h-5 text-blue-600 shrink-0" />
              <h3>2. Audio Previews &amp; Marketplace Transactions</h3>
            </div>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
              Audio previews available on the marketplace and homepage are 30-second clips intended solely for evaluation before purchase. While we ensure high audio encoding, playback fidelity may vary depending on your internet connection, web browser, and device hardware.
            </p>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
              Digital purchases grant immediate access to the full track and rehearsal media. Buyers must ensure they have listened to the preview and evaluated the product before authorizing payment.
            </p>
          </div>

          {/* Card 3: Mobile Money & Payments */}
          <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 space-y-3 shadow-xs">
            <div className="flex items-center gap-2 text-slate-950 font-extrabold text-base">
              <CreditCard className="w-5 h-5 text-emerald-600 shrink-0" />
              <h3>3. Mobile Money &amp; Carrier Payment Processing</h3>
            </div>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
              Payments on Voxify Space are processed via telecommunication carrier networks (including MTN Mobile Money Rwanda and Airtel Money) and integrated payment gateways.
            </p>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
              NebeluRw Co. Ltd is not responsible for delayed confirmation caused by telecommunication carrier outages, USSD prompt timeouts, or incorrect telephone numbers provided by the user during checkout.
            </p>
          </div>

          {/* Card 4: Service Availability */}
          <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 space-y-3 shadow-xs">
            <div className="flex items-center gap-2 text-slate-950 font-extrabold text-base">
              <WifiOff className="w-5 h-5 text-amber-600 shrink-0" />
              <h3>4. Service Availability &amp; Offline Rehearsals</h3>
            </div>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
              NebeluRw Co. Ltd maintains modern cloud infrastructure to provide high availability. However, we do not warrant that the website or stems streaming service will be uninterrupted, error-free, or entirely exempt from server maintenance downtimes.
            </p>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
              Choir conductors are advised to schedule rehearsal preparation in advance and download required sheet music PDFs ahead of time.
            </p>
          </div>

          {/* Card 5: Limitation of Liability */}
          <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 space-y-3 shadow-xs">
            <div className="flex items-center gap-2 text-slate-950 font-extrabold text-base">
              <ShieldAlert className="w-5 h-5 text-rose-600 shrink-0" />
              <h3>5. Limitation of Liability</h3>
            </div>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
              To the maximum extent permitted by Rwandan law, NebeluRw Co. Ltd, its directors, employees, and affiliates shall not be liable for any indirect, incidental, special, consequential, or punitive damages resulting from the use of or inability to use the platform.
            </p>
          </div>

          {/* Contact Box */}
          <div className="bg-slate-100 rounded-3xl p-6 sm:p-8 space-y-3 text-xs sm:text-sm text-slate-700">
            <h4 className="font-extrabold text-slate-950">Questions or Clarifications?</h4>
            <p className="text-slate-600">
              For any questions regarding our disclaimers, please reach out directly:
            </p>
            <div className="flex flex-wrap gap-4 pt-1 font-bold">
              <a href="mailto:benirabok@gmail.com" className="text-blue-600 hover:underline flex items-center gap-1.5">
                <Mail className="w-4 h-4" /> benirabok@gmail.com
              </a>
              <a href="https://wa.me/250783987223" target="_blank" rel="noopener noreferrer" className="text-emerald-600 hover:underline flex items-center gap-1.5">
                <Phone className="w-4 h-4" /> +250 783 987 223
              </a>
            </div>
          </div>
        </div>
      </main>

      {/* Global Footer */}
      <Footer />
    </div>
  );
}
