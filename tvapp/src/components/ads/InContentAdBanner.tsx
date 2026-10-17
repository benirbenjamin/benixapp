import React from 'react';
import { AdSenseBanner } from './AdSenseBanner';
import { ADS_CONFIG } from '../../config/ads';

interface InContentAdBannerProps {
  slot?: string;
  className?: string;
  sponsorIndex?: number;
  label?: string;
}

export const InContentAdBanner: React.FC<InContentAdBannerProps> = ({
  slot = ADS_CONFIG.SLOTS.IN_FEED_BANNER,
  className = '',
  sponsorIndex = 0,
  label = 'Sponsored Broadcast Partner',
}) => {
  return (
    <div className={`w-full my-6 sm:my-8 ${className}`}>
      <AdSenseBanner
        slot={slot}
        format="horizontal"
        responsive={true}
        fallbackSponsored={true}
        sponsorIndex={sponsorIndex}
        label={label}
      />
    </div>
  );
};
