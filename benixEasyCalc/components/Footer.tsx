import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ShieldCheck, Heart, ArrowUp } from 'lucide-react';
import { CATEGORIES } from '../lib/calculators/categories';

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="border-t border-slate-200 bg-slate-900 text-slate-400 dark:border-slate-800 dark:bg-slate-950">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-8">
          {/* Brand Col */}
          <div className="md:col-span-2 space-y-4">
            <Link href="/" className="flex items-center gap-3">
              <div className="relative h-9 w-9 rounded-xl bg-white p-1">
                <Image
                  src="/logo.png"
                  alt="Benix Space Easy Calc"
                  fill
                  sizes="36px"
                  className="object-contain"
                />
              </div>
              <span className="text-lg font-extrabold text-white tracking-tight">
                BENIX SPACE <span className="text-blue-400">Easy Calc</span>
              </span>
            </Link>

            <p className="text-sm text-slate-400 leading-relaxed max-w-sm">
              Useful calculators for everyday life. Free, instant, and privacy-conscious online calculation tools for finance, math, conversions, fitness, and business.
            </p>

            <div className="flex items-center gap-2 text-xs text-slate-500">
              <ShieldCheck className="h-4 w-4 text-emerald-500" />
              <span>No registration required. 100% Free & Anonymous.</span>
            </div>
          </div>

          {/* Calculator Categories Col 1 */}
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-200 mb-3">
              Calculators
            </h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/calculators/percentage-calculator" className="hover:text-white transition-colors">
                  Percentage Calculator
                </Link>
              </li>
              <li>
                <Link href="/calculators/loan-calculator" className="hover:text-white transition-colors">
                  Loan Calculator
                </Link>
              </li>
              <li>
                <Link href="/calculators/bmi-calculator" className="hover:text-white transition-colors">
                  BMI Calculator
                </Link>
              </li>
              <li>
                <Link href="/calculators/age-calculator" className="hover:text-white transition-colors">
                  Age Calculator
                </Link>
              </li>
              <li>
                <Link href="/calculators/compound-interest-calculator" className="hover:text-white transition-colors">
                  Compound Interest
                </Link>
              </li>
              <li>
                <Link href="/calculators/unit-converter" className="hover:text-white transition-colors">
                  Universal Converter
                </Link>
              </li>
            </ul>
          </div>

          {/* Category Hubs Col 2 */}
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-200 mb-3">
              Categories
            </h3>
            <ul className="space-y-2 text-sm">
              {CATEGORIES.slice(0, 6).map((cat) => (
                <li key={cat.slug}>
                  <Link href={`/categories/${cat.slug}`} className="hover:text-white transition-colors">
                    {cat.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Institutional & Legal Col 3 */}
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-200 mb-3">
              Company & Legal
            </h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/about" className="hover:text-white transition-colors">
                  About Us
                </Link>
              </li>
              <li>
                <Link href="/contact" className="hover:text-white transition-colors">
                  Contact
                </Link>
              </li>
              <li>
                <Link href="/compare/online-calculator-tools" className="hover:text-white transition-colors">
                  Compare Tools
                </Link>
              </li>
              <li>
                <Link href="/privacy-policy" className="hover:text-white transition-colors">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link href="/terms" className="hover:text-white transition-colors">
                  Terms of Service
                </Link>
              </li>
              <li>
                <Link href="/cookie-policy" className="hover:text-white transition-colors">
                  Cookie Policy
                </Link>
              </li>
              <li>
                <Link href="/disclaimer" className="hover:text-white transition-colors">
                  Disclaimer
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Disclaimer Bar */}
        <div className="mt-10 border-t border-slate-800 pt-6 text-xs text-slate-500 leading-relaxed">
          <p>
            <strong>Disclaimer:</strong> The calculators and conversion tools on Benix Space Easy Calc are provided for educational and informational purposes only. Results are estimates and should not replace professional financial, tax, legal, or medical advice.
          </p>
        </div>

        {/* Copyright Bar */}
        <div className="mt-6 flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-slate-800/80 pt-6 text-xs text-slate-500">
          <p>© {currentYear} Benix Space. All rights reserved.</p>
          <div className="flex items-center gap-4">
            <Link href="/admin/login" className="hover:text-slate-400 transition-colors">
              Admin Portal
            </Link>
            <span>•</span>
            <Link href="/sitemap.xml" className="hover:text-slate-400 transition-colors">
              XML Sitemap
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
