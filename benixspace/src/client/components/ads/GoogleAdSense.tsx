import React from 'react';
import { AdSenseUnit } from '../common/AdSenseUnit';

interface GoogleAdSenseProps {
  slot?: string;
  format?: 'auto' | 'fluid' | 'rectangle' | 'autorelaxed';
  responsive?: boolean;
  className?: string;
}

export const GoogleAdSense: React.FC<GoogleAdSenseProps> = ({
  slot,
  format = 'auto',
  responsive = true,
  className = ''
}) => {
  return (
    <AdSenseUnit
      slot={slot}
      format={format}
      responsive={responsive}
      className={className}
    />
  );
};
