import React from 'react';
import { CloudFog, Sun, Moon, Sparkles, Sliders, CloudRain } from 'lucide-react';

interface AtmosphereControlsProps {
  weatherMode: 'live' | 'clear' | 'hazy' | 'humid' | 'rainy';
  onWeatherModeChange: (mode: 'live' | 'clear' | 'hazy' | 'humid' | 'rainy') => void;
  timeOfDay: 'day' | 'golden' | 'night' | 'auto';
  onTimeOfDayChange: (time: 'day' | 'golden' | 'night' | 'auto') => void;
  hazeIntensity: number;
  onHazeIntensityChange: (intensity: number) => void;
  autoHazeIntensity: number;
  hazeCategory: string;
}

export const AtmosphereControls: React.FC<AtmosphereControlsProps> = ({
  weatherMode,
  onWeatherModeChange,
  timeOfDay,
  onTimeOfDayChange,
  hazeIntensity,
  onHazeIntensityChange,
  autoHazeIntensity,
  hazeCategory,
}) => {
  const [isOpen, setIsOpen] = React.useState(false);

  return (
    <div className="rounded-xl border border-slate-800/80 bg-slate-900/70 backdrop-blur-md p-4 shadow-lg">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
            <CloudFog className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-xs font-semibold text-white tracking-tight flex items-center gap-1.5">
              <span>Skyline & Weather Atmospheric Effects</span>
              <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-slate-800 text-slate-300">
                {weatherMode === 'live' ? `Live: ${hazeCategory}` : `Simulation: ${weatherMode}`}
              </span>
            </h4>
            <p className="text-[11px] text-slate-400">
              Silhouette adapts dynamically to Singapore air quality & haze conditions
            </p>
          </div>
        </div>

        <button
          onClick={() => setIsOpen(!isOpen)}
          className="px-2.5 py-1 text-xs font-mono text-cyan-300 bg-slate-800/80 hover:bg-slate-800 border border-slate-700 rounded-md transition-colors flex items-center gap-1"
        >
          <Sliders className="w-3 h-3" />
          <span>{isOpen ? 'Collapse' : 'Customize'}</span>
        </button>
      </div>

      {/* Expanded Controls Drawer */}
      {isOpen && (
        <div className="mt-4 pt-3 border-t border-slate-800/70 space-y-4 text-xs font-mono">
          {/* Weather Effect Mode */}
          <div>
            <label className="text-[11px] uppercase tracking-wider text-slate-400 block mb-1.5">
              Atmospheric Weather Simulation
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-1.5">
              {(
                [
                  { id: 'live', label: 'Live NEA', icon: Sparkles },
                  { id: 'clear', label: 'Clear Sky', icon: Sun },
                  { id: 'hazy', label: 'Dense Haze', icon: CloudFog },
                  { id: 'humid', label: 'Humid Mist', icon: CloudFog },
                  { id: 'rainy', label: 'Rainstorm', icon: CloudRain },
                ] as const
              ).map((mode) => {
                const Icon = mode.icon;
                const active = weatherMode === mode.id;
                return (
                  <button
                    key={mode.id}
                    onClick={() => onWeatherModeChange(mode.id)}
                    className={`flex items-center justify-center gap-1.5 px-2.5 py-1.5 rounded-lg border transition-all ${
                      active
                        ? 'bg-amber-500/20 text-amber-200 border-amber-500/60 font-semibold'
                        : 'bg-slate-950/60 text-slate-400 border-slate-800 hover:text-slate-200'
                    }`}
                  >
                    <Icon className="w-3 h-3" />
                    <span>{mode.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Time of Day Lighting */}
          <div>
            <label className="text-[11px] uppercase tracking-wider text-slate-400 block mb-1.5">
              Skyline Lighting (Singapore Time)
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
              {(
                [
                  { id: 'auto', label: 'Auto (UTC+8)', icon: Sparkles },
                  { id: 'day', label: 'Daylight', icon: Sun },
                  { id: 'golden', label: 'Sunset Glow', icon: Sun },
                  { id: 'night', label: 'Marina Night', icon: Moon },
                ] as const
              ).map((t) => {
                const Icon = t.icon;
                const active = timeOfDay === t.id;
                return (
                  <button
                    key={t.id}
                    onClick={() => onTimeOfDayChange(t.id)}
                    className={`flex items-center justify-center gap-1.5 px-2.5 py-1.5 rounded-lg border transition-all ${
                      active
                        ? 'bg-cyan-500/20 text-cyan-200 border-cyan-500/60 font-semibold'
                        : 'bg-slate-950/60 text-slate-400 border-slate-800 hover:text-slate-200'
                    }`}
                  >
                    <Icon className="w-3 h-3" />
                    <span>{t.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Interactive Haze Slider */}
          <div>
            <div className="flex items-center justify-between text-[11px] text-slate-400 mb-1">
              <span>Haze Fog Density</span>
              <span className="text-cyan-300 tabular-nums">
                {Math.round(hazeIntensity * 100)}% ({hazeCategory})
              </span>
            </div>
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={hazeIntensity}
              onChange={(e) => onHazeIntensityChange(parseFloat(e.target.value))}
              className="w-full accent-amber-500 cursor-pointer h-1.5 bg-slate-800 rounded-lg"
            />
            <div className="flex justify-between text-[10px] text-slate-500 mt-1">
              <span>0% Crystal Clear</span>
              <span>50% Moderate Particulate</span>
              <span>100% Severe Transboundary Smog</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
