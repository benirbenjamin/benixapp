import React from 'react';
import { UniversalMediaAdOverlay } from './UniversalMediaAdOverlay';
import { ADS_CONFIG } from '../../config/ads';

interface TVAdOverlayProps {
  isOpen: boolean;
  stationName?: string;
  onClose: () => void;
  countdownDuration?: number;
}

export const TVAdOverlay: React.FC<TVAdOverlayProps> = ({
  isOpen,
  stationName = 'Benix Space TV',
  onClose,
  countdownDuration = 10,
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
