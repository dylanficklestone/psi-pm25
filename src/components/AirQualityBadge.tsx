import React from 'react';
import { AirQualityBand, PM25Band } from '../types/nea';

interface AirQualityBadgeProps {
  band: AirQualityBand | PM25Band;
  size?: 'sm' | 'md' | 'lg';
  showDot?: boolean;
  className?: string;
}

export const AirQualityBadge: React.FC<AirQualityBadgeProps> = ({
  band,
  size = 'md',
  showDot = true,
  className = '',
}) => {
  const sizeClasses = {
    sm: 'text-xs px-2 py-0.5 gap-1.5',
    md: 'text-xs px-2.5 py-1 gap-1.5 font-medium',
    lg: 'text-sm px-3.5 py-1.5 gap-2 font-semibold',
  }[size];

  const dotSizeClasses = {
    sm: 'w-1.5 h-1.5',
    md: 'w-2 h-2',
    lg: 'w-2.5 h-2.5',
  }[size];

  return (
    <span
      className={`inline-flex items-center rounded-md border font-mono tracking-wide ${band.bgClass} ${band.textClass} ${band.borderClass} ${sizeClasses} ${className}`}
    >
      {showDot && (
        <span
          className={`rounded-full shrink-0 ${dotSizeClasses} animate-pulse`}
          style={{ backgroundColor: band.colorHex }}
          aria-hidden="true"
        />
      )}
      <span className="uppercase">{band.level}</span>
    </span>
  );
};
