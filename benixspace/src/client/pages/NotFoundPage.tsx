import React from 'react';
import { Link } from 'react-router-dom';
import { SeoHead } from '../components/common/SeoHead';
import { Rocket, ArrowLeft } from 'lucide-react';

export const NotFoundPage: React.FC = () => (
  <>
    <SeoHead title="404 — Page Not Found | BenixSpace" />
    <div className="bg-slate-50 min-h-screen py-20 flex items-center justify-center">
      <div className="max-w-md mx-auto px-4 text-center space-y-6 glass-card rounded-3xl p-10 border border-slate-200/80 shadow-xl">
        <div className="w-16 h-16 rounded-2xl bg-sky-100 text-sky-600 flex items-center justify-center mx-auto shadow-md">
          <Rocket className="w-8 h-8" />
        </div>
        <h1 className="text-4xl font-extrabold text-slate-900">404</h1>
        <h2 className="text-xl font-bold text-slate-800">Page Not Found</h2>
        <p className="text-slate-600 text-sm leading-relaxed">
          The page or platform route you are looking for does not exist or has been moved.
        </p>
        <div className="pt-2">
          <Link
            to="/"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-sky-600 text-white font-semibold text-sm shadow-md hover:bg-sky-700 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Return to Homepage</span>
          </Link>
        </div>
      </div>
    </div>
  </>
);
