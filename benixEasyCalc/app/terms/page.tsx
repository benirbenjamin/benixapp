import React from 'react';
import { Metadata } from 'next';
import Breadcrumbs from '../../components/Breadcrumbs';

export const metadata: Metadata = {
  title: 'Terms of Service – BENIX SPACE Easy Calc',
  description: 'Terms of Service governing the use of Benix Space Easy Calc platform and online calculation tools.',
};

export default function TermsPage() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
      <Breadcrumbs items={[{ label: 'Terms of Service' }]} />

      <div className="max-w-3xl mb-8">
        <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-900 dark:text-white">
          Terms of Service
        </h1>
        <p className="mt-2 text-xs text-slate-500">Effective Date: September 2026</p>
      </div>

      <div className="rounded-2xl border border-slate-200/80 bg-white p-6 sm:p-8 space-y-6 text-sm text-slate-600 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300 leading-relaxed">
        <section>
          <h2 className="text-base font-bold text-slate-900 dark:text-white mb-2">1. Acceptance of Terms</h2>
          <p>
            By accessing or using Benix Space Easy Calc (easycalc.benix.space), you agree to be bound by these Terms of Service and all applicable laws and regulations.
          </p>
        </section>

        <section>
          <h2 className="text-base font-bold text-slate-900 dark:text-white mb-2">2. Use License & Intellectual Property</h2>
          <p>
            Permission is granted to freely use our online calculators for personal, commercial, academic, or professional purposes. You may not scrape, frame, or replicate our proprietary code, trademarks, or UI architecture without explicit written permission.
          </p>
        </section>

        <section>
          <h2 className="text-base font-bold text-slate-900 dark:text-white mb-2">3. Accuracy of Calculations & Warranties</h2>
          <p>
            While we apply rigorous mathematical verification, the tools and results provided on this website are supplied "as is" without warranty of any kind. You assume full responsibility for decisions made based on outputs from our financial, health, or engineering tools.
          </p>
        </section>

        <section>
          <h2 className="text-base font-bold text-slate-900 dark:text-white mb-2">4. Limitation of Liability</h2>
          <p>
            In no event shall Benix Space, its founders, or operators be liable for any damages (including, without limitation, financial losses, tax penalties, or medical outcomes) arising out of the use or inability to use the tools on this site.
          </p>
        </section>
      </div>
    </div>
  );
}
