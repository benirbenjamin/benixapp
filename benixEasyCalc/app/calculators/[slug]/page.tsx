import React from 'react';
import { notFound } from 'next/navigation';
import { Metadata } from 'next';
import Link from 'next/link';
import {
  getCalculatorBySlug,
  ALL_CALCULATORS,
  getRelatedCalculators,
} from '../../../lib/calculators/registry';
import { getCategoryBySlug } from '../../../lib/calculators/categories';
import { getCalculatorMetadata } from '../../../lib/seo/metadata';
import { generateCalculatorSchema } from '../../../lib/seo/schema';
import CalculatorEngine from '../../../components/CalculatorEngine';
import Breadcrumbs from '../../../components/Breadcrumbs';
import CalculatorCard from '../../../components/CalculatorCard';
import FAQAccordion from '../../../components/FAQAccordion';
import AdBanner from '../../../components/AdBanner';
import { Info, HelpCircle, BookOpen, Calculator as CalcIcon, ShieldAlert } from 'lucide-react';

interface PageProps {
  params: {
    slug: string;
  };
}

// Generate static routes for all calculators at build time
export async function generateStaticParams() {
  return ALL_CALCULATORS.map((calc) => ({
    slug: calc.slug,
  }));
}

// Dynamic SEO metadata per calculator
export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const calc = getCalculatorBySlug(params.slug);
  if (!calc) return { title: 'Calculator Not Found' };
  return getCalculatorMetadata(calc);
}

