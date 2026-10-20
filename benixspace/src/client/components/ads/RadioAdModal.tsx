import React from 'react';
import type { Station } from '../../services/mediaService';
import { UniversalMediaAdOverlay } from './UniversalMediaAdOverlay';
import { ADS_CONFIG } from '../../config/ads';

interface RadioAdModalProps {
  isOpen: boolean;
  station: Station | null;
  onComplete: () => void;
  onCancel?: () => void;
  countdownDuration?: number;
}

export const RadioAdModal: React.FC<RadioAdModalProps> = ({
  isOpen,
  station,
  onComplete,
  onCancel,
  countdownDuration = 10,
}) => {
  if (!isOpen || !station) return null;

  return (
    <UniversalMediaAdOverlay
      isOpen={isOpen}
      onClose={onComplete}
      mediaType="radio"
      title={station.name || 'Live Radio Stream'}
      slot={ADS_CONFIG.SLOTS.RADIO_PREROLL}
      countdownDuration={countdownDuration}
    />
  );
};
