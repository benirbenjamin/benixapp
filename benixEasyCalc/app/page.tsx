import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {
  Search,
  Zap,
  ShieldCheck,
  Smartphone,
  CheckCircle2,
  Sparkles,
  TrendingUp,
  ArrowRight,
  Calculator,
  Compass,
} from 'lucide-react';
import { getPopularCalculators, ALL_CALCULATORS } from '../lib/calculators/registry';
import { CATEGORIES } from '../lib/calculators/categories';
import CalculatorCard from '../components/CalculatorCard';
import CategoryCard from '../components/CategoryCard';
import AdBanner from '../components/AdBanner';

export default function HomePage() {
  const popularCalculators = getPopularCalculators().slice(0, 10);

  return (
    <div className="flex flex-col">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-b from-blue-50/50 via-white to-white py-16 sm:py-24 dark:from-slate-900/60 dark:via-slate-950 dark:to-slate-950">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 relative z-10 text-center">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 rounded-full border border-blue-200 bg-blue-50/80 px-3.5 py-1 text-xs font-semibold text-blue-700 backdrop-blur-xs mb-6 dark:border-blue-900/60 dark:bg-blue-950/40 dark:text-blue-300">
            <Sparkles className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" />
            <span>100+ Free Online Calculators & Converters</span>
          </div>

          {/* Heading */}
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-slate-900 dark:text-white max-w-4xl mx-auto leading-tight">
            Easy Calculations. <br />
            <span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
              One Powerful Platform.
            </span>
          </h1>

          {/* Subheading */}
          <p className="mt-5 text-base sm:text-lg text-slate-600 max-w-2xl mx-auto leading-relaxed dark:text-slate-300">
            Free online calculators for math, finance, health, business, conversions, time, education and everyday calculations. Instant results, zero registration.
          </p>

          {/* Search Trigger */}
          <div className="mt-8 max-w-xl mx-auto">
            <Link
              href="/calculators"
              className="flex items-center justify-between w-full px-5 py-3.5 text-slate-500 bg-white border border-slate-300 rounded-2xl shadow-sm hover:border-blue-400 hover:shadow-md transition-all dark:bg-slate-900 dark:border-slate-800 dark:text-slate-400"
            >
              <div className="flex items-center gap-3">
                <Search className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                <span className="text-sm font-medium">What do you want to calculate?</span>
              </div>
              <span className="rounded-xl bg-blue-600 text-white px-3.5 py-1 text-xs font-semibold">
                Explore
              </span>
            </Link>
          </div>

          {/* Quick Category Pills */}
          <div className="mt-6 flex flex-wrap items-center justify-center gap-2 max-w-3xl mx-auto">
            {CATEGORIES.slice(0, 7).map((cat) => (
              <Link
                key={cat.slug}
                href={`/categories/${cat.slug}`}
                className="rounded-full border border-slate-200 bg-white/80 px-3 py-1 text-xs font-medium text-slate-600 hover:border-blue-300 hover:text-blue-600 hover:bg-blue-50/50 transition-colors dark:border-slate-800 dark:bg-slate-900/60 dark:text-slate-300 dark:hover:text-blue-400"
              >
                {cat.name}
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Top Banner Advertisement Slot (Balanced) */}
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <AdBanner position="top" format="horizontal" />
      </div>

      {/* Popular Calculators Grid */}
      <section className="py-12 bg-white dark:bg-slate-950">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-8 gap-4">
            <div>
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400">
                <TrendingUp className="h-4 w-4" />
                <span>Trending Tools</span>
              </div>
              <h2 className="mt-1 text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
                Popular Calculators
              </h2>
            </div>
            <Link
              href="/calculators"
              className="inline-flex items-center gap-1 text-sm font-semibold text-blue-600 hover:text-blue-700 dark:text-blue-400"
            >
              <span>View all {ALL_CALCULATORS.length} tools</span>
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {popularCalculators.map((calc) => (
              <CalculatorCard key={calc.slug} calculator={calc} />
            ))}
          </div>
        </div>
      </section>

      {/* Browse by Category Section */}
      <section className="py-16 bg-slate-50/70 border-y border-slate-100 dark:bg-slate-900/40 dark:border-slate-800">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <div className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400">
              <Compass className="h-4 w-4" />
              <span>Organized by Field</span>
            </div>
            <h2 className="mt-1 text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
              Explore Calculator Categories
            </h2>
            <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
              Quickly locate specialized formulas, scientific conversions, and financial models designed for everyday precision.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {CATEGORIES.map((cat) => (
              <CategoryCard key={cat.slug} category={cat} />
            ))}
          </div>
        </div>
      </section>

      {/* Why Use Easy Calc Section */}
      <section className="py-16 bg-white dark:bg-slate-950">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
              Why Use Benix Space Easy Calc?
            </h2>
            <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
              Built for speed, privacy, and mathematical reliability across all devices.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="rounded-2xl border border-slate-200/80 p-6 bg-slate-50/50 dark:border-slate-800 dark:bg-slate-900/50">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-100 text-blue-600 dark:bg-blue-950 dark:text-blue-400 mb-4">
                <ShieldCheck className="h-6 w-6" />
              </div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                100% Free & Anonymous
              </h3>
              <p className="mt-2 text-xs leading-relaxed text-slate-500 dark:text-slate-400">
                No registration required, no email capture, and no login walls. Jump straight into calculations with zero friction.
              </p>
            </div>

            <div className="rounded-2xl border border-slate-200/80 p-6 bg-slate-50/50 dark:border-slate-800 dark:bg-slate-900/50">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-100 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-400 mb-4">
                <Zap className="h-6 w-6" />
              </div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Sub-Millisecond Speed
              </h3>
              <p className="mt-2 text-xs leading-relaxed text-slate-500 dark:text-slate-400">
                Calculations execute directly on your local device for instant responsiveness, saving bandwidth and functioning offline.
              </p>
            </div>

            <div className="rounded-2xl border border-slate-200/80 p-6 bg-slate-50/50 dark:border-slate-800 dark:bg-slate-900/50">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-purple-100 text-purple-600 dark:bg-purple-950 dark:text-purple-400 mb-4">
                <Smartphone className="h-6 w-6" />
              </div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Thumb-Friendly Mobile UX
              </h3>
              <p className="mt-2 text-xs leading-relaxed text-slate-500 dark:text-slate-400">
                Crafted mobile-first with large inputs, one-tap copy, easy social sharing, and accessible contrast for smartphones and tablets.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* SEO Informational Content */}
      <section className="py-12 bg-slate-50/50 border-t border-slate-100 dark:bg-slate-900/30 dark:border-slate-800">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 text-slate-600 dark:text-slate-400 text-xs leading-relaxed space-y-4">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">
            About Benix Space Easy Calc
          </h2>
          <p>
            Benix Space Easy Calc is a comprehensive online calculation and conversion suite designed to provide students, professionals, engineers, homeowners, and business owners with fast, mathematically validated answers. From solving complex mortgage interest amortization to finding your exact biological age or converting kilograms to pounds, our modular tools streamline numeric tasks.
          </p>
          <p>
            Every calculator features step-by-step formula breakdowns, real-world examples, and verified mathematical rules. We believe quality utilities should be open, instantaneous, and respect user privacy.
          </p>
        </div>
      </section>
    </div>
  );
}
