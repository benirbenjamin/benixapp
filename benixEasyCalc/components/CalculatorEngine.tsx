'use client';

import React, { useState, useEffect } from 'react';
import {
  Copy,
  Check,
  Share2,
  Printer,
  RotateCcw,
  Sparkles,
  AlertCircle,
  HelpCircle,
} from 'lucide-react';
import { CalculatorDefinition, CalculationResult } from '../lib/calculators/types';
import { getCalculatorBySlug } from '../lib/calculators/registry';
import { trackEvent } from '../lib/supabase/analytics';
import AdBanner from './AdBanner';

interface CalculatorEngineProps {
  slug: string;
}

export default function CalculatorEngine({ slug }: CalculatorEngineProps) {
  const calculator = getCalculatorBySlug(slug);

  // Initialize inputs state with default values
  const [formValues, setFormValues] = useState<Record<string, any>>(() => {
    if (!calculator) return {};
    const initial: Record<string, any> = {};
    calculator.inputs.forEach((field) => {
      initial[field.id] = field.defaultValue;
    });
    return initial;
  });

  const [result, setResult] = useState<CalculationResult | null>(null);
  const [hasCalculated, setHasCalculated] = useState(false);
  const [copied, setCopied] = useState(false);
  const [shared, setShared] = useState(false);

  // Track calculator opened on mount
  useEffect(() => {
    if (!calculator) return;
    trackEvent({
      eventType: 'calculator_opened',
      calculatorId: calculator.slug,
    });

    // Auto-calculate initial result so page loads with immediate value
    try {
      const initialRes = calculator.calculate(formValues);
      setResult(initialRes);
    } catch (err) {
      console.debug('Initial calculation error', err);
    }
  }, [calculator?.slug]);

  if (!calculator) return null;

  const handleInputChange = (fieldId: string, value: any) => {
    setFormValues((prev) => ({
      ...prev,
      [fieldId]: value,
    }));
  };

  const handleCalculate = (e?: React.FormEvent) => {
    if (e) e.preventDefault();

    try {
      trackEvent({
        eventType: 'calculator_used',
        calculatorId: calculator.slug,
      });

      const res = calculator.calculate(formValues);
      setResult(res);
      setHasCalculated(true);

      if (!res.error) {
        trackEvent({
          eventType: 'calculation_completed',
          calculatorId: calculator.slug,
        });
      }
    } catch (err: any) {
      setResult({
        primary: { label: 'Error', value: 'Calculation Failed' },
        error: err?.message || 'An unexpected error occurred during calculation.',
      });
    }
  };

  const handleReset = () => {
    const defaults: Record<string, any> = {};
    calculator.inputs.forEach((f) => {
      defaults[f.id] = f.defaultValue;
    });
    setFormValues(defaults);
    const initialRes = calculator.calculate(defaults);
    setResult(initialRes);
    setHasCalculated(false);
  };

  const handleCopy = () => {
    if (!result) return;
    const textToCopy = `${calculator.title} Result: ${result.primary.value} ${result.primary.unit || ''} (via easycalc.benix.space)`;
    navigator.clipboard.writeText(textToCopy);
    setCopied(true);
    trackEvent({
      eventType: 'result_copied',
      calculatorId: calculator.slug,
    });
    setTimeout(() => setCopied(false), 2000);
  };

  const handleShare = () => {
    const url = window.location.href;
    if (navigator.share) {
      navigator
        .share({
          title: calculator.title,
          text: `Check out the ${calculator.title} on Benix Space Easy Calc!`,
          url,
        })
        .catch(() => {});
    } else {
      navigator.clipboard.writeText(url);
      setShared(true);
      setTimeout(() => setShared(false), 2000);
    }
    trackEvent({
      eventType: 'result_shared',
      calculatorId: calculator.slug,
    });
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="rounded-2xl border border-slate-200/80 bg-white shadow-xs overflow-hidden dark:border-slate-800 dark:bg-slate-900">
      {/* Calculator Interface Body */}
      <form onSubmit={handleCalculate} className="p-5 sm:p-7">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-6">
          {calculator.inputs.map((field) => (
            <div key={field.id} className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label
                  htmlFor={field.id}
                  className="text-xs font-semibold text-slate-700 uppercase tracking-wider dark:text-slate-300"
                >
                  {field.label}
                </label>
                {field.unit && (
                  <span className="text-[11px] font-medium text-slate-400 dark:text-slate-500">
                    {field.unit}
                  </span>
                )}
              </div>

              {field.type === 'select' ? (
                <select
                  id={field.id}
                  value={formValues[field.id]}
                  onChange={(e) => handleInputChange(field.id, e.target.value)}
                  className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 shadow-xs focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                >
                  {field.options?.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              ) : field.type === 'date' ? (
                <input
                  type="date"
                  id={field.id}
                  value={formValues[field.id]}
                  onChange={(e) => handleInputChange(field.id, e.target.value)}
                  className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 shadow-xs focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                />
              ) : field.type === 'text' ? (
                <input
                  type="text"
                  id={field.id}
                  value={formValues[field.id]}
                  placeholder={field.placeholder}
                  onChange={(e) => handleInputChange(field.id, e.target.value)}
                  className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 shadow-xs focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                />
              ) : (
                <input
                  type="number"
                  id={field.id}
                  value={formValues[field.id]}
                  min={field.min}
                  max={field.max}
                  step={field.step || 'any'}
                  placeholder={field.placeholder}
                  onChange={(e) => handleInputChange(field.id, e.target.value)}
                  className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 shadow-xs focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                />
              )}

              {field.helpText && (
                <p className="text-[11px] text-slate-400 dark:text-slate-500">{field.helpText}</p>
              )}
            </div>
          ))}
        </div>

        {/* Action Buttons: Thumb-friendly on mobile */}
        <div className="flex flex-wrap items-center gap-3 pt-2">
          <button
            type="submit"
            className="flex-1 sm:flex-none px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm rounded-xl shadow-sm hover:shadow transition-all focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-slate-900 cursor-pointer"
          >
            Calculate
          </button>
          <button
            type="button"
            onClick={handleReset}
            className="flex items-center justify-center gap-2 px-4 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-sm rounded-xl transition-colors focus:outline-none dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-slate-200 cursor-pointer"
          >
            <RotateCcw className="h-4 w-4" />
            <span>Reset</span>
          </button>
        </div>
      </form>

      {/* Result Display Section */}
      {result && (
        <div className="border-t border-slate-100 bg-slate-50/70 p-5 sm:p-7 dark:border-slate-800 dark:bg-slate-950/50">
          {result.error ? (
            <div className="flex items-center gap-3 rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800 dark:border-rose-900/50 dark:bg-rose-950/40 dark:text-rose-300">
              <AlertCircle className="h-5 w-5 flex-shrink-0 text-rose-600 dark:text-rose-400" />
              <div>
                <span className="font-semibold">Calculation Error: </span>
                {result.error}
              </div>
            </div>
          ) : (
            <div className="space-y-5">
              {/* Primary Large Result Display */}
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 rounded-2xl bg-white p-5 border border-slate-200/80 shadow-xs dark:bg-slate-900 dark:border-slate-800">
                <div>
                  <div className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                    {result.primary.label}
                  </div>
                  <div className="mt-1 flex items-baseline gap-2">
                    <span className="text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-900 dark:text-white">
                      {result.primary.value}
                    </span>
                    {result.primary.unit && (
                      <span className="text-base font-semibold text-slate-500 dark:text-slate-400">
                        {result.primary.unit}
                      </span>
                    )}
                  </div>
                </div>

                {result.primary.badge && (
                  <span className="self-start sm:self-center inline-flex items-center rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700 dark:bg-blue-950/60 dark:text-blue-300">
                    {result.primary.badge}
                  </span>
                )}
              </div>

              {/* Result Details Grid */}
              {result.details && result.details.length > 0 && (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {result.details.map((detail, idx) => (
                    <div
                      key={idx}
                      className="rounded-xl border border-slate-200/70 bg-white p-3 dark:border-slate-800 dark:bg-slate-900"
                    >
                      <div className="text-[11px] font-medium text-slate-500 dark:text-slate-400 line-clamp-1">
                        {detail.label}
                      </div>
                      <div className="mt-0.5 text-sm font-bold text-slate-900 dark:text-white line-clamp-1">
                        {detail.value}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Summary note */}
              {result.summary && (
                <p className="text-xs text-slate-600 dark:text-slate-300 italic">
                  {result.summary}
                </p>
              )}

              {/* Utility actions: Copy, Share, Print */}
              <div className="flex items-center gap-2 pt-1 border-t border-slate-200/60 dark:border-slate-800">
                <button
                  type="button"
                  onClick={handleCopy}
                  className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-200/80 transition-colors dark:text-slate-300 dark:hover:bg-slate-800 cursor-pointer"
                >
                  {copied ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5" />}
                  <span>{copied ? 'Copied!' : 'Copy Result'}</span>
                </button>

                <button
                  type="button"
                  onClick={handleShare}
                  className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-200/80 transition-colors dark:text-slate-300 dark:hover:bg-slate-800 cursor-pointer"
                >
                  <Share2 className="h-3.5 w-3.5" />
                  <span>{shared ? 'Link Copied!' : 'Share'}</span>
                </button>

                <button
                  type="button"
                  onClick={handlePrint}
                  className="hidden sm:inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-200/80 transition-colors dark:text-slate-300 dark:hover:bg-slate-800 cursor-pointer"
                >
                  <Printer className="h-3.5 w-3.5" />
                  <span>Print</span>
                </button>
              </div>

              {/* Strategic Post-Result Ad Placement Slot (High Viewability & CTR) */}
              <AdBanner position="post-result" format="horizontal" />
            </div>
          )}
        </div>
      )}
    </div>
  );
}
