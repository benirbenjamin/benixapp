import React from 'react';
import { SeoHead } from '../components/common/SeoHead';

export const PrivacyPage: React.FC = () => (
  <>
    <SeoHead title="Privacy Policy — BenixSpace & NebeluRw Co. Ltd" />
    <div className="bg-slate-50 min-h-screen py-16">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6 glass-card rounded-3xl p-8 sm:p-12 border border-slate-200/80 shadow-xl">
        <h1 className="text-3xl font-extrabold text-slate-900">Privacy Policy</h1>
        <p className="text-slate-600 text-sm leading-relaxed">
          NebeluRw Co. Ltd ("BenixSpace", "we", "our") respects your privacy. This policy details how we handle information when you visit benix.space or interact with our digital ecosystem.
        </p>
        <h2 className="text-xl font-bold text-slate-900">1. Information Collection</h2>
        <p className="text-slate-600 text-sm leading-relaxed">
          We collect privacy-conscious analytics (anonymized session identifiers, page URLs visited, referrer, device type, browser) solely for optimizing website performance and platform metrics.
        </p>
        <h2 className="text-xl font-bold text-slate-900">2. Contact Form Submissions</h2>
        <p className="text-slate-600 text-sm leading-relaxed">
          When you submit inquiries via our contact form, we collect your provided name, email address, subject, and message content to respond to your request.
        </p>
        <h2 className="text-xl font-bold text-slate-900">3. Contact</h2>
        <p className="text-slate-600 text-sm leading-relaxed">
          For any privacy questions, email <strong className="text-slate-800">benirabok@gmail.com</strong>.
        </p>
      </div>
    </div>
  </>
);
