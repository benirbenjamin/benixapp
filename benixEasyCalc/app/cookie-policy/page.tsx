import React from 'react';
import { Metadata } from 'next';
import Breadcrumbs from '../../components/Breadcrumbs';

export const metadata: Metadata = {
  title: 'Cookie Policy – BENIX SPACE Easy Calc',
  description: 'Learn about how cookies and session storage are used on Benix Space Easy Calc.',
};

export default function CookiePolicyPage() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
      <Breadcrumbs items={[{ label: 'Cookie Policy' }]} />

      <div className="max-w-3xl mb-8">
        <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-900 dark:text-white">
          Cookie Policy
        </h1>
        <p className="mt-2 text-xs text-slate-500">Last updated: September 2026</p>
      </div>

      <div className="rounded-2xl border border-slate-200/80 bg-white p-6 sm:p-8 space-y-6 text-sm text-slate-600 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300 leading-relaxed">
        <section>
          <h2 className="text-base font-bold text-slate-900 dark:text-white mb-2">What Are Cookies?</h2>
          <p>
            Cookies are small text files placed on your device by websites you visit. They are widely used to make websites work efficiently, save user preferences, and provide analytical information to site owners.
          </p>
        </section>

        <section>
          <h2 className="text-base font-bold text-slate-900 dark:text-white mb-2">How We Use Cookies</h2>
          <p>
            Benix Space Easy Calc uses cookies and browser local/session storage strictly for essential operational purposes:
          </p>
          <ul className="list-disc pl-5 mt-2 space-y-1">
            <li><strong>Essential Functionality:</strong> Remembering calculator inputs within your active browser session.</li>
            <li><strong>Anonymous Analytics:</strong> Maintaining a temporary random session token to avoid counting duplicate visits.</li>
            <li><strong>Advertising:</strong> Third-party advertising partners like Google AdSense may place cookies to serve relevant advertisements.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-base font-bold text-slate-900 dark:text-white mb-2">Managing Your Cookie Preferences</h2>
          <p>
            You can modify your browser settings to decline all cookies or notify you when a cookie is set. Disabling cookies will not hinder your ability to use any calculator on Benix Space.
          </p>
        </section>
      </div>
    </div>
  );
}
