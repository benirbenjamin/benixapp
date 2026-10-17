'use client';

import React from 'react';
import Link from 'next/link';
import { Crown, AlertCircle, ArrowRight, X } from 'lucide-react';
import { PlanCheckResult } from '@/lib/services/planEnforcementService';

interface PlanLimitModalProps {
  isOpen: boolean;
  onClose: () => void;
  result: PlanCheckResult | null;
  choirId?: string;
}

export function PlanLimitModal({ isOpen, onClose, result, choirId }: PlanLimitModalProps) {
  if (!isOpen || !result) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in">
      <div className="bg-slate-900 border-2 border-purple-500/50 rounded-3xl p-6 md:p-8 max-w-lg w-full shadow-2xl space-y-6 relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-white p-1 rounded-xl hover:bg-slate-800 transition-all cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 border-b border-slate-800 pb-4">
          <div className="w-12 h-12 rounded-2xl bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center justify-center shrink-0">
            <Crown className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <span className="text-[10px] font-extrabold uppercase tracking-widest text-amber-400 bg-amber-950/60 border border-amber-800/40 px-2.5 py-0.5 rounded-full">
              SaaS Limit Exceeded
            </span>
            <h2 className="text-xl font-extrabold text-white pt-0.5">Upgrade Choir Plan Required</h2>
          </div>
        </div>

        <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-2 text-xs">
          <div className="flex justify-between text-slate-400">
            <span>Active Subscription Tier:</span>
            <strong className="text-purple-300 font-bold">{result.planName}</strong>
          </div>
          <div className="flex justify-between text-slate-400">
            <span>Feature / Resource:</span>
            <strong className="text-white font-bold">{result.featureLabel}</strong>
          </div>
          <div className="flex justify-between text-slate-400">
            <span>Current Limit Status:</span>
            <strong className="text-rose-400 font-extrabold">
              {result.currentCount} / {result.maxLimit < 0 ? 'Unlimited' : result.maxLimit} Used
            </strong>
          </div>
        </div>

        <p className="text-xs text-slate-300 leading-relaxed">
          {result.message}
        </p>

        <div className="flex flex-col sm:flex-row gap-3 pt-2">
          <Link
            href={`/choir/plan-select${choirId ? `?choirId=${choirId}` : ''}`}
            className="flex-1 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-extrabold text-xs py-3.5 px-4 rounded-xl shadow-lg shadow-purple-600/30 flex items-center justify-center gap-2 transition-all cursor-pointer"
          >
            <Crown className="w-4 h-4" /> Upgrade Choir Plan <ArrowRight className="w-4 h-4" />
          </Link>

          <button
            onClick={onClose}
            className="bg-slate-950 hover:bg-slate-800 text-slate-400 font-semibold text-xs py-3.5 px-4 rounded-xl border border-slate-800 transition-all cursor-pointer"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
