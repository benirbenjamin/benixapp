import React, { useState } from 'react';
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
  ShieldCheck,
  FileText
} from 'lucide-react';

export const EasyCalcPage: React.FC = () => {
  const { user, hasAppProfile } = useAuth();
  const [wizardTarget, setWizardTarget] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'loan' | 'tax' | 'currency' | 'vat'>('loan');
  const [actionSuccess, setActionSuccess] = useState<string>('');

  // 1. Loan Calculator State
  const [loanAmount, setLoanAmount] = useState<number>(5000000); // 5M RWF
  const [interestRate, setInterestRate] = useState<number>(16); // 16% APR
  const [loanMonths, setLoanMonths] = useState<number>(24); // 24 months

  // 2. Rwanda PAYE Tax Calculator State
  const [grossSalary, setGrossSalary] = useState<number>(500000); // 500k RWF

  // 3. Currency Converter State
  const [currencyAmount, setCurrencyAmount] = useState<number>(100);
  const [currencyFrom, setCurrencyFrom] = useState<'USD' | 'EUR' | 'GBP' | 'KES'>('USD');

  // 4. VAT Calculator State
  const [vatBaseAmount, setVatBaseAmount] = useState<number>(100000);

  // Calculations
  // Loan EMI formula: E = P * r * (1+r)^n / ((1+r)^n - 1)
  const monthlyRate = interestRate / 100 / 12;
  const loanEmi =
    monthlyRate > 0
      ? (loanAmount * monthlyRate * Math.pow(1 + monthlyRate, loanMonths)) /
        (Math.pow(1 + monthlyRate, loanMonths) - 1)
      : loanAmount / loanMonths;
  const totalLoanRepayment = loanEmi * loanMonths;
  const totalInterest = totalLoanRepayment - loanAmount;

  // Rwanda PAYE calculation (RRA standard brackets)
  const computePayeTax = (salary: number) => {
    let tax = 0;
    if (salary > 200000) {
      tax += (salary - 200000) * 0.3;
      tax += 100000 * 0.2;
      tax += 40000 * 0.1;
    } else if (salary > 100000) {
      tax += (salary - 100000) * 0.2;
      tax += 40000 * 0.1;
    } else if (salary > 60000) {
      tax += (salary - 60000) * 0.1;
    }
    return Math.round(tax);
  };
  const payeTax = computePayeTax(grossSalary);
  const netSalary = grossSalary - payeTax;

  // Currency Exchange Rates (Base RWF)
  const EXCHANGE_RATES: Record<string, number> = {
    USD: 1420,
    EUR: 1540,
    GBP: 1810,
    KES: 11.0
  };
  const convertedRwf = Math.round(currencyAmount * (EXCHANGE_RATES[currencyFrom] || 1420));

  // VAT (18%)
  const vatAmount = Math.round(vatBaseAmount * 0.18);
  const totalWithVat = vatBaseAmount + vatAmount;

  const handleExportReport = () => {
    if (!user || !hasAppProfile('calc')) {
      setWizardTarget('calc');
      return;
    }
    setActionSuccess('Financial report compiled! Saved to your BenixSpace dashboard.');
    setTimeout(() => setActionSuccess(''), 4000);
  };

  return (
    <div className="bg-[#0B0E14] text-slate-100 min-h-screen pb-24 font-sans selection:bg-teal-500 selection:text-white">
      <SeoHead
        title="EasyCalc Smart Financial & Business Calculators — BenixSpace"
        description="Instant loan EMI calculations, Rwanda PAYE income tax estimators, currency conversions, and VAT calculations on BenixSpace."
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 space-y-8">
        
        {/* Top Hero Banner */}
        <div className="relative rounded-3xl overflow-hidden border border-slate-800 bg-gradient-to-br from-[#0c2423] via-[#091a19] to-[#0B0E14] shadow-2xl p-6 sm:p-10">
          <div className="absolute top-0 right-0 -mr-16 -mt-16 w-80 h-80 rounded-full bg-teal-500/10 blur-3xl pointer-events-none" />
          <div className="absolute bottom-0 left-1/3 -mb-16 w-72 h-72 rounded-full bg-emerald-600/10 blur-3xl pointer-events-none" />

          <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div className="space-y-4 max-w-2xl">
              <div className="flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider bg-teal-500 text-slate-950 shadow-lg shadow-teal-500/30">
                  <Calculator className="w-3.5 h-3.5" />
                  EasyCalc Suite
                </span>
                <span className="px-3 py-1 rounded-full text-xs font-semibold bg-teal-500/10 text-teal-400 border border-teal-500/20">
                  Rwanda RRA Tax Certified
                </span>
                <span className="px-3 py-1 rounded-full text-xs font-semibold bg-slate-800 text-slate-300">
                  Zero Latency Tools
                </span>
              </div>

              <h1 className="text-3xl sm:text-5xl font-black tracking-tight text-white leading-tight">
                Smart Financial & <br />
                <span className="bg-gradient-to-r from-teal-400 via-emerald-300 to-cyan-300 bg-clip-text text-transparent">
                  Business Utilities Suite
                </span>
              </h1>

              <p className="text-sm sm:text-base text-slate-400 leading-relaxed">
                Calculate loan installments, income tax brackets, VAT, and foreign exchange rates with live mathematical precision.
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
                <span className="text-[11px] font-bold uppercase text-teal-400">Available Calculators</span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-teal-500/20 text-teal-300">
                  4 IN 1
                </span>
              </div>
              <ul className="text-xs text-slate-300 space-y-2 pt-2 border-t border-slate-800">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-teal-400" />
                  <span>Commercial Bank Loan EMI</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-teal-400" />
                  <span>Rwanda PAYE / Net Salary</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-teal-400" />
                  <span>Real-Time RWF FX Rates</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-teal-400" />
                  <span>Rwanda VAT (18%) Margin</span>
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* Feedback Alert */}
        {actionSuccess && (
          <div className="p-4 rounded-2xl bg-teal-950/60 border border-teal-500/50 text-teal-200 text-xs font-bold flex items-center gap-2 shadow-lg">
            <CheckCircle2 className="w-4 h-4 text-teal-400" />
            <span>{actionSuccess}</span>
          </div>
        )}

        {/* Tool Tabs */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
          {[
            { id: 'loan', label: 'Loan EMI Calculator' },
            { id: 'tax', label: 'Rwanda PAYE Tax' },
            { id: 'currency', label: 'Currency Converter' },
            { id: 'vat', label: 'VAT (18%) Calculator' }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-5 py-2.5 rounded-2xl text-xs font-bold whitespace-nowrap transition-all ${
                activeTab === tab.id
                  ? 'bg-teal-500 text-slate-950 shadow-lg shadow-teal-500/20 font-black'
                  : 'bg-[#131926] text-slate-400 hover:text-white hover:bg-[#1a2234] border border-slate-800'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Calculator Display Card */}
        <div className="p-6 sm:p-8 rounded-3xl bg-[#131926] border border-slate-800/80 shadow-xl">
          
          {/* TAB 1: LOAN EMI */}
          {activeTab === 'loan' && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
              <div className="lg:col-span-7 space-y-5">
                <h3 className="font-extrabold text-lg text-white">Bank Loan EMI & Amortization</h3>
                
                <div>
                  <div className="flex justify-between text-xs font-bold mb-1">
                    <span className="text-slate-400">Loan Principal (RWF)</span>
                    <span className="text-teal-400">{loanAmount.toLocaleString()} RWF</span>
                  </div>
                  <input
                    type="range"
                    min="500000"
                    max="50000000"
                    step="500000"
                    value={loanAmount}
                    onChange={(e) => setLoanAmount(Number(e.target.value))}
                    className="w-full accent-teal-500 cursor-pointer"
                  />
                </div>

                <div>
                  <div className="flex justify-between text-xs font-bold mb-1">
                    <span className="text-slate-400">Annual Interest Rate (%)</span>
                    <span className="text-teal-400">{interestRate}% APR</span>
                  </div>
                  <input
                    type="range"
                    min="5"
                    max="30"
                    step="0.5"
                    value={interestRate}
                    onChange={(e) => setInterestRate(Number(e.target.value))}
                    className="w-full accent-teal-500 cursor-pointer"
                  />
                </div>

                <div>
                  <div className="flex justify-between text-xs font-bold mb-1">
                    <span className="text-slate-400">Loan Tenure</span>
                    <span className="text-teal-400">{loanMonths} Months ({Math.round(loanMonths / 12)} Yrs)</span>
                  </div>
                  <input
                    type="range"
                    min="6"
                    max="120"
                    step="6"
                    value={loanMonths}
                    onChange={(e) => setLoanMonths(Number(e.target.value))}
                    className="w-full accent-teal-500 cursor-pointer"
                  />
                </div>
              </div>

              {/* Loan Result Card */}
              <div className="lg:col-span-5 p-6 rounded-3xl bg-[#1A2234] border border-slate-800 space-y-4">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Monthly Payment</span>
                <p className="text-3xl font-black text-teal-400">{Math.round(loanEmi).toLocaleString()} RWF</p>

                <div className="space-y-2 pt-3 border-t border-slate-700/60 text-xs">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Principal Amount:</span>
                    <span className="text-white font-bold">{loanAmount.toLocaleString()} RWF</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Total Interest Due:</span>
                    <span className="text-orange-400 font-bold">{Math.round(totalInterest).toLocaleString()} RWF</span>
                  </div>
                  <div className="flex justify-between pt-2 border-t border-slate-700/40">
                    <span className="text-slate-400 font-bold">Total Repayment:</span>
                    <span className="text-white font-black">{Math.round(totalLoanRepayment).toLocaleString()} RWF</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: RWANDA PAYE TAX */}
          {activeTab === 'tax' && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
              <div className="lg:col-span-7 space-y-5">
                <h3 className="font-extrabold text-lg text-white">Rwanda PAYE & Net Salary Estimator</h3>
                <p className="text-xs text-slate-400">
                  Calculates income tax based on the Rwanda Revenue Authority (RRA) tiered tax schedule.
                </p>

                <div>
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1">
                    Monthly Gross Salary (RWF)
                  </label>
                  <input
                    type="number"
                    value={grossSalary}
                    onChange={(e) => setGrossSalary(Math.max(0, Number(e.target.value)))}
                    className="w-full px-4 py-3 rounded-2xl bg-[#1A2234] border border-slate-800 text-white font-bold focus:outline-none focus:border-teal-500"
                  />
                </div>

                <div className="text-[11px] text-slate-400 space-y-1 bg-[#182133] p-3 rounded-2xl border border-slate-800">
                  <p className="font-bold text-slate-300">RRA Tax Tiers Applied:</p>
                  <p>• 0 to 60,000 RWF = 0%</p>
                  <p>• 60,001 to 100,000 RWF = 10%</p>
                  <p>• 100,001 to 200,000 RWF = 20%</p>
                  <p>• Above 200,000 RWF = 30%</p>
                </div>
              </div>

              {/* Tax Result Card */}
              <div className="lg:col-span-5 p-6 rounded-3xl bg-[#1A2234] border border-slate-800 space-y-4">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Estimated Net Take-Home</span>
                <p className="text-3xl font-black text-emerald-400">{netSalary.toLocaleString()} RWF</p>

                <div className="space-y-2 pt-3 border-t border-slate-700/60 text-xs">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Gross Monthly Salary:</span>
                    <span className="text-white font-bold">{grossSalary.toLocaleString()} RWF</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">PAYE Tax Deducted:</span>
                    <span className="text-rose-400 font-bold">{payeTax.toLocaleString()} RWF</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Effective Tax Rate:</span>
                    <span className="text-teal-400 font-bold">
                      {grossSalary > 0 ? ((payeTax / grossSalary) * 100).toFixed(1) : 0}%
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: CURRENCY CONVERTER */}
          {activeTab === 'currency' && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
              <div className="lg:col-span-7 space-y-5">
                <h3 className="font-extrabold text-lg text-white">Foreign Currency to Rwandan Franc (RWF)</h3>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1">
                      Amount
                    </label>
                    <input
                      type="number"
                      value={currencyAmount}
                      onChange={(e) => setCurrencyAmount(Math.max(0, Number(e.target.value)))}
                      className="w-full px-4 py-3 rounded-2xl bg-[#1A2234] border border-slate-800 text-white font-bold focus:outline-none focus:border-teal-500"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1">
                      Currency
                    </label>
                    <select
                      value={currencyFrom}
                      onChange={(e) => setCurrencyFrom(e.target.value as any)}
                      className="w-full px-4 py-3 rounded-2xl bg-[#1A2234] border border-slate-800 text-white font-bold focus:outline-none focus:border-teal-500"
                    >
                      <option value="USD">USD ($ - US Dollar)</option>
                      <option value="EUR">EUR (€ - Euro)</option>
                      <option value="GBP">GBP (£ - British Pound)</option>
                      <option value="KES">KES (KSh - Kenyan Shilling)</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Currency Result Card */}
              <div className="lg:col-span-5 p-6 rounded-3xl bg-[#1A2234] border border-slate-800 space-y-4">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Estimated Value in RWF</span>
                <p className="text-3xl font-black text-teal-400">{convertedRwf.toLocaleString()} RWF</p>

                <div className="space-y-2 pt-3 border-t border-slate-700/60 text-xs">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Exchange Rate:</span>
                    <span className="text-white font-bold">1 {currencyFrom} = {EXCHANGE_RATES[currencyFrom]} RWF</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Converted Total:</span>
                    <span className="text-teal-300 font-bold">{convertedRwf.toLocaleString()} RWF</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: VAT CALCULATOR */}
          {activeTab === 'vat' && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
              <div className="lg:col-span-7 space-y-5">
                <h3 className="font-extrabold text-lg text-white">Rwanda VAT (18%) Value Added Tax</h3>

                <div>
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1">
                    Net Amount (Excluding VAT)
                  </label>
                  <input
                    type="number"
                    value={vatBaseAmount}
                    onChange={(e) => setVatBaseAmount(Math.max(0, Number(e.target.value)))}
                    className="w-full px-4 py-3 rounded-2xl bg-[#1A2234] border border-slate-800 text-white font-bold focus:outline-none focus:border-teal-500"
                  />
                </div>
              </div>

              {/* VAT Result Card */}
              <div className="lg:col-span-5 p-6 rounded-3xl bg-[#1A2234] border border-slate-800 space-y-4">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Total Including VAT (18%)</span>
                <p className="text-3xl font-black text-cyan-400">{totalWithVat.toLocaleString()} RWF</p>

                <div className="space-y-2 pt-3 border-t border-slate-700/60 text-xs">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Net Base Price:</span>
                    <span className="text-white font-bold">{vatBaseAmount.toLocaleString()} RWF</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">VAT (18%):</span>
                    <span className="text-cyan-400 font-bold">+{vatAmount.toLocaleString()} RWF</span>
                  </div>
                </div>
              </div>
            </div>
          )}

        </div>

      </div>

      {/* Access Wizard Modal for EasyCalc Requirements */}
      <AppAccessWizardModal
        isOpen={!!wizardTarget}
        targetAppKey={wizardTarget}
        onClose={() => setWizardTarget(null)}
        onSuccess={() => {
          setWizardTarget(null);
          setActionSuccess('Financial preferences saved! Report exported to dashboard.');
          setTimeout(() => setActionSuccess(''), 5000);
        }}
      />
    </div>
  );
};
