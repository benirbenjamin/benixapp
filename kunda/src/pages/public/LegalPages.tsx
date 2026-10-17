import React from 'react';
import { useLanguage } from '../../contexts/LanguageContext';

export const Terms: React.FC = () => {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16 prose prose-slate">
      <h1 className="text-3xl font-extrabold text-slate-900 mb-6">Terms of Service</h1>
      <p className="text-sm text-slate-500">Effective Date: October 2026 | Kunda Space</p>

      <h2>1. Age Requirement & Eligibility</h2>
      <p>
        Kunda Space is exclusively intended for natural persons aged eighteen (18) years or older. By registering, you warrant that you are at least 18 years old. Misrepresentation of age is a direct breach of contract and results in immediate account termination.
      </p>

      <h2>2. Account Security & Conduct</h2>
      <p>
        You are solely responsible for maintaining the confidentiality of your credentials. You agree not to upload unlicensed imagery, engage in commercial solicitation, harass other members, or attempt to bypass security or contact restrictions.
      </p>

      <h2>3. Messaging Allowances & Paid Services</h2>
      <p>
        Kunda Space provides free messaging allowances as described on our pricing page. Additional messaging privileges, subscription passes, and contact unlocks require payment via our supported payment gateways. All wallet balances are recorded in our auditable ledger in minor units.
      </p>
    </div>
  );
};

export const Privacy: React.FC = () => {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16 prose prose-slate">
      <h1 className="text-3xl font-extrabold text-slate-900 mb-6">Privacy Policy</h1>
      <p className="text-sm text-slate-500">Effective Date: October 2026 | Kunda Space</p>

      <h2>1. Information We Collect</h2>
      <p>
        We collect display names, email addresses, dates of birth for adult verification, gender identities, relationship intentions, location at the city level, and optional lifestyle preferences. Phone numbers are stored securely and never published publicly.
      </p>

      <h2>2. How We Protect Your Data</h2>
      <p>
        We do not sell personal data to third parties. Phone numbers are only disclosed when you explicitly consent to contact sharing through our Direct Contact Unlock mechanism.
      </p>

      <h2>3. Data Rights & Deletion</h2>
      <p>
        You may request data export or complete account deletion at any time in your Account Settings.
      </p>
    </div>
  );
};

export const CommunityGuidelines: React.FC = () => {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16 prose prose-slate">
      <h1 className="text-3xl font-extrabold text-slate-900 mb-6">Community Guidelines</h1>
      <p className="text-sm text-slate-500">Kunda Space Values: Dignity, Kindness, Respect</p>

      <h2>1. Mutual Respect (Agaciro)</h2>
      <p>
        Treat every member with dignity. Harassment, derogatory comments, unsolicited explicit material, and discrimination based on tribe, ethnicity, religion, or gender will result in permanent removal.
      </p>

      <h2>2. Authenticity</h2>
      <p>
        Use recent, genuine photos of yourself. Do not impersonate public figures or other individuals.
      </p>

      <h2>3. Financial Safety</h2>
      <p>
        Never use Kunda Space to request loans, money transfers, or business solicitations. Report anyone who asks you for money.
      </p>
    </div>
  );
};

export const Contact: React.FC = () => {
  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-16 space-y-8">
      <div className="text-center space-y-3">
        <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900">Contact Kunda Space</h1>
        <p className="text-base text-slate-600">
          Our support and safety team is based in Kigali, Rwanda. We are here to help.
        </p>
      </div>

      <div className="bg-white p-8 rounded-3xl border border-slate-200/80 shadow-card space-y-6">
        <div>
          <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Email Support</h4>
          <p className="text-base font-semibold text-rose-600">support@kunda.space</p>
        </div>
        <div>
          <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Safety & Legal Inquiries</h4>
          <p className="text-base font-semibold text-slate-800">safety@kunda.space</p>
        </div>
        <div>
          <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Location</h4>
          <p className="text-sm text-slate-600">KG 7 Ave, Kigali, Rwanda</p>
        </div>
      </div>
    </div>
  );
};
