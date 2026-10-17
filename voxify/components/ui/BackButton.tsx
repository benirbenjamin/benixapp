'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';

interface BackButtonProps {
  label?: string;
  href?: string;
  className?: string;
}

export function BackButton({ label = 'Back', href, className = '' }: BackButtonProps) {
  const router = useRouter();

  const handleClick = () => {
    if (href) {
      router.push(href);
    } else {
      router.back();
    }
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs sm:text-sm font-semibold transition-all duration-150 cursor-pointer shadow-sm
        bg-white hover:bg-slate-100 text-slate-700 border border-slate-200
        dark:bg-slate-800/90 dark:hover:bg-slate-700 dark:text-slate-200 dark:border-slate-700/80
        active:scale-95 ${className}`}
      aria-label={label}
    >
      <ArrowLeft className="w-4 h-4 text-purple-600 dark:text-purple-400 shrink-0" />
      <span>{label}</span>
    </button>
  );
}
