import React from 'react';

interface AudioWaveformProps {
  isPlaying: boolean;
  barColor?: string;
  className?: string;
}

export const AudioWaveform: React.FC<AudioWaveformProps> = ({
  isPlaying,
  barColor = 'bg-rba-gold',
  className = '',
}) => {
  return (
    <div className={`flex items-end gap-[3px] h-5 ${className}`} aria-hidden="true">
      {[
        'animation-delay-[0ms]',
        'animation-delay-[150ms]',
        'animation-delay-[300ms]',
        'animation-delay-[450ms]',
        'animation-delay-[200ms]',
      ].map((delay, i) => (
        <span
          key={i}
          className={`w-[3px] rounded-full transition-all duration-300 ${barColor} ${
            isPlaying ? `animate-equalizer ${delay}` : 'h-1.5 opacity-40'
          }`}
          style={{
            height: isPlaying ? undefined : '6px',
            animationDuration: isPlaying ? `${0.8 + (i % 3) * 0.3}s` : undefined,
          }}
        />
      ))}
    </div>
  );
};
