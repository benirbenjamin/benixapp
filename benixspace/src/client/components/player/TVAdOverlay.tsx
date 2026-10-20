import React from 'react';
import { UniversalMediaAdOverlay } from '../ads/UniversalMediaAdOverlay';
import { ADS_CONFIG } from '../../config/ads';

interface TVAdOverlayProps {
  countdownDuration?: number;
  onClose: () => void;
  stationName?: string;
  isOpen?: boolean;
}

export const TVAdOverlay: React.FC<TVAdOverlayProps> = ({
  countdownDuration = 10,
  onClose,
  stationName = 'Benix Space TV',
  isOpen = true,
}) => {
  return (
    <UniversalMediaAdOverlay
      isOpen={isOpen}
      onClose={onClose}
      mediaType="tv"
      title={stationName}
      slot={ADS_CONFIG.SLOTS.POPUP_INTERSTITIAL}
      countdownDuration={countdownDuration}
    />
  );
};
