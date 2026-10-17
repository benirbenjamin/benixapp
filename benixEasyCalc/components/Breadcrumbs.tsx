import React from 'react';
import Link from 'next/link';
import { ChevronRight, Home } from 'lucide-react';

export interface BreadcrumbItem {
  label: string;
  href?: string;
}

interface BreadcrumbsProps {
  items: BreadcrumbItem[];
}

export default function Breadcrumbs({ items }: BreadcrumbsProps) {
  return (
    <nav aria-label="Breadcrumb" className="mb-4 flex items-center flex-wrap gap-1.5 text-xs text-slate-500 dark:text-slate-400">
      <Link
        href="/"
        className="flex items-center gap-1 hover:text-blue-600 transition-colors dark:hover:text-blue-400"
      >
        <Home className="h-3.5 w-3.5" />
        <span>Home</span>
      </Link>

      {items.map((item, index) => {
        const isLast = index === items.length - 1;
        return (
          <React.Fragment key={index}>
            <ChevronRight className="h-3 w-3 text-slate-400 dark:text-slate-600 flex-shrink-0" />
            {isLast || !item.href ? (
              <span className="font-semibold text-slate-900 line-clamp-1 dark:text-white" aria-current="page">
                {item.label}
              </span>
            ) : (
              <Link
                href={item.href}
                className="hover:text-blue-600 transition-colors line-clamp-1 dark:hover:text-blue-400"
              >
                {item.label}
              </Link>
            )}
          </React.Fragment>
        );
      })}
    </nav>
  );
}
