import React from 'react';
import { useLanguage } from '../../contexts/LanguageContext';
import { ShieldCheck, Lock, AlertTriangle, Eye, UserX, MessageSquareOff } from 'lucide-react';

export const SafetyCenter: React.FC = () => {
  const { t } = useLanguage();

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-16 space-y-16">
      <div className="text-center space-y-4 max-w-3xl mx-auto">
        <span className="text-xs font-bold text-rose-600 uppercase tracking-widest">
          Community Protection
        </span>
        <h1 className="text-4xl sm:text-5xl font-extrabold text-slate-900 tracking-tight">
          Kunda Space Safety Center
        </h1>
        <p className="text-lg text-slate-600">
          Our core guidelines, security technologies, and best practices for safe online and in-person dating.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-card space-y-4">
          <div className="w-12 h-12 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center">
            <Lock className="w-6 h-6" />
          </div>
          <h3 className="text-xl font-bold text-slate-900">Why We Lock Contact Info Initially</h3>
          <p className="text-sm text-slate-600 leading-relaxed">
            Many dating scams happen when fraudsters lure victims immediately off-platform to unmonitored messaging apps. Kunda Space locks phone numbers and handles until mutual trust and consent are established, protecting your identity.
          </p>
        </div>

        <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-card space-y-4">
          <div className="w-12 h-12 rounded-2xl bg-violet-100 text-violet-600 flex items-center justify-center">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <h3 className="text-xl font-bold text-slate-900">Never Send Money to Anyone</h3>
          <p className="text-sm text-slate-600 leading-relaxed">
            Never send mobile money (MTN MoMo, Airtel Money) or wire transfers to anyone you meet online, regardless of their emergency story. Legitimate connections will never ask you for money or loans.
          </p>
        </div>

        <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-card space-y-4">
          <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-600 flex items-center justify-center">
            <Eye className="w-6 h-6" />
          </div>
          <h3 className="text-xl font-bold text-slate-900">Meet in Public Spaces in Rwanda</h3>
          <p className="text-sm text-slate-600 leading-relaxed">
            When meeting in Kigali or other towns, choose well-lit, populated public venues such as coffee shops, restaurants, or cultural centers. Tell a trusted friend your plans and arrange your own transportation.
          </p>
        </div>

        <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-card space-y-4">
          <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-600 flex items-center justify-center">
            <UserX className="w-6 h-6" />
          </div>
          <h3 className="text-xl font-bold text-slate-900">Zero Tolerance for Harassment</h3>
          <p className="text-sm text-slate-600 leading-relaxed">
            Any user sending explicit unsolicited content, aggressive messages, hate speech, or extortion attempts will be immediately suspended and barred from Kunda Space. Use our Block & Report tools anytime.
          </p>
        </div>
      </div>
    </div>
  );
};
