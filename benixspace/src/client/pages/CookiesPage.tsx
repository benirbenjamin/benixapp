import React from 'react';
import { SeoHead } from '../components/common/SeoHead';

export const CookiesPage: React.FC = () => (
  <>
    <SeoHead title="Cookie Policy — BenixSpace & NebeluRw Co. Ltd" />
    <div className="bg-slate-50 min-h-screen py-16">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6 glass-card rounded-3xl p-8 sm:p-12 border border-slate-200/80 shadow-xl">
        <h1 className="text-3xl font-extrabold text-slate-900">Cookie Policy</h1>
        <p className="text-slate-600 text-sm leading-relaxed">
          BenixSpace uses essential session identifiers and cookies to manage secure administrator authentication and basic analytics tracking.
        </p>
        <h2 className="text-xl font-bold text-slate-900">Types of Cookies Used</h2>
        <ul className="list-disc pl-5 text-slate-600 text-sm space-y-2">
          <li><strong>Essential Security Cookies:</strong> Used for secure admin sessions.</li>
          <li><strong>Analytics Identifiers:</strong> Anonymous local storage identifiers to prevent duplicate visit counting.</li>
        </ul>
      </div>
    </div>
  </>
);
