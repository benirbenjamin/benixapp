import React from 'react';
import { ShieldCheck, Lock, Eye, Database } from 'lucide-react';
import { SEO } from '../components/common/SEO';

export const PrivacyPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-rba-grayBg pb-20">
      <SEO
        title="Privacy & Data Protection Policy | Benix Space TV"
        description="Learn how Benix Space TV respects your privacy, safeguards anonymous streaming telemetry, and protects user data."
      />

      {/* Header */}
      <div className="bg-rba-navy text-white py-14 px-4 sm:px-6 text-center">
        <div className="max-w-3xl mx-auto">
          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-bold uppercase tracking-wider mb-3">
            <ShieldCheck className="w-4 h-4" /> Data Protection & Trust
          </span>
          <h1 className="text-3xl sm:text-5xl font-black mb-3">Privacy Policy</h1>
          <p className="text-slate-300 text-sm sm:text-base">
            Benix Space TV is committed to protecting your privacy and ensuring transparency.
          </p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 -mt-8 space-y-6">
        <div className="bg-white rounded-3xl p-8 sm:p-12 border border-slate-200 shadow-md space-y-8 text-slate-700 text-sm sm:text-base leading-relaxed">
          
          <section className="space-y-3">
            <h2 className="text-xl font-extrabold text-slate-900 flex items-center gap-2">
              <Eye className="w-5 h-5 text-rba-blue" />
              1. Anonymous Audience Telemetry
            </h2>
            <p>
              To maintain reliable streaming servers and understand which broadcasts audiences appreciate, our platform uses anonymous pseudonymous identifiers stored locally in your browser (via LocalStorage/SessionStorage).
            </p>
            <p>
              We do <strong>NOT</strong> collect your name, email, phone number, device camera, microphone, or any sensitive personal communications when you listen to our radio or watch our television streams.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-extrabold text-slate-900 flex items-center gap-2">
              <Database className="w-5 h-5 text-amber-500" />
              2. Data We Process
            </h2>
            <ul className="list-disc pl-5 space-y-2 text-xs sm:text-sm text-slate-600">
              <li><strong>Stream Events:</strong> Play, pause, and station selections to accurately count listener engagement and adjust server bandwidth.</li>
              <li><strong>Device Category:</strong> Whether you are connecting via Mobile, Tablet, or Desktop to provide an optimal media player interface.</li>
              <li><strong>Approximate Region:</strong> Country or general province level geographical routing to ensure stream quality.</li>
              <li><strong>Local Station Favorites:</strong> Stored locally in your browser memory for your convenience.</li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-extrabold text-slate-900 flex items-center gap-2">
              <Lock className="w-5 h-5 text-emerald-600" />
              3. Administrative Security
            </h2>
            <p>
              Administrative accounts for authorized staff are safeguarded with salted bcrypt password hashing and cryptographic JSON Web Tokens (JWT) using role-based access control. All communication between your client and our streaming endpoints is secured using SSL/TLS encryption.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-extrabold text-slate-900">4. Contacting Data Protection Officer</h2>
            <p>
              If you have any questions regarding privacy practices at Benix Space TV, you may contact our office at:
            </p>
            <p className="font-semibold text-slate-900">
              Email: info@benix.space • Web: tv.benix.space
            </p>
          </section>

        </div>
      </div>
    </div>
  );
};
