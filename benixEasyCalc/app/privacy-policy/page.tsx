import React from 'react';
import { Metadata } from 'next';
import Breadcrumbs from '../../components/Breadcrumbs';

export const metadata: Metadata = {
  title: 'Privacy Policy – BENIX SPACE Easy Calc',
  description:
    'Privacy Policy for Benix Space Easy Calc. Learn how we handle anonymous visitor telemetry and uphold user privacy without personal data collection.',
};

export default function PrivacyPolicyPage() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
      <Breadcrumbs items={[{ label: 'Privacy Policy' }]} />

      <div className="max-w-3xl mb-8">
        <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-900 dark:text-white">
          Privacy Policy
        </h1>
        <p className="mt-2 text-xs text-slate-500">Last updated: September 2026</p>
      </div>

      <div className="rounded-2xl border border-slate-200/80 bg-white p-6 sm:p-8 space-y-6 text-sm text-slate-600 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300 leading-relaxed">
        <section>
          <h2 className="text-base font-bold text-slate-900 dark:text-white mb-2">
            1. Overview & Privacy Commitment
          </h2>
          <p>
            At Benix Space Easy Calc (accessible from https://easycalc.benix.space), user privacy is our highest operational priority. Our calculation engine is built to execute locally on client browsers. We do not require account registration, and we do not store, transmit, or harvest the numeric inputs you enter into any calculator.
          </p>
        </section>

        <section>
          <h2 className="text-base font-bold text-slate-900 dark:text-white mb-2">
            2. Anonymous Telemetry & Analytics
          </h2>
          <p>
            To monitor website reliability, detect software bugs, and understand which calculators are most popular, we collect aggregated, non-personally identifiable telemetry through our privacy-friendly database. This includes:
          </p>
          <ul className="list-disc pl-5 mt-2 space-y-1">
            <li>Page visits and calculator opening events</li>
            <li>Browser type, operating system family, and device category (mobile, tablet, desktop)</li>
            <li>Referring website or search engine</li>
            <li>Anonymous random session identifiers stored in temporary browser session storage</li>
          </ul>
          <p className="mt-2">
            We never associate these technical logs with your real identity, IP address, or location beyond coarse country/region indicators.
          </p>
        </section>

        <section>
          <h2 className="text-base font-bold text-slate-900 dark:text-white mb-2">
            3. Google AdSense & Third-Party Advertising
          </h2>
          <p>
            We use Google AdSense to serve advertisements on the website. Google, as a third-party vendor, uses cookies to serve ads based on prior visits to this website or other websites on the Internet. Users may opt out of personalized advertising by visiting Google Ads Settings (https://www.google.com/settings/ads).
          </p>
        </section>

        <section>
          <h2 className="text-base font-bold text-slate-900 dark:text-white mb-2">
            4. Children's Privacy
          </h2>
          <p>
            Benix Space Easy Calc does not knowingly collect any Personal Identifiable Information from children under the age of 13.
          </p>
        </section>

        <section>
          <h2 className="text-base font-bold text-slate-900 dark:text-white mb-2">
            5. Contact Information
          </h2>
          <p>
            If you have questions about this Privacy Policy, you may contact us through our Contact page or via email at privacy@easycalc.benix.space.
          </p>
        </section>
      </div>
    </div>
  );
}
