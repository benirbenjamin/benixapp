import React, { useState } from 'react';
import { Calculator, ArrowRight, Percent, RefreshCw, DollarSign } from 'lucide-react';

export const EasyCalcSection: React.FC = () => {
  // Simple interactive loan calculator
  const [loanAmount, setLoanAmount] = useState<number>(1000000);
  const [rate, setRate] = useState<number>(14);
  const [months, setMonths] = useState<number>(12);

  const monthlyRate = rate / 100 / 12;
  const monthlyPayment = Math.round(
    (loanAmount * monthlyRate) / (1 - Math.pow(1 + monthlyRate, -months))
  ) || 0;

  return (
    <section className="py-12 bg-slate-50 border-y border-slate-200/80 my-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-end justify-between gap-4 border-b border-slate-200/60 pb-5">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-sky-600 bg-sky-100 px-3 py-1 rounded-full border border-sky-200 flex items-center gap-1.5 w-fit">
              <Calculator className="w-3.5 h-3.5 text-sky-600" />
              Benix EasyCalc Suite
            </span>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-2 tracking-tight">
              Fast, Precise Financial & Business Calculators
            </h2>
          </div>
          <div className="text-xs text-slate-500 font-semibold">
            African & Global utility formulas
          </div>
        </div>

        {/* Interactive Calculator Card */}
        <div className="p-6 rounded-2xl bg-white border border-slate-200/80 shadow-md grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
          <div className="space-y-4">
            <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
              Quick Loan & Business EMI Estimator
            </h4>

            <div>
              <label className="block text-[11px] font-semibold text-slate-500 mb-1">
                Loan Amount (RWF)
              </label>
              <input
                type="number"
                value={loanAmount}
                onChange={(e) => setLoanAmount(Number(e.target.value))}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-bold"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-[11px] font-semibold text-slate-500 mb-1">
                  Interest Rate (% / yr)
                </label>
                <input
                  type="number"
                  value={rate}
                  onChange={(e) => setRate(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-bold"
                />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-slate-500 mb-1">
                  Duration (Months)
                </label>
                <input
                  type="number"
                  value={months}
                  onChange={(e) => setMonths(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-bold"
                />
              </div>
            </div>
          </div>

          {/* Results Box */}
          <div className="md:col-span-2 p-6 rounded-2xl bg-sky-50/60 border border-sky-100 flex flex-col md:flex-row items-center justify-between gap-6">
            <div>
              <span className="text-[11px] font-bold text-sky-700 uppercase tracking-wider block">Estimated Monthly Payment</span>
              <div className="text-3xl font-black text-slate-900 mt-1">
                {monthlyPayment.toLocaleString()} <span className="text-sm font-bold text-sky-600">RWF / month</span>
              </div>
              <div className="text-xs text-slate-500 mt-1">
                Total repayment over {months} months: {(monthlyPayment * months).toLocaleString()} RWF
              </div>
            </div>

            <div className="flex flex-col gap-2 w-full md:w-auto">
              <span className="text-xs font-semibold text-slate-500">More Calculators:</span>
              <div className="flex flex-wrap gap-1.5">
                {['Rwandan PAYE Tax', 'Currency FX', 'BMI Health', 'Crypto Margin'].map((c, i) => (
                  <span key={i} className="px-2.5 py-1 rounded-xl bg-white border border-slate-200 text-[11px] font-bold text-slate-700">
                    {c}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>

      </div>
    </section>
  );
};
