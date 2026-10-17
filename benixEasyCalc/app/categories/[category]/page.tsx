import React from 'react';
import { notFound } from 'next/navigation';
import { Metadata } from 'next';
import Link from 'next/link';
import { CATEGORIES, getCategoryBySlug } from '../../../lib/calculators/categories';
import { getCalculatorsByCategory } from '../../../lib/calculators/registry';
import { getCategoryMetadata } from '../../../lib/seo/metadata';
import CalculatorCard from '../../../components/CalculatorCard';
import Breadcrumbs from '../../../components/Breadcrumbs';
import AdBanner from '../../../components/AdBanner';
import FAQAccordion from '../../../components/FAQAccordion';
import { Compass, ArrowRight } from 'lucide-react';

interface PageProps {
  params: {
    category: string;
  };
}

export async function generateStaticParams() {
  return CATEGORIES.map((cat) => ({
    category: cat.slug,
  }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const cat = getCategoryBySlug(params.category);
  if (!cat) return { title: 'Category Not Found' };
  return getCategoryMetadata(cat.name, cat.metaDescription, cat.slug);
}

export default function CategoryPage({ params }: PageProps) {
  const category = getCategoryBySlug(params.category);
  if (!category) notFound();

  const calculators = getCalculatorsByCategory(category.slug);
  const otherCategories = CATEGORIES.filter((c) => c.slug !== category.slug).slice(0, 4);

  const categoryFaqs = [
    {
      question: `Are all ${category.name} calculators free to use?`,
      answer: `Yes, all ${category.name} calculators on Benix Space Easy Calc are 100% free with unlimited calculations and no account registration required.`,
    },
    {
      question: `How accurate are the results in the ${category.name} category?`,
      answer: `Our calculators are mathematically verified against international standards, statutory tax tables, or clinical health equations. However, results are intended for informational purposes.`,
    },
  ];

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <Breadcrumbs
        items={[
          { label: 'Categories', href: '/categories' },
          { label: category.name },
        ]}
      />

      {/* Hero Header */}
      <div className="max-w-3xl mb-8">
        <div className="inline-flex items-center gap-1.5 rounded-full bg-blue-50 px-2.5 py-0.5 text-xs font-semibold text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 mb-2">
          <span>{calculators.length} Tools Available</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-900 dark:text-white">
          {category.name} Calculators
        </h1>
        <p className="mt-2 text-base text-slate-600 dark:text-slate-300 leading-relaxed">
          {category.description}
        </p>
      </div>

      <AdBanner position="top" format="horizontal" />

      {/* Calculators Grid */}
      <div className="mt-8">
        <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-6">
          Featured {category.name} Tools
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {calculators.map((calc) => (
            <CalculatorCard key={calc.slug} calculator={calc} />
          ))}
        </div>
      </div>

      {/* Mid Banner */}
      <AdBanner position="mid-content" format="horizontal" />

      {/* Category FAQs */}
      <div className="mt-12 max-w-3xl">
        <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-4">
          Frequently Asked Questions
        </h2>
        <FAQAccordion faqs={categoryFaqs} />
      </div>

      {/* Related Categories Navigation */}
      <div className="mt-16 pt-8 border-t border-slate-200 dark:border-slate-800">
        <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-4">
          Explore Other Categories
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {otherCategories.map((other) => (
            <Link
              key={other.slug}
              href={`/categories/${other.slug}`}
              className="group rounded-xl border border-slate-200/80 bg-white p-4 hover:border-blue-300 hover:shadow-xs transition-all dark:border-slate-800 dark:bg-slate-900"
            >
              <div className="text-sm font-bold text-slate-900 group-hover:text-blue-600 dark:text-white dark:group-hover:text-blue-400">
                {other.name}
              </div>
              <div className="mt-1 text-xs text-slate-500 line-clamp-1 dark:text-slate-400">
                {other.description}
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
