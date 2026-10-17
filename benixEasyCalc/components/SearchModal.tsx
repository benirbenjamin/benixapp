'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Search, X, Calculator, ArrowRight, Sparkles, CornerDownLeft } from 'lucide-react';
import { searchCalculators, ALL_CALCULATORS, getPopularCalculators } from '../lib/calculators/registry';
import { CalculatorDefinition } from '../lib/calculators/types';
import { trackEvent } from '../lib/supabase/analytics';

interface SearchModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function SearchModal({ isOpen, onClose }: SearchModalProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<CalculatorDefinition[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  const popular = getPopularCalculators().slice(0, 6);

  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      return;
    }

    const matches = searchCalculators(query);
    setResults(matches);
    setSelectedIndex(0);

    // Track search query event (debounced)
    const timer = setTimeout(() => {
      if (query.trim().length >= 2) {
        trackEvent({
          eventType: 'search_performed',
          metadata: { query: query.trim(), resultCount: matches.length },
        });
      }
    }, 600);

    return () => clearTimeout(timer);
  }, [query]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      onClose();
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      const list = results.length > 0 ? results : popular;
      setSelectedIndex((prev) => (prev + 1) % list.length);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      const list = results.length > 0 ? results : popular;
      setSelectedIndex((prev) => (prev - 1 + list.length) % list.length);
    } else if (e.key === 'Enter') {
      e.preventDefault();
      const list = results.length > 0 ? results : popular;
      if (list[selectedIndex]) {
        router.push(`/calculators/${list[selectedIndex].slug}`);
        onClose();
      }
    }
  };

  if (!isOpen) return null;

  const currentList = results.length > 0 ? results : (query.trim() ? [] : popular);

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center p-4 sm:p-6 md:p-20 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div
        className="w-full max-w-2xl overflow-hidden rounded-2xl bg-white shadow-2xl ring-1 ring-slate-900/10 dark:bg-slate-900 dark:ring-slate-800"
        onClick={(e) => e.stopPropagation()}
        onKeyDown={handleKeyDown}
      >
        {/* Search Input Bar */}
        <div className="relative flex items-center border-b border-slate-200 px-4 py-3.5 dark:border-slate-800">
          <Search className="h-5 w-5 text-blue-600 dark:text-blue-400 flex-shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search calculators (e.g. loan, bmi, percentage, kg, age)..."
            className="w-full bg-transparent pl-3 pr-8 text-base text-slate-900 placeholder:text-slate-400 focus:outline-none dark:text-white"
          />
          <button
            onClick={onClose}
            className="flex-shrink-0 rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800 dark:hover:text-slate-300"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Search Results / Suggestions */}
        <div className="max-h-[60vh] overflow-y-auto p-2">
          {!query.trim() && (
            <div className="px-3 py-2 text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">
              Popular Calculators
            </div>
          )}

          {query.trim() && results.length === 0 && (
            <div className="py-12 text-center text-sm text-slate-500 dark:text-slate-400">
              <p className="font-medium text-slate-700 dark:text-slate-300">No calculators found for "{query}"</p>
              <p className="mt-1 text-xs">Try searching for keywords like "mortgage", "interest", "weight", or "fraction".</p>
            </div>
          )}

          <div className="space-y-1">
            {currentList.map((calc, idx) => {
              const isSelected = idx === selectedIndex;
              return (
                <Link
                  key={calc.slug}
                  href={`/calculators/${calc.slug}`}
                  onClick={onClose}
                  onMouseEnter={() => setSelectedIndex(idx)}
                  className={`flex items-center justify-between rounded-xl px-3.5 py-3 transition-colors ${
                    isSelected
                      ? 'bg-blue-50 text-blue-900 dark:bg-blue-950/60 dark:text-blue-200'
                      : 'hover:bg-slate-50 text-slate-700 dark:text-slate-300 dark:hover:bg-slate-800/60'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`flex h-9 w-9 items-center justify-center rounded-lg ${
                        isSelected
                          ? 'bg-blue-600 text-white'
                          : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
                      }`}
                    >
                      <Calculator className="h-4 w-4" />
                    </div>
                    <div>
                      <div className="text-sm font-semibold">{calc.title}</div>
                      <div className="text-xs text-slate-500 dark:text-slate-400 line-clamp-1">
                        {calc.description}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="hidden sm:inline-flex rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-medium text-slate-600 uppercase dark:bg-slate-800 dark:text-slate-400">
                      {calc.category}
                    </span>
                    <ArrowRight className={`h-4 w-4 ${isSelected ? 'text-blue-600 dark:text-blue-400' : 'text-slate-300 dark:text-slate-600'}`} />
                  </div>
                </Link>
              );
            })}
          </div>
        </div>

        {/* Footer info */}
        <div className="flex items-center justify-between border-t border-slate-100 bg-slate-50/70 px-4 py-2 text-xs text-slate-500 dark:border-slate-800 dark:bg-slate-900/50 dark:text-slate-400">
          <div className="flex items-center gap-2">
            <span>Navigate: <kbd className="rounded border bg-white px-1 dark:bg-slate-800 dark:border-slate-700">↑</kbd> <kbd className="rounded border bg-white px-1 dark:bg-slate-800 dark:border-slate-700">↓</kbd></span>
            <span>Select: <kbd className="rounded border bg-white px-1 dark:bg-slate-800 dark:border-slate-700">↵</kbd></span>
            <span>Close: <kbd className="rounded border bg-white px-1 dark:bg-slate-800 dark:border-slate-700">ESC</kbd></span>
          </div>
          <span className="font-semibold text-blue-600 dark:text-blue-400">BENIX SPACE</span>
        </div>
      </div>
    </div>
  );
}
