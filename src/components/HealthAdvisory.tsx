import React from 'react';
import { AirQualityBand, PM25Band, PollutantReadings, SingaporeRegion } from '../types/nea';
import { Heart, UserCheck, AlertCircle, Info, ShieldAlert } from 'lucide-react';

interface HealthAdvisoryProps {
  psiBand: AirQualityBand;
  pm25Band: PM25Band;
  readings?: PollutantReadings;
  region: SingaporeRegion;
}

export const HealthAdvisory: React.FC<HealthAdvisoryProps> = ({
  psiBand,
  pm25Band,
  readings,
  region,
}) => {
  const isElevated = psiBand.level !== 'Good' || pm25Band.level !== 'Normal';

  return (
    <div className="space-y-4">
      {/* NEA Official Health Advisory Box */}
      <div
        className={`rounded-xl border p-4 sm:p-5 backdrop-blur-md transition-colors ${
          isElevated
            ? `${psiBand.bgClass} ${psiBand.borderClass}`
            : 'bg-slate-900/60 border-slate-800/80'
        }`}
      >
        <div className="flex items-center gap-2 mb-3">
          {isElevated ? (
            <ShieldAlert className="w-4 h-4 text-amber-400" />
          ) : (
            <UserCheck className="w-4 h-4 text-emerald-400" />
          )}
          <h3 className="text-sm font-semibold text-white tracking-tight">
            Official NEA Health Advisory
          </h3>
          <span className="text-xs font-mono text-slate-400 ml-auto">
            Current Band: <strong className={psiBand.textClass}>{psiBand.level}</strong>
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
          {/* Healthy population */}
          <div className="p-3 rounded-lg bg-slate-950/40 border border-slate-800/60 space-y-1">
            <div className="flex items-center gap-1.5 font-semibold text-slate-200">
              <UserCheck className="w-3.5 h-3.5 text-cyan-400" />
              <span>Healthy Persons & General Public</span>
            </div>
            <p className="text-slate-400 leading-relaxed font-sans">
              {psiBand.generalAdvisory}
            </p>
          </div>

          {/* Vulnerable groups */}
          <div className="p-3 rounded-lg bg-slate-950/40 border border-slate-800/60 space-y-1">
            <div className="flex items-center gap-1.5 font-semibold text-amber-300">
              <Heart className="w-3.5 h-3.5 text-rose-400" />
              <span>Elderly, Pregnant, Children & Chronic Illness</span>
            </div>
            <p className="text-slate-400 leading-relaxed font-sans">
              {psiBand.vulnerableAdvisory}
            </p>
          </div>
        </div>
      </div>

      {/* Sub-Pollutants Matrix Table */}
      {readings && (
        <div className="rounded-xl border border-slate-800/80 bg-slate-900/70 backdrop-blur-md p-4 sm:p-5 shadow-lg">
          <div className="flex items-center justify-between gap-2 mb-3">
            <div className="flex items-center gap-2">
              <Info className="w-4 h-4 text-cyan-400" />
              <h3 className="text-sm font-semibold text-white tracking-tight">
                National Air Quality Pollutant Breakdown
              </h3>
            </div>
            <span className="text-[11px] font-mono text-slate-400">
              Region: <strong className="capitalize text-slate-200">{region}</strong>
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 text-xs font-mono">
            {/* PM 2.5 1-Hr */}
            <div className="p-2.5 rounded-lg bg-slate-950/50 border border-slate-800/70">
              <span className="text-slate-500 block text-[10px]">PM 2.5 (1-HR)</span>
              <div className="flex items-baseline gap-1 mt-1">
                <span className="text-base font-bold text-white tabular-nums">
                  {readings.pm25_one_hourly?.[region] ?? '--'}
                </span>
                <span className="text-[10px] text-slate-400">µg/m³</span>
              </div>
            </div>

            {/* PM 2.5 24-Hr */}
            <div className="p-2.5 rounded-lg bg-slate-950/50 border border-slate-800/70">
              <span className="text-slate-500 block text-[10px]">PM 2.5 (24-HR)</span>
              <div className="flex items-baseline gap-1 mt-1">
                <span className="text-base font-bold text-white tabular-nums">
                  {readings.pm25_twenty_four_hourly?.[region] ?? '--'}
                </span>
                <span className="text-[10px] text-slate-400">µg/m³</span>
              </div>
            </div>

            {/* PM 10 24-Hr */}
            <div className="p-2.5 rounded-lg bg-slate-950/50 border border-slate-800/70">
              <span className="text-slate-500 block text-[10px]">PM 10 (24-HR)</span>
              <div className="flex items-baseline gap-1 mt-1">
                <span className="text-base font-bold text-white tabular-nums">
                  {readings.pm10_twenty_four_hourly?.[region] ?? '--'}
                </span>
                <span className="text-[10px] text-slate-400">µg/m³</span>
              </div>
            </div>

            {/* Ozone O3 8-Hr */}
            <div className="p-2.5 rounded-lg bg-slate-950/50 border border-slate-800/70">
              <span className="text-slate-500 block text-[10px]">O3 (8-HR MAX)</span>
              <div className="flex items-baseline gap-1 mt-1">
                <span className="text-base font-bold text-white tabular-nums">
                  {readings.o3_eight_hour_max?.[region] ?? '--'}
                </span>
                <span className="text-[10px] text-slate-400">µg/m³</span>
              </div>
            </div>

            {/* Nitrogen Dioxide NO2 1-Hr */}
            <div className="p-2.5 rounded-lg bg-slate-950/50 border border-slate-800/70">
              <span className="text-slate-500 block text-[10px]">NO2 (1-HR MAX)</span>
              <div className="flex items-baseline gap-1 mt-1">
                <span className="text-base font-bold text-white tabular-nums">
                  {readings.no2_one_hour_max?.[region] ?? '--'}
                </span>
                <span className="text-[10px] text-slate-400">µg/m³</span>
              </div>
            </div>

            {/* Sulphur Dioxide SO2 24-Hr */}
            <div className="p-2.5 rounded-lg bg-slate-950/50 border border-slate-800/70">
              <span className="text-slate-500 block text-[10px]">SO2 (24-HR)</span>
              <div className="flex items-baseline gap-1 mt-1">
                <span className="text-base font-bold text-white tabular-nums">
                  {readings.so2_twenty_four_hourly?.[region] ?? '--'}
                </span>
                <span className="text-[10px] text-slate-400">µg/m³</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
