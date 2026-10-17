import React from 'react';
import { Metadata } from 'next';
import { Mail, MessageSquare, Globe, Clock, CheckCircle } from 'lucide-react';
import Breadcrumbs from '../../components/Breadcrumbs';

export const metadata: Metadata = {
  title: 'Contact Us – BENIX SPACE Easy Calc',
  description:
    'Get in touch with the Benix Space team for calculator suggestions, partnership inquiries, or general support.',
};

export default function ContactPage() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
      <Breadcrumbs items={[{ label: 'Contact Us' }]} />

      <div className="max-w-3xl mb-8">
        <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-900 dark:text-white">
          Contact the Benix Space Team
        </h1>
        <p className="mt-2 text-base text-slate-600 dark:text-slate-300">
          Have a suggestion for a new calculator, found an edge case, or want to collaborate? We would love to hear from you.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Contact Form */}
        <div className="rounded-2xl border border-slate-200/80 bg-white p-6 sm:p-8 dark:border-slate-800 dark:bg-slate-900">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-4">
            Send Us a Message
          </h2>
          <form className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5 dark:text-slate-300">
                Your Name
              </label>
              <input
                type="text"
                required
                placeholder="Jane Doe"
                className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 shadow-xs focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5 dark:text-slate-300">
                Email Address
              </label>
              <input
                type="email"
                required
                placeholder="jane@example.com"
                className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 shadow-xs focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5 dark:text-slate-300">
                Subject
              </label>
              <input
                type="text"
                placeholder="Calculator Suggestion / Feedback"
                className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 shadow-xs focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5 dark:text-slate-300">
                Message
              </label>
              <textarea
                rows={4}
                required
                placeholder="Describe your request or suggestion..."
                className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 shadow-xs focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              />
            </div>
            <button
              type="button"
              className="w-full rounded-xl bg-blue-600 py-3 text-sm font-semibold text-white hover:bg-blue-700 transition-colors shadow-sm"
            >
              Submit Message
            </button>
          </form>
        </div>

        {/* Contact Info Cards */}
        <div className="space-y-5">
          <div className="rounded-2xl border border-slate-200/80 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
            <div className="flex items-center gap-3 mb-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-100 text-blue-600 dark:bg-blue-950 dark:text-blue-400">
                <Globe className="h-5 w-5" />
              </div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">Platform Domain</h3>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Official website: <span className="font-semibold text-blue-600 dark:text-blue-400">easycalc.benix.space</span>
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200/80 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
            <div className="flex items-center gap-3 mb-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-100 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-400">
                <Clock className="h-5 w-5" />
              </div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">Support Response Time</h3>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              We usually respond to feedback, correction requests, and bug reports within 24 to 48 business hours.
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200/80 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
            <div className="flex items-center gap-3 mb-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-purple-100 text-purple-600 dark:bg-purple-950 dark:text-purple-400">
                <CheckCircle className="h-5 w-5" />
              </div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">Suggest a Calculator</h3>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              If there is a calculation you perform frequently that is missing from our catalog, send us the formula and we will add it to the platform!
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
