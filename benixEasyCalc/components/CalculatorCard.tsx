import React from 'react';
import Link from 'next/link';
import { Calculator, ArrowUpRight, TrendingUp } from 'lucide-react';
import { CalculatorDefinition } from '../lib/calculators/types';

interface CalculatorCardProps {
  calculator: CalculatorDefinition;
}

export default function CalculatorCard({ calculator }: CalculatorCardProps) {
  return (
    <Link
      href={`/calculators/${calculator.slug}`}
      className="group relative flex flex-col justify-between rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs transition-all duration-200 hover:-translate-y-0.5 hover:border-blue-300 hover:shadow-md dark:border-slate-800 dark:bg-slate-900/90 dark:hover:border-blue-700"
    >
      <div>
        {/* Top Header */}
        <div className="flex items-center justify-between gap-2 mb-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600 ring-1 ring-blue-100 transition-colors group-hover:bg-blue-600 group-hover:text-white dark:bg-blue-950/60 dark:text-blue-400 dark:ring-blue-900/40">
            <Calculator className="h-5 w-5" />
          </div>
          <div className="flex items-center gap-1.5">
            {calculator.isPopular && (
              <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-semibold text-amber-700 dark:bg-amber-950/60 dark:text-amber-300">
                <TrendingUp className="h-3 w-3" />
                Popular
              </span>
            )}
            <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-medium text-slate-600 capitalize dark:bg-slate-800 dark:text-slate-400">
              {calculator.category}
            </span>
          </div>
        </div>

        {/* Title */}
        <h3 className="text-base font-bold text-slate-900 group-hover:text-blue-600 transition-colors dark:text-white dark:group-hover:text-blue-400">
          {calculator.title}
        </h3>

        {/* Description */}
        <p className="mt-1.5 text-xs text-slate-500 line-clamp-2 leading-relaxed dark:text-slate-400">
          {calculator.description}
        </p>
      </div>

      {/* Action Footer */}
      <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-semibold text-blue-600 group-hover:text-blue-700 dark:border-slate-800/80 dark:text-blue-400">
        <span>Open Calculator</span>
        <ArrowUpRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
      </div>
    </Link>
  );
}
