import React, { useEffect, useState } from 'react';
import { ADS_CONFIG } from '../../config/ads';
import { AdSenseUnit } from '../common/AdSenseUnit';

interface CompanionAdBannerProps {
  slot?: string;
  label?: string;
  className?: string;
  refreshIntervalSeconds?: number;
}

export const CompanionAdBanner: React.FC<CompanionAdBannerProps> = ({
  slot = ADS_CONFIG.SLOTS.TV_COMPANION_BANNER,
  label = 'Stream Sponsor Advertisement',
  className = '',
  refreshIntervalSeconds = ADS_CONFIG.TV_BANNER_REFRESH_SECONDS || 150
}) => {
  const [adKey, setAdKey] = useState<number>(0);

  // Auto-refresh banner ad periodically to maximize publisher RPM
  useEffect(() => {
    if (!refreshIntervalSeconds || refreshIntervalSeconds <= 0) return;

    const interval = setInterval(() => {
      setAdKey((prev) => prev + 1);
    }, refreshIntervalSeconds * 1000);

    return () => clearInterval(interval);
  }, [refreshIntervalSeconds]);

  return (
    <div className={`w-full overflow-hidden my-4 ${className}`}>
      {label && (
        <div className="flex items-center justify-between text-[10px] font-bold text-slate-500 uppercase tracking-widest px-2 mb-1.5">
          <span>{label}</span>
          <span className="text-slate-600">Google AdSense</span>
        </div>
      )}
      <div className="rounded-2xl border border-slate-800 bg-[#0E131E] p-2 flex items-center justify-center min-h-[90px] overflow-hidden shadow-inner">
        <AdSenseUnit
          key={adKey}
          slot={slot}
          format="horizontal"
          responsive={true}
          className="my-0"
        />
      </div>
    </div>
  );
};
