'use client';

import React, { useState, useMemo } from 'react';
import { Search, Filter, Calculator } from 'lucide-react';
import { ALL_CALCULATORS } from '../../lib/calculators/registry';
import { CATEGORIES } from '../../lib/calculators/categories';
import CalculatorCard from '../../components/CalculatorCard';
import Breadcrumbs from '../../components/Breadcrumbs';
import AdBanner from '../../components/AdBanner';

export default function AllCalculatorsPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  const filteredCalculators = useMemo(() => {
    return ALL_CALCULATORS.filter((calc) => {
      const matchesCat = selectedCategory === 'all' || calc.category === selectedCategory;
      if (!matchesCat) return false;

      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();

      return (
        calc.title.toLowerCase().includes(q) ||
        calc.description.toLowerCase().includes(q) ||
        calc.keywords.some((k) => k.toLowerCase().includes(q)) ||
        (calc.aliases && calc.aliases.some((a) => a.toLowerCase().includes(q)))
      );
    });
  }, [searchQuery, selectedCategory]);

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <Breadcrumbs items={[{ label: 'Calculators' }]} />

      {/* Header */}
      <div className="max-w-3xl mb-8">
        <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-900 dark:text-white">
          All Online Calculators & Converters
        </h1>
        <p className="mt-2 text-sm sm:text-base text-slate-600 dark:text-slate-400">
          Browse our complete directory of {ALL_CALCULATORS.length} free, instant calculation tools covering finance, mathematics, health, conversions, and everyday life.
        </p>
      </div>

      {/* Search & Filter Bar */}
      <div className="mb-8 space-y-4">
        <div className="relative max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Filter calculators by name or keyword..."
            className="w-full rounded-xl border border-slate-300 bg-white pl-10 pr-4 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 shadow-xs focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:border-slate-800 dark:bg-slate-900 dark:text-white"
          />
        </div>

        {/* Category Pills */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setSelectedCategory('all')}
            className={`rounded-full px-3.5 py-1 text-xs font-semibold transition-colors cursor-pointer ${
              selectedCategory === 'all'
                ? 'bg-blue-600 text-white'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300'
            }`}
          >
            All ({ALL_CALCULATORS.length})
          </button>
          {CATEGORIES.map((cat) => {
            const count = ALL_CALCULATORS.filter((c) => c.category === cat.slug).length;
            const isSelected = selectedCategory === cat.slug;
            return (
              <button
                key={cat.slug}
                onClick={() => setSelectedCategory(cat.slug)}
                className={`rounded-full px-3.5 py-1 text-xs font-semibold transition-colors cursor-pointer ${
                  isSelected
                    ? 'bg-blue-600 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300'
                }`}
              >
                {cat.name} ({count})
              </button>
            );
          })}
        </div>
      </div>

      {/* Top Ad Unit */}
      <AdBanner position="top" format="horizontal" />

      {/* Calculator Grid */}
      {filteredCalculators.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredCalculators.map((calc) => (
            <CalculatorCard key={calc.slug} calculator={calc} />
          ))}
        </div>
      ) : (
        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-12 text-center dark:border-slate-800 dark:bg-slate-900/40">
          <Calculator className="mx-auto h-10 w-10 text-slate-400 mb-3" />
          <h3 className="text-base font-bold text-slate-900 dark:text-white">No calculators match your criteria</h3>
          <p className="mt-1 text-xs text-slate-500">Try clearing your search query or selecting a different category filter.</p>
          <button
            onClick={() => {
              setSearchQuery('');
              setSelectedCategory('all');
            }}
            className="mt-4 inline-flex items-center rounded-xl bg-blue-600 px-4 py-2 text-xs font-semibold text-white"
          >
            Reset Filters
          </button>
        </div>
      )}
    </div>
  );
}
