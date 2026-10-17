import React from 'react';
import { MessageCircle, Sparkles, TrendingUp, Megaphone, ArrowRight } from 'lucide-react';
import { ADS_CONFIG } from '../../config/ads';

interface AdvertiseHereCardProps {
  className?: string;
  variant?: 'banner' | 'card' | 'compact' | 'modal';
}

export const AdvertiseHereCard: React.FC<AdvertiseHereCardProps> = ({
  className = '',
  variant = 'banner',
}) => {
  const whatsappUrl = `https://wa.me/${ADS_CONFIG.WHATSAPP_NUMBER.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(
    'Hello! I am interested in advertising my business/brand on Benix Space TV. Please share pricing and available banner slots.'
  )}`;

  if (variant === 'modal') {
    return (
      <div className={`w-full max-w-[320px] p-4 rounded-2xl bg-gradient-to-br from-rba-navy via-slate-900 to-indigo-950 text-white shadow-lg border border-rba-yellow/40 flex flex-col items-center justify-center text-center space-y-3 ${className}`}>
        <div className="flex items-center gap-1.5 text-rba-yellow text-[10px] font-black uppercase tracking-wider">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Advertising Opportunity</span>
        </div>

        <div className="space-y-1">
          <h4 className="font-black text-sm text-white leading-tight">
            Promote Your Brand Here
          </h4>
          <p className="text-[11px] text-slate-300 leading-snug">
            Reach thousands of daily viewers on Benix Space TV & Radio.
          </p>
        </div>

        <a
          href={whatsappUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="w-full inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-black text-xs shadow-md transition-transform hover:scale-105 active:scale-95"
        >
          <MessageCircle className="w-4 h-4 fill-current" />
          <span>Advertise Here on WhatsApp</span>
        </a>

        <p className="text-[9px] text-slate-400 font-semibold">
          Direct Partner Spot • {ADS_CONFIG.WHATSAPP_NUMBER}
        </p>
      </div>
    );
  }

  if (variant === 'compact') {
    return (
      <div className={`p-4 rounded-2xl bg-gradient-to-r from-rba-navy via-slate-900 to-indigo-950 text-white shadow-md border border-rba-yellow/30 flex items-center justify-between gap-3 ${className}`}>
        <div className="flex items-center gap-3 min-w-0">
          <div className="p-2.5 rounded-xl bg-rba-yellow text-slate-950 shrink-0 font-black">
            <Megaphone className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <h4 className="font-extrabold text-xs sm:text-sm text-white truncate">Advertise Your Brand Here!</h4>
            <p className="text-[11px] text-slate-300 truncate">Reach thousands of daily active viewers & listeners</p>
          </div>
        </div>

        <a
          href={whatsappUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-extrabold text-xs shadow-md transition-transform hover:scale-105 shrink-0"
        >
          <MessageCircle className="w-4 h-4 fill-current" />
          <span>Advertise</span>
        </a>
      </div>
    );
  }

  return (
    <div className={`w-full my-4 animate-fadeIn ${className}`}>
      <div className="flex items-center justify-between px-1 mb-1.5 text-[10px] uppercase font-bold tracking-widest text-slate-400 select-none">
        <span className="flex items-center gap-1">
          <Sparkles className="w-3 h-3 text-rba-yellow" />
          Advertising Opportunity
        </span>
        <span className="text-[9px] font-medium text-slate-400">Direct Partner Spot</span>
      </div>

      <div className="p-5 sm:p-6 rounded-3xl bg-gradient-to-r from-rba-navy via-indigo-950 to-slate-900 text-white shadow-xl border border-rba-yellow/30 relative overflow-hidden flex flex-col md:flex-row md:items-center justify-between gap-5">
        
        {/* Decorative background glow */}
        <div className="absolute -right-10 -bottom-10 w-48 h-48 bg-rba-yellow/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex items-start gap-4 min-w-0 z-10">
          <div className="p-3.5 rounded-2xl bg-gradient-to-br from-rba-yellow to-amber-500 text-slate-950 shadow-lg shrink-0">
            <TrendingUp className="w-7 h-7" />
          </div>

          <div className="space-y-1 min-w-0">
            <div className="flex items-center gap-2">
              <h3 className="text-base sm:text-lg font-black text-white tracking-tight">
                Want to Promote Your Business Here?
              </h3>
              <span className="px-2 py-0.5 rounded-full text-[9px] font-black bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 uppercase">
                Now Available
              </span>
            </div>

            <p className="text-xs sm:text-sm text-slate-200 leading-relaxed max-w-xl">
              Showcase your products, services, or events to our growing global audience. High visibility placement across live TV, radio streams, and article feeds.
            </p>

            <div className="flex flex-wrap items-center gap-2 pt-1">
              <span className="text-[10px] font-semibold text-rba-yellow/90">✓ High CTR Placement</span>
              <span className="text-slate-500 text-xs">•</span>
              <span className="text-[10px] font-semibold text-rba-yellow/90">✓ Real-Time Analytics Link</span>
              <span className="text-slate-500 text-xs">•</span>
              <span className="text-[10px] font-semibold text-rba-yellow/90">✓ Instant Setup</span>
            </div>
          </div>
        </div>

        {/* WhatsApp Action Button */}
        <div className="z-10 flex flex-col sm:flex-row md:flex-col items-stretch md:items-end gap-2 shrink-0">
          <a
            href={whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-2xl bg-emerald-500 hover:bg-emerald-600 text-white font-extrabold text-sm shadow-xl transition-all hover:scale-105 active:scale-95 border border-emerald-400/40"
          >
            <MessageCircle className="w-5 h-5 fill-current" />
            <span>Advertise Here on WhatsApp</span>
            <ArrowRight className="w-4 h-4" />
          </a>
          <span className="text-[10px] text-center md:text-right text-slate-400 font-medium">
            Contact us: <strong className="text-slate-200">{ADS_CONFIG.WHATSAPP_NUMBER}</strong>
          </span>
        </div>

      </div>
    </div>
  );
};
