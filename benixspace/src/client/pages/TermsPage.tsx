import React from 'react';
import { Link } from 'react-router-dom';
import { SeoHead } from '../components/common/SeoHead';
import { Shield, FileText, CheckCircle2, AlertTriangle, Scale, Lock, DollarSign, MessageSquare, Phone } from 'lucide-react';

export const TermsPage: React.FC = () => {
  return (
    <>
      <SeoHead
        title="Terms of Service & Community Guidelines — BenixSpace"
        description="Review the terms of service, community standards, wallet and affiliate monetization policies, and privacy terms for BenixSpace ecosystem by NebeluRw Co. Ltd."
      />

      <div className="bg-[#0B0E14] text-slate-200 min-h-screen py-12 px-4 sm:px-6 lg:px-8 font-sans">
        <div className="max-w-5xl mx-auto space-y-10">
          
          {/* Header */}
          <div className="text-center space-y-3">
            <span className="text-xs font-bold uppercase tracking-wider text-blue-400 bg-blue-500/10 border border-blue-500/20 px-3.5 py-1.5 rounded-full inline-flex items-center gap-1.5">
              <Scale className="w-3.5 h-3.5" />
              <span>Legal Agreements & Platform Rules</span>
            </span>
            <h1 className="text-3xl sm:text-5xl font-black text-white tracking-tight">
              Terms of Service & Community Guidelines
            </h1>
            <p className="text-slate-400 text-sm sm:text-base max-w-2xl mx-auto">
              Last updated: October 2026 • Published by NebeluRw Co. Ltd (Kigali, Rwanda)
            </p>
          </div>

          {/* Table of Contents Quick Pills */}
          <div className="flex flex-wrap gap-2 justify-center text-xs">
            {['Acceptance of Terms', 'Ecosystem Services', 'Community Moderation', 'Unified Wallet & Bonuses', 'Affiliate Commissions', 'Contact & Inquiries'].map((topic, i) => (
              <span key={i} className="px-3 py-1 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 font-semibold">
                {topic}
              </span>
            ))}
          </div>

          {/* Section 1: Acceptance */}
          <div className="bg-[#0F1420] border border-slate-800 rounded-3xl p-6 sm:p-8 space-y-4 shadow-xl">
            <div className="flex items-center gap-3 text-blue-400">
              <FileText className="w-6 h-6 shrink-0" />
              <h2 className="text-xl font-bold text-white">1. Acceptance of Terms</h2>
            </div>
            <p className="text-slate-300 text-sm leading-relaxed">
              By accessing, browsing, registering for, or interacting with <strong className="text-white">Benix.Space</strong> (including Benix TV, Creator Videos, Live Radio, Benix Marketplace, RollDice Arena, Voxify Music, Kunda Space, and EasyCalc), you enter into a legally binding agreement with <strong className="text-white">NebeluRw Co. Ltd</strong>, registered under the laws of the Republic of Rwanda.
            </p>
            <p className="text-slate-400 text-xs leading-relaxed">
              If you do not agree with any part of these Terms, you must discontinue platform usage immediately. We reserve the right to amend these guidelines periodically. Continued use signifies your acceptance of updated terms.
            </p>
          </div>

          {/* Section 2: Ecosystem Services & Guest Access */}
          <div className="bg-[#0F1420] border border-slate-800 rounded-3xl p-6 sm:p-8 space-y-4 shadow-xl">
            <div className="flex items-center gap-3 text-sky-400">
              <Shield className="w-6 h-6 shrink-0" />
              <h2 className="text-xl font-bold text-white">2. Ecosystem Services & Free Guest Access</h2>
            </div>
            <p className="text-slate-300 text-sm leading-relaxed">
              Visitors may freely browse, stream live television, listen to FM radio, explore public creator videos, and access calculator utilities without creating an account.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs text-slate-300 pt-2">
              <div className="p-3.5 rounded-2xl bg-slate-900/80 border border-slate-800 flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <span><strong>No Account Needed:</strong> Watch live TV, listen to radio broadcasts, browse marketplace listings freely.</span>
              </div>
              <div className="p-3.5 rounded-2xl bg-slate-900/80 border border-slate-800 flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
                <span><strong>Account Required:</strong> Liking videos, subscribing to channels, commenting in live chat, wagering in RollDice, and initiating purchases.</span>
              </div>
            </div>
          </div>

          {/* Section 3: Community Moderation Policy */}
          <div className="bg-[#0F1420] border border-slate-800 rounded-3xl p-6 sm:p-8 space-y-4 shadow-xl">
            <div className="flex items-center gap-3 text-rose-400">
              <AlertTriangle className="w-6 h-6 shrink-0" />
              <h2 className="text-xl font-bold text-white">3. Community Standards & Strict Multilingual Moderation</h2>
            </div>
            <p className="text-slate-300 text-sm leading-relaxed">
              BenixSpace maintains zero tolerance for vulgarity, sexually explicit phrasing, harassment, hate speech, or offensive content across all user nicknames, live chat messages, and video comments.
            </p>
            <ul className="space-y-2 text-xs text-slate-300 list-disc list-inside bg-slate-950/60 p-4 rounded-2xl border border-slate-800">
              <li><strong>Prohibited Language:</strong> Vulgar, anatomically explicit or insulting words in Kinyarwanda (including prohibited sexual and offensive terms), English, and French are automatically blocked by our real-time content moderation engine.</li>
              <li><strong>Respectful Nicknames:</strong> Usernames and author nicknames containing insensitive or vulgar terminology will be blocked from submission.</li>
              <li><strong>Anti-Spam & Contact Privacy:</strong> In public chat channels and matchmaking rooms, sharing unauthorized private telephone numbers or social media handles is filtered to protect user safety until direct contact is voluntarily unlocked.</li>
              <li><strong>Administrative Enforcement:</strong> Administrators reserve the right to restrict or ban any fingerprint or IP address that violates these standards.</li>
            </ul>
          </div>

          {/* Section 4: Unified Wallet & Daily Bonus */}
          <div className="bg-[#0F1420] border border-slate-800 rounded-3xl p-6 sm:p-8 space-y-4 shadow-xl">
            <div className="flex items-center gap-3 text-amber-400">
              <DollarSign className="w-6 h-6 shrink-0" />
              <h2 className="text-xl font-bold text-white">4. Unified Central Wallet, Real Balances & Daily Login Bonuses</h2>
            </div>
            <p className="text-slate-300 text-sm leading-relaxed">
              Every registered user receives a unified wallet that operates seamlessly across all modules.
            </p>
            <div className="space-y-2 text-xs text-slate-300">
              <div className="p-3 rounded-2xl bg-amber-500/10 border border-amber-500/20">
                <strong className="text-amber-300 block mb-0.5">Dual-Wallet Separation Architecture:</strong>
                <p className="text-slate-300">
                  Your <strong className="text-white">Deposit / Real Balance</strong> (funded via Mobile Money MTN / Airtel or Flutterwave) holds your actual deposits and earnings. Your <strong className="text-white">Welcome / Login Bonus Wallet</strong> (including the daily 200 RWF login bonus) is used exclusively for platform exploration, preview unlocking, and trial interactions. Bonus balances cannot be directly withdrawn.
                </p>
              </div>
              <div className="p-3 rounded-2xl bg-slate-900/80 border border-slate-800">
                <strong className="text-emerald-400 block mb-0.5">Instant Deposit & Withdrawal Payouts:</strong>
                <p className="text-slate-400">
                  Real wallet balances may be withdrawn via verified Rwandan Mobile Money. All transactions are logged with immutable cryptographic ledger timestamps.
                </p>
              </div>
            </div>
          </div>

          {/* Section 5: Affiliate Monetization */}
          <div className="bg-[#0F1420] border border-slate-800 rounded-3xl p-6 sm:p-8 space-y-4 shadow-xl">
            <div className="flex items-center gap-3 text-emerald-400">
              <Lock className="w-6 h-6 shrink-0" />
              <h2 className="text-xl font-bold text-white">5. Creator Monetization & 15% Shareable Affiliate Commission</h2>
            </div>
            <p className="text-slate-300 text-sm leading-relaxed">
              BenixSpace empowers creators and community members through transparent cross-platform affiliate monetization:
            </p>
            <p className="text-slate-400 text-xs leading-relaxed">
              Every video, marketplace item, and premium pass includes a unique shareable referral link. When an audience member unlocks or purchases through your link, up to <strong className="text-emerald-400">15% commission</strong> is automatically credited directly to your real earnings wallet, ready for Mobile Money withdrawal.
            </p>
          </div>

          {/* Section 6: Contact & Inquiries */}
          <div className="bg-[#0F1420] border border-slate-800 rounded-3xl p-6 sm:p-8 space-y-4 shadow-xl">
            <div className="flex items-center gap-3 text-blue-400">
              <MessageSquare className="w-6 h-6 shrink-0" />
              <h2 className="text-xl font-bold text-white">6. Inquiries, Executive Feedback & Concierge</h2>
            </div>
            <p className="text-slate-300 text-sm leading-relaxed">
              Have questions regarding these terms, advertising partnerships, copyright notices, or developer inquiries?
            </p>
            <div className="flex flex-col sm:flex-row gap-4 pt-2 text-xs">
              <a
                href="tel:+250783987223"
                className="p-3 rounded-2xl bg-slate-900 border border-slate-800 hover:border-blue-500 text-slate-200 hover:text-white flex items-center gap-2 transition-colors"
              >
                <Phone className="w-4 h-4 text-emerald-400" />
                <span>Executive Line: +250 783 987 223</span>
              </a>
              <Link
                to="/contact"
                className="p-3 rounded-2xl bg-blue-600 hover:bg-blue-500 text-white font-bold flex items-center justify-center gap-2 transition-all shadow-md"
              >
                <MessageSquare className="w-4 h-4" />
                <span>Submit Feedback to Executive Team</span>
              </Link>
            </div>
          </div>

        </div>
      </div>
    </>
  );
};
