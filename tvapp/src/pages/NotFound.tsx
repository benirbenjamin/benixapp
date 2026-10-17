import React from 'react';
import { Link } from 'react-router-dom';
import { Radio, ArrowLeft, Home } from 'lucide-react';
import { SEO } from '../components/common/SEO';

export const NotFoundPage: React.FC = () => {
  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center p-6 text-center">
      <SEO title="404 Page Not Found" />
      <div className="w-20 h-20 rounded-3xl bg-rba-blue/10 text-rba-blue flex items-center justify-center mb-6">
        <Radio className="w-10 h-10 animate-pulse" />
      </div>
      <h1 className="text-4xl sm:text-6xl font-black text-slate-900 mb-2">404</h1>
      <h2 className="text-xl font-bold text-slate-700 mb-4">Signal Lost • Page Not Found</h2>
      <p className="text-slate-500 text-xs sm:text-sm max-w-md mb-8">
        The stream or broadcast page you are looking for does not exist or has been relocated.
      </p>
      <div className="flex items-center gap-3">
        <Link
          to="/"
          className="px-6 py-3 rounded-xl bg-rba-navy hover:bg-rba-blue text-white font-bold text-xs flex items-center gap-2 shadow-md transition-colors"
        >
          <Home className="w-4 h-4" /> Go to Homepage
        </Link>
        <Link
          to="/radio"
          className="px-6 py-3 rounded-xl border border-slate-300 text-slate-700 hover:bg-slate-50 font-bold text-xs transition-colors"
        >
          Browse Radio
        </Link>
      </div>
    </div>
  );
};
