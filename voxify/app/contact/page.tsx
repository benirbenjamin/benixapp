'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {
  Phone,
  Mail,
  Send,
  ArrowLeft,
  CheckCircle2,
  Sparkles,
  MapPin,
  Clock,
  MessageSquare
} from 'lucide-react';
import { InstagramIcon } from '@/components/ui/InstagramIcon';
import { Footer } from '@/components/layout/Footer';

export default function ContactPage() {
  const [fullName, setFullName] = useState('');
  const [contactInfo, setContactInfo] = useState('');
  const [subject, setSubject] = useState('General Inquiry');
  const [message, setMessage] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!fullName.trim() || !message.trim()) {
      alert('Please enter your name and message.');
      return;
    }

    const formattedMessage =
`Hello Benir / Voxify Support!

*Name:* ${fullName.trim()}
*Contact:* ${contactInfo.trim() || 'Not provided'}
*Subject:* ${subject}

*Message:*
${message.trim()}

---
_Sent via Voxify Space Contact Form_`;

    const whatsappUrl = `https://wa.me/250783987223?text=${encodeURIComponent(formattedMessage)}`;

    // Open WhatsApp in a new tab
    window.open(whatsappUrl, '_blank', 'noopener,noreferrer');
    setSubmitted(true);
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col justify-between selection:bg-purple-600 selection:text-white">
      {/* Top Navigation Bar */}
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
              href="/songs/marketplace"
              className="hidden sm:inline-flex text-xs font-bold text-slate-600 hover:text-purple-600 px-3 py-2 rounded-xl hover:bg-slate-100 transition-colors"
            >
              Marketplace
            </Link>
            <Link
              href="/about"
              className="hidden sm:inline-flex text-xs font-bold text-slate-600 hover:text-purple-600 px-3 py-2 rounded-xl hover:bg-slate-100 transition-colors"
            >
              About Us
            </Link>
            <Link
              href="/login"
              className="text-xs font-extrabold bg-purple-600 hover:bg-purple-500 text-white px-4 py-2 rounded-xl shadow-xs transition-all"
            >
              Sign In
            </Link>
          </div>
        </div>
      </header>

      {/* Main Contact Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-14">
        {/* Hero Section */}
        <div className="text-center max-w-2xl mx-auto mb-12 space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-50 border border-purple-200 text-purple-700 text-xs font-bold">
            <Sparkles className="w-3.5 h-3.5" />
            <span>We are here to support your musical journey</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-black text-slate-950 tracking-tight">
            Contact Voxify Space &amp; NebeluRw
          </h1>
          <p className="text-sm text-slate-600 leading-relaxed">
            Have questions about choir management, stem audio practice, song purchases, or studio music and video production? Send us a message and we will respond promptly on WhatsApp or Email.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">
          {/* Left Column: Direct Contact Cards (5 cols) */}
          <div className="lg:col-span-5 space-y-6">
            <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 space-y-6 shadow-xs">
              <h2 className="text-lg font-extrabold text-slate-900 border-b border-slate-100 pb-3">
                Direct Contact Channels
              </h2>

              {/* WhatsApp Card */}
              <a
                href="https://wa.me/250783987223"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-start gap-4 p-4 rounded-2xl bg-emerald-50/70 border border-emerald-200/80 hover:bg-emerald-100/70 hover:border-emerald-300 transition-all group cursor-pointer"
              >
                <div className="w-11 h-11 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-sm group-hover:scale-105 transition-transform">
                  <Phone className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-xs font-black uppercase tracking-wider text-emerald-800 block">
                    WhatsApp &amp; Phone (Direct Support)
                  </span>
                  <p className="text-sm font-extrabold text-slate-900 mt-0.5 group-hover:text-emerald-700 transition-colors">
                    +250 783 987 223
                  </p>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Fastest reply &bull; Available daily for choirs &amp; artists
                  </p>
                </div>
              </a>

              {/* Email Card */}
              <a
                href="mailto:benirabok@gmail.com"
                className="flex items-start gap-4 p-4 rounded-2xl bg-blue-50/70 border border-blue-200/80 hover:bg-blue-100/70 hover:border-blue-300 transition-all group cursor-pointer"
              >
                <div className="w-11 h-11 rounded-xl bg-blue-600 text-white flex items-center justify-center shrink-0 shadow-sm group-hover:scale-105 transition-transform">
                  <Mail className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-xs font-black uppercase tracking-wider text-blue-800 block">
                    Official Email
                  </span>
                  <p className="text-sm font-extrabold text-slate-900 mt-0.5 group-hover:text-blue-700 transition-colors break-all">
                    benirabok@gmail.com
                  </p>
                  <p className="text-xs text-slate-500 mt-0.5">
                    For partnerships, billing, licensing &amp; inquiries
                  </p>
                </div>
              </a>

              {/* Instagram Card */}
              <a
                href="https://instagram.com/benirbenjamin"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-start gap-4 p-4 rounded-2xl bg-fuchsia-50/70 border border-fuchsia-200/80 hover:bg-fuchsia-100/70 hover:border-fuchsia-300 transition-all group cursor-pointer"
              >
                <div className="w-11 h-11 rounded-xl bg-gradient-to-tr from-amber-500 via-rose-500 to-fuchsia-600 text-white flex items-center justify-center shrink-0 shadow-sm group-hover:scale-105 transition-transform">
                  <InstagramIcon className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-xs font-black uppercase tracking-wider text-fuchsia-800 block">
                    Instagram Account
                  </span>
                  <p className="text-sm font-extrabold text-slate-900 mt-0.5 group-hover:text-fuchsia-700 transition-colors">
                    @benirbenjamin
                  </p>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Follow updates, music production &amp; creative projects
                  </p>
                </div>
              </a>

              {/* Office & Operations Card */}
              <div className="pt-2 space-y-3 border-t border-slate-100 text-xs text-slate-600">
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-purple-600 shrink-0" />
                  <span>Kigali, Rwanda &bull; NebeluRw Co. Ltd (Est. 2015)</span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-purple-600 shrink-0" />
                  <span>Mon &ndash; Sat: 8:00 AM &ndash; 7:00 PM CAT</span>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Interactive Contact Form (7 cols) */}
          <div className="lg:col-span-7">
            <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 space-y-6 shadow-xs">
              <div>
                <h2 className="text-xl font-black text-slate-950 flex items-center gap-2">
                  <MessageSquare className="w-5 h-5 text-purple-600" />
                  <span>Send a Customized Message</span>
                </h2>
                <p className="text-xs text-slate-500 mt-1">
                  Fill in your details below. Your message will be formatted and directly sent via WhatsApp to <strong className="text-slate-800">+250 783 987 223</strong>.
                </p>
              </div>

              {submitted && (
                <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                  <div>
                    <strong className="font-bold block">WhatsApp message initiated!</strong>
                    <span>If WhatsApp didn’t open automatically, you can also reach out directly via +250 783 987 223 or email benirabok@gmail.com.</span>
                  </div>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Full Name */}
                <div>
                  <label className="text-xs font-bold text-slate-800 block mb-1.5">
                    Your Full Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="e.g. Jean Paul Mugisha"
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-4 py-3 text-xs sm:text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20"
                  />
                </div>

                {/* Email / Phone */}
                <div>
                  <label className="text-xs font-bold text-slate-800 block mb-1.5">
                    Your Email or Phone Number (Optional)
                  </label>
                  <input
                    type="text"
                    value={contactInfo}
                    onChange={(e) => setContactInfo(e.target.value)}
                    placeholder="e.g. +250 78... or name@example.com"
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-4 py-3 text-xs sm:text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20"
                  />
                </div>

                {/* Subject Selector */}
                <div>
                  <label className="text-xs font-bold text-slate-800 block mb-1.5">
                    Subject / Topic
                  </label>
                  <select
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-4 py-3 text-xs sm:text-sm text-slate-900 focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 font-medium"
                  >
                    <option value="General Inquiry">General Inquiry</option>
                    <option value="Choir Workspace & Practice Stems">Choir Workspace &amp; Practice Stems</option>
                    <option value="Song Purchase & Marketplace">Song Purchase &amp; Marketplace</option>
                    <option value="Artist Music Publishing & Payouts">Artist Music Publishing &amp; Payouts</option>
                    <option value="Nebelu Records Music Production">Nebelu Records Studio (Music Production)</option>
                    <option value="Video Production Services">Video Production Services</option>
                    <option value="Website & Software Development">Website &amp; Software Development (NebeluRw)</option>
                  </select>
                </div>

                {/* Message */}
                <div>
                  <label className="text-xs font-bold text-slate-800 block mb-1.5">
                    Your Message *
                  </label>
                  <textarea
                    required
                    rows={5}
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Write your message here... tell us how we can help your choir, project, or music production."
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl p-4 text-xs sm:text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 resize-none"
                  />
                </div>

                {/* Buttons */}
                <div className="pt-2 flex flex-col sm:flex-row items-center gap-3">
                  <button
                    type="submit"
                    className="w-full sm:w-auto flex-1 bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold py-3.5 px-6 rounded-xl shadow-md shadow-emerald-600/20 transition-all flex items-center justify-center gap-2 text-xs sm:text-sm cursor-pointer active:scale-98"
                  >
                    <Send className="w-4 h-4" />
                    <span>Send Message via WhatsApp (+250 783 987 223)</span>
                  </button>

                  <a
                    href={`mailto:benirabok@gmail.com?subject=${encodeURIComponent(`[Voxify Inquiry] ${subject}`)}&body=${encodeURIComponent(`Hello Benir,\n\nMy name is ${fullName || '[Name]'}.\n\n${message}`)}`}
                    className="w-full sm:w-auto px-5 py-3.5 rounded-xl border border-slate-300 hover:border-slate-400 hover:bg-slate-50 text-slate-700 text-xs font-bold transition-all text-center"
                  >
                    Send by Email
                  </a>
                </div>
              </form>
            </div>
          </div>
        </div>
      </main>

      {/* Global Footer */}
      <Footer />
    </div>
  );
}
