'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {
  ShieldAlert,
  ArrowLeft,
  FileCheck2,
  Lock,
  Scale,
  CreditCard,
  Music2,
  AlertTriangle,
  Mail,
  Phone
} from 'lucide-react';
import { Footer } from '@/components/layout/Footer';

export default function TermsPage() {
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
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-50 border border-purple-200 text-purple-700 text-xs font-bold">
            <Scale className="w-3.5 h-3.5" />
            <span>Official Platform Terms &amp; Conditions</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-black text-slate-950 tracking-tight">
            Terms of Service &amp; User Agreement
          </h1>
          <p className="text-xs text-slate-500">
            Last Updated: September 2026 &bull; Effective for all users, choirs, and creators.
          </p>
        </div>

        {/* Highlighted Acceptance Notice */}
        <div className="p-6 rounded-3xl bg-purple-50 border-2 border-purple-300 shadow-sm space-y-2">
          <div className="flex items-center gap-2 text-purple-900 font-extrabold text-sm sm:text-base">
            <ShieldAlert className="w-5 h-5 text-purple-700 shrink-0" />
            <span>MANDATORY AGREEMENT UPON REGISTRATION</span>
          </div>
          <p className="text-xs sm:text-sm text-purple-900/90 leading-relaxed font-semibold">
            When you register, create an account, or use Voxify Space, you explicitly accept and agree to be bound by these Terms and Conditions. If you do not agree with any part of these terms, you must not register or use the platform.
          </p>
        </div>

        {/* Legal Sections */}
        <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-10 space-y-10 shadow-xs text-xs sm:text-sm leading-relaxed text-slate-700">
          {/* Section 1 */}
          <section className="space-y-3">
            <h2 className="text-base sm:text-lg font-black text-slate-950 flex items-center gap-2 border-b border-slate-100 pb-2">
              <span className="w-6 h-6 rounded-lg bg-purple-100 text-purple-700 inline-flex items-center justify-center text-xs font-black">
                1
              </span>
              <span>About Voxify Space &amp; NebeluRw Co. Ltd</span>
            </h2>
            <p>
              Voxify Space (<strong className="text-slate-900">voxify.space</strong>) is owned, operated, and maintained by <strong className="text-slate-900">NebeluRw Co. Ltd</strong>, a technology and digital media company registered and operating in the Republic of Rwanda since 2015.
            </p>
            <p>
              NebeluRw Co. Ltd provides software solutions, website development, and professional music and video production through its division, <strong className="text-slate-900">Nebelu Records Studio</strong>. Throughout these Terms, &ldquo;Voxify Space&rdquo;, &ldquo;we&rdquo;, &ldquo;us&rdquo;, and &ldquo;our&rdquo; refer to NebeluRw Co. Ltd.
            </p>
          </section>

          {/* Section 2 */}
          <section className="space-y-3">
            <h2 className="text-base sm:text-lg font-black text-slate-950 flex items-center gap-2 border-b border-slate-100 pb-2">
              <span className="w-6 h-6 rounded-lg bg-purple-100 text-purple-700 inline-flex items-center justify-center text-xs font-black">
                2
              </span>
              <span>Account Registration &amp; User Roles</span>
            </h2>
            <p>
              To access core choir management features or publish music, you must create an account. You may register as:
            </p>
            <ul className="list-disc pl-5 space-y-1.5 text-slate-600">
              <li>
                <strong className="text-slate-900">Choir Director / Master:</strong> Authorized to create a choir workspace, invite singers, assign songs, schedule rehearsals, and manage vocal voice part audio.
              </li>
              <li>
                <strong className="text-slate-900">Choir Member / Singer:</strong> Granted access by their choir master to view event schedules, download sheet music, and practice vocal parts.
              </li>
              <li>
                <strong className="text-slate-900">Independent Artist / Creator:</strong> Authorized to upload, showcase, and sell original compositions, choral arrangements, and audio tracks on the music marketplace.
              </li>
            </ul>
            <p>
              You agree to provide true, accurate, and current information during registration and keep your login credentials secure. You are solely responsible for all activities under your account.
            </p>
          </section>

          {/* Section 3 */}
          <section className="space-y-3">
            <h2 className="text-base sm:text-lg font-black text-slate-950 flex items-center gap-2 border-b border-slate-100 pb-2">
              <span className="w-6 h-6 rounded-lg bg-purple-100 text-purple-700 inline-flex items-center justify-center text-xs font-black">
                3
              </span>
              <span>Multi-Track Vocal Stems &amp; Practice Files</span>
            </h2>
            <p>
              Voxify Space provides specialized multi-track audio playback (Soprano, Alto, Tenor, Bass stems) to facilitate choir rehearsals and vocal mastery.
            </p>
            <p>
              All audio tracks, stem recordings, and sheet music provided in choir workspaces are strictly licensed for internal rehearsal and devotional or educational choir performance. You agree not to rip, decompile, redistribute, or commercially broadcast practice audio stems without explicit written permission from the copyright owner.
            </p>
          </section>

          {/* Section 4 */}
          <section className="space-y-3">
            <h2 className="text-base sm:text-lg font-black text-slate-950 flex items-center gap-2 border-b border-slate-100 pb-2">
              <span className="w-6 h-6 rounded-lg bg-purple-100 text-purple-700 inline-flex items-center justify-center text-xs font-black">
                4
              </span>
              <span>Music Marketplace &amp; Track Purchases</span>
            </h2>
            <p>
              Voxify Space offers a digital marketplace where verified artists publish songs for digital acquisition.
            </p>
            <ul className="list-disc pl-5 space-y-1.5 text-slate-600">
              <li>
                <strong className="text-slate-900">Preview Clips:</strong> 30-second audio previews are provided free of charge for prospective buyers to verify the song before initiating payment.
              </li>
              <li>
                <strong className="text-slate-900">Digital Good Delivery:</strong> Upon successful Mobile Money or payment confirmation, the full audio file and associated song media are permanently unlocked in the buyer&rsquo;s &ldquo;My Purchases&rdquo; dashboard.
              </li>
              <li>
                <strong className="text-slate-900">Exclusive / Single-Purchase Rules:</strong> Songs configured for exclusive ownership are removed from the public marketplace once successfully purchased by a buyer.
              </li>
              <li>
                <strong className="text-slate-900">Refunds:</strong> Due to the instant delivery nature of digital audio goods, all marketplace transactions are non-refundable once the full track has been accessed, except in cases of verified technical delivery failure.
              </li>
            </ul>
          </section>

          {/* Section 5 */}
          <section className="space-y-3">
            <h2 className="text-base sm:text-lg font-black text-slate-950 flex items-center gap-2 border-b border-slate-100 pb-2">
              <span className="w-6 h-6 rounded-lg bg-purple-100 text-purple-700 inline-flex items-center justify-center text-xs font-black">
                5
              </span>
              <span>Artist Revenue Share, Platform Commission &amp; Payouts</span>
            </h2>
            <p>
              Artists selling on Voxify Space receive earnings according to the platform commission percentage determined by platform administration (configured in the database).
            </p>
            <ul className="list-disc pl-5 space-y-1.5 text-slate-600">
              <li>
                <strong className="text-slate-900">Commission:</strong> The platform deducts a standard platform fee to cover server infrastructure, payment gateway processing, and maintenance costs.
              </li>
              <li>
                <strong className="text-slate-900">Minimum Payout Limit:</strong> Artists may submit a withdrawal request once their available balance reaches the database minimum threshold (e.g., 5,000 RWF).
              </li>
              <li>
                <strong className="text-slate-900">Payout Processing:</strong> Withdrawals are paid via MTN Mobile Money, Airtel Money, or direct Rwandan bank transfer. All payout requests undergo administrative review to prevent fraud before disbursement.
              </li>
            </ul>
          </section>

          {/* Section 6 */}
          <section className="space-y-3">
            <h2 className="text-base sm:text-lg font-black text-slate-950 flex items-center gap-2 border-b border-slate-100 pb-2">
              <span className="w-6 h-6 rounded-lg bg-purple-100 text-purple-700 inline-flex items-center justify-center text-xs font-black">
                6
              </span>
              <span>Intellectual Property &amp; Content Warranties</span>
            </h2>
            <p>
              By uploading songs, lyrics, or sheet music to Voxify Space, you warrant that:
            </p>
            <ul className="list-disc pl-5 space-y-1.5 text-slate-600">
              <li>You are the original composer/owner, or have obtained all necessary licenses, permissions, and rights to publish and sell the material.</li>
              <li>Your uploaded files do not infringe upon any third party&rsquo;s copyright, trademark, privacy, or intellectual property rights.</li>
              <li>You grant NebeluRw Co. Ltd a non-exclusive license to host, stream, and deliver the content to authorized buyers and choir members as contemplated by the service.</li>
            </ul>
            <p>
              NebeluRw Co. Ltd maintains a strict copyright enforcement policy. Any content reported for valid copyright infringement will be suspended immediately.
            </p>
          </section>

          {/* Section 7 */}
          <section className="space-y-3">
            <h2 className="text-base sm:text-lg font-black text-slate-950 flex items-center gap-2 border-b border-slate-100 pb-2">
              <span className="w-6 h-6 rounded-lg bg-purple-100 text-purple-700 inline-flex items-center justify-center text-xs font-black">
                7
              </span>
              <span>Governing Law &amp; Jurisdiction</span>
            </h2>
            <p>
              These Terms and any dispute or claim arising out of them are governed by and construed in accordance with the laws of the Republic of Rwanda. The competent courts in Kigali, Rwanda shall have exclusive jurisdiction over any disputes.
            </p>
          </section>

          {/* Section 8 */}
          <section className="space-y-3">
            <h2 className="text-base sm:text-lg font-black text-slate-950 flex items-center gap-2 border-b border-slate-100 pb-2">
              <span className="w-6 h-6 rounded-lg bg-purple-100 text-purple-700 inline-flex items-center justify-center text-xs font-black">
                8
              </span>
              <span>Contact for Inquiries &amp; Legal Notices</span>
            </h2>
            <p>
              If you have any questions or require legal notices regarding these Terms, please contact NebeluRw Co. Ltd:
            </p>
            <div className="pt-2 flex flex-wrap gap-4 text-xs font-bold text-slate-800">
              <a href="mailto:benirabok@gmail.com" className="flex items-center gap-1.5 text-blue-600 hover:underline">
                <Mail className="w-4 h-4" /> benirabok@gmail.com
              </a>
              <a href="https://wa.me/250783987223" target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 text-emerald-600 hover:underline">
                <Phone className="w-4 h-4" /> +250 783 987 223
              </a>
            </div>
          </section>
        </div>
      </main>

      {/* Global Footer */}
      <Footer />
    </div>
  );
}
