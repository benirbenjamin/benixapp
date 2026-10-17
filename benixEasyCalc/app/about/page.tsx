import React from 'react';
import { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { ShieldCheck, Target, Users, Zap, HeartHandshake } from 'lucide-react';
import Breadcrumbs from '../../components/Breadcrumbs';

export const metadata: Metadata = {
  title: 'About Us – BENIX SPACE Easy Calc',
  description:
    'Learn about Benix Space Easy Calc, our mission to provide fast, free, accessible online calculation tools without login barriers or data harvesting.',
};

export default function AboutPage() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
      <Breadcrumbs items={[{ label: 'About Us' }]} />

      <div className="max-w-3xl mb-10">
        <div className="inline-flex items-center gap-2 rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 mb-3">
          <span>Our Story & Mission</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-900 dark:text-white">
          About Benix Space Easy Calc
        </h1>
        <p className="mt-3 text-base text-slate-600 dark:text-slate-300 leading-relaxed">
          Benix Space Easy Calc provides free, lightning-fast online calculation and conversion utilities designed to make numeric problems simple and universally accessible.
        </p>
      </div>

      <div className="space-y-8 text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
        <section className="rounded-2xl border border-slate-200/80 bg-white p-6 sm:p-8 dark:border-slate-800 dark:bg-slate-900">
          <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-3">
            Why We Created Easy Calc
          </h2>
          <p className="mb-4">
            Whether calculating a 30-year home mortgage payment, figuring out fuel expenses for an upcoming road trip, checking body mass index, or converting Rwandan Francs into USD, people need dependable mathematical answers without dealing with bloated software, forced logins, or intrusive pop-up banners.
          </p>
          <p>
            Benix Space Easy Calc was developed by the Benix Space engineering team to deliver a clean, modern, privacy-respecting alternative. Every tool calculates instantly in your browser without sending sensitive personal numbers to remote servers.
          </p>
        </section>

        <section className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <div className="rounded-2xl border border-slate-200/80 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-100 text-blue-600 dark:bg-blue-950 dark:text-blue-400 mb-3">
              <Zap className="h-5 w-5" />
            </div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white mb-1">
              Zero Latency Execution
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              Every formula is computed on the user’s local browser thread, ensuring sub-millisecond calculation speeds even on slow 3G mobile connections.
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200/80 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-100 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-400 mb-3">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white mb-1">
              Strict Privacy Philosophy
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              We never ask for user registration, credit cards, or email addresses to use calculators. Your personal inputs are never recorded.
            </p>
          </div>
        </section>

        <section className="rounded-2xl border border-slate-200/80 bg-white p-6 sm:p-8 dark:border-slate-800 dark:bg-slate-900">
          <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-3">
            Local Relevance & African Inclusion
          </h2>
          <p>
            Unlike many Western-centric calculator platforms that ignore regional currencies and statutory tax guidelines in developing markets, Benix Space Easy Calc provides dedicated African calculation suites including Rwandan Franc (RWF) exchange rates, Rwanda 18% VAT, and Rwanda PAYE salary brackets.
          </p>
        </section>
      </div>
    </div>
  );
}
