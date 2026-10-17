'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Search, Menu, X, ChevronDown, Sparkles } from 'lucide-react';
import SearchModal from './SearchModal';

export default function Header() {
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Keyboard shortcut Ctrl+K / Cmd+K to open search
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        setIsSearchOpen(true);
      }
      if (e.key === '/' && !['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement).tagName)) {
        e.preventDefault();
        setIsSearchOpen(true);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <>
      <header
        className={`sticky top-0 z-40 w-full transition-all duration-200 ${
          isScrolled
            ? 'border-b border-slate-200/80 bg-white/95 backdrop-blur-md shadow-sm dark:border-slate-800/80 dark:bg-slate-950/95'
            : 'border-b border-slate-100 bg-white dark:border-slate-800 dark:bg-slate-950'
        }`}
      >
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8 h-16">
          {/* Logo & Brand */}
          <Link href="/" className="flex items-center gap-3 group focus:outline-none">
            <div className="relative h-10 w-10 flex-shrink-0 overflow-hidden rounded-xl bg-blue-50 p-1 ring-1 ring-blue-100 transition-transform group-hover:scale-105 dark:bg-slate-900 dark:ring-blue-900/40">
              <Image
                src="/logo.png"
                alt="Benix Space Easy Calc"
                fill
                sizes="40px"
                priority
                className="object-contain"
              />
            </div>
            <div className="flex flex-col">
              <span className="text-xs font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400">
                BENIX SPACE
              </span>
              <span className="text-lg font-extrabold tracking-tight text-slate-900 dark:text-white flex items-center gap-1.5">
                Easy Calc
                <span className="inline-flex items-center rounded-full bg-blue-50 px-1.5 py-0.5 text-[10px] font-semibold text-blue-700 dark:bg-blue-950/50 dark:text-blue-300">
                  v1.0
                </span>
              </span>
            </div>
          </Link>

          {/* Prominent Search Bar (Desktop) */}
          <div className="hidden md:flex flex-1 max-w-md mx-6">
            <button
              onClick={() => setIsSearchOpen(true)}
              className="w-full flex items-center justify-between px-3.5 py-2 text-sm text-slate-500 bg-slate-100/80 hover:bg-slate-100 border border-slate-200/60 rounded-xl transition-all shadow-inner focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-slate-900/80 dark:hover:bg-slate-900 dark:border-slate-800 dark:text-slate-400"
            >
              <span className="flex items-center gap-2">
                <Search className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                <span>Search 100+ calculators...</span>
              </span>
              <kbd className="inline-flex items-center gap-0.5 rounded border border-slate-300 bg-white px-1.5 py-0.5 text-[10px] font-semibold text-slate-500 shadow-xs dark:border-slate-700 dark:bg-slate-800 dark:text-slate-400">
                ⌘K
              </kbd>
            </button>
          </div>

          {/* Desktop Navigation Links */}
          <nav className="hidden lg:flex items-center gap-1">
            <Link
              href="/"
              className="px-3 py-2 text-sm font-medium text-slate-700 hover:text-blue-600 rounded-lg hover:bg-slate-50 transition-colors dark:text-slate-300 dark:hover:text-blue-400 dark:hover:bg-slate-900"
            >
              Home
            </Link>
            <Link
              href="/calculators"
              className="px-3 py-2 text-sm font-medium text-slate-700 hover:text-blue-600 rounded-lg hover:bg-slate-50 transition-colors dark:text-slate-300 dark:hover:text-blue-400 dark:hover:bg-slate-900"
            >
              All Calculators
            </Link>
            <Link
              href="/categories"
              className="px-3 py-2 text-sm font-medium text-slate-700 hover:text-blue-600 rounded-lg hover:bg-slate-50 transition-colors dark:text-slate-300 dark:hover:text-blue-400 dark:hover:bg-slate-900"
            >
              Categories
            </Link>
            <Link
              href="/categories/finance"
              className="px-3 py-2 text-sm font-medium text-slate-700 hover:text-blue-600 rounded-lg hover:bg-slate-50 transition-colors dark:text-slate-300 dark:hover:text-blue-400 dark:hover:bg-slate-900"
            >
              Finance
            </Link>
            <Link
              href="/categories/math"
              className="px-3 py-2 text-sm font-medium text-slate-700 hover:text-blue-600 rounded-lg hover:bg-slate-50 transition-colors dark:text-slate-300 dark:hover:text-blue-400 dark:hover:bg-slate-900"
            >
              Math
            </Link>
            <Link
              href="/categories/health"
              className="px-3 py-2 text-sm font-medium text-slate-700 hover:text-blue-600 rounded-lg hover:bg-slate-50 transition-colors dark:text-slate-300 dark:hover:text-blue-400 dark:hover:bg-slate-900"
            >
              Health
            </Link>
            <Link
              href="/categories/converters"
              className="px-3 py-2 text-sm font-medium text-slate-700 hover:text-blue-600 rounded-lg hover:bg-slate-50 transition-colors dark:text-slate-300 dark:hover:text-blue-400 dark:hover:bg-slate-900"
            >
              Converters
            </Link>
          </nav>

          {/* Mobile Right Controls */}
          <div className="flex items-center gap-2 lg:hidden">
            <button
              onClick={() => setIsSearchOpen(true)}
              className="p-2 text-slate-600 hover:text-blue-600 rounded-lg hover:bg-slate-100 transition-colors dark:text-slate-400 dark:hover:text-white dark:hover:bg-slate-800"
              aria-label="Search calculators"
            >
              <Search className="h-5 w-5" />
            </button>
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="p-2 text-slate-600 hover:text-blue-600 rounded-lg hover:bg-slate-100 transition-colors dark:text-slate-400 dark:hover:text-white dark:hover:bg-slate-800"
              aria-label="Toggle navigation menu"
            >
              {isMobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Dropdown Menu */}
        {isMobileMenuOpen && (
          <div className="lg:hidden border-b border-slate-200 bg-white px-4 pt-2 pb-6 shadow-xl dark:border-slate-800 dark:bg-slate-950">
            <div className="grid grid-cols-2 gap-2 py-3">
              <Link
                href="/"
                onClick={() => setIsMobileMenuOpen(false)}
                className="flex items-center px-3 py-2.5 text-sm font-medium text-slate-700 rounded-lg hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-900"
              >
                Home
              </Link>
              <Link
                href="/calculators"
                onClick={() => setIsMobileMenuOpen(false)}
                className="flex items-center px-3 py-2.5 text-sm font-medium text-slate-700 rounded-lg hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-900"
              >
                All Calculators
              </Link>
              <Link
                href="/categories"
                onClick={() => setIsMobileMenuOpen(false)}
                className="flex items-center px-3 py-2.5 text-sm font-medium text-slate-700 rounded-lg hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-900"
              >
                Categories
              </Link>
              <Link
                href="/categories/finance"
                onClick={() => setIsMobileMenuOpen(false)}
                className="flex items-center px-3 py-2.5 text-sm font-medium text-slate-700 rounded-lg hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-900"
              >
                Finance
              </Link>
              <Link
                href="/categories/math"
                onClick={() => setIsMobileMenuOpen(false)}
                className="flex items-center px-3 py-2.5 text-sm font-medium text-slate-700 rounded-lg hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-900"
              >
                Math
              </Link>
              <Link
                href="/categories/health"
                onClick={() => setIsMobileMenuOpen(false)}
                className="flex items-center px-3 py-2.5 text-sm font-medium text-slate-700 rounded-lg hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-900"
              >
                Health
              </Link>
              <Link
                href="/categories/time-date"
                onClick={() => setIsMobileMenuOpen(false)}
                className="flex items-center px-3 py-2.5 text-sm font-medium text-slate-700 rounded-lg hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-900"
              >
                Time & Date
              </Link>
              <Link
                href="/categories/converters"
                onClick={() => setIsMobileMenuOpen(false)}
                className="flex items-center px-3 py-2.5 text-sm font-medium text-slate-700 rounded-lg hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-900"
              >
                Converters
              </Link>
              <Link
                href="/categories/business"
                onClick={() => setIsMobileMenuOpen(false)}
                className="flex items-center px-3 py-2.5 text-sm font-medium text-slate-700 rounded-lg hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-900"
              >
                Business
              </Link>
              <Link
                href="/categories/africa"
                onClick={() => setIsMobileMenuOpen(false)}
                className="flex items-center px-3 py-2.5 text-sm font-medium text-emerald-600 rounded-lg hover:bg-emerald-50 dark:text-emerald-400 dark:hover:bg-emerald-950/40"
              >
                Africa & Local
              </Link>
            </div>
          </div>
        )}
      </header>

      {/* Instant Search Modal */}
      <SearchModal isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} />
    </>
  );
}
