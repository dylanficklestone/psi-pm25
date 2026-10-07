import React from 'react';
import { LucideIcon } from 'lucide-react';
import { AirQualityBadge } from './AirQualityBadge';
import { AirQualityBand, PM25Band } from '../types/nea';

interface MetricCardProps {
  title: string;
  value: number | string | null;
  unit: string;
  icon: LucideIcon;
  band?: AirQualityBand | PM25Band;
  subtitle?: string;
  minMax?: { min: number; max: number };
  delta?: { value: number; label: string };
  isSelected?: boolean;
  onClick?: () => void;
  accentColor?: string;
}

export const MetricCard: React.FC<MetricCardProps> = ({
  title,
  value,
  unit,
  icon: Icon,
  band,
  subtitle,
  minMax,
  delta,
  isSelected = false,
  onClick,
  accentColor,
}) => {
  const displayVal =
    value === null || value === undefined
      ? '--'
      : typeof value === 'number'
      ? Number.isInteger(value)
        ? value
        : value.toFixed(1)
      : value;

  return (
    <div
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={(e) => {
        if (onClick && (e.key === 'Enter' || e.key === ' ')) {
          e.preventDefault();
          onClick();
        }
      }}
      className={`group relative rounded-xl border p-4 sm:p-5 transition-all duration-200 backdrop-blur-md ${
        onClick ? 'cursor-pointer hover:-translate-y-0.5' : ''
      } ${
        isSelected
          ? 'border-cyan-400/80 bg-slate-900/85 ring-2 ring-cyan-500/20 shadow-lg shadow-cyan-950/30'
          : 'border-slate-800/80 bg-slate-900/60 hover:border-slate-700 hover:bg-slate-900/75 shadow-sm'
      }`}
    >
      {/* Top Header */}
      <div className="flex items-center justify-between gap-2 mb-3">
        <div className="flex items-center gap-2">
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center border border-slate-700/50 bg-slate-800/60 text-slate-300 group-hover:text-cyan-300 transition-colors"
            style={{ color: accentColor }}
          >
            <Icon className="w-4 h-4" />
          </div>
          <span className="text-xs font-semibold tracking-wider uppercase text-slate-400">
            {title}
          </span>
        </div>

        {band && <AirQualityBadge band={band} size="sm" />}
      </div>

      {/* Main Metric Value */}
      <div className="flex items-baseline gap-1.5 my-1">
        <span className="text-3xl sm:text-4xl font-mono font-bold tracking-tight text-white tabular-nums">
          {displayVal}
        </span>
        <span className="text-sm font-mono text-slate-400 uppercase font-medium">
          {unit}
        </span>
      </div>

      {/* Subtitle / Location context */}
      {subtitle && (
        <p className="text-xs text-slate-400 truncate mt-1">
          {subtitle}
        </p>
      )}

      {/* Footer Info: Min / Max & Delta */}
      <div className="mt-3 pt-3 border-t border-slate-800/70 flex items-center justify-between text-xs font-mono text-slate-400">
        {minMax ? (
          <div className="flex items-center gap-2">
            <span className="text-slate-500">24H Range:</span>
            <span className="text-slate-300">
              {minMax.min} - {minMax.max} {unit}
            </span>
          </div>
        ) : (
          <span className="text-slate-500">Live Reading</span>
        )}

        {delta && (
          <div
            className={`flex items-center gap-1 ${
              delta.value > 0
                ? 'text-amber-400'
                : delta.value < 0
                ? 'text-emerald-400'
                : 'text-slate-400'
            }`}
          >
            <span>{delta.value > 0 ? '▲' : delta.value < 0 ? '▼' : '—'}</span>
            <span>
              {delta.value > 0 ? `+${delta.value}` : delta.value}
            </span>
          </div>
        )}
      </div>
    </div>
  );
};
