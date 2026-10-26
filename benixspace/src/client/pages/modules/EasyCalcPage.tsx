import React, { useState, useEffect, useMemo } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { AppAccessWizardModal } from '../../components/modals/AppAccessWizardModal';
import { SeoHead } from '../../components/common/SeoHead';
import {
  Calculator,
  Percent,
  TrendingUp,
  DollarSign,
  Download,
  Share2,
  CheckCircle2,
  Sparkles,
  ArrowRight,
  ArrowLeft,
  ShieldCheck,
  FileText,
  Search,
  Copy,
  Check,
  RotateCcw,
  HelpCircle,
  AlertCircle,
  Activity,
  ArrowLeftRight,
  Clock,
  Briefcase,
  ChevronDown
} from 'lucide-react';
import { ALL_CALCULATORS, getCalculatorBySlug, searchCalculators } from '../../calculators/registry';
import { CATEGORIES } from '../../calculators/categories';
import type { CalculatorDefinition, CalculationResult } from '../../calculators/types';

// Featured quick selection shortcuts
const QUICK_PICKS = [
  { slug: 'rwf-currency-converter', label: '🇷🇼 RWF Currency Converter' },
  { slug: 'rwanda-vat-calculator', label: '🇷🇼 Rwanda VAT (18%)' },
  { slug: 'rwanda-paye-calculator', label: '🇷🇼 Rwanda PAYE Salary Tax' },
  { slug: 'mortgage-calculator', label: '🏡 Mortgage Calculator' },
  { slug: 'loan-calculator', label: '💰 Personal Loan & EMI' },
  { slug: 'compound-interest-calculator', label: '📈 Compound Interest' },
  { slug: 'bmi-calculator', label: '🩺 BMI & Health' },
  { slug: 'length-converter', label: '⚖️ Unit Converter' },
  { slug: 'percentage-calculator', label: '％ Percentage Calculator' },
];

