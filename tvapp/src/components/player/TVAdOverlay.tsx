import React from 'react';
import {
  ExternalLink,
  Volume2,
  Sparkles,
  Plane,
  Building2,
  Smartphone,
  Compass,
  Radio,
  Coffee,
  X,
} from 'lucide-react';
import { TVAd } from '../../data/tvAds';

interface TVAdOverlayProps {
  ad: TVAd;
  countdown: number;
  totalDuration?: number;
  onClose: () => void;
  stationName?: string;
}

export const TVAdOverlay: React.FC<TVAdOverlayProps> = ({
  ad,
  countdown,
  totalDuration = 10,
  onClose,
  stationName = 'Benix Space TV',
}) => {
  const progressPercent = Math.max(0, Math.min(100, (countdown / totalDuration) * 100));

  const renderBrandIcon = () => {
    switch (ad.iconName) {
      case 'momo':
        return <Smartphone className="w-6 h-6 sm:w-7 sm:h-7 text-amber-950" />;
      case 'bk':
        return <Building2 className="w-6 h-6 sm:w-7 sm:h-7 text-white" />;
      case 'rwanda':
        return <Compass className="w-6 h-6 sm:w-7 sm:h-7 text-white" />;
      case 'rwandair':
        return <Plane className="w-6 h-6 sm:w-7 sm:h-7 text-white" />;
      case 'airtel':
        return <Radio className="w-6 h-6 sm:w-7 sm:h-7 text-white" />;
      case 'inyange':
        return <Coffee className="w-6 h-6 sm:w-7 sm:h-7 text-white" />;
      default:
        return <Sparkles className="w-6 h-6 sm:w-7 sm:h-7 text-white" />;
    }
  };

  return (
    <div className="absolute inset-0 z-30 flex flex-col justify-between bg-black/85 backdrop-blur-sm text-white p-2 sm:p-4 md:p-6 animate-fadeIn select-none overflow-hidden">
      
      {/* Top Bar: Sponsored Tag + Live Broadcast Indicator + Countdown Pill */}
      <div className="flex items-center justify-between gap-2 shrink-0">
        <div className="flex items-center gap-1.5 sm:gap-2 min-w-0">
          <span className="px-2 py-0.5 rounded bg-amber-500 text-slate-950 text-[9px] sm:text-xs font-black uppercase tracking-wider shadow-sm flex items-center gap-1 shrink-0">
            <Sparkles className="w-2.5 h-2.5 sm:w-3 sm:h-3 fill-current" />
            <span>Ad</span>
          </span>

          {/* Broadcast audio indicator */}
          <div className="flex items-center gap-1 px-2 py-0.5 rounded bg-white/10 text-white text-[9px] sm:text-xs font-semibold backdrop-blur-sm truncate">
            <Volume2 className="w-3 h-3 text-rba-yellow animate-pulse shrink-0" />
            <span className="truncate max-w-[110px] xs:max-w-[150px] sm:max-w-none">
              Audio Active • {stationName}
            </span>
          </div>
        </div>

        {/* Countdown Badge & Skip */}
        <div className="flex items-center gap-1.5 shrink-0">
          <div className="flex items-center gap-1 px-2 sm:px-2.5 py-0.5 rounded-full bg-black/60 border border-white/20 text-[10px] sm:text-xs font-bold text-white shadow-inner">
            <span className="w-1.5 h-1.5 rounded-full bg-rba-yellow animate-ping" />
            <span>Ad: <strong className="text-rba-yellow font-black">{countdown}s</strong></span>
          </div>

          {countdown <= 5 && (
            <button
              onClick={onClose}
              className="p-1 rounded-full bg-white/15 hover:bg-white/25 text-white transition-colors"
              title="Skip ad"
              aria-label="Skip ad"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Center Showcase: Brand Card & Promotional Message (Scaled for mobile frames) */}
      <div className="my-auto max-w-xl mx-auto w-full py-1 sm:py-2">
        <div className={`p-2.5 sm:p-5 rounded-xl sm:rounded-2xl bg-gradient-to-br ${ad.bgGradient} border border-white/20 shadow-2xl relative overflow-hidden`}>
          
          {/* Subtle Ambient Background Watermark */}
          <div className="absolute -right-6 -bottom-6 opacity-10 pointer-events-none transform scale-125">
            {renderBrandIcon()}
          </div>

          {/* Sponsor Identity Header */}
          <div className="flex items-center justify-between gap-2 mb-1.5 sm:mb-2.5">
            <div className="flex items-center gap-2 sm:gap-3 min-w-0">
              <div
                className="w-7 h-7 sm:w-11 sm:h-11 rounded-lg sm:rounded-xl flex items-center justify-center shadow-md shrink-0"
                style={{ backgroundColor: ad.accentColor }}
              >
                {renderBrandIcon()}
              </div>

              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <h4 className="text-xs sm:text-base font-black text-white tracking-tight truncate">
                    {ad.sponsor}
                  </h4>
                  <span className="px-1.5 py-0.2 rounded text-[8px] sm:text-[9px] font-bold bg-white/20 text-white uppercase tracking-wider shrink-0">
                    {ad.badgeText}
                  </span>
                </div>
                <p className="text-[9px] sm:text-xs text-slate-200 font-medium truncate">
                  {ad.category}
                </p>
              </div>
            </div>

            {/* Quick CTA on Top Right for ultra-compact mobile frames */}
            <a
              href={ad.ctaUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="xs:hidden inline-flex items-center gap-1 px-2.5 py-1 rounded-lg font-black text-[10px] text-slate-950 shadow-md shrink-0"
              style={{ backgroundColor: ad.accentColor }}
            >
              <span>Visit</span>
              <ExternalLink className="w-2.5 h-2.5" />
            </a>
          </div>

          {/* Title & Tagline */}
          <h3 className="text-xs sm:text-lg font-black text-white leading-tight mb-0.5 sm:mb-1 line-clamp-1">
            {ad.title}
          </h3>
          <p className="text-[10px] sm:text-xs text-amber-200 font-bold mb-1 sm:mb-2 line-clamp-1">
            {ad.tagline}
          </p>
          <p className="text-[10px] sm:text-xs text-slate-100/90 leading-relaxed mb-2 sm:mb-3 line-clamp-1 sm:line-clamp-2">
            {ad.description}
          </p>

          {/* Highlights Pills (Visible when height/viewport allows: sm screens and up or landscape) */}
          <div className="hidden sm:flex flex-wrap gap-1 sm:gap-1.5 mb-3">
            {ad.highlights.map((highlight, idx) => (
              <span
                key={idx}
                className="px-2 py-0.5 rounded-md bg-black/30 border border-white/10 text-[9px] sm:text-xs font-semibold text-white backdrop-blur-sm"
              >
                ✓ {highlight}
              </span>
            ))}
          </div>

          {/* Call To Action Button (Prominent for regular & landscape viewports) */}
          <div className="hidden xs:flex items-center justify-between gap-3 pt-1 border-t border-white/15">
            <a
              href={ad.ctaUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3 sm:px-5 py-1.5 sm:py-2 rounded-lg sm:rounded-xl font-black text-[11px] sm:text-xs text-slate-950 shadow-lg transition-all hover:scale-105 active:scale-95"
              style={{ backgroundColor: ad.accentColor }}
            >
              <span>{ad.ctaText}</span>
              <ExternalLink className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
            </a>

            <span className="text-[9px] sm:text-[11px] text-white/70 italic hidden md:inline">
              Opens sponsor website
            </span>
          </div>

        </div>
      </div>

      {/* Bottom Bar: Compact Progress Bar & Status */}
      <div className="space-y-1 shrink-0">
        <div className="flex items-center justify-between text-[8px] sm:text-[10px] text-slate-300 px-0.5">
          <span className="truncate">Broadcasting live • Kigali</span>
          <span className="shrink-0">Full stream in <strong>{countdown}s</strong></span>
        </div>

        {/* Countdown Progress Bar */}
        <div className="w-full h-1 sm:h-1.5 bg-white/20 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-rba-yellow to-amber-500 transition-all duration-1000 ease-linear rounded-full"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>

    </div>
  );
};
