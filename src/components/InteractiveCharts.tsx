import React, { useState, useMemo } from 'react';
import { SingaporeRegion, TimeSeriesItem, StationTimeSeriesItem } from '../types/nea';
import { getPsiBand, getPm25Band } from '../utils/airQuality';
import { AirQualityBadge } from './AirQualityBadge';
import { TrendingUp, BarChart2, Activity, Clock } from 'lucide-react';

interface InteractiveChartsProps {
  selectedRegion: SingaporeRegion;
  psiItems: TimeSeriesItem[];
  pm25Items: TimeSeriesItem[];
  tempItems: StationTimeSeriesItem[];
  humidityItems: StationTimeSeriesItem[];
  selectedStationId?: string;
  stationName?: string;
}

export type ChartMetric = 'psi' | 'pm25' | 'temperature' | 'humidity';

export const InteractiveCharts: React.FC<InteractiveChartsProps> = ({
  selectedRegion,
  psiItems,
  pm25Items,
  tempItems,
  humidityItems,
  selectedStationId,
  stationName,
}) => {
  const [metric, setMetric] = useState<ChartMetric>('psi');
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const [showAllRegions, setShowAllRegions] = useState(false);

  // Normalize chronological items (NEA returns latest first or oldest first, sort by timestamp ascending)
  const chartData = useMemo(() => {
    if (metric === 'psi') {
      const sorted = [...psiItems].sort(
        (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
      );
      return sorted.map((item) => {
        const time = new Date(item.timestamp);
        const hourStr = time.toLocaleTimeString('en-SG', { hour: '2-digit', minute: '2-digit', hour12: false });
        const val = item.readings?.psi_twenty_four_hourly?.[selectedRegion] ??
          item.readings?.psi_twenty_four_hourly?.national ??
          0;
        return {
          timestamp: item.timestamp,
          label: hourStr,
          value: Number(val),
          allRegions: item.readings?.psi_twenty_four_hourly || {},
        };
      });
    }

    if (metric === 'pm25') {
      const sorted = [...pm25Items].sort(
        (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
      );
      return sorted.map((item) => {
        const time = new Date(item.timestamp);
        const hourStr = time.toLocaleTimeString('en-SG', { hour: '2-digit', minute: '2-digit', hour12: false });
        const val = item.readings?.pm25_one_hourly?.[selectedRegion] ??
          item.readings?.pm25_one_hourly?.national ??
          0;
        return {
          timestamp: item.timestamp,
          label: hourStr,
          value: Number(val),
          allRegions: item.readings?.pm25_one_hourly || {},
        };
      });
    }

    if (metric === 'temperature') {
      const sorted = [...tempItems].sort(
        (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
      );
      return sorted.map((item) => {
        const time = new Date(item.timestamp);
        const hourStr = time.toLocaleTimeString('en-SG', { hour: '2-digit', minute: '2-digit', hour12: false });
        // Find selected station or average across all stations
        let val = 0;
        if (selectedStationId) {
          const match = item.data.find((d) => d.stationId === selectedStationId);
          if (match) val = match.value;
        }
        if (!val && item.data.length > 0) {
          // Average
          const sum = item.data.reduce((acc, curr) => acc + curr.value, 0);
          val = Math.round((sum / item.data.length) * 10) / 10;
        }
        return {
          timestamp: item.timestamp,
          label: hourStr,
          value: val,
          allRegions: {} as Record<string, number>,
        };
      });
    }

    if (metric === 'humidity') {
      const sorted = [...humidityItems].sort(
        (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
      );
      return sorted.map((item) => {
        const time = new Date(item.timestamp);
        const hourStr = time.toLocaleTimeString('en-SG', { hour: '2-digit', minute: '2-digit', hour12: false });
        let val = 0;
        if (selectedStationId) {
          const match = item.data.find((d) => d.stationId === selectedStationId);
          if (match) val = match.value;
        }
        if (!val && item.data.length > 0) {
          const sum = item.data.reduce((acc, curr) => acc + curr.value, 0);
          val = Math.round((sum / item.data.length) * 10) / 10;
        }
        return {
          timestamp: item.timestamp,
          label: hourStr,
          value: val,
          allRegions: {} as Record<string, number>,
        };
      });
    }

    return [];
  }, [metric, selectedRegion, psiItems, pm25Items, tempItems, humidityItems, selectedStationId]);

  // Statistics
  const values = chartData.map((d) => d.value).filter((v) => !isNaN(v) && v > 0);
  const minVal = values.length ? Math.min(...values) : 0;
  const maxVal = values.length ? Math.max(...values) : 100;
  const avgVal = values.length
    ? Math.round((values.reduce((a, b) => a + b, 0) / values.length) * 10) / 10
    : 0;

  // Chart configuration
  const metricConfigs: Record<
    ChartMetric,
    {
      label: string;
      unit: string;
      color: string;
      fillGradId: string;
      colorClass: string;
      thresholds?: { value: number; label: string; color: string }[];
    }
  > = {
    psi: {
      label: '24-hr PSI Trend',
      unit: 'PSI',
      color: '#38bdf8',
      fillGradId: 'psiFill',
      colorClass: 'text-sky-400',
      thresholds: [
        { value: 50, label: 'Good (50)', color: '#10b981' },
        { value: 100, label: 'Moderate (100)', color: '#0284c7' },
        { value: 200, label: 'Unhealthy (200)', color: '#f59e0b' },
      ],
    },
    pm25: {
      label: '1-hr PM 2.5 Concentration',
      unit: 'µg/m³',
      color: '#f59e0b',
      fillGradId: 'pm25Fill',
      colorClass: 'text-amber-400',
      thresholds: [
        { value: 55, label: 'Normal (55)', color: '#10b981' },
        { value: 150, label: 'Elevated (150)', color: '#f59e0b' },
      ],
    },
    temperature: {
      label: 'Ambient Air Temperature',
      unit: '°C',
      color: '#f97316',
      fillGradId: 'tempFill',
      colorClass: 'text-orange-400',
    },
    humidity: {
      label: 'Relative Humidity',
      unit: '%',
      color: '#06b6d4',
      fillGradId: 'humFill',
      colorClass: 'text-cyan-400',
    },
  };

  const currentConfig = metricConfigs[metric];

  // SVG Geometry Dimensions
  const svgWidth = 800;
  const svgHeight = 280;
  const padding = { top: 25, right: 30, bottom: 45, left: 55 };
  const graphWidth = svgWidth - padding.left - padding.right;
  const graphHeight = svgHeight - padding.top - padding.bottom;

  // Y-axis bounds
  const yMin = metric === 'temperature' ? Math.max(20, Math.floor(minVal - 2)) : 0;
  const yMax =
    metric === 'humidity'
      ? 100
      : metric === 'temperature'
      ? Math.ceil(maxVal + 2)
      : Math.max(maxVal * 1.2, metric === 'psi' ? 120 : 80);

  // Point Coordinate Calculators
  const getX = (index: number) => {
    if (chartData.length <= 1) return padding.left + graphWidth / 2;
    return padding.left + (index / (chartData.length - 1)) * graphWidth;
  };

  const getY = (val: number) => {
    if (yMax === yMin) return padding.top + graphHeight / 2;
    const clamped = Math.max(yMin, Math.min(yMax, val));
    return padding.top + graphHeight - ((clamped - yMin) / (yMax - yMin)) * graphHeight;
  };

  // Build SVG Path
  const points = chartData.map((d, i) => `${getX(i)},${getY(d.value)}`);
  const pathD = points.length ? `M ${points.join(' L ')}` : '';
  const areaD = points.length
    ? `M ${getX(0)},${padding.top + graphHeight} L ${points.join(' L ')} L ${getX(
        points.length - 1
      )},${padding.top + graphHeight} Z`
    : '';

  // Regions line for comparison if showAllRegions is active
  const regionsList: SingaporeRegion[] = ['central', 'north', 'south', 'east', 'west'];
  const regionColors: Record<SingaporeRegion, string> = {
    central: '#38bdf8',
    north: '#a855f7',
    south: '#10b981',
    east: '#f59e0b',
    west: '#ec4899',
    national: '#94a3b8',
  };

  // Active hover data point
  const activePoint =
    hoveredIndex !== null && chartData[hoveredIndex]
      ? chartData[hoveredIndex]
      : chartData[chartData.length - 1] || null;

  return (
    <div className="rounded-xl border border-slate-800/80 bg-slate-900/70 backdrop-blur-md p-4 sm:p-6 shadow-xl">
      {/* Top Header & Metric Selector Tabs */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-slate-800/70">
        <div>
          <div className="flex items-center gap-2">
            <Activity className="w-4 h-4 text-cyan-400" />
            <h3 className="text-base font-semibold text-white tracking-tight">
              24-Hour Diurnal Trend Analysis
            </h3>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Hourly recorded telemetry for{' '}
            <span className="font-semibold text-slate-200 capitalize">
              {metric === 'temperature' || metric === 'humidity'
                ? stationName || 'Singapore Average'
                : `${selectedRegion} Region`}
            </span>
          </p>
        </div>

        {/* Metric Selector Tabs */}
        <div className="flex items-center gap-1 p-1 bg-slate-950/80 border border-slate-800 rounded-lg overflow-x-auto max-w-full">
          {(
            [
              { id: 'psi', label: 'PSI' },
              { id: 'pm25', label: 'PM 2.5' },
              { id: 'temperature', label: 'Temp (°C)' },
              { id: 'humidity', label: 'Humidity (%)' },
            ] as const
          ).map((t) => (
            <button
              key={t.id}
              onClick={() => {
                setMetric(t.id);
                setHoveredIndex(null);
              }}
              className={`px-3 py-1.5 text-xs font-mono font-medium rounded-md whitespace-nowrap transition-colors ${
                metric === t.id
                  ? 'bg-slate-800 text-cyan-300 shadow-sm border border-slate-700/80'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* Quick Stats Ribbon */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 py-4 text-xs font-mono">
        <div className="p-2.5 rounded-lg bg-slate-950/40 border border-slate-800/60">
          <span className="text-slate-500 block text-[11px]">LATEST VALUE</span>
          <div className="flex items-baseline gap-1 mt-0.5">
            <span className="text-lg font-bold text-white tabular-nums">
              {activePoint ? activePoint.value : '--'}
            </span>
            <span className="text-slate-400">{currentConfig.unit}</span>
          </div>
        </div>

        <div className="p-2.5 rounded-lg bg-slate-950/40 border border-slate-800/60">
          <span className="text-slate-500 block text-[11px]">24H MINIMUM</span>
          <div className="flex items-baseline gap-1 mt-0.5">
            <span className="text-lg font-bold text-emerald-400 tabular-nums">
              {minVal}
            </span>
            <span className="text-slate-400">{currentConfig.unit}</span>
          </div>
        </div>

        <div className="p-2.5 rounded-lg bg-slate-950/40 border border-slate-800/60">
          <span className="text-slate-500 block text-[11px]">24H MAXIMUM</span>
          <div className="flex items-baseline gap-1 mt-0.5">
            <span className="text-lg font-bold text-amber-400 tabular-nums">
              {maxVal}
            </span>
            <span className="text-slate-400">{currentConfig.unit}</span>
          </div>
        </div>

        <div className="p-2.5 rounded-lg bg-slate-950/40 border border-slate-800/60">
          <span className="text-slate-500 block text-[11px]">24H AVERAGE</span>
          <div className="flex items-baseline gap-1 mt-0.5">
            <span className="text-lg font-bold text-slate-300 tabular-nums">
              {avgVal}
            </span>
            <span className="text-slate-400">{currentConfig.unit}</span>
          </div>
        </div>
      </div>

      {/* SVG Chart Area */}
      <div className="relative w-full overflow-hidden mt-1 bg-slate-950/40 rounded-lg border border-slate-800/50 p-2">
        {chartData.length === 0 ? (
          <div className="h-64 flex items-center justify-center text-slate-500 text-sm font-mono">
            Loading real-time readings...
          </div>
        ) : (
          <svg
            viewBox={`0 0 ${svgWidth} ${svgHeight}`}
            className="w-full h-auto select-none"
            onMouseLeave={() => setHoveredIndex(null)}
            onTouchEnd={() => setHoveredIndex(null)}
          >
            <defs>
              <linearGradient id="psiFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.35" />
                <stop offset="100%" stopColor="#38bdf8" stopOpacity="0.0" />
              </linearGradient>
              <linearGradient id="pm25Fill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#f59e0b" stopOpacity="0.35" />
                <stop offset="100%" stopColor="#f59e0b" stopOpacity="0.0" />
              </linearGradient>
              <linearGradient id="tempFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#f97316" stopOpacity="0.35" />
                <stop offset="100%" stopColor="#f97316" stopOpacity="0.0" />
              </linearGradient>
              <linearGradient id="humFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#06b6d4" stopOpacity="0.35" />
                <stop offset="100%" stopColor="#06b6d4" stopOpacity="0.0" />
              </linearGradient>
            </defs>

            {/* Horizontal Grid lines and Y-axis Labels */}
            {[0, 0.25, 0.5, 0.75, 1].map((pct, i) => {
              const yVal = Math.round(yMin + (yMax - yMin) * (1 - pct));
              const yPos = padding.top + graphHeight * pct;
              return (
                <g key={i}>
                  <line
                    x1={padding.left}
                    y1={yPos}
                    x2={padding.left + graphWidth}
                    y2={yPos}
                    stroke="#1e293b"
                    strokeDasharray={pct === 1 ? undefined : '3 3'}
                    strokeWidth="1"
                  />
                  <text
                    x={padding.left - 10}
                    y={yPos + 4}
                    fill="#64748b"
                    fontSize="11"
                    fontFamily="monospace"
                    textAnchor="end"
                  >
                    {yVal}
                  </text>
                </g>
              );
            })}

            {/* Threshold Reference Lines */}
            {currentConfig.thresholds?.map((thresh) => {
              if (thresh.value < yMin || thresh.value > yMax) return null;
              const y = getY(thresh.value);
              return (
                <g key={thresh.value}>
                  <line
                    x1={padding.left}
                    y1={y}
                    x2={padding.left + graphWidth}
                    y2={y}
                    stroke={thresh.color}
                    strokeWidth="1"
                    strokeDasharray="4 4"
                    strokeOpacity="0.6"
                  />
                  <text
                    x={padding.left + graphWidth}
                    y={y - 4}
                    fill={thresh.color}
                    fontSize="9"
                    fontFamily="monospace"
                    textAnchor="end"
                    opacity="0.8"
                  >
                    {thresh.label}
                  </text>
                </g>
              );
            })}

            {/* All Regions comparison lines if active */}
            {showAllRegions &&
              (metric === 'psi' || metric === 'pm25') &&
              regionsList.map((reg) => {
                const regPoints = chartData.map((d, i) => {
                  const regVal = d.allRegions?.[reg] || 0;
                  return `${getX(i)},${getY(regVal)}`;
                });
                return (
                  <path
                    key={reg}
                    d={`M ${regPoints.join(' L ')}`}
                    fill="none"
                    stroke={regionColors[reg]}
                    strokeWidth="1.2"
                    strokeOpacity={reg === selectedRegion ? 1 : 0.4}
                  />
                );
              })}

            {/* Main Area Fill */}
            {areaD && <path d={areaD} fill={`url(#${currentConfig.fillGradId})`} />}

            {/* Main Data Line */}
            {pathD && (
              <path
                d={pathD}
                fill="none"
                stroke={currentConfig.color}
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            )}

            {/* Data Point Circles */}
            {chartData.map((d, i) => (
              <circle
                key={i}
                cx={getX(i)}
                cy={getY(d.value)}
                r={hoveredIndex === i ? 5 : 2.5}
                fill={hoveredIndex === i ? '#ffffff' : currentConfig.color}
                stroke={currentConfig.color}
                strokeWidth={hoveredIndex === i ? 2 : 1}
                className="transition-all duration-150"
              />
            ))}

            {/* X-axis Labels (Time) */}
            {chartData.map((d, i) => {
              // Display every ~3-4th point to avoid crowding on mobile
              const step = Math.max(1, Math.floor(chartData.length / 6));
              const isKeyPoint = i % step === 0 || i === chartData.length - 1;
              if (!isKeyPoint) return null;

              return (
                <text
                  key={i}
                  x={getX(i)}
                  y={padding.top + graphHeight + 22}
                  fill="#64748b"
                  fontSize="11"
                  fontFamily="monospace"
                  textAnchor="middle"
                >
                  {d.label}
                </text>
              );
            })}

            {/* Interactive Vertical Crosshair Bar */}
            {hoveredIndex !== null && (
              <line
                x1={getX(hoveredIndex)}
                y1={padding.top}
                x2={getX(hoveredIndex)}
                y2={padding.top + graphHeight}
                stroke="#94a3b8"
                strokeWidth="1.5"
                strokeDasharray="3 3"
              />
            )}

            {/* Transparent Touch / Mouse Scrub Area */}
            {chartData.map((_, i) => {
              const xStart = i === 0 ? padding.left : (getX(i - 1) + getX(i)) / 2;
              const xEnd =
                i === chartData.length - 1
                  ? padding.left + graphWidth
                  : (getX(i) + getX(i + 1)) / 2;
              return (
                <rect
                  key={i}
                  x={xStart}
                  y={padding.top}
                  width={Math.max(10, xEnd - xStart)}
                  height={graphHeight}
                  fill="transparent"
                  className="cursor-crosshair"
                  onMouseEnter={() => setHoveredIndex(i)}
                  onTouchStart={() => setHoveredIndex(i)}
                  onTouchMove={() => setHoveredIndex(i)}
                />
              );
            })}
          </svg>
        )}

        {/* Hover Tooltip Card Overlay */}
        {activePoint && hoveredIndex !== null && (
          <div
            className="absolute top-4 right-4 bg-slate-900/95 border border-slate-700 p-2.5 rounded-lg shadow-xl backdrop-blur-md text-xs font-mono pointer-events-none transition-all duration-150"
          >
            <div className="flex items-center gap-1.5 text-slate-400 mb-1">
              <Clock className="w-3.5 h-3.5" />
              <span>{activePoint.label}</span>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-xl font-bold text-white tabular-nums">
                {activePoint.value}
              </span>
              <span className="text-slate-400">{currentConfig.unit}</span>
            </div>
            {metric === 'psi' && (
              <div className="mt-1">
                <AirQualityBadge band={getPsiBand(activePoint.value)} size="sm" />
              </div>
            )}
            {metric === 'pm25' && (
              <div className="mt-1">
                <AirQualityBadge band={getPm25Band(activePoint.value)} size="sm" />
              </div>
            )}
          </div>
        )}
      </div>

      {/* Region Comparison Switcher (for PSI / PM2.5) */}
      {(metric === 'psi' || metric === 'pm25') && (
        <div className="mt-3 pt-3 border-t border-slate-800/60 flex flex-wrap items-center justify-between gap-3 text-xs">
          <button
            onClick={() => setShowAllRegions(!showAllRegions)}
            className={`px-3 py-1.5 rounded-md font-mono transition-colors flex items-center gap-1.5 ${
              showAllRegions
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                : 'bg-slate-800/80 text-slate-400 hover:text-slate-200 border border-slate-700'
            }`}
          >
            <BarChart2 className="w-3.5 h-3.5" />
            <span>{showAllRegions ? 'Hide Multi-Region Lines' : 'Overlay All 5 Regions'}</span>
          </button>

          {showAllRegions && (
            <div className="flex flex-wrap items-center gap-3 font-mono text-[11px]">
              {regionsList.map((r) => (
                <div key={r} className="flex items-center gap-1.5">
                  <span
                    className="w-2.5 h-2.5 rounded-full"
                    style={{ backgroundColor: regionColors[r] }}
                  />
                  <span className="capitalize text-slate-300">{r}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