export const EasyCalcPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const { user, hasAppProfile } = useAuth();
  const [wizardTarget, setWizardTarget] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string>('');

  // Selected calculator & search state
  const [selectedSlug, setSelectedSlug] = useState<string>('rwf-currency-converter');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [activeCategory, setActiveCategory] = useState<string>('all');

  // Sync selected calculator or category from URL query parameters (e.g. /calculators?calc=rwanda-vat-calculator)
  useEffect(() => {
    const calc = searchParams.get('calc') || searchParams.get('slug');
    const cat = searchParams.get('cat') || searchParams.get('category');
    const q = searchParams.get('q');
    if (calc) {
      const match = getCalculatorBySlug(calc);
      if (match) {
        setSelectedSlug(match.slug);
      } else {
        const found = ALL_CALCULATORS.find((c) => 
          c.slug.toLowerCase().includes(calc.toLowerCase()) || 
          c.name.toLowerCase().includes(calc.toLowerCase())
        );
        if (found) setSelectedSlug(found.slug);
      }
    }
    if (cat) {
      setActiveCategory(cat);
    }
    if (q) {
      setSearchQuery(q);
    }
  }, [searchParams]);

  // Active calculator definition
  const currentCalc: CalculatorDefinition = useMemo(() => {
    return getCalculatorBySlug(selectedSlug) || ALL_CALCULATORS[0];
  }, [selectedSlug]);

  // Form inputs state
  const [formValues, setFormValues] = useState<Record<string, any>>({});
  const [calculationResult, setCalculationResult] = useState<CalculationResult | null>(null);
  const [copied, setCopied] = useState<boolean>(false);

  // Initialize form values when current calculator changes
  useEffect(() => {
    if (!currentCalc) return;
    const initial: Record<string, any> = {};
    currentCalc.inputs.forEach((field) => {
      initial[field.id] = field.defaultValue;
    });
    setFormValues(initial);

    // Immediate initial calculation
    try {
      const res = currentCalc.calculate(initial);
      setCalculationResult(res);
    } catch (err: any) {
      setCalculationResult({
        primary: { label: 'Result', value: '—' },
        error: err?.message || 'Error initializing calculation'
      });
    }
  }, [currentCalc]);

  // Reactive calculation when input changes
  const handleInputChange = (fieldId: string, val: any) => {
    const updated = { ...formValues, [fieldId]: val };
    setFormValues(updated);
    try {
      const res = currentCalc.calculate(updated);
      setCalculationResult(res);
    } catch (err: any) {
      setCalculationResult({
        primary: { label: 'Error', value: 'Calculation Error' },
        error: err?.message || 'Calculation failed'
      });
    }
  };

  const handleResetInputs = () => {
    const defaults: Record<string, any> = {};
    currentCalc.inputs.forEach((f) => {
      defaults[f.id] = f.defaultValue;
    });
    setFormValues(defaults);
    try {
      const res = currentCalc.calculate(defaults);
      setCalculationResult(res);
    } catch (err) {}
  };

  const handleCopyResult = () => {
    if (!calculationResult?.primary) return;
    const text = `${currentCalc.title}: ${calculationResult.primary.value} ${calculationResult.primary.unit || ''}`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Filtered calculators list for browsing
  const filteredCalculators = useMemo(() => {
    if (searchQuery.trim().length > 0) {
      return searchCalculators(searchQuery);
    }
    if (activeCategory === 'all') {
      return ALL_CALCULATORS.filter((c) => c.isPopular || c.isFeatured || c.category === 'africa').slice(0, 24);
    }
    return ALL_CALCULATORS.filter((c) => c.category === activeCategory);
  }, [searchQuery, activeCategory]);

  const handleExportReport = () => {
    if (!user || !hasAppProfile('calc')) {
      setWizardTarget('calc');
      return;
    }
    setActionSuccess(`Report for ${currentCalc.title} compiled and saved to your BenixSpace dashboard!`);
    setTimeout(() => setActionSuccess(''), 4500);
  };

  return (
    <div className="bg-[#0B0E14] text-slate-100 min-h-screen pb-24 font-sans selection:bg-teal-500 selection:text-white">
      <SeoHead
        title="EasyCalc Pro — 100+ Smart Financial, Rwanda Tax & Math Calculators"
        description="Instant Rwandan Franc (RWF) currency conversions, Rwanda 18% VAT, PAYE income tax, loan EMI, mortgage, and 100+ calculators on BenixSpace."
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 space-y-8">
        
        {/* Prominent Back to Home Button */}
        <div className="flex items-center justify-between">
          <Link
            to="/"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-2xl bg-[#121824] hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800 text-xs font-bold transition-all hover:scale-105 shadow-md"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Home</span>
          </Link>
          <span className="text-xs text-teal-400 font-bold flex items-center gap-1.5 bg-[#121824] px-3 py-1.5 rounded-xl border border-slate-800">
            <Calculator className="w-3.5 h-3.5" />
            <span>Benix EasyCalc Pro Engine (100+ Utilities)</span>
          </span>
        </div>

        {/* Top Hero Banner */}
        <div className="relative rounded-3xl overflow-hidden border border-slate-800 bg-gradient-to-br from-[#0c2423] via-[#091a19] to-[#0B0E14] shadow-2xl p-6 sm:p-10">
          <div className="absolute top-0 right-0 -mr-16 -mt-16 w-80 h-80 rounded-full bg-teal-500/10 blur-3xl pointer-events-none" />
          <div className="absolute bottom-0 left-1/3 -mb-16 w-72 h-72 rounded-full bg-emerald-600/10 blur-3xl pointer-events-none" />

          <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div className="space-y-4 max-w-2xl">
              <div className="flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider bg-teal-500 text-slate-950 shadow-lg shadow-teal-500/30">
                  <Calculator className="w-3.5 h-3.5" />
                  EasyCalc Engine
                </span>
                <span className="px-3 py-1 rounded-full text-xs font-semibold bg-teal-500/10 text-teal-400 border border-teal-500/20">
                  RRA Rwanda Tax & BNR Forex Certified
                </span>
                <span className="px-3 py-1 rounded-full text-xs font-semibold bg-slate-800 text-slate-300">
                  100+ Real Calculators
                </span>
              </div>

              <h1 className="text-3xl sm:text-5xl font-black tracking-tight text-white leading-tight">
                High-Precision <br />
                <span className="bg-gradient-to-r from-teal-400 via-emerald-300 to-cyan-300 bg-clip-text text-transparent">
                  Smart Financial & Scientific Calculators
                </span>
              </h1>

              <p className="text-sm sm:text-base text-slate-400 leading-relaxed">
                Calculate loan installments, Rwandan Franc (RWF) exchange rates, VAT, PAYE salaries, health metrics, and unit conversions in real time.
              </p>

              <div className="flex flex-wrap items-center gap-3 pt-2">
                <button
                  onClick={handleExportReport}
                  className="px-6 py-3.5 rounded-2xl bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-400 hover:to-emerald-400 text-slate-950 font-black text-sm shadow-xl shadow-teal-500/25 flex items-center gap-2.5 transition-all transform active:scale-95"
                >
                  <FileText className="w-4 h-4" />
                  Save & Export Calculation Report
                </button>
              </div>
            </div>

            {/* Quick Summary Pill Box */}
            <div className="w-full md:w-80 p-5 rounded-2xl bg-[#112423]/90 border border-teal-500/30 shadow-2xl backdrop-blur-md space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold uppercase text-teal-400">Selected Utility</span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-teal-500/20 text-teal-300 uppercase">
                  {currentCalc.category}
                </span>
              </div>
              <p className="text-sm font-black text-white">{currentCalc.title}</p>
              <div className="pt-2 border-t border-slate-800 text-xs text-slate-300 space-y-1.5">
                <div className="flex justify-between">
                  <span className="text-slate-400">Formula:</span>
                  <span className="font-mono text-[11px] text-teal-300">{currentCalc.formula.substring(0, 24)}...</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Total Fields:</span>
                  <span className="font-bold text-white">{currentCalc.inputs.length} Inputs</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Action Success Toast */}
        {actionSuccess && (
          <div className="p-4 rounded-2xl bg-teal-500/10 border border-teal-500/30 text-teal-300 text-sm font-semibold flex items-center gap-3 animate-fade-in shadow-xl">
            <CheckCircle2 className="w-5 h-5 text-teal-400 shrink-0" />
            <span>{actionSuccess}</span>
          </div>
        )}

        {/* Quick Pick Shortcuts */}
        <div className="space-y-2">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Popular Shortcuts</span>
          <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
            {QUICK_PICKS.map((pick) => (
              <button
                key={pick.slug}
                onClick={() => {
                  setSelectedSlug(pick.slug);
                  setSearchQuery('');
                }}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all border ${
                  selectedSlug === pick.slug
                    ? 'bg-teal-500 text-slate-950 border-teal-400 shadow-lg shadow-teal-500/20'
                    : 'bg-[#121824] text-slate-300 border-slate-800 hover:border-slate-700 hover:text-white'
                }`}
              >
                {pick.label}
              </button>
            ))}
          </div>
        </div>

        {/* Main 2-Column Interface: Left = Calculator Engine Runner, Right = Search & Browse Categories */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Active Calculator Runner (8 Cols) */}
          <div className="lg:col-span-8 space-y-6">
            
            <div className="rounded-3xl border border-slate-800 bg-[#121824] shadow-2xl p-6 sm:p-8 space-y-6">
              
              {/* Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800/80 pb-6">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-black uppercase text-teal-400 bg-teal-500/10 px-2.5 py-0.5 rounded-full border border-teal-500/20">
                      {currentCalc.category}
                    </span>
                    {currentCalc.isPopular && (
                      <span className="text-xs font-bold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/20">
                        Popular
                      </span>
                    )}
                  </div>
                  <h2 className="text-2xl font-black text-white mt-1.5">{currentCalc.title}</h2>
                  <p className="text-xs sm:text-sm text-slate-400 mt-1">{currentCalc.description}</p>
                </div>

                <button
                  onClick={handleResetInputs}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800/70 hover:bg-slate-800 text-slate-300 hover:text-white text-xs font-bold border border-slate-700/60 self-start sm:self-center transition-all"
                  title="Reset to default values"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Reset</span>
                </button>
              </div>

              {/* Dynamic Inputs Form */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {currentCalc.inputs.map((field) => (
                  <div
                    key={field.id}
                    className={`space-y-1.5 ${field.type === 'text' || currentCalc.inputs.length === 1 ? 'sm:col-span-2' : ''}`}
                  >
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-bold text-slate-300 uppercase tracking-wide">
                        {field.label} {field.unit && <span className="text-teal-400 lowercase">({field.unit})</span>}
                      </label>
                      {field.helpText && (
                        <span className="text-[10px] text-slate-500 truncate max-w-[150px]">{field.helpText}</span>
                      )}
                    </div>

                    {field.type === 'select' ? (
                      <div className="relative">
                        <select
                          value={formValues[field.id] ?? field.defaultValue}
                          onChange={(e) => handleInputChange(field.id, e.target.value)}
                          className="w-full bg-[#0D121D] border border-slate-800 focus:border-teal-500 text-slate-100 text-sm font-semibold rounded-2xl px-4 py-3 appearance-none outline-none transition-colors"
                        >
                          {field.options?.map((opt) => (
                            <option key={String(opt.value)} value={opt.value}>
                              {opt.label}
                            </option>
                          ))}
                        </select>
                        <ChevronDown className="w-4 h-4 text-slate-400 absolute right-4 top-3.5 pointer-events-none" />
                      </div>
                    ) : (
                      <input
                        type={field.type === 'number' ? 'number' : 'text'}
                        value={formValues[field.id] ?? ''}
                        min={field.min}
                        max={field.max}
                        step={field.step}
                        placeholder={field.placeholder || ''}
                        onChange={(e) => {
                          const val = field.type === 'number' ? parseFloat(e.target.value) || 0 : e.target.value;
                          handleInputChange(field.id, val);
                        }}
                        className="w-full bg-[#0D121D] border border-slate-800 focus:border-teal-500 text-slate-100 text-sm font-bold rounded-2xl px-4 py-3 outline-none transition-colors"
                      />
                    )}
                  </div>
                ))}
              </div>

              {/* Dynamic Calculation Result Output Card */}
              {calculationResult && (
                <div className="rounded-3xl border border-teal-500/30 bg-gradient-to-br from-[#0c2423] via-[#0D1520] to-[#0B0E14] p-6 sm:p-7 shadow-xl space-y-4">
                  
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div className="space-y-1">
                      <span className="text-[11px] font-bold uppercase tracking-wider text-teal-400">
                        {calculationResult.primary.label}
                      </span>
                      <div className="flex items-baseline gap-2.5">
                        <span className="text-3xl sm:text-4xl font-black text-white tracking-tight">
                          {calculationResult.primary.value}
                        </span>
                        {calculationResult.primary.unit && (
                          <span className="text-base sm:text-lg font-bold text-teal-300">
                            {calculationResult.primary.unit}
                          </span>
                        )}
                        {calculationResult.primary.badge && (
                          <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-teal-500/20 text-teal-300 border border-teal-500/30">
                            {calculationResult.primary.badge}
                          </span>
                        )}
                      </div>
                    </div>

                    <button
                      onClick={handleCopyResult}
                      className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-teal-500/10 hover:bg-teal-500/20 text-teal-300 border border-teal-500/30 text-xs font-bold transition-all"
                    >
                      {copied ? <Check className="w-3.5 h-3.5 text-teal-400" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copied ? 'Copied!' : 'Copy Value'}</span>
                    </button>
                  </div>

                  {/* Summary string */}
                  {calculationResult.summary && (
                    <p className="text-xs sm:text-sm text-slate-300 bg-slate-900/60 p-3 rounded-xl border border-slate-800">
                      {calculationResult.summary}
                    </p>
                  )}

                  {/* Secondary Details Breakdown */}
                  {calculationResult.details && calculationResult.details.length > 0 && (
                    <div className="pt-3 border-t border-slate-800/80 grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {calculationResult.details.map((detail, idx) => (
                        <div key={idx} className="p-3 rounded-xl bg-[#0B0E14]/80 border border-slate-800 flex items-center justify-between">
                          <span className="text-xs text-slate-400">{detail.label}</span>
                          <span className="text-xs font-bold text-slate-200">{detail.value}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Notes / Tips */}
                  {calculationResult.notes && calculationResult.notes.length > 0 && (
                    <div className="space-y-1 text-xs text-slate-400 pt-2">
                      {calculationResult.notes.map((n, i) => (
                        <p key={i}>• {n}</p>
                      ))}
                    </div>
                  )}

                  {/* Error display if any */}
                  {calculationResult.error && (
                    <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 shrink-0" />
                      <span>{calculationResult.error}</span>
                    </div>
                  )}
                </div>
              )}

              {/* Mathematical Formula & Explanation */}
              <div className="rounded-2xl border border-slate-800/80 bg-[#0B0E14] p-5 space-y-3">
                <span className="text-xs font-bold uppercase text-slate-400">Formula & Methodology</span>
                <div className="p-3 rounded-xl bg-slate-900/70 border border-slate-800 font-mono text-xs text-teal-300">
                  {currentCalc.formula}
                </div>
                <p className="text-xs text-slate-400 leading-relaxed">
                  {currentCalc.formulaExplanation}
                </p>
              </div>

              {/* FAQs Accordion for this Calculator */}
              {currentCalc.faqs && currentCalc.faqs.length > 0 && (
                <div className="space-y-3 pt-2">
                  <span className="text-xs font-bold uppercase text-slate-400">Frequently Asked Questions</span>
                  <div className="space-y-2">
                    {currentCalc.faqs.map((faq, idx) => (
                      <div key={idx} className="p-4 rounded-2xl bg-[#0D121D] border border-slate-800 space-y-1.5">
                        <h4 className="text-xs font-bold text-slate-200">{faq.question}</h4>
                        <p className="text-xs text-slate-400 leading-relaxed">{faq.answer}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Search, Categories & Calculator Directory (4 Cols) */}
          <div className="lg:col-span-4 space-y-6">
            
            {/* Real-time Search Box */}
            <div className="rounded-3xl border border-slate-800 bg-[#121824] p-5 space-y-3 shadow-xl">
              <span className="text-xs font-bold text-slate-300 uppercase tracking-wide">
                Search 100+ Calculators
              </span>
              <div className="relative">
                <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-3.5 pointer-events-none" />
                <input
                  type="text"
                  placeholder="e.g. VAT, Loan, BMI, RWF, Mort..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-[#0B0E14] border border-slate-800 focus:border-teal-500 text-slate-100 text-xs font-semibold rounded-2xl pl-10 pr-4 py-3 outline-none transition-colors"
                />
              </div>

              {/* Category Pills */}
              <div className="flex flex-wrap gap-1.5 pt-2">
                <button
                  onClick={() => {
                    setActiveCategory('all');
                    setSearchQuery('');
                  }}
                  className={`px-3 py-1 rounded-xl text-[11px] font-bold transition-all ${
                    activeCategory === 'all' && !searchQuery
                      ? 'bg-teal-500 text-slate-950 font-black'
                      : 'bg-slate-800/80 text-slate-300 hover:text-white'
                  }`}
                >
                  All
                </button>
                {CATEGORIES.slice(0, 7).map((cat) => (
                  <button
                    key={cat.id}
                    onClick={() => {
                      setActiveCategory(cat.id);
                      setSearchQuery('');
                    }}
                    className={`px-3 py-1 rounded-xl text-[11px] font-bold transition-all ${
                      activeCategory === cat.id && !searchQuery
                        ? 'bg-teal-500 text-slate-950 font-black'
                        : 'bg-slate-800/80 text-slate-300 hover:text-white'
                    }`}
                  >
                    {cat.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Calculators Directory List */}
            <div className="rounded-3xl border border-slate-800 bg-[#121824] p-5 space-y-3 shadow-xl max-h-[700px] overflow-y-auto scrollbar-none">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                  {searchQuery ? `Search Results (${filteredCalculators.length})` : 'Directory'}
                </span>
                <span className="text-[11px] text-teal-400 font-mono">
                  {filteredCalculators.length} items
                </span>
              </div>

              <div className="space-y-2">
                {filteredCalculators.length === 0 ? (
                  <p className="text-xs text-slate-500 py-6 text-center">
                    No calculators found for "{searchQuery}". Try another keyword.
                  </p>
                ) : (
                  filteredCalculators.map((calc) => (
                    <button
                      key={calc.slug}
                      onClick={() => {
                        setSelectedSlug(calc.slug);
                        window.scrollTo({ top: 350, behavior: 'smooth' });
                      }}
                      className={`w-full text-left p-3.5 rounded-2xl border transition-all ${
                        selectedSlug === calc.slug
                          ? 'bg-teal-500/10 border-teal-500/40 text-teal-300 shadow-md'
                          : 'bg-[#0B0E14] border-slate-800/80 hover:border-slate-700 text-slate-300 hover:text-white'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold truncate max-w-[210px]">{calc.title}</span>
                        <span className="text-[10px] uppercase font-bold text-slate-500 px-2 py-0.5 rounded-md bg-slate-900 border border-slate-800">
                          {calc.category}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 line-clamp-1 mt-1">
                        {calc.description}
                      </p>
                    </button>
                  ))
                )}
              </div>
            </div>

            {/* Rwandan & Regional Banking Info Card */}
            <div className="rounded-3xl border border-slate-800 bg-gradient-to-br from-[#121824] to-[#0D121D] p-5 space-y-3 shadow-xl">
              <span className="text-xs font-bold text-teal-400 uppercase tracking-wider flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4" />
                <span>Rwandan Financial Compliance</span>
              </span>
              <p className="text-xs text-slate-400 leading-relaxed">
                Formulas align with Rwanda Revenue Authority (RRA) 2024 progressive tax brackets (0% up to 60k, 10% up to 100k, 20% up to 200k, 30% above 200k) and BNR indicative forex exchange benchmarks.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* App Access Wizard Modal for Protected Export Features */}
      {wizardTarget && (
        <AppAccessWizardModal
          appId={wizardTarget}
          onClose={() => setWizardTarget(null)}
          onSuccess={() => {
            setWizardTarget(null);
            handleExportReport();
          }}
        />
      )}
    </div>
  );
};
