import React from 'react';
import { AdSenseBanner } from './AdSenseBanner';
import { ADS_CONFIG } from '../../config/ads';

interface SidebarAdBannerProps {
  slot?: string;
  className?: string;
  label?: string;
}

export const SidebarAdBanner: React.FC<SidebarAdBannerProps> = ({
  slot = ADS_CONFIG.SLOTS.SIDEBAR_BANNER,
  className = '',
  label = 'Sponsored Ad',
}) => {
  return (
    <div className={`w-full my-4 ${className}`}>
      <AdSenseBanner
        slot={slot}
        format="rectangle"
        responsive={true}
        fallbackSponsored={true}
        label={label}
        minHeight="250px"
      />
    </div>
  );
};