export default function CalculatorPage({ params }: PageProps) {
  const calc = getCalculatorBySlug(params.slug);
  if (!calc) notFound();

  const category = getCategoryBySlug(calc.category);
  const related = getRelatedCalculators(calc, 3);
  const { webAppSchema, breadcrumbSchema, faqSchema } = generateCalculatorSchema(calc);

  const breadcrumbs = [
    { label: 'Calculators', href: '/calculators' },
    { label: category ? category.name : calc.category, href: `/categories/${calc.category}` },
    { label: calc.shortTitle },
  ];

  return (
    <>
      {/* Schema.org Structured Data Injection */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(webAppSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />
      {faqSchema && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
        />
      )}

      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <Breadcrumbs items={breadcrumbs} />

        {/* Top Section: H1 & Intro */}
        <div className="mb-6 max-w-3xl">
          <div className="inline-flex items-center gap-1.5 rounded-full bg-blue-50 px-2.5 py-0.5 text-xs font-semibold text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 mb-2">
            <span className="capitalize">{category ? category.name : calc.category}</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-900 dark:text-white">
            {calc.title}
          </h1>
          <p className="mt-2 text-base text-slate-600 leading-relaxed dark:text-slate-300">
            {calc.description}
          </p>
        </div>

        {/* Top Balanced Ad Unit */}
        <AdBanner position="top" format="horizontal" />

        {/* Main Content Layout: Two Columns on Desktop */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 mt-6">
          {/* Left / Main Column: Calculator Form & Content */}
          <div className="lg:col-span-8 space-y-8">
            {/* Interactive Calculator Component */}
            <CalculatorEngine slug={calc.slug} />

            {/* Disclaimer Callout if present */}
            {calc.disclaimer && (
              <div className="flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50/70 p-4 text-xs leading-relaxed text-amber-900 dark:border-amber-900/50 dark:bg-amber-950/30 dark:text-amber-200">
                <ShieldAlert className="h-5 w-5 flex-shrink-0 text-amber-600 dark:text-amber-400 mt-0.5" />
                <div>
                  <span className="font-bold">Important Notice: </span>
                  {calc.disclaimer}
                </div>
              </div>
            )}

            {/* Formula & Method Card */}
            <div className="rounded-2xl border border-slate-200/80 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400 mb-2">
                <CalcIcon className="h-4 w-4" />
                <span>Formula & Calculation Rule</span>
              </div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                How It Is Calculated
              </h2>

              <div className="my-4 rounded-xl bg-slate-900 p-4 font-mono text-sm text-blue-300 overflow-x-auto shadow-inner">
                {calc.formula}
              </div>

              <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                {calc.formulaExplanation}
              </p>
            </div>

            {/* Practical Step-by-Step Example Card */}
            {calc.example && (
              <div className="rounded-2xl border border-slate-200/80 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
                <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 mb-2">
                  <BookOpen className="h-4 w-4" />
                  <span>Step-by-Step Example</span>
                </div>
                <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                  {calc.example.title}
                </h2>

                <div className="mt-4 space-y-2">
                  {calc.example.steps.map((step, idx) => (
                    <div key={idx} className="flex items-start gap-3 text-sm text-slate-600 dark:text-slate-300">
                      <span className="flex h-5 w-5 items-center justify-center rounded-full bg-blue-100 text-[11px] font-bold text-blue-700 dark:bg-blue-950 dark:text-blue-300 flex-shrink-0 mt-0.5">
                        {idx + 1}
                      </span>
                      <span>{step}</span>
                    </div>
                  ))}
                </div>

                <div className="mt-4 inline-flex items-center rounded-lg bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300">
                  <span>Result: {calc.example.output}</span>
                </div>
              </div>
            )}

            {/* In-Depth Explanation Section */}
            <div className="rounded-2xl border border-slate-200/80 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">
                <Info className="h-4 w-4" />
                <span>Comprehensive Guide</span>
              </div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-3">
                Understanding the {calc.title}
              </h2>
              <div className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed space-y-3">
                <p>{calc.explanation}</p>
                <p>
                  Calculations performed using Benix Space Easy Calc are executed purely within your browser using IEEE 754 floating-point mathematical standards. We never transmit your inputs or figures over network cables, guaranteeing 100% confidential and secure computation.
                </p>
              </div>
            </div>

            {/* Mid Content Ad Banner */}
            <AdBanner position="mid-content" format="horizontal" />

            {/* Frequently Asked Questions Section */}
            {calc.faqs && calc.faqs.length > 0 && (
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400">
                  <HelpCircle className="h-4 w-4" />
                  <span>Common Questions</span>
                </div>
                <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                  Frequently Asked Questions
                </h2>
                <FAQAccordion faqs={calc.faqs} />
              </div>
            )}
          </div>

          {/* Right Column: Desktop Sidebar Rail (Related Calculators & Ad) */}
          <aside className="lg:col-span-4 space-y-6">
            {/* Desktop Sticky Rail Ad */}
            <div className="sticky top-20 space-y-6">
              <AdBanner position="sidebar" format="rectangle" />

              {/* Related Calculators */}
              <div className="rounded-2xl border border-slate-200/80 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
                <h3 className="text-sm font-bold uppercase tracking-wider text-slate-900 dark:text-white mb-4">
                  Related Calculators
                </h3>
                <div className="space-y-3">
                  {related.map((relCalc) => (
                    <Link
                      key={relCalc.slug}
                      href={`/calculators/${relCalc.slug}`}
                      className="group flex flex-col rounded-xl border border-slate-100 p-3 hover:border-blue-200 hover:bg-blue-50/40 transition-colors dark:border-slate-800/80 dark:hover:bg-slate-800/50"
                    >
                      <div className="text-xs font-bold text-slate-900 group-hover:text-blue-600 dark:text-white dark:group-hover:text-blue-400">
                        {relCalc.title}
                      </div>
                      <div className="mt-1 text-[11px] text-slate-500 line-clamp-1 dark:text-slate-400">
                        {relCalc.description}
                      </div>
                    </Link>
                  ))}
                </div>
              </div>

              {/* Category Hub Link */}
              {category && (
                <div className="rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-700 p-5 text-white">
                  <h3 className="text-sm font-bold">
                    Explore More {category.name} Tools
                  </h3>
                  <p className="mt-1.5 text-xs text-blue-100 leading-relaxed">
                    Discover specialized formulas and converters in our {category.name} category hub.
                  </p>
                  <Link
                    href={`/categories/${category.slug}`}
                    className="mt-4 inline-flex items-center justify-center w-full rounded-xl bg-white px-3.5 py-2 text-xs font-bold text-blue-700 hover:bg-blue-50 transition-colors"
                  >
                    View All {category.name} Tools
                  </Link>
                </div>
              )}
            </div>
          </aside>
        </div>

        {/* Bottom Related Section for Mobile & Desktop */}
        <section className="mt-16 pt-10 border-t border-slate-200 dark:border-slate-800">
          <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-6">
            You Might Also Need
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {related.map((r) => (
              <CalculatorCard key={r.slug} calculator={r} />
            ))}
          </div>
        </section>
      </div>
    </>
  );
}
