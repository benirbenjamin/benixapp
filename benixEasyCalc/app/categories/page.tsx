import React from 'react';
import { Metadata } from 'next';
import { CATEGORIES } from '../../lib/calculators/categories';
import CategoryCard from '../../components/CategoryCard';
import Breadcrumbs from '../../components/Breadcrumbs';
import AdBanner from '../../components/AdBanner';

export const metadata: Metadata = {
  title: 'Calculator Categories – Browse Tools by Domain | Benix Space',
  description:
    'Browse all calculator categories on Benix Space Easy Calc: Math, Finance, Health, Geometry, Converters, Business, Time, Technology, Education, and Agriculture.',
};

export default function CategoriesPage() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <Breadcrumbs items={[{ label: 'Categories' }]} />

      <div className="max-w-3xl mb-8">
        <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-900 dark:text-white">
          Calculator Categories
        </h1>
        <p className="mt-2 text-sm sm:text-base text-slate-600 dark:text-slate-400">
          Explore specialized calculation suites across twelve core fields. From personal loan interest to body mass index, choose a category to begin.
        </p>
      </div>

      <AdBanner position="top" format="horizontal" />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5 mt-8">
        {CATEGORIES.map((cat) => (
          <CategoryCard key={cat.slug} category={cat} />
        ))}
      </div>
    </div>
  );
}
