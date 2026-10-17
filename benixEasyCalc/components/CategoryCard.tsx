import React from 'react';
import Link from 'next/link';
import {
  Calculator,
  DollarSign,
  HeartPulse,
  Clock,
  ArrowLeftRight,
  Shapes,
  Briefcase,
  GraduationCap,
  Sparkles,
  Terminal,
  Tractor,
  Globe,
  ChevronRight,
} from 'lucide-react';
import { CalculatorCategory } from '../lib/calculators/types';
import { getCalculatorsByCategory } from '../lib/calculators/registry';

const ICON_MAP: Record<string, any> = {
  Calculator,
  DollarSign,
  HeartPulse,
  Clock,
  ArrowLeftRight,
  Shapes,
  Briefcase,
  GraduationCap,
  Sparkles,
  Terminal,
  Tractor,
  Globe,
};

interface CategoryCardProps {
  category: CalculatorCategory;
}

export default function CategoryCard({ category }: CategoryCardProps) {
  const IconComponent = ICON_MAP[category.iconName] || Calculator;
  const count = getCalculatorsByCategory(category.slug).length;

  return (
    <Link
      href={`/categories/${category.slug}`}
      className="group relative flex flex-col justify-between rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs transition-all duration-200 hover:-translate-y-0.5 hover:border-blue-300 hover:shadow-md dark:border-slate-800 dark:bg-slate-900/90 dark:hover:border-blue-700"
    >
      <div>
        <div className="flex items-center justify-between gap-3 mb-3">
          <div className={`flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br ${category.color} text-white shadow-sm transition-transform group-hover:scale-105`}>
            <IconComponent className="h-5 w-5" />
          </div>
          <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-semibold text-slate-600 dark:bg-slate-800 dark:text-slate-300">
            {count} Tools
          </span>
        </div>

        <h3 className="text-base font-bold text-slate-900 group-hover:text-blue-600 transition-colors dark:text-white dark:group-hover:text-blue-400">
          {category.name}
        </h3>

        <p className="mt-1.5 text-xs text-slate-500 line-clamp-2 leading-relaxed dark:text-slate-400">
          {category.description}
        </p>
      </div>

      <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-semibold text-blue-600 group-hover:text-blue-700 dark:border-slate-800/80 dark:text-blue-400">
        <span>Explore Category</span>
        <ChevronRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
      </div>
    </Link>
  );
}
